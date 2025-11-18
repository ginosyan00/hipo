import express from 'express';
import * as appointmentController from '../controllers/appointment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../middlewares/tenant.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateStatusSchema,
} from '../validators/appointment.validator.js';

const router = express.Router();

// Применяем auth и tenant middleware ко всем routes
router.use(authenticate);
router.use(tenantMiddleware);

/**
 * GET /api/v1/appointments
 * Получить список приёмов
 * Доступ: все авторизованные
 * Query params: ?doctorId=xxx&patientId=xxx&status=pending&date=2025-11-15&page=1&limit=20
 */
router.get('/', appointmentController.getAll);

/**
 * GET /api/v1/appointments/:id
 * Получить приём по ID
 * Доступ: все авторизованные
 */
router.get('/:id', appointmentController.getById);

/**
 * POST /api/v1/appointments
 * Создать новый приём
 * Доступ: ADMIN, CLINIC, DOCTOR
 * CLINIC - администратор клиники, имеет те же права что и DOCTOR
 */
router.post(
  '/',
  authorize('ADMIN', 'CLINIC', 'DOCTOR'),
  validate(createAppointmentSchema),
  appointmentController.create
);

/**
 * PUT /api/v1/appointments/:id
 * Обновить приём
 * Доступ: ADMIN, CLINIC, DOCTOR
 * CLINIC - администратор клиники, имеет те же права что и DOCTOR
 */
router.put(
  '/:id',
  authorize('ADMIN', 'CLINIC', 'DOCTOR'),
  validate(updateAppointmentSchema),
  appointmentController.update
);

/**
 * PATCH /api/v1/appointments/:id/status
 * Изменить статус приёма
 * Доступ: ADMIN, CLINIC, DOCTOR (ограничения внутри service)
 * CLINIC - администратор клиники, имеет те же права что и DOCTOR
 */
router.patch(
  '/:id/status',
  authorize('ADMIN', 'CLINIC', 'DOCTOR'),
  validate(updateStatusSchema),
  appointmentController.updateStatus
);

/**
 * DELETE /api/v1/appointments/:id
 * Удалить приём
 * Доступ: только ADMIN
 */
router.delete('/:id', authorize('ADMIN'), appointmentController.remove);

export default router;

