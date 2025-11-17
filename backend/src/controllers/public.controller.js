import * as publicService from '../services/public.service.js';
import { successResponse } from '../utils/response.util.js';

/**
 * Public Controller
 * Обработчики для публичных endpoints (без авторизации)
 */

/**
 * GET /api/v1/public/clinics
 * Получить список клиник
 */
export async function getClinics(req, res, next) {
  try {
    const { city, page, limit } = req.query;

    const result = await publicService.findAllClinics({
      city,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });

    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/public/clinics/:slug
 * Получить детали клиники по slug
 */
export async function getClinicBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const clinic = await publicService.findClinicBySlug(slug);

    successResponse(res, clinic, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/public/clinics/:slug/doctors
 * Получить врачей клиники
 */
export async function getClinicDoctors(req, res, next) {
  try {
    const { slug } = req.params;

    const doctors = await publicService.findClinicDoctors(slug);

    successResponse(res, doctors, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/public/appointments
 * Создать публичную заявку на приём
 */
export async function createAppointment(req, res, next) {
  try {
    const { clinicSlug, doctorId, patient, appointmentDate, reason, registeredAt } = req.body;

    console.log('🔵 [PUBLIC CONTROLLER] Создание публичной заявки:', {
      clinicSlug,
      doctorId,
      patientName: patient?.name,
      appointmentDate,
      registeredAt,
    });

    // Преобразуем registeredAt в Date, если он передан как строка
    let registeredAtDate = null;
    if (registeredAt) {
      registeredAtDate = new Date(registeredAt);
      
      // Проверяем, что дата валидна
      if (isNaN(registeredAtDate.getTime())) {
        console.warn('⚠️ [PUBLIC CONTROLLER] Некорректная дата registeredAt:', registeredAt);
        registeredAtDate = null;
      } else {
        console.log('✅ [PUBLIC CONTROLLER] registeredAt успешно преобразован:', registeredAtDate.toISOString());
      }
    } else {
      console.log('ℹ️ [PUBLIC CONTROLLER] registeredAt не передан, будет использовано null');
    }

    const result = await publicService.createPublicAppointment(
      clinicSlug,
      doctorId,
      patient,
      appointmentDate,
      reason,
      registeredAtDate
    );

    console.log('✅ [PUBLIC CONTROLLER] Заявка создана успешно:', {
      appointmentId: result.appointment?.id,
      registeredAt: result.appointment?.registeredAt,
    });

    successResponse(res, result, 201);
  } catch (error) {
    console.error('🔴 [PUBLIC CONTROLLER] Ошибка создания заявки:', error.message);
    next(error);
  }
}

/**
 * GET /api/v1/public/cities
 * Получить список городов
 */
export async function getCities(req, res, next) {
  try {
    const cities = await publicService.getUniqueCities();

    successResponse(res, cities, 200);
  } catch (error) {
    next(error);
  }
}


