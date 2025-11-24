import { prisma } from '../config/database.js';

/**
 * Notification Service
 * Бизнес-логика для работы с уведомлениями
 */

/**
 * Получить все уведомления пациента или врача
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента (опционально)
 * @param {string} userId - ID пользователя/врача (опционально)
 * @param {object} options - Опции (isRead, type, page, limit)
 * @returns {Promise<object>} { notifications, meta }
 */
export async function findAll(clinicId, patientId = null, userId = null, options = {}) {
  // Валидация входных параметров
  if (!clinicId) {
    throw new Error('Clinic ID is required');
  }
  if (!patientId && !userId) {
    throw new Error('Patient ID or User ID is required');
  }

  const { isRead, type, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Построение where clause
  const where = {
    clinicId, // ВСЕГДА фильтруем по clinicId!
  };

  // Фильтруем по patientId или userId
  if (patientId) {
    where.patientId = patientId;
  }
  if (userId) {
    where.userId = userId;
  }

  if (isRead !== undefined) {
    where.isRead = isRead === 'true' || isRead === true;
  }

  if (type) {
    where.type = type;
  }

  console.log('🔵 [NOTIFICATION SERVICE] findAll запрос:', { where, skip, limit });

  // Получаем уведомления и общее количество
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  console.log('✅ [NOTIFICATION SERVICE] findAll результат:', { count: notifications.length, total });

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
 * @param {string} patientId - ID пациента (опционально)
 * @param {string} userId - ID пользователя/врача (опционально)
 * @param {string} notificationId - ID уведомления
 * @returns {Promise<object>} Notification
 */
export async function findById(clinicId, patientId, userId, notificationId) {
  const where = {
    id: notificationId,
    clinicId, // ОБЯЗАТЕЛЬНО!
  };

  if (patientId) {
    where.patientId = patientId;
  }
  if (userId) {
    where.userId = userId;
  }

  const notification = await prisma.notification.findFirst({
    where,
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return notification;
}

/**
 * Создать уведомление для пациента
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
      userId: null,
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
 * Создать уведомление для врача
 * @param {string} clinicId - ID клиники
 * @param {string} userId - ID врача
 * @param {object} data - Данные уведомления (type, title, message, appointmentId)
 * @returns {Promise<object>} Созданное уведомление
 */
export async function createForDoctor(clinicId, userId, data) {
  // Проверяем что врач принадлежит клинике
  const doctor = await prisma.user.findFirst({
    where: {
      id: userId,
      clinicId,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  if (!doctor) {
    throw new Error('Doctor not found or inactive');
  }

  // Создаем уведомление
  const notification = await prisma.notification.create({
    data: {
      clinicId, // ОБЯЗАТЕЛЬНО!
      patientId: null,
      userId,
      type: data.type || 'new_appointment',
      title: data.title,
      message: data.message,
      appointmentId: data.appointmentId || null,
    },
  });

  console.log(`✅ [NOTIFICATION] Создано уведомление ${notification.id} для врача ${userId}`);

  return notification;
}

/**
 * Создать уведомление для администратора клиники
 * @param {string} clinicId - ID клиники
 * @param {object} data - Данные уведомления (type, title, message, appointmentId)
 * @returns {Promise<object>} Созданное уведомление
 */
export async function createForAdmin(clinicId, data) {
  console.log(`🔵 [NOTIFICATION] Поиск администратора для клиники ${clinicId}`);
  
  // Находим администратора клиники (ADMIN или CLINIC роль)
  const admin = await prisma.user.findFirst({
    where: {
      clinicId,
      role: { in: ['ADMIN', 'CLINIC'] },
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'asc' }, // Берем первого созданного (основного администратора)
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!admin) {
    // Попробуем найти любого пользователя с ролью ADMIN или CLINIC (даже если статус не ACTIVE)
    const anyAdmin = await prisma.user.findFirst({
      where: {
        clinicId,
        role: { in: ['ADMIN', 'CLINIC'] },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (anyAdmin) {
      console.warn(`⚠️ [NOTIFICATION] Найден администратор ${anyAdmin.id}, но статус ${anyAdmin.status} (не ACTIVE). Создаем уведомление все равно.`);
      // Создаем уведомление даже если статус не ACTIVE
      const notification = await prisma.notification.create({
        data: {
          clinicId,
          patientId: null,
          userId: anyAdmin.id,
          type: data.type || 'new_appointment',
          title: data.title,
          message: data.message,
          appointmentId: data.appointmentId || null,
        },
      });
      console.log(`✅ [NOTIFICATION] Создано уведомление ${notification.id} для администратора ${anyAdmin.id} (${anyAdmin.status}) клиники ${clinicId}`);
      return notification;
    }

    console.error(`🔴 [NOTIFICATION] Администратор не найден для клиники ${clinicId}. Проверьте, что в клинике есть пользователь с ролью ADMIN или CLINIC.`);
    return null;
  }

  console.log(`✅ [NOTIFICATION] Найден администратор: ${admin.id} (${admin.name}, ${admin.email}, ${admin.role})`);

  // Создаем уведомление
  const notification = await prisma.notification.create({
    data: {
      clinicId, // ОБЯЗАТЕЛЬНО!
      patientId: null,
      userId: admin.id,
      type: data.type || 'new_appointment',
      title: data.title,
      message: data.message,
      appointmentId: data.appointmentId || null,
    },
  });

  console.log(`✅ [NOTIFICATION] Создано уведомление ${notification.id} для администратора ${admin.id} (${admin.name}) клиники ${clinicId}`);
  console.log(`📋 [NOTIFICATION] Текст уведомления: "${data.title}" - "${data.message}"`);

  return notification;
}

/**
 * Отметить уведомление как прочитанное
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента (опционально)
 * @param {string} userId - ID пользователя/врача (опционально)
 * @param {string} notificationId - ID уведомления
 * @returns {Promise<object>} Обновленное уведомление
 */
export async function markAsRead(clinicId, patientId, userId, notificationId) {
  // Проверяем что уведомление существует
  await findById(clinicId, patientId, userId, notificationId);

  // Обновляем статус
  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  console.log(`✅ [NOTIFICATION] Уведомление ${notificationId} отмечено как прочитанное`);

  return updated;
}

/**
 * Отметить все уведомления пациента или врача как прочитанные
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента (опционально)
 * @param {string} userId - ID пользователя/врача (опционально)
 * @returns {Promise<object>} { count } - количество обновленных уведомлений
 */
export async function markAllAsRead(clinicId, patientId, userId) {
  const where = {
    clinicId,
    isRead: false,
  };

  if (patientId) {
    where.patientId = patientId;
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
  }

  if (userId) {
    where.userId = userId;
    // Проверяем что врач принадлежит клинике
    const doctor = await prisma.user.findFirst({
      where: {
        id: userId,
        clinicId,
        role: 'DOCTOR',
      },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }
  }

  // Обновляем все непрочитанные уведомления
  const result = await prisma.notification.updateMany({
    where,
    data: { isRead: true },
  });

  const target = patientId ? `пациента ${patientId}` : `врача ${userId}`;
  console.log(`✅ [NOTIFICATION] Отмечено ${result.count} уведомлений как прочитанные для ${target}`);

  return { count: result.count };
}

/**
 * Получить количество непрочитанных уведомлений
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента (опционально)
 * @param {string} userId - ID пользователя/врача (опционально)
 * @returns {Promise<number>} Количество непрочитанных уведомлений
 */
export async function getUnreadCount(clinicId, patientId = null, userId = null) {
  // Валидация входных параметров
  if (!clinicId) {
    throw new Error('Clinic ID is required');
  }
  if (!patientId && !userId) {
    throw new Error('Patient ID or User ID is required');
  }

  const where = {
    clinicId,
    isRead: false,
  };

  if (patientId) {
    where.patientId = patientId;
  }
  if (userId) {
    where.userId = userId;
  }

  console.log('🔵 [NOTIFICATION SERVICE] getUnreadCount запрос:', { clinicId, patientId, userId });

  const count = await prisma.notification.count({ where });

  console.log('✅ [NOTIFICATION SERVICE] getUnreadCount результат:', count);

  return count;
}

/**
 * Удалить уведомление
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента (опционально)
 * @param {string} userId - ID пользователя/врача (опционально)
 * @param {string} notificationId - ID уведомления
 */
export async function remove(clinicId, patientId, userId, notificationId) {
  // Проверяем что уведомление существует
  await findById(clinicId, patientId, userId, notificationId);

  // Удаляем
  await prisma.notification.delete({
    where: { id: notificationId },
  });

  console.log(`✅ [NOTIFICATION] Уведомление ${notificationId} удалено`);
}

