import * as appointmentService from '../services/appointment.service.js';
import { successResponse } from '../utils/response.util.js';

/**
 * Appointment Controller
 * Обработчики для appointment endpoints
 */

/**
 * GET /api/v1/appointments
 * Получить список приёмов
 */
export async function getAll(req, res, next) {
  try {
    const { doctorId, patientId, status, date, time, week, category, page, limit } = req.query;
    const clinicId = req.user.clinicId;

    const result = await appointmentService.findAll(clinicId, {
      doctorId,
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
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;

    const appointment = await appointmentService.findById(clinicId, id);

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

    const appointment = await appointmentService.create(clinicId, req.body);

    successResponse(res, appointment, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/appointments/:id
 * Обновить приём
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;

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
 */
export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, amount, cancellationReason, suggestedNewDate } = req.body;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;

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
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;

    await appointmentService.remove(clinicId, id);

    successResponse(res, { message: 'Appointment deleted successfully' }, 200);
  } catch (error) {
    next(error);
  }
}

