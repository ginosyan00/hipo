import React, { useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Appointment } from '../../types/api.types';
import { formatAppointmentTime } from '../../utils/dateFormat';

// Настройка локали для moment
if (moment.locale) {
  moment.locale('ru');
}
const localizer = momentLocalizer(moment);

interface MonthlyCalendarViewProps {
  appointments: Appointment[];
  onSelectAppointment?: (appointment: Appointment) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  currentDate?: Date;
  onNavigate?: (date: Date, view: View) => void;
  onViewChange?: (view: 'table' | 'monthly' | 'weekly') => void;
  currentView?: 'table' | 'monthly' | 'weekly';
  isClinicAdmin?: boolean;
}

/**
 * MonthlyCalendarView Component
 * Месячный календарный вид для отображения приёмов
 */
export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  appointments,
  onSelectAppointment,
  onSelectSlot,
  currentDate = new Date(),
  onNavigate,
  onViewChange,
  currentView = 'monthly',
  isClinicAdmin = false,
}) => {
  // Преобразуем appointments в формат для react-big-calendar
  const events = useMemo(() => {
    return appointments.map((appointment) => {
      const start = new Date(appointment.appointmentDate);
      const end = new Date(start.getTime() + appointment.duration * 60 * 1000);

      return {
        id: appointment.id,
        title: `${appointment.patient?.name || 'Пациент'} - ${appointment.reason || 'Приём'}`,
        start,
        end,
        resource: appointment,
        status: appointment.status,
        doctor: appointment.doctor?.name || 'Врач',
        patient: appointment.patient?.name || 'Пациент',
        time: formatAppointmentTime(appointment.appointmentDate),
      };
    });
  }, [appointments]);

  // Кастомные стили для событий в зависимости от статуса
  const eventStyleGetter = (event: any) => {
    const status = event.resource?.status;
    let backgroundColor = '#0ea5e9'; // default main-100
    let borderColor = '#0ea5e9';

    switch (status) {
      case 'pending':
        backgroundColor = '#fbbf24'; // yellow-400
        borderColor = '#f59e0b'; // yellow-500
        break;
      case 'confirmed':
        backgroundColor = '#0ea5e9'; // main-100 (blue)
        borderColor = '#0284c7'; // main-200
        break;
      case 'completed':
        backgroundColor = '#10b981'; // green-500
        borderColor = '#059669'; // green-600
        break;
      case 'cancelled':
        backgroundColor = '#6b7280'; // gray-500
        borderColor = '#4b5563'; // gray-600
        break;
      default:
        backgroundColor = '#0ea5e9';
        borderColor = '#0284c7';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderRadius: '4px',
        color: '#ffffff',
        fontSize: '12px',
        padding: '2px 4px',
        cursor: 'pointer',
      },
    };
  };

  // Кастомный компонент для отображения события
  const EventComponent = ({ event }: any) => {
    return (
      <div className="text-xs font-medium truncate">
        <div className="font-semibold">{event.time}</div>
        <div className="truncate">{event.patient}</div>
        {event.resource?.doctor && (
          <div className="text-[10px] opacity-90 truncate">{event.doctor}</div>
        )}
      </div>
    );
  };

  // Обработчик выбора события
  const handleSelectEvent = (event: any) => {
    if (onSelectAppointment && event.resource) {
      onSelectAppointment(event.resource);
    }
  };

  // Обработчик навигации по календарю
  const handleNavigate = (newDate: Date, view: View) => {
    if (onNavigate) {
      onNavigate(newDate, view);
    }
  };

  // Кастомный тулбар с кнопками переключения видов (в стиле Bitrix)
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
      // Обновляем состояние календаря для синхронизации с родительским компонентом
      if (onNavigate) {
        const newDate = moment(toolbar.date).subtract(1, 'month').toDate();
        onNavigate(newDate, 'month');
      }
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
      // Обновляем состояние календаря для синхронизации с родительским компонентом
      if (onNavigate) {
        const newDate = moment(toolbar.date).add(1, 'month').toDate();
        onNavigate(newDate, 'month');
      }
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
      // Обновляем состояние календаря для синхронизации с родительским компонентом
      if (onNavigate) {
        onNavigate(new Date(), 'month');
      }
    };

    const label = () => {
      const date = moment(toolbar.date);
      return date.format('MMMM YYYY');
    };

    return (
      <div className="rbc-toolbar flex items-center justify-between p-4 border-b border-stroke bg-bg-white flex-nowrap">
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={goToBack}
            className="px-3 py-1.5 text-sm border border-stroke rounded-sm hover:bg-bg-primary transition-smooth text-text-100 font-medium"
            title="Предыдущий месяц"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 text-sm border border-stroke rounded-sm hover:bg-bg-primary transition-smooth text-text-100"
            title="Сегодня"
          >
            Сегодня
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="px-3 py-1.5 text-sm border border-stroke rounded-sm hover:bg-bg-primary transition-smooth text-text-100 font-medium"
            title="Следующий месяц"
          >
            ›
          </button>
          <span className="ml-4 text-base font-semibold text-text-100 whitespace-nowrap">{label()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[600px] bg-bg-white rounded-sm border border-stroke">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view="month"
        date={currentDate}
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        components={{
          event: EventComponent,
          toolbar: CustomToolbar,
        }}
        messages={{
          next: 'Следующий',
          previous: 'Предыдущий',
          today: 'Сегодня',
          month: 'Месяц',
          week: 'Неделя',
          day: 'День',
          agenda: 'Повестка',
          date: 'Дата',
          time: 'Время',
          event: 'Событие',
          noEventsInRange: 'Нет приёмов в этом периоде',
        }}
        formats={{
          dayFormat: 'D',
          weekdayFormat: (date, culture, localizer) => localizer?.format(date, 'ddd', culture) || '',
          monthHeaderFormat: (date, culture, localizer) => localizer?.format(date, 'MMMM YYYY', culture) || '',
        }}
        className="rbc-calendar-custom"
      />
    </div>
  );
};

