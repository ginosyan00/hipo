import api from './api';
import { ApiResponse, Medication, PaginatedResponse } from '../types/api.types';

/**
 * Medication Service
 * API calls для работы с медикаментами
 */

export interface MedicationStats {
  totalMedications: number;
  totalValue: number;
  lowStockCount: number;
}

export const medicationService = {
  /**
   * Получить все медикаменты
   */
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Medication>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Medication>>>('/medications', {
      params,
    });
    return data.data;
  },

  /**
   * Получить медикамент по ID
   */
  async getById(id: string): Promise<Medication> {
    const { data } = await api.get<ApiResponse<Medication>>(`/medications/${id}`);
    return data.data;
  },

  /**
   * Получить статистику медикаментов
   */
  async getStats(): Promise<MedicationStats> {
    const { data } = await api.get<ApiResponse<MedicationStats>>('/medications/stats');
    return data.data;
  },

  /**
   * Создать медикамент
   */
  async create(medication: Partial<Medication>): Promise<Medication> {
    const { data } = await api.post<ApiResponse<Medication>>('/medications', medication);
    return data.data;
  },

  /**
   * Обновить медикамент
   */
  async update(id: string, medication: Partial<Medication>): Promise<Medication> {
    const { data } = await api.put<ApiResponse<Medication>>(`/medications/${id}`, medication);
    return data.data;
  },

  /**
   * Удалить медикамент
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/medications/${id}`);
  },
};


