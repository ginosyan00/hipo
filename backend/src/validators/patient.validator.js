import Joi from 'joi';

/**
 * Patient Validators
 * Joi schemas для валидации patient endpoints
 */

/**
 * Создание пациента
 */
export const createPatientSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must be at most 100 characters',
    'any.required': 'Name is required',
  }),
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Must be a valid phone number',
      'any.required': 'Phone is required',
    }),
  email: Joi.string().email().allow('').optional(),
  dateOfBirth: Joi.date().iso().max('now').optional().allow(null),
  gender: Joi.string().valid('male', 'female', 'other').optional().allow(null),
  notes: Joi.string().max(1000).allow('').optional(),
  status: Joi.string().valid('registered', 'guest').optional().default('registered'),
});

/**
 * Обновление пациента
 */
export const updatePatientSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]+$/)
    .optional(),
  email: Joi.string().email().allow('').optional(),
  dateOfBirth: Joi.date().iso().max('now').optional().allow(null),
  gender: Joi.string().valid('male', 'female', 'other').optional().allow(null),
  notes: Joi.string().max(1000).allow('').optional(),
}).min(1); // Хотя бы одно поле обязательно

