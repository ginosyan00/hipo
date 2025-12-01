# 🗑️ DATABASE CLEANUP: Что будет удалено

> **Важно:** Мы НЕ удаляем данные! Мы переносим их в новые таблицы, затем удаляем старые колонки.

---

## 📊 ЧТО БУДЕТ УДАЛЕНО ИЗ `users` TABLE

### ❌ Колонки, которые будут удалены:

```sql
-- Эти колонки будут УДАЛЕНЫ из таблицы users:
ALTER TABLE users DROP COLUMN specialization;
ALTER TABLE users DROP COLUMN licenseNumber;
ALTER TABLE users DROP COLUMN experience;
```

**Почему?**
- Эти поля относятся к **clinical profile** врача, а не к **login identity**
- Они будут перенесены в таблицу `clinic_doctors`
- User должен быть только login identity (email, password, role)

---

## ✅ ЧТО НЕ БУДЕТ УДАЛЕНО (останется в User)

```sql
-- Эти колонки ОСТАНУТСЯ в users:
- id
- clinicId (останется, но станет optional для DOCTOR)
- name
- email
- passwordHash
- role
- status
- phone
- avatar
- dateOfBirth
- gender
- createdAt
- updatedAt
```

**Почему?**
- Это общие поля для всех ролей (login identity)
- `clinicId` останется для ADMIN/CLINIC ролей
- Для DOCTOR `clinicId` станет optional (может работать в нескольких клиниках)

---

## 🔄 МИГРАЦИЯ ДАННЫХ (перед удалением)

### Шаг 1: Создать новые таблицы
```sql
-- Создаем GlobalDoctor
CREATE TABLE global_doctors (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE,
  createdAt DATETIME,
  updatedAt DATETIME
);

-- Создаем ClinicDoctor
CREATE TABLE clinic_doctors (
  id TEXT PRIMARY KEY,
  clinicId TEXT,
  globalDoctorId TEXT,
  specialization TEXT,
  licenseNumber TEXT,
  experience INTEGER,
  isActive BOOLEAN DEFAULT 1,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

### Шаг 2: Перенести данные
```javascript
// Migration script
async function migrateDoctorData() {
  // Для каждого User с role='DOCTOR':
  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' }
  });
  
  for (const doctor of doctors) {
    // 1. Создать GlobalDoctor
    const globalDoctor = await prisma.globalDoctor.create({
      data: {
        userId: doctor.id
      }
    });
    
    // 2. Создать ClinicDoctor (переносим specialization, licenseNumber, experience)
    await prisma.clinicDoctor.create({
      data: {
        clinicId: doctor.clinicId,
        globalDoctorId: globalDoctor.id,
        specialization: doctor.specialization,  // ← ПЕРЕНОСИМ
        licenseNumber: doctor.licenseNumber,     // ← ПЕРЕНОСИМ
        experience: doctor.experience,           // ← ПЕРЕНОСИМ
      }
    });
  }
}
```

### Шаг 3: Обновить Appointment
```javascript
// Обновить все appointments: doctorId → clinicDoctorId
async function migrateAppointments() {
  const appointments = await prisma.appointment.findMany();
  
  for (const appointment of appointments) {
    // Найти ClinicDoctor по doctorId
    const user = await prisma.user.findUnique({
      where: { id: appointment.doctorId }
    });
    
    const globalDoctor = await prisma.globalDoctor.findUnique({
      where: { userId: user.id }
    });
    
    const clinicDoctor = await prisma.clinicDoctor.findFirst({
      where: {
        globalDoctorId: globalDoctor.id,
        clinicId: appointment.clinicId
      }
    });
    
    // Обновить appointment
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        clinicDoctorId: clinicDoctor.id  // ← НОВОЕ поле
      }
    });
  }
}
```

### Шаг 4: Удалить старые колонки
```sql
-- ТОЛЬКО ПОСЛЕ того, как все данные перенесены!
ALTER TABLE users DROP COLUMN specialization;
ALTER TABLE users DROP COLUMN licenseNumber;
ALTER TABLE users DROP COLUMN experience;
```

---

## 📋 ПОЛНЫЙ СПИСОК ИЗМЕНЕНИЙ

### Table: `users`

**Удаляется:**
- ❌ `specialization` (TEXT) → переносится в `clinic_doctors.specialization`
- ❌ `licenseNumber` (TEXT) → переносится в `clinic_doctors.licenseNumber`
- ❌ `experience` (INTEGER) → переносится в `clinic_doctors.experience`

**Добавляется:**
- ✅ `globalDoctorId` (TEXT, UNIQUE, NULLABLE) → ссылка на `global_doctors.id`
- ✅ `globalPatientId` (TEXT, UNIQUE, NULLABLE) → ссылка на `global_patients.id`

**Изменяется:**
- ⚠️ `clinicId` (TEXT, NULLABLE) → станет optional для DOCTOR (может быть NULL)

---

### Table: `appointments`

**Удаляется:**
- ❌ `doctorId` (TEXT) → удаляется после миграции

**Добавляется:**
- ✅ `clinicDoctorId` (TEXT) → ссылка на `clinic_doctors.id`
- ✅ `clinicPatientId` (TEXT) → ссылка на `clinic_patients.id` (вместо `patientId`)

**Изменяется:**
- ⚠️ `patientId` → переименовывается в `clinicPatientId`

---

### Table: `patients` → `clinic_patients`

**Переименование:**
- ⚠️ `patients` → `clinic_patients` (новое имя таблицы)

**Добавляется:**
- ✅ `globalPatientId` (TEXT) → ссылка на `global_patients.id`

**Остается:**
- ✅ Все остальные поля (name, phone, email, etc.)

---

## ⚠️ ВАЖНО: НИЧЕГО НЕ ТЕРЯЕТСЯ!

### ✅ Данные сохраняются:
- Все данные из `users.specialization` → `clinic_doctors.specialization`
- Все данные из `users.licenseNumber` → `clinic_doctors.licenseNumber`
- Все данные из `users.experience` → `clinic_doctors.experience`
- Все appointments остаются (только меняются foreign keys)

### ✅ Records не удаляются:
- Ни один User record не удаляется
- Ни один Patient record не удаляется
- Ни один Appointment record не удаляется

### ✅ Только структура меняется:
- Колонки переносятся в новые таблицы
- Foreign keys обновляются
- Старые колонки удаляются ПОСЛЕ миграции

---

## 🔍 ПРОВЕРКА ПЕРЕД УДАЛЕНИЕМ

### Checklist перед удалением колонок:

```javascript
// 1. Проверить, что все GlobalDoctor созданы
const usersWithDoctors = await prisma.user.findMany({
  where: { role: 'DOCTOR' }
});
const globalDoctors = await prisma.globalDoctor.findMany();
console.assert(usersWithDoctors.length === globalDoctors.length, 'Not all GlobalDoctors created!');

