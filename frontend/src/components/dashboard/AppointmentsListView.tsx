import React from 'react';
import { Card, Button } from '../common';
import { AppointmentsTable } from './AppointmentsTable';
import { Appointment } from '../../types/api.types';
import { formatAppointmentDateTime } from '../../utils/dateFormat';

interface AppointmentsListViewProps {
  appointments: Appointment[];
  viewMode: 'table' | 'cards';
  onStatusChange: (id: string, status: string) => void;
  onEditAmount?: (appointment: Appointment) => void;
  loadingAppointments: Record<string, string>;
  errorMessages: Record<string, string>;
  isFetching?: boolean;
  isTransitioning?: boolean;
}

/**
 * AppointmentsListView Component
 * Обертка для отображения приёмов в виде таблицы или карточек
 */
export const AppointmentsListView: React.FC<AppointmentsListViewProps> = ({
  appointments,
  viewMode,
  onStatusChange,
  onEditAmount,
  loadingAppointments,
  errorMessages,
  isFetching = false,
  isTransitioning = false,
}) => {
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      confirmed: 'bg-main-10 text-main-100 border-main-100/20',
      completed: 'bg-secondary-10 text-secondary-100 border-secondary-100/20',
      cancelled: 'bg-bg-primary text-text-10 border-stroke',
    };
    const labels = {
      pending: 'Ожидает',
      confirmed: 'Подтвержден',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return (
      <span className={`px-3 py-1 border rounded-sm text-xs font-normal ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (appointments.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-text-10 text-sm">
          Приёмы не найдены
        </div>
      </Card>
    );
  }

  if (viewMode === 'table') {
    return (
      <Card padding="md" className={`transition-opacity duration-500 ease-out will-change-opacity ${isFetching ? 'opacity-95' : 'opacity-100'}`}>
        <div className={isTransitioning ? 'opacity-0 transition-opacity duration-300 ease-out' : 'opacity-100 transition-opacity duration-500 ease-out'}>
          <AppointmentsTable
            appointments={appointments}
            onStatusChange={onStatusChange}
            onEditAmount={onEditAmount}
            loadingAppointments={loadingAppointments}
            errorMessages={errorMessages}
          />
        </div>
      </Card>
    );
  }

  // Cards view
  return (
    <div className={`space-y-4 transition-opacity duration-500 ease-out will-change-opacity ${isFetching ? 'opacity-95' : 'opacity-100'}`}>
      <div className={isTransitioning ? 'opacity-0 transition-opacity duration-300 ease-out' : 'opacity-100 transition-opacity duration-500 ease-out'}>
        {appointments.map((appointment, index) => (
          <Card 
            key={appointment.id} 
            padding="md"
            className="appointment-card transition-all duration-500 ease-out will-change-opacity animate-fade-in"
            style={{ animationDelay: `${index * 0.02}s` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Patient Info Header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-12 h-12 bg-main-10 rounded-sm flex items-center justify-center flex-shrink-0">
                    <span className="text-base text-main-100 font-medium">
                      {appointment.patient?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-text-100 truncate">
                      {appointment.patient?.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {appointment.patient?.email && (
                        <p className="text-xs text-text-10">📧 {appointment.patient.email}</p>
                      )}
                      {appointment.patient?.phone && (
                        <p className="text-xs text-text-10">📱 {appointment.patient.phone}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                {/* Doctor and Appointment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-bg-primary p-3 rounded-sm">
                    <p className="font-normal text-text-10 mb-2">👨‍⚕️ Врач:</p>
                    <p className="font-semibold text-text-50 text-sm">{appointment.doctor?.name}</p>
                    {appointment.doctor?.specialization && (
                      <p className="text-text-10 mt-1">{appointment.doctor.specialization}</p>
                    )}
                  </div>
                  <div className="bg-bg-primary p-3 rounded-sm">
                    <p className="font-normal text-text-10 mb-2">📅 Дата и время приёма:</p>
                    <p className="font-semibold text-text-50 text-sm">
                      {formatAppointmentDateTime(appointment.appointmentDate, { dateFormat: 'long' })}
                    </p>
                    {(appointment.registeredAt || appointment.createdAt) && (
                      <p className="text-text-10 mt-1 text-xs">
                        📝 Зарегистрировано: {(() => {
                          let registeredAtOriginalStr = null;
                          if (appointment.notes) {
                            const match = appointment.notes.match(/REGISTERED_AT_ORIGINAL:\s*(.+)/);
                            if (match) {
                              registeredAtOriginalStr = match[1].trim();
                            }
                          }
                          
                          if (registeredAtOriginalStr) {
                            const match = registeredAtOriginalStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
                            if (match) {
                              const [datePart, timePart] = [match[1], match[2]];
                              const [year, month, day] = datePart.split('-');
                              const [hours, minutes] = timePart.split(':');
                              return `${day}.${month}.${year} ${hours}:${minutes}`;
                            }
                          }
                          
                          const registeredAtStr = appointment.registeredAt || appointment.createdAt;
                          if (!registeredAtStr) return '';
                          
                          const date = new Date(registeredAtStr);
                          return date.toLocaleString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                        })()}
                      </p>
                    )}
                    <p className="text-text-10 mt-1">⏱️ Длительность: {appointment.duration} мин</p>
                    {appointment.amount && (
                      <p className="text-text-10 mt-1">
                        💰 Сумма: <span className="font-semibold text-text-100">{appointment.amount.toLocaleString('ru-RU')} ֏</span>
                      </p>
                    )}
                  </div>
                </div>

                {appointment.reason && (
                  <div className="text-xs">
                    <p className="font-normal text-text-10 mb-1">Причина визита:</p>
                    <p className="text-text-50">{appointment.reason}</p>
                  </div>
                )}

                {appointment.notes && (
                  <div className="text-xs">
                    <p className="font-normal text-text-10 mb-1">Заметки:</p>
                    <p className="text-text-50">{appointment.notes}</p>
                  </div>
                )}

                {/* Inline Error Message */}
                {errorMessages[appointment.id] && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-sm">
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <span>⚠️</span>
                      {errorMessages[appointment.id]}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 ml-4 min-w-[120px]">
                {appointment.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onStatusChange(appointment.id, 'confirmed')}
                    isLoading={loadingAppointments[appointment.id] === 'confirmed'}
                    disabled={!!loadingAppointments[appointment.id]}
                  >
                    Подтвердить
                  </Button>
                )}

                {appointment.status === 'confirmed' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onStatusChange(appointment.id, 'completed')}
                    isLoading={loadingAppointments[appointment.id] === 'completed'}
                    disabled={!!loadingAppointments[appointment.id]}
                  >
                    Завершить
                  </Button>
                )}

                {['pending', 'confirmed'].includes(appointment.status) && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onStatusChange(appointment.id, 'cancelled')}
                    isLoading={loadingAppointments[appointment.id] === 'cancelled'}
                    disabled={!!loadingAppointments[appointment.id]}
                  >
                    Отменить
                  </Button>
                )}

                {appointment.status === 'completed' && onEditAmount && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEditAmount(appointment)}
                    isLoading={loadingAppointments[appointment.id] === 'updating'}
                    disabled={!!loadingAppointments[appointment.id]}
                  >
                    {appointment.amount ? 'Изменить сумму' : 'Добавить сумму'}
                  </Button>
                )}

                {appointment.status === 'cancelled' && (
                  <div className="text-xs text-text-10 text-center py-2">
                    ❌ Приём отменён
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

