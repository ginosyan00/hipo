/**
 * Script to apply Phase 1 migration manually
 * This applies the SQL migration directly to the database
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🚀 Starting Phase 1 migration...\n');

    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../prisma/migrations/20250122000000_add_global_clinic_separation_phase1/migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty statements
      if (statement.trim().length <= 1) continue;
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error) {
        // Check if error is about table/column already existing (OK for idempotency)
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate column') ||
            error.message.includes('UNIQUE constraint failed')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message.split('\n')[0]}\n`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log('✅ Phase 1 migration completed successfully!');
    console.log('\n📊 New tables created:');
    console.log('   - global_doctors');
    console.log('   - clinic_doctors');
    console.log('   - global_patients');
    console.log('   - clinic_patients');
    console.log('\n📝 New fields added to appointments:');
    console.log('   - clinicDoctorId (optional)');
    console.log('   - clinicPatientId (optional)');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

