const Joi = require("joi");

const contentField = Joi.string().trim().min(1).max(150).messages({
  "any.required": "content es requerido",
  "string.empty": "content no puede estar vacío",
  "string.min": "content debe tener al menos {#limit} carácter",
  "string.max": "content debe tener como máximo {#limit} caracteres",
});

const postIdField = Joi.number().integer().positive().messages({
  "any.required": "post_id es requerido",
  "number.base": "post_id debe ser un número",
  "number.integer": "post_id debe ser un número entero",
  "number.positive": "post_id debe ser mayor a 0",
});

const userIdField = Joi.number().integer().positive().messages({
  "any.required": "user_id es requerido",
  "number.base": "user_id debe ser un número",
  "number.integer": "user_id debe ser un número entero",
  "number.positive": "user_id debe ser mayor a 0",
});

const commentSchema = Joi.object({
  content: contentField.required(),
  post_id: postIdField.required(),
  user_id: userIdField.required(),
}).unknown(false);

const updateCommentSchema = Joi.object({
  content: contentField.optional(),
})
  .min(1)
  .unknown(false)
  .messages({
    "object.min": "Debe enviar al menos un campo para actualizar (content)",
  });

const getAllCommentsQuerySchema = Joi.object({
  post_id: postIdField.optional(),
})
  .unknown(false)
  .messages({
    "object.unknown": "Parámetro de consulta no permitido",
  });

module.exports = { commentSchema, updateCommentSchema, getAllCommentsQuerySchema };
