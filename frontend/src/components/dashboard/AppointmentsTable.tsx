import React from 'react';
import { Appointment } from '../../types/api.types';
import { Button } from '../common';
import { formatAppointmentDateTime } from '../../utils/dateFormat';

interface AppointmentsTableProps {
  appointments: Appointment[];
  onStatusChange: (id: string, status: string) => void;
  onEditAmount?: (appointment: Appointment) => void;
  loadingAppointments: Record<string, string>;
  errorMessages: Record<string, string>;
}

/**
 * AppointmentsTable Component
 * Табличный формат отображения приёмов
 */
export const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  appointments,
  onStatusChange,
  onEditAmount,
  loadingAppointments,
  errorMessages,
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

  /**
   * Форматирует дату регистрации приёма
   * Использует ту же логику, что и в карточном представлении
   */
  const formatRegisteredAt = (appointment: Appointment): string | null => {
    if (!appointment.registeredAt && !appointment.createdAt) {
      return null;
    }

    // Сначала проверяем, есть ли исходная строка времени в notes
    let registeredAtOriginalStr = null;
    if (appointment.notes) {
      const match = appointment.notes.match(/REGISTERED_AT_ORIGINAL:\s*(.+)/);
      if (match) {
        registeredAtOriginalStr = match[1].trim();
      }
    }
    
    // Если есть исходная строка, используем её для отображения локального времени клиента
    if (registeredAtOriginalStr) {
      const match = registeredAtOriginalStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
      if (match) {
        const [datePart, timePart] = [match[1], match[2]];
        const [year, month, day] = datePart.split('-');
        const [hours, minutes] = timePart.split(':');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
      }
    }
    
    // Если исходной строки нет, используем стандартное форматирование
    const registeredAtStr = appointment.registeredAt || appointment.createdAt;
    if (!registeredAtStr) return null;
    
    const date = new Date(registeredAtStr);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-text-10 text-sm">
        Приёмы не найдены
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-primary border-b border-stroke transition-colors duration-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
              Врач
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
              Пациент
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
              Дата и время
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
              Процедура
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
              Длительность
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
              Сумма
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
              Статус
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-bg-white divide-y divide-stroke">
          {appointments.map((appointment, index) => (
            <tr 
              key={appointment.id} 
              className="appointment-row hover:bg-bg-primary transition-all duration-500 ease-out will-change-opacity animate-fade-in"
              style={{ animationDelay: `${index * 0.02}s` }}
            >
              <td className="px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-text-100">{appointment.doctor?.name}</p>
                  {appointment.doctor?.specialization && (
                    <p className="text-xs text-text-10 mt-1">{appointment.doctor.specialization}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-text-100">{appointment.patient?.name}</p>
                  <div className="flex flex-col gap-1 mt-1">
                    {appointment.patient?.phone && (
                      <p className="text-xs text-text-10">📱 {appointment.patient.phone}</p>
                    )}
                    {appointment.patient?.email && (
                      <p className="text-xs text-text-10">📧 {appointment.patient.email}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm">
                <div>
                  <p className="text-text-100">{formatAppointmentDateTime(appointment.appointmentDate)}</p>
                  {(() => {
                    const registeredAtFormatted = formatRegisteredAt(appointment);
                    return registeredAtFormatted ? (
                      <p className="text-xs text-text-10 mt-1">
                        📝 Зарегистрировано: {registeredAtFormatted}
                      </p>
                    ) : null;
                  })()}
                </div>
              </td>
              <td className="px-4 py-3 text-sm">
                <p className="text-text-100">{appointment.reason || '—'}</p>
              </td>
              <td className="px-4 py-3 text-sm text-text-100">
                {appointment.duration} мин
              </td>
              <td className="px-4 py-3 text-sm">
                {appointment.amount ? (
                  <span className="font-semibold text-text-100">
                    {appointment.amount.toLocaleString('ru-RU')} ֏
                  </span>
                ) : (
                  <span className="text-text-10">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {getStatusBadge(appointment.status)}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex flex-col gap-2 min-w-[120px]">
                  {/* Кнопка "Подтвердить" - только для pending */}
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

                  {/* Кнопка "Завершить" - только для confirmed */}
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

                  {/* Кнопка "Отменить" - для pending и confirmed */}
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

                  {/* Кнопка редактирования суммы - только для завершенных приёмов */}
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

                  {/* Информация для отмененных приёмов */}
                  {appointment.status === 'cancelled' && (
                    <div className="text-xs text-text-10 text-center py-2">
                      ❌ Отменён
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

