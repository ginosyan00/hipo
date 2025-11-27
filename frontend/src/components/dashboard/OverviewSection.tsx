import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner } from '../common';
import { useAppointments } from '../../hooks/useAppointments';
import { usePatients } from '../../hooks/usePatients';
import { Patient } from '../../types/api.types';

// Import icons
import calendarIcon from '../../assets/icons/calendar.svg';
import patientIcon from '../../assets/icons/patient.svg';
import notificationIcon from '../../assets/icons/notification.svg';

/**
 * OverviewSection Component
 * Обзорная секция для Dashboard (только для CLINIC роли)
 * Показывает статистику и данные из всех разделов
 */
export const OverviewSection: React.FC = () => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    patients: false,
  });

  // Загружаем данные
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useAppointments({
    limit: 50, // Больше данных для статистики
  });

  const { data: patientsData, isLoading: isLoadingPatients } = usePatients({
    limit: 20,
  });

  // Вычисляем статистику
  const stats = useMemo(() => {
    const appointments = appointmentsData?.appointments || [];
    const patients = patientsData?.patients || [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Предстоящие записи (сегодня и завтра)
    const upcomingAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return (
        aptDate >= today &&
        aptDate < nextWeek &&
        (apt.status === 'pending' || apt.status === 'confirmed')
      );
    });

    // Новые пациенты (за последнюю неделю)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newPatients = patients.filter(patient => {
      const created = new Date(patient.createdAt);
      return created >= weekAgo;
    });

    // Записи, требующие подтверждения
    const pendingAppointments = appointments.filter(
      apt => apt.status === 'pending'
    );

    return {
      upcomingAppointments: upcomingAppointments.length,
      newPatients: newPatients.length,
      pendingAppointments: pendingAppointments.length,
      recentPatients: patients.slice(0, 5),
    };
  }, [appointmentsData, patientsData]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatPatientDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Заголовок секции */}
      <div>
        <h2 className="text-xl font-semibold text-text-50">Обзор</h2>
        <p className="text-sm text-text-10 mt-1">
          Краткая информация из всех разделов клиники
        </p>
      </div>

      {/* Статистика - 3 карточки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Предстоящие записи */}
        <Card padding="md" className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-text-10 mb-2">Предстоящие записи</p>
              <p className="text-2xl font-semibold text-text-100">
                {isLoadingAppointments ? (
                  <Spinner size="sm" />
                ) : (
                  stats.upcomingAppointments
                )}
              </p>
              <p className="text-xs text-text-10 mt-1">на ближайшие 7 дней</p>
            </div>
            <div className="w-12 h-12 bg-main-10 rounded-lg flex items-center justify-center">
              <img src={calendarIcon} alt="Calendar" className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Новые пациенты */}
        <Card padding="md" className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-text-10 mb-2">Новые пациенты</p>
              <p className="text-2xl font-semibold text-text-100">
                {isLoadingPatients ? (
                  <Spinner size="sm" />
                ) : (
                  stats.newPatients
                )}
              </p>
              <p className="text-xs text-text-10 mt-1">за последнюю неделю</p>
            </div>
            <div className="w-12 h-12 bg-secondary-10 rounded-lg flex items-center justify-center">
              <img src={patientIcon} alt="Patients" className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Требуют подтверждения */}
        <Card padding="md" className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-text-10 mb-2">Требуют подтверждения</p>
              <p className="text-2xl font-semibold text-text-100">
                {isLoadingAppointments ? (
                  <Spinner size="sm" />
                ) : (
                  stats.pendingAppointments
                )}
              </p>
              <p className="text-xs text-text-10 mt-1">ожидают действия</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <img src={notificationIcon} alt="Notifications" className="w-6 h-6" />
            </div>
          </div>
        </Card>

      </div>

      {/* Недавние пациенты - Expandable блок */}
      <Card padding="lg">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('patients')}
        >
          <div>
            <h3 className="text-lg font-semibold text-text-50">
              Недавние пациенты
            </h3>
            <p className="text-xs text-text-10 mt-1">
              Последние добавленные пациенты
            </p>
          </div>
          <button className="text-text-10 hover:text-text-50 transition-colors">
            {expandedSections.patients ? '▼' : '▶'}
          </button>
        </div>

        {expandedSections.patients && (
          <div className="mt-4 space-y-3">
            {isLoadingPatients ? (
              <div className="text-center py-8">
                <Spinner />
                <p className="text-sm text-text-10 mt-2">Загрузка пациентов...</p>
              </div>
            ) : stats.recentPatients.length === 0 ? (
              <div className="text-center py-8 text-text-10">
                <p className="text-sm">Нет пациентов</p>
              </div>
            ) : (
              <>
                {stats.recentPatients.map((patient: Patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-10 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-secondary-10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-secondary-100">
                          {patient.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-50 truncate">
                          {patient.name}
                        </p>
                        <p className="text-xs text-text-10">
                          {patient.phone} • {formatPatientDate(patient.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/dashboard/patients')}
                    className="w-full"
                  >
                    Показать всех пациентов →
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

