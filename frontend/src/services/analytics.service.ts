import api from './api';
import { ApiResponse } from '../types/api.types';

/**
 * Analytics Service
 * API calls для работы с аналитикой
 */

export interface AnalyticsSummary {
  totalPatients: number;
  totalDoctors: number;
  totalCompletedServices: number;
  totalRevenue: number;
  totalAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  averageRevenue: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
    tension?: number;
  }>;
}

export interface AnalyticsFilters {
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  week?: string;
  category?: string;
}

export interface AnalyticsTableItem {
  id: string;
  appointmentDate: string;
  duration: number;
  status: string;
  reason?: string;
  amount?: number;
  doctor: {
    id: string;
    name: string;
    specialization?: string;
  };
  patient: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface AnalyticsTableParams extends AnalyticsFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedAnalyticsTable {
  appointments: AnalyticsTableItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const analyticsService = {
  /**
   * Получить общие метрики клиники
   */
  async getSummary(filters?: AnalyticsFilters): Promise<AnalyticsSummary> {
    const { data } = await api.get<ApiResponse<AnalyticsSummary>>(
      '/analytics/summary',
      { params: filters }
    );
    return data.data;
  },

  /**
   * Получить данные для графиков
   * @param type - Тип графика: 'daily' | 'weekly' | 'monthly' | 'byDoctor' | 'byCategory' | 'byStatus'
   */
  async getChartData(
    type: 'daily' | 'weekly' | 'monthly' | 'byDoctor' | 'byCategory' | 'byStatus' = 'monthly',
    filters?: AnalyticsFilters
  ): Promise<ChartData> {
    const { data } = await api.get<ApiResponse<ChartData>>(
      '/analytics/charts',
      { params: { type, ...filters } }
    );
    return data.data;
  },

  /**
   * Получить детальные данные для таблицы
   */
  async getTable(params?: AnalyticsTableParams): Promise<PaginatedAnalyticsTable> {
    const { data } = await api.get<ApiResponse<AnalyticsTableItem[]>>(
      '/analytics/table',
      { params }
    );
    
    // Meta должен приходить в response.meta
    const meta = (data as any).meta || {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };

    return {
      appointments: data.data,
      meta,
    };
  },
};

