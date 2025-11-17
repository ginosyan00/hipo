import { prisma } from '../config/database.js';

/**
 * Appointment Service
 * Бизнес-логика для работы с приёмами
 */

/**
 * State Machine для статусов
 * Определяет разрешенные переходы между статусами
 */
const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [], // Финальный статус
  cancelled: [], // Финальный статус
};

/**
 * Получить все приёмы клиники
 * @param {string} clinicId - ID клиники
 * @param {object} options - Опции (doctorId, patientId, status, date, page, limit)
 * @returns {Promise<object>} { appointments, meta }
 */
export async function findAll(clinicId, options = {}) {
  const { doctorId, patientId, status, date, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Построение where clause
  const where = {
    clinicId, // ВСЕГДА фильтруем по clinicId!
  };

  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  // Фильтр по дате (весь день)
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    where.appointmentDate = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  // Получаем приёмы и общее количество
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { appointmentDate: 'asc' },
      take: limit,
      skip,
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Получить приём по ID
 * @param {string} clinicId - ID клиники
 * @param {string} appointmentId - ID приёма
 * @returns {Promise<object>} Appointment
 */
export async function findById(clinicId, appointmentId) {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      clinicId, // ОБЯЗАТЕЛЬНО!
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          specialization: true,
          phone: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          dateOfBirth: true,
          gender: true,
          notes: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  return appointment;
}

/**
 * Проверить доступность времени для приёма
 * @param {string} clinicId - ID клиники
 * @param {string} doctorId - ID врача
 * @param {Date} appointmentDate - Дата и время
 * @param {number} duration - Длительность (минуты)
 * @param {string} excludeAppointmentId - ID приёма для исключения (при обновлении)
 * @returns {Promise<boolean>} true если время доступно
 */
async function checkTimeSlotAvailability(
  clinicId,
  doctorId,
  appointmentDate,
  duration,
  excludeAppointmentId = null
) {
  const startTime = new Date(appointmentDate);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  // Ищем конфликтующие приёмы
  const where = {
    clinicId,
    doctorId,
    status: { notIn: ['cancelled'] }, // Игнорируем отмененные
    appointmentDate: {
      lt: endTime, // Начало < наш конец
    },
  };

  // Исключаем текущий приём (при обновлении)
  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  const conflicting = await prisma.appointment.findMany({ where });

  // Проверяем пересечения
  for (const existing of conflicting) {
    const existingStart = new Date(existing.appointmentDate);
    const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000);

    // Проверка пересечения интервалов
    if (startTime < existingEnd && endTime > existingStart) {
      return false;
    }
  }

  return true;
}

/**
 * Создать приём
 * @param {string} clinicId - ID клиники
 * @param {object} data - Данные приёма
 * @returns {Promise<object>} Созданный приём
 */
export async function create(clinicId, data) {
  // Проверяем что врач принадлежит клинике
  const doctor = await prisma.user.findFirst({
    where: {
      id: data.doctorId,
      clinicId,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  if (!doctor) {
    throw new Error('Doctor not found or inactive');
  }

  // Проверяем что пациент принадлежит клинике
  const patient = await prisma.patient.findFirst({
    where: {
      id: data.patientId,
      clinicId,
    },
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Проверяем доступность времени
  const isAvailable = await checkTimeSlotAvailability(
    clinicId,
    data.doctorId,
    data.appointmentDate,
    data.duration || 30
  );

  if (!isAvailable) {
    throw new Error('Time slot is not available. Doctor has another appointment at this time.');
  }

  // Преобразуем registeredAt в Date, если оно передано как строка
  // Сохраняем исходную строку для правильного отображения локального времени клиента
  let registeredAtDate = null;
  let registeredAtOriginalString = null;
  
  if (data.registeredAt) {
    // Сохраняем исходную строку, если она передана
    if (typeof data.registeredAt === 'string') {
      registeredAtOriginalString = data.registeredAt;
    }
    
    registeredAtDate = data.registeredAt instanceof Date 
      ? data.registeredAt 
      : new Date(data.registeredAt);
    
    // Проверяем, что дата валидна
    if (isNaN(registeredAtDate.getTime())) {
      console.warn('⚠️ [APPOINTMENT SERVICE] Некорректная дата registeredAt:', data.registeredAt);
      // Если дата некорректна, используем текущее время
      registeredAtDate = new Date();
      registeredAtOriginalString = null;
    } else {
      console.log('✅ [APPOINTMENT SERVICE] registeredAt успешно преобразован:', registeredAtDate.toISOString());
      if (registeredAtOriginalString) {
        console.log('📝 [APPOINTMENT SERVICE] Сохранена исходная строка времени:', registeredAtOriginalString);
      }
    }
  } else {
    // Если registeredAt не передан, автоматически устанавливаем текущее время
    // Это гарантирует, что время регистрации будет записано для всех записей
    registeredAtDate = new Date();
    console.log('ℹ️ [APPOINTMENT SERVICE] registeredAt не передан, используется текущее время:', registeredAtDate.toISOString());
  }

  // Создаем приём
  // Сохраняем исходную строку времени в notes, если она есть, для правильного отображения
  let notes = data.notes || null;
  if (registeredAtOriginalString && !notes) {
    // Сохраняем исходное время регистрации в notes в формате: "REGISTERED_AT_ORIGINAL: <строка>"
    notes = `REGISTERED_AT_ORIGINAL: ${registeredAtOriginalString}`;
  } else if (registeredAtOriginalString && notes) {
    // Если notes уже есть, добавляем информацию о времени регистрации
    notes = `${notes}\nREGISTERED_AT_ORIGINAL: ${registeredAtOriginalString}`;
  }
  
  const appointment = await prisma.appointment.create({
    data: {
      clinicId, // ОБЯЗАТЕЛЬНО!
      doctorId: data.doctorId,
      patientId: data.patientId,
      appointmentDate: data.appointmentDate,
      duration: data.duration || 30,
      status: 'pending',
      reason: data.reason || null,
      notes: notes,
      registeredAt: registeredAtDate, // Локальное время регистрации от пользователя (в UTC)
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return appointment;
}

/**
 * Обновить приём
 * @param {string} clinicId - ID клиники
 * @param {string} appointmentId - ID приёма
 * @param {object} data - Данные для обновления
 * @returns {Promise<object>} Обновленный приём
 */
export async function update(clinicId, appointmentId, data) {
  // Проверяем что приём существует
  const appointment = await findById(clinicId, appointmentId);

  // Нельзя обновлять завершенные или отмененные приёмы
  if (['completed', 'cancelled'].includes(appointment.status)) {
    throw new Error(`Cannot update ${appointment.status} appointment`);
  }

  // Если обновляется время/врач, проверяем доступность
  if (data.doctorId || data.appointmentDate || data.duration) {
    const doctorId = data.doctorId || appointment.doctorId;
    const appointmentDate = data.appointmentDate || appointment.appointmentDate;
    const duration = data.duration || appointment.duration;

    const isAvailable = await checkTimeSlotAvailability(
      clinicId,
      doctorId,
      appointmentDate,
      duration,
      appointmentId
    );

    if (!isAvailable) {
      throw new Error('Time slot is not available');
    }
  }

  // Обновляем
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Изменить статус приёма
 * @param {string} clinicId - ID клиники
 * @param {string} appointmentId - ID приёма
 * @param {string} newStatus - Новый статус
 * @param {string} userRole - Роль пользователя
 * @returns {Promise<object>} Обновленный приём
 */
export async function updateStatus(clinicId, appointmentId, newStatus, userRole) {
  // Проверяем что приём существует
  const appointment = await findById(clinicId, appointmentId);

  const currentStatus = appointment.status;

  // Проверка разрешенных переходов
  if (!STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
    throw new Error(
      `Cannot change status from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${STATUS_TRANSITIONS[currentStatus].join(', ')}`
    );
  }

  // Проверка прав: только ADMIN, CLINIC или DOCTOR могут переводить в completed
  // Также ADMIN, CLINIC и DOCTOR могут подтверждать и отменять приёмы
  // CLINIC - администратор клиники, имеет те же права что и DOCTOR
  const normalizedRole = userRole?.toUpperCase();
  if (newStatus === 'completed' && !['ADMIN', 'CLINIC', 'DOCTOR'].includes(normalizedRole)) {
    throw new Error('Only admin, clinic or doctor can mark appointment as completed');
  }
  
  // Логируем действие для аудита
  console.log(`✅ [APPOINTMENT STATUS] ${normalizedRole} изменил статус приёма ${appointmentId} с '${currentStatus}' на '${newStatus}'`);

  // Обновляем статус
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: newStatus },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Удалить приём
 * @param {string} clinicId - ID клиники
 * @param {string} appointmentId - ID приёма
 */
export async function remove(clinicId, appointmentId) {
  // Проверяем что приём существует
  await findById(clinicId, appointmentId);

  // Удаляем
  await prisma.appointment.delete({
    where: { id: appointmentId },
  });
}

