const HTTP = require("../../config/HttpCode");

const numericParamValidateMiddleware = (fieldNumeric) => {
    return async (req, res, next) => {
        const id = req.params[fieldNumeric];
        if (isNaN(id)) {
            return res.status(HTTP.BAD_REQUEST).json({
                message: res.__("parameter_numeric", { field: fieldNumeric }),
            });
        }
        next();
    };
};

module.exports = numericParamValidateMiddleware;
