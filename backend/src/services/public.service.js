import { prisma } from '../config/database.js';
import { findOrCreatePatient } from './patient.service.js';
import { create as createAppointment } from './appointment.service.js';

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
      workingHours: true,
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


