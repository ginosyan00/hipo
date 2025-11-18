import api from './api';
import { ApiResponse, Patient, PaginatedResponse } from '../types/api.types';

/**
 * Patient Service
 * API calls для работы с пациентами
 */

export const patientService = {
  /**
   * Получить всех пациентов
   */
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Patient>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Patient>>>('/patients', {
      params,
    });
    return data.data;
  },

  /**
   * Получить пациента по ID
   */
  async getById(id: string): Promise<Patient> {
    const { data } = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
    return data.data;
  },

  /**
   * Создать пациента
   */
  async create(patient: Partial<Patient>): Promise<Patient> {
    const { data } = await api.post<ApiResponse<Patient>>('/patients', patient);
    return data.data;
  },

  /**
   * Обновить пациента
   */
  async update(id: string, patient: Partial<Patient>): Promise<Patient> {
    const { data } = await api.put<ApiResponse<Patient>>(`/patients/${id}`, patient);
    return data.data;
  },

  /**
   * Удалить пациента
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  },

  /**
   * Получить мои appointments (для PATIENT)
   */
  async getMyAppointments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<any>>>('/patients/appointments', {
      params,
    });
    return data.data;
  },

  /**
   * Получить все визиты пациентов с полной информацией
   */
  async getAllVisits(params?: {
    doctorId?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<any>>>('/patients/visits', {
      params,
    });
    return data.data;
  },
};


