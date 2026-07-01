const { Post, User, PostImage, Comment, Tag, Like, sequelize } = require("../db/models");
const { Op } = require("sequelize");
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

const enrichPostsWithLikes = async (posts, viewer_id) => {
  if (!posts.length) return posts;

  const postIds = posts.map((post) => post.id);
  const counts = await Like.findAll({
    attributes: [
      "post_id",
      [sequelize.fn("COUNT", sequelize.col("user_id")), "likeCount"],
    ],
    where: { post_id: { [Op.in]: postIds } },
    group: ["post_id"],
    raw: true,
  });

  const countMap = Object.fromEntries(
    counts.map((entry) => [entry.post_id, Number(entry.likeCount)]),
  );

  let viewerLikeSet = new Set();
  if (viewer_id !== undefined) {
    const viewerLikes = await Like.findAll({
      where: { post_id: { [Op.in]: postIds }, user_id: viewer_id },
      attributes: ["post_id"],
      raw: true,
    });
    viewerLikeSet = new Set(viewerLikes.map((entry) => entry.post_id));
  }

  return posts.map((post) => ({
    ...post,
    likeCount: countMap[post.id] ?? 0,
    likedByViewer:
      viewer_id !== undefined ? viewerLikeSet.has(post.id) : false,
  }));
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

  const [total, rows] = await Promise.all([
    Post.count({ where }),
    Post.findAll({
      where,
      include: postIncludes,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    }),
  ]);

  const items = await enrichPostsWithLikes(rows.map(serializePost), viewer_id);

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
    return enrichPostsWithLikes(posts, viewer_id);
  }

  return enrichPostsWithLikes(posts, viewer_id);
};

const findById = async (id, viewer_id) => {
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

  const [enrichedPost] = await enrichPostsWithLikes([post], viewer_id);
  return enrichedPost;
};

const findBySlug = async (slug, viewer_id) => {
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

  const [enrichedPost] = await enrichPostsWithLikes([post], viewer_id);
  return enrichedPost;
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
