import { prisma } from '../config/database.js';

/**
 * Notification Service
 * Бизнес-логика для работы с уведомлениями
 */

/**
 * Получить все уведомления пациента
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента
 * @param {object} options - Опции (isRead, type, page, limit)
 * @returns {Promise<object>} { notifications, meta }
 */
export async function findAll(clinicId, patientId, options = {}) {
  const { isRead, type, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Построение where clause
  const where = {
    clinicId, // ВСЕГДА фильтруем по clinicId!
    patientId, // Фильтруем по patientId
  };

  if (isRead !== undefined) {
    where.isRead = isRead === 'true' || isRead === true;
  }

  if (type) {
    where.type = type;
  }

  // Получаем уведомления и общее количество
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Получить уведомление по ID
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента
 * @param {string} notificationId - ID уведомления
 * @returns {Promise<object>} Notification
 */
export async function findById(clinicId, patientId, notificationId) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      clinicId, // ОБЯЗАТЕЛЬНО!
      patientId, // ОБЯЗАТЕЛЬНО!
    },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return notification;
}

/**
 * Создать уведомление
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента
 * @param {object} data - Данные уведомления (type, title, message, appointmentId)
 * @returns {Promise<object>} Созданное уведомление
 */
export async function create(clinicId, patientId, data) {
  // Проверяем что пациент принадлежит клинике
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      clinicId,
    },
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Создаем уведомление
  const notification = await prisma.notification.create({
    data: {
      clinicId, // ОБЯЗАТЕЛЬНО!
      patientId,
      type: data.type || 'other',
      title: data.title,
      message: data.message,
      appointmentId: data.appointmentId || null,
    },
  });

  console.log(`✅ [NOTIFICATION] Создано уведомление ${notification.id} для пациента ${patientId}`);

  return notification;
}

/**
 * Отметить уведомление как прочитанное
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента
 * @param {string} notificationId - ID уведомления
 * @returns {Promise<object>} Обновленное уведомление
 */
export async function markAsRead(clinicId, patientId, notificationId) {
  // Проверяем что уведомление существует
  await findById(clinicId, patientId, notificationId);

  // Обновляем статус
  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  console.log(`✅ [NOTIFICATION] Уведомление ${notificationId} отмечено как прочитанное`);

  return updated;
}

/**
 * Отметить все уведомления пациента как прочитанные
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента
 * @returns {Promise<object>} { count } - количество обновленных уведомлений
 */
export async function markAllAsRead(clinicId, patientId) {
  // Проверяем что пациент принадлежит клинике
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      clinicId,
    },
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Обновляем все непрочитанные уведомления
  const result = await prisma.notification.updateMany({
    where: {
      clinicId,
      patientId,
      isRead: false,
    },
    data: { isRead: true },
  });

  console.log(`✅ [NOTIFICATION] Отмечено ${result.count} уведомлений как прочитанные для пациента ${patientId}`);

  return { count: result.count };
}

/**
 * Получить количество непрочитанных уведомлений
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента
 * @returns {Promise<number>} Количество непрочитанных уведомлений
 */
export async function getUnreadCount(clinicId, patientId) {
  const count = await prisma.notification.count({
    where: {
      clinicId,
      patientId,
      isRead: false,
    },
  });

  return count;
}

/**
 * Удалить уведомление
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента
 * @param {string} notificationId - ID уведомления
 */
export async function remove(clinicId, patientId, notificationId) {
  // Проверяем что уведомление существует
  await findById(clinicId, patientId, notificationId);

  // Удаляем
  await prisma.notification.delete({
    where: { id: notificationId },
  });

  console.log(`✅ [NOTIFICATION] Уведомление ${notificationId} удалено`);
}

