const HTTP = require("../../config/HttpCode");
const { Like } = require("../../db/models");

const alreadyLikedMiddleware = async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const existing = await Like.findOne({
    where: { post_id: postId, user_id: userId },
  });

  if (existing) {
    return res.status(HTTP.CONFLICT).json({
      message: res.__("already_liked"),
    });
  }

  next();
};

module.exports = alreadyLikedMiddleware;
