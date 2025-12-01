import { prisma } from '../config/database.js';
import { findOrCreatePatient } from './patient.service.js';
import { create as createAppointment } from './appointment.service.js';
import * as notificationService from './notification.service.js';

/**
 * Public Service
 * Бизнес-логика для публичных endpoints (без авторизации)
 */

/**
 * Получить список всех клиник
 * @param {object} options - Опции (city, page, limit)
 * @returns {Promise<object>} { clinics, meta }
 */
export async function findAllClinics(options = {}) {
  const { city, page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  // Построение where clause
  const where = {};

  if (city) {
    where.city = city;
  }

  // Получаем клиники и общее количество
  const [clinics, total] = await Promise.all([
    prisma.clinic.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        city: true,
        about: true,
        logo: true,
        // НЕ возвращаем workingHours в списке (только в детальной)
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip,
    }),
    prisma.clinic.count({ where }),
  ]);

  return {
    clinics,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Получить клинику по slug
 * @param {string} slug - Slug клиники
 * @returns {Promise<object>} Clinic
 */
export async function findClinicBySlug(slug) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      about: true,
      logo: true,
      heroImage: true,
      workingHours: true,
      certificates: {
        // Показываем все сертификаты (для MVP)
        // В будущем можно добавить верификацию администратором
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // Парсим workingHours из JSON string
  if (clinic.workingHours) {
    try {
      clinic.workingHours = JSON.parse(clinic.workingHours);
    } catch (e) {
      clinic.workingHours = null;
    }
  }

  return clinic;
}

/**
 * Получить врачей клиники по slug
 * @param {string} slug - Slug клиники
 * @returns {Promise<array>} Список врачей
 */
export async function findClinicDoctors(slug) {
  // Сначала найдем клинику
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // Получаем врачей
  const doctors = await prisma.user.findMany({
    where: {
      clinicId: clinic.id,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      specialization: true,
      phone: true,
      avatar: true,
    },
    orderBy: { name: 'asc' },
  });

  return doctors;
}

/**
 * Получить врача по ID и slug клиники
 * @param {string} slug - Slug клиники
 * @param {string} doctorId - ID врача
 * @returns {Promise<object>} Врач
 */
export async function findClinicDoctor(slug, doctorId) {
  // Сначала найдем клинику
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // Получаем врача
  const doctor = await prisma.user.findFirst({
    where: {
      id: doctorId,
      clinicId: clinic.id,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      specialization: true,
      phone: true,
      avatar: true,
      experience: true,
      licenseNumber: true,
      dateOfBirth: true,
      gender: true,
    },
  });

  if (!doctor) {
    throw new Error('Doctor not found');
  }

  return {
    ...doctor,
    clinic: {
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
    },
  };
}

/**
 * Создать публичную заявку на приём
 * Находит или создает пациента, затем создает приём со статусом 'pending'
 * @param {string} clinicSlug - Slug клиники
 * @param {string} doctorId - ID врача
 * @param {object} patientData - Данные пациента
 * @param {Date} appointmentDate - Дата и время
 * @param {string} reason - Причина визита
 * @param {Date} registeredAt - Локальное время когда пациент был на сайте и отправил регистрацию
 * @returns {Promise<object>} Созданный appointment
 */
export async function createPublicAppointment(
  clinicSlug,
  doctorId,
  patientData,
  appointmentDate,
  reason,
  registeredAt
) {
  // 1. Находим клинику по slug
  const clinic = await prisma.clinic.findUnique({
    where: { slug: clinicSlug },
    select: { id: true, name: true },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // 2. Проверяем что врач существует и принадлежит этой клинике
  const doctor = await prisma.user.findFirst({
    where: {
      id: doctorId,
      clinicId: clinic.id,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  if (!doctor) {
    throw new Error('Doctor not found or inactive');
  }

  // 3. Находим пациента по телефону/email или создаем нового
  // Используем умную функцию findOrCreatePatient для избежания дубликатов
  const patient = await findOrCreatePatient(clinic.id, {
    name: patientData.name,
    phone: patientData.phone,
    email: patientData.email || null,
  });

  // 4. Создаем приём со статусом 'pending'
  const appointment = await createAppointment(clinic.id, {
    doctorId,
    patientId: patient.id,
    appointmentDate,
    duration: 30, // По умолчанию 30 минут для публичных заявок
    reason: reason || 'Онлайн-запись',
    registeredAt: registeredAt || null, // Локальное время регистрации от пользователя
  });

  // 5. Создаем уведомление для администратора клиники о новой регистрации
  try {
    const formattedDate = new Date(appointmentDate).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const doctorName = appointment.doctor?.name || doctor.name;
    const doctorSpecialization = appointment.doctor?.specialization || doctor.specialization || '';
    const patientName = patient.name;
    const patientPhone = patient.phone;
    const appointmentReason = reason || 'Онлайн-запись';

    await notificationService.createForAdmin(clinic.id, {
      type: 'new_appointment',
      title: 'Новая онлайн-запись',
      message: `Новый пациент ${patientName} (${patientPhone}) записался на прием к врачу ${doctorName}${doctorSpecialization ? ` (${doctorSpecialization})` : ''} на ${formattedDate}. Причина: ${appointmentReason}`,
      appointmentId: appointment.id,
    });

    console.log(`✅ [PUBLIC SERVICE] Уведомление создано для администратора клиники ${clinic.id} о новой записи от ${patientName}`);
  } catch (error) {
    // Не прерываем процесс, если уведомление не создалось
    console.error(`🔴 [PUBLIC SERVICE] Ошибка создания уведомления для администратора:`, error.message);
  }

  return {
    appointment: {
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      duration: appointment.duration,
      status: appointment.status,
      reason: appointment.reason,
    },
    clinic: {
      name: clinic.name,
      phone: clinic.phone,
    },
    doctor: {
      name: appointment.doctor.name,
      specialization: appointment.doctor.specialization,
    },
    message:
      'Ваша заявка принята! Клиника свяжется с вами в ближайшее время для подтверждения.',
  };
}

/**
 * Получить список городов (уникальные)
 * @returns {Promise<array>} Список городов
 */
export async function getUniqueCities() {
  const clinics = await prisma.clinic.findMany({
    select: { city: true },
    distinct: ['city'],
    orderBy: { city: 'asc' },
  });

  return clinics.map(c => c.city);
}

/**
 * Получить список пациентов для отзывов (публичный endpoint)
 * Возвращает только зарегистрированных пациентов (status='registered') с их именами
 * @param {number} limit - Количество пациентов (по умолчанию 3)
 * @returns {Promise<array>} Список пациентов с именами
 */
export async function getPatientsForTestimonials(limit = 3) {
  const patients = await prisma.patient.findMany({
    where: {
      status: 'registered', // Только зарегистрированные пациенты (с account)
    },
    select: {
      id: true,
      name: true,
    },
    take: limit,
    orderBy: {
      createdAt: 'desc', // Последние зарегистрированные
    },
  });

  return patients;
}

/**
 * Получить список пациентов клиники по slug (публичный endpoint)
 * Возвращает всех пациентов, которые зарегистрировались в этой клинике
 * @param {string} slug - Slug клиники
 * @param {object} options - Опции (page, limit)
 * @returns {Promise<object>} { patients, meta }
 */
export async function findClinicPatients(slug, options = {}) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  // Сначала найдем клинику
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // Получаем всех пациентов клиники
  const allPatients = await prisma.patient.findMany({
    where: {
      clinicId: clinic.id,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      createdAt: true,
      _count: {
        select: { appointments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Убираем дубликаты: группируем по телефону или email
  const uniquePatientsMap = new Map();
  
  for (const patient of allPatients) {
    const key = patient.phone || patient.email || patient.id;
    
    if (!uniquePatientsMap.has(key)) {
      uniquePatientsMap.set(key, patient);
    } else {
      // Если уже есть пациент с таким телефоном/email, берем более новую запись
      const existing = uniquePatientsMap.get(key);
      if (new Date(patient.createdAt) > new Date(existing.createdAt)) {
        uniquePatientsMap.set(key, patient);
      }
    }
  }

  const uniquePatients = Array.from(uniquePatientsMap.values());
  const total = uniquePatients.length;

  // Применяем пагинацию
  const paginatedPatients = uniquePatients.slice(skip, skip + limit);

  return {
    patients: paginatedPatients,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


