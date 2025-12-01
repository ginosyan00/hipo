/**
 * Script to verify migration success
 * Проверяет что все данные мигрированы корректно
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Логирование
 */
function log(message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
}

/**
 * Проверить таблицы
 */
async function checkTables() {
  log('📊 Проверка таблиц...\n');

  const tables = ['global_doctors', 'clinic_doctors', 'global_patients', 'clinic_patients'];

  for (const table of tables) {
    try {
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table};`);
      // BigInt нужно конвертировать в число
      const count = Number(result[0]?.count || 0);
      
      if (count > 0) {
        log(`✅ Таблица ${table}: ${count} записей`, { table, count });
      } else {
        log(`⚠️  Таблица ${table}: пуста`, { table, count });
      }
    } catch (error) {
      log(`❌ Таблица ${table}: ошибка`, { error: error.message });
    }
  }
}

/**
 * Проверить appointments
 */
async function checkAppointments() {
  log('\n📋 Проверка appointments...\n');

  try {
    const total = await prisma.appointment.count();
    const withDoctor = await prisma.appointment.count({
      where: { clinicDoctorId: { not: null } },
    });
    const withPatient = await prisma.appointment.count({
      where: { clinicPatientId: { not: null } },
    });
    const withBoth = await prisma.appointment.count({
      where: {
        clinicDoctorId: { not: null },
        clinicPatientId: { not: null },
      },
    });

    log(`Всего appointments: ${total}`);
    log(`С clinicDoctorId: ${withDoctor} (${((withDoctor / total) * 100).toFixed(1)}%)`);
    log(`С clinicPatientId: ${withPatient} (${((withPatient / total) * 100).toFixed(1)}%)`);
    log(`С обоими полями: ${withBoth} (${((withBoth / total) * 100).toFixed(1)}%)`);

    if (withBoth === total) {
      log('✅ Все appointments обновлены!');
    } else if (withBoth > 0) {
      log(`⚠️  Частично обновлено: ${withBoth}/${total}`);
    } else {
      log('⚠️  Appointments не обновлены');
    }
  } catch (error) {
    log('❌ Ошибка при проверке appointments:', { error: error.message });
  }
}

/**
 * Проверить связи
 */
async function checkRelations() {
  log('\n🔗 Проверка связей...\n');

  try {
    // Проверить что у каждого врача есть GlobalDoctor
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      include: {
        globalDoctor: {
          include: {
            clinicDoctors: true,
          },
        },
      },
    });

    log(`Всего врачей (User): ${doctors.length}`);
    
    let withGlobalDoctor = 0;
    let withClinicDoctor = 0;

    for (const doctor of doctors) {
      if (doctor.globalDoctor) {
        withGlobalDoctor++;
        if (doctor.globalDoctor.clinicDoctors.length > 0) {
          withClinicDoctor++;
        }
      }
    }

    log(`С GlobalDoctor: ${withGlobalDoctor}/${doctors.length}`);
    log(`С ClinicDoctor: ${withClinicDoctor}/${doctors.length}`);

    if (withGlobalDoctor === doctors.length && withClinicDoctor === doctors.length) {
      log('✅ Все врачи мигрированы!');
    } else {
      log(`⚠️  Частично мигрировано: ${withGlobalDoctor}/${doctors.length} врачей`);
    }
  } catch (error) {
    log('❌ Ошибка при проверке связей:', { error: error.message });
  }
}

/**
 * Проверить данные пациентов
 */
async function checkPatients() {
  log('\n👥 Проверка пациентов...\n');

  try {
    const totalPatients = await prisma.patient.count();
    const totalGlobalPatients = await prisma.globalPatient.count();
    const totalClinicPatients = await prisma.clinicPatient.count();

    log(`Всего Patient (старая таблица): ${totalPatients}`);
    log(`GlobalPatients: ${totalGlobalPatients}`);
    log(`ClinicPatients: ${totalClinicPatients}`);

    // Проверить уникальные GlobalPatients
    const uniqueGlobalPatients = await prisma.$queryRawUnsafe(
      `SELECT COUNT(DISTINCT globalPatientId) as count FROM clinic_patients;`
    );
    const patientsWithClinic = Number(uniqueGlobalPatients[0]?.count || 0);

    log(`Уникальных GlobalPatients с ClinicPatients: ${patientsWithClinic}`);

    if (totalClinicPatients === totalPatients) {
      log('✅ Все пациенты мигрированы!');
    } else {
      log(`⚠️  Частично мигрировано: ${totalClinicPatients}/${totalPatients}`);
    }
  } catch (error) {
    log('❌ Ошибка при проверке пациентов:', { error: error.message });
  }
}

/**
 * Основная функция
 */
async function verifyMigration() {
  log('═══════════════════════════════════════════════════════════');
  log('🔍 ПРОВЕРКА MIGRATION');
  log('═══════════════════════════════════════════════════════════\n');

  try {
    await checkTables();
    await checkAppointments();
    await checkRelations();
    await checkPatients();

    log('\n═══════════════════════════════════════════════════════════');
    log('✅ ПРОВЕРКА ЗАВЕРШЕНА');
    log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    log('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем проверку
verifyMigration();

