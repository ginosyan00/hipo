# 🏗️ PROFESSIONAL MIGRATION PLAN: Безопасная замена старого на новое

> **Философия:** Старое работает → Добавляем новое → Переключаемся → Удаляем старое

---

## 🎯 СТРАТЕГИЯ: GRADUAL REPLACEMENT (Постепенная замена)

### Принципы:
1. ✅ **Старое продолжает работать** - не ломаем существующий функционал
2. ✅ **Новое работает параллельно** - добавляем новую логику рядом со старой
3. ✅ **Постепенный переход** - переключаемся по частям
4. ✅ **Rollback в любой момент** - можем вернуться к старому
5. ✅ **Zero downtime** - система работает все время

---

## 📋 PHASE 1: PREPARATION (Подготовка - БЕЗ breaking changes)

### Шаг 1.1: Добавить новые таблицы (старые остаются)

```prisma
// schema.prisma

// НОВЫЕ таблицы (добавляем, не трогая старые)
model GlobalDoctor {
  id        String   @id @default(uuid())
  userId    String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user          User           @relation(fields: [userId], references: [id])
  clinicDoctors ClinicDoctor[]
}

model ClinicDoctor {
  id             String   @id @default(uuid())
  clinicId       String
  globalDoctorId String
  specialization String?
  licenseNumber  String?
  experience     Int?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  clinic       Clinic        @relation(...)
  globalDoctor GlobalDoctor  @relation(...)
  appointments Appointment[]
  
  @@index([clinicId])
  @@index([globalDoctorId])
  @@index([globalDoctorId, clinicId])  // Composite для быстрого поиска
}

// ... GlobalPatient, ClinicPatient аналогично

// СТАРЫЕ таблицы НЕ ТРОГАЕМ!
model User {
  // ... все поля остаются (specialization, licenseNumber, experience)
  // Добавляем ТОЛЬКО новые поля (optional)
  globalDoctorId  String?  @unique  // ← НОВОЕ (optional)
  globalPatientId String?  @unique  // ← НОВОЕ (optional)
  
  // Старые relations остаются
  appointments   Appointment[]  // ← СТАРОЕ (продолжает работать)
}

model Appointment {
  // ... все поля остаются
  doctorId  String  // ← СТАРОЕ (продолжает работать)
  patientId String  // ← СТАРОЕ (продолжает работать)
  
  // Добавляем ТОЛЬКО новые поля (optional, nullable)
  clinicDoctorId  String?  // ← НОВОЕ (optional, пока не используется)
  clinicPatientId String?  // ← НОВОЕ (optional, пока не используется)
}
```

**Результат:** 
- ✅ Старый код продолжает работать
- ✅ Новые таблицы созданы
- ✅ Новые поля добавлены (optional)
- ✅ Нет breaking changes

---

### Шаг 1.2: Создать новые сервисы (старые остаются)

```javascript
// services/clinic-doctor.service.js (НОВЫЙ)
export async function findClinicDoctorForUser(userId, clinicId) {
  // Новая логика
}

// services/patient.service.js (СТАРЫЙ - НЕ ТРОГАЕМ!)
export async function findAll(clinicId) {
  // Старая логика продолжает работать
}
```

**Результат:**
- ✅ Старые сервисы работают
- ✅ Новые сервисы готовы
- ✅ Нет конфликтов

---

### Шаг 1.3: Data Migration (заполняем новые таблицы)

```javascript
// scripts/migrate-data.js
async function migrateExistingData() {
  // 1. Мигрируем doctors
  const doctors = await prisma.user.findMany({ where: { role: 'DOCTOR' } });
  
  for (const doctor of doctors) {
    // Создаем GlobalDoctor (если еще нет)
    let globalDoctor = await prisma.globalDoctor.findUnique({
      where: { userId: doctor.id }
    });
    
    if (!globalDoctor) {
      globalDoctor = await prisma.globalDoctor.create({
        data: { userId: doctor.id }
      });
    }
    
    // Создаем ClinicDoctor (если еще нет)
    const existingClinicDoctor = await prisma.clinicDoctor.findFirst({
      where: {
        globalDoctorId: globalDoctor.id,
        clinicId: doctor.clinicId
      }
    });
    
    if (!existingClinicDoctor && doctor.clinicId) {
      await prisma.clinicDoctor.create({
        data: {
          clinicId: doctor.clinicId,
          globalDoctorId: globalDoctor.id,
          specialization: doctor.specialization,  // Копируем данные
          licenseNumber: doctor.licenseNumber,
          experience: doctor.experience,
        }
      });
    }
  }
  
  // 2. Мигрируем patients (аналогично)
  // 3. Заполняем clinicDoctorId/clinicPatientId в appointments (optional поля)
}
```

