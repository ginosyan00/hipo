import api from './api';
import { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '../types/api.types';

/**
 * Auth Service
 * API calls для аутентификации
 */

export const authService = {
  /**
   * Авторизация
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return data.data;
  },

  /**
   * Регистрация клиники (старый метод)
   */
  async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    const { data } = await api.post<ApiResponse<RegisterResponse>>(
      '/auth/register',
      registerData
    );
    return data.data;
  },

  /**
   * Регистрация пользователя (Patient, Doctor, Partner)
   */
  async registerUser(userData: any): Promise<LoginResponse> {
    console.log('🔵 [AUTH SERVICE] Отправка регистрации пользователя:', userData);
    const { data } = await api.post<ApiResponse<LoginResponse>>(
      '/auth/register-user',
      userData
    );
    console.log('✅ [AUTH SERVICE] Регистрация успешна:', data.data);
    return data.data;
  },

  /**
   * Получить текущего пользователя
   */
  async getMe(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  /**
   * Изменить пароль текущего пользователя (для всех ролей)
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.put<ApiResponse<{ success: boolean; message: string }>>('/auth/password', {
      currentPassword,
      newPassword,
    });
    return data.data;
  },
};


