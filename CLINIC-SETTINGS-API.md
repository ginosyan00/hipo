# API для настроек клиники

## Endpoints

### 1. Получить данные клиники
```bash
GET /api/v1/clinic/me
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "clinic-id",
    "name": "Название клиники",
    "slug": "my-clinic",
    "email": "clinic@example.com",
    "phone": "+37412345678",
    "address": "Адрес",
    "city": "Ереван",
    "about": "Описание",
    "logo": "data:image/png;base64,...",
    "workingHours": {
      "monday": { "isOpen": true, "open": "09:00", "close": "18:00" },
      ...
    },
    "settings": {
      "timezone": "Asia/Yerevan",
      "language": "ru",
      "currency": "AMD",
      ...
    }
  }
}
```

### 2. Обновить профиль клиники
```bash
PUT /api/v1/clinic/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Новое название",
  "email": "new@example.com",
  "phone": "+37412345678",
  "city": "Ереван",
  "address": "Новый адрес",
  "about": "Новое описание"
}
```

### 3. Загрузить логотип
```bash
POST /api/v1/clinic/logo
Authorization: Bearer <token>
Content-Type: application/json

{
  "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### 4. Получить настройки
```bash
GET /api/v1/clinic/settings
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "settings-id",
    "clinicId": "clinic-id",
    "timezone": "Asia/Yerevan",
    "language": "ru",
    "currency": "AMD",
    "defaultAppointmentDuration": 30,
    "emailNotificationsEnabled": true,
    "smsNotificationsEnabled": false,
    "appointmentReminderHours": 24,
    "notifyNewAppointments": true,
    "notifyCancellations": true,
    "notifyConfirmations": true
  }
}
```

### 5. Обновить настройки
```bash
PUT /api/v1/clinic/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "emailNotificationsEnabled": true,
  "smsNotificationsEnabled": false,
  "appointmentReminderHours": 48,
  "notifyNewAppointments": true,
  "notifyCancellations": true,
  "notifyConfirmations": true,
  "timezone": "Asia/Yerevan",
  "language": "ru",
  "currency": "AMD",
  "defaultAppointmentDuration": 30
}
```

### 6. Изменить пароль
```bash
PUT /api/v1/clinic/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "старый_пароль",
  "newPassword": "новый_пароль123"
}
```

## Примеры использования (JavaScript/TypeScript)

### Frontend (React)
```typescript
import { useClinic, useUpdateClinic, useClinicSettings } from './hooks/useClinic';

function SettingsPage() {
  const { data: clinic } = useClinic();
  const { data: settings } = useClinicSettings();
  const updateClinic = useUpdateClinic();
  
  const handleUpdate = async () => {
    await updateClinic.mutateAsync({
      name: "Новое название",
      email: "new@example.com"
    });
  };
  
  return (
    <div>
      <h1>{clinic?.name}</h1>
      <button onClick={handleUpdate}>Обновить</button>
    </div>
  );
}
```

### Backend (Node.js/Express)
```javascript
// В вашем контроллере уже есть все необходимое
// Просто используйте middleware authenticate и tenantMiddleware
```

## Валидация

Все endpoints используют Joi валидацию:
- Email должен быть валидным
- Телефон должен соответствовать формату
- Пароль: минимум 8 символов, заглавная, строчная буква и цифра
- Slug: только строчные буквы, цифры и дефисы
- Часовой пояс: валидный IANA timezone
- Язык: ru, en, am
- Валюта: AMD, RUB, USD

## Ошибки

Все ошибки возвращаются в формате:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Описание ошибки",
    "details": {}
  }
}
```

