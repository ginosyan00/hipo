/**
 * API Types
 * Типы для API запросов и ответов
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface RegisterRequest {
  clinic: {
    name: string;
    slug: string;
    email: string;
    phone: string;
    city: string;
    address?: string;
  };
  admin: {
    name: string;
    email: string;
    password: string;
  };
}

export interface RegisterResponse {
  clinic: Clinic;
  user: User;
  token: string;
}

// Models
export interface Clinic {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  about?: string;
  logo?: string;
  heroImage?: string;
  workingHours?: WorkingHours;
  certificates?: Certificate[];
  createdAt: Date;
  updatedAt: Date;
  settings?: ClinicSettings;
}

export interface ClinicSettings {
  id: string;
  clinicId: string;
  timezone: string;
  language: 'ru' | 'en' | 'am';
  currency: 'AMD' | 'RUB' | 'USD';
  defaultAppointmentDuration: number;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  appointmentReminderHours: number;
  notifyNewAppointments: boolean;
  notifyCancellations: boolean;
  notifyConfirmations: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  open: string | null;
  close: string | null;
  isOpen: boolean;
}

export interface User {
  id: string;
  clinicId?: string | null;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  
  // Common fields
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date | string;
  gender?: 'male' | 'female' | 'other';
  
  // Doctor-specific fields
  specialization?: string;
  licenseNumber?: string;
  experience?: number;
  
  // Partner-specific fields
  organizationName?: string;
  organizationType?: 'pharmacy' | 'laboratory' | 'insurance';
  inn?: string;
  address?: string;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  clinic?: {
    id: string;
    name: string;
    slug: string;
  };
}

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN',
  CLINIC = 'CLINIC', // Для обратной совместимости (если используется в старых данных)
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  appointments?: Appointment[]; // Полная история визитов
}

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

export interface Appointment {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  appointmentDate: Date;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  reason?: string;
  amount?: number; // Сумма оплаты
  registeredAt?: Date | string; // Время когда пациент был на сайте и отправил регистрацию (локальное время пользователя)
  cancellationReason?: string; // Причина отмены приёма
  suggestedNewDate?: Date | string; // Предложенное новое время приёма
  createdAt: Date;
  updatedAt: Date;
  doctor?: {
    id: string;
    name: string;
    specialization?: string;
  };
  patient?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  clinic?: {
    id: string;
    name: string;
    city?: string;
    slug?: string;
  };
}

export enum AppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export interface PatientVisit {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientDateOfBirth?: Date | string;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  appointmentDate: Date | string;
  duration: number;
  status: AppointmentStatus;
  reason?: string;
  amount?: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Агрегированные данные пациента врача
 * Группирует все визиты пациента и показывает статистику
 */
export interface DoctorPatient {
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientDateOfBirth?: Date | string;
  patientGender?: string;
  visitCount: number; // Количество визитов
  totalAmount: number; // Общая сумма оплат
  lastVisitDate: Date | string; // Дата последнего визита
  lastVisitStatus: AppointmentStatus; // Статус последнего визита
  procedures: string[]; // Список процедур
}

export interface Notification {
  id: string;
  clinicId: string;
  patientId?: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  appointmentId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  patient?: {
    id: string;
    name: string;
    phone: string;
  };
  user?: {
    id: string;
    name: string;
    specialization?: string;
  };
}

export enum NotificationType {
  Cancellation = 'cancellation',
  Reschedule = 'reschedule',
  Reminder = 'reminder',
  Confirmation = 'confirmation',
  NewAppointment = 'new_appointment',
  Other = 'other',
}

export interface Certificate {
  id: string;
  clinicId: string;
  title: string;
  certificateNumber?: string;
  issuedBy?: string;
  issueDate?: Date | string;
  expiryDate?: Date | string;
  fileUrl: string;
  fileType: 'pdf' | 'jpg' | 'jpeg' | 'png';
  fileSize?: number;
  isVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}