**Результат:**
- ✅ Новые таблицы заполнены
- ✅ Старые данные остаются
- ✅ Оба варианта работают параллельно

---

## 📋 PHASE 2: DUAL-WRITE (Двойная запись)

### Шаг 2.1: Обновить appointment creation (пишем в оба места)

```javascript
// services/appointment.service.js

export async function create(clinicId, data, userId) {
  // СТАРАЯ логика (продолжает работать)
  const oldAppointment = await prisma.appointment.create({
    data: {
      clinicId,
      doctorId: data.doctorId,      // ← СТАРОЕ
      patientId: data.patientId,     // ← СТАРОЕ
      // ... остальные поля
    }
  });
  
  // НОВАЯ логика (дополнительно)
  try {
    // Найти ClinicDoctor
    const clinicDoctor = await clinicDoctorService.findClinicDoctorForUser(
      userId,
      clinicId
    );
    
    // Найти ClinicPatient
    const clinicPatient = await prisma.clinicPatient.findFirst({
      where: {
        id: data.patientId,
        clinicId
      }
    });
    
    // Обновить appointment (добавить новые поля)
    const newAppointment = await prisma.appointment.update({
      where: { id: oldAppointment.id },
      data: {
        clinicDoctorId: clinicDoctor?.id,   // ← НОВОЕ (optional)
        clinicPatientId: clinicPatient?.id, // ← НОВОЕ (optional)
      }
    });
    
    return newAppointment;
  } catch (error) {
    // Если новая логика не работает - возвращаем старое
    console.warn('New appointment logic failed, using old:', error);
    return oldAppointment;
  }
}
```

**Результат:**
- ✅ Старая логика работает (fallback)
- ✅ Новая логика работает (если возможно)
- ✅ Оба варианта синхронизированы
- ✅ Если новое не работает - возвращаемся к старому

---

### Шаг 2.2: Обновить appointment reading (читаем из нового, fallback на старое)

```javascript
// services/appointment.service.js

export async function findAll(clinicId, options = {}) {
  // Пробуем читать из нового
  if (options.useNewLogic !== false) {  // Feature flag
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          clinicId,
          clinicDoctorId: { not: null },  // Только с новыми полями
          // ... остальные фильтры
        },
        include: {
          clinicDoctor: true,   // ← НОВОЕ
          clinicPatient: true,  // ← НОВОЕ
        }
      });
      
      if (appointments.length > 0) {
        return appointments;
      }
    } catch (error) {
      console.warn('New appointment read failed, falling back:', error);
    }
  }
  
  // Fallback на старое (если новое не работает или нет данных)
  return await prisma.appointment.findMany({
    where: {
      clinicId,
      // ... старые фильтры
    },
    include: {
      doctor: true,   // ← СТАРОЕ
      patient: true, // ← СТАРОЕ
    }
  });
}
```

**Результат:**
- ✅ Читаем из нового (если есть)
- ✅ Fallback на старое (если новое не работает)
- ✅ Постепенный переход

---

## 📋 PHASE 3: GRADUAL SWITCH (Постепенное переключение)

### Шаг 3.1: Feature Flag для нового кода

```javascript
// config/features.js
export const FEATURES = {
  USE_NEW_APPOINTMENT_LOGIC: process.env.USE_NEW_APPOINTMENT_LOGIC === 'true',
  USE_NEW_DOCTOR_LOGIC: process.env.USE_NEW_DOCTOR_LOGIC === 'true',
  // ...
};

// services/appointment.service.js
export async function create(clinicId, data, userId) {
  if (FEATURES.USE_NEW_APPOINTMENT_LOGIC) {
    // НОВАЯ логика (основная)
    return await createWithNewLogic(clinicId, data, userId);
  } else {
    // СТАРАЯ логика (fallback)
    return await createWithOldLogic(clinicId, data, userId);
  }
}
```

**Результат:**
- ✅ Можем переключаться через environment variable
- ✅ Легко откатить (просто изменить flag)
- ✅ Тестируем новое на staging

---

### Шаг 3.2: Постепенное переключение по частям

```javascript
// 1. Сначала только чтение (read-only)
// .env
USE_NEW_APPOINTMENT_READ=true
USE_NEW_APPOINTMENT_WRITE=false

// 2. Потом запись (write)
// .env
USE_NEW_APPOINTMENT_READ=true
USE_NEW_APPOINTMENT_WRITE=true

// 3. Полностью новое
// .env
USE_NEW_APPOINTMENT_LOGIC=true
```

