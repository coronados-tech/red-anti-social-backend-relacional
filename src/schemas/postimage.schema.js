const Joi = require("joi");

const postIdField = Joi.number().integer().positive().messages({
    "any.required": "postId es requerido",
    "number.base": "postId debe ser un número",
    "number.integer": "postId debe ser un número entero",
    "number.positive": "postId debe ser mayor a 0",
});

const createPostImageSchema = Joi.object({
    postId: postIdField.required(),
}).unknown(true);

const updatePostImageSchema = Joi.object({
    postId: postIdField.optional(),
    post_id: postIdField.optional(),
})
    .min(1)
    .unknown(true)
    .messages({
        "object.min": "Debe enviar al menos un campo para actualizar (postId o post_id)",
    });

module.exports = { createPostImageSchema, updatePostImageSchema };
