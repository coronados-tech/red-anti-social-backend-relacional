const { Post, User, PostImage, Comment, Tag } = require("../db/models");
const { removeAllByPostId } = require("./postimage.service");
const postCache = require("./postCache.service");
const { canViewFullProfile } = require("./user.service");
const { buildSlug, ensureUniqueSlug } = require("../helpers/slugHelper");

const postIncludes = [
  {
    model: User,
    as: "user",
    attributes: ["id", "nickname", "name", "lastName", "profilePicture", "isProfilePublic"],
  },
  {
    model: PostImage,
    as: "postImages",
    separate: true,
    order: [["id", "ASC"]],
  },
  { model: Tag, as: "tags", attributes: ["id", "name"] },
  {
    model: Comment,
    as: "comments",
    attributes: ["id", "content", "createdAt", "user_id"],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "nickname", "name", "lastName", "profilePicture"],
      },
    ],
  },
];

const serializePost = (post) => {
  const json = post.toJSON();

  if (post.comments?.length) {
    json.comments = post.comments.map((comment) => ({
      ...comment.toJSON(),
      monthsOld: comment.monthsOld,
    }));
  }

  return json;
};

const listCacheKey = (user_id) =>
  user_id !== undefined ? `posts:user:${user_id}` : "posts:all";

const canViewPostById = async (postId) => {
  const post = await Post.findByPk(postId);

  if (!post) return { notFound: true };

  return { allowed: true };
};

const resolveTags = async (tagNames = []) => {
  const tagInstances = [];

  for (const tagName of tagNames) {
    const normalized = tagName.trim().toLowerCase();

    const [tag] = await Tag.findOrCreate({
      where: { name: normalized },
    });

    tagInstances.push(tag);
  }

  return tagInstances;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const paginationDelayMs = Math.max(
  0,
  Number(process.env.POSTS_PAGINATION_DELAY_MS ?? 1500),
);

const waitForPaginationDelay = () =>
  paginationDelayMs > 0
    ? new Promise((resolve) => setTimeout(resolve, paginationDelayMs))
    : Promise.resolve();

const findPaginated = async ({
  user_id,
  viewer_id,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
} = {}) => {
  if (user_id !== undefined) {
    const owner = await User.findByPk(user_id);
    if (!(await canViewFullProfile(owner, viewer_id))) {
      return { forbidden: true };
    }
  }

  const where = user_id !== undefined ? { user_id } : {};
  const offset = (page - 1) * limit;

  const [[total, rows]] = await Promise.all([
    Promise.all([
      Post.count({ where }),
      Post.findAll({
        where,
        include: postIncludes,
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      }),
    ]),
    waitForPaginationDelay(),
  ]);

  const items = rows.map(serializePost);

  return {
    items,
    page,
    limit,
    total,
    hasMore: offset + items.length < total,
  };
};

const findAll = async ({ user_id, viewer_id } = {}) => {
  const cacheKey = listCacheKey(user_id);
  let posts = postCache.get(cacheKey);

  if (!posts) {
    const where = user_id !== undefined ? { user_id } : {};
    const dbPosts = await Post.findAll({
      where,
      include: postIncludes,
      order: [["createdAt", "DESC"]],
    });
    posts = dbPosts.map(serializePost);
    postCache.set(cacheKey, posts);
  }

  if (user_id !== undefined) {
    const owner = await User.findByPk(user_id);
    if (!(await canViewFullProfile(owner, viewer_id))) {
      return { forbidden: true };
    }
    return posts;
  }

  return posts;
};

const findById = async (id) => {
  const cacheKey = `post:${id}`;
  let post = postCache.get(cacheKey);

  if (!post) {
    const dbPost = await Post.findByPk(id, { include: postIncludes });
    if (!dbPost) return null;
    post = serializePost(dbPost);
    postCache.set(cacheKey, post);
    if (post.slug) {
      postCache.set(`post:slug:${post.slug}`, post);
    }
  }

  return post;
};

const findBySlug = async (slug) => {
  const cacheKey = `post:slug:${slug}`;
  let post = postCache.get(cacheKey);

  if (!post) {
    const dbPost = await Post.findOne({
      where: { slug },
      include: postIncludes,
    });
    if (!dbPost) return null;
    post = serializePost(dbPost);
    postCache.set(cacheKey, post);
    postCache.set(`post:${post.id}`, post);
  }

  return post;
};

const create = async ({ titulo, description, user_id, tags }) => {
  const baseSlug = buildSlug(titulo);
  const slug = await ensureUniqueSlug(Post, baseSlug);
  const post = await Post.create({ titulo, description, user_id, slug });
  if (tags && tags.length > 0) {
    const tagInstances = await resolveTags(tags);
    await post.setTags(tagInstances);
  }

  postCache.deleteAll();

  return findById(post.id);
};

const update = async (id, { titulo, description, tags }) => {
  const post = await Post.findByPk(id);
  if (!post) return null;
  if (titulo === undefined && description === undefined && tags === undefined) {
    return { empty: true };
  }

  const previousSlug = post.slug;
  const fieldsToUpdate = {};
  if (titulo !== undefined) {
    fieldsToUpdate.titulo = titulo;
    fieldsToUpdate.slug = await ensureUniqueSlug(Post, buildSlug(titulo), id);
  }
  if (description !== undefined) fieldsToUpdate.description = description;

  if (Object.keys(fieldsToUpdate).length > 0) {
    await post.update(fieldsToUpdate);
  }

  if (tags !== undefined) {
    const tagInstances = await resolveTags(tags);
    await post.setTags(tagInstances);
  }

  postCache.deletePost(id, previousSlug);

  return findById(id);
};

const remove = async (id) => {
  const post = await Post.findByPk(id);
  if (!post) return false;

  const { slug } = post;
  await removeAllByPostId(id);
  await post.destroy();
  postCache.deletePost(id, slug);
  return true;
};

module.exports = {
  findAll,
  findPaginated,
  findById,
  findBySlug,
  canViewPostById,
  create,
  update,
  remove,
};
