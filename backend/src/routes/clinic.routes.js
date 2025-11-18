import express from 'express';
import * as clinicController from '../controllers/clinic.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../middlewares/tenant.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  updateClinicSchema,
  uploadLogoSchema,
  updateSettingsSchema,
  updatePasswordSchema,
} from '../validators/clinic.validator.js';

const router = express.Router();

// Применяем auth и tenant middleware ко всем routes
router.use(authenticate);
router.use(tenantMiddleware);

/**
 * GET /api/v1/clinic/me
 * Получить данные текущей клиники
 * Доступ: ADMIN с clinicId
 */
router.get('/me', clinicController.getClinic);

/**
 * PUT /api/v1/clinic/me
 * Обновить профиль клиники
 * Доступ: ADMIN с clinicId
 */
router.put('/me', validate(updateClinicSchema), clinicController.updateClinic);

/**
 * POST /api/v1/clinic/logo
 * Загрузить логотип клиники
 * Доступ: ADMIN с clinicId
 */
router.post('/logo', validate(uploadLogoSchema), clinicController.uploadLogo);

/**
 * GET /api/v1/clinic/settings
 * Получить настройки клиники
 * Доступ: ADMIN с clinicId
 */
router.get('/settings', clinicController.getSettings);

/**
 * PUT /api/v1/clinic/settings
 * Обновить настройки клиники
 * Доступ: ADMIN с clinicId
 */
router.put('/settings', validate(updateSettingsSchema), clinicController.updateSettings);

/**
 * PUT /api/v1/clinic/password
 * Обновить пароль администратора клиники
 * Доступ: ADMIN с clinicId
 */
router.put('/password', validate(updatePasswordSchema), clinicController.updatePassword);

export default router;

