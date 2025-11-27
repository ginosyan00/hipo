import api from './api';
import { ApiResponse, Patient, PaginatedResponse, DoctorPatient } from '../types/api.types';

/**
 * Patient Service
 * API calls для работы с пациентами
 */

export const patientService = {
  /**
   * Получить всех пациентов
   */
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Patient>> {
    console.log('🔵 [PATIENT SERVICE FRONTEND] Запрос пациентов:', params);
    const { data } = await api.get<ApiResponse<PaginatedResponse<Patient>>>('/patients', {
      params,
    });
    console.log('🔵 [PATIENT SERVICE FRONTEND] Ответ:', {
      rawResponse: data.data,
      hasPatients: !!data.data?.patients,
      hasData: !!data.data?.data,
      totalPatients: data.data?.patients?.length || data.data?.data?.length || 0,
      meta: data.data?.meta,
      sample: (data.data?.patients || data.data?.data || []).slice(0, 3).map((p: Patient) => ({ id: p.id, name: p.name, phone: p.phone })),
    });
    
    // Backend возвращает { patients: [...], meta: {...} }, но наш тип ожидает { data: [...], meta: {...} }
    // Преобразуем структуру для совместимости
    if (data.data?.patients) {
      return {
        data: data.data.patients,
        meta: data.data.meta,
      };
    }
    
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
    
    // Debug: Проверяем данные перед возвратом
    console.log('🔵 [PATIENT SERVICE] getMyAppointments - Response:', {
      total: data.data.appointments?.length || 0,
      completed: data.data.appointments?.filter((apt: any) => apt.status === 'completed').length || 0,
      withAmount: data.data.appointments?.filter((apt: any) => apt.amount && apt.amount > 0).length || 0,
      appointments: data.data.appointments?.map((apt: any) => ({
        id: apt.id,
        status: apt.status,
        amount: apt.amount,
        appointmentDate: apt.appointmentDate,
      })) || [],
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

  /**
   * Получить агрегированные данные пациентов конкретного врача
   * Если doctorId не указан, используется ID текущего пользователя (для врачей)
   */
  async getDoctorPatients(
    doctorId: string | undefined,
    params?: {
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<DoctorPatient>> {
    // Если doctorId не указан, используем пустой путь (backend сам определит по токену)
    const url = doctorId ? `/patients/doctor/${doctorId}` : '/patients/doctor';
    const { data } = await api.get<ApiResponse<PaginatedResponse<DoctorPatient>>>(url, {
      params,
    });
    return data.data;
  },
};


