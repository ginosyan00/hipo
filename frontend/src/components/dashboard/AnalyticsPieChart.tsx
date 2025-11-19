import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Card } from '../common';
import { ChartData } from '../../services/analytics.service';

// Регистрируем компоненты Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface AnalyticsPieChartProps {
  data: ChartData | undefined;
  title?: string;
  isLoading?: boolean;
}

/**
 * AnalyticsPieChart Component
 * Круговая диаграмма для аналитики
 */
export const AnalyticsPieChart: React.FC<AnalyticsPieChartProps> = ({
  data,
  title = 'Распределение по статусам',
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card padding="none" className="p-5">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-text-10">Загрузка графика...</div>
        </div>
      </Card>
    );
  }

  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <Card padding="none" className="p-5">
        <h3 className="text-lg font-medium text-text-50 mb-6">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-text-10">Нет данных для отображения</p>
        </div>
      </Card>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          color: '#6B7280',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        borderColor: '#3A6FF8',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    },
  };

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor
        : dataset.backgroundColor || [
            'rgba(58, 111, 248, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
    })),
  };

  return (
    <Card padding="none" className="p-5">
      <h3 className="text-lg font-medium text-text-50 mb-6">{title}</h3>
      <div style={{ height: '300px' }}>
        <Pie data={chartData} options={chartOptions} />
      </div>
    </Card>
  );
};

