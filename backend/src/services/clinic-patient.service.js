import { prisma } from '../config/database.js';
import * as globalPatientService from './global-patient.service.js';

/**
 * Clinic Patient Service
 * Бизнес-логика для работы с ClinicPatient (профиль пациента в конкретной клинике)
 * 
 * Phase 1 - NEW SERVICE: Работает параллельно со старым кодом
 * 
 * NOTE: Этот сервис будет использоваться вместо patient.service.js после полной миграции
 * Пока работает параллельно
 */

/**
 * Найти ClinicPatient по globalPatientId и clinicId
 * @param {string} globalPatientId - ID GlobalPatient
 * @param {string} clinicId - ID клиники
 * @returns {Promise<object|null>} ClinicPatient или null
 */
export async function findClinicPatientForGlobal(globalPatientId, clinicId) {
  return await prisma.clinicPatient.findFirst({
    where: {
      globalPatientId,
      clinicId,
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      globalPatient: {
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
 * Создать ClinicPatient и связать с GlobalPatient
 * @param {string} clinicId - ID клиники
 * @param {object} patientData - Данные пациента (name, phone, email, etc.)
 * @param {string|null} globalPatientId - ID GlobalPatient (опционально, если не указан - создастся автоматически)
 * @returns {Promise<object>} Созданный ClinicPatient
 */
export async function createClinicPatient(clinicId, patientData, globalPatientId = null) {
  // Проверяем, что Clinic существует
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // Находим или создаем GlobalPatient
  let globalPatient;
  if (globalPatientId) {
    globalPatient = await prisma.globalPatient.findUnique({
      where: { id: globalPatientId },
    });

    if (!globalPatient) {
      throw new Error('GlobalPatient not found');
    }
  } else {
    // Пытаемся найти существующий GlobalPatient по matching
    globalPatient = await globalPatientService.findGlobalPatientByMatch({
      phone: patientData.phone,
      email: patientData.email,
      dateOfBirth: patientData.dateOfBirth,
    });

    // Если не найден - создаем новый
    if (!globalPatient) {
      globalPatient = await globalPatientService.createGlobalPatient({
        userId: patientData.userId || null,
      });
    }
  }

  // Проверяем, что ClinicPatient еще не создан
  const existing = await findClinicPatientForGlobal(globalPatient.id, clinicId);

  if (existing) {
    // Обновляем данные, если они изменились
    return await updateClinicPatient(clinicId, existing.id, patientData);
  }

  // Создаем ClinicPatient
  const clinicPatient = await prisma.clinicPatient.create({
    data: {
      clinicId,
      globalPatientId: globalPatient.id,
      name: patientData.name,
      phone: patientData.phone,
      email: patientData.email || null,
      passwordHash: patientData.passwordHash || null,
      avatar: patientData.avatar || null,
      dateOfBirth: patientData.dateOfBirth ? new Date(patientData.dateOfBirth) : null,
      gender: patientData.gender || null,
      notes: patientData.notes || null,
      status: patientData.status || 'guest',
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      globalPatient: {
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

  return clinicPatient;
}

/**
 * Обновить ClinicPatient
 * @param {string} clinicId - ID клиники
 * @param {string} clinicPatientId - ID ClinicPatient
 * @param {object} data - Данные для обновления
 * @returns {Promise<object>} Обновленный ClinicPatient
 */
export async function updateClinicPatient(clinicId, clinicPatientId, data) {
  // Проверяем, что ClinicPatient существует и принадлежит клинике
  const existing = await prisma.clinicPatient.findFirst({
    where: {
      id: clinicPatientId,
      clinicId,
    },
  });

  if (!existing) {
    throw new Error('ClinicPatient not found in this clinic');
  }

  // Обновляем
  return await prisma.clinicPatient.update({
    where: { id: clinicPatientId },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      passwordHash: data.passwordHash,
      avatar: data.avatar,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
      notes: data.notes,
      status: data.status,
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      globalPatient: {
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
 * Получить всех ClinicPatient клиники
 * @param {string} clinicId - ID клиники
 * @param {object} options - Опции (search, status, page, limit)
 * @returns {Promise<object>} { clinicPatients, meta }
 */
export async function findAllByClinic(clinicId, options = {}) {
  const { search, status, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const where = {
    clinicId, // ВСЕГДА фильтруем по clinicId!
  };

  if (status) {
    where.status = status;
  }

  // Получаем всех ClinicPatient
  const allClinicPatients = await prisma.clinicPatient.findMany({
    where,
    include: {
      globalPatient: {
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
    orderBy: { createdAt: 'desc' },
  });

  // Фильтруем по поиску (case-insensitive)
  let filtered = allClinicPatients;
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim();
    filtered = allClinicPatients.filter(patient => {
      return (
        patient.name.toLowerCase().includes(searchLower) ||
        patient.phone.includes(search) ||
        (patient.email && patient.email.toLowerCase().includes(searchLower))
      );
    });
  }

  const total = filtered.length;

  // Применяем пагинацию
  const paginated = filtered.slice(skip, skip + limit);

  return {
    clinicPatients: paginated,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Получить ClinicPatient по ID
 * @param {string} clinicId - ID клиники
 * @param {string} clinicPatientId - ID ClinicPatient
 * @returns {Promise<object>} ClinicPatient
 */
export async function findById(clinicId, clinicPatientId) {
  const clinicPatient = await prisma.clinicPatient.findFirst({
    where: {
      id: clinicPatientId,
      clinicId, // ОБЯЗАТЕЛЬНО!
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      globalPatient: {
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
      },
      appointments: {
        include: {
          clinicDoctor: {
            include: {
              globalDoctor: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      specialization: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { appointmentDate: 'desc' },
      },
    },
  });

  if (!clinicPatient) {
    throw new Error('ClinicPatient not found');
  }

  return clinicPatient;
}


