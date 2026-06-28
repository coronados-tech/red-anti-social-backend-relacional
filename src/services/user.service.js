const { Op } = require("sequelize");
const { User, sequelize } = require("../db/models");

const caseInsensitiveMatch = (column, value) =>
  sequelize.where(
    sequelize.fn("LOWER", sequelize.col(column)),
    value.trim().toLowerCase(),
  );

const findByNickname = (nickname, excludeUserId = null) => {
  const conditions = [caseInsensitiveMatch("nickname", nickname)];
  if (excludeUserId != null) {
    conditions.push({ id: { [Op.ne]: excludeUserId } });
  }
  return User.findOne({ where: { [Op.and]: conditions } });
};

const findByEmail = (email, excludeUserId = null) => {
  const conditions = [caseInsensitiveMatch("email", email)];
  if (excludeUserId != null) {
    conditions.push({ id: { [Op.ne]: excludeUserId } });
  }
  return User.findOne({ where: { [Op.and]: conditions } });
};

const findByIdentifier = (identifier) =>
  User.findOne({
    where: {
      [Op.or]: [
        caseInsensitiveMatch("nickname", identifier),
        caseInsensitiveMatch("email", identifier),
      ],
    },
  });

const canViewFullProfile = async (user, viewerId) => {
  if (!user) return false;
  if (user.isProfilePublic !== false) return true;
  if (viewerId === undefined || viewerId === null) return false;
  if (Number(viewerId) === Number(user.id)) return true;

  const viewer = await User.findByPk(viewerId);
  if (!viewer) return false;

  const profileUser =
    user instanceof User ? user : await User.findByPk(user.id);
  if (!profileUser) return false;

  return profileUser.hasFollower(viewer);
};

const toLimitedProfile = (user) => ({
  id: user.id,
  nickname: user.nickname,
  isProfilePublic: false,
});

const findByIdForViewer = async (id, viewerId) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  const allowed = await canViewFullProfile(user, viewerId);
  if (!allowed) return { forbidden: true };

  return user;
};

const findAllForViewer = async (viewerId) => {
  const users = await User.findAll();
  const result = [];

  for (const user of users) {
    const allowed = await canViewFullProfile(user, viewerId);
    result.push(allowed ? user.toJSON() : toLimitedProfile(user));
  }

  return result;
};

module.exports = {
  canViewFullProfile,
  findByIdForViewer,
  findAllForViewer,
  findByNickname,
  findByEmail,
  findByIdentifier,
};
