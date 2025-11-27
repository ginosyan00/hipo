import * as patientService from '../services/patient.service.js';
import { successResponse } from '../utils/response.util.js';

/**
 * Patient Controller
 * Обработчики для patient endpoints
 */

/**
 * GET /api/v1/patients
 * Получить список пациентов
 */
export async function getAll(req, res, next) {
  try {
    const { search, page, limit } = req.query;
    const clinicId = req.user.clinicId;

    console.log('🔵 [PATIENT CONTROLLER] getAll - Request:', {
      search,
      page,
      limit,
      clinicId,
      query: req.query,
    });

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    const result = await patientService.findAll(clinicId, {
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    console.log('🔵 [PATIENT CONTROLLER] getAll - Result:', {
      search,
      totalPatients: result.patients?.length || 0,
      meta: result.meta,
      samplePatients: result.patients?.slice(0, 3).map(p => ({ id: p.id, name: p.name, phone: p.phone })) || [],
    });

    successResponse(res, result, 200);
  } catch (error) {
    console.error('🔴 [PATIENT CONTROLLER] getAll - Error:', error);
    next(error);
  }
}

/**
 * GET /api/v1/patients/visits
 * Получить все визиты пациентов с полной информацией
 */
export async function getAllVisits(req, res, next) {
  try {
    const { doctorId, search, status, page, limit } = req.query;
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    const result = await patientService.findAllVisits(clinicId, {
      doctorId,
      search,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });

    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/patients/doctor/:doctorId?
 * Получить агрегированные данные пациентов конкретного врача
 * Если doctorId не указан, используется ID текущего пользователя (для врачей)
 */
export async function getDoctorPatients(req, res, next) {
  try {
    const { doctorId } = req.params;
    const { search, page, limit } = req.query;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const userId = req.user.userId;

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    // Если пользователь - врач, он может видеть только своих пациентов
    // Если пользователь - админ/ассистент, он может видеть пациентов любого врача
    // Если doctorId не указан в URL, используем userId (для врачей)
    let finalDoctorId;
    if (userRole === 'DOCTOR') {
      finalDoctorId = userId;
    } else {
      // Для админов/ассистентов: используем doctorId из params или userId если не указан
      finalDoctorId = doctorId || userId;
    }

    if (!finalDoctorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Doctor ID is required',
        },
      });
    }

    console.log('🔵 [PATIENT CONTROLLER] getDoctorPatients:', {
      userRole,
      userId,
      doctorId,
      finalDoctorId,
      clinicId,
    });

    const result = await patientService.findDoctorPatients(clinicId, finalDoctorId, {
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/patients/:id
 * Получить пациента по ID
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    const patient = await patientService.findById(clinicId, id);

    successResponse(res, patient, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/patient/appointments
 * Получить appointments для PATIENT пользователя (по email)
 */
export async function getMyAppointments(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const userEmail = req.user.email || req.user.userId; // Получаем email из токена или userId

    // Получаем email из User таблицы
    const { prisma } = await import('../config/database.js');
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, phone: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const result = await patientService.getPatientAppointments(user.email, {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    // Debug: Проверяем результат перед отправкой (только в режиме разработки)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔵 [PATIENT CONTROLLER] getMyAppointments - Result:', {
        totalAppointments: result.appointments.length,
        completedWithAmount: result.appointments.filter(apt => apt.status === 'completed' && apt.amount && apt.amount > 0).length,
        appointments: result.appointments.map(apt => ({
          id: apt.id,
          status: apt.status,
          amount: apt.amount,
          appointmentDate: apt.appointmentDate,
        })),
      });
    }

    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/patients
 * Создать пациента
 */
export async function create(req, res, next) {
  try {
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    const patient = await patientService.create(clinicId, req.body);

    successResponse(res, patient, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/patients/:id
 * Обновить пациента
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    const patient = await patientService.update(clinicId, id, req.body);

    successResponse(res, patient, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/patients/:id
 * Удалить пациента
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    await patientService.remove(clinicId, id);

    successResponse(res, { message: 'Patient deleted successfully' }, 200);
  } catch (error) {
    next(error);
  }
}
