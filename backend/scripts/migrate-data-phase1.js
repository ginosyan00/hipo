/**
 * Data Migration Script - Phase 1
 * Миграция существующих данных в новую архитектуру Global/Clinic Identity Separation
 * 
 * Этот скрипт:
 * 1. Мигрирует всех User (role=DOCTOR) → GlobalDoctor + ClinicDoctor
 * 2. Мигрирует всех Patient → GlobalPatient + ClinicPatient
 * 3. Заполняет optional поля в Appointment (clinicDoctorId, clinicPatientId)
 * 
 * Идемпотентный - можно запускать несколько раз безопасно
 */

import { PrismaClient } from '@prisma/client';
import * as globalDoctorService from '../src/services/global-doctor.service.js';
import * as clinicDoctorService from '../src/services/clinic-doctor.service.js';
import * as globalPatientService from '../src/services/global-patient.service.js';
import * as clinicPatientService from '../src/services/clinic-patient.service.js';

const prisma = new PrismaClient();

/**
 * Логирование с временной меткой
 */
function log(message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
}

/**
 * Мигрировать всех врачей (User role=DOCTOR) → GlobalDoctor + ClinicDoctor
 */
async function migrateDoctors() {
  log('🚀 Начало миграции врачей...');

  try {
    // Находим всех врачей
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        specialization: true,
        licenseNumber: true,
        experience: true,
        status: true,
      },
    });

    log(`📊 Найдено врачей для миграции: ${doctors.length}`);

    if (doctors.length === 0) {
      log('⚠️  Врачи не найдены, пропускаем миграцию врачей');
      return { migrated: 0, skipped: 0, errors: 0 };
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Мигрируем каждого врача
    for (const doctor of doctors) {
      try {
        // Проверяем, что у врача есть clinicId
        if (!doctor.clinicId) {
          log(`⚠️  Врач ${doctor.id} (${doctor.email}) не имеет clinicId, пропускаем`, { doctorId: doctor.id });
          skipped++;
          continue;
        }

        // 1. Создаем или находим GlobalDoctor
        let globalDoctor;
        try {
          globalDoctor = await globalDoctorService.findOrCreateGlobalDoctorForUser(doctor.id);
          log(`✅ GlobalDoctor создан/найден для врача ${doctor.email}`, { globalDoctorId: globalDoctor.id });
        } catch (error) {
          log(`❌ Ошибка при создании GlobalDoctor для ${doctor.email}:`, { error: error.message });
          errors++;
          continue;
        }

        // 2. Создаем или находим ClinicDoctor для этой клиники
        try {
          const clinicDoctor = await clinicDoctorService.findOrCreateClinicDoctorForUser(
            doctor.id,
            doctor.clinicId,
            {
              specialization: doctor.specialization,
              licenseNumber: doctor.licenseNumber,
              experience: doctor.experience,
              isActive: doctor.status === 'ACTIVE',
            }
          );
          log(`✅ ClinicDoctor создан/найден для врача ${doctor.email} в клинике ${doctor.clinicId}`, {
            clinicDoctorId: clinicDoctor.id,
          });
          migrated++;
        } catch (error) {
          log(`❌ Ошибка при создании ClinicDoctor для ${doctor.email}:`, { error: error.message });
          errors++;
        }
      } catch (error) {
        log(`❌ Общая ошибка при миграции врача ${doctor.email}:`, { error: error.message });
        errors++;
      }
    }

    log(`✅ Миграция врачей завершена: migrated=${migrated}, skipped=${skipped}, errors=${errors}`);

    return { migrated, skipped, errors };
  } catch (error) {
    log(`❌ Критическая ошибка при миграции врачей:`, { error: error.message });
    throw error;
  }
}

/**
 * Мигрировать всех пациентов → GlobalPatient + ClinicPatient
 */
