/**
 * Script to complete migration for remaining records
 * Обновляет оставшиеся записи, которые не были автоматически мигрированы
 */

import { PrismaClient } from '@prisma/client';
import { globalPatientService } from '../src/services/global-patient.service.js';
import { clinicPatientService } from '../src/services/clinic-patient.service.js';
import { clinicDoctorService } from '../src/services/clinic-doctor.service.js';

const prisma = new PrismaClient();

/**
 * Логирование
 */
function log(message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
}

/**
 * Мигрировать оставшихся пациентов
 */
async function migrateRemainingPatients() {
  log('🔵 Начинаем миграцию оставшихся пациентов...\n');

  try {
    // Находим всех пациентов из старой таблицы
    const allPatients = await prisma.patient.findMany({
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    log(`📋 Найдено ${allPatients.length} пациентов в старой таблице\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const patient of allPatients) {
      try {
        // Проверяем, есть ли уже GlobalPatient для этого пациента
        const existingGlobalPatient = await prisma.globalPatient.findFirst({
          where: {
            clinicPatients: {
              some: {
                clinicId: patient.clinicId,
                name: patient.name,
                phone: patient.phone,
              },
            },
          },
        });

        if (existingGlobalPatient) {
          log(`⏭️  Пациент ${patient.name} уже мигрирован, пропускаем`);
          skipped++;
          continue;
        }

        // Создаем GlobalPatient и ClinicPatient
        log(`🔄 Мигрируем пациента: ${patient.name} (${patient.phone})`);

        const globalPatient = await globalPatientService.findOrCreateGlobalPatient({
          phone: patient.phone,
          email: patient.email,
        });

        // Создаем ClinicPatient
        await clinicPatientService.createClinicPatient(patient.clinicId, globalPatient.id, {
          name: patient.name,
          phone: patient.phone,
          email: patient.email || undefined,
          passwordHash: patient.passwordHash || undefined,
          avatar: patient.avatar || undefined,
          dateOfBirth: patient.dateOfBirth || undefined,
          gender: patient.gender || undefined,
          notes: patient.notes || undefined,
          status: patient.status || 'guest',
        });

        log(`✅ Пациент ${patient.name} успешно мигрирован`);
        migrated++;
      } catch (error) {
        log(`❌ Ошибка при миграции пациента ${patient.name}:`, { error: error.message });
        errors++;
      }
    }

    log(`\n📊 Результаты миграции пациентов:`);
    log(`   ✅ Мигрировано: ${migrated}`);
    log(`   ⏭️  Пропущено: ${skipped}`);
    log(`   ❌ Ошибок: ${errors}`);
  } catch (error) {
    log('❌ КРИТИЧЕСКАЯ ОШИБКА при миграции пациентов:', { error: error.message });
  }
}

/**
 * Обновить appointments без clinicDoctorId
 */
async function updateAppointmentsWithoutDoctorId() {
  log('\n🔵 Обновляем appointments без clinicDoctorId...\n');

  try {
    // Находим appointments без clinicDoctorId, но с doctorId
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicDoctorId: null,
        doctorId: { not: null },
      },
      include: {
        doctor: {
          select: {
            id: true,
            clinicId: true,
          },
        },
        clinic: {
          select: {
            id: true,
          },
        },
      },
    });

    log(`📋 Найдено ${appointments.length} appointments для обновления\n`);

    let updated = 0;
    let errors = 0;

    for (const appointment of appointments) {
      try {
        if (!appointment.doctor || !appointment.clinic) {
          log(`⚠️  Appointment ${appointment.id}: нет врача или клиники, пропускаем`);
          continue;
        }

        log(`🔄 Обновляем appointment ${appointment.id}...`);

        // Находим ClinicDoctor для этого врача
        const clinicDoctor = await clinicDoctorService.findClinicDoctorForUser(
          appointment.clinic.id,
          appointment.doctor.id
        );

        if (!clinicDoctor) {
          log(`⚠️  ClinicDoctor не найден для врача ${appointment.doctor.id}, пропускаем`);
          continue;
        }

        // Обновляем appointment
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            clinicDoctorId: clinicDoctor.id,
          },
        });

        log(`✅ Appointment ${appointment.id} обновлен`);
        updated++;
      } catch (error) {
        log(`❌ Ошибка при обновлении appointment ${appointment.id}:`, { error: error.message });
        errors++;
      }
    }

    log(`\n📊 Результаты обновления appointments:`);
    log(`   ✅ Обновлено: ${updated}`);
    log(`   ❌ Ошибок: ${errors}`);
  } catch (error) {
    log('❌ КРИТИЧЕСКАЯ ОШИБКА при обновлении appointments:', { error: error.message });
  }
}

/**
 * Основная функция
 */
async function completeMigration() {
  log('═══════════════════════════════════════════════════════════');
  log('🔄 ЗАВЕРШЕНИЕ MIGRATION');
  log('═══════════════════════════════════════════════════════════\n');

  try {
    await migrateRemainingPatients();
    await updateAppointmentsWithoutDoctorId();

    log('\n═══════════════════════════════════════════════════════════');
    log('✅ ЗАВЕРШЕНИЕ MIGRATION ЗАВЕРШЕНО');
    log('═══════════════════════════════════════════════════════════\n');
    log('💡 Запустите verify-migration.js для проверки результатов');
  } catch (error) {
    log('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем завершение миграции
completeMigration();

