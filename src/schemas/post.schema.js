const Joi = require("joi");

const tituloField = Joi.string().trim().min(1).max(200).messages({
  "any.required": "titulo es requerido",
  "string.empty": "titulo no puede estar vacío",
  "string.min": "titulo debe tener al menos {#limit} carácter",
  "string.max": "titulo debe tener como máximo {#limit} caracteres",
});

const descriptionField = Joi.string().trim().min(1).max(5000).messages({
  "any.required": "description es requerido",
  "string.empty": "description no puede estar vacío",
  "string.min": "description debe tener al menos {#limit} carácter",
  "string.max": "description debe tener como máximo {#limit} caracteres",
});

const userIdField = Joi.number().integer().positive().messages({
  "any.required": "user_id es requerido",
  "number.base": "user_id debe ser un número",
  "number.integer": "user_id debe ser un número entero",
  "number.positive": "user_id debe ser mayor a 0",
});

const tagsField = Joi.array()
  .items(Joi.string().trim().min(1).max(50))
  .min(1)
  .messages({
    "array.base": "tags debe ser un array",
    "array.min": "debe enviar al menos un tag",
    "string.base": "cada tag debe ser texto",
    "string.empty": "los tags no pueden estar vacíos",
    "string.min": "cada tag debe tener al menos {#limit} carácter",
    "string.max": "cada tag debe tener máximo {#limit} caracteres",
  });

const postSchema = Joi.object({
  titulo: tituloField.required(),
  description: descriptionField.required(),
  user_id: userIdField.required(),
  tags: tagsField.optional(),
});

const updatePostSchema = Joi.object({
  titulo: tituloField.optional(),
  description: descriptionField.optional(),
  tags: tagsField.optional(),
})
  .min(1)
  .unknown(false)
  .messages({
    "object.min": "Debe enviar al menos un campo para actualizar (titulo, description y/o tags)",
  });

const getAllPostsQuerySchema = Joi.object({
  user_id: userIdField.optional(),
  viewer_id: Joi.number().integer().positive().messages({
    "number.base": "viewer_id debe ser un número",
    "number.integer": "viewer_id debe ser un número entero",
    "number.positive": "viewer_id debe ser mayor a 0",
  }).optional(),
})
  .unknown(false)
  .messages({
    "object.unknown": "Parámetro de consulta no permitido",
  });

module.exports = { postSchema, updatePostSchema, getAllPostsQuerySchema };
