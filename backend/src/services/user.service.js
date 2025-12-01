import { prisma } from '../config/database.js';
import { hashPassword } from '../utils/hash.util.js';
import * as globalDoctorService from './global-doctor.service.js';
import * as clinicDoctorService from './clinic-doctor.service.js';

/**
 * User Service
 * Бизнес-логика для работы с пользователями (сотрудниками)
 */

/**
 * Получить всех пользователей клиники
 * @param {string} clinicId - ID клиники
 * @param {object} options - Опции (role, page, limit)
 * @returns {Promise<object>} { users, meta }
 */
export async function findAll(clinicId, options = {}) {
  const { role, page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  // Построение where clause
  const where = {
    clinicId, // ВСЕГДА фильтруем по clinicId!
  };

  // Фильтр по роли
  if (role) {
    where.role = role;
  }

  // Получаем пользователей и общее количество
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        specialization: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        // НЕ возвращаем passwordHash!
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Получить пользователя по ID
 * @param {string|null} clinicId - ID клиники (null для ADMIN)
 * @param {string} userId - ID пользователя
 * @returns {Promise<object>} User
 */
export async function findById(clinicId, userId) {
  const where = {
    id: userId,
  };

  // Если clinicId указан, проверяем принадлежность к клинике
  // Если clinicId null (для ADMIN), не проверяем
  if (clinicId) {
    where.clinicId = clinicId;
  }

  const user = await prisma.user.findFirst({
    where,
    select: {
      id: true,
      clinicId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      specialization: true,
      phone: true,
      avatar: true,
      experience: true,
      licenseNumber: true,
      dateOfBirth: true,
      gender: true,
      createdAt: true,
      updatedAt: true,
      // НЕ возвращаем passwordHash!
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Создать пользователя
 * @param {string} clinicId - ID клиники
 * @param {object} data - Данные пользователя
 * @returns {Promise<object>} Созданный пользователь
 */
export async function create(clinicId, data) {
  // Проверка: уникальность email (глобально, не только в клинике)
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error('User with this email already exists');
  }

  // Хешируем пароль
  const passwordHash = await hashPassword(data.password);

  // Создаем пользователя
  const user = await prisma.user.create({
    data: {
      clinicId, // ОБЯЗАТЕЛЬНО!
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      specialization: data.specialization || null,
      phone: data.phone || null,
    },
    select: {
      id: true,
      clinicId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      specialization: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      // НЕ возвращаем passwordHash!
    },
  });

  // Если это DOCTOR - создаем GlobalDoctor + ClinicDoctor (Phase 2: новая архитектура)
  if (user.role === 'DOCTOR' && user.clinicId) {
    try {
      console.log('🔵 [USER SERVICE] Создание GlobalDoctor + ClinicDoctor для врача:', user.id);

      // Создаем или находим GlobalDoctor
      const globalDoctor = await globalDoctorService.findOrCreateGlobalDoctorForUser(user.id);
      console.log('✅ [USER SERVICE] GlobalDoctor создан/найден:', globalDoctor.id);

      // Создаем или находим ClinicDoctor
      const clinicDoctor = await clinicDoctorService.findOrCreateClinicDoctorForUser(
        user.id,
        user.clinicId,
        {
          specialization: user.specialization || null,
          licenseNumber: null, // Не передается в create()
          experience: null, // Не передается в create()
          isActive: user.status === 'ACTIVE',
        }
      );
      console.log('✅ [USER SERVICE] ClinicDoctor создан/найден:', clinicDoctor.id);
    } catch (error) {
      // Логируем ошибку, но не прерываем создание (fallback на старое)
      console.warn('⚠️ [USER SERVICE] Ошибка при создании GlobalDoctor/ClinicDoctor (не критично):', error.message);
    }
  }

  return user;
}

/**
 * Обновить пользователя
 * @param {string|null} clinicId - ID клиники (null для ADMIN)
 * @param {string} userId - ID пользователя
 * @param {object} data - Данные для обновления
 * @returns {Promise<object>} Обновленный пользователь
 */
export async function update(clinicId, userId, data) {
  // Проверяем что пользователь существует
  // Если clinicId указан, проверяем принадлежность к клинике
  // Если clinicId null (для ADMIN), просто проверяем существование
  await findById(clinicId, userId);

  // Если обновляется email, проверяем уникальность
  if (data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing && existing.id !== userId) {
      throw new Error('User with this email already exists');
    }
  }

  // Если обновляется пароль, хешируем его
  if (data.password) {
    data.passwordHash = await hashPassword(data.password);
    delete data.password; // Удаляем plaintext password
  }

  // Обновляем
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      clinicId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      specialization: true,
      phone: true,
      avatar: true,
      experience: true,
      licenseNumber: true,
      dateOfBirth: true,
      gender: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Удалить пользователя
 * @param {string} clinicId - ID клиники
 * @param {string} userId - ID пользователя
 */
export async function remove(clinicId, userId) {
  // Проверяем что пользователь существует и принадлежит клинике
  await findById(clinicId, userId);

  // Проверка: нельзя удалить последнего админа
  const admins = await prisma.user.count({
    where: {
      clinicId,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user.role === 'ADMIN' && admins <= 1) {
    throw new Error('Cannot delete the last admin of the clinic');
  }

  // Удаляем
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Получить всех врачей клиники
 * @param {string} clinicId - ID клиники
 * @returns {Promise<array>} Список врачей
 */
export async function findDoctors(clinicId) {
  return await prisma.user.findMany({
    where: {
      clinicId,
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
      status: true,
      licenseNumber: true,
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Получить всех пользователей со статусом PENDING
 * @returns {Promise<array>} Список пользователей на одобрении
 */
export async function findPendingUsers() {
  console.log('🔵 [USER SERVICE] Получение pending пользователей');
  
  const users = await prisma.user.findMany({
    where: {
      status: 'PENDING',
      role: {
        in: ['DOCTOR', 'PARTNER'], // Только врачи и партнеры требуют одобрения
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      // Doctor fields
      specialization: true,
      licenseNumber: true,
      experience: true,
      // Partner fields
      organizationName: true,
      organizationType: true,
      inn: true,
      address: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`✅ [USER SERVICE] Найдено ${users.length} pending пользователей`);
  return users;
}

/**
 * Одобрить пользователя (PENDING -> ACTIVE)
 * @param {string} userId - ID пользователя
 * @returns {Promise<object>} Обновленный пользователь
 */
export async function approveUser(userId) {
  console.log('🔵 [USER SERVICE] Одобрение пользователя:', userId);

  // Проверяем что пользователь существует и в статусе PENDING
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.log('🔴 [USER SERVICE] Пользователь не найден');
    throw new Error('User not found');
  }

  if (user.status !== 'PENDING') {
    console.log('🔴 [USER SERVICE] Пользователь не в статусе PENDING');
    throw new Error('User is not pending approval');
  }

  // Обновляем статус на ACTIVE
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log('✅ [USER SERVICE] Пользователь одобрен:', updatedUser.id);
  return updatedUser;
}

/**
 * Отклонить пользователя (PENDING -> REJECTED)
 * @param {string} userId - ID пользователя
 * @param {string} reason - Причина отклонения (опционально)
 * @returns {Promise<object>} Обновленный пользователь
 */
export async function rejectUser(userId, reason = null) {
  console.log('🔵 [USER SERVICE] Отклонение пользователя:', userId);

  // Проверяем что пользователь существует и в статусе PENDING
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.log('🔴 [USER SERVICE] Пользователь не найден');
    throw new Error('User not found');
  }

  if (user.status !== 'PENDING') {
    console.log('🔴 [USER SERVICE] Пользователь не в статусе PENDING');
    throw new Error('User is not pending approval');
  }

  // Обновляем статус на REJECTED
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { 
      status: 'REJECTED',
      // Можно добавить поле для причины отклонения в будущем
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log('✅ [USER SERVICE] Пользователь отклонен:', updatedUser.id);
  return updatedUser;
}

/**
 * Создать врача в клинике (Clinic создает врача для своей клиники)
 * @param {string} clinicId - ID клиники
 * @param {object} data - Данные врача
 * @returns {Promise<object>} Созданный врач
 */
export async function createDoctorByClinic(clinicId, data) {
  console.log('🔵 [USER SERVICE] Создание врача для клиники:', clinicId);

  // Проверка: клиника существует
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
  });

  if (!clinic) {
    console.log('🔴 [USER SERVICE] Клиника не найдена');
    throw new Error('Clinic not found');
  }

  // Проверка: уникальность email (глобально)
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    console.log('🔴 [USER SERVICE] Email уже используется:', data.email);
    throw new Error('User with this email already exists');
  }

  // Хешируем пароль
  const passwordHash = await hashPassword(data.password);

  // Создаем врача
  const doctor = await prisma.user.create({
    data: {
      clinicId,
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'DOCTOR', // ОБЯЗАТЕЛЬНО роль врача
      status: 'ACTIVE', // Сразу активен (создан клиникой)
      specialization: data.specialization,
      licenseNumber: data.licenseNumber,
      experience: data.experience,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender || null,
    },
    select: {
      id: true,
      clinicId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      specialization: true,
      licenseNumber: true,
      experience: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      createdAt: true,
      updatedAt: true,
      // НЕ возвращаем passwordHash!
    },
  });

  console.log('✅ [USER SERVICE] Врач успешно создан:', doctor.id);

  // Создаем GlobalDoctor + ClinicDoctor (Phase 2: новая архитектура)
  try {
    console.log('🔵 [USER SERVICE] Создание GlobalDoctor + ClinicDoctor для врача:', doctor.id);

    // Создаем или находим GlobalDoctor
    const globalDoctor = await globalDoctorService.findOrCreateGlobalDoctorForUser(doctor.id);
    console.log('✅ [USER SERVICE] GlobalDoctor создан/найден:', globalDoctor.id);

    // Создаем или находим ClinicDoctor
    const clinicDoctor = await clinicDoctorService.findOrCreateClinicDoctorForUser(
      doctor.id,
      clinicId,
      {
        specialization: doctor.specialization || null,
        licenseNumber: doctor.licenseNumber || null,
        experience: doctor.experience || null,
        isActive: doctor.status === 'ACTIVE',
      }
    );
    console.log('✅ [USER SERVICE] ClinicDoctor создан/найден:', clinicDoctor.id);
  } catch (error) {
    // Логируем ошибку, но не прерываем создание (fallback на старое)
    console.warn('⚠️ [USER SERVICE] Ошибка при создании GlobalDoctor/ClinicDoctor (не критично):', error.message);
  }

  return doctor;
}

/**
 * Обновить профиль врача (врач обновляет свои данные)
 * @param {string} userId - ID врача (из токена)
 * @param {object} data - Данные для обновления
 * @returns {Promise<object>} Обновленный врач
 */
export async function updateDoctorProfile(userId, data) {
  console.log('🔵 [USER SERVICE] Обновление профиля врача:', userId);

  // Проверяем что пользователь существует и является врачом
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.log('🔴 [USER SERVICE] Врач не найден');
    throw new Error('Doctor not found');
  }

  if (user.role !== 'DOCTOR') {
    console.log('🔴 [USER SERVICE] Пользователь не является врачом');
    throw new Error('User is not a doctor');
  }

  // Если обновляется email, проверяем уникальность
  if (data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing && existing.id !== userId) {
      console.log('🔴 [USER SERVICE] Email уже используется:', data.email);
      throw new Error('User with this email already exists');
    }
  }

  // Обновляем данные врача
  const updatedDoctor = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.specialization !== undefined && { specialization: data.specialization || null }),
      ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber || null }),
      ...(data.experience !== undefined && { experience: data.experience || null }),
      ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth || null }),
      ...(data.gender !== undefined && { gender: data.gender || null }),
      ...(data.avatar !== undefined && { avatar: data.avatar || null }),
    },
    select: {
      id: true,
      clinicId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      specialization: true,
      licenseNumber: true,
      experience: true,
      phone: true,
      avatar: true,
      dateOfBirth: true,
      gender: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log('✅ [USER SERVICE] Профиль врача успешно обновлен:', updatedDoctor.id);
  return updatedDoctor;
}

/**
 * Получить профиль текущего пользователя
 * @param {string} userId - ID пользователя (из токена)
 * @returns {Promise<object>} Профиль пользователя
 */
export async function getMyProfile(userId) {
  console.log('🔵 [USER SERVICE] Получение профиля пользователя:', userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clinicId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      avatar: true,
      dateOfBirth: true,
      gender: true,
      // Doctor-specific fields
      specialization: true,
      licenseNumber: true,
      experience: true,
      // Partner-specific fields
      organizationName: true,
      organizationType: true,
      inn: true,
      address: true,
      createdAt: true,
      updatedAt: true,
      // НЕ возвращаем passwordHash!
    },
  });

  if (!user) {
    console.log('🔴 [USER SERVICE] Пользователь не найден');
    throw new Error('User not found');
  }

  console.log('✅ [USER SERVICE] Профиль получен:', user.id);
  return user;
}

/**
 * Обновить профиль текущего пользователя
 * @param {string} userId - ID пользователя (из токена)
 * @param {object} data - Данные для обновления
 * @returns {Promise<object>} Обновленный профиль
 */
export async function updateMyProfile(userId, data) {
  console.log('🔵 [USER SERVICE] Обновление профиля пользователя:', userId);

  // Проверяем что пользователь существует
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.log('🔴 [USER SERVICE] Пользователь не найден');
    throw new Error('User not found');
  }

  // Если обновляется email, проверяем уникальность
  if (data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing && existing.id !== userId) {
      console.log('🔴 [USER SERVICE] Email уже используется:', data.email);
      throw new Error('User with this email already exists');
    }
  }

  // Подготавливаем данные для обновления
  const updateData = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.avatar !== undefined) updateData.avatar = data.avatar || null;
  if (data.dateOfBirth !== undefined) {
    updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  }
  if (data.gender !== undefined) updateData.gender = data.gender || null;

  // Doctor-specific fields (только для врачей)
  if (user.role === 'DOCTOR') {
    if (data.specialization !== undefined) updateData.specialization = data.specialization || null;
    if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber || null;
    if (data.experience !== undefined) updateData.experience = data.experience || null;
  }

  // Partner-specific fields (только для партнеров)
  if (user.role === 'PARTNER') {
    if (data.organizationName !== undefined) updateData.organizationName = data.organizationName || null;
    if (data.organizationType !== undefined) updateData.organizationType = data.organizationType || null;
    if (data.inn !== undefined) updateData.inn = data.inn || null;
    if (data.address !== undefined) updateData.address = data.address || null;
  }

  // Обновляем профиль
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      clinicId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      avatar: true,
      dateOfBirth: true,
      gender: true,
      specialization: true,
      licenseNumber: true,
      experience: true,
      organizationName: true,
      organizationType: true,
      inn: true,
      address: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log('✅ [USER SERVICE] Профиль успешно обновлен:', updatedUser.id);
  return updatedUser;
}

/**
 * Изменить пароль текущего пользователя
 * @param {string} userId - ID пользователя (из токена)
 * @param {string} currentPassword - Текущий пароль
 * @param {string} newPassword - Новый пароль
 * @returns {Promise<void>}
 */
export async function updateMyPassword(userId, currentPassword, newPassword) {
  console.log('🔵 [USER SERVICE] Изменение пароля пользователя:', userId);

  // Получаем пользователя с passwordHash
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    console.log('🔴 [USER SERVICE] Пользователь не найден');
    throw new Error('User not found');
  }

  // Проверяем текущий пароль
  const { verifyPassword } = await import('../utils/hash.util.js');
  const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);

  if (!isPasswordValid) {
    console.log('🔴 [USER SERVICE] Неверный текущий пароль');
    throw new Error('Current password is incorrect');
  }

  // Хешируем новый пароль
  const newPasswordHash = await hashPassword(newPassword);

  // Обновляем пароль
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  console.log('✅ [USER SERVICE] Пароль успешно изменен:', userId);
}

