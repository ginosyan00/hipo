# 🔄 MIGRATION PLAN: Global/Clinic Identity Separation

> **Цель:** Реализовать архитектуру Global/Clinic separation согласно prompt-у, сохраняя Express + SQLite

---

## 📊 ТЕКУЩАЯ АРХИТЕКТУРА vs НОВАЯ АРХИТЕКТУРА

### ❌ ТЕКУЩАЯ (что есть сейчас):

```
User (с doctor fields внутри)
  ├── specialization
  ├── licenseNumber
  ├── experience
  └── clinicId (один врач = одна клиника)

Patient (clinic-scoped, но нет GlobalPatient)
  └── clinicId

Appointment
  ├── doctorId → User
  └── patientId → Patient
```

**Проблемы:**
- Врач не может работать в нескольких клиниках
- Пациент не может лечиться в нескольких клиниках
- Clinical data смешана с User (login identity)

---

### ✅ НОВАЯ (что будет):

```
User (только login identity)
  ├── globalDoctorId → GlobalDoctor (optional)
  └── globalPatientId → GlobalPatient (optional)

GlobalDoctor (real person, один на всю систему)
  └── clinicDoctors[] → ClinicDoctor[]

ClinicDoctor (clinic-specific profile)
  ├── clinicId
  ├── globalDoctorId
  └── clinic-specific fields

GlobalPatient (real person, один на всю систему)
  └── clinicPatients[] → ClinicPatient[]

ClinicPatient (clinic-specific profile)
  ├── clinicId
  ├── globalPatientId
  └── clinic-specific fields

Appointment
  ├── clinicDoctorId → ClinicDoctor
  └── clinicPatientId → ClinicPatient
```

**Преимущества:**
- ✅ Врач может работать в N клиниках (N ClinicDoctor records)
- ✅ Пациент может лечиться в N клиниках (N ClinicPatient records)
- ✅ Чистое разделение: User = login, Global = person, Clinic = profile

---

## 🎯 ОСНОВНЫЕ ИЗМЕНЕНИЯ

### 1. DATABASE SCHEMA (Prisma)

#### 1.1 Новые модели

**GlobalDoctor** (новая модель)
```prisma
model GlobalDoctor {
  id        String   @id @default(uuid())
  userId    String   @unique  // Links to User
  // Global doctor fields (не clinic-specific)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user          User           @relation(fields: [userId], references: [id])
  clinicDoctors ClinicDoctor[]
}
```

**ClinicDoctor** (новая модель)
```prisma
model ClinicDoctor {
  id             String   @id @default(uuid())
  clinicId       String
  globalDoctorId String
  // Clinic-specific doctor fields
  specialization String?
  licenseNumber  String?
  experience     Int?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  clinic       Clinic        @relation(...)
  globalDoctor GlobalDoctor  @relation(...)
  appointments Appointment[]
}
```

**GlobalPatient** (новая модель)
```prisma
model GlobalPatient {
  id        String   @id @default(uuid())
  userId    String?  @unique  // Optional - только если registered
  // Global patient fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user           User?           @relation(fields: [userId], references: [id])
  clinicPatients ClinicPatient[]
}
```

**ClinicPatient** (переименовать Patient → ClinicPatient)
```prisma
model ClinicPatient {
  id              String   @id @default(uuid())
  clinicId        String
  globalPatientId String
  // Clinic-specific patient fields
  name        String
  phone       String
  email       String?
  // ... остальные поля
}
```

#### 1.2 Изменения в существующих моделях

**User** (убрать doctor fields, добавить links)
```prisma
model User {
  id              String   @id @default(uuid())
  clinicId        String?  // Optional - только для ADMIN/CLINIC
  // ... остальные поля
  
  // УБРАТЬ:
  // - specialization
  // - licenseNumber
  // - experience
  
  // ДОБАВИТЬ:
  globalDoctorId  String?  @unique
  globalPatientId String?  @unique
  
  // Relations
  globalDoctor    GlobalDoctor?  @relation(...)
  globalPatient   GlobalPatient? @relation(...)
}
```

**Appointment** (изменить relations)
```prisma
model Appointment {
  id              String   @id @default(uuid())
  clinicId       String
  // ИЗМЕНИТЬ:
  // doctorId      String   → clinicDoctorId String
  // patientId     String   → clinicPatientId String
  
  clinicDoctorId String
  clinicPatientId String
  
  // Relations
  clinicDoctor    ClinicDoctor   @relation(...)
  clinicPatient   ClinicPatient @relation(...)
}
```

---

### 2. BACKEND SERVICES

#### 2.1 Новые сервисы

**global-doctor.service.js** (новый)
```javascript
// Создать GlobalDoctor для User
async function createGlobalDoctorForUser(userId) { }

// Найти GlobalDoctor по userId
async function findGlobalDoctorByUserId(userId) { }
```

