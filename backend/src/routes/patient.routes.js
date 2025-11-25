import express from 'express';
import * as patientController from '../controllers/patient.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../middlewares/tenant.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { createPatientSchema, updatePatientSchema } from '../validators/patient.validator.js';

const router = express.Router();

// Применяем auth middleware ко всем routes
router.use(authenticate);

// Специальный route для PATIENT (без tenantMiddleware, так как у PATIENT нет clinicId)
router.get('/appointments', patientController.getMyAppointments);

// Для остальных routes применяем tenantMiddleware
router.use(tenantMiddleware);

// Note: searchByPhone можно добавить позже, если понадобится

/**
 * GET /api/v1/patients
 * Получить список пациентов
 * Доступ: admin, assistant, doctor
 */
router.get('/', patientController.getAll);

/**
 * GET /api/v1/patients/visits
 * Получить все визиты пациентов с полной информацией
 * Доступ: admin, assistant, doctor
 */
router.get('/visits', patientController.getAllVisits);

/**
 * GET /api/v1/patients/doctor/:doctorId?
 * Получить агрегированные данные пациентов конкретного врача
 * Для врачей (DOCTOR) автоматически используется их собственный ID (doctorId в URL игнорируется)
 * Для админов/ассистентов можно указать doctorId в URL
 * Доступ: admin, assistant, doctor
 * ВАЖНО: Этот route должен быть выше /:id, чтобы избежать конфликта
 */
router.get('/doctor/:doctorId?', patientController.getDoctorPatients);

/**
 * GET /api/v1/patients/:id
 * Получить пациента по ID
 * Доступ: admin, assistant, doctor
 * ВАЖНО: Этот route должен быть последним, чтобы не перехватывать другие routes
 */
router.get('/:id', patientController.getById);

/**
 * POST /api/v1/patients
 * Создать нового пациента
 * Доступ: ADMIN, DOCTOR
 */
router.post(
  '/',
  authorize('ADMIN', 'DOCTOR'),
  validate(createPatientSchema),
  patientController.create
);

/**
 * PUT /api/v1/patients/:id
 * Обновить пациента
 * Доступ: ADMIN, DOCTOR
 */
router.put(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  validate(updatePatientSchema),
  patientController.update
);

/**
 * DELETE /api/v1/patients/:id
 * Удалить пациента
 * Доступ: только ADMIN
 */
router.delete('/:id', authorize('ADMIN'), patientController.remove);

export default router;

