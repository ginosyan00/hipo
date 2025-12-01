import * as notificationService from '../services/notification.service.js';
import { successResponse } from '../utils/response.util.js';
import { prisma } from '../config/database.js';

/**
 * Notification Controller
 * Обработчики для notification endpoints
 */

/**
 * Получить patientId, userId и clinicId для пользователя
 * Для пациентов - находим по email/phone, затем получаем clinicId из найденного пациента
 * Для врачей - используем userId из токена и clinicId из токена
 * Для админов - используем patientId или userId из query параметров и clinicId из токена
 * @returns {Promise<{patientId: string|null, userId: string|null, clinicId: string|null}>}
 */
async function getPatientIdUserIdAndClinicId(req) {
  try {
    // Проверяем наличие req.user
    if (!req.user) {
      console.error('🔴 [NOTIFICATION] req.user не определен');
      return { patientId: null, userId: null, clinicId: null };
    }

    if (req.user.role === 'PATIENT') {
      // Для пациентов patientId теперь приходит напрямую из токена
      if (req.user.patientId) {
        return { 
          patientId: req.user.patientId, 
          userId: null, 
          clinicId: req.user.clinicId 
        };
      }

      // Fallback для старых токенов: ищем по userId
      if (req.user.userId) {
        const user = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { email: true, phone: true },
        });

        if (user) {
          // Ищем пациента по email или phone
          const patient = await prisma.patient.findFirst({
            where: {
              OR: [
                { email: user.email },
                { phone: user.phone },
              ],
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, clinicId: true },
          });

          if (patient) {
            console.log('🔵 [NOTIFICATION] PatientId и ClinicId для PATIENT:', { 
              patientId: patient.id, 
              clinicId: patient.clinicId,
              email: user.email, 
              phone: user.phone 
            });
            return { patientId: patient.id, userId: null, clinicId: patient.clinicId };
          }

          // Если пациент не найден в таблице Patient, но есть clinicId в токене
          // Это нормальная ситуация - пользователь может быть зарегистрирован как User,
          // но еще не создал запись в таблице Patient
          if (req.user.clinicId) {
            console.log('🔵 [NOTIFICATION] Пациент не найден в таблице Patient, используем clinicId из токена:', req.user.clinicId);
            return { patientId: null, userId: null, clinicId: req.user.clinicId };
          }

          // Если нет ни patientId, ни clinicId, возвращаем null
          // Это нормальная ситуация для нового PATIENT пользователя, который еще не записался к клинике
          return { patientId: null, userId: null, clinicId: null };
        }
      }
    }

    if (req.user.role === 'DOCTOR') {
      // Для врачей - используем userId из токена и clinicId из токена
      const clinicId = req.user.clinicId || null;
      const userId = req.user.userId || null;
      console.log('🔵 [NOTIFICATION] UserId и ClinicId для DOCTOR:', { userId, clinicId });
      return { patientId: null, userId, clinicId };
    }

    // Для администраторов (ADMIN/CLINIC) - используем userId из токена для загрузки их уведомлений
    // Если в query есть patientId или userId, используем их (для просмотра уведомлений других пользователей)
    if (req.user.role === 'ADMIN' || req.user.role === 'CLINIC') {
      const clinicId = req.user.clinicId || null;
      // По умолчанию используем userId из токена (уведомления самого администратора)
      // Но если в query есть userId или patientId, используем их (для просмотра уведомлений других)
      const userId = req.query.userId || req.user.userId || null;
      const patientId = req.query.patientId || null;
      console.log('🔵 [NOTIFICATION] PatientId, UserId и ClinicId для', req.user.role, ':', { 
        patientId, 
        userId, 
        clinicId,
        fromToken: req.user.userId,
        fromQuery: req.query.userId 
      });
      return { patientId, userId, clinicId };
    }

    // Для других ролей - используем patientId или userId из query параметров и clinicId из токена
    const patientId = req.query.patientId || null;
    const userId = req.query.userId || null;
    const clinicId = req.user.clinicId || null;
    console.log('🔵 [NOTIFICATION] PatientId, UserId и ClinicId для', req.user.role, ':', { patientId, userId, clinicId });
    return { patientId, userId, clinicId };
  } catch (error) {
    console.error('🔴 [NOTIFICATION] Ошибка в getPatientIdUserIdAndClinicId:', error);
    return { patientId: null, userId: null, clinicId: null };
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
    
    // Получаем patientId, userId и clinicId
    const { patientId, userId, clinicId } = await getPatientIdUserIdAndClinicId(req);

    // Если clinicId не найден, возвращаем пустой список
    // Это нормальная ситуация для нового PATIENT пользователя
    if (!clinicId) {
      return successResponse(res, {
        notifications: [],
        meta: {
          total: 0,
          page: page ? parseInt(page) : 1,
          limit: limit ? parseInt(limit) : 20,
          totalPages: 0,
        },
      }, 200);
    }

    // Если patientId и userId не найдены, возвращаем пустой список
    // Это может произойти, если пользователь еще не создал запись в таблице Patient
    if (!patientId && !userId) {
      return successResponse(res, {
        notifications: [],
        meta: {
          total: 0,
          page: page ? parseInt(page) : 1,
          limit: limit ? parseInt(limit) : 20,
          totalPages: 0,
        },
      }, 200);
    }

    console.log('🔵 [NOTIFICATION] Запрос уведомлений:', { clinicId, patientId, userId, isRead, type, page, limit });

    const result = await notificationService.findAll(clinicId, patientId, userId, {
      isRead,
      type,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    console.log('✅ [NOTIFICATION] Уведомления получены:', { count: result.notifications.length, total: result.meta.total });
    successResponse(res, result, 200);
  } catch (error) {
    console.error('🔴 [NOTIFICATION] Ошибка в getAll:', error);
    // В случае ошибки возвращаем пустой список вместо ошибки, чтобы не ломать UI
    console.warn('⚠️ [NOTIFICATION] Возвращаем пустой список из-за ошибки');
    return successResponse(res, {
      notifications: [],
      meta: {
        total: 0,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        totalPages: 0,
      },
    }, 200);
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

    // Получаем patientId, userId и clinicId
    const { patientId, userId, clinicId } = await getPatientIdUserIdAndClinicId(req);

    // Если clinicId не найден, возвращаем 0 (нет уведомлений)
    // Это нормальная ситуация для нового PATIENT пользователя
    if (!clinicId) {
      return successResponse(res, { count: 0 }, 200);
    }

    // Если patientId и userId не найдены, возвращаем 0 (нет уведомлений)
    // Это может произойти, если пользователь еще не создал запись в таблице Patient
    if (!patientId && !userId) {
      return successResponse(res, { count: 0 }, 200);
    }

    console.log('🔵 [NOTIFICATION] Запрос количества непрочитанных:', { clinicId, patientId, userId });
    const count = await notificationService.getUnreadCount(clinicId, patientId, userId);
    console.log('✅ [NOTIFICATION] Непрочитанных уведомлений:', count);

    successResponse(res, { count }, 200);
  } catch (error) {
    console.error('🔴 [NOTIFICATION] Ошибка в getUnreadCount:', error);
    // В случае ошибки возвращаем 0 вместо ошибки, чтобы не ломать UI
    console.warn('⚠️ [NOTIFICATION] Возвращаем 0 из-за ошибки');
    return successResponse(res, { count: 0 }, 200);
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
    const { patientId, userId, clinicId } = await getPatientIdUserIdAndClinicId(req);

    if (!clinicId || (!patientId && !userId)) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID and (Patient ID or User ID) are required.',
      });
    }

    const notification = await notificationService.findById(clinicId, patientId, userId, id);

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
    const { patientId, userId, clinicId } = await getPatientIdUserIdAndClinicId(req);

    if (!clinicId || (!patientId && !userId)) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID and (Patient ID or User ID) are required.',
      });
    }

    const notification = await notificationService.markAsRead(clinicId, patientId, userId, id);

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

    const { patientId, userId, clinicId } = await getPatientIdUserIdAndClinicId(req);

    if (!clinicId || (!patientId && !userId)) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID and (Patient ID or User ID) are required.',
      });
    }

    const result = await notificationService.markAllAsRead(clinicId, patientId, userId);

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
    const { patientId, userId, clinicId } = await getPatientIdUserIdAndClinicId(req);

    if (!clinicId || (!patientId && !userId)) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID and (Patient ID or User ID) are required.',
      });
    }

    await notificationService.remove(clinicId, patientId, userId, id);

    successResponse(res, { message: 'Notification deleted successfully' }, 200);
  } catch (error) {
    next(error);
  }
}

