import { prisma } from '../config/database.js';
import * as globalDoctorService from './global-doctor.service.js';

/**
 * Clinic Doctor Service
 * Бизнес-логика для работы с ClinicDoctor (профиль врача в конкретной клинике)
 * 
 * Phase 1 - NEW SERVICE: Работает параллельно со старым кодом
 */

/**
 * Найти ClinicDoctor для User в конкретной клинике
 * @param {string} userId - ID пользователя
 * @param {string} clinicId - ID клиники
 * @returns {Promise<object|null>} ClinicDoctor или null
 */
export async function findClinicDoctorForUser(userId, clinicId) {
  // Находим GlobalDoctor для этого User
  const globalDoctor = await globalDoctorService.findGlobalDoctorByUserId(userId);

  if (!globalDoctor) {
    return null;
  }

  // Находим ClinicDoctor для этой клиники
  return await prisma.clinicDoctor.findFirst({
    where: {
      clinicId,
      globalDoctorId: globalDoctor.id,
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      globalDoctor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Создать ClinicDoctor для GlobalDoctor в клинике
 * @param {string} globalDoctorId - ID GlobalDoctor
 * @param {string} clinicId - ID клиники
 * @param {object} data - Данные (specialization, licenseNumber, experience)
 * @returns {Promise<object>} Созданный ClinicDoctor
 */
export async function createClinicDoctor(globalDoctorId, clinicId, data = {}) {
  // Проверяем, что GlobalDoctor существует
  const globalDoctor = await prisma.globalDoctor.findUnique({
    where: { id: globalDoctorId },
  });

  if (!globalDoctor) {
    throw new Error('GlobalDoctor not found');
  }

  // Проверяем, что Clinic существует
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // Проверяем, что ClinicDoctor еще не создан
  const existing = await prisma.clinicDoctor.findFirst({
    where: {
      clinicId,
      globalDoctorId,
    },
  });

  if (existing) {
    return existing;
  }

  // Создаем ClinicDoctor
  const clinicDoctor = await prisma.clinicDoctor.create({
    data: {
      clinicId,
      globalDoctorId,
      specialization: data.specialization || null,
      licenseNumber: data.licenseNumber || null,
      experience: data.experience || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      globalDoctor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return clinicDoctor;
}

/**
 * Найти или создать ClinicDoctor для User в клинике
 * @param {string} userId - ID пользователя
 * @param {string} clinicId - ID клиники
 * @param {object} data - Данные для создания (если нужно создать)
 * @returns {Promise<object>} ClinicDoctor (созданный или найденный)
 */
export async function findOrCreateClinicDoctorForUser(userId, clinicId, data = {}) {
  // Сначала находим или создаем GlobalDoctor
  const globalDoctor = await globalDoctorService.findOrCreateGlobalDoctorForUser(userId);

  // Ищем существующий ClinicDoctor
  const existing = await findClinicDoctorForUser(userId, clinicId);

  if (existing) {
    return existing;
  }

  // Создаем новый ClinicDoctor
  // Если data пустой, берем данные из User (старая структура)
  if (!data.specialization || !data.licenseNumber || !data.experience) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        specialization: true,
        licenseNumber: true,
        experience: true,
      },
    });

    data = {
      specialization: data.specialization || user?.specialization || null,
      licenseNumber: data.licenseNumber || user?.licenseNumber || null,
      experience: data.experience || user?.experience || null,
      ...data,
    };
  }

  return await createClinicDoctor(globalDoctor.id, clinicId, data);
}

/**
 * Получить все клиники, где работает врач
 * @param {string} globalDoctorId - ID GlobalDoctor
 * @returns {Promise<object[]>} Массив ClinicDoctor с информацией о клиниках
 */
export async function getClinicsForDoctor(globalDoctorId) {
  return await prisma.clinicDoctor.findMany({
    where: {
      globalDoctorId,
      isActive: true,
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          address: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Получить всех ClinicDoctor клиники
 * @param {string} clinicId - ID клиники
 * @param {object} options - Опции (isActive, page, limit)
 * @returns {Promise<object>} { clinicDoctors, meta }
 */
export async function findAllByClinic(clinicId, options = {}) {
  const { isActive, page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  const where = {
    clinicId,
  };

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [clinicDoctors, total] = await Promise.all([
    prisma.clinicDoctor.findMany({
      where,
      include: {
        globalDoctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.clinicDoctor.count({ where }),
  ]);

  return {
    clinicDoctors,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


