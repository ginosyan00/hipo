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
 * Получить начало недели по ISO номеру недели
 * @param {number} year - Год
 * @param {number} week - Номер недели (1-53)
 * @returns {Date} Дата начала недели (понедельник)
 */
function getWeekStart(year, week) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
}

/**
 * Получить все приёмы клиники
 * @param {string} clinicId - ID клиники
 * @param {object} options - Опции (doctorId, patientId, status, date, time, week, category, page, limit)
 * @returns {Promise<object>} { appointments, meta }
 */
export async function findAll(clinicId, options = {}) {
  const { doctorId, patientId, status, date, time, week, category, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Построение where clause
  const where = {
    clinicId, // ВСЕГДА фильтруем по clinicId!
  };

  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  // Фильтр по категории (reason) - для SQLite используем contains
  if (category) {
    where.reason = {
      contains: category,
    };
  }

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

  // Фильтр по неделе
  if (week) {
    // week может быть в формате "YYYY-WW" или датой начала недели
    let weekStart, weekEnd;
    
    if (week.includes('-W')) {
      // Формат "YYYY-WW" (ISO week)
      const [year, weekNum] = week.split('-W').map(Number);
      weekStart = getWeekStart(year, weekNum);
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
    } else {
      // Формат даты начала недели
      weekStart = new Date(week);
      weekStart.setHours(0, 0, 0, 0);
      // Устанавливаем на понедельник
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
    }

    where.appointmentDate = {
      gte: weekStart,
      lte: weekEnd,
    };
  }

  // Фильтр по времени (часы) - применяется после фильтра по дате/неделе
  // Для SQLite фильтруем через Prisma, который поддерживает фильтрацию по времени в дате
  if (time) {
    // time может быть в формате "HH" или "HH:MM"
    const [hours, minutes = 0] = time.split(':').map(Number);
    
    // Если уже есть фильтр по дате/неделе, уточняем его временем
    if (where.appointmentDate) {
      const existingGte = where.appointmentDate.gte;
      const existingLte = where.appointmentDate.lte;
      
      // Устанавливаем время начала и конца для фильтра
      if (existingGte) {
        existingGte.setHours(hours, minutes, 0, 0);
      }
      if (existingLte) {
        // Для фильтра по времени устанавливаем конец часа
        existingLte.setHours(hours, 59, 59, 999);
      }
    } else {
      // Если нет фильтра по дате, создаем фильтр только по времени (сегодня)
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(hours, 59, 59, 999);
      
      where.appointmentDate = {
        gte: today,
        lte: todayEnd,
      };
    }
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
      amount: data.amount || null,
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

  // Для завершенных приёмов разрешаем обновлять только amount (цену)
  if (appointment.status === 'completed') {
    const allowedFields = ['amount'];
    const updateFields = Object.keys(data);
    const hasOnlyAmount = updateFields.length === 1 && updateFields.includes('amount');
    
    if (!hasOnlyAmount) {
      throw new Error('For completed appointments, only amount can be updated');
    }
    
    // Валидация amount
    if (data.amount !== null && data.amount !== undefined) {
      if (typeof data.amount !== 'number' || data.amount < 0) {
        throw new Error('Amount must be a positive number');
      }
    }
    
    // Обновляем только amount
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { amount: data.amount },
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
    
    console.log(`✅ [APPOINTMENT UPDATE] Сумма приёма ${appointmentId} обновлена на ${data.amount}`);
    return updated;
  }

  // Нельзя обновлять отмененные приёмы
  if (appointment.status === 'cancelled') {
    throw new Error('Cannot update cancelled appointment');
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
 * @param {number} amount - Сумма оплаты (опционально, для статуса completed)
 * @param {string} cancellationReason - Причина отмены (обязательно при статусе cancelled)
 * @param {Date} suggestedNewDate - Предложенное новое время (опционально при отмене)
 * @returns {Promise<object>} Обновленный приём
 */
export async function updateStatus(
  clinicId, 
  appointmentId, 
  newStatus, 
  userRole, 
  amount = null,
  cancellationReason = null,
  suggestedNewDate = null
) {
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

  // Валидация: при отмене обязательно должна быть указана причина
  if (newStatus === 'cancelled' && !cancellationReason) {
    throw new Error('Cancellation reason is required when cancelling an appointment');
  }

  // Валидация amount: если переходит в completed, amount должен быть положительным числом
  if (newStatus === 'completed' && amount !== null && amount !== undefined) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a positive number');
    }
  }
  
  // Логируем действие для аудита
  const amountLog = amount !== null && amount !== undefined ? ` с суммой ${amount}` : '';
  const reasonLog = cancellationReason ? ` (причина: ${cancellationReason})` : '';
  console.log(`✅ [APPOINTMENT STATUS] ${normalizedRole} изменил статус приёма ${appointmentId} с '${currentStatus}' на '${newStatus}'${amountLog}${reasonLog}`);

  // Подготавливаем данные для обновления
  const updateData = { status: newStatus };
  
  // Если переходим в completed и передана сумма, сохраняем её
  if (newStatus === 'completed' && amount !== null && amount !== undefined) {
    updateData.amount = amount;
  }

  // Если отменяем, сохраняем причину и предложенное новое время
  if (newStatus === 'cancelled') {
    updateData.cancellationReason = cancellationReason;
    if (suggestedNewDate) {
      updateData.suggestedNewDate = suggestedNewDate instanceof Date 
        ? suggestedNewDate 
        : new Date(suggestedNewDate);
    }
  }

  // Обновляем статус (и дополнительные данные, если указаны)
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: updateData,
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
  });

  // Если приём отменён, создаём уведомление для пациента
  if (newStatus === 'cancelled') {
    try {
      const { create } = await import('./notification.service.js');
      
      // Формируем сообщение уведомления
      const appointmentDate = new Date(appointment.appointmentDate);
      const formattedDate = appointmentDate.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      let message = `Ваш приём на ${formattedDate} был отменён.\n\nПричина: ${cancellationReason}`;
      
      if (suggestedNewDate) {
        const suggestedDate = new Date(suggestedNewDate);
        const formattedSuggestedDate = suggestedDate.toLocaleString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        message += `\n\nПредложенное новое время: ${formattedSuggestedDate}`;
      }

      await create(clinicId, appointment.patient.id, {
        type: 'cancellation',
        title: 'Приём отменён',
        message: message,
        appointmentId: appointmentId,
      });

      console.log(`✅ [NOTIFICATION] Создано уведомление об отмене для пациента ${appointment.patient.id}`);
    } catch (error) {
      // Логируем ошибку, но не прерываем процесс отмены
      console.error(`❌ [NOTIFICATION] Ошибка создания уведомления об отмене:`, error);
    }
  }

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

