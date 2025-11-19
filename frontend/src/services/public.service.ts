import api from './api';
import { ApiResponse, Clinic, User, PaginatedResponse } from '../types/api.types';

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
};


