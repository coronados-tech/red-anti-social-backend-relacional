const Joi = require("joi");

//pattern(/^[a-zA-Z0-9_.-]+$/) => Solo permite letras, números, guiones bajos, puntos y guiones
const nickname = Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_.-]+$/)
    .required()
    .messages({
        "string.min": "El nickname debe tener al menos {#limit} caracteres",
        "string.max": "El nickname no puede tener más de {#limit} caracteres",
        "string.pattern.base": "El nickname solo puede contener letras, números, guiones bajos, puntos y guiones",
        "string.base": "El nickname debe ser un string",
        "string.empty": "El nickname no puede estar vacío",
        "any.required": "El nickname es obligatorio",
    });

//.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/) => solo permite letras, incluye acentos, ñ y espaciados
const name = Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
        "string.min": "El nombre debe tener al menos {#limit} caracteres",
        "string.max": "El nombre no puede tener más de {#limit} caracteres",
        "string.pattern.base": "El nombre solo puede contener letras, acentos, ñ y espacios",
        "string.base": "El nombre debe ser un string",
        "string.empty": "El nombre no puede estar vacío",
        "any.required": "El nombre es obligatorio",
    });

//.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/) => solo permite letras, incluye acentos, ñ y espaciados
const lastName = Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
        "string.min": "El apellido debe tener al menos {#limit} caracteres",
        "string.max": "El apellido no puede tener más de {#limit} caracteres",
        "string.pattern.base": "El apellido solo puede contener letras, acentos, ñ y espacios",
        "string.base": "El apellido debe ser un string",
        "string.empty": "El apellido no puede estar vacío",
        "any.required": "El apellido es obligatorio",
    });

const email = Joi.string().email().required().messages({
    "string.email": "El correo electrónico debe ser válido",
    "string.base": "El correo electrónico debe ser un string",
    "string.empty": "El correo electrónico no puede estar vacío",
    "any.required": "El correo electrónico es obligatorio",
});

//pattern(/^[a-zA-Z0-9_.-]+$/) => Solo permite letras, números, guiones bajos, puntos y guiones
const password = Joi.string()
    .min(6)
    .pattern(/^[a-zA-Z0-9_.-]+$/)
    .required()
    .messages({
        "string.min": "La contraseña debe tener al menos {#limit} caracteres",
        "string.pattern.base": "La contraseña solo puede contener letras, números, guiones bajos, puntos y guiones",
        "string.base": "La contraseña debe ser un string",
        "string.empty": "La contraseña no puede estar vacía",
        "any.required": "La contraseña es obligatoria",
    });

const MIN_AGE = 16;
const MAX_AGE = 100;

function getMaxBirthDate(minAgeYears) {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    date.setFullYear(date.getFullYear() - minAgeYears);
    return date;
}

function getMinBirthDate(maxAgeYears) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setFullYear(date.getFullYear() - maxAgeYears);
    return date;
}

const birthDate = Joi.date()
    .iso()
    .less("now")
    .max(getMaxBirthDate(MIN_AGE))
    .min(getMinBirthDate(MAX_AGE))
    .required()
    .messages({
        "date.base": "La fecha de nacimiento debe ser una fecha válida (formato: YYYY-MM-DD, ej: 1988-11-07)",
        "date.format": "La fecha de nacimiento debe tener formato YYYY-MM-DD (ej: 1988-11-07)",
        "date.less": "La fecha de nacimiento debe ser anterior a hoy",
        "date.max": "Debés tener al menos 16 años para registrarte",
        "date.min": "La edad no puede ser mayor a 100 años",
        "any.required": "La fecha de nacimiento es obligatoria",
        "date.empty": "La fecha de nacimiento no puede estar vacía",
    });

const gender = Joi.string()
    .valid("femenino", "Femenino", "masculino", "Masculino", "otro", "Otro")
    .required()
    .messages({
        "string.base": "El género debe ser un string",
        "string.empty": "El género no puede estar vacío",
        "any.required": "El género es obligatorio",
        "any.only": "El género debe ser 'femenino', 'masculino' u 'otro'",
    });

const isProfilePublic = Joi.boolean().messages({
    "boolean.base": "isProfilePublic debe ser true o false",
});

const viewerIdField = Joi.number().integer().positive().messages({
    "number.base": "viewer_id debe ser un número",
    "number.integer": "viewer_id debe ser un número entero",
    "number.positive": "viewer_id debe ser mayor a 0",
});

const updateUserSchema = Joi.object({
    nickname,
    name,
    lastName,
    email,
    password,
    birthDate,
    gender,
    isProfilePublic: isProfilePublic.optional(),
});

const userSchema = Joi.object({
    nickname,
    name,
    lastName,
    email,
    password,
    birthDate,
    gender,
    isProfilePublic: isProfilePublic.optional().default(true),
});

const viewerIdQuerySchema = Joi.object({
    viewer_id: viewerIdField.optional(),
})
    .unknown(false)
    .messages({
        "object.unknown": "Parámetro de consulta no permitido",
    });

module.exports = { userSchema, updateUserSchema, viewerIdQuerySchema };
