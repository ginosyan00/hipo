/**
 * Script to apply Phase 1 migration directly
 * Обходит проблемы с Prisma migrate, применяя SQL напрямую
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

/**
 * Логирование
 */
function log(message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
}

/**
 * Применить SQL напрямую
 */
async function applySQL(sql) {
  // Удаляем комментарии и разделяем на statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
    .map(s => s + ';');

  for (const statement of statements) {
    if (statement.trim().length <= 1) continue;
    
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (error) {
      // Игнорируем ошибки "table already exists" или "column already exists" (идемпотентность)
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate column') ||
          error.message.includes('UNIQUE constraint')) {
        log(`⚠️  Пропущено (уже существует): ${statement.substring(0, 50)}...`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Проверить, существует ли таблица
 */
async function tableExists(tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
      tableName
    );
    return Array.isArray(result) && result.length > 0;
  } catch {
    return false;
  }
}

/**
 * Основная функция
 */
async function applyMigration() {
  try {
    log('🚀 Начало применения migration...\n');

    const migrationPath = path.join(
      __dirname,
      '../prisma/migrations/20250122000000_add_global_clinic_separation_phase1/migration.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration файл не найден: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Проверяем, какие таблицы уже существуют
    const tables = [
      'global_doctors',
      'clinic_doctors',
      'global_patients',
      'clinic_patients',
    ];

    log('📊 Проверка существующих таблиц...');
    const existingTables = [];
    for (const table of tables) {
      const exists = await tableExists(table);
      if (exists) {
        existingTables.push(table);
        log(`⚠️  Таблица ${table} уже существует`);
      }
    }

    if (existingTables.length === tables.length) {
      log('✅ Все таблицы уже существуют. Проверяем колонки в appointments...');
      
      // Проверяем колонки в appointments
      try {
        await prisma.$queryRawUnsafe(`SELECT clinicDoctorId FROM appointments LIMIT 1;`);
        await prisma.$queryRawUnsafe(`SELECT clinicPatientId FROM appointments LIMIT 1;`);
        log('✅ Колонки clinicDoctorId и clinicPatientId уже существуют в appointments');
        log('✅ Migration уже применена!');
        return;
      } catch {
        log('⚠️  Колонки не найдены, добавляем...');
      }
    }

    // Применяем SQL
    log('\n📝 Применение SQL statements...\n');
    await applySQL(sql);

    log('\n✅ Migration применена успешно!');
    log('\n📊 Созданные таблицы:');
    log('   - global_doctors');
    log('   - clinic_doctors');
    log('   - global_patients');
    log('   - clinic_patients');
    log('\n📝 Обновленные таблицы:');
    log('   - appointments (добавлены clinicDoctorId, clinicPatientId)');

  } catch (error) {
    log('❌ Ошибка при применении migration:', { error: error.message });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    log('\n🎉 Готово!');
    process.exit(0);
  })
  .catch((error) => {
    log('\n💥 Критическая ошибка:', { error: error.message, stack: error.stack });
    process.exit(1);
  });


