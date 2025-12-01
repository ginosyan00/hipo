/**
 * Feature Flags Configuration
 * Phase 3: Gradual Switch - возможность переключения между старой и новой логикой
 * 
 * Использование через environment variables:
 * USE_NEW_APPOINTMENT_LOGIC=true
 * USE_NEW_DOCTOR_LOGIC=true
 * USE_NEW_PATIENT_LOGIC=true
 */

/**
 * Feature flags для постепенного переключения на новую архитектуру
 */
export const FEATURES = {
  // Appointment logic
  USE_NEW_APPOINTMENT_LOGIC: process.env.USE_NEW_APPOINTMENT_LOGIC === 'true',
  USE_NEW_APPOINTMENT_READ: process.env.USE_NEW_APPOINTMENT_READ === 'true',
  USE_NEW_APPOINTMENT_WRITE: process.env.USE_NEW_APPOINTMENT_WRITE === 'true',

  // Doctor logic
  USE_NEW_DOCTOR_LOGIC: process.env.USE_NEW_DOCTOR_LOGIC === 'true',

  // Patient logic
  USE_NEW_PATIENT_LOGIC: process.env.USE_NEW_PATIENT_LOGIC === 'true',

  // Global/Clinic Identity Separation
  USE_GLOBAL_CLINIC_SEPARATION: process.env.USE_GLOBAL_CLINIC_SEPARATION === 'true',
};

/**
 * Проверить, включена ли новая логика для appointments
 * @param {string} type - 'read' или 'write'
 * @returns {boolean}
 */
export function useNewAppointmentLogic(type = 'both') {
  if (type === 'read') {
    return FEATURES.USE_NEW_APPOINTMENT_READ || FEATURES.USE_NEW_APPOINTMENT_LOGIC;
  }
  if (type === 'write') {
    return FEATURES.USE_NEW_APPOINTMENT_WRITE || FEATURES.USE_NEW_APPOINTMENT_LOGIC;
  }
  return FEATURES.USE_NEW_APPOINTMENT_LOGIC;
}

/**
 * Логирование текущих feature flags (для отладки)
 */
export function logFeatureFlags() {
  console.log('🔧 [FEATURE FLAGS] Текущие настройки:', {
    USE_NEW_APPOINTMENT_LOGIC: FEATURES.USE_NEW_APPOINTMENT_LOGIC,
    USE_NEW_APPOINTMENT_READ: FEATURES.USE_NEW_APPOINTMENT_READ,
    USE_NEW_APPOINTMENT_WRITE: FEATURES.USE_NEW_APPOINTMENT_WRITE,
    USE_NEW_DOCTOR_LOGIC: FEATURES.USE_NEW_DOCTOR_LOGIC,
    USE_NEW_PATIENT_LOGIC: FEATURES.USE_NEW_PATIENT_LOGIC,
    USE_GLOBAL_CLINIC_SEPARATION: FEATURES.USE_GLOBAL_CLINIC_SEPARATION,
  });
}