async function migratePatients() {
  log('🚀 Начало миграции пациентов...');

  try {
    // Находим всех пациентов
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        clinicId: true,
        name: true,
        phone: true,
        email: true,
        passwordHash: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        notes: true,
        status: true,
      },
    });

    log(`📊 Найдено пациентов для миграции: ${patients.length}`);

    if (patients.length === 0) {
      log('⚠️  Пациенты не найдены, пропускаем миграцию пациентов');
      return { migrated: 0, skipped: 0, errors: 0 };
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Группируем пациентов по phone/email для создания одного GlobalPatient на группу
    const patientGroups = new Map();

    for (const patient of patients) {
      // Ключ для группировки: phone или email
      const key = patient.phone || patient.email || patient.id;

      if (!patientGroups.has(key)) {
        patientGroups.set(key, []);
      }
      patientGroups.get(key).push(patient);
    }

    log(`📊 Найдено уникальных групп пациентов: ${patientGroups.size}`);

    // Мигрируем каждую группу пациентов
    for (const [key, groupPatients] of patientGroups.entries()) {
      try {
        // Первый пациент в группе - используем его данные для GlobalPatient
        const firstPatient = groupPatients[0];

        // 1. Создаем или находим GlobalPatient
        let globalPatient;
        try {
          globalPatient = await globalPatientService.findOrCreateGlobalPatient({
            phone: firstPatient.phone,
            email: firstPatient.email,
            dateOfBirth: firstPatient.dateOfBirth,
            userId: null, // Пациенты из старой структуры не имеют User
          });
          log(`✅ GlobalPatient создан/найден для группы ${key}`, { globalPatientId: globalPatient.id });
        } catch (error) {
          log(`❌ Ошибка при создании GlobalPatient для группы ${key}:`, { error: error.message });
          errors += groupPatients.length;
          continue;
        }

        // 2. Создаем ClinicPatient для каждого пациента в группе (они могут быть из разных клиник)
        for (const patient of groupPatients) {
          try {
            const clinicPatient = await clinicPatientService.createClinicPatient(
              patient.clinicId,
              {
                name: patient.name,
                phone: patient.phone,
                email: patient.email,
                passwordHash: patient.passwordHash,
                avatar: patient.avatar,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                notes: patient.notes,
                status: patient.status,
              },
              globalPatient.id
            );
            log(`✅ ClinicPatient создан/найден для пациента ${patient.name} в клинике ${patient.clinicId}`, {
              clinicPatientId: clinicPatient.id,
            });
            migrated++;
          } catch (error) {
            // Если уже существует - это нормально (идемпотентность)
            if (error.message.includes('already exists') || error.message.includes('Unique constraint')) {
              log(`⚠️  ClinicPatient уже существует для пациента ${patient.name}, пропускаем`);
              skipped++;
            } else {
              log(`❌ Ошибка при создании ClinicPatient для пациента ${patient.name}:`, {
                error: error.message,
              });
              errors++;
            }
          }
        }
      } catch (error) {
        log(`❌ Общая ошибка при миграции группы пациентов ${key}:`, { error: error.message });
        errors += groupPatients.length;
      }
    }

    log(`✅ Миграция пациентов завершена: migrated=${migrated}, skipped=${skipped}, errors=${errors}`);

    return { migrated, skipped, errors };
  } catch (error) {
    log(`❌ Критическая ошибка при миграции пациентов:`, { error: error.message });
    throw error;
  }
}

/**
 * Заполнить optional поля в Appointment (clinicDoctorId, clinicPatientId)
 */
