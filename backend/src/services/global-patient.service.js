import { prisma } from '../config/database.js';

/**
 * Global Patient Service
 * Бизнес-логика для работы с GlobalPatient (пациент как личность, глобально)
 * 
 * Phase 1 - NEW SERVICE: Работает параллельно со старым кодом
 */

/**
 * Создать GlobalPatient
 * @param {object} data - Данные (userId - optional)
 * @returns {Promise<object>} Созданный GlobalPatient
 */
export async function createGlobalPatient(data = {}) {
  const { userId } = data;

  // Если userId указан, проверяем что User существует
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Проверяем, что GlobalPatient еще не создан для этого User
    const existing = await prisma.globalPatient.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }
  }

  // Создаем GlobalPatient
  const globalPatient = await prisma.globalPatient.create({
    data: {
      userId: userId || null,
    },
    include: {
      user: userId
        ? {
            select: {
              id: true,
              name: true,
              email: true,
            },
          }
        : undefined,
    },
  });

  return globalPatient;
}

/**
 * Найти GlobalPatient по userId
 * @param {string} userId - ID пользователя
 * @returns {Promise<object|null>} GlobalPatient или null
 */
export async function findGlobalPatientByUserId(userId) {
  return await prisma.globalPatient.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      clinicPatients: {
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
 * Найти GlobalPatient по данным для matching (phone, email, dateOfBirth)
 * Используется для поиска существующего GlobalPatient при создании нового ClinicPatient
 * @param {object} data - Данные для поиска (phone, email, dateOfBirth)
 * @returns {Promise<object|null>} GlobalPatient или null
 */
export async function findGlobalPatientByMatch(data) {
  const { phone, email, dateOfBirth } = data;

  // Ищем через ClinicPatient, которые могут быть связаны с GlobalPatient
  // Это непрямой поиск, так как GlobalPatient не хранит phone/email напрямую
  const where = {
    clinicPatients: {
      some: {},
    },
  };

  // Строим условия для поиска в ClinicPatient
  const clinicPatientConditions = [];

  if (phone) {
    clinicPatientConditions.push({ phone });
  }

  if (email) {
    clinicPatientConditions.push({ email });
  }

  if (dateOfBirth) {
    clinicPatientConditions.push({ dateOfBirth: new Date(dateOfBirth) });
  }

  // Если есть условия для поиска, применяем их
  if (clinicPatientConditions.length > 0) {
    where.clinicPatients = {
      some: {
        OR: clinicPatientConditions,
      },
    };
  }

  // Находим первого GlobalPatient, у которого есть ClinicPatient с совпадающими данными
  // Для более точного matching нужно проверять все комбинации
  const globalPatients = await prisma.globalPatient.findMany({
    where,
    include: {
      clinicPatients: {
        where: {
          OR: clinicPatientConditions,
        },
      },
    },
    take: 1,
  });

  return globalPatients.length > 0 ? globalPatients[0] : null;
}

/**
 * Найти или создать GlobalPatient
 * @param {object} data - Данные (userId, phone, email, dateOfBirth для matching)
 * @returns {Promise<object>} GlobalPatient (созданный или найденный)
 */
export async function findOrCreateGlobalPatient(data = {}) {
  const { userId } = data;

  // Если есть userId, ищем по userId
  if (userId) {
    const existing = await findGlobalPatientByUserId(userId);
    if (existing) {
      return existing;
    }
  }

  // Пытаемся найти по matching (phone, email, dateOfBirth)
  const matched = await findGlobalPatientByMatch(data);
  if (matched) {
    return matched;
  }

  // Не найден - создаем новый
  return await createGlobalPatient(data);
}


