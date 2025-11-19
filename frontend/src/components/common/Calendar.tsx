import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';
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

  // Генерируем массив дней месяца
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Понедельник
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Дни недели
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-main-10 rounded-sm transition-smooth text-text-50 hover:text-main-100"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-medium text-text-100">
          {format(currentMonth, 'MMMM yyyy', { locale: ru })}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-main-10 rounded-sm transition-smooth text-text-50 hover:text-main-100"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-stroke rounded-sm overflow-hidden bg-bg-white">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 bg-bg-primary border-b border-stroke">
          {weekDays.map(day => (
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

      {/* Time Slots - показываем только если выбрана дата */}
      {selectedDate && (
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
    </div>
  );
};

