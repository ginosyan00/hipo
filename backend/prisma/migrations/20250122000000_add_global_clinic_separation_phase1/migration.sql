-- Migration: Add Global/Clinic Identity Separation (Phase 1)
-- This migration adds new tables without removing old ones (backward compatible)

-- CreateTable: GlobalDoctor
CREATE TABLE "global_doctors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "global_doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex: GlobalDoctor.userId
CREATE UNIQUE INDEX "global_doctors_userId_key" ON "global_doctors"("userId");
CREATE INDEX "global_doctors_userId_idx" ON "global_doctors"("userId");

-- CreateTable: ClinicDoctor
CREATE TABLE "clinic_doctors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "globalDoctorId" TEXT NOT NULL,
    "specialization" TEXT,
    "licenseNumber" TEXT,
    "experience" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "clinic_doctors_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "clinic_doctors_globalDoctorId_fkey" FOREIGN KEY ("globalDoctorId") REFERENCES "global_doctors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex: ClinicDoctor indexes
CREATE INDEX "clinic_doctors_clinicId_idx" ON "clinic_doctors"("clinicId");
CREATE INDEX "clinic_doctors_globalDoctorId_idx" ON "clinic_doctors"("globalDoctorId");
CREATE INDEX "clinic_doctors_clinicId_globalDoctorId_idx" ON "clinic_doctors"("clinicId", "globalDoctorId");

-- CreateTable: GlobalPatient
CREATE TABLE "global_patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "global_patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex: GlobalPatient.userId
CREATE UNIQUE INDEX "global_patients_userId_key" ON "global_patients"("userId");
CREATE INDEX "global_patients_userId_idx" ON "global_patients"("userId");

-- CreateTable: ClinicPatient
CREATE TABLE "clinic_patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "globalPatientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "avatar" TEXT,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'guest',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "clinic_patients_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "clinic_patients_globalPatientId_fkey" FOREIGN KEY ("globalPatientId") REFERENCES "global_patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex: ClinicPatient indexes
CREATE INDEX "clinic_patients_clinicId_idx" ON "clinic_patients"("clinicId");
CREATE INDEX "clinic_patients_globalPatientId_idx" ON "clinic_patients"("globalPatientId");
CREATE INDEX "clinic_patients_clinicId_globalPatientId_idx" ON "clinic_patients"("clinicId", "globalPatientId");
CREATE UNIQUE INDEX "clinic_patients_email_key" ON "clinic_patients"("email");
CREATE INDEX "clinic_patients_phone_idx" ON "clinic_patients"("phone");
CREATE INDEX "clinic_patients_status_idx" ON "clinic_patients"("status");

-- AlterTable: Appointment - add optional fields for gradual migration
ALTER TABLE "appointments" ADD COLUMN "clinicDoctorId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "clinicPatientId" TEXT;

-- CreateIndex: Appointment indexes for new fields
CREATE INDEX "appointments_clinicDoctorId_idx" ON "appointments"("clinicDoctorId");
CREATE INDEX "appointments_clinicPatientId_idx" ON "appointments"("clinicPatientId");

-- Add foreign key constraints for Appointment (optional, nullable)
-- Note: SQLite doesn't support adding foreign keys to existing tables easily,
-- but Prisma will handle the relations in the schema