// 2. Проверить, что все ClinicDoctor созданы
const clinicDoctors = await prisma.clinicDoctor.findMany();
console.assert(clinicDoctors.length >= usersWithDoctors.length, 'Not all ClinicDoctors created!');

// 3. Проверить, что все appointments обновлены
const appointmentsWithoutClinicDoctor = await prisma.appointment.findMany({
  where: { clinicDoctorId: null }
});
console.assert(appointmentsWithoutClinicDoctor.length === 0, 'Some appointments not migrated!');

// 4. Проверить, что данные перенесены правильно
const user = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
const clinicDoctor = await prisma.clinicDoctor.findFirst({
  where: { globalDoctor: { userId: user.id } }
});
console.assert(
  user.specialization === clinicDoctor.specialization,
  'Specialization not migrated correctly!'
);
```

---

## 📊 SUMMARY

### Что удаляется:
- ❌ 3 колонки из `users`: `specialization`, `licenseNumber`, `experience`
- ❌ 1 колонка из `appointments`: `doctorId` (после миграции)

### Что добавляется:
- ✅ 2 новые таблицы: `global_doctors`, `clinic_doctors`
- ✅ 2 новые таблицы: `global_patients`, `clinic_patients`
- ✅ 2 новые колонки в `users`: `globalDoctorId`, `globalPatientId`
- ✅ 2 новые колонки в `appointments`: `clinicDoctorId`, `clinicPatientId`

### Что остается:
- ✅ Все User records
- ✅ Все Patient records
- ✅ Все Appointment records
- ✅ Все данные (только переносятся)

---

## 🚨 BACKUP ПЕРЕД МИГРАЦИЕЙ

**ОБЯЗАТЕЛЬНО сделать backup перед миграцией!**

```bash
# SQLite backup
cp backend/prisma/dev.db backend/prisma/dev.db.backup

# Или экспорт
sqlite3 backend/prisma/dev.db .dump > backup.sql
```

---

**Готовы к миграции?** 🚀

