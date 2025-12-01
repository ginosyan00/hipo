# 🔧 CONFLICT RESOLUTION: Исправление противоречий между старым и новым

> **Философия:** Если старое противоречит новому - исправляем старое, а не сохраняем ошибки

---

## 🎯 ПРИНЦИПЫ

### ✅ Что исправляем:
1. **Логические ошибки** - если старый код делает что-то неправильно
2. **Архитектурные противоречия** - если старый код нарушает новую архитектуру
3. **Безопасность** - если старый код имеет уязвимости
4. **Data integrity** - если старый код может повредить данные

### ❌ Что сохраняем (временно):
1. **API compatibility** - старые endpoints работают (до полного переключения)
2. **Data structure** - старые поля остаются (до миграции)
3. **Fallback logic** - старая логика как резерв

---

## 🔍 КАК НАЙТИ ПРОТИВОРЕЧИЯ

### 1. Анализ кода

#### Проверка 1: Clinic Isolation
```javascript
// ❌ ПЛОХО (старый код)
async function getPatients() {
  return await prisma.patient.findMany();  // Нет фильтрации по clinicId!
}

// ✅ ХОРОШО (исправляем)
async function getPatients(clinicId) {
  return await prisma.patient.findMany({
    where: { clinicId }  // Обязательная фильтрация
  });
}
```

#### Проверка 2: Data Validation
```javascript
// ❌ ПЛОХО (старый код)
async function createAppointment(data) {
  // Нет проверки, что doctor и patient в одной клинике!
  return await prisma.appointment.create({ data });
}

// ✅ ХОРОШО (исправляем)
async function createAppointment(clinicId, data) {
  // Проверяем clinic isolation
  const doctor = await prisma.user.findFirst({
    where: { id: data.doctorId, clinicId }
  });
  
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, clinicId }
  });
  
  if (!doctor || !patient) {
    throw new Error('Doctor and patient must be in the same clinic');
  }
  
  return await prisma.appointment.create({ data });
}
```

#### Проверка 3: Security
```javascript
// ❌ ПЛОХО (старый код)
async function updatePatient(patientId, data) {
  // Нет проверки clinicId!
  return await prisma.patient.update({
    where: { id: patientId },
    data
  });
}

// ✅ ХОРОШО (исправляем)
async function updatePatient(clinicId, patientId, data) {
  // Проверяем, что patient принадлежит клинике
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId }
  });
  
  if (!patient) {
    throw new Error('Patient not found in this clinic');
  }
  
  return await prisma.patient.update({
    where: { id: patientId },
    data
  });
}
```

---

## 📋 СПИСОК ТИПИЧНЫХ ПРОТИВОРЕЧИЙ

### 1. Отсутствие clinicId фильтрации

**Проблема:** Запросы возвращают данные из всех клиник

**Исправление:**
```javascript
// ❌ БЫЛО
const patients = await prisma.patient.findMany();

// ✅ СТАЛО
const patients = await prisma.patient.findMany({
  where: { clinicId: req.user.clinicId }
});
```

---

### 2. Отсутствие валидации clinic isolation

**Проблема:** Можно создать appointment между doctor и patient из разных клиник

**Исправление:**
```javascript
// ❌ БЫЛО
async function createAppointment(data) {
  return await prisma.appointment.create({
    data: {
      doctorId: data.doctorId,
      patientId: data.patientId,
      // Нет проверки!
    }
  });
}

// ✅ СТАЛО
async function createAppointment(clinicId, data) {
  // Валидация: doctor и patient в одной клинике
  const [doctor, patient] = await Promise.all([
    prisma.user.findFirst({
      where: { id: data.doctorId, clinicId }
    }),
    prisma.patient.findFirst({
      where: { id: data.patientId, clinicId }
    })
  ]);
  
  if (!doctor || !patient) {
    throw new Error('Doctor and patient must be in the same clinic');
  }
  
  return await prisma.appointment.create({ data });
}
```

---

### 3. Прямой доступ к User.doctorId в Appointment

**Проблема:** Appointment ссылается на User, а не на ClinicDoctor

**Исправление:**
```javascript
// ❌ БЫЛО (старая архитектура)
model Appointment {
  doctorId String  // → User
}

// ✅ СТАЛО (новая архитектура)
model Appointment {
  clinicDoctorId String  // → ClinicDoctor
}
```

**Но:** Исправляем постепенно (см. PROFESSIONAL-MIGRATION-PLAN.md)

---

### 4. Clinical data в User table

**Проблема:** specialization, licenseNumber, experience в User (login identity)

**Исправление:**
```javascript
// ❌ БЫЛО
model User {
  specialization String?  // Clinical data в login identity!
  licenseNumber  String?
  experience     Int?
}

// ✅ СТАЛО
model User {
  globalDoctorId String?  // Только ссылка
}

model ClinicDoctor {
  specialization String?  // Clinical data здесь
  licenseNumber  String?
  experience     Int?
}
```

