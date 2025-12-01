# 🧪 РУКОВОДСТВО ПО ТЕСТИРОВАНИЮ: Migration

> **Дата:** 22.01.2025  
> **Для:** Проверка успешной миграции Global/Clinic Identity Separation

---

## ✅ ЧТО ПРОВЕРЯТЬ

### 1. Проверка таблиц в БД

#### Через Prisma Studio:
```bash
cd backend
npx prisma studio
```

Открыть в браузере и проверить:
- ✅ `global_doctors` - должна содержать записи
- ✅ `clinic_doctors` - должна содержать записи
- ✅ `global_patients` - должна содержать записи
- ✅ `clinic_patients` - должна содержать записи
- ✅ `appointments` - должна иметь заполненные `clinicDoctorId` и `clinicPatientId`

---

### 2. Проверка данных через SQL

```sql
-- Проверить количество записей
SELECT COUNT(*) as global_doctors_count FROM global_doctors;
SELECT COUNT(*) as clinic_doctors_count FROM clinic_doctors;
SELECT COUNT(*) as global_patients_count FROM global_patients;
SELECT COUNT(*) as clinic_patients_count FROM clinic_patients;

-- Проверить appointments с новыми полями
SELECT COUNT(*) as appointments_with_doctor FROM appointments WHERE clinicDoctorId IS NOT NULL;
SELECT COUNT(*) as appointments_with_patient FROM appointments WHERE clinicPatientId IS NOT NULL;

-- Проверить связи
SELECT 
  a.id,
  a.clinicDoctorId,
  a.clinicPatientId,
  cd.id as clinic_doctor_id,
  cp.id as clinic_patient_id
FROM appointments a
LEFT JOIN clinic_doctors cd ON a.clinicDoctorId = cd.id
LEFT JOIN clinic_patients cp ON a.clinicPatientId = cp.id
LIMIT 10;
```

---

### 3. Тестирование API Endpoints

#### 3.1. Проверить старые endpoints (должны работать):

```bash
# Получить все appointments
GET /api/v1/appointments
Authorization: Bearer <token>

# Создать новый appointment
POST /api/v1/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "...",
  "patientId": "...",
  "appointmentDate": "2025-01-25T10:00:00Z",
  "duration": 30,
  "reason": "Test"
}
```

**Ожидаемый результат:**
- ✅ Старые endpoints работают
- ✅ Appointment создается с doctorId и patientId
- ✅ Dual-write заполняет clinicDoctorId и clinicPatientId (если feature flag включен)

---

#### 3.2. Проверить новые relations:

```bash
# Получить appointment с новыми relations
GET /api/v1/appointments/:id
Authorization: Bearer <token>
```

**Ожидаемый результат:**
- ✅ Response включает `clinicDoctor` relation (если заполнен)
- ✅ Response включает `clinicPatient` relation (если заполнен)
- ✅ Старые `doctor` и `patient` relations работают

---

### 4. Проверка Dual-Write Logic

#### 4.1. Создать новый appointment и проверить логи:

При создании appointment проверьте логи сервера:

```
✅ [APPOINTMENT SERVICE] Phase 2: Найден ClinicDoctor для appointment ...
✅ [APPOINTMENT SERVICE] Phase 2: Найден ClinicPatient для appointment ...
✅ [APPOINTMENT SERVICE] Phase 2: Appointment ... обновлен с новыми полями
```

#### 4.2. Проверить что данные записались:

```sql
SELECT 
  id,
  doctorId,
  patientId,
  clinicDoctorId,
  clinicPatientId
FROM appointments
WHERE id = '<new_appointment_id>';
```

**Ожидаемый результат:**
- ✅ `doctorId` заполнен (старая логика)
- ✅ `patientId` заполнен (старая логика)
- ✅ `clinicDoctorId` заполнен (новая логика, если feature flag включен)
- ✅ `clinicPatientId` заполнен (новая логика, если feature flag включен)

---

### 5. Проверка Feature Flags

#### 5.1. Включить feature flags:

Добавить в `.env`:
```env
USE_NEW_APPOINTMENT_LOGIC=true
USE_NEW_APPOINTMENT_WRITE=true
```

#### 5.2. Перезапустить сервер:

```bash
cd backend
npm run dev
```

#### 5.3. Создать appointment и проверить:

- ✅ Dual-write должен работать автоматически
- ✅ Логи должны показывать "Phase 2: ..."

---

### 6. Проверка новых сервисов

#### 6.1. Проверить GlobalDoctor Service:

```javascript
// В консоли или тесте
import * as globalDoctorService from './services/global-doctor.service.js';

// Найти GlobalDoctor по userId
const globalDoctor = await globalDoctorService.findGlobalDoctorByUserId(userId);
console.log(globalDoctor);
```

#### 6.2. Проверить ClinicDoctor Service:

```javascript
import * as clinicDoctorService from './services/clinic-doctor.service.js';

// Найти ClinicDoctor
const clinicDoctor = await clinicDoctorService.findClinicDoctorForUser(userId, clinicId);
console.log(clinicDoctor);
```

---

### 7. Проверка Integrity

#### 7.1. Проверить что все врачи мигрированы:

```sql
-- Все врачи должны иметь GlobalDoctor
SELECT 
  u.id as user_id,
  u.email,
  gd.id as global_doctor_id,
  cd.id as clinic_doctor_id
FROM users u
LEFT JOIN global_doctors gd ON u.id = gd.userId
LEFT JOIN clinic_doctors cd ON gd.id = cd.globalDoctorId
WHERE u.role = 'DOCTOR';
```

#### 7.2. Проверить что все пациенты мигрированы:

```sql
-- Все пациенты должны иметь GlobalPatient и ClinicPatient
SELECT 
  p.id as patient_id,
  p.name,
  gp.id as global_patient_id,
  cp.id as clinic_patient_id
FROM patients p
LEFT JOIN clinic_patients cp ON p.id = cp.id -- упрощенная проверка
LIMIT 10;
```

---

## 🚨 ЧТО ДЕЛАТЬ ПРИ ОШИБКАХ

### Ошибка: Таблица не найдена
**Решение:** Применить migration еще раз:
```bash
cd backend
node scripts/apply-migration-directly.js
```

### Ошибка: Данные не мигрированы
**Решение:** Запустить data migration еще раз:
```bash
cd backend
node scripts/migrate-data-phase1.js
```

### Ошибка: Dual-write не работает
**Проверка:**
1. Feature flag включен?
2. User имеет GlobalDoctor/ClinicDoctor?
3. Patient имеет GlobalPatient/ClinicPatient?

---

## 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### После успешной миграции:

- ✅ **global_doctors:** 7 записей (по количеству врачей)
- ✅ **clinic_doctors:** 7+ записей (могут быть дубликаты по клиникам)
- ✅ **global_patients:** 20 или меньше записей (группировка по phone/email)
- ✅ **clinic_patients:** 20 записей (по количеству пациентов)
- ✅ **appointments:** 43 записи с заполненными clinicDoctorId и clinicPatientId

---

## ✅ ЧЕКЛИСТ ТЕСТИРОВАНИЯ

- [ ] Проверить что все таблицы созданы
- [ ] Проверить количество записей в новых таблицах
- [ ] Проверить что appointments обновлены
- [ ] Проверить старые API endpoints (должны работать)
- [ ] Создать новый appointment (проверить dual-write)
- [ ] Проверить логи dual-write
- [ ] Проверить новые relations в response
- [ ] Включить feature flags и проверить
- [ ] Проверить integrity данных

---

**После успешного тестирования система готова к использованию!** ✅
