const Joi = require("joi");

const loginSchema = Joi.object({
  identifier: Joi.string().trim().min(1).required().messages({
    "string.base": "El identificador debe ser un string",
    "string.empty": "El nickname o email no puede estar vacío",
    "any.required": "El nickname o email es obligatorio",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "La contraseña debe tener al menos {#limit} caracteres",
    "string.base": "La contraseña debe ser un string",
    "string.empty": "La contraseña no puede estar vacía",
    "any.required": "La contraseña es obligatoria",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "Campo no permitido",
  });

module.exports = { loginSchema };