**Но:** Мигрируем постепенно (см. PROFESSIONAL-MIGRATION-PLAN.md)

---

## 🔧 ПРОЦЕСС ИСПРАВЛЕНИЯ

### Шаг 1: Найти противоречия

```bash
# Ищем места без clinicId фильтрации
grep -r "findMany\|findFirst\|findUnique" backend/src/services/ | grep -v "clinicId"

# Ищем места с прямой работой с User.doctorId
grep -r "doctorId" backend/src/services/appointment.service.js

# Ищем места без валидации
grep -r "create\|update" backend/src/services/ | grep -v "where.*clinicId"
```

---

### Шаг 2: Исправить критичные противоречия (сразу)

**Критичные (исправляем ДО migration):**
- ❌ Отсутствие clinicId фильтрации → **ИСПРАВЛЯЕМ СРАЗУ**
- ❌ Отсутствие валидации clinic isolation → **ИСПРАВЛЯЕМ СРАЗУ**
- ❌ Security issues → **ИСПРАВЛЯЕМ СРАЗУ**

**Пример:**
```javascript
// services/patient.service.js

// ❌ БЫЛО (критичная ошибка!)
export async function findAll() {
  return await prisma.patient.findMany();  // Возвращает ВСЕХ пациентов!
}

// ✅ ИСПРАВЛЯЕМ СРАЗУ
export async function findAll(clinicId) {
  if (!clinicId) {
    throw new Error('ClinicId is required');
  }
  
  return await prisma.patient.findMany({
    where: { clinicId }  // Обязательная фильтрация
  });
}
```

---

### Шаг 3: Исправить архитектурные противоречия (постепенно)

**Архитектурные (исправляем во время migration):**
- ⚠️ User.doctorId → ClinicDoctor → **ИСПРАВЛЯЕМ ПОСТЕПЕННО**
- ⚠️ Clinical data в User → **ИСПРАВЛЯЕМ ПОСТЕПЕННО**

**Пример:**
```javascript
// services/appointment.service.js

// Phase 1: Добавляем новую логику (старая работает)
export async function create(clinicId, data, userId) {
  // Старая логика (продолжает работать)
  const appointment = await prisma.appointment.create({
    data: {
      clinicId,
      doctorId: data.doctorId,  // ← СТАРОЕ (пока работает)
      patientId: data.patientId,
    }
  });
  
  // Новая логика (добавляем параллельно)
  try {
    const clinicDoctor = await findClinicDoctorForUser(userId, clinicId);
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        clinicDoctorId: clinicDoctor.id  // ← НОВОЕ (добавляем)
      }
    });
  } catch (error) {
    // Если не получилось - не критично, старое работает
    console.warn('Failed to set clinicDoctorId:', error);
  }
  
  return appointment;
}

// Phase 2: Переключаемся на новое (старое как fallback)
export async function create(clinicId, data, userId) {
  // Пробуем новое
  try {
    const clinicDoctor = await findClinicDoctorForUser(userId, clinicId);
    return await prisma.appointment.create({
      data: {
        clinicId,
        clinicDoctorId: clinicDoctor.id,  // ← НОВОЕ (основное)
        patientId: data.patientId,
        // doctorId: data.doctorId,  // ← УБИРАЕМ (но можем вернуть если нужно)
      }
    });
  } catch (error) {
    // Fallback на старое
    console.warn('New logic failed, using old:', error);
    return await prisma.appointment.create({
      data: {
        clinicId,
        doctorId: data.doctorId,  // ← СТАРОЕ (fallback)
        patientId: data.patientId,
      }
    });
  }
}

// Phase 3: Только новое (старое удалено)
export async function create(clinicId, data, userId) {
  const clinicDoctor = await findClinicDoctorForUser(userId, clinicId);
  return await prisma.appointment.create({
    data: {
      clinicId,
      clinicDoctorId: clinicDoctor.id,  // ← ТОЛЬКО НОВОЕ
      patientId: data.patientId,
    }
  });
}
```

---

## 📋 CHECKLIST: Что исправляем

### ✅ Исправляем СРАЗУ (критичные ошибки):

- [ ] **Отсутствие clinicId фильтрации** - добавляем везде
- [ ] **Отсутствие валидации clinic isolation** - добавляем проверки
- [ ] **Security issues** - исправляем уязвимости
- [ ] **Data integrity** - исправляем логические ошибки

### ⚠️ Исправляем ПОСТЕПЕННО (архитектурные изменения):

- [ ] **User.doctorId → ClinicDoctor** - во время migration
- [ ] **Clinical data в User → ClinicDoctor** - во время migration
- [ ] **Patient → ClinicPatient** - во время migration

---

## 🔍 АВТОМАТИЧЕСКАЯ ПРОВЕРКА

### Script для поиска противоречий:

