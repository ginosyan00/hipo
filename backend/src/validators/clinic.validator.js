import Joi from 'joi';

/**
 * Clinic Validators
 * Joi schemas для валидации clinic endpoints
 */

/**
 * Обновление профиля клиники
 */
export const updateClinicSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Clinic name must be at least 2 characters',
    'string.max': 'Clinic name must be at most 100 characters',
  }),
  slug: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-z0-9-]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Must be a valid email',
  }),
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Must be a valid phone number',
    }),
  address: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Address must be at most 500 characters',
  }),
  city: Joi.string().max(100).optional().messages({
    'string.max': 'City must be at most 100 characters',
  }),
  about: Joi.string().max(2000).allow('').optional().messages({
    'string.max': 'About must be at most 2000 characters',
  }),
  workingHours: Joi.object({
    monday: Joi.object({
      isOpen: Joi.boolean().required(),
      open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }).optional(),
    tuesday: Joi.object({
      isOpen: Joi.boolean().required(),
      open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }).optional(),
    wednesday: Joi.object({
      isOpen: Joi.boolean().required(),
      open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }).optional(),
    thursday: Joi.object({
      isOpen: Joi.boolean().required(),
      open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }).optional(),
    friday: Joi.object({
      isOpen: Joi.boolean().required(),
      open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }).optional(),
    saturday: Joi.object({
      isOpen: Joi.boolean().required(),
      open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }).optional(),
    sunday: Joi.object({
      isOpen: Joi.boolean().required(),
      open: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      close: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).allow(null).when('isOpen', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }).optional(),
  }).optional(),
});

/**
 * Загрузка логотипа
 */
export const uploadLogoSchema = Joi.object({
  logo: Joi.string().uri().optional().messages({
    'string.uri': 'Logo must be a valid URL or base64 data URI',
  }),
});

/**
 * Обновление настроек клиники
 */
export const updateSettingsSchema = Joi.object({
  timezone: Joi.string().max(100).optional().messages({
    'string.max': 'Timezone must be at most 100 characters',
  }),
  language: Joi.string().valid('ru', 'en', 'am').optional().messages({
    'any.only': 'Language must be one of: ru, en, am',
  }),
  currency: Joi.string().valid('AMD', 'RUB', 'USD').optional().messages({
    'any.only': 'Currency must be one of: AMD, RUB, USD',
  }),
  defaultAppointmentDuration: Joi.number().integer().min(5).max(480).optional().messages({
    'number.min': 'Default appointment duration must be at least 5 minutes',
    'number.max': 'Default appointment duration must be at most 480 minutes',
  }),
  emailNotificationsEnabled: Joi.boolean().optional(),
  smsNotificationsEnabled: Joi.boolean().optional(),
  appointmentReminderHours: Joi.number().integer().min(1).max(168).optional().messages({
    'number.min': 'Appointment reminder hours must be at least 1',
    'number.max': 'Appointment reminder hours must be at most 168 (7 days)',
  }),
  notifyNewAppointments: Joi.boolean().optional(),
  notifyCancellations: Joi.boolean().optional(),
  notifyConfirmations: Joi.boolean().optional(),
});

/**
 * Обновление пароля
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

