import { prisma } from '../config/database.js';
import * as globalPatientService from './global-patient.service.js';
import * as clinicPatientService from './clinic-patient.service.js';

/**
 * Patient Service
 * Бизнес-логика для работы с пациентами
 */

/**
 * Получить всех пациентов клиники
 * @param {string} clinicId - ID клиники
 * @param {object} options - Опции (search, page, limit)
 * @returns {Promise<object>} { patients, meta }
 */
export async function findAll(clinicId, options = {}) {
  const { search, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Построение where clause
  const where = {
    clinicId, // ВСЕГДА фильтруем по clinicId!
  };

  // Получаем всех пациентов (без пагинации для дедупликации и поиска)
  // Поиск будем делать на уровне приложения для case-insensitive поиска
  const allPatients = await prisma.patient.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { appointments: true },
      },
    },
  });

  // Убираем дубликаты: группируем по телефону или email в рамках клиники
  // Если у пациента есть несколько записей с одинаковым телефоном/email, берем самую новую
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

  let uniquePatients = Array.from(uniquePatientsMap.values());

  // Фильтруем по поиску (case-insensitive) на уровне приложения
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim();
    const searchOriginal = search.trim();
    const beforeFilter = uniquePatients.length;
    
    console.log('🔵 [PATIENT SERVICE] Начало поиска:', {
      searchQuery: search,
      searchLower,
      searchOriginal,
      totalPatientsBeforeFilter: beforeFilter,
      sampleNames: uniquePatients.slice(0, 5).map(p => p.name),
    });
    
    uniquePatients = uniquePatients.filter(patient => {
      const nameMatch = patient.name && patient.name.toLowerCase().includes(searchLower);
      const phoneMatch = patient.phone && patient.phone.includes(searchOriginal);
      const emailMatch = patient.email && patient.email.toLowerCase().includes(searchLower);
      
      const matches = nameMatch || phoneMatch || emailMatch;
      
      if (matches) {
        console.log('✅ [PATIENT SERVICE] Найден пациент:', {
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          nameMatch,
          phoneMatch,
          emailMatch,
        });
      }
      
      return matches;
    });
    
    // Логирование для отладки
    console.log('🔵 [PATIENT SERVICE] Результат поиска:', {
      searchQuery: search,
      beforeFilter,
      afterFilter: uniquePatients.length,
      found: uniquePatients.map(p => ({ id: p.id, name: p.name, phone: p.phone })),
    });
  }

  const total = uniquePatients.length;

  // Логирование для отладки (когда нет поиска, показываем всех)
  if (!search || !search.trim()) {
    console.log('🔵 [PATIENT SERVICE] Загрузка всех пациентов:', {
      clinicId,
      totalBeforeDedup: allPatients.length,
      totalAfterDedup: uniquePatients.length,
      limit,
      page,
      skip,
      willReturn: Math.min(uniquePatients.length - skip, limit),
    });
  }

  // Применяем пагинацию после дедупликации
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

/**
 * Получить пациента по ID
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента
 * @returns {Promise<object>} Patient
 */
export async function findById(clinicId, patientId) {
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      clinicId, // ОБЯЗАТЕЛЬНО!
    },
    include: {
      appointments: {
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
        },
        orderBy: { appointmentDate: 'desc' },
        // Убрали take: 10 - теперь возвращаем ВСЕ приёмы для полной истории
      },
    },
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  return patient;
}

/**
 * Найти пациента по телефону в рамках клиники
 * @param {string} clinicId - ID клиники
 * @param {string} phone - Телефон
 * @returns {Promise<object|null>} Patient или null
 */
export async function findByPhone(clinicId, phone) {
  return await prisma.patient.findFirst({
    where: {
      clinicId,
      phone,
    },
  });
}

/**
 * Найти пациента по телефону ИЛИ email в рамках клиники
 * @param {string} clinicId - ID клиники
 * @param {string} phone - Телефон
 * @param {string} email - Email (опционально)
 * @returns {Promise<object|null>} Patient или null
 */
export async function findByPhoneOrEmail(clinicId, phone, email = null) {
  const where = {
    clinicId,
    OR: [
      { phone },
    ],
  };

  if (email) {
    where.OR.push({ email });
  }

  return await prisma.patient.findFirst({
    where,
  });
}

/**
 * Найти или создать пациента в клинике
 * Ищет по телефону и email, если не найден - создает нового
 * @param {string} clinicId - ID клиники
 * @param {object} patientData - Данные пациента (name, phone, email, dateOfBirth, gender)
 * @returns {Promise<object>} Найденный или созданный Patient
 */
