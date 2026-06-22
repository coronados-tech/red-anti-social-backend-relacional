const HTTP = require("../../config/HttpCode");
const { User } = require("../../db/models");

const alreadyFollowingMiddleware = async (req, res, next) => {
    const followingId = req.params.id;
    const followerId = req.user.id;

    const following = await User.findByPk(followingId);
    const alreadyFollowing = await following.hasFollower(followerId);

    if (alreadyFollowing) {
        return res.status(HTTP.CONFLICT).json({
            message: res.__("already_following"),
        });
    }

    next();
};

module.exports = alreadyFollowingMiddleware;
