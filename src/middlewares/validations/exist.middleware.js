const HTTP = require("../../config/HttpCode");

const existValidateMiddleware = (Modelo, field, { optional = false, aliases = [] } = {}) => {
    return async (req, res, next) => {
        const fields = [field, ...aliases];
        let id;

        for (const f of fields) {
            const value = req.params[f] ?? req.body?.[f] ?? req.query?.[f];
            if (value != null && value !== "") {
                id = value;
                break;
            }
        }

        if (id == null || id === "") {
            if (optional) return next();
            return res.status(HTTP.BAD_REQUEST).json({
                message: res.__("field_required", { field }),
            });
        }

        const entity = await Modelo.findByPk(id);
        if (!entity) {
            return res.status(HTTP.NOT_FOUND).json({
                message: res.__("id_dont_exist", { id, nombreModelo: Modelo.name }),
            });
        }

        next();
    };
};

module.exports = existValidateMiddleware;
