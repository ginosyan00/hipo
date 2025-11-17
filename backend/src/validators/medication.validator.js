import Joi from 'joi';

/**
 * Medication Validators
 * Joi schemas для валидации medication endpoints
 */

/**
 * Создание медикамента
 */
export const createMedicationSchema = Joi.object({
  name: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must be at most 200 characters',
    'any.required': 'Name is required',
  }),
  dosage: Joi.string().min(1).max(50).required().messages({
    'string.min': 'Dosage must be at least 1 character',
    'string.max': 'Dosage must be at most 50 characters',
    'any.required': 'Dosage is required',
  }),
  quantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 0',
    'any.required': 'Quantity is required',
  }),
  price: Joi.number().integer().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.integer': 'Price must be an integer',
    'number.min': 'Price must be at least 0',
    'any.required': 'Price is required',
  }),
  expiryDate: Joi.date().iso().required().messages({
    'date.base': 'Expiry date must be a valid date',
    'date.format': 'Expiry date must be in ISO format',
    'any.required': 'Expiry date is required',
  }),
  manufacturer: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Manufacturer must be at least 2 characters',
    'string.max': 'Manufacturer must be at most 200 characters',
    'any.required': 'Manufacturer is required',
  }),
});

/**
 * Обновление медикамента
 */
export const updateMedicationSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  dosage: Joi.string().min(1).max(50).optional(),
  quantity: Joi.number().integer().min(0).optional(),
  price: Joi.number().integer().min(0).optional(),
  expiryDate: Joi.date().iso().optional(),
  manufacturer: Joi.string().min(2).max(200).optional(),
}).min(1); // Хотя бы одно поле обязательно


