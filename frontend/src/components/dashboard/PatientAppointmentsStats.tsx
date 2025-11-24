import React, { useMemo } from 'react';
import { Card } from '../common';
import { Appointment } from '../../types/api.types';
import { Calendar, Clock, CheckCircle2, AlertCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react';

interface PatientAppointmentsStatsProps {
  appointments: Appointment[];
  isLoading?: boolean;
}

/**
 * PatientAppointmentsStats Component
 * Գեղեցիկ վիճակագրություն պացիենտի գրանցումների համար
 */
export const PatientAppointmentsStats: React.FC<PatientAppointmentsStatsProps> = ({
  appointments,
  isLoading = false,
}) => {
  const stats = useMemo(() => {
    // Debug: Проверяем appointments
    console.log('🔵 [PatientAppointmentsStats] Appointments:', appointments);
    console.log('🔵 [PatientAppointmentsStats] Completed appointments:', appointments.filter((apt) => apt.status === 'completed'));
    console.log('🔵 [PatientAppointmentsStats] Appointments with amount:', appointments.filter((apt) => apt.amount && apt.amount > 0));
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Предстоящие записи
    const upcoming = appointments.filter(
      (apt) => new Date(apt.appointmentDate) >= now && apt.status !== 'cancelled'
    );

    // Записи по статусам
    const confirmed = appointments.filter((apt) => apt.status === 'confirmed');
    const pending = appointments.filter((apt) => apt.status === 'pending');
    const completed = appointments.filter((apt) => apt.status === 'completed');
    const cancelled = appointments.filter((apt) => apt.status === 'cancelled');

    // Записи по периодам
    const todayAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= today && aptDate < tomorrow && apt.status !== 'cancelled';
    });

    const tomorrowAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= tomorrow && aptDate < nextWeek && apt.status !== 'cancelled';
    });

    const weekAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= today && aptDate < nextWeek && apt.status !== 'cancelled';
    });

    // Завершенные за последний месяц
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const recentCompleted = completed.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= monthAgo;
    });

    // Всего визитов
    const totalVisits = completed.length;

    // Общая сумма потраченных средств (только для completed appointments с amount)
    const totalSpent = completed.reduce((sum, apt) => {
      return sum + (apt.amount || 0);
    }, 0);

    // Текущий месяц - начало и конец
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Сумма потраченная в текущем месяце
    const currentMonthSpent = completed.reduce((sum, apt) => {
      const aptDate = new Date(apt.appointmentDate);
      if (aptDate >= currentMonthStart && aptDate <= currentMonthEnd && apt.amount) {
        return sum + apt.amount;
      }
      return sum;
    }, 0);

    // Группировка по месяцам для breakdown
    const monthlySpending = completed.reduce((acc, apt) => {
      if (!apt.amount) return acc;
      const aptDate = new Date(apt.appointmentDate);
      const monthKey = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = aptDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          monthKey,
          amount: 0,
          count: 0,
        };
      }
      acc[monthKey].amount += apt.amount;
      acc[monthKey].count += 1;
      return acc;
    }, {} as Record<string, { month: string; monthKey: string; amount: number; count: number }>);

    // Сортируем месяцы по убыванию (новые сначала)
    const monthlyBreakdown = Object.values(monthlySpending)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .slice(0, 6); // Последние 6 месяцев

    return {
      upcoming: upcoming.length,
      confirmed: confirmed.length,
      pending: pending.length,
      completed: totalVisits,
      cancelled: cancelled.length,
      today: todayAppointments.length,
      tomorrow: tomorrowAppointments.length,
      week: weekAppointments.length,
      recentCompleted: recentCompleted.length,
      totalSpent,
      currentMonthSpent,
      monthlyBreakdown,
    };
  }, [appointments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'AMD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} padding="lg" className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Предстоящие',
      value: stats.upcoming,
      subtitle: 'активных записей',
      icon: Calendar,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Подтверждено',
      value: stats.confirmed,
      subtitle: 'готовы к приему',
      icon: CheckCircle2,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
    },
    {
      title: 'Ожидает',
      value: stats.pending,
      subtitle: 'требуют подтверждения',
      icon: AlertCircle,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      bgGradient: 'from-yellow-50 to-yellow-100',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Всего визитов',
      value: stats.completed,
      subtitle: 'завершенных приемов',
      icon: TrendingUp,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
    },
  ];

  // Карточка с общей суммой потраченных средств
  const totalSpentCard = {
    title: 'Всего потрачено',
    value: formatCurrency(stats.totalSpent),
    subtitle: stats.totalSpent > 0 ? 'за все время' : 'нет данных о платежах',
    icon: DollarSign,
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100',
    borderColor: 'border-emerald-200',
  };

  // Карточка с суммой потраченной в текущем месяце
  const currentMonthSpentCard = {
    title: 'Потрачено в этом месяце',
    value: formatCurrency(stats.currentMonthSpent),
    subtitle: stats.currentMonthSpent > 0 
      ? new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
      : 'нет платежей в этом месяце',
    icon: Calendar,
    color: 'indigo',
    gradient: 'from-indigo-500 to-indigo-600',
    bgGradient: 'from-indigo-50 to-indigo-100',
    borderColor: 'border-indigo-200',
  };

  const periodCards = [
    {
      title: 'Сегодня',
      value: stats.today,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Завтра',
      value: stats.tomorrow,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'На неделе',
      value: stats.week,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'За месяц',
      value: stats.recentCompleted,
      icon: CheckCircle2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Основные статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              padding="lg"
              className={`bg-gradient-to-br ${stat.bgGradient} border-2 ${stat.borderColor} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700 mb-2">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-xs text-gray-600">{stat.subtitle}</p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Карточки с суммами потраченных средств */}
      {stats.completed.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Общая сумма */}
          <Card
            padding="lg"
            className={`bg-gradient-to-br ${totalSpentCard.bgGradient} border-2 ${totalSpentCard.borderColor} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4`}
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700 mb-2">{totalSpentCard.title}</p>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.totalSpent > 0 ? totalSpentCard.value : '0 ֏'}
                </h3>
                <p className="text-xs text-gray-600">
                  {stats.totalSpent > 0 
                    ? totalSpentCard.subtitle 
                    : `${stats.completed.length} ${stats.completed.length === 1 ? 'прием' : stats.completed.length < 5 ? 'приема' : 'приемов'} без данных о платежах`}
                </p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${totalSpentCard.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          {/* Текущий месяц */}
          <Card
            padding="lg"
            className={`bg-gradient-to-br ${currentMonthSpentCard.bgGradient} border-2 ${currentMonthSpentCard.borderColor} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4`}
            style={{ animationDelay: '500ms' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700 mb-2">{currentMonthSpentCard.title}</p>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.currentMonthSpent > 0 ? currentMonthSpentCard.value : '0 ֏'}
                </h3>
                <p className="text-xs text-gray-600">{currentMonthSpentCard.subtitle}</p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${currentMonthSpentCard.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <Calendar className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card padding="lg" className="border border-stroke bg-gray-50">
          <div className="text-center py-4">
            <p className="text-sm text-text-10">Нет завершенных приемов для отображения финансовой информации</p>
          </div>
        </Card>
      )}

      {/* Месячный breakdown */}
      {stats.monthlyBreakdown.length > 0 && (
        <Card padding="lg" className="border border-stroke">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-50">Расходы по месяцам</h3>
            <p className="text-xs text-text-10">Последние 6 месяцев</p>
          </div>
          <div className="space-y-3">
            {stats.monthlyBreakdown.map((month, index) => (
              <div
                key={month.monthKey}
                className="flex items-center justify-between p-4 border border-stroke rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200 animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${(index + 6) * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-50 capitalize">{month.month}</p>
                    <p className="text-xs text-text-10">{month.count} {month.count === 1 ? 'прием' : month.count < 5 ? 'приема' : 'приемов'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-600">{formatCurrency(month.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Карточки по периодам */}
      <Card padding="lg" className="border border-stroke">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-50">Распределение по времени</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {periodCards.map((period, index) => {
            const Icon = period.icon;
            return (
              <div
                key={period.title}
                className="p-4 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-10 transition-all duration-200 animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${(index + 4) * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 ${period.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${period.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-10">{period.title}</p>
                    <p className={`text-2xl font-bold ${period.color}`}>{period.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Статусы записей */}
      {stats.cancelled > 0 && (
        <Card padding="lg" className="border border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-900">Отмененных записей: {stats.cancelled}</p>
              <p className="text-xs text-red-700">Проверьте историю отмененных приемов</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

