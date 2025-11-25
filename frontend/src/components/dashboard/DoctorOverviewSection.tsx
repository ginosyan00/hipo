import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner } from '../common';
import { useAppointments } from '../../hooks/useAppointments';
import { usePatients } from '../../hooks/usePatients';
import { Appointment, Patient } from '../../types/api.types';
import { useAuthStore } from '../../store/useAuthStore';

// Import icons
import calendarIcon from '../../assets/icons/calendar.svg';
import patientIcon from '../../assets/icons/patient.svg';
import notificationIcon from '../../assets/icons/notification.svg';

/**
 * DoctorOverviewSection Component
 * Обзорная секция для Dashboard врача
 * Показывает статистику и данные из всех разделов, отфильтрованные по текущему врачу
 */
export const DoctorOverviewSection: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const doctorId = user?.id;

  const [expandedSections, setExpandedSections] = useState({
    todaySchedule: true,
    upcomingAppointments: false,
    myPatients: false,
  });

  // Загружаем данные с фильтром по врачу
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useAppointments({
    doctorId: doctorId,
    limit: 50, // Больше данных для статистики
  });

  const { data: patientsData, isLoading: isLoadingPatients } = usePatients({
    limit: 100, // Больше данных, чтобы найти всех пациентов врача
  });

  // Вычисляем статистику
  const stats = useMemo(() => {
    const appointments = appointmentsData?.appointments || [];
    const allPatients = patientsData?.patients || [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Предстоящие записи (сегодня и на неделю вперед)
    const upcomingAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return (
        aptDate >= today &&
        aptDate < nextWeek &&
        (apt.status === 'pending' || apt.status === 'confirmed')
      );
    });

    // Записи на сегодня
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
      return (
        aptDateOnly.getTime() === today.getTime() &&
        (apt.status === 'pending' || apt.status === 'confirmed')
      );
    });

    // Завершенные приёмы (за сегодня)
    const completedToday = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
      return (
        aptDateOnly.getTime() === today.getTime() &&
        apt.status === 'completed'
      );
    });

    // Уникальные пациенты врача (из appointments)
    const doctorPatientIds = new Set(
      appointments.map(apt => apt.patientId).filter(Boolean)
    );
    const doctorPatients = allPatients.filter(patient => 
      doctorPatientIds.has(patient.id)
    );

    // Пациенты, которые были сегодня
    const todayPatientIds = new Set(
      todayAppointments.map(apt => apt.patientId).filter(Boolean)
    );
    const patientsToday = doctorPatients.filter(patient => 
      todayPatientIds.has(patient.id)
    );

    // Записи, требующие подтверждения
    const pendingAppointments = appointments.filter(
      apt => apt.status === 'pending'
    );

    return {
      patientsToday: patientsToday.length,
      upcomingAppointments: upcomingAppointments.length,
      completedToday: completedToday.length,
      pendingAppointments: pendingAppointments.length,
      upcomingList: upcomingAppointments.slice(0, 5),
      todaySchedule: todayAppointments.slice(0, 10),
      recentPatients: doctorPatients.slice(0, 5),
    };
  }, [appointmentsData, patientsData]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
      {/* Статистика - 4 карточки */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Пациенты сегодня */}
        <Card padding="md" className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-text-10 mb-2">Пациентов сегодня</p>
              <p className="text-2xl font-semibold text-text-100">
                {isLoadingAppointments ? (
                  <Spinner size="sm" />
                ) : (
                  stats.patientsToday
                )}
              </p>
              <p className="text-xs text-text-10 mt-1">за сегодня</p>
            </div>
            <div className="w-12 h-12 bg-main-10 rounded-lg flex items-center justify-center">
              <img src={patientIcon} alt="Patients" className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Предстоящие записи */}
        <Card padding="md" className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-text-10 mb-2">Предстоящих записей</p>
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

        {/* Завершено приемов */}
        <Card padding="md" className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-text-10 mb-2">Завершено приемов</p>
              <p className="text-2xl font-semibold text-text-100">
                {isLoadingAppointments ? (
                  <Spinner size="sm" />
                ) : (
                  stats.completedToday
                )}
              </p>
              <p className="text-xs text-text-10 mt-1">за сегодня</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="text-2xl">✅</div>
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

      {/* Расписание на сегодня */}
      <Card padding="lg">
        <div
          className="flex items-center justify-between cursor-pointer mb-4"
          onClick={() => toggleSection('appointments')}
        >
          <div>
            <h3 className="text-lg font-semibold text-text-50">
              Расписание на сегодня
            </h3>
            <p className="text-xs text-text-10 mt-1">
              Запланированные приемы на сегодня
            </p>
          </div>
          <button className="text-text-10 hover:text-text-50 transition-colors">
            {expandedSections.appointments ? '▼' : '▶'}
          </button>
        </div>

        {expandedSections.todaySchedule && (
          <div className="mt-4 space-y-3">
            {isLoadingAppointments ? (
              <div className="text-center py-8">
                <Spinner />
                <p className="text-sm text-text-10 mt-2">Загрузка расписания...</p>
              </div>
            ) : stats.todaySchedule.length === 0 ? (
              <div className="text-center py-8 text-text-10">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-sm">Нет запланированных приемов на сегодня</p>
              </div>
            ) : (
              <>
                {stats.todaySchedule.map((appointment: Appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-10 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-main-10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-main-100">
                          {appointment.patient?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-50 truncate">
                          {appointment.patient?.name || 'Неизвестный пациент'}
                        </p>
                        <p className="text-xs text-text-10">
                          {formatTime(appointment.appointmentDate)} • {appointment.reason || 'Без указания причины'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        appointment.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {appointment.status === 'confirmed' ? 'Подтверждено' : 'Ожидает'}
                    </span>
                  </div>
                ))}
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/dashboard/appointments')}
                    className="w-full"
                  >
                    Показать все записи →
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Предстоящие записи - Expandable блок */}
      <Card padding="lg">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('upcomingAppointments')}
        >
          <div>
            <h3 className="text-lg font-semibold text-text-50">
              Предстоящие записи
            </h3>
            <p className="text-xs text-text-10 mt-1">
              Ближайшие записи на приём
            </p>
          </div>
          <button className="text-text-10 hover:text-text-50 transition-colors">
            {expandedSections.upcomingAppointments ? '▼' : '▶'}
          </button>
        </div>

        {expandedSections.upcomingAppointments && (
          <div className="mt-4 space-y-3">
            {isLoadingAppointments ? (
              <div className="text-center py-8">
                <Spinner />
                <p className="text-sm text-text-10 mt-2">Загрузка записей...</p>
              </div>
            ) : stats.upcomingList.length === 0 ? (
              <div className="text-center py-8 text-text-10">
                <p className="text-sm">Нет предстоящих записей</p>
              </div>
            ) : (
              <>
                {stats.upcomingList.map((appointment: Appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-10 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-main-10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-main-100">
                          {appointment.patient?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-50 truncate">
                          {appointment.patient?.name || 'Неизвестный пациент'}
                        </p>
                        <p className="text-xs text-text-10">
                          {formatDate(appointment.appointmentDate)} • {appointment.reason || 'Без указания причины'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        appointment.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {appointment.status === 'confirmed' ? 'Подтверждено' : 'Ожидает'}
                    </span>
                  </div>
                ))}
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/dashboard/appointments')}
                    className="w-full"
                  >
                    Показать все записи →
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Мои пациенты - Expandable блок */}
      <Card padding="lg">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('myPatients')}
        >
          <div>
            <h3 className="text-lg font-semibold text-text-50">
              Мои пациенты
            </h3>
            <p className="text-xs text-text-10 mt-1">
              Пациенты, которые были у вас на приёме
            </p>
          </div>
          <button className="text-text-10 hover:text-text-50 transition-colors">
            {expandedSections.myPatients ? '▼' : '▶'}
          </button>
        </div>

        {expandedSections.myPatients && (
          <div className="mt-4 space-y-3">
            {isLoadingPatients || isLoadingAppointments ? (
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

