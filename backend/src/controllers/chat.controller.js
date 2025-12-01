import * as chatService from '../services/chat.service.js';
import { successResponse } from '../utils/response.util.js';

/**
 * Chat Controller
 * Обработчики для chat endpoints
 */

/**
 * GET /api/v1/chat/conversations
 * Получить список бесед пользователя
 */
export async function getConversations(req, res, next) {
  try {
    const { page, limit } = req.query;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const userId = req.user.userId;
    const patientId = req.user.patientId; // Теперь patientId приходит напрямую из токена

    // Если это Patient и patientId есть - используем его напрямую
    // Если patientId нет (старый токен или ошибка) - пытаемся найти
    let finalPatientId = patientId;
    if (userRole === 'PATIENT' && !finalPatientId) {
      console.warn('⚠️ [CHAT CONTROLLER] Patient role but no patientId in token, trying to find...');
      // Fallback: пытаемся найти по userId (если это старый токен)
      if (userId) {
        const { prisma } = await import('../config/database.js');
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, phone: true },
        });

        if (currentUser) {
          const where = {
            OR: [
              { email: currentUser.email },
              { phone: currentUser.phone || '' },
            ],
          };
          
          if (clinicId) {
            where.clinicId = clinicId;
          }
          
          const patient = await prisma.patient.findFirst({
            where,
            orderBy: { createdAt: 'desc' },
          });
          
          finalPatientId = patient?.id;
        }
      }
    }

    const result = await chatService.getConversations(
      clinicId,
      userRole,
      userId,
      finalPatientId,
      {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
      }
    );

    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/chat/conversations/:id
 * Получить беседу по ID
 */
export async function getConversation(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const userId = req.user.userId;
    const patientId = req.user.patientId; // Теперь patientId приходит напрямую из токена

    // Если это Patient и patientId есть - используем его напрямую
    let finalPatientId = patientId;
    if (userRole === 'PATIENT' && !finalPatientId) {
      // Fallback для старых токенов
      if (userId) {
        const { prisma } = await import('../config/database.js');
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, phone: true },
        });

        if (currentUser) {
          const where = {
            OR: [
              { email: currentUser.email },
              { phone: currentUser.phone || '' },
            ],
          };
          
          if (clinicId) {
            where.clinicId = clinicId;
          }
          
          const patient = await prisma.patient.findFirst({
            where,
            orderBy: { createdAt: 'desc' },
          });
          finalPatientId = patient?.id;
        }
      }
    }

    const conversation = await chatService.getConversationById(
      id,
      clinicId,
      userRole,
      userId,
      finalPatientId
    );

    successResponse(res, conversation, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/chat/messages/:conversationId
 * Получить сообщения беседы
 */
export async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const { page, limit, before } = req.query;
    const clinicId = req.user.clinicId;

    const result = await chatService.getMessages(conversationId, clinicId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      before: before ? new Date(before) : null,
    });

    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/chat/messages
 * Отправить сообщение
 */
