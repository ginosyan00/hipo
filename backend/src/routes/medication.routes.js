import express from 'express';
import * as medicationController from '../controllers/medication.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../middlewares/tenant.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { createMedicationSchema, updateMedicationSchema } from '../validators/medication.validator.js';

const router = express.Router();

// Применяем auth middleware ко всем routes
router.use(authenticate);
router.use(tenantMiddleware);

/**
 * GET /api/v1/medications
 * Получить список медикаментов
 * Доступ: admin, doctor
 */
router.get('/', medicationController.getAll);

/**
 * GET /api/v1/medications/stats
 * Получить статистику медикаментов
 * Доступ: admin, doctor
 */
router.get('/stats', medicationController.getStats);

/**
 * GET /api/v1/medications/:id
 * Получить медикамент по ID
 * Доступ: admin, doctor
 */
router.get('/:id', medicationController.getById);

/**
 * POST /api/v1/medications
 * Создать новый медикамент
 * Доступ: ADMIN, DOCTOR, CLINIC
 */
router.post(
  '/',
  authorize('ADMIN', 'DOCTOR', 'CLINIC'),
  validate(createMedicationSchema),
  medicationController.create
);

/**
 * PUT /api/v1/medications/:id
 * Обновить медикамент
 * Доступ: ADMIN, DOCTOR, CLINIC
 */
router.put(
  '/:id',
  authorize('ADMIN', 'DOCTOR', 'CLINIC'),
  validate(updateMedicationSchema),
  medicationController.update
);

/**
 * DELETE /api/v1/medications/:id
 * Удалить медикамент
 * Доступ: ADMIN, CLINIC
 */
router.delete('/:id', authorize('ADMIN', 'CLINIC'), medicationController.remove);

export default router;