**clinic-doctor.service.js** (новый)
```javascript
// Создать ClinicDoctor для GlobalDoctor в клинике
async function createClinicDoctor(globalDoctorId, clinicId, data) { }

// Найти ClinicDoctor по userId + clinicId
async function findClinicDoctorForUser(userId, clinicId) { }

// Получить все клиники, где работает врач
async function getClinicsForDoctor(globalDoctorId) { }
```

**global-patient.service.js** (новый)
```javascript
// Создать GlobalPatient
async function createGlobalPatient(data) { }

// Найти GlobalPatient по phone/email/DOB
async function findGlobalPatientByMatch(data) { }
```

**clinic-patient.service.js** (переименовать patient.service.js)
```javascript
// Создать ClinicPatient и связать с GlobalPatient
async function createClinicPatient(clinicId, data, globalPatientId) { }

// Найти ClinicPatient по globalPatientId + clinicId
async function findClinicPatientForGlobal(globalPatientId, clinicId) { }
```

#### 2.2 Изменения в существующих сервисах

**appointment.service.js**
```javascript
// ИЗМЕНИТЬ:
// - doctorId → clinicDoctorId
// - patientId → clinicPatientId
// - Валидация: ClinicDoctor.clinicId === ClinicPatient.clinicId

async function create(clinicId, data, userId) {
  // 1. Получить User → GlobalDoctor
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const globalDoctor = await prisma.globalDoctor.findUnique({
    where: { userId: user.id }
  });
  
  // 2. Найти ClinicDoctor для этой клиники
  const clinicDoctor = await prisma.clinicDoctor.findFirst({
    where: {
      clinicId,
      globalDoctorId: globalDoctor.id
    }
  });
  
  // 3. Найти ClinicPatient
  const clinicPatient = await prisma.clinicPatient.findFirst({
    where: {
      id: data.patientId,
      clinicId  // ВАЛИДАЦИЯ!
    }
  });
  
  // 4. Создать Appointment
  return await prisma.appointment.create({
    data: {
      clinicId,
      clinicDoctorId: clinicDoctor.id,
      clinicPatientId: clinicPatient.id,
      // ...
    }
  });
}
```

**auth.service.js**
```javascript
// ИЗМЕНИТЬ registerUser():
// - Если role = DOCTOR → создать GlobalDoctor
// - Если role = PATIENT → создать GlobalPatient

async function registerUser(userData) {
  const user = await prisma.user.create({ ... });
  
  if (userData.role === 'DOCTOR') {
    await prisma.globalDoctor.create({
      data: { userId: user.id }
    });
  }
  
  if (userData.role === 'PATIENT') {
    await prisma.globalPatient.create({
      data: { userId: user.id }
    });
  }
  
  return user;
}
```

**user.service.js**
```javascript
// ИЗМЕНИТЬ createDoctorByClinic():
// - Создать User
// - Создать GlobalDoctor (если не существует)
// - Создать ClinicDoctor для этой клиники

async function createDoctorByClinic(clinicId, data) {
  // 1. Создать User
  const user = await prisma.user.create({ ... });
  
  // 2. Создать или найти GlobalDoctor
  let globalDoctor = await prisma.globalDoctor.findUnique({
    where: { userId: user.id }
  });
  
  if (!globalDoctor) {
    globalDoctor = await prisma.globalDoctor.create({
      data: { userId: user.id }
    });
  }
  
  // 3. Создать ClinicDoctor для этой клиники
  const clinicDoctor = await prisma.clinicDoctor.create({
    data: {
      clinicId,
      globalDoctorId: globalDoctor.id,
      specialization: data.specialization,
      licenseNumber: data.licenseNumber,
      experience: data.experience,
    }
  });
  
  return { user, clinicDoctor };
}
```

---

### 3. BACKEND CONTROLLERS

#### 3.1 Изменения

**appointment.controller.js**
```javascript
// ИЗМЕНИТЬ:
// - req.body.doctorId → найти clinicDoctorId
// - req.body.patientId → найти clinicPatientId

async function create(req, res, next) {
  const clinicId = req.user.clinicId;
  const userId = req.user.userId;
  
  // Map doctorId → clinicDoctorId
  const clinicDoctor = await clinicDoctorService.findClinicDoctorForUser(
    userId,
    clinicId
  );
  
  // Map patientId → clinicPatientId (уже clinic-scoped)
  const clinicPatient = await prisma.clinicPatient.findFirst({
    where: {
      id: req.body.patientId,
      clinicId  // ВАЛИДАЦИЯ!
    }
  });
  
  const appointment = await appointmentService.create(clinicId, {
    ...req.body,
    clinicDoctorId: clinicDoctor.id,
    clinicPatientId: clinicPatient.id,
  }, userId);
  
  res.status(201).json({ success: true, data: appointment });
}
```

---

### 4. FRONTEND

#### 4.1 TypeScript Types

