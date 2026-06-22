const HTTP = require("../config/HttpCode");
const { User } = require("../db/models");
const authService = require("../services/auth.service");

const extractBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
};

const optionalAuthMiddleware = async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    const payload = authService.verifyToken(token);
    const user = await User.findByPk(payload.sub);
    if (user) {
      req.user = user;
    }
  } catch {
    // Token inválido o expirado: se trata como visitante anónimo.
  }

  next();
};

const requireAuthMiddleware = async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(HTTP.UNAUTHORIZED).json({
      message: res.__("auth_required"),
    });
  }

  try {
    const payload = authService.verifyToken(token);
    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(HTTP.UNAUTHORIZED).json({
        message: res.__("auth_invalid"),
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(HTTP.UNAUTHORIZED).json({
      message: res.__("auth_invalid"),
    });
  }
};

const resolveViewerMiddleware = (req, res, next) => {
  if (req.user) {
    req.viewerId = req.user.id;
  } else if (req.query.viewer_id !== undefined && req.query.viewer_id !== "") {
    req.viewerId = Number(req.query.viewer_id);
  } else {
    req.viewerId = undefined;
  }

  next();
};

module.exports = {
  optionalAuthMiddleware,
  requireAuthMiddleware,
  resolveViewerMiddleware,
};
