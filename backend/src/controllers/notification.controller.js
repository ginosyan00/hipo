import * as notificationService from '../services/notification.service.js';
import { successResponse } from '../utils/response.util.js';
import { prisma } from '../config/database.js';

/**
 * Notification Controller
 * Обработчики для notification endpoints
 */

/**
 * Получить patientId для пользователя
 * Для пациентов - находим по email/phone
 * Для врачей/админов - используем patientId из query параметров
 */
async function getPatientId(req) {
  if (req.user.role === 'PATIENT') {
    // Для пациентов находим patientId по email пользователя
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, phone: true },
    });

    if (!user) {
      return null;
    }

    // Ищем пациента по email или phone в рамках клиники
    const patient = await prisma.patient.findFirst({
      where: {
        clinicId: req.user.clinicId,
        OR: [
          { email: user.email },
          { phone: user.phone },
        ],
      },
      select: { id: true },
    });

    return patient?.id || req.query.patientId || null;
  }

  // Для врачей/админов - используем patientId из query параметров
  return req.query.patientId || null;
}

/**
 * GET /api/v1/notifications
 * Получить список уведомлений пациента
 */
export async function getAll(req, res, next) {
  try {
    const { isRead, type, page, limit } = req.query;
    const clinicId = req.user.clinicId;
    
    // Получаем patientId
    const patientId = await getPatientId(req);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required. For PATIENT role, patient must be registered in the clinic.',
      });
    }

    const result = await notificationService.findAll(clinicId, patientId, {
      isRead,
      type,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/notifications/unread-count
 * Получить количество непрочитанных уведомлений
 */
export async function getUnreadCount(req, res, next) {
  try {
    const clinicId = req.user.clinicId;
    const patientId = await getPatientId(req);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required. For PATIENT role, patient must be registered in the clinic.',
      });
    }

    const count = await notificationService.getUnreadCount(clinicId, patientId);

    successResponse(res, { count }, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/notifications/:id
 * Получить уведомление по ID
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;
    const patientId = await getPatientId(req);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required. For PATIENT role, patient must be registered in the clinic.',
      });
    }

    const notification = await notificationService.findById(clinicId, patientId, id);

    successResponse(res, notification, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/notifications/:id/read
 * Отметить уведомление как прочитанное
 */
export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;
    const patientId = await getPatientId(req);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required. For PATIENT role, patient must be registered in the clinic.',
      });
    }

    const notification = await notificationService.markAsRead(clinicId, patientId, id);

    successResponse(res, notification, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/notifications/read-all
 * Отметить все уведомления как прочитанные
 */
export async function markAllAsRead(req, res, next) {
  try {
    const clinicId = req.user.clinicId;
    const patientId = await getPatientId(req);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required. For PATIENT role, patient must be registered in the clinic.',
      });
    }

    const result = await notificationService.markAllAsRead(clinicId, patientId);

    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/notifications/:id
 * Удалить уведомление
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;
    const patientId = await getPatientId(req);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required. For PATIENT role, patient must be registered in the clinic.',
      });
    }

    await notificationService.remove(clinicId, patientId, id);

    successResponse(res, { message: 'Notification deleted successfully' }, 200);
  } catch (error) {
    next(error);
  }
}

