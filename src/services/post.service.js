const { Post, User, PostImage, Comment, Tag } = require("../db/models");
const { removeAllByPostId } = require("./postimage.service");
const postCache = require("./postCache.service");
const { canViewFullProfile } = require("./user.service");

const postIncludes = [
  {
    model: User,
    as: "user",
    attributes: ["id", "nickname", "name", "lastName", "profilePicture", "isProfilePublic"],
  },
  { model: PostImage, as: "postImages" },
  { model: Tag, as: "tags", attributes: ["id", "name"] },
  { model: Comment, as: "comments", attributes: ["id", "content"] },
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

const findAll = async ({ user_id, viewer_id } = {}) => {
  const cacheKey = listCacheKey(user_id);
  let posts = postCache.get(cacheKey);

  if (!posts) {
    const where = user_id !== undefined ? { user_id } : {};
    const dbPosts = await Post.findAll({ where, include: postIncludes });
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
  }

  return post;
};

const create = async ({ titulo, description, user_id, tags }) => {
  const post = await Post.create({ titulo, description, user_id });
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

  const fieldsToUpdate = {};
  if (titulo !== undefined) fieldsToUpdate.titulo = titulo;
  if (description !== undefined) fieldsToUpdate.description = description;

  if (Object.keys(fieldsToUpdate).length > 0) {
    await post.update(fieldsToUpdate);
  }

  if (tags !== undefined) {
    const tagInstances = await resolveTags(tags);
    await post.setTags(tagInstances);
  }

  postCache.deletePost(id);

  return findById(id);
};

const remove = async (id) => {
  const post = await Post.findByPk(id);
  if (!post) return false;

  await removeAllByPostId(id);
  await post.destroy();
  postCache.deletePost(id);
  return true;
};

module.exports = {
  findAll,
  findById,
  canViewPostById,
  create,
  update,
  remove,
};
