import api from './api';
import { ApiResponse, Clinic, ClinicSettings } from '../types/api.types';

/**
 * Clinic Service
 * API calls для работы с клиникой и её настройками
 */

export const clinicService = {
  /**
   * Получить данные текущей клиники
   */
  async getClinic(): Promise<Clinic> {
    const { data } = await api.get<ApiResponse<Clinic>>('/clinic/me');
    return data.data;
  },

  /**
   * Обновить профиль клиники
   */
  async updateClinic(clinicData: Partial<Clinic>): Promise<Clinic> {
    const { data } = await api.put<ApiResponse<Clinic>>('/clinic/me', clinicData);
    return data.data;
  },

  /**
   * Загрузить логотип клиники
   */
  async uploadLogo(logo: string): Promise<{ id: string; name: string; logo: string | null; updatedAt: Date }> {
    const { data } = await api.post<ApiResponse<{ id: string; name: string; logo: string | null; updatedAt: Date }>>(
      '/clinic/logo',
      { logo }
    );
    return data.data;
  },

  /**
   * Получить настройки клиники
   */
  async getSettings(): Promise<ClinicSettings> {
    const { data } = await api.get<ApiResponse<ClinicSettings>>('/clinic/settings');
    return data.data;
  },

  /**
   * Обновить настройки клиники
   */
  async updateSettings(settingsData: Partial<ClinicSettings>): Promise<ClinicSettings> {
    const { data } = await api.put<ApiResponse<ClinicSettings>>('/clinic/settings', settingsData);
    return data.data;
  },

  /**
   * Обновить пароль администратора клиники
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.put<ApiResponse<{ success: boolean; message: string }>>('/clinic/password', {
      currentPassword,
      newPassword,
    });
    return data.data;
  },
};

