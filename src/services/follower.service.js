const { User } = require("../db/models");

const userSummaryAttributes = ["id", "nickname", "name", "lastName", "profilePicture"];

const findUser = (id) => User.findByPk(id);

const getFollowers = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: User,
        as: "followers",
        attributes: userSummaryAttributes,
        through: { attributes: [] },
      },
    ],
  });

  if (!user) return null;
  return user.followers;
};

const getFollowing = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: User,
        as: "following",
        attributes: userSummaryAttributes,
        through: { attributes: [] },
      },
    ],
  });

  if (!user) return null;
  return user.following;
};

const follow = async (followingId, followerId) => {
  if (Number(followingId) === Number(followerId)) {
    return { selfFollow: true };
  }

  const [following, follower] = await Promise.all([
    findUser(followingId),
    findUser(followerId),
  ]);

  if (!following || !follower) return null;

  await following.addFollower(follower);
  return { following, follower };
};

const unfollow = async (followingId, followerId) => {
  const [following, follower] = await Promise.all([
    findUser(followingId),
    findUser(followerId),
  ]);

  if (!following || !follower) return null;

  await following.removeFollower(follower);
  return true;
};

module.exports = {
  getFollowers,
  getFollowing,
  follow,
  unfollow,
};
