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
  workingHours?: WorkingHours;
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
  registeredAt?: Date | string; // Время когда пациент был на сайте и отправил регистрацию (локальное время пользователя)
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
}

export enum AppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export interface Medication {
  id: string;
  clinicId: string;
  name: string;
  dosage: string;
  quantity: number;
  price: number;
  expiryDate: Date | string;
  manufacturer: string;
  createdAt: Date;
  updatedAt: Date;
}


