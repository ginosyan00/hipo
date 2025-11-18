-- CreateTable
CREATE TABLE "clinic_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Yerevan',
    "language" TEXT NOT NULL DEFAULT 'ru',
    "currency" TEXT NOT NULL DEFAULT 'AMD',
    "defaultAppointmentDuration" INTEGER NOT NULL DEFAULT 30,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "appointmentReminderHours" INTEGER NOT NULL DEFAULT 24,
    "notifyNewAppointments" BOOLEAN NOT NULL DEFAULT true,
    "notifyCancellations" BOOLEAN NOT NULL DEFAULT true,
    "notifyConfirmations" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "clinic_settings_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "clinic_settings_clinicId_key" ON "clinic_settings"("clinicId");
CREATE INDEX "clinic_settings_clinicId_idx" ON "clinic_settings"("clinicId");