**Результат:**
- ✅ Постепенный переход
- ✅ Тестируем каждую часть отдельно
- ✅ Минимальный риск

---

## 📋 PHASE 4: VALIDATION (Проверка)

### Шаг 4.1: Валидация данных (старое vs новое)

```javascript
// scripts/validate-migration.js
async function validateMigration() {
  // 1. Проверить, что все appointments имеют оба варианта
  const appointments = await prisma.appointment.findMany();
  
  for (const appointment of appointments) {
    // Старое
    const oldDoctor = await prisma.user.findUnique({
      where: { id: appointment.doctorId }
    });
    
    // Новое
    const newClinicDoctor = await prisma.clinicDoctor.findUnique({
      where: { id: appointment.clinicDoctorId }
    });
    
    // Проверка: данные должны совпадать
    if (oldDoctor.specialization !== newClinicDoctor.specialization) {
      console.error('Mismatch in appointment:', appointment.id);
    }
  }
  
  // 2. Проверить, что все новые appointments создаются правильно
  // 3. Проверить clinic isolation
}
```

**Результат:**
- ✅ Уверенность, что данные корректны
- ✅ Видим проблемы до полного переключения

---

## 📋 PHASE 5: FULL SWITCH (Полное переключение)

### Шаг 5.1: Переключить все на новое

```javascript
// .env
USE_NEW_APPOINTMENT_LOGIC=true
USE_NEW_DOCTOR_LOGIC=true
USE_NEW_PATIENT_LOGIC=true
```

**Результат:**
- ✅ Все используют новую логику
- ✅ Старая логика все еще доступна (fallback)

---

### Шаг 5.2: Удалить старые поля (только после полной уверенности)

```prisma
// schema.prisma

model User {
  // УДАЛЯЕМ (только после полного переключения!)
  // specialization String?  // ← УДАЛЯЕМ
  // licenseNumber  String?  // ← УДАЛЯЕМ
  // experience     Int?      // ← УДАЛЯЕМ
}

model Appointment {
  // УДАЛЯЕМ (только после полного переключения!)
  // doctorId  String  // ← УДАЛЯЕМ
  // patientId String  // ← УДАЛЯЕМ
  
  // Делаем обязательными новые поля
  clinicDoctorId  String  // ← Теперь required
  clinicPatientId String  // ← Теперь required
}
```

**Результат:**
- ✅ Чистая архитектура
- ✅ Нет legacy code

---

## 🔄 ROLLBACK STRATEGY (На каждом этапе)

### Если что-то пошло не так:

#### Phase 1-2: Откат данных
```bash
# Восстановить backup
cp dev.db.backup dev.db

# Или откатить migration
npx prisma migrate resolve --rolled-back <migration-name>
```

#### Phase 3-4: Откат через feature flags
```javascript
// .env
USE_NEW_APPOINTMENT_LOGIC=false  // ← Вернуться к старому
```

#### Phase 5: Откат кода
```bash
git checkout <previous-commit>
```

---

## 📊 TIMELINE (Безопасный план)

### День 1: Preparation
- ✅ Добавить новые таблицы (без удаления старых)
- ✅ Создать новые сервисы
- ✅ Data migration script
- ✅ Тестирование на копии БД

### День 2: Dual-Write
- ✅ Обновить appointment creation (dual-write)
- ✅ Обновить appointment reading (fallback)
- ✅ Тестирование

### День 3: Gradual Switch
- ✅ Feature flags
- ✅ Постепенное переключение (read → write → full)
- ✅ Мониторинг

### День 4: Validation & Cleanup
- ✅ Валидация данных
- ✅ Полное переключение
- ✅ Удаление старых полей (если все OK)

---

## ✅ CHECKLIST БЕЗОПАСНОСТИ

### Перед каждым шагом:
- [ ] Backup создан
- [ ] Тесты написаны
- [ ] Feature flag готов
- [ ] Rollback plan готов

### После каждого шага:
- [ ] Данные проверены
- [ ] Функционал работает
- [ ] Нет ошибок
- [ ] Можно откатить

---

## 🎯 ПРЕИМУЩЕСТВА ЭТОГО ПОДХОДА

1. ✅ **Zero downtime** - система работает все время
2. ✅ **Безопасность** - можем откатить в любой момент
3. ✅ **Постепенность** - переключаемся по частям
4. ✅ **Тестируемость** - тестируем каждую часть отдельно
5. ✅ **Надежность** - fallback на старое, если новое не работает

---

## 🚀 ГОТОВЫ НАЧАТЬ?

**Следующий шаг:** Phase 1 - Preparation (без breaking changes!)

---

**Это профессиональный подход!** 🏗️