export async function findOrCreatePatient(clinicId, patientData) {
  console.log('🔵 [PATIENT SERVICE] Поиск или создание пациента:', { clinicId, phone: patientData.phone, email: patientData.email });

  // Ищем существующего пациента по телефону или email
  const existingPatient = await findByPhoneOrEmail(
    clinicId,
    patientData.phone,
    patientData.email || null
  );

  if (existingPatient) {
    console.log('✅ [PATIENT SERVICE] Найден существующий пациент:', existingPatient.id);
    
    // Обновляем данные пациента, если они изменились (например, имя или email)
    const updateData = {};
    if (patientData.name && patientData.name !== existingPatient.name) {
      updateData.name = patientData.name;
    }
    if (patientData.email && patientData.email !== existingPatient.email) {
      updateData.email = patientData.email;
    }
    if (patientData.dateOfBirth && patientData.dateOfBirth !== existingPatient.dateOfBirth) {
      updateData.dateOfBirth = patientData.dateOfBirth;
    }
    if (patientData.gender && patientData.gender !== existingPatient.gender) {
      updateData.gender = patientData.gender;
    }

    // Обновляем только если есть изменения
    if (Object.keys(updateData).length > 0) {
      console.log('🔵 [PATIENT SERVICE] Обновление данных пациента:', updateData);
      return await prisma.patient.update({
        where: { id: existingPatient.id },
        data: updateData,
      });
    }

    return existingPatient;
  }

  // Пациент не найден - создаем нового
  console.log('🔵 [PATIENT SERVICE] Создание нового пациента');
  return await create(clinicId, patientData);
}

/**
 * Найти пациента по email или phone (для PATIENT users)
 * @param {string} email - Email пользователя
 * @param {string} phone - Телефон пользователя (опционально)
 * @returns {Promise<object|null>} Patient или null
 */
export async function findByUserEmail(email, phone = null) {
  const where = {};
  
  if (email) {
    where.email = email;
  }
  
  if (phone) {
    where.OR = [
      { email: email || undefined },
      { phone: phone },
    ];
  } else if (email) {
    where.email = email;
  }

  const patient = await prisma.patient.findFirst({
    where,
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
    orderBy: { createdAt: 'desc' },
  });

  return patient;
}

/**
 * Получить все appointments для пациента по email
 * @param {string} email - Email пользователя
 * @param {object} options - Опции (status, page, limit)
 * @returns {Promise<object>} { appointments, meta }
 */
export async function getPatientAppointments(email, options = {}) {
  const { status, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Находим пациента по email
  const patient = await findByUserEmail(email);
  
  if (!patient) {
    return {
      appointments: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }

  // Построение where clause для appointments
  const where = {
    patientId: patient.id,
  };

  if (status) {
    where.status = status;
  }

  // Получаем appointments и общее количество
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            phone: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            address: true,
            phone: true,
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
      take: limit,
      skip,
    }),
    prisma.appointment.count({ where }),
  ]);

  // Debug: Проверяем appointments и amount
  console.log('🔵 [PATIENT SERVICE] getPatientAppointments - Total appointments:', appointments.length);
  console.log('🔵 [PATIENT SERVICE] Completed appointments:', appointments.filter(apt => apt.status === 'completed').length);
  console.log('🔵 [PATIENT SERVICE] Appointments with amount:', appointments.filter(apt => apt.amount && apt.amount > 0).length);
  appointments.forEach(apt => {
    if (apt.status === 'completed') {
      console.log(`🔵 [PATIENT SERVICE] Appointment ${apt.id}: status=${apt.status}, amount=${apt.amount}`);
    }
  });

  return {
    appointments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Создать пациента
 * @param {string} clinicId - ID клиники
 * @param {object} data - Данные пациента
 * @returns {Promise<object>} Созданный пациент
 */
export async function create(clinicId, data) {
  const patient = await prisma.patient.create({
    data: {
      clinicId, // ОБЯЗАТЕЛЬНО!
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender || null,
      notes: data.notes || null,
      status: data.status || 'registered', // Статус пациента: registered (по умолчанию) или guest
    },
  });

  // Создаем GlobalPatient + ClinicPatient (Phase 2: новая архитектура)
  try {
    console.log('🔵 [PATIENT SERVICE] Создание GlobalPatient + ClinicPatient для пациента:', patient.id);

    // Создаем или находим GlobalPatient
    const globalPatient = await globalPatientService.findOrCreateGlobalPatient({
      phone: patient.phone,
      email: patient.email,
      dateOfBirth: patient.dateOfBirth,
      userId: null, // Patient из старой структуры не имеет User
    });
    console.log('✅ [PATIENT SERVICE] GlobalPatient создан/найден:', globalPatient.id);

    // Создаем ClinicPatient
    const clinicPatient = await clinicPatientService.createClinicPatient(
      clinicId,
      {
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        passwordHash: patient.passwordHash || null,
        avatar: patient.avatar || null,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        notes: patient.notes || null,
        status: patient.status || 'guest',
        userId: null, // Patient из старой структуры не имеет User
      },
      globalPatient.id
    );
    console.log('✅ [PATIENT SERVICE] ClinicPatient создан:', clinicPatient.id);
  } catch (error) {
    // Логируем ошибку, но не прерываем создание (fallback на старое)
    // Если ClinicPatient уже существует - это нормально (идемпотентность)
    if (error.message.includes('already exists') || error.message.includes('Unique constraint')) {
      console.log('ℹ️ [PATIENT SERVICE] ClinicPatient уже существует (идемпотентность)');
    } else {
      console.warn('⚠️ [PATIENT SERVICE] Ошибка при создании GlobalPatient/ClinicPatient (не критично):', error.message);
    }
  }

  return patient;
}

/**
 * Обновить пациента
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента
 * @param {object} data - Данные для обновления
 * @returns {Promise<object>} Обновленный пациент
 */
export async function update(clinicId, patientId, data) {
  // Проверяем что пациент существует
  await findById(clinicId, patientId);

  // Обновляем
  const updated = await prisma.patient.update({
    where: { id: patientId },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
      notes: data.notes,
      status: data.status, // Статус пациента
    },
  });

  return updated;
}

