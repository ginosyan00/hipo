import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card } from '../common';
import { ChartData } from '../../services/analytics.service';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsLineChartProps {
  data: ChartData | undefined;
  title?: string;
  isLoading?: boolean;
}

/**
 * AnalyticsLineChart Component
 * Линейный график для аналитики
 */
export const AnalyticsLineChart: React.FC<AnalyticsLineChartProps> = ({
  data,
  title = 'График назначений',
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
        position: 'top' as const,
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
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#F1F1F1',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12,
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    },
  };

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      fill: true,
      backgroundColor: Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[0]
        : dataset.backgroundColor || 'rgba(58, 111, 248, 0.1)',
      borderColor: dataset.borderColor || '#3A6FF8',
    })),
  };

  return (
    <Card padding="none" className="p-5">
      <h3 className="text-lg font-medium text-text-50 mb-6">{title}</h3>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </Card>
  );
};

