import React from 'react';
import { Modal, Spinner } from '../common';
import { Patient, Appointment, AppointmentStatus } from '../../types/api.types';
import { formatAppointmentDateTime } from '../../utils/dateFormat';
import { usePatient } from '../../hooks/usePatients';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

/**
 * PatientProfileModal Component
 * Модальное окно с полной информацией о пациенте и всей его истории визитов
 */
export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  isOpen,
  onClose,
  patientId,
}) => {
  const { data: patient, isLoading, error } = usePatient(patientId);

  const getStatusBadge = (status: AppointmentStatus) => {
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
      <span className={`px-2 py-1 border rounded-sm text-xs font-normal ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '-';
    return `${amount.toLocaleString('ru-RU')} ֏`;
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Профиль пациента" size="xl">
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-text-10 text-sm">
          Ошибка загрузки данных пациента
        </div>
      )}

      {patient && (
        <div className="space-y-6">
          {/* Информация о пациенте */}
          <div className="bg-bg-primary rounded-lg p-4 border border-stroke">
            <h3 className="text-base font-medium text-text-100 mb-4">Личная информация</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-10 mb-1">ФИО</p>
                <p className="text-sm text-text-100 font-medium">{patient.name}</p>
              </div>
              <div>
                <p className="text-xs text-text-10 mb-1">Телефон</p>
                <p className="text-sm text-text-100">{patient.phone}</p>
              </div>
              {patient.email && (
                <div>
                  <p className="text-xs text-text-10 mb-1">Email</p>
                  <p className="text-sm text-text-100">{patient.email}</p>
                </div>
              )}
              {patient.dateOfBirth && (
                <div>
                  <p className="text-xs text-text-10 mb-1">Дата рождения</p>
                  <p className="text-sm text-text-100">{formatDate(patient.dateOfBirth)}</p>
                </div>
              )}
              {patient.gender && (
                <div>
                  <p className="text-xs text-text-10 mb-1">Пол</p>
                  <p className="text-sm text-text-100">
                    {patient.gender === 'male' ? 'Мужской' : patient.gender === 'female' ? 'Женский' : 'Другой'}
                  </p>
                </div>
              )}
              {patient.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-text-10 mb-1">Заметки</p>
                  <p className="text-sm text-text-100">{patient.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* История визитов */}
          <div>
            <h3 className="text-base font-medium text-text-100 mb-4">
              История визитов ({patient.appointments?.length || 0})
            </h3>

            {!patient.appointments || patient.appointments.length === 0 ? (
              <div className="text-center py-12 text-text-10 text-sm border border-stroke rounded-lg">
                Нет записей о визитах
              </div>
            ) : (
              <div className="space-y-3">
                {(patient.appointments as Appointment[]).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-bg-primary border border-stroke rounded-lg p-4 hover:border-main-100/30 transition-smooth"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-sm font-medium text-text-100">
                            {formatAppointmentDateTime(appointment.appointmentDate)}
                          </h4>
                          {getStatusBadge(appointment.status)}
                        </div>
                        {appointment.doctor && (
                          <p className="text-xs text-text-50">
                            Врач: {appointment.doctor.name}
                            {appointment.doctor.specialization && ` (${appointment.doctor.specialization})`}
                          </p>
                        )}
                        {appointment.reason && (
                          <p className="text-xs text-text-50 mt-1">Причина: {appointment.reason}</p>
                        )}
                      </div>
                      {appointment.amount && (
                        <div className="text-right">
                          <p className="text-xs text-text-10 mb-1">Сумма</p>
                          <p className="text-sm font-medium text-text-100">{formatAmount(appointment.amount)}</p>
                        </div>
                      )}
                    </div>
                    {appointment.notes && (
                      <div className="mt-3 pt-3 border-t border-stroke">
                        <p className="text-xs text-text-10">Заметки:</p>
                        <p className="text-xs text-text-50 mt-1">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};


