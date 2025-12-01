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
 * @returns {Promise<object>} { user/patient, token, clinic? }
 */
export async function registerUser(userData) {
  console.log('🔵 [AUTH SERVICE] Регистрация пользователя:', { email: userData.email, role: userData.role });

  // 1. Если роль PATIENT - создаем Patient record (не User!)
  if (userData.role === 'PATIENT') {
    console.log('🔵 [AUTH SERVICE] Регистрация PATIENT - создание Patient record');

    // Проверяем уникальность email в Patient table
    if (userData.email) {
      const existingPatient = await prisma.patient.findUnique({
        where: { email: userData.email },
      });

      if (existingPatient) {
        console.log('🔴 [AUTH SERVICE] Email уже существует в Patient:', userData.email);
        throw new Error('Patient with this email already exists');
      }
    }

    // Проверяем также в User table (на всякий случай)
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log('🔴 [AUTH SERVICE] Email уже существует в User:', userData.email);
      throw new Error('User with this email already exists');
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(userData.password);

    // Patient-ը պետք է ունենա clinicId - բայց self-registration-ի դեպքում clinicId չկա
    // Այս դեպքում մենք չենք կարող Patient ստեղծել առանց clinicId-ի
    // Լուծում: Patient-ը կարող է ստեղծվել առանց clinicId-ի, բայց appointments-ի համար պետք է clinicId
    // Կամ: Patient-ը ստեղծվում է, երբ նա գրանցվում է կոնկրետ clinic-ում
    // Բայց self-registration-ի դեպքում, մենք չենք գիտենք, թե որ clinic-ում է նա գրանցվում
    // 
    // Լավագույն լուծում: Patient-ը ստեղծվում է, երբ նա գրանցվում է clinic-ում (online appointment)
    // Self-registration-ի դեպքում, մենք պետք է պահանջենք clinicId կամ clinic slug
    // 
    // Բայց հիմա, եթե clinicId չկա, մենք չենք կարող Patient ստեղծել
    // Այսպիսով, self-registration-ի դեպքում, մենք պետք է պահանջենք clinicId կամ clinic slug

    if (!userData.clinicId && !userData.clinicSlug) {
      throw new Error('Clinic ID or slug is required for patient registration');
    }

    // Գտնում ենք clinic-ը
    let clinic;
    if (userData.clinicId) {
      clinic = await prisma.clinic.findUnique({
        where: { id: userData.clinicId },
      });
    } else if (userData.clinicSlug) {
      clinic = await prisma.clinic.findUnique({
        where: { slug: userData.clinicSlug },
      });
    }

    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Ստեղծում ենք Patient record
    const patient = await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        name: userData.name,
        phone: userData.phone || '',
        email: userData.email,
        passwordHash,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
        gender: userData.gender || null,
        status: 'registered', // Self-registered patient has account
      },
    });

    console.log('✅ [AUTH SERVICE] Patient создан:', { id: patient.id, email: patient.email });

    // Генерируем JWT токен для Patient
    const token = generateToken({
      patientId: patient.id, // Используем patientId вместо userId
      clinicId: clinic.id,
      role: 'PATIENT',
      status: 'registered',
    });

    // Возвращаем данные без passwordHash
    const { passwordHash: _, ...patientWithoutPassword } = patient;

    return {
      patient: patientWithoutPassword, // Возвращаем patient вместо user
      token,
      expiresIn: 604800, // 7 дней в секундах
    };
  }

  // 2. Проверяем уникальность email для других ролей (User table)
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    console.log('🔴 [AUTH SERVICE] Email уже существует:', userData.email);
    throw new Error('User with this email already exists');
  }

  // 3. Хешируем пароль
  const passwordHash = await hashPassword(userData.password);

  // 4. Определяем status в зависимости от роли
  // CLINIC получает instant access (ACTIVE) - владелец клиники
  // PARTNER требует одобрения (PENDING)
  const status = userData.role === 'CLINIC' ? 'ACTIVE' : 'PENDING';

  console.log('🔵 [AUTH SERVICE] Статус пользователя:', status);

  // 5. Если роль CLINIC - создаем клинику и владельца в транзакции
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

  // 6. Для других ролей (PARTNER, DOCTOR) - обычная регистрация в User table
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

  // 7. Добавляем role-specific поля для PARTNER
  if (userData.role === 'PARTNER') {
    userDataToCreate.organizationName = userData.organizationName;
    userDataToCreate.organizationType = userData.organizationType;
    userDataToCreate.inn = userData.inn;
    userDataToCreate.address = userData.organizationAddress;
  }

  // 8. Создаем пользователя
  const user = await prisma.user.create({
    data: userDataToCreate,
  });

  console.log('✅ [AUTH SERVICE] Пользователь создан:', { id: user.id, role: user.role, status: user.status });

  // 9. Генерируем JWT токен
  const token = generateToken({
    userId: user.id,
    clinicId: user.clinicId,
    role: user.role,
    status: user.status,
  });

  // 10. Возвращаем данные без passwordHash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    expiresIn: 604800, // 7 дней в секундах
  };
}

/**
 * Авторизует пользователя (User или Patient)
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль
 * @returns {Promise<object>} { user/patient, token }
 */
