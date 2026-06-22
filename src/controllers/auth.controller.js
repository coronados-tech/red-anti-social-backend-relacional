const HTTP = require("../config/HttpCode");
const authService = require("../services/auth.service");

const login = async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.login(identifier, password);

  if (!result) {
    return res.status(HTTP.UNAUTHORIZED).json({
      message: res.__("auth_invalid_credentials"),
    });
  }

  res.status(HTTP.OK).json(result);
};

const me = async (req, res) => {
  res.status(HTTP.OK).json(req.user.toJSON());
};

module.exports = { login, me };
