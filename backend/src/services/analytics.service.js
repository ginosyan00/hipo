import { prisma } from '../config/database.js';

/**
 * Analytics Service
 * Бизнес-логика для аналитики клиники
 */

/**
 * Построить where clause для фильтров
 * @param {string} clinicId - ID клиники
 * @param {object} filters - Фильтры (doctorId, dateFrom, dateTo, week, category)
 * @returns {object} where clause для Prisma
 */
function buildWhereClause(clinicId, filters = {}) {
  const { doctorId, dateFrom, dateTo, week, category } = filters;

  const where = {
    clinicId, // ВСЕГДА фильтруем по clinicId!
  };

  if (doctorId) where.doctorId = doctorId;
  if (category) where.reason = { contains: category };

  // Фильтр по датам
  if (dateFrom || dateTo || week) {
    where.appointmentDate = {};

    if (week) {
      // Формат "YYYY-WW" (ISO week)
      if (week.includes('-W')) {
        const [year, weekNum] = week.split('-W').map(Number);
        const weekStart = getWeekStart(year, weekNum);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        where.appointmentDate.gte = weekStart;
        where.appointmentDate.lte = weekEnd;
      } else {
        // Формат даты начала недели
        const weekStart = new Date(week);
        weekStart.setHours(0, 0, 0, 0);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        where.appointmentDate.gte = weekStart;
        where.appointmentDate.lte = weekEnd;
      }
    } else {
      if (dateFrom) {
        const startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0);
        where.appointmentDate.gte = startDate;
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.appointmentDate.lte = endDate;
      }
    }
  }

  return where;
}

/**
 * Получить начало недели по ISO году и номеру недели
 * @param {number} year - Год
 * @param {number} week - Номер недели (1-53)
 * @returns {Date} Дата начала недели
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
 * Получить общие метрики клиники
 * @param {string} clinicId - ID клиники
 * @param {object} filters - Фильтры (doctorId, dateFrom, dateTo, week, category)
 * @returns {Promise<object>} Метрики клиники
 */
export async function getSummary(clinicId, filters = {}) {
  console.log('📊 [ANALYTICS SERVICE] Получение summary для клиники:', clinicId);
  console.log('📊 [ANALYTICS SERVICE] Фильтры:', filters);

  try {
    // Построить where clause для appointments
    const appointmentWhere = buildWhereClause(clinicId, filters);

    // 1. Общее количество пациентов клиники (уникальные по телефону)
    const allPatients = await prisma.patient.findMany({
      where: { clinicId },
      select: { id: true, phone: true, email: true, createdAt: true },
    });

    // Дедупликация по телефону/email
    const uniquePatientsMap = new Map();
    for (const patient of allPatients) {
      const key = patient.phone || patient.email || patient.id;
      if (!uniquePatientsMap.has(key)) {
        uniquePatientsMap.set(key, patient);
      } else {
        const existing = uniquePatientsMap.get(key);
        if (new Date(patient.createdAt) > new Date(existing.createdAt)) {
          uniquePatientsMap.set(key, patient);
        }
      }
    }
    const totalPatients = uniquePatientsMap.size;

    // 2. Общее количество врачей (активных)
    const totalDoctors = await prisma.user.count({
      where: {
        clinicId,
        role: 'DOCTOR',
        status: 'ACTIVE',
      },
    });

    // 3. Количество завершенных услуг (appointments со status='completed')
    const completedWhere = {
      ...appointmentWhere,
      status: 'completed',
    };

    const totalCompletedServices = await prisma.appointment.count({
      where: completedWhere,
    });

    // 4. Общая сумма доходов (сумма amount всех completed appointments)
    const completedAppointments = await prisma.appointment.findMany({
      where: completedWhere,
      select: { amount: true },
    });

    const totalRevenue = completedAppointments.reduce((sum, apt) => {
      return sum + (apt.amount || 0);
    }, 0);

    // 5. Общее количество назначений (все статусы)
    const totalAppointments = await prisma.appointment.count({
      where: appointmentWhere,
    });

    // 6. Количество подтвержденных назначений
    const confirmedAppointments = await prisma.appointment.count({
      where: {
        ...appointmentWhere,
        status: 'confirmed',
      },
    });

    // 7. Количество отмененных назначений
    const cancelledAppointments = await prisma.appointment.count({
      where: {
        ...appointmentWhere,
        status: 'cancelled',
      },
    });

    // 8. Средняя сумма за услугу
    const averageRevenue = totalCompletedServices > 0
      ? totalRevenue / totalCompletedServices
      : 0;

    const summary = {
      totalPatients,
      totalDoctors,
      totalCompletedServices,
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Округляем до 2 знаков
      totalAppointments,
      confirmedAppointments,
      cancelledAppointments,
      averageRevenue: Math.round(averageRevenue * 100) / 100,
    };

    console.log('📊 [ANALYTICS SERVICE] Summary получен:', summary);

    return summary;
  } catch (error) {
    console.error('❌ [ANALYTICS SERVICE] Ошибка получения summary:', error);
    throw error;
  }
}

