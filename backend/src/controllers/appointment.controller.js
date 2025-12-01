import * as appointmentService from '../services/appointment.service.js';
import { successResponse } from '../utils/response.util.js';

/**
 * Appointment Controller
 * Обработчики для appointment endpoints
 */

/**
 * GET /api/v1/appointments
 * Получить список приёмов
 * Для врачей (DOCTOR) автоматически фильтрует по их doctorId
 */
export async function getAll(req, res, next) {
  try {
    const { doctorId, patientId, status, date, time, week, category, page, limit } = req.query;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Для врачей автоматически устанавливаем doctorId = userId
    // Врачи не должны видеть назначения других врачей
    let finalDoctorId = doctorId;
    if (userRole === 'DOCTOR') {
      finalDoctorId = userId;
      console.log('🔒 [APPOINTMENT CONTROLLER] Врач запрашивает назначения - автоматически фильтруем по doctorId:', userId);
    }

    const result = await appointmentService.findAll(clinicId, {
      doctorId: finalDoctorId,
      patientId,
      status,
      date,
      time,
      week,
      category,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/appointments/:id
 * Получить приём по ID
 * Для врачей проверяет, что назначение принадлежит им
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const userId = req.user.userId;

    const appointment = await appointmentService.findById(clinicId, id);

    // Для врачей проверяем, что назначение принадлежит им
    if (userRole === 'DOCTOR' && appointment.doctorId !== userId) {
      console.log('🔒 [APPOINTMENT CONTROLLER] Врач пытается получить назначение другого врача:', { 
        appointmentDoctorId: appointment.doctorId, 
        userId 
      });
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this appointment',
        },
      });
    }

    successResponse(res, appointment, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/appointments
 * Создать новый приём
 */
export async function create(req, res, next) {
  try {
    const clinicId = req.user.clinicId;
    const userId = req.user.userId; // Для Phase 2: dual-write

    const appointment = await appointmentService.create(clinicId, req.body, userId);

    successResponse(res, appointment, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/appointments/:id
 * Обновить приём
 * Для врачей проверяет, что назначение принадлежит им
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Для врачей проверяем, что назначение принадлежит им
    if (userRole === 'DOCTOR') {
      const existingAppointment = await appointmentService.findById(clinicId, id);
      if (existingAppointment.doctorId !== userId) {
        console.log('🔒 [APPOINTMENT CONTROLLER] Врач пытается обновить назначение другого врача:', { 
          appointmentDoctorId: existingAppointment.doctorId, 
          userId 
        });
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this appointment',
          },
        });
      }
    }

    const appointment = await appointmentService.update(clinicId, id, req.body);

    successResponse(res, appointment, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/appointments/:id/status
 * Изменить статус приёма
 * При статусе 'completed' можно передать amount (сумму оплаты)
 * При статусе 'cancelled' обязательно передать cancellationReason и опционально suggestedNewDate
 * Для врачей проверяет, что назначение принадлежит им
 */
export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, amount, cancellationReason, suggestedNewDate } = req.body;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Для врачей проверяем, что назначение принадлежит им
    if (userRole === 'DOCTOR') {
      const existingAppointment = await appointmentService.findById(clinicId, id);
      if (existingAppointment.doctorId !== userId) {
        console.log('🔒 [APPOINTMENT CONTROLLER] Врач пытается изменить статус назначения другого врача:', { 
          appointmentDoctorId: existingAppointment.doctorId, 
          userId 
        });
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this appointment',
          },
        });
      }
    }

    const appointment = await appointmentService.updateStatus(
      clinicId, 
      id, 
      status, 
      userRole, 
      amount,
      cancellationReason,
      suggestedNewDate
    );

    successResponse(res, appointment, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/appointments/:id
 * Удалить приём
 * Для врачей проверяет, что назначение принадлежит им (хотя удаление доступно только ADMIN)
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Для врачей проверяем, что назначение принадлежит им (на всякий случай, хотя удаление доступно только ADMIN)
    if (userRole === 'DOCTOR') {
      const existingAppointment = await appointmentService.findById(clinicId, id);
      if (existingAppointment.doctorId !== userId) {
        console.log('🔒 [APPOINTMENT CONTROLLER] Врач пытается удалить назначение другого врача:', { 
          appointmentDoctorId: existingAppointment.doctorId, 
          userId 
        });
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this appointment',
          },
        });
      }
    }

    await appointmentService.remove(clinicId, id);

    successResponse(res, { message: 'Appointment deleted successfully' }, 200);
  } catch (error) {
    next(error);
  }
}