```javascript
// scripts/check-conflicts.js

async function checkClinicIsolation() {
  // 1. Проверяем все findMany без clinicId
  const files = await glob('backend/src/services/**/*.js');
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    
    // Ищем findMany без where.clinicId
    if (content.includes('findMany') && !content.includes('clinicId')) {
      console.warn(`⚠️  ${file}: findMany without clinicId filter`);
    }
    
    // Ищем create без валидации
    if (content.includes('create') && !content.includes('clinicId')) {
      console.warn(`⚠️  ${file}: create without clinicId validation`);
    }
  }
}

async function checkArchitecture() {
  // 2. Проверяем использование старой архитектуры
  const appointmentService = await fs.readFile(
    'backend/src/services/appointment.service.js',
    'utf8'
  );
  
  if (appointmentService.includes('doctorId') && 
      !appointmentService.includes('clinicDoctorId')) {
    console.warn('⚠️  appointment.service.js: uses old doctorId, no clinicDoctorId');
  }
}
```

---

## 🎯 ПРИМЕРЫ ИСПРАВЛЕНИЙ

### Пример 1: Исправление clinic isolation

```javascript
// ❌ БЫЛО (ошибка!)
// services/patient.service.js
export async function findAll() {
  return await prisma.patient.findMany();  // Возвращает ВСЕХ!
}

// ✅ ИСПРАВЛЯЕМ СРАЗУ
export async function findAll(clinicId) {
  if (!clinicId) {
    throw new Error('ClinicId is required');
  }
  
  return await prisma.patient.findMany({
    where: { clinicId }
  });
}
```

---

### Пример 2: Исправление валидации

```javascript
// ❌ БЫЛО (ошибка!)
// services/appointment.service.js
export async function create(data) {
  return await prisma.appointment.create({
    data: {
      doctorId: data.doctorId,
      patientId: data.patientId,
      // Нет проверки, что они в одной клинике!
    }
  });
}

// ✅ ИСПРАВЛЯЕМ СРАЗУ
export async function create(clinicId, data) {
  // Валидация
  const [doctor, patient] = await Promise.all([
    prisma.user.findFirst({
      where: { id: data.doctorId, clinicId }
    }),
    prisma.patient.findFirst({
      where: { id: data.patientId, clinicId }
    })
  ]);
  
  if (!doctor) {
    throw new Error('Doctor not found in this clinic');
  }
  
  if (!patient) {
    throw new Error('Patient not found in this clinic');
  }
  
  return await prisma.appointment.create({
    data: {
      clinicId,
      doctorId: data.doctorId,
      patientId: data.patientId,
    }
  });
}
```

---

### Пример 3: Постепенное исправление архитектуры

```javascript
// Phase 1: Добавляем новое (старое работает)
export async function create(clinicId, data, userId) {
  // Старое (продолжает работать)
  const appointment = await prisma.appointment.create({
    data: {
      clinicId,
      doctorId: data.doctorId,  // ← СТАРОЕ
      patientId: data.patientId,
    }
  });
  
  // Новое (добавляем)
  try {
    const clinicDoctor = await findClinicDoctorForUser(userId, clinicId);
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { clinicDoctorId: clinicDoctor.id }  // ← НОВОЕ
    });
  } catch (error) {
    // Не критично, старое работает
  }
  
  return appointment;
}

// Phase 2: Переключаемся (старое как fallback)
export async function create(clinicId, data, userId) {
  try {
    // Новое (основное)
    const clinicDoctor = await findClinicDoctorForUser(userId, clinicId);
    return await prisma.appointment.create({
      data: {
        clinicId,
        clinicDoctorId: clinicDoctor.id,  // ← НОВОЕ
        patientId: data.patientId,
      }
    });
  } catch (error) {
    // Fallback на старое
    return await prisma.appointment.create({
      data: {
        clinicId,
        doctorId: data.doctorId,  // ← СТАРОЕ (fallback)
        patientId: data.patientId,
      }
    });
  }
}

// Phase 3: Только новое (старое удалено)
export async function create(clinicId, data, userId) {
  const clinicDoctor = await findClinicDoctorForUser(userId, clinicId);
  return await prisma.appointment.create({
    data: {
      clinicId,
      clinicDoctorId: clinicDoctor.id,  // ← ТОЛЬКО НОВОЕ
      patientId: data.patientId,
    }
  });
}
```

---

## 📊 SUMMARY

### ✅ Что исправляем СРАЗУ:
- Критичные ошибки (clinic isolation, security)
- Логические ошибки
- Data integrity issues

### ⚠️ Что исправляем ПОСТЕПЕННО:
- Архитектурные изменения (User → ClinicDoctor)
- Структурные изменения (поля в таблицах)

### ❌ Что НЕ трогаем (пока):
- API endpoints (до полного переключения)
- Старые поля в БД (до миграции)
- Fallback логика (до уверенности в новом)

---

## 🚀 ПЛАН ДЕЙСТВИЙ

1. **Найти противоречия** - автоматическая проверка
2. **Исправить критичные** - сразу (clinic isolation, security)
3. **Исправить архитектурные** - постепенно (во время migration)
4. **Проверить** - тестирование после каждого исправления

---

**Готовы начать исправления?** 🔧

