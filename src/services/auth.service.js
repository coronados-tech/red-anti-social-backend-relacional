const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../db/models");
const { comparePassword } = require("../helpers/password.helper");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      nickname: user.nickname,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

const findByIdentifier = (identifier) => {
  const normalized = identifier.trim();

  return User.findOne({
    where: {
      [Op.or]: [{ nickname: normalized }, { email: normalized.toLowerCase() }],
    },
  });
};

const login = async (identifier, password) => {
  const user = await findByIdentifier(identifier);
  if (!user) return null;

  const valid = await comparePassword(password, user.password);
  if (!valid) return null;

  return {
    token: signToken(user),
    user: user.toJSON(),
  };
};

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = {
  login,
  verifyToken,
};
