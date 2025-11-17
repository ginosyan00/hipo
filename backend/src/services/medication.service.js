import { prisma } from '../config/database.js';

/**
 * Medication Service
 * Бизнес-логика для работы с медикаментами
 */

/**
 * Получить все медикаменты клиники
 * @param {string} clinicId - ID клиники
 * @param {object} options - Опции (search, page, limit)
 * @returns {Promise<object>} { medications, meta }
 */
export async function findAll(clinicId, options = {}) {
  console.log('🔵 [MEDICATION SERVICE] findAll called:', { clinicId, options });

  const { search, page = 1, limit = 100 } = options;
  const skip = (page - 1) * limit;

  // Построение where clause
  const where = {
    clinicId, // ВСЕГДА фильтруем по clinicId!
  };

  // Поиск по названию или производителю (SQLite не поддерживает mode: 'insensitive')
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { manufacturer: { contains: search } },
    ];
  }

  console.log('🔵 [MEDICATION SERVICE] Where clause:', JSON.stringify(where, null, 2));

  // Получаем медикаменты и общее количество
  const [medications, total] = await Promise.all([
    prisma.medication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.medication.count({ where }),
  ]);

  console.log('✅ [MEDICATION SERVICE] Found medications:', { count: medications.length, total });

  return {
    data: medications, // Frontend expects 'data' field
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Получить медикамент по ID
 * @param {string} clinicId - ID клиники
 * @param {string} medicationId - ID медикамента
 * @returns {Promise<object>} Medication
 */
export async function findById(clinicId, medicationId) {
  const medication = await prisma.medication.findFirst({
    where: {
      id: medicationId,
      clinicId, // ОБЯЗАТЕЛЬНО!
    },
  });

  if (!medication) {
    throw new Error('Medication not found');
  }

  return medication;
}

/**
 * Создать медикамент
 * @param {string} clinicId - ID клиники
 * @param {object} data - Данные медикамента
 * @returns {Promise<object>} Созданный медикамент
 */
export async function create(clinicId, data) {
  console.log('🔵 [MEDICATION SERVICE] Creating medication:', { clinicId, data });

  try {
    const medication = await prisma.medication.create({
      data: {
        clinicId, // ОБЯЗАТЕЛЬНО!
        name: data.name,
        dosage: data.dosage,
        quantity: data.quantity || 0,
        price: data.price,
        expiryDate: new Date(data.expiryDate),
        manufacturer: data.manufacturer,
      },
    });

    console.log('✅ [MEDICATION SERVICE] Medication created successfully:', medication.id);
    return medication;
  } catch (error) {
    console.error('❌ [MEDICATION SERVICE] Error creating medication:', error);
    throw error;
  }
}

/**
 * Обновить медикамент
 * @param {string} clinicId - ID клиники
 * @param {string} medicationId - ID медикамента
 * @param {object} data - Данные для обновления
 * @returns {Promise<object>} Обновленный медикамент
 */
export async function update(clinicId, medicationId, data) {
  // Проверяем что медикамент существует
  await findById(clinicId, medicationId);

  // Обновляем
  const updated = await prisma.medication.update({
    where: { id: medicationId },
    data: {
      name: data.name,
      dosage: data.dosage,
      quantity: data.quantity !== undefined ? data.quantity : undefined,
      price: data.price !== undefined ? data.price : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      manufacturer: data.manufacturer,
    },
  });

  return updated;
}

/**
 * Удалить медикамент
 * @param {string} clinicId - ID клиники
 * @param {string} medicationId - ID медикамента
 */
export async function remove(clinicId, medicationId) {
  // Проверяем что медикамент существует
  await findById(clinicId, medicationId);

  // Удаляем
  await prisma.medication.delete({
    where: { id: medicationId },
  });
}

/**
 * Получить статистику медикаментов
 * @param {string} clinicId - ID клиники
 * @returns {Promise<object>} Статистика
 */
export async function getStats(clinicId) {
  const medications = await prisma.medication.findMany({
    where: { clinicId },
    select: {
      quantity: true,
      price: true,
    },
  });

  const totalMedications = medications.length;
  const totalValue = medications.reduce((sum, med) => sum + med.price * med.quantity, 0);
  const lowStockCount = medications.filter(med => med.quantity <= 50).length;

  return {
    totalMedications,
    totalValue,
    lowStockCount,
  };
}

