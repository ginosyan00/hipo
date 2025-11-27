import React, { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card } from '../common';
import { Appointment } from '../../types/api.types';
import { formatAppointmentTime } from '../../utils/dateFormat';

interface AppointmentsWeeklyViewProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  onViewChange?: (viewType: 'list' | 'monthly' | 'weekly') => void;
  currentView?: 'list' | 'monthly' | 'weekly';
  className?: string;
}

/**
 * AppointmentsWeeklyView Component - Kanban Style
 * Недельный вид в стиле Kanban-доски
 * Показывает приёмы по дням недели в виде карточек
 */
export const AppointmentsWeeklyView: React.FC<AppointmentsWeeklyViewProps> = ({
  appointments,
  onAppointmentClick,
  onTimeSlotClick,
  onViewChange,
  currentView = 'weekly',
  className = '',
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Генерируем дни недели
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Понедельник
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Группируем приёмы по дням недели
  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    
    appointments.forEach(appointment => {
      const appointmentDate = parseISO(appointment.appointmentDate.toString());
      const dateKey = format(appointmentDate, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });
    
    // Сортируем приёмы по времени в каждом дне
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const dateA = parseISO(a.appointmentDate.toString());
        const dateB = parseISO(b.appointmentDate.toString());
        return dateA.getTime() - dateB.getTime();
      });
    });
    
    return grouped;
  }, [appointments]);

  // Получаем приёмы для конкретного дня
  const getAppointmentsForDay = (day: Date): Appointment[] => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return appointmentsByDay[dateKey] || [];
  };

  // Навигация по неделям
  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // Получаем цвет заголовка колонки для дня недели
  const getDayHeaderColor = (dayIndex: number, isToday: boolean): string => {
    if (isToday) {
      return 'bg-main-100 text-white';
    }
    
    // Разные цвета для разных дней (как на изображении)
    const colors = [
      'bg-blue-500 text-white',      // Понедельник
      'bg-blue-400 text-white',       // Вторник
      'bg-green-500 text-white',      // Среда
      'bg-yellow-500 text-white',     // Четверг
      'bg-orange-500 text-white',      // Пятница
      'bg-purple-500 text-white',      // Суббота
      'bg-pink-500 text-white',        // Воскресенье
    ];
    
    return colors[dayIndex] || 'bg-gray-500 text-white';
  };

  // Получаем цвет статуса для бейджа
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'confirmed':
        return 'bg-main-10 text-main-100 border-main-100/20';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  // Получаем текст статуса
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'confirmed':
        return 'Подтвержден';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Week Header - Навигация */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          {/* Левая часть - стрелки навигации */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-bg-primary rounded-sm transition-smooth text-text-50 hover:text-main-100"
              type="button"
              title="Предыдущая неделя"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-normal text-text-50 hover:text-main-100 hover:bg-bg-primary rounded-sm transition-smooth"
              type="button"
            >
              Сегодня
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-bg-primary rounded-sm transition-smooth text-text-50 hover:text-main-100"
              type="button"
              title="Следующая неделя"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Центральная часть - переключение видов */}
          {onViewChange && (
            <div className="flex items-center gap-2 border border-stroke rounded-sm overflow-hidden">
              <button
                onClick={() => onViewChange('list')}
                className={`px-5 py-2.5 text-base font-medium transition-smooth ${
                  currentView === 'list'
                    ? 'bg-main-100 text-white'
                    : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                }`}
                title="Таблица"
              >
                📊 Таблица
              </button>
              <button
                onClick={() => onViewChange('monthly')}
                className={`px-5 py-2.5 text-base font-medium transition-smooth ${
                  currentView === 'monthly'
                    ? 'bg-main-100 text-white'
                    : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                }`}
                title="Месячный календарь"
              >
                📅 Месяц
              </button>
              <button
                onClick={() => onViewChange('weekly')}
                className={`px-5 py-2.5 text-base font-medium transition-smooth ${
                  currentView === 'weekly'
                    ? 'bg-main-100 text-white'
                    : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                }`}
                title="Недельный вид"
              >
                📆 Неделя
              </button>
            </div>
          )}

          {/* Правая часть - период недели */}
          <div className="flex items-center">
            <h3 className="text-base font-semibold text-text-100">
              {format(weekStart, 'd MMM', { locale: ru })} - {format(weekEnd, 'd MMM yyyy', { locale: ru })}
            </h3>
          </div>
        </div>
      </Card>

      {/* Kanban Board - Колонки по дням недели */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, new Date());
            const dayAppointments = getAppointmentsForDay(day);
            const dayNameFull = format(day, 'EEEE', { locale: ru }); // Полное название дня
            const dayName = dayNameFull.charAt(0).toUpperCase() + dayNameFull.slice(1); // С заглавной буквы
            const dayDate = format(day, 'd MMM', { locale: ru }); // Дата
            const dayCount = dayAppointments.length;

            return (
              <div
                key={day.toISOString()}
                className={`flex-shrink-0 w-80 flex flex-col ${isToday ? 'ring-2 ring-main-100 ring-offset-2' : ''}`}
              >
                {/* Заголовок колонки */}
                <div className={`${getDayHeaderColor(dayIndex, isToday)} p-3 rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{dayName}</div>
                      <div className="text-xs opacity-90 mt-0.5">{dayDate}</div>
                    </div>
                    <div className="text-sm font-bold">({dayCount})</div>
                  </div>
                </div>

                {/* Тело колонки с карточками */}
                <div className="bg-bg-primary border-x border-b border-stroke rounded-b-lg p-3 min-h-[600px] max-h-[800px] overflow-y-auto">
                  {dayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-text-10 text-sm">
                      Нет приёмов
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayAppointments.map((appointment) => {
                        const appointmentDate = parseISO(appointment.appointmentDate.toString());
                        const appointmentTime = formatAppointmentTime(appointmentDate);

                        return (
                          <div
                            key={appointment.id}
                            className="bg-bg-white border border-stroke rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => onAppointmentClick?.(appointment)}
                          >
                            {/* Верхняя часть карточки */}
                            <div className="flex items-start justify-between mb-3">
                              {/* Заголовок карточки */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-semibold text-text-100 truncate mb-1">
                                  {appointment.patient?.name || 'Пациент'}
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-text-50">⏰ {appointmentTime}</span>
                                  {appointment.duration && (
                                    <span className="text-xs text-text-50">• {appointment.duration} мин</span>
                                  )}
                                </div>
                              </div>

                              {/* Счетчик уведомлений (пока 0) */}
                              <div className="flex-shrink-0 ml-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                                  0
                                </div>
                              </div>
                            </div>

                            {/* Статус бейдж */}
                            <div className="mb-3">
                              <span className={`inline-block px-2 py-1 rounded-sm text-xs font-normal border ${getStatusBadgeColor(appointment.status)}`}>
                                {getStatusLabel(appointment.status)}
                              </span>
                            </div>

                            {/* Информация о враче */}
                            {appointment.doctor?.name && (
                              <div className="mb-3 text-xs text-text-50">
                                <span className="font-medium">👨‍⚕️ Врач:</span> {appointment.doctor.name}
                                {appointment.doctor.specialization && (
                                  <span className="text-text-10"> ({appointment.doctor.specialization})</span>
                                )}
                              </div>
                            )}

                            {/* Причина визита */}
                            {appointment.reason && (
                              <div className="mb-3 text-xs">
                                <span className="text-text-10">Причина:</span>
                                <span className="text-text-50 ml-1">{appointment.reason}</span>
                              </div>
                            )}

                            {/* Иконки связи (телефон, email, чат) */}
                            <div className="flex items-center gap-3 mb-3 pt-2 border-t border-stroke">
                              {appointment.patient?.phone && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `tel:${appointment.patient?.phone}`;
                                  }}
                                  className="p-1.5 hover:bg-bg-primary rounded-sm transition-smooth text-text-50 hover:text-main-100"
                                  title={`Позвонить: ${appointment.patient.phone}`}
                                  type="button"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </button>
                              )}
                              {appointment.patient?.email && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `mailto:${appointment.patient?.email}`;
                                  }}
                                  className="p-1.5 hover:bg-bg-primary rounded-sm transition-smooth text-text-50 hover:text-main-100"
                                  title={`Написать: ${appointment.patient.email}`}
                                  type="button"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Открыть чат с пациентом
                                }}
                                className="p-1.5 hover:bg-bg-primary rounded-sm transition-smooth text-text-50 hover:text-main-100"
                                title="Открыть чат"
                                type="button"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </button>
                            </div>

                            {/* Кнопка "+ Activity" */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Открыть модальное окно для добавления активности
                              }}
                              className="w-full text-left text-xs text-text-50 hover:text-main-100 py-1.5 px-2 hover:bg-bg-primary rounded-sm transition-smooth"
                              type="button"
                            >
                              + Activity
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <Card padding="sm">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
            <span className="text-text-50">Ожидает</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-main-100"></div>
            <span className="text-text-50">Подтвержден</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
            <span className="text-text-50">Завершен</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-400"></div>
            <span className="text-text-50">Отменен</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