async function migrateAppointments() {
  log('🚀 Начало миграции appointments...');

  try {
    // Находим все appointments
    const appointments = await prisma.appointment.findMany({
      select: {
        id: true,
        clinicId: true,
        doctorId: true,
        patientId: true,
        clinicDoctorId: true,
        clinicPatientId: true,
      },
    });

    log(`📊 Найдено appointments для миграции: ${appointments.length}`);

    if (appointments.length === 0) {
      log('⚠️  Appointments не найдены, пропускаем миграцию appointments');
      return { migrated: 0, skipped: 0, errors: 0 };
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Мигрируем каждый appointment
    for (const appointment of appointments) {
      try {
        // Проверяем, что поля уже не заполнены
        if (appointment.clinicDoctorId && appointment.clinicPatientId) {
          log(`⚠️  Appointment ${appointment.id} уже имеет clinicDoctorId и clinicPatientId, пропускаем`);
          skipped++;
          continue;
        }

        let needsUpdate = false;
        const updateData = {};

        // 1. Найти ClinicDoctor
        if (!appointment.clinicDoctorId && appointment.doctorId && appointment.clinicId) {
          try {
            const clinicDoctor = await clinicDoctorService.findClinicDoctorForUser(
              appointment.doctorId,
              appointment.clinicId
            );

            if (clinicDoctor) {
              updateData.clinicDoctorId = clinicDoctor.id;
              needsUpdate = true;
              log(`✅ Найден ClinicDoctor для appointment ${appointment.id}`, {
                clinicDoctorId: clinicDoctor.id,
              });
            } else {
              log(`⚠️  ClinicDoctor не найден для appointment ${appointment.id} (doctorId=${appointment.doctorId}, clinicId=${appointment.clinicId})`);
            }
          } catch (error) {
            log(`❌ Ошибка при поиске ClinicDoctor для appointment ${appointment.id}:`, {
              error: error.message,
            });
          }
        }

        // 2. Найти ClinicPatient
        if (!appointment.clinicPatientId && appointment.patientId && appointment.clinicId) {
          try {
            // Сначала находим Patient
            const patient = await prisma.patient.findUnique({
              where: { id: appointment.patientId },
              select: {
                id: true,
                clinicId: true,
                phone: true,
                email: true,
                dateOfBirth: true,
              },
            });

            if (patient && patient.clinicId === appointment.clinicId) {
              // Находим GlobalPatient по matching
              const globalPatient = await globalPatientService.findGlobalPatientByMatch({
                phone: patient.phone,
                email: patient.email,
                dateOfBirth: patient.dateOfBirth,
              });

              if (globalPatient) {
                // Находим ClinicPatient
                const clinicPatient = await clinicPatientService.findClinicPatientForGlobal(
                  globalPatient.id,
                  appointment.clinicId
                );

                if (clinicPatient) {
                  updateData.clinicPatientId = clinicPatient.id;
                  needsUpdate = true;
                  log(`✅ Найден ClinicPatient для appointment ${appointment.id}`, {
                    clinicPatientId: clinicPatient.id,
                  });
                } else {
                  log(`⚠️  ClinicPatient не найден для appointment ${appointment.id}`);
                }
              } else {
                log(`⚠️  GlobalPatient не найден для appointment ${appointment.id}`);
              }
            } else {
              log(`⚠️  Patient не найден или не принадлежит клинике для appointment ${appointment.id}`);
            }
          } catch (error) {
            log(`❌ Ошибка при поиске ClinicPatient для appointment ${appointment.id}:`, {
              error: error.message,
            });
          }
        }

        // 3. Обновляем appointment, если есть что обновлять
        if (needsUpdate) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: updateData,
          });
          log(`✅ Appointment ${appointment.id} обновлен`, updateData);
          migrated++;
        } else {
          skipped++;
        }
      } catch (error) {
        log(`❌ Общая ошибка при миграции appointment ${appointment.id}:`, { error: error.message });
        errors++;
      }
    }

    log(`✅ Миграция appointments завершена: migrated=${migrated}, skipped=${skipped}, errors=${errors}`);

    return { migrated, skipped, errors };
  } catch (error) {
    log(`❌ Критическая ошибка при миграции appointments:`, { error: error.message });
    throw error;
  }
}

/**
 * Основная функция миграции
 */
async function migrateData() {
  log('═══════════════════════════════════════════════════════════');
  log('🚀 НАЧАЛО DATA MIGRATION - PHASE 1');
  log('═══════════════════════════════════════════════════════════\n');

  const results = {
    doctors: { migrated: 0, skipped: 0, errors: 0 },
    patients: { migrated: 0, skipped: 0, errors: 0 },
    appointments: { migrated: 0, skipped: 0, errors: 0 },
  };

  try {
    // 1. Мигрируем врачей
    log('\n📋 ШАГ 1: Миграция врачей\n');
    results.doctors = await migrateDoctors();

    // 2. Мигрируем пациентов
    log('\n📋 ШАГ 2: Миграция пациентов\n');
    results.patients = await migratePatients();

    // 3. Мигрируем appointments
    log('\n📋 ШАГ 3: Миграция appointments\n');
    results.appointments = await migrateAppointments();

    // Итоговая статистика
    log('\n═══════════════════════════════════════════════════════════');
    log('✅ MIGRATION ЗАВЕРШЕНА');
    log('═══════════════════════════════════════════════════════════\n');
    log('📊 СТАТИСТИКА:');
    log(`   Врачи: migrated=${results.doctors.migrated}, skipped=${results.doctors.skipped}, errors=${results.doctors.errors}`);
    log(`   Пациенты: migrated=${results.patients.migrated}, skipped=${results.patients.skipped}, errors=${results.patients.errors}`);
    log(`   Appointments: migrated=${results.appointments.migrated}, skipped=${results.appointments.skipped}, errors=${results.appointments.errors}`);
    log('\n');

    const totalErrors = results.doctors.errors + results.patients.errors + results.appointments.errors;

    if (totalErrors > 0) {
      log('⚠️  ВНИМАНИЕ: Были ошибки при миграции. Проверьте логи выше.');
      process.exit(1);
    } else {
      log('🎉 Все данные успешно мигрированы!');
      process.exit(0);
    }
  } catch (error) {
    log('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем миграцию
migrateData();


