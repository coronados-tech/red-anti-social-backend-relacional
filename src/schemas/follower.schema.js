const Joi = require("joi");

const followerIdField = Joi.number().integer().positive().messages({
  "any.required": "follower_id es requerido",
  "number.base": "follower_id debe ser un número",
  "number.integer": "follower_id debe ser un número entero",
  "number.positive": "follower_id debe ser mayor a 0",
});

const followSchema = Joi.object({
  follower_id: followerIdField.required(),
});

module.exports = { followSchema };