export async function loginUser(email, password) {
  console.log('🔵 [AUTH SERVICE] Попытка входа:', email);

  // 1. Сначала пытаемся найти в User table (для DOCTOR, PARTNER, ADMIN, CLINIC)
  let user = await prisma.user.findUnique({
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

  // 2. Если найден в User - обрабатываем как User
  if (user) {
    console.log('🔵 [AUTH SERVICE] Найден в User table:', { role: user.role });

    // Проверить status пользователя
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

    // Проверить пароль
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log('🔴 [AUTH SERVICE] Неверный пароль:', email);
      throw new Error('Invalid email or password');
    }

    console.log('✅ [AUTH SERVICE] Вход успешен (User):', { email, role: user.role, status: user.status });

    // Генерировать токен
    const token = generateToken({
      userId: user.id,
      clinicId: user.clinicId,
      role: user.role,
      status: user.status,
    });

    // Возвращаем данные без passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      expiresIn: 604800, // 7 дней в секундах
    };
  }

  // 3. Если не найден в User - пытаемся найти в Patient table
  console.log('🔵 [AUTH SERVICE] Не найден в User, ищем в Patient table');
  
  const patient = await prisma.patient.findUnique({
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

  if (!patient) {
    console.log('🔴 [AUTH SERVICE] Пользователь не найден ни в User, ни в Patient:', email);
    throw new Error('Invalid email or password');
  }

  // 4. Проверяем, что у Patient есть passwordHash (registered patient)
  if (!patient.passwordHash) {
    console.log('🔴 [AUTH SERVICE] Patient не имеет passwordHash (guest patient):', email);
    throw new Error('This patient account does not have login credentials. Please contact the clinic.');
  }

  // 5. Проверяем status пациента
  if (patient.status !== 'registered') {
    console.log('🔴 [AUTH SERVICE] Patient status не registered:', { email, status: patient.status });
    throw new Error('This patient account is not active. Please contact the clinic.');
  }

  // 6. Проверяем пароль
  const isPasswordValid = await verifyPassword(password, patient.passwordHash);

  if (!isPasswordValid) {
    console.log('🔴 [AUTH SERVICE] Неверный пароль для Patient:', email);
    throw new Error('Invalid email or password');
  }

  console.log('✅ [AUTH SERVICE] Вход успешен (Patient):', { email, status: patient.status });

  // 7. Генерировать токен для Patient
  const token = generateToken({
    patientId: patient.id, // Используем patientId вместо userId
    clinicId: patient.clinicId,
    role: 'PATIENT',
    status: 'registered',
  });

  // 8. Возвращаем данные без passwordHash
  const { passwordHash: _, ...patientWithoutPassword } = patient;

  return {
    patient: patientWithoutPassword, // Возвращаем patient вместо user
    token,
    expiresIn: 604800, // 7 дней в секундах
  };
}

/**
 * Получить текущего пользователя по ID (User или Patient)
 * @param {string} userId - ID пользователя (если User)
 * @param {string} patientId - ID пациента (если Patient)
 * @returns {Promise<object>} User или Patient данные
 */
export async function getCurrentUser(userId, patientId = null) {
  // Если есть patientId - ищем в Patient table
  if (patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
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

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Удаляем passwordHash
    const { passwordHash: _, ...patientWithoutPassword } = patient;

    return {
      ...patientWithoutPassword,
      type: 'patient', // Добавляем тип для различения
    };
  }

  // Иначе ищем в User table
  if (userId) {
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

    return {
      ...userWithoutPassword,
      type: 'user', // Добавляем тип для различения
    };
  }

  throw new Error('Either userId or patientId must be provided');
}

/**
 * Обновить пароль пользователя (для User)
 * @param {string} userId - ID пользователя
 * @param {string} currentPassword - Текущий пароль
 * @param {string} newPassword - Новый пароль
 * @returns {Promise<object>} Результат обновления
 */
export async function updatePassword(userId, currentPassword, newPassword) {
  console.log('🔵 [AUTH SERVICE] Обновление пароля пользователя (User):', userId);

  // Получаем пользователя
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Проверяем текущий пароль
  const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    console.log('🔴 [AUTH SERVICE] Неверный текущий пароль');
    throw new Error('Current password is incorrect');
  }

  // Хешируем новый пароль
  const newPasswordHash = await hashPassword(newPassword);

  // Обновляем пароль
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  console.log('✅ [AUTH SERVICE] Пароль успешно обновлен (User)');
  return { success: true, message: 'Password updated successfully' };
}

/**
 * Обновить пароль пациента (для Patient)
 * @param {string} patientId - ID пациента
 * @param {string} currentPassword - Текущий пароль
 * @param {string} newPassword - Новый пароль
 * @returns {Promise<object>} Результат обновления
 */
export async function updatePatientPassword(patientId, currentPassword, newPassword) {
  console.log('🔵 [AUTH SERVICE] Обновление пароля пациента (Patient):', patientId);

  // Получаем пациента
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Проверяем, что у пациента есть passwordHash (registered patient)
  if (!patient.passwordHash) {
    throw new Error('This patient account does not have a password. Please contact the clinic.');
  }

  // Проверяем текущий пароль
  const isPasswordValid = await verifyPassword(currentPassword, patient.passwordHash);
  if (!isPasswordValid) {
    console.log('🔴 [AUTH SERVICE] Неверный текущий пароль');
    throw new Error('Current password is incorrect');
  }

  // Хешируем новый пароль
  const newPasswordHash = await hashPassword(newPassword);

  // Обновляем пароль
  await prisma.patient.update({
    where: { id: patientId },
    data: { passwordHash: newPasswordHash },
  });

  console.log('✅ [AUTH SERVICE] Пароль успешно обновлен (Patient)');
  return { success: true, message: 'Password updated successfully' };
}

