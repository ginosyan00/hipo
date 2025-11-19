import React from 'react';
import { Card } from '../common';
import { AnalyticsTableItem } from '../../services/analytics.service';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AnalyticsTableProps {
  data: AnalyticsTableItem[] | undefined;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

/**
 * AnalyticsTable Component
 * Табличное представление аналитики
 */
export const AnalyticsTable: React.FC<AnalyticsTableProps> = ({
  data,
  meta,
  isLoading = false,
  onPageChange,
  onSort,
}) => {
  const [sortBy, setSortBy] = React.useState<string>('appointmentDate');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    if (onSort) {
      onSort(column, newOrder);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Ожидает', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Подтверждено', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Завершено', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Отменено', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'AMD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card padding="none" className="p-5">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-stroke rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card padding="none" className="p-5">
        <h3 className="text-lg font-medium text-text-50 mb-6">Детальная статистика</h3>
        <div className="text-center py-12">
          <p className="text-text-10">Нет данных для отображения</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none" className="p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-text-50">Детальная статистика</h3>
        {meta && (
          <p className="text-sm text-text-10">
            Показано {data.length} из {meta.total}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stroke">
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort('appointmentDate')}
                  className="text-sm font-normal text-text-10 hover:text-text-50 flex items-center gap-2"
                >
                  Дата и время
                  {sortBy === 'appointmentDate' && (
                    <span className="text-main-100">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort('doctor.name')}
                  className="text-sm font-normal text-text-10 hover:text-text-50 flex items-center gap-2"
                >
                  Врач
                  {sortBy === 'doctor.name' && (
                    <span className="text-main-100">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-4">
                <span className="text-sm font-normal text-text-10">Пациент</span>
              </th>
              <th className="text-left py-3 px-4">
                <span className="text-sm font-normal text-text-10">Статус</span>
              </th>
              <th className="text-left py-3 px-4">
                <span className="text-sm font-normal text-text-10">Категория</span>
              </th>
              <th className="text-right py-3 px-4">
                <button
                  onClick={() => handleSort('amount')}
                  className="text-sm font-normal text-text-10 hover:text-text-50 flex items-center gap-2 ml-auto"
                >
                  Сумма
                  {sortBy === 'amount' && (
                    <span className="text-main-100">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-stroke hover:bg-bg-primary transition-colors">
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-text-100">{formatDate(item.appointmentDate)}</div>
                  <div className="text-xs text-text-10">{item.duration} мин</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-text-100">{item.doctor.name}</div>
                  {item.doctor.specialization && (
                    <div className="text-xs text-text-10">{item.doctor.specialization}</div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-text-100">{item.patient.name}</div>
                  <div className="text-xs text-text-10">{item.patient.phone}</div>
                </td>
                <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                <td className="py-3 px-4">
                  <span className="text-sm text-text-50">{item.reason || '-'}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-medium text-text-100">
                    {formatCurrency(item.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-stroke">
          <div className="text-sm text-text-10">
            Страница {meta.page} из {meta.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              className="px-4 py-2 text-sm font-medium text-text-50 bg-bg-white border border-stroke rounded-lg hover:bg-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Назад
            </button>
            <button
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              className="px-4 py-2 text-sm font-medium text-text-50 bg-bg-white border border-stroke rounded-lg hover:bg-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Вперед
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

