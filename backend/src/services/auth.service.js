import { prisma } from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/hash.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { createSlug, createUniqueSlug } from '../utils/slug.util.js';

/**
 * Auth Service
 * Бизнес-логика для аутентификации
 */

/**
 * Регистрирует новую клинику с администратором
 * @param {object} clinicData - Данные клиники
 * @param {object} adminData - Данные администратора
 * @returns {Promise<object>} { clinic, user, token }
 */
export async function registerClinic(clinicData, adminData) {
  // 1. Проверяем уникальность slug
  const existingClinic = await prisma.clinic.findUnique({
    where: { slug: clinicData.slug },
  });

  if (existingClinic) {
    throw new Error('Clinic with this slug already exists');
  }

  // 2. Проверяем уникальность email администратора
  const existingUser = await prisma.user.findUnique({
    where: { email: adminData.email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // 3. Хешируем пароль
  const passwordHash = await hashPassword(adminData.password);

  // 4. Создаем клинику и администратора в транзакции
  const result = await prisma.$transaction(async tx => {
    // Создаем клинику
    const clinic = await tx.clinic.create({
      data: {
        name: clinicData.name,
        slug: clinicData.slug,
        email: clinicData.email,
        phone: clinicData.phone,
        city: clinicData.city,
        address: clinicData.address || null,
      },
    });

    // Создаем администратора
    const user = await tx.user.create({
      data: {
        clinicId: clinic.id,
        name: adminData.name,
        email: adminData.email,
        passwordHash,
        role: 'ADMIN',
      },
    });

    return { clinic, user };
  });

  // 5. Генерируем JWT токен
  const token = generateToken({
    userId: result.user.id,
    clinicId: result.clinic.id,
    role: result.user.role,
  });

  // 6. Возвращаем данные без passwordHash
  const { passwordHash: _, ...userWithoutPassword } = result.user;

  return {
    clinic: result.clinic,
    user: userWithoutPassword,
    token,
  };
}

/**
 * Регистрирует нового пользователя (Patient, Clinic, Partner)
 * @param {object} userData - Данные пользователя
 * @returns {Promise<object>} { user, token, clinic? }
 */
export async function registerUser(userData) {
  console.log('🔵 [AUTH SERVICE] Регистрация пользователя:', { email: userData.email, role: userData.role });

  // 1. Проверяем уникальность email
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    console.log('🔴 [AUTH SERVICE] Email уже существует:', userData.email);
    throw new Error('User with this email already exists');
  }

  // 2. Хешируем пароль
  const passwordHash = await hashPassword(userData.password);

  // 3. Определяем status в зависимости от роли
  // PATIENT получает instant access (ACTIVE)
  // CLINIC получает instant access (ACTIVE) - владелец клиники
  // PARTNER требует одобрения (PENDING)
  const status = (userData.role === 'PATIENT' || userData.role === 'CLINIC') ? 'ACTIVE' : 'PENDING';

  console.log('🔵 [AUTH SERVICE] Статус пользователя:', status);

  // 4. Если роль CLINIC - создаем клинику и владельца в транзакции
  if (userData.role === 'CLINIC') {
    console.log('🔵 [AUTH SERVICE] Создание клиники:', userData.clinicName);

    // Генерируем slug из названия клиники
    const baseSlug = createSlug(userData.clinicName);
    const uniqueSlug = await createUniqueSlug(baseSlug, prisma);

    const result = await prisma.$transaction(async tx => {
      // Создаем клинику
      const clinic = await tx.clinic.create({
        data: {
          name: userData.clinicName,
          slug: uniqueSlug,
          email: userData.clinicEmail,
          phone: userData.clinicPhone,
          city: userData.city,
          address: userData.address || null,
          about: userData.about || null,
        },
      });

      console.log('✅ [AUTH SERVICE] Клиника создана:', clinic.id);

      // Создаем владельца клиники (User с role CLINIC)
      const user = await tx.user.create({
        data: {
          clinicId: clinic.id,
          email: userData.email,
          passwordHash,
          name: userData.name,
          role: 'CLINIC',
          status: 'ACTIVE',
          phone: userData.phone || null,
          dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
          gender: userData.gender || null,
        },
      });

      console.log('✅ [AUTH SERVICE] Владелец клиники создан:', user.id);

      return { clinic, user };
    });

    // Генерируем JWT токен
    const token = generateToken({
      userId: result.user.id,
      clinicId: result.clinic.id,
      role: result.user.role,
      status: result.user.status,
    });

    // Возвращаем данные без passwordHash
    const { passwordHash: _, ...userWithoutPassword } = result.user;

    return {
      user: userWithoutPassword,
      clinic: result.clinic,
      token,
      expiresIn: 604800, // 7 дней в секундах
    };
  }

  // 5. Для других ролей (PATIENT, PARTNER) - обычная регистрация
  const userDataToCreate = {
    email: userData.email,
    passwordHash,
    name: userData.name,
    role: userData.role,
    status,
    phone: userData.phone || null,
    dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
    gender: userData.gender || null,
  };

  // 6. Добавляем role-specific поля для PARTNER
  if (userData.role === 'PARTNER') {
    userDataToCreate.organizationName = userData.organizationName;
    userDataToCreate.organizationType = userData.organizationType;
    userDataToCreate.inn = userData.inn;
    userDataToCreate.address = userData.organizationAddress;
  }

  // 7. Создаем пользователя
  const user = await prisma.user.create({
    data: userDataToCreate,
  });

  console.log('✅ [AUTH SERVICE] Пользователь создан:', { id: user.id, role: user.role, status: user.status });

  // 8. Генерируем JWT токен
  const token = generateToken({
    userId: user.id,
    clinicId: user.clinicId,
    role: user.role,
    status: user.status,
  });

  // 9. Возвращаем данные без passwordHash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    expiresIn: 604800, // 7 дней в секундах
  };
}

/**
 * Авторизует пользователя
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль
 * @returns {Promise<object>} { user, token }
 */
export async function loginUser(email, password) {
  console.log('🔵 [AUTH SERVICE] Попытка входа:', email);

  // 1. Найти пользователя по email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!user) {
    console.log('🔴 [AUTH SERVICE] Пользователь не найден:', email);
    throw new Error('Invalid email or password');
  }

  // 2. Проверить status пользователя
  if (user.status === 'SUSPENDED') {
    console.log('🔴 [AUTH SERVICE] Аккаунт приостановлен:', email);
    throw new Error('Your account has been suspended. Please contact support.');
  }

  if (user.status === 'REJECTED') {
    console.log('🔴 [AUTH SERVICE] Аккаунт отклонен:', email);
    throw new Error('Your registration was rejected. Please contact support.');
  }

  if (user.status === 'PENDING') {
    console.log('⏳ [AUTH SERVICE] Аккаунт ожидает одобрения:', email);
    throw new Error('Your account is pending approval. You will be notified once approved.');
  }

  // 3. Проверить пароль
  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    console.log('🔴 [AUTH SERVICE] Неверный пароль:', email);
    throw new Error('Invalid email or password');
  }

  console.log('✅ [AUTH SERVICE] Вход успешен:', { email, role: user.role, status: user.status });

  // 4. Для роли PATIENT - находим clinicId через модель Patient
  let clinicId = user.clinicId;
  
  if (user.role === 'PATIENT' && !clinicId) {
    console.log('🔵 [AUTH SERVICE] Поиск clinicId для PATIENT через модель Patient');
    
    // Ищем пациента по email или phone
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { email: user.email },
          { phone: user.phone },
        ],
      },
      orderBy: { createdAt: 'desc' }, // Берем последнего созданного (самого свежего)
      select: { clinicId: true },
    });

    if (patient) {
      clinicId = patient.clinicId;
      console.log('✅ [AUTH SERVICE] Найден clinicId для PATIENT:', clinicId);
    } else {
      console.warn('⚠️ [AUTH SERVICE] Пациент не найден в базе Patient. clinicId будет null.');
    }
  }

  // 5. Генерировать токен с role и status
  const token = generateToken({
    userId: user.id,
    clinicId: clinicId, // Может быть null для PATIENT, если не зарегистрирован в клинике
    role: user.role,
    status: user.status,
  });

  // 6. Возвращаем данные без passwordHash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    expiresIn: 604800, // 7 дней в секундах
  };
}

/**
 * Получить текущего пользователя по ID
 * @param {string} userId - ID пользователя
 * @returns {Promise<object>} User данные
 */
export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          city: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Удаляем passwordHash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return userWithoutPassword;
}

