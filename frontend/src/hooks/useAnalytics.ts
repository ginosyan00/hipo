import { useQuery } from '@tanstack/react-query';
import { analyticsService, AnalyticsFilters, AnalyticsTableParams } from '../services/analytics.service';

/**
 * React Query Hooks для аналитики
 */

/**
 * Получить общие метрики клиники
 */
export function useAnalyticsSummary(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'summary', filters],
    queryFn: () => analyticsService.getSummary(filters),
    staleTime: 30000, // 30 секунд - метрики обновляются не так часто
    refetchOnWindowFocus: false,
    gcTime: 300000, // 5 минут
    retry: 1,
  });
}

/**
 * Получить данные для графиков
 */
export function useAnalyticsChart(
  type: 'daily' | 'weekly' | 'monthly' | 'byDoctor' | 'byCategory' | 'byStatus' = 'monthly',
  filters?: AnalyticsFilters
) {
  return useQuery({
    queryKey: ['analytics', 'charts', type, filters],
    queryFn: () => analyticsService.getChartData(type, filters),
    staleTime: 30000, // 30 секунд
    refetchOnWindowFocus: false,
    gcTime: 300000, // 5 минут
    retry: 1,
  });
}

/**
 * Получить данные для таблицы аналитики
 */
export function useAnalyticsTable(params?: AnalyticsTableParams) {
  return useQuery({
    queryKey: ['analytics', 'table', params],
    queryFn: () => analyticsService.getTable(params),
    staleTime: 10000, // 10 секунд
    refetchOnWindowFocus: false,
    gcTime: 300000, // 5 минут
    retry: 1,
  });
}