export async function sendMessage(req, res, next) {
  try {
    const { conversationId, patientId, userId, content, imageUrl } = req.body;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const senderId = req.user.userId;
    // Определяем senderType: для ADMIN/CLINIC всегда 'clinic', чтобы сообщения появлялись от клиники
    const senderType = 
      userRole === 'PATIENT' ? 'patient' : 
      userRole === 'DOCTOR' ? 'doctor' : 
      'clinic'; // ADMIN, CLINIC отправляют как 'clinic'

    let message;
    let conversation;

    // Если conversationId указан, отправляем в существующую беседу
    if (conversationId) {
      message = await chatService.sendMessage(
        conversationId,
        senderId,
        senderType,
        content,
        clinicId,
        imageUrl
      );
      conversation = await chatService.getConversationById(
        conversationId,
        clinicId,
        userRole,
        senderId
      );
    } else {
      // Создаем новую беседу
      // Для пациентов нужно найти или создать patientId
      let finalPatientId = patientId;
      let finalClinicId = clinicId; // Объявляем вне блока для использования позже
      
      if (userRole === 'PATIENT' && !finalPatientId) {
        // Используем findOrCreatePatient для автоматического создания, если пациента нет
        const patientService = await import('../services/patient.service.js');
        const { prisma } = await import('../config/database.js');
        
        // Получаем полные данные пользователя из базы
        const currentUser = await prisma.user.findUnique({
          where: { id: senderId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            clinicId: true,
          },
        });

        if (!currentUser) {
          throw new Error('USER_NOT_FOUND');
        }

        // Если clinicId null, пытаемся найти его из User
        finalClinicId = clinicId || currentUser.clinicId;

        // Если clinicId все еще null, ищем через Patient по email/phone
        if (!finalClinicId) {
          const existingPatient = await prisma.patient.findFirst({
            where: {
              OR: [
                { email: currentUser.email },
                { phone: currentUser.phone || '' },
              ],
            },
            select: { clinicId: true },
          });
          finalClinicId = existingPatient?.clinicId;
        }

        if (!finalClinicId) {
          throw new Error('CLINIC_NOT_FOUND');
        }

        // Находим или создаем пациента
        // Убеждаемся, что name не пустой
        const patientName = currentUser.name || currentUser.email?.split('@')[0] || 'Patient';
        const patientPhone = currentUser.phone || '';
        const patientEmail = currentUser.email || null;

        if (!patientName || patientName.trim() === '') {
          throw new Error('PATIENT_NAME_REQUIRED');
        }

        console.log('🔵 [CHAT CONTROLLER] Создание/поиск пациента:', {
          clinicId: finalClinicId,
          name: patientName.trim(),
          phone: patientPhone,
          email: patientEmail,
        });

        const patient = await patientService.findOrCreatePatient(finalClinicId, {
          name: patientName.trim(),
          phone: patientPhone,
          email: patientEmail,
        });
        finalPatientId = patient.id;
        console.log('✅ [CHAT CONTROLLER] Пациент найден/создан:', finalPatientId);
      }

      if (!finalPatientId) {
        throw new Error('PATIENT_NOT_FOUND');
      }

      // Используем finalClinicId, если он был определен
      const finalClinicIdForConversation = finalClinicId || clinicId;
      if (!finalClinicIdForConversation) {
        throw new Error('CLINIC_NOT_FOUND');
      }

      const result = await chatService.createConversationWithMessage(
        finalClinicIdForConversation,
        finalPatientId,
        userId || null,
        senderId,
        senderType,
        content,
        imageUrl
      );
      message = result.message;
      conversation = result.conversation;
    }

    successResponse(
      res,
      {
        message,
        conversation,
      },
      201
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/chat/conversations/:id/read
 * Отметить сообщения как прочитанные
 */
export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const userId = req.user.userId;

    const count = await chatService.markAsRead(id, userId, userRole, clinicId);

    successResponse(
      res,
      {
        conversationId: id,
        readCount: count,
      },
      200
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/chat/unread-count
 * Получить количество непрочитанных сообщений
 */
export async function getUnreadCount(req, res, next) {
  try {
    const clinicId = req.user.clinicId;
    const userRole = req.user.role;
    const userId = req.user.userId;

    let patientId = null;
    if (userRole === 'PATIENT') {
      const { prisma } = await import('../config/database.js');
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true },
      });

      if (currentUser) {
        // Для PATIENT ищем пациента по email/phone без обязательного фильтра по clinicId
        const where = {
          OR: [
            { email: currentUser.email },
            { phone: currentUser.phone || '' },
          ],
        };
        
        // Если clinicId есть, добавляем его для более точного поиска
        if (clinicId) {
          where.clinicId = clinicId;
        }
        
        const patient = await prisma.patient.findFirst({
          where,
          orderBy: { createdAt: 'desc' },
        });
        patientId = patient?.id;
      }
    }

    const count = await chatService.getUnreadCount(clinicId, userRole, userId, patientId);

    successResponse(
      res,
      {
        unreadCount: count,
      },
      200
    );
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/chat/messages/:id
 * Удалить сообщение
 */
export async function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;
    const senderId = req.user.userId;

    const deletedMessage = await chatService.deleteMessage(id, senderId, clinicId);

    successResponse(
      res,
      {
        message: deletedMessage,
      },
      200
    );
  } catch (error) {
    next(error);
  }
}

