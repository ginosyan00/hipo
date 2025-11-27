-- AlterTable
ALTER TABLE "patients" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'registered';

-- CreateIndex
CREATE INDEX "patients_status_idx" ON "patients"("status");

