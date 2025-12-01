import express from 'express';
import * as publicController from '../controllers/public.controller.js';
import { validate } from '../middlewares/validation.middleware.js';
import { createPublicAppointmentSchema } from '../validators/public.validator.js';

const router = express.Router();

/**
 * Public Routes
 * Все эти endpoints доступны БЕЗ авторизации
 */

/**
 * GET /api/v1/public/cities
 * Получить список городов (для фильтра)
 */
router.get('/cities', publicController.getCities);

/**
 * GET /api/v1/public/clinics
 * Получить список клиник
 * Query params: ?city=Yerevan&page=1&limit=20
 */
router.get('/clinics', publicController.getClinics);

/**
 * GET /api/v1/public/clinics/:slug
 * Получить детали клиники по slug
 */
router.get('/clinics/:slug', publicController.getClinicBySlug);

/**
 * GET /api/v1/public/clinics/:slug/doctors
 * Получить врачей клиники
 */
router.get('/clinics/:slug/doctors', publicController.getClinicDoctors);

/**
 * GET /api/v1/public/clinics/:slug/doctors/:doctorId
 * Получить врача по ID
 */
router.get('/clinics/:slug/doctors/:doctorId', publicController.getClinicDoctor);

/**
 * POST /api/v1/public/appointments
 * Создать публичную заявку на приём (онлайн-запись)
 * Без авторизации!
 */
router.post('/appointments', validate(createPublicAppointmentSchema), publicController.createAppointment);

/**
 * GET /api/v1/public/testimonials/patients
 * Получить список пациентов для отзывов (публичный endpoint)
 * Query params: ?limit=3
 */
router.get('/testimonials/patients', publicController.getPatientsForTestimonials);

/**
 * GET /api/v1/public/clinics/:slug/patients
 * Получить список пациентов клиники (публичный endpoint)
 * Query params: ?page=1&limit=50
 */
router.get('/clinics/:slug/patients', publicController.getClinicPatients);

export default router;


