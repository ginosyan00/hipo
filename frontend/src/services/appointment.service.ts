import api from './api';
import { ApiResponse, Appointment, PaginatedResponse } from '../types/api.types';

/**
 * Appointment Service
 * API calls для работы с приёмами
 */

export const appointmentService = {
  /**
   * Получить все приёмы
   */
  async getAll(params?: {
    doctorId?: string;
    patientId?: string;
    status?: string;
    date?: string;
    time?: string;
    week?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Appointment>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Appointment>>>(
      '/appointments',
      { params }
    );
    return data.data;
  },

  /**
   * Получить приём по ID
   */
  async getById(id: string): Promise<Appointment> {
    const { data } = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return data.data;
  },

  /**
   * Создать приём
   */
  async create(appointment: {
    doctorId: string;
    patientId: string;
    appointmentDate: string;
    duration?: number;
    reason?: string;
    registeredAt?: string; // Локальное время когда пользователь создал запись
  }): Promise<Appointment> {
    const { data } = await api.post<ApiResponse<Appointment>>('/appointments', appointment);
    return data.data;
  },

  /**
   * Обновить приём
   */
  async update(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    const { data } = await api.put<ApiResponse<Appointment>>(`/appointments/${id}`, appointment);
    return data.data;
  },

  /**
   * Изменить статус
   * При статусе 'completed' можно передать amount (сумму оплаты)
   * При статусе 'cancelled' обязательно передать cancellationReason и опционально suggestedNewDate
   */
  async updateStatus(
    id: string, 
    status: string, 
    amount?: number,
    cancellationReason?: string,
    suggestedNewDate?: string
  ): Promise<Appointment> {
    const body: { 
      status: string; 
      amount?: number;
      cancellationReason?: string;
      suggestedNewDate?: string;
    } = { status };
    
    if (amount !== undefined) {
      body.amount = amount;
    }
    
    if (cancellationReason !== undefined) {
      body.cancellationReason = cancellationReason;
    }
    
    if (suggestedNewDate !== undefined) {
      body.suggestedNewDate = suggestedNewDate;
    }
    
    const { data } = await api.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/status`,
      body
    );
    return data.data;
  },

  /**
   * Удалить приём
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },
};


