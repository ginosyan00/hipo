import { prisma } from '../config/database.js';

/**
 * Global Doctor Service
 * Бизнес-логика для работы с GlobalDoctor (врач как личность, глобально)
 * 
 * Phase 1 - NEW SERVICE: Работает параллельно со старым кодом
 */

/**
 * Создать GlobalDoctor для User
 * @param {string} userId - ID пользователя (User.id)
 * @returns {Promise<object>} Созданный GlobalDoctor
 */
export async function createGlobalDoctorForUser(userId) {
  // Проверяем, что User существует
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Проверяем, что User - это DOCTOR
  if (user.role !== 'DOCTOR') {
    throw new Error('User is not a doctor');
  }

  // Проверяем, что GlobalDoctor еще не создан
  const existingGlobalDoctor = await prisma.globalDoctor.findUnique({
    where: { userId },
  });

  if (existingGlobalDoctor) {
    return existingGlobalDoctor;
  }

  // Создаем GlobalDoctor
  const globalDoctor = await prisma.globalDoctor.create({
    data: {
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return globalDoctor;
}

/**
 * Найти GlobalDoctor по userId
 * @param {string} userId - ID пользователя
 * @returns {Promise<object|null>} GlobalDoctor или null
 */
export async function findGlobalDoctorByUserId(userId) {
  return await prisma.globalDoctor.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
      clinicDoctors: {
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Найти или создать GlobalDoctor для User
 * @param {string} userId - ID пользователя
 * @returns {Promise<object>} GlobalDoctor (созданный или найденный)
 */
export async function findOrCreateGlobalDoctorForUser(userId) {
  const existing = await findGlobalDoctorByUserId(userId);

  if (existing) {
    return existing;
  }

  return await createGlobalDoctorForUser(userId);
}


