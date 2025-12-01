import api from './api';
import { ApiResponse, Clinic, User, PaginatedResponse, Patient } from '../types/api.types';

/**
 * Public Service
 * API calls для публичных endpoints (без авторизации)
 */

export const publicService = {
  /**
   * Получить список клиник
   * Backend возвращает { clinics: [...], meta: {...} }, преобразуем в { data: [...], meta: {...} }
   */
  async getClinics(params?: { city?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Clinic>> {
    const { data } = await api.get<ApiResponse<{ clinics: Clinic[]; meta: any }>>(
      '/public/clinics',
      { params }
    );
    // Преобразуем { clinics: [...], meta: {...} } в { data: [...], meta: {...} }
    return {
      data: data.data.clinics || [],
      meta: data.data.meta || { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
  },

  /**
   * Получить клинику по slug
   */
  async getClinicBySlug(slug: string): Promise<Clinic> {
    const { data } = await api.get<ApiResponse<Clinic>>(`/public/clinics/${slug}`);
    return data.data;
  },

  /**
   * Получить врачей клиники
   */
  async getClinicDoctors(slug: string): Promise<User[]> {
    const { data } = await api.get<ApiResponse<User[]>>(`/public/clinics/${slug}/doctors`);
    return data.data;
  },

  /**
   * Получить врача по ID
   */
  async getClinicDoctor(slug: string, doctorId: string): Promise<User & { clinic: { id: string; name: string; slug: string } }> {
    const { data } = await api.get<ApiResponse<User & { clinic: { id: string; name: string; slug: string } }>>(
      `/public/clinics/${slug}/doctors/${doctorId}`
    );
    return data.data;
  },

  /**
   * Получить список городов
   */
  async getCities(): Promise<string[]> {
    const { data } = await api.get<ApiResponse<string[]>>('/public/cities');
    return data.data;
  },

  /**
   * Создать публичную заявку на приём
   */
  async createAppointment(appointmentData: {
    clinicSlug: string;
    doctorId: string;
    patient: {
      name: string;
      phone: string;
      email?: string;
    };
    appointmentDate: string;
    reason?: string;
    registeredAt?: string; // Локальное время когда пациент был на сайте и отправил регистрацию
  }): Promise<any> {
    const { data } = await api.post<ApiResponse<any>>(
      '/public/appointments',
      appointmentData
    );
    return data.data;
  },

  /**
   * Получить список пациентов для отзывов
   */
  async getPatientsForTestimonials(limit: number = 3): Promise<Array<{ id: string; name: string }>> {
    const { data } = await api.get<ApiResponse<Array<{ id: string; name: string }>>>(
      '/public/testimonials/patients',
      { params: { limit } }
    );
    return data.data;
  },

  /**
   * Получить список пациентов клиники
   * Backend возвращает { patients: [...], meta: {...} }, преобразуем в { data: [...], meta: {...} }
   */
  async getClinicPatients(slug: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Patient>> {
    const { data } = await api.get<ApiResponse<{ patients: Patient[]; meta: any }>>(
      `/public/clinics/${slug}/patients`,
      { params }
    );
    // Преобразуем { patients: [...], meta: {...} } в { data: [...], meta: {...} }
    return {
      data: data.data.patients || [],
      meta: data.data.meta || { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
  },
};