/**
 * Получить данные для графиков
 * @param {string} clinicId - ID клиники
 * @param {object} filters - Фильтры (doctorId, dateFrom, dateTo, week, category)
 * @param {string} type - Тип графика: 'daily' | 'weekly' | 'monthly' | 'byDoctor' | 'byCategory' | 'byStatus'
 * @returns {Promise<object>} Данные для графика { labels, datasets }
 */
export async function getChartData(clinicId, filters = {}, type = 'monthly') {
  console.log('📊 [ANALYTICS SERVICE] Получение chart data:', { clinicId, filters, type });

  try {
    const appointmentWhere = buildWhereClause(clinicId, filters);

    let labels = [];
    let datasets = [];

    switch (type) {
      case 'daily': {
        // График по дням (последние 30 дней)
        const endDate = filters.dateTo ? new Date(filters.dateTo) : new Date();
        const startDate = filters.dateFrom
          ? new Date(filters.dateFrom)
          : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Генерируем массив дат
        const dates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        labels = dates.map(date => {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          return `${day}.${month}`;
        });

        // Получаем данные по дням
        const appointmentsByDay = await Promise.all(
          dates.map(async (date) => {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const count = await prisma.appointment.count({
              where: {
                ...appointmentWhere,
                appointmentDate: {
                  gte: dayStart,
                  lte: dayEnd,
                },
              },
            });

            return count;
          })
        );

        datasets = [
          {
            label: 'Назначений',
            data: appointmentsByDay,
            borderColor: '#3A6FF8',
            backgroundColor: 'rgba(58, 111, 248, 0.1)',
            tension: 0.4,
          },
        ];
        break;
      }

      case 'weekly': {
        // График по неделям (последние 12 недель)
        const endDate = filters.dateTo ? new Date(filters.dateTo) : new Date();
        const weeks = [];

        for (let i = 11; i >= 0; i--) {
          const weekDate = new Date(endDate);
          weekDate.setDate(weekDate.getDate() - i * 7);
          const weekStart = new Date(weekDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          weeks.push({ start: weekStart, end: weekEnd });
        }

        labels = weeks.map((week, index) => {
          const weekNum = 12 - index;
          const day = String(week.start.getDate()).padStart(2, '0');
          const month = String(week.start.getMonth() + 1).padStart(2, '0');
          return `Неделя ${weekNum} (${day}.${month})`;
        });

        const appointmentsByWeek = await Promise.all(
          weeks.map(async (week) => {
            const count = await prisma.appointment.count({
              where: {
                ...appointmentWhere,
                appointmentDate: {
                  gte: week.start,
                  lte: week.end,
                },
              },
            });

            return count;
          })
        );

        datasets = [
          {
            label: 'Назначений',
            data: appointmentsByWeek,
            borderColor: '#3A6FF8',
            backgroundColor: 'rgba(58, 111, 248, 0.1)',
            tension: 0.4,
          },
        ];
        break;
      }

      case 'monthly': {
        // График по месяцам (последние 12 месяцев)
        const endDate = filters.dateTo ? new Date(filters.dateTo) : new Date();
        const months = [];

        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
          months.push(new Date(monthDate));
        }

        labels = months.map(date => {
          const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
          return monthNames[date.getMonth()];
        });

        const appointmentsByMonth = await Promise.all(
          months.map(async (monthDate) => {
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

            const count = await prisma.appointment.count({
              where: {
                ...appointmentWhere,
                appointmentDate: {
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
            });

            return count;
          })
        );

        datasets = [
          {
            label: 'Назначений',
            data: appointmentsByMonth,
            borderColor: '#3A6FF8',
            backgroundColor: 'rgba(58, 111, 248, 0.1)',
            tension: 0.4,
          },
        ];
        break;
      }

      case 'byDoctor': {
        // График по врачам
        const doctors = await prisma.user.findMany({
          where: {
            clinicId,
            role: 'DOCTOR',
            status: 'ACTIVE',
          },
          select: { id: true, name: true },
        });

        labels = doctors.map(doctor => doctor.name);

        const appointmentsByDoctor = await Promise.all(
          doctors.map(async (doctor) => {
            const count = await prisma.appointment.count({
              where: {
                ...appointmentWhere,
                doctorId: doctor.id,
              },
            });

            return count;
          })
        );

        datasets = [
          {
            label: 'Назначений',
            data: appointmentsByDoctor,
            backgroundColor: [
              'rgba(58, 111, 248, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(251, 146, 60, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(147, 51, 234, 0.8)',
              'rgba(236, 72, 153, 0.8)',
            ],
          },
        ];
        break;
      }

      case 'byCategory': {
        // График по категориям (reason)
        const appointments = await prisma.appointment.findMany({
          where: appointmentWhere,
          select: { reason: true },
        });

        // Группируем по reason
        const categoryCounts = {};
        appointments.forEach(apt => {
          const category = apt.reason || 'Без категории';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        labels = Object.keys(categoryCounts);
        const data = Object.values(categoryCounts);

        datasets = [
          {
            label: 'Назначений',
            data,
            backgroundColor: [
              'rgba(58, 111, 248, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(251, 146, 60, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(147, 51, 234, 0.8)',
              'rgba(236, 72, 153, 0.8)',
            ],
          },
        ];
        break;
      }

      case 'byStatus': {
        // График по статусам (pie chart)
        const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

        labels = ['Ожидает', 'Подтверждено', 'Завершено', 'Отменено'];

        const appointmentsByStatus = await Promise.all(
          statuses.map(async (status) => {
            const count = await prisma.appointment.count({
              where: {
                ...appointmentWhere,
                status,
              },
            });

            return count;
          })
        );

        datasets = [
          {
            label: 'Назначений',
            data: appointmentsByStatus,
            backgroundColor: [
              'rgba(251, 146, 60, 0.8)',  // pending - orange
              'rgba(59, 130, 246, 0.8)',  // confirmed - blue
              'rgba(34, 197, 94, 0.8)',   // completed - green
              'rgba(239, 68, 68, 0.8)',   // cancelled - red
            ],
          },
        ];
        break;
      }

      default:
        throw new Error(`Неизвестный тип графика: ${type}`);
    }

    const chartData = {
      labels,
      datasets,
    };

    console.log('📊 [ANALYTICS SERVICE] Chart data получен:', chartData);

    return chartData;
  } catch (error) {
    console.error('❌ [ANALYTICS SERVICE] Ошибка получения chart data:', error);
    throw error;
  }
}

/**
 * Получить детальные данные для таблицы
 * @param {string} clinicId - ID клиники
 * @param {object} filters - Фильтры (doctorId, dateFrom, dateTo, week, category)
 * @param {object} options - Опции (page, limit, sortBy, sortOrder)
 * @returns {Promise<object>} { appointments, meta }
 */
export async function getAnalyticsTable(clinicId, filters = {}, options = {}) {
  console.log('📊 [ANALYTICS SERVICE] Получение analytics table:', { clinicId, filters, options });

  try {
    const { page = 1, limit = 20, sortBy = 'appointmentDate', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const appointmentWhere = buildWhereClause(clinicId, filters);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: appointmentWhere,
        include: {
          doctor: {
            select: { id: true, name: true, specialization: true },
          },
          patient: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip,
      }),
      prisma.appointment.count({ where: appointmentWhere }),
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
  } catch (error) {
    console.error('❌ [ANALYTICS SERVICE] Ошибка получения analytics table:', error);
    throw error;
  }
}

