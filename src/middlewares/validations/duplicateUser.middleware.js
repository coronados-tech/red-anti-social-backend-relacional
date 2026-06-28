const HTTP = require("../../config/HttpCode");
const userService = require("../../services/user.service");

const duplicateUserMiddleware = ({ excludeParam } = {}) => {
  return async (req, res, next) => {
    const excludeUserId = excludeParam ? req.params[excludeParam] : null;
    const { nickname, email } = req.body;

    if (nickname) {
      const existing = await userService.findByNickname(nickname, excludeUserId);
      if (existing) {
        return res.status(HTTP.CONFLICT).json({
          message: res.__("user_already_exists", { field: "nickname" }),
        });
      }
    }

    if (email) {
      const existing = await userService.findByEmail(email, excludeUserId);
      if (existing) {
        return res.status(HTTP.CONFLICT).json({
          message: res.__("user_already_exists", { field: "email" }),
        });
      }
    }

    next();
  };
};

module.exports = duplicateUserMiddleware;
