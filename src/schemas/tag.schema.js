const Joi = require("joi");

const postIdField = Joi.number().integer().positive().messages({
    "any.required": "post_id es requerido",
    "number.base": "post_id debe ser un número",
    "number.integer": "post_id debe ser un número entero",
    "number.positive": "post_id debe ser mayor a 0",
});

const nameField = Joi.string().trim().min(1).max(25).messages({
    "any.required": "name es requerido",
    "string.empty": "name no puede estar vacío",
    "string.min": "name debe tener al menos {#limit} carácter",
    "string.max": "name debe tener como máximo {#limit} caracteres",
});

const tagSchema = Joi.object({
    name: nameField.required(),
    post_id: postIdField.optional(),
}).unknown(false);

const updateTagSchema = Joi.object({
    name: nameField.optional(),
})
    .min(1)
    .unknown(false)
    .messages({
        "object.min": "Debe enviar al menos un campo para actualizar (name)",
    });

const getAllTagsQuerySchema = Joi.object({
    post_id: postIdField.optional(),
})
    .unknown(false)
    .messages({
        "object.unknown": "Parámetro de consulta no permitido",
    });

module.exports = {
    tagSchema,
    updateTagSchema,
    getAllTagsQuerySchema,
};
