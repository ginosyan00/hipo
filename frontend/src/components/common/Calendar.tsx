import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  minDate?: Date;
  disabledDates?: Date[];
  className?: string;
}

/**
 * Calendar Component - Figma Design Style
 * Календарь для выбора даты и времени в стиле медицинского дашборда
 * Поддерживает месячный и недельный вид
 */
export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  selectedTime,
  onTimeSelect,
  minDate = new Date(),
  disabledDates = [],
  className = '',
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>('month');

  // Генерируем массив дней месяца
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Понедельник
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Названия дней недели
  const weekDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Доступные временные слоты (каждые 30 минут с 9:00 до 18:00)
  const timeSlots = [];
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  // Проверка, можно ли выбрать дату
  const isDateDisabled = (date: Date): boolean => {
    // Сравниваем только дату (без времени)
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    
    if (dateOnly < minDateOnly) return true;
    if (disabledDates.some(d => isSameDay(d, date))) return true;
    return false;
  };

  // Проверка, выбрана ли дата
  const isDateSelected = (date: Date): boolean => {
    return selectedDate ? isSameDay(date, selectedDate) : false;
  };

  // Навигация по месяцам
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Навигация по неделям
  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setCurrentWeek(today);
  };

  // Генерируем дни недели для недельного вида
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Понедельник
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDaysDates = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className={`space-y-4 w-full overflow-x-hidden ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={viewType === 'month' ? goToPreviousMonth : goToPreviousWeek}
            className="p-2 hover:bg-main-10 rounded-sm transition-smooth text-text-50 hover:text-main-100"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-normal text-text-50 hover:text-main-100 hover:bg-main-10 rounded-sm transition-smooth"
            type="button"
          >
            Сегодня
          </button>
          <button
            onClick={viewType === 'month' ? goToNextMonth : goToNextWeek}
            className="p-2 hover:bg-main-10 rounded-sm transition-smooth text-text-50 hover:text-main-100"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <h3 className="text-lg font-medium text-text-100">
          {viewType === 'month' 
            ? format(currentMonth, 'MMMM yyyy', { locale: ru })
            : `${format(weekStart, 'd MMM', { locale: ru })} - ${format(weekEnd, 'd MMM yyyy', { locale: ru })}`
          }
        </h3>

        {/* Переключение вида */}
        <div className="flex border border-stroke rounded-sm overflow-hidden">
          <button
            onClick={() => setViewType('month')}
            className={`px-4 py-2 text-sm font-normal transition-smooth ${
              viewType === 'month'
                ? 'bg-main-100 text-white'
                : 'bg-bg-white text-text-50 hover:bg-bg-primary'
            }`}
            type="button"
            title="Месячный вид"
          >
            📅 Месяц
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-2 text-sm font-normal transition-smooth ${
              viewType === 'week'
                ? 'bg-main-100 text-white'
                : 'bg-bg-white text-text-50 hover:bg-bg-primary'
            }`}
            type="button"
            title="Недельный вид"
          >
            📆 Неделя
          </button>
        </div>
      </div>

      {/* Calendar Grid - Месячный вид */}
      {viewType === 'month' ? (
        <div className="border border-stroke rounded-sm overflow-hidden bg-bg-white">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 bg-bg-primary border-b border-stroke">
            {weekDayNames.map(day => (
              <div
                key={day}
                className="p-2 text-center text-xs font-medium text-text-50 border-r border-stroke last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDisabled = isDateDisabled(day);
              const isSelected = isDateSelected(day);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => !isDisabled && onDateSelect(day)}
                  disabled={isDisabled}
                  className={`
                    p-2 min-h-[40px] border-r border-b border-stroke
                    text-sm font-normal
                    transition-smooth
                    hover:bg-main-10
                    ${
                      !isCurrentMonth
                        ? 'text-text-10 bg-bg-primary'
                        : isDisabled
                        ? 'text-text-10 bg-bg-primary cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'bg-main-100 text-white font-medium'
                        : isToday
                        ? 'bg-main-10 text-main-100 font-medium'
                        : 'text-text-100 bg-bg-white'
                    }
                    ${index % 7 === 6 ? 'border-r-0' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Недельный вид - все дни на одной странице без scroll */
        <div className="border border-stroke rounded-sm overflow-hidden bg-bg-white w-full max-w-full">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 bg-bg-primary border-b border-stroke w-full">
            {weekDaysDates.map((day, index) => {
              const dayName = format(day, 'EEEE', { locale: ru });
              const dayNameShort = format(day, 'EEE', { locale: ru });
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={`p-1 text-center border-r border-stroke last:border-r-0 ${
                    isToday ? 'bg-main-100 text-white' : 'text-text-50'
                  }`}
                >
                  <div className="text-[9px] font-medium truncate">{dayNameShort}</div>
                  <div className={`text-[11px] font-semibold ${isToday ? 'text-white' : 'text-text-100'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week Days Grid - все дни недели на одной странице без горизонтального scroll */}
          <div className="grid grid-cols-7 w-full">
            {weekDaysDates.map((day, dayIndex) => {
              const isDisabled = isDateDisabled(day);
              const isSelected = isDateSelected(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-b border-stroke last:border-r-0 min-h-[180px] p-1 flex flex-col ${
                    isToday ? 'bg-main-10/20' : 'bg-bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => !isDisabled && onDateSelect(day)}
                    disabled={isDisabled}
                    className={`
                      w-full p-1 rounded-sm
                      text-[9px] font-normal
                      transition-smooth
                      mb-1
                      ${
                        isDisabled
                          ? 'text-text-10 bg-bg-primary cursor-not-allowed opacity-50'
                          : isSelected
                          ? 'bg-main-100 text-white font-medium'
                          : isToday
                          ? 'bg-main-10 text-main-100 font-medium border border-main-100'
                          : 'text-text-100 bg-bg-white border border-stroke hover:bg-main-10 hover:border-main-100'
                      }
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                  
                  {/* Временные слоты для каждого дня в недельном виде */}
                  {isSelected && (
                    <div className="mt-1 flex-1 overflow-y-auto min-h-0">
                      <label className="block text-[8px] font-normal text-text-10 mb-0.5">
                        Время
                      </label>
                      <div className="grid grid-cols-1 gap-0.5">
                        {timeSlots.map(time => {
                          const isTimeSelected = selectedTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => onTimeSelect(time)}
                              className={`
                                px-0.5 py-0.5 text-[8px] font-normal rounded
                                transition-smooth
                                ${
                                  isTimeSelected
                                    ? 'bg-main-100 text-white'
                                    : 'bg-bg-white text-text-100 border border-stroke hover:bg-main-10 hover:border-main-100'
                                }
                              `}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Slots - показываем только если выбрана дата и месячный вид */}
      {selectedDate && viewType === 'month' && (
        <div className="mt-4">
          <label className="block text-sm font-normal text-text-10 mb-3">
            Выберите время
          </label>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-stroke rounded-sm bg-bg-white">
            {timeSlots.map(time => {
              const isSelected = selectedTime === time;
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => onTimeSelect(time)}
                  className={`
                    px-3 py-2 text-sm font-normal rounded-sm
                    transition-smooth
                    ${
                      isSelected
                        ? 'bg-main-100 text-white'
                        : 'bg-bg-white text-text-100 border border-stroke hover:bg-main-10 hover:border-main-100'
                    }
                  `}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Подсказка для недельного вида */}
      {viewType === 'week' && !selectedDate && (
        <div className="mt-2 text-xs text-text-10 text-center">
          Выберите день недели, чтобы выбрать время
        </div>
      )}
    </div>
  );
};

