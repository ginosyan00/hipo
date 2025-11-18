import api from './api';
import { ApiResponse, Notification, PaginatedResponse } from '../types/api.types';

/**
 * Notification Service
 * API calls для работы с уведомлениями
 */

export const notificationService = {
  /**
   * Получить все уведомления пациента
   */
  async getAll(params?: {
    patientId?: string;
    isRead?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Notification>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Notification>>>(
      '/notifications',
      { params }
    );
    return data.data;
  },

  /**
   * Получить количество непрочитанных уведомлений
   */
  async getUnreadCount(patientId?: string): Promise<number> {
    const params = patientId ? { patientId } : {};
    const { data } = await api.get<ApiResponse<{ count: number }>>(
      '/notifications/unread-count',
      { params }
    );
    return data.data.count;
  },

  /**
   * Получить уведомление по ID
   */
  async getById(id: string, patientId?: string): Promise<Notification> {
    const params = patientId ? { patientId } : {};
    const { data } = await api.get<ApiResponse<Notification>>(`/notifications/${id}`, { params });
    return data.data;
  },

  /**
   * Отметить уведомление как прочитанное
   */
  async markAsRead(id: string, patientId?: string): Promise<Notification> {
    const params = patientId ? { patientId } : {};
    const { data } = await api.patch<ApiResponse<Notification>>(
      `/notifications/${id}/read`,
      {},
      { params }
    );
    return data.data;
  },

  /**
   * Отметить все уведомления как прочитанные
   */
  async markAllAsRead(patientId?: string): Promise<{ count: number }> {
    const params = patientId ? { patientId } : {};
    const { data } = await api.patch<ApiResponse<{ count: number }>>(
      '/notifications/read-all',
      {},
      { params }
    );
    return data.data;
  },

  /**
   * Удалить уведомление
   */
  async delete(id: string, patientId?: string): Promise<void> {
    const params = patientId ? { patientId } : {};
    await api.delete(`/notifications/${id}`, { params });
  },
};

