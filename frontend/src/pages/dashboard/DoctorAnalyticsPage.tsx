import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Button, Input } from '../../components/common';
import { MetricsCards } from '../../components/dashboard/MetricsCards';
import { AnalyticsLineChart } from '../../components/dashboard/AnalyticsLineChart';
import { AnalyticsBarChart } from '../../components/dashboard/AnalyticsBarChart';
import { AnalyticsPieChart } from '../../components/dashboard/AnalyticsPieChart';
import { AnalyticsTable } from '../../components/dashboard/AnalyticsTable';
import {
  useAnalyticsSummary,
  useAnalyticsChart,
  useAnalyticsTable,
} from '../../hooks/useAnalytics';
import { AnalyticsFilters } from '../../services/analytics.service';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * DoctorAnalyticsPage
 * Страница аналитики для врача
 * Показывает только данные текущего врача
 */
export const DoctorAnalyticsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore(state => state.user);

  // Инициализация фильтров из URL параметров
  // Для врача автоматически фильтруем по его ID
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState<string>(searchParams.get('dateTo') || '');
  const [week, setWeek] = useState<string>(searchParams.get('week') || '');
  const [category, setCategory] = useState<string>(searchParams.get('category') || '');
  const [categoryInput, setCategoryInput] = useState<string>(searchParams.get('category') || '');

  // Тип графика
  const [chartType, setChartType] = useState<'daily' | 'weekly' | 'monthly' | 'byCategory' | 'byStatus'>(
    (searchParams.get('chartType') as any) || 'monthly'
  );

  // Пагинация таблицы
  const [tablePage, setTablePage] = useState<number>(parseInt(searchParams.get('tablePage') || '1'));
  const [tableSortBy, setTableSortBy] = useState<string>(searchParams.get('tableSortBy') || 'appointmentDate');
  const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('tableSortOrder') as 'asc' | 'desc') || 'desc'
  );

  const isInitialMount = useRef(true);

  // Построение фильтров для API
  // Автоматически добавляем doctorId текущего пользователя
  const filters: AnalyticsFilters = React.useMemo(() => {
    const f: AnalyticsFilters = {};
    
    // ВСЕГДА фильтруем по текущему врачу
    if (user?.id) {
      f.doctorId = user.id;
    }
    
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    if (week) f.week = week;
    if (category) f.category = category;
    return f;
  }, [user?.id, dateFrom, dateTo, week, category]);

  // Загрузка данных
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(filters);
  const { data: chartData, isLoading: chartLoading } = useAnalyticsChart(chartType, filters);
  const { data: statusChartData, isLoading: statusChartLoading } = useAnalyticsChart('byStatus', filters);
  const { data: tableData, isLoading: tableLoading } = useAnalyticsTable({
    ...filters,
    page: tablePage,
    limit: 20,
    sortBy: tableSortBy,
    sortOrder: tableSortOrder,
  });

  // Debounce для категории
  useEffect(() => {
    const timer = setTimeout(() => {
      setCategory(categoryInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [categoryInput]);

  // Синхронизация фильтров с URL
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (week) params.set('week', week);
    if (category) params.set('category', category);
    if (chartType) params.set('chartType', chartType);
    if (tablePage > 1) params.set('tablePage', tablePage.toString());
    if (tableSortBy !== 'appointmentDate') params.set('tableSortBy', tableSortBy);
    if (tableSortOrder !== 'desc') params.set('tableSortOrder', tableSortOrder);

    setSearchParams(params, { replace: true });
  }, [dateFrom, dateTo, week, category, chartType, tablePage, tableSortBy, tableSortOrder, setSearchParams]);

  // Обработчики фильтров
  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setWeek('');
    setCategory('');
    setCategoryInput('');
    setTablePage(1);
    setTableSortBy('appointmentDate');
    setTableSortOrder('desc');
  };

  const handleWeekSelect = (selectedWeek: string) => {
    if (selectedWeek === '') {
      setWeek('');
      setDateFrom('');
      setDateTo('');
      return;
    }

    if (selectedWeek === 'current') {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      setWeek(format(weekStart, 'yyyy-MM-dd'));
      setDateFrom('');
      setDateTo('');
    } else {
      setWeek(selectedWeek);
      setDateFrom('');
      setDateTo('');
    }
  };

  const getChartTitle = () => {
    const titles = {
      daily: 'График по дням (последние 30 дней)',
      weekly: 'График по неделям (последние 12 недель)',
      monthly: 'График по месяцам (последние 12 месяцев)',
      byCategory: 'Распределение по категориям',
      byStatus: 'Распределение по статусам',
    };
    return titles[chartType];
  };

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-100">Аналитика</h1>
            <p className="text-sm text-text-10 mt-1">
              Статистика и аналитика ваших пациентов и приёмов
            </p>
          </div>
          <Button onClick={handleResetFilters} variant="outline">
            Сбросить фильтры
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-bg-white border border-stroke rounded-lg p-5">
          <h3 className="text-lg font-medium text-text-50 mb-4">Фильтры</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Дата от */}
            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">Дата от</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setWeek(''); // Очищаем неделю при выборе даты
                }}
                className="w-full"
              />
            </div>

            {/* Дата до */}
            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">Дата до</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setWeek(''); // Очищаем неделю при выборе даты
                }}
                className="w-full"
              />
            </div>

            {/* Неделя */}
            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">Неделя</label>
              <select
                value={week}
                onChange={(e) => handleWeekSelect(e.target.value)}
                className="w-full px-4 py-2 border border-stroke rounded-lg bg-bg-white text-text-100 text-sm focus:outline-none focus:border-main-100"
              >
                <option value="">Выберите неделю</option>
                <option value="current">Текущая неделя</option>
              </select>
            </div>

            {/* Категория */}
            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">Категория</label>
              <Input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="Введите категорию..."
                className="w-full"
              />
            </div>

            {/* Тип графика */}
            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">Тип графика</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="w-full px-4 py-2 border border-stroke rounded-lg bg-bg-white text-text-100 text-sm focus:outline-none focus:border-main-100"
              >
                <option value="daily">По дням</option>
                <option value="weekly">По неделям</option>
                <option value="monthly">По месяцам</option>
                <option value="byCategory">По категориям</option>
                <option value="byStatus">По статусам</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <MetricsCards summary={summary} isLoading={summaryLoading} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Основной график */}
          {chartType === 'byStatus' ? (
            <AnalyticsPieChart
              data={chartData}
              title={getChartTitle()}
              isLoading={chartLoading}
            />
          ) : chartType === 'byCategory' ? (
            <AnalyticsBarChart
              data={chartData}
              title={getChartTitle()}
              isLoading={chartLoading}
            />
          ) : (
            <AnalyticsLineChart
              data={chartData}
              title={getChartTitle()}
              isLoading={chartLoading}
            />
          )}

          {/* Дополнительная статистика - Pie Chart по статусам */}
          {chartType !== 'byStatus' && (
            <div>
              <AnalyticsPieChart
                data={statusChartData}
                title="Распределение по статусам"
                isLoading={statusChartLoading}
              />
            </div>
          )}
        </div>

        {/* Table */}
        <AnalyticsTable
          data={tableData?.appointments}
          meta={tableData?.meta}
          isLoading={tableLoading}
          onPageChange={(page) => setTablePage(page)}
          onSort={(sortBy, sortOrder) => {
            setTableSortBy(sortBy);
            setTableSortOrder(sortOrder);
            setTablePage(1);
          }}
        />
      </div>
    </NewDashboardLayout>
  );
};

