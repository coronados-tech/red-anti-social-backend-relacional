const HTTP = require("../config/HttpCode");

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path; 
    
    return res.status(HTTP.CONFLICT || 409).json({
      message: res.__("user_already_exists", { field }), 
      error: err.message
    });
  }
  
  console.error(err);
  res.status(HTTP.INTERNAL_SERVER_ERROR).json({
    message: res.__("error_internal"),
    error: err.message,
  });
};

module.exports = errorMiddleware;
