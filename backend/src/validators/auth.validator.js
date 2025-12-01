import Joi from 'joi';

/**
 * Auth Validators
 * Joi schemas для валидации auth endpoints
 */

/**
 * Регистрация клиники
 */
export const registerSchema = Joi.object({
  clinic: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Clinic name must be at least 2 characters',
      'string.max': 'Clinic name must be at most 100 characters',
      'any.required': 'Clinic name is required',
    }),
    slug: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-z0-9-]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens',
        'any.required': 'Slug is required',
      }),
    email: Joi.string().email().required().messages({
      'string.email': 'Must be a valid email',
      'any.required': 'Clinic email is required',
    }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Must be a valid phone number',
        'any.required': 'Phone is required',
      }),
    city: Joi.string().required().messages({
      'any.required': 'City is required',
    }),
    address: Joi.string().allow('').optional(),
  }).required(),

  admin: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Admin name must be at least 2 characters',
      'any.required': 'Admin name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Must be a valid email',
      'any.required': 'Admin email is required',
    }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base':
          'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
        'any.required': 'Password is required',
      }),
  }).required(),
});

/**
 * Авторизация
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Must be a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Регистрация пользователя (Patient, Clinic, Partner)
 * Динамическая валидация в зависимости от роли
 */
export const registerUserSchema = Joi.object({
  // Общие поля для всех ролей
  role: Joi.string()
    .valid('PATIENT', 'CLINIC', 'PARTNER')
    .required()
    .messages({
      'any.only': 'Role must be one of: PATIENT, CLINIC, PARTNER',
      'any.required': 'Role is required',
    }),
  // Patient-specific поля (required только для PATIENT)
  clinicId: Joi.string().when('role', {
    is: 'PATIENT',
    then: Joi.optional(), // clinicId или clinicSlug должен быть указан
    otherwise: Joi.optional(),
  }),
  clinicSlug: Joi.string().when('role', {
    is: 'PATIENT',
    then: Joi.optional(), // clinicId или clinicSlug должен быть указан
    otherwise: Joi.optional(),
  }).custom((value, helpers) => {
    // Если role=PATIENT, то clinicId или clinicSlug должен быть указан
    const { role, clinicId } = helpers.state.ancestors[0];
    if (role === 'PATIENT' && !value && !clinicId) {
      return helpers.error('any.required');
    }
    return value;
  }).messages({
    'any.required': 'Either clinicId or clinicSlug is required for patient registration',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must be at most 100 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Must be a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base':
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
      'any.required': 'Password is required',
    }),
  phone: Joi.string()
    .custom((value, helpers) => {
      // If no value or empty string, convert to null (optional field)
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return null;
      }
      // Validate pattern only if value exists
      if (!/^\+?[\d\s\-\(\)]+$/.test(value)) {
        return helpers.error('string.pattern.base');
      }
      return value;
    })
    .optional()
    .allow(null)
    .messages({
      'string.pattern.base': 'Must be a valid phone number',
    }),
  dateOfBirth: Joi.date()
    .iso()
    .allow(null, '')
    .empty(['', null])
    .optional()
    .messages({
      'date.base': 'Must be a valid date',
      'date.format': 'Must be a valid ISO date',
    }),
  gender: Joi.string().valid('male', 'female', 'other').optional().messages({
    'any.only': 'Gender must be one of: male, female, other',
  }),

  // Clinic-specific поля (required только для CLINIC)
  clinicName: Joi.string().when('role', {
    is: 'CLINIC',
    then: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Clinic name must be at least 2 characters',
      'string.max': 'Clinic name must be at most 100 characters',
      'any.required': 'Clinic name is required',
    }),
    otherwise: Joi.optional(),
  }),
  clinicEmail: Joi.string().when('role', {
    is: 'CLINIC',
    then: Joi.string().email().required().messages({
      'string.email': 'Must be a valid email',
      'any.required': 'Clinic email is required',
    }),
    otherwise: Joi.optional(),
  }),
  clinicPhone: Joi.string().when('role', {
    is: 'CLINIC',
    then: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required().messages({
      'string.pattern.base': 'Must be a valid phone number',
      'any.required': 'Clinic phone is required',
    }),
    otherwise: Joi.optional(),
  }),
  city: Joi.string().when('role', {
    is: 'CLINIC',
    then: Joi.string().required().messages({
      'any.required': 'City is required',
    }),
    otherwise: Joi.optional(),
  }),
  address: Joi.string().when('role', {
    is: 'CLINIC',
    then: Joi.optional(),
    otherwise: Joi.when('role', {
      is: 'PARTNER',
      then: Joi.required().messages({
        'any.required': 'Address is required for partners',
      }),
      otherwise: Joi.optional(),
    }),
  }),
  about: Joi.string().max(1000).optional().messages({
    'string.max': 'About must be at most 1000 characters',
  }),

  // Partner-specific поля (required только для PARTNER)
  organizationName: Joi.string().when('role', {
    is: 'PARTNER',
    then: Joi.required().messages({
      'any.required': 'Organization name is required for partners',
    }),
    otherwise: Joi.optional(),
  }),
  organizationType: Joi.string()
    .valid('pharmacy', 'laboratory', 'insurance')
    .when('role', {
      is: 'PARTNER',
      then: Joi.required().messages({
        'any.required': 'Organization type is required for partners',
        'any.only': 'Organization type must be one of: pharmacy, laboratory, insurance',
      }),
      otherwise: Joi.optional(),
    }),
  inn: Joi.string().when('role', {
    is: 'PARTNER',
    then: Joi.required().messages({
      'any.required': 'INN is required for partners',
    }),
    otherwise: Joi.optional(),
  }),
  organizationAddress: Joi.string().when('role', {
    is: 'PARTNER',
    then: Joi.required().messages({
      'any.required': 'Address is required for partners',
    }),
    otherwise: Joi.optional(),
  }),
});

/**
 * Изменение пароля (для всех ролей)
 */
export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base':
        'New password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
      'any.required': 'New password is required',
    }),
});