/**
 * Удалить пациента
 * @param {string} clinicId - ID клиники
 * @param {string} patientId - ID пациента
 */
export async function remove(clinicId, patientId) {
  // Проверяем что пациент существует
  await findById(clinicId, patientId);

  // Удаляем
  await prisma.patient.delete({
    where: { id: patientId },
  });
}

/**
 * Получить все визиты пациентов клиники с полной информацией
 * @param {string} clinicId - ID клиники
 * @param {object} options - Опции (doctorId, search, status, page, limit)
 * @returns {Promise<object>} { visits, meta }
 * 
 * ВАЖНО: По умолчанию возвращаются только завершенные приёмы (status='completed'),
 * чтобы раздел Patients показывал только пациентов с завершенными визитами.
 * Для получения всех визитов нужно явно указать status или передать status=null.
 */
export async function findAllVisits(clinicId, options = {}) {
  const { doctorId, search, status, page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  // Построение where clause
  const where = {
    clinicId, // ВСЕГДА фильтруем по clinicId!
  };

  if (doctorId) where.doctorId = doctorId;
  
  // По умолчанию показываем только завершенные приёмы (completed)
  // Если status === '' (пустая строка), это означает "показать все статусы" - не фильтруем
  // Если status === undefined или null, используем дефолт 'completed'
  // Если status указан (любое другое значение), используем его
  if (status === '') {
    // Пустая строка означает "показать все статусы" - не добавляем фильтр
    // where.status не устанавливается
  } else if (status !== undefined && status !== null) {
    // Явно указанный статус
    where.status = status;
  } else {
    // Дефолтное поведение: только завершенные приёмы
    where.status = 'completed';
  }

  // Получаем все appointments с полной информацией о пациенте и враче
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            phone: true,
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
      take: limit,
      skip,
    }),
    prisma.appointment.count({ where }),
  ]);

  // Фильтруем по поиску (если указан) - фильтруем на уровне приложения
  let filteredAppointments = appointments;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredAppointments = appointments.filter(apt => {
      return (
        apt.patient.name.toLowerCase().includes(searchLower) ||
        apt.patient.phone.includes(search) ||
        (apt.patient.email && apt.patient.email.toLowerCase().includes(searchLower)) ||
        (apt.doctor.name && apt.doctor.name.toLowerCase().includes(searchLower)) ||
        (apt.reason && apt.reason.toLowerCase().includes(searchLower))
      );
    });
  }

  // Формируем результат в формате "визитов"
  const visits = filteredAppointments.map(apt => ({
    id: apt.id,
    appointmentId: apt.id,
    patientId: apt.patientId,
    patientName: apt.patient.name,
    patientPhone: apt.patient.phone,
    patientEmail: apt.patient.email,
    patientDateOfBirth: apt.patient.dateOfBirth,
    patientGender: apt.patient.gender,
    doctorId: apt.doctorId,
    doctorName: apt.doctor.name,
    doctorSpecialization: apt.doctor.specialization,
    appointmentDate: apt.appointmentDate,
    duration: apt.duration,
    status: apt.status,
    reason: apt.reason,
    amount: apt.amount,
    notes: apt.notes,
    createdAt: apt.createdAt,
    updatedAt: apt.updatedAt,
  }));

  return {
    visits,
    meta: {
      total: search ? filteredAppointments.length : total,
      page,
      limit,
      totalPages: Math.ceil((search ? filteredAppointments.length : total) / limit),
    },
  };
}

