const { Like, Post } = require("../db/models");
const postCache = require("./postCache.service");

const getLikeState = async (postId) => {
  const likeCount = await Like.count({ where: { post_id: postId } });
  return { likeCount };
};

const like = async (postId, userId) => {
  const post = await Post.findByPk(postId);
  if (!post) return null;

  await Like.findOrCreate({
    where: { post_id: postId, user_id: userId },
  });

  postCache.deletePost(postId, post.slug);

  const { likeCount } = await getLikeState(postId);
  return { post_id: Number(postId), likeCount, likedByViewer: true };
};

const unlike = async (postId, userId) => {
  const post = await Post.findByPk(postId);
  if (!post) return null;

  await Like.destroy({ where: { post_id: postId, user_id: userId } });

  postCache.deletePost(postId, post.slug);

  const { likeCount } = await getLikeState(postId);
  return { post_id: Number(postId), likeCount, likedByViewer: false };
};

module.exports = {
  like,
  unlike,
};
