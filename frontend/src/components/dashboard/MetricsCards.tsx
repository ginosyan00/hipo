import React from 'react';
import { Card } from '../common';
import { AnalyticsSummary } from '../../services/analytics.service';

// Import icons
import patientIcon from '../../assets/icons/patient.svg';
import walletIcon from '../../assets/icons/wallet.svg';

/**
 * MetricsCards Component
 * Карточки ключевых метрик клиники
 */
interface MetricsCardsProps {
  summary: AnalyticsSummary | undefined;
  isLoading?: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ summary, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="none" className="p-5">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-stroke rounded-sm animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-stroke rounded animate-pulse w-24"></div>
                <div className="h-8 bg-stroke rounded animate-pulse w-32"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'AMD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const metrics = [
    {
      id: 'patients',
      label: 'Всего пациентов',
      value: summary.totalPatients.toLocaleString('ru-RU'),
      icon: patientIcon,
      bgColor: 'bg-secondary-10',
      iconColor: 'secondary',
    },
    {
      id: 'doctors',
      label: 'Всего врачей',
      value: summary.totalDoctors.toLocaleString('ru-RU'),
      icon: patientIcon,
      bgColor: 'bg-main-10',
      iconColor: 'main',
    },
    {
      id: 'completed',
      label: 'Завершенных услуг',
      value: summary.totalCompletedServices.toLocaleString('ru-RU'),
      icon: walletIcon,
      bgColor: 'bg-green-100',
      iconColor: 'green',
    },
    {
      id: 'revenue',
      label: 'Общий доход',
      value: formatCurrency(summary.totalRevenue),
      icon: walletIcon,
      bgColor: 'bg-main-10',
      iconColor: 'main',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.id} padding="none" className="p-5 hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className={`w-10 h-10 ${metric.bgColor} rounded-sm flex items-center justify-center`}>
              <img src={metric.icon} alt={metric.label} className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-normal text-text-10 mb-1">{metric.label}</p>
              <p className="text-2xl font-medium text-text-100">{metric.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