/**
 * Получить агрегированные данные пациентов врача
 * Группирует пациентов и показывает: количество визитов, сумма оплат, последний визит, процедуры
 * @param {string} clinicId - ID клиники
 * @param {string} doctorId - ID врача
 * @param {object} options - Опции (search, page, limit)
 * @returns {Promise<object>} { patients, meta }
 */
export async function findDoctorPatients(clinicId, doctorId, options = {}) {
  const { search, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  console.log('🔵 [PATIENT SERVICE] findDoctorPatients:', { clinicId, doctorId, search, page, limit });

  // Получаем все appointments врача с полной информацией
  const where = {
    clinicId,
    doctorId,
    // Показываем все статусы, но можно фильтровать по completed если нужно
  };

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          dateOfBirth: true,
          gender: true,
        },
      },
    },
    orderBy: { appointmentDate: 'desc' },
  });

  console.log('🔵 [PATIENT SERVICE] Найдено appointments:', appointments.length);

  // Группируем по patientId и агрегируем данные
  const patientMap = new Map();

  for (const apt of appointments) {
    const patientId = apt.patientId;
    
    if (!patientMap.has(patientId)) {
      // Первый визит этого пациента
      patientMap.set(patientId, {
        patientId: apt.patient.id,
        patientName: apt.patient.name,
        patientPhone: apt.patient.phone,
        patientEmail: apt.patient.email,
        patientDateOfBirth: apt.patient.dateOfBirth,
        patientGender: apt.patient.gender,
        visitCount: 1,
        totalAmount: apt.amount || 0,
        lastVisitDate: apt.appointmentDate,
        lastVisitStatus: apt.status,
        procedures: apt.reason ? [apt.reason] : [],
        appointments: [apt],
      });
    } else {
      // Добавляем данные к существующему пациенту
      const patientData = patientMap.get(patientId);
      patientData.visitCount += 1;
      patientData.totalAmount += (apt.amount || 0);
      
      // Обновляем последний визит (appointments уже отсортированы по дате desc)
      if (new Date(apt.appointmentDate) > new Date(patientData.lastVisitDate)) {
        patientData.lastVisitDate = apt.appointmentDate;
        patientData.lastVisitStatus = apt.status;
      }
      
      // Добавляем процедуру если её еще нет
      if (apt.reason && !patientData.procedures.includes(apt.reason)) {
        patientData.procedures.push(apt.reason);
      }
      
      patientData.appointments.push(apt);
    }
  }

  // Преобразуем Map в массив
  let patients = Array.from(patientMap.values());

  // Фильтруем по поиску (если указан)
  if (search) {
    const searchLower = search.toLowerCase();
    patients = patients.filter(p => {
      return (
        p.patientName.toLowerCase().includes(searchLower) ||
        p.patientPhone.includes(search) ||
        (p.patientEmail && p.patientEmail.toLowerCase().includes(searchLower)) ||
        p.procedures.some(proc => proc.toLowerCase().includes(searchLower))
      );
    });
  }

  const total = patients.length;

  // Применяем пагинацию
  const paginatedPatients = patients.slice(skip, skip + limit);

  // Формируем финальный результат
  const result = paginatedPatients.map(p => ({
    patientId: p.patientId,
    patientName: p.patientName,
    patientPhone: p.patientPhone,
    patientEmail: p.patientEmail,
    patientDateOfBirth: p.patientDateOfBirth,
    patientGender: p.patientGender,
    visitCount: p.visitCount,
    totalAmount: p.totalAmount,
    lastVisitDate: p.lastVisitDate,
    lastVisitStatus: p.lastVisitStatus,
    procedures: p.procedures,
  }));

  console.log('🔵 [PATIENT SERVICE] Результат агрегации:', {
    totalPatients: total,
    paginated: result.length,
    sample: result[0] || null,
  });

  return {
    patients: result,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