**types/api.types.ts**
```typescript
// НОВЫЕ типы
interface GlobalDoctor {
  id: string;
  userId: string;
}

interface ClinicDoctor {
  id: string;
  clinicId: string;
  globalDoctorId: string;
  specialization?: string;
  licenseNumber?: string;
  experience?: number;
}

interface GlobalPatient {
  id: string;
  userId?: string;
}

interface ClinicPatient {
  id: string;
  clinicId: string;
  globalPatientId: string;
  name: string;
  phone: string;
  // ...
}

// ИЗМЕНИТЬ Appointment
interface Appointment {
  id: string;
  clinicId: string;
  clinicDoctorId: string;  // было: doctorId
  clinicPatientId: string;  // было: patientId
  clinicDoctor: ClinicDoctor;
  clinicPatient: ClinicPatient;
}
```

#### 4.2 Services

**doctor.service.ts** (новый или изменить)
```typescript
// Получить ClinicDoctor для текущего пользователя в клинике
async function getMyClinicDoctor(clinicId: string): Promise<ClinicDoctor> { }

// Получить все клиники, где работает врач
async function getMyClinics(): Promise<Clinic[]> { }
```

**patient.service.ts** (переименовать в clinic-patient.service.ts)
```typescript
// Изменить все методы для работы с ClinicPatient
```

---

## 📋 MIGRATION STEPS (пошагово)

### Шаг 1: Подготовка (без breaking changes)

1. ✅ Создать новые модели в schema.prisma:
   - GlobalDoctor
   - ClinicDoctor
   - GlobalPatient
   - ClinicPatient (пока как alias для Patient)

2. ✅ Создать migration (не применять пока!)

3. ✅ Создать новые сервисы (пока не использовать)

### Шаг 2: Data Migration (миграция данных)

1. ✅ Скрипт для миграции существующих данных:
   ```javascript
   // migrate-to-global-clinic.js
   
   // 1. Для каждого User с role=DOCTOR:
   //    - Создать GlobalDoctor
   //    - Создать ClinicDoctor для его clinicId
   //    - Перенести specialization, licenseNumber, experience
   
   // 2. Для каждого Patient:
   //    - Создать GlobalPatient (если не существует)
   //    - Создать ClinicPatient
   //    - Связать с GlobalPatient
   
   // 3. Для каждого Appointment:
   //    - Найти ClinicDoctor по doctorId
   //    - Найти ClinicPatient по patientId
   //    - Обновить clinicDoctorId, clinicPatientId
   ```

2. ✅ Применить migration

3. ✅ Проверить данные

### Шаг 3: Code Migration (изменение кода)

1. ✅ Обновить appointment.service.js
2. ✅ Обновить auth.service.js
3. ✅ Обновить user.service.js
4. ✅ Обновить patient.service.js
5. ✅ Обновить controllers
6. ✅ Обновить frontend types
7. ✅ Обновить frontend services

### Шаг 4: Testing

1. ✅ Unit tests для новых сервисов
2. ✅ Integration tests для appointment creation
3. ✅ E2E tests для multi-clinic scenarios

### Шаг 5: Cleanup

1. ✅ Удалить старые поля из User (specialization, etc.)
2. ✅ Переименовать Patient → ClinicPatient в коде
3. ✅ Обновить документацию

---

## ⚠️ РИСКИ И РЕШЕНИЯ

### Риск 1: Breaking changes в API

**Проблема:** Frontend ожидает `doctorId`, а теперь нужно `clinicDoctorId`

**Решение:** 
- Временно поддерживать оба варианта (backward compatibility)
- Или сразу изменить frontend вместе с backend

### Риск 2: Data loss при migration

**Проблема:** Могут потеряться данные при миграции

**Решение:**
- Сделать backup БД перед migration
- Тестировать migration на копии данных
- Rollback план

### Риск 3: Performance

**Проблема:** Дополнительные joins (User → GlobalDoctor → ClinicDoctor)

**Решение:**
- Правильные индексы
- Кэширование в сервисах
- Оптимизация queries

---

## 🎯 ПРИОРИТЕТЫ

### P0 (Критично - сначала это):
1. ✅ Создать новые модели в schema
2. ✅ Data migration script
3. ✅ Обновить appointment.service.js
4. ✅ Обновить appointment.controller.js

### P1 (Важно - потом это):
5. ✅ Обновить auth.service.js (registerUser)
6. ✅ Обновить user.service.js (createDoctorByClinic)
7. ✅ Обновить frontend types
8. ✅ Обновить frontend services

### P2 (Можно позже):
9. ✅ Multi-clinic UI (переключение между клиниками)
10. ✅ Patient matching (поиск существующих GlobalPatient)
11. ✅ Cleanup старых полей

---

## 📝 SUMMARY

**Что меняется:**
- ✅ Database schema: 4 новых модели
- ✅ Backend services: новые сервисы + изменения в существующих
- ✅ Backend controllers: изменения в appointment creation
- ✅ Frontend types: новые интерфейсы
- ✅ Frontend services: изменения в API calls

**Что НЕ меняется:**
- ✅ Express.js (остается)
- ✅ SQLite (остается)
- ✅ React + Vite (остается)
- ✅ Общая структура проекта

**Время реализации:** ~2-3 дня (с тестированием)

---

**Готов начать?** 🚀

