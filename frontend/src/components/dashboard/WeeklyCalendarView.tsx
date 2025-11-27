import React, { useMemo, useState, useEffect } from 'react';
import { Appointment } from '../../types/api.types';
import { formatAppointmentTime } from '../../utils/dateFormat';

interface WeeklyCalendarViewProps {
  appointments: Appointment[];
  onSelectAppointment?: (appointment: Appointment) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  currentDate?: Date;
  onNavigate?: (date: Date) => void;
  onViewChange?: (view: 'table' | 'monthly' | 'weekly') => void;
  currentView?: 'table' | 'monthly' | 'weekly';
  isClinicAdmin?: boolean;
}

/**
 * WeeklyCalendarView Component
 * Недельный календарный вид в стиле Kanban с колонками по дням недели
 * Каждая колонка представляет день недели, карточки приёмов отображаются внутри колонок
 */
export const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  appointments,
  onSelectAppointment,
  onSelectSlot,
  currentDate = new Date(),
  onNavigate,
  onViewChange,
  currentView = 'weekly',
  isClinicAdmin = false,
}) => {
  const getWeekStartDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник = 1
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStartDate(currentDate));

  // Синхронизируем weekStart с currentDate при его изменении
  useEffect(() => {
    const newWeekStart = getWeekStartDate(currentDate);
    setWeekStart(prev => {
      if (prev.getTime() !== newWeekStart.getTime()) {
        return newWeekStart;
      }
      return prev;
    });
  }, [currentDate]);

  // Генерируем массив дней недели
  const weekDays = useMemo(() => {
    const days = [];
    const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push({
        date,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
      });
    }
    return days;
  }, [weekStart]);

  // Группируем приёмы по дням недели
  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    
    // Инициализируем все дни пустыми массивами
    weekDays.forEach(day => {
      const key = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
      grouped[key] = [];
    });

    // Распределяем приёмы по дням
    appointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const key = `${appointmentDate.getFullYear()}-${appointmentDate.getMonth()}-${appointmentDate.getDate()}`;
      
      if (grouped[key]) {
        grouped[key].push(appointment);
      }
    });

    // Сортируем приёмы по времени в каждом дне
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateA.getTime() - dateB.getTime();
      });
    });

    return grouped;
  }, [appointments, weekDays]);

  // Получаем ключ для дня
  const getDayKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  // Навигация по неделям
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newWeekStart);
    if (onNavigate) {
      onNavigate(newWeekStart);
    }
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newWeekStart);
    if (onNavigate) {
      onNavigate(newWeekStart);
    }
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setWeekStart(monday);
    if (onNavigate) {
      onNavigate(monday);
    }
  };

  // Форматирование диапазона недели
  const getWeekRange = () => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const startDay = weekStart.getDate();
    const startMonth = months[weekStart.getMonth()];
    const endDay = weekEnd.getDate();
    const endMonth = months[weekEnd.getMonth()];
    const year = weekEnd.getFullYear();
    
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  };

  // Получение цвета заголовка колонки (как в изображении)
  const getColumnHeaderColor = (index: number) => {
    const colors = [
      'bg-blue-500',      // Понедельник - синий
      'bg-blue-400',      // Вторник - светло-синий
      'bg-green-500',    // Среда - зелёный
      'bg-yellow-500',   // Четверг - жёлтый
      'bg-orange-500',   // Пятница - оранжевый
      'bg-purple-500',   // Суббота - фиолетовый
      'bg-red-500',      // Воскресенье - красный
    ];
    return colors[index] || 'bg-gray-500';
  };

  // Получение стиля статуса приёма
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    const labels = {
      pending: 'Ожидает',
      confirmed: 'Подтвержден',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return {
      className: `px-2 py-0.5 border rounded text-xs font-normal ${styles[status as keyof typeof styles] || styles.pending}`,
      label: labels[status as keyof typeof labels] || status,
    };
  };

  // Обработчик клика по карточке
  const handleCardClick = (appointment: Appointment) => {
    if (onSelectAppointment) {
      onSelectAppointment(appointment);
    }
  };

  return (
    <div className="bg-bg-white rounded-sm border border-stroke">
      {/* Панель навигации */}
      <div className="flex items-center justify-between p-4 border-b border-stroke bg-bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousWeek}
            className="px-3 py-1.5 text-sm border border-stroke rounded-sm hover:bg-bg-primary transition-smooth text-text-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 text-sm border border-stroke rounded-sm hover:bg-bg-primary transition-smooth text-text-100"
          >
            Сегодня
          </button>
          <button
            type="button"
            onClick={goToNextWeek}
            className="px-3 py-1.5 text-sm border border-stroke rounded-sm hover:bg-bg-primary transition-smooth text-text-100"
          >
            ›
          </button>
          <span className="ml-4 text-base font-medium text-text-100">{getWeekRange()}</span>
        </div>
      </div>

      {/* Kanban доска с колонками по дням */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {weekDays.map((day, index) => {
            const dayKey = getDayKey(day.date);
            const dayAppointments = appointmentsByDay[dayKey] || [];
            const isToday = 
              day.date.getDate() === new Date().getDate() &&
              day.date.getMonth() === new Date().getMonth() &&
              day.date.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={dayKey}
                className="flex-shrink-0 w-64 flex flex-col"
              >
                {/* Заголовок колонки */}
                <div className={`${getColumnHeaderColor(index)} text-white px-4 py-3 rounded-t-sm`}>
                  <div className="font-semibold text-sm">
                    {day.dayName}
                  </div>
                  <div className="text-xs opacity-90 mt-1">
                    {day.dayNumber} {day.date.toLocaleDateString('ru-RU', { month: 'short' })}
                    {isToday && ' • Сегодня'}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    ({dayAppointments.length})
                  </div>
                </div>

                {/* Контент колонки */}
                <div 
                  className="flex-1 bg-bg-primary border-x border-b border-stroke rounded-b-sm p-3 min-h-[500px] max-h-[600px] overflow-y-auto"
                  onClick={(e) => {
                    // Если клик по пустому месту (не по карточке), открываем модальное окно создания
                    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('empty-slot')) {
                      if (onSelectSlot) {
                        const startOfDay = new Date(day.date);
                        startOfDay.setHours(9, 0, 0, 0);
                        const endOfDay = new Date(day.date);
                        endOfDay.setHours(17, 0, 0, 0);
                        onSelectSlot({ start: startOfDay, end: endOfDay });
                      }
                    }
                  }}
                >
                  {dayAppointments.length === 0 ? (
                    <div 
                      className="text-center text-text-10 text-sm py-8 empty-slot cursor-pointer hover:text-text-50 transition-colors"
                      onClick={(e) => {
                        if (onSelectSlot) {
                          const startOfDay = new Date(day.date);
                          startOfDay.setHours(9, 0, 0, 0);
                          const endOfDay = new Date(day.date);
                          endOfDay.setHours(17, 0, 0, 0);
                          onSelectSlot({ start: startOfDay, end: endOfDay });
                        }
                      }}
                    >
                      + Добавить приём
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayAppointments.map((appointment) => {
                        const statusBadge = getStatusBadge(appointment.status);
                        const appointmentTime = formatAppointmentTime(appointment.appointmentDate);

                        return (
                          <div
                            key={appointment.id}
                            onClick={() => handleCardClick(appointment)}
                            className="bg-white border border-stroke rounded-sm p-3 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            {/* Заголовок карточки */}
                            <div className="font-medium text-sm text-text-100 mb-2">
                              {appointment.patient?.name || 'Пациент'}
                            </div>

                            {/* Время и статус */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-text-50 font-medium">
                                {appointmentTime}
                              </span>
                              <span className={statusBadge.className}>
                                {statusBadge.label}
                              </span>
                            </div>

                            {/* Врач */}
                            {appointment.doctor && (
                              <div className="text-xs text-text-50 mb-1">
                                👨‍⚕️ {appointment.doctor.name}
                                {appointment.doctor.specialization && ` (${appointment.doctor.specialization})`}
                              </div>
                            )}

                            {/* Причина/Процедура */}
                            {appointment.reason && (
                              <div className="text-xs text-text-50 mt-2 pt-2 border-t border-stroke">
                                📋 {appointment.reason}
                              </div>
                            )}

                            {/* Дополнительная информация */}
                            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-stroke">
                              {appointment.patient?.phone && (
                                <div className="text-xs text-text-50 flex items-center gap-1">
                                  📞 0
                                </div>
                              )}
                              {appointment.patient?.email && (
                                <div className="text-xs text-text-50 flex items-center gap-1">
                                  ✉️ 0
                                </div>
                              )}
                              <div className="text-xs text-text-50 flex items-center gap-1">
                                💬 0
                              </div>
                            </div>
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
    </div>
  );
};

