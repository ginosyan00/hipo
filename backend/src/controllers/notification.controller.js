import * as notificationService from '../services/notification.service.js';
import { successResponse } from '../utils/response.util.js';
import { prisma } from '../config/database.js';

/**
 * Notification Controller
 * Обработчики для notification endpoints
 */

/**
 * Получить patientId и clinicId для пользователя
 * Для пациентов - находим по email/phone, затем получаем clinicId из найденного пациента
 * Для врачей/админов - используем patientId из query параметров и clinicId из токена
 * @returns {Promise<{patientId: string|null, clinicId: string|null}>}
 */
async function getPatientIdAndClinicId(req) {
  try {
    // Проверяем наличие req.user
    if (!req.user) {
      console.error('🔴 [NOTIFICATION] req.user не определен');
      return { patientId: null, clinicId: null };
    }

    if (req.user.role === 'PATIENT') {
      // Для пациентов находим patientId по email пользователя
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { email: true, phone: true },
      });

      if (!user) {
        console.warn('🔴 [NOTIFICATION] Пользователь не найден:', req.user.userId);
        return { patientId: null, clinicId: null };
      }

      // Ищем пациента по email или phone (без фильтра по clinicId, так как его может не быть в токене)
      const patient = await prisma.patient.findFirst({
        where: {
          OR: [
            { email: user.email },
            { phone: user.phone },
          ],
        },
        orderBy: { createdAt: 'desc' }, // Берем последнего созданного
        select: { id: true, clinicId: true },
      });

      if (patient) {
        console.log('🔵 [NOTIFICATION] PatientId и ClinicId для PATIENT:', { 
          patientId: patient.id, 
          clinicId: patient.clinicId,
          email: user.email, 
          phone: user.phone 
        });
        return { patientId: patient.id, clinicId: patient.clinicId };
      }

      // Если пациент не найден, но есть clinicId в токене, используем его
      if (req.user.clinicId) {
        console.log('⚠️ [NOTIFICATION] Пациент не найден, используем clinicId из токена:', req.user.clinicId);
        return { patientId: req.query.patientId || null, clinicId: req.user.clinicId };
      }

      return { patientId: null, clinicId: null };
    }

    // Для врачей/админов - используем patientId из query параметров и clinicId из токена
    const patientId = req.query.patientId || null;
    const clinicId = req.user.clinicId || null;
    console.log('🔵 [NOTIFICATION] PatientId и ClinicId для', req.user.role, ':', { patientId, clinicId });
    return { patientId, clinicId };
  } catch (error) {
    console.error('🔴 [NOTIFICATION] Ошибка в getPatientIdAndClinicId:', error);
    return { patientId: null, clinicId: null };
  }
}

/**
 * GET /api/v1/notifications
 * Получить список уведомлений пациента
 */
export async function getAll(req, res, next) {
  try {
    console.log('🔵 [NOTIFICATION] GET /notifications', {
      userId: req.user?.userId,
      clinicId: req.user?.clinicId,
      role: req.user?.role,
      query: req.query,
    });

    // Проверяем наличие req.user
    if (!req.user) {
      console.error('🔴 [NOTIFICATION] req.user отсутствует');
      return res.status(400).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { isRead, type, page, limit } = req.query;
    
    // Получаем patientId и clinicId
    const { patientId, clinicId } = await getPatientIdAndClinicId(req);

    if (!clinicId) {
      console.warn('🔴 [NOTIFICATION] ClinicId не найден');
      return res.status(400).json({
        success: false,
        message: 'Clinic ID is required. For PATIENT role, patient must be registered in a clinic.',
      });
    }

    if (!patientId) {
      console.warn('🔴 [NOTIFICATION] PatientId не найден');
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required. For PATIENT role, patient must be registered in the clinic.',
      });
    }

    console.log('🔵 [NOTIFICATION] Запрос уведомлений:', { clinicId, patientId, isRead, type, page, limit });

    const result = await notificationService.findAll(clinicId, patientId, {
      isRead,
      type,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    console.log('✅ [NOTIFICATION] Уведомления получены:', { count: result.notifications.length, total: result.meta.total });
    successResponse(res, result, 200);
  } catch (error) {
    console.error('🔴 [NOTIFICATION] Ошибка в getAll:', error);
    next(error);
  }
}

/**
 * GET /api/v1/notifications/unread-count
 * Получить количество непрочитанных уведомлений
 */
export async function getUnreadCount(req, res, next) {
  try {
    console.log('🔵 [NOTIFICATION] GET /notifications/unread-count', {
      userId: req.user?.userId,
      clinicId: req.user?.clinicId,
      role: req.user?.role,
    });

    // Проверяем наличие req.user
    if (!req.user) {
      console.error('🔴 [NOTIFICATION] req.user отсутствует');
      return res.status(400).json({
        success: false,
        message: 'User authentication required',
      });
    }

    // Получаем patientId и clinicId
    const { patientId, clinicId } = await getPatientIdAndClinicId(req);

    if (!clinicId) {
      console.warn('🔴 [NOTIFICATION] ClinicId не найден');
      return res.status(400).json({
        success: false,
        message: 'Clinic ID is required. For PATIENT role, patient must be registered in a clinic.',
      });
    }

    if (!patientId) {
      console.warn('🔴 [NOTIFICATION] PatientId не найден');
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required. For PATIENT role, patient must be registered in the clinic.',
      });
    }

    console.log('🔵 [NOTIFICATION] Запрос количества непрочитанных:', { clinicId, patientId });
    const count = await notificationService.getUnreadCount(clinicId, patientId);
    console.log('✅ [NOTIFICATION] Непрочитанных уведомлений:', count);

    successResponse(res, { count }, 200);
  } catch (error) {
    console.error('🔴 [NOTIFICATION] Ошибка в getUnreadCount:', error);
    next(error);
  }
}

/**
 * GET /api/v1/notifications/:id
 * Получить уведомление по ID
 */
export async function getById(req, res, next) {
  try {
    if (!req.user) {
      return res.status(400).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { id } = req.params;
    const { patientId, clinicId } = await getPatientIdAndClinicId(req);

    if (!clinicId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID and Patient ID are required.',
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
    if (!req.user) {
      return res.status(400).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { id } = req.params;
    const { patientId, clinicId } = await getPatientIdAndClinicId(req);

    if (!clinicId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID and Patient ID are required.',
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
    if (!req.user) {
      return res.status(400).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { patientId, clinicId } = await getPatientIdAndClinicId(req);

    if (!clinicId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID and Patient ID are required.',
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
    if (!req.user) {
      return res.status(400).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { id } = req.params;
    const { patientId, clinicId } = await getPatientIdAndClinicId(req);

    if (!clinicId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID and Patient ID are required.',
      });
    }

    await notificationService.remove(clinicId, patientId, id);

    successResponse(res, { message: 'Notification deleted successfully' }, 200);
  } catch (error) {
    next(error);
  }
}

