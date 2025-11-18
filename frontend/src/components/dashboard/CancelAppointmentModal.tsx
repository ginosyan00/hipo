import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button, Input } from '../common';
import { Appointment } from '../../types/api.types';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onConfirm: (cancellationReason: string, suggestedNewDate?: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * CancelAppointmentModal Component
 * Модальное окно для отмены приёма с обязательной причиной и опциональным новым временем
 */
export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirm,
  isLoading = false,
}) => {
  const [cancellationReason, setCancellationReason] = useState('');
  const [suggestedNewDate, setSuggestedNewDate] = useState('');
  const [suggestedNewTime, setSuggestedNewTime] = useState('');
  const [error, setError] = useState('');

  // Сброс формы при закрытии
  React.useEffect(() => {
    if (!isOpen) {
      setCancellationReason('');
      setSuggestedNewDate('');
      setSuggestedNewTime('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Валидация: причина обязательна
    if (!cancellationReason.trim()) {
      setError('Пожалуйста, укажите причину отмены');
      return;
    }

    // Если указана дата, проверяем что указано и время
    if (suggestedNewDate && !suggestedNewTime) {
      setError('Пожалуйста, укажите время для предложенного нового приёма');
      return;
    }

    // Формируем дату и время для предложенного нового приёма
    let suggestedNewDateTime: string | undefined;
    if (suggestedNewDate && suggestedNewTime) {
      const dateTime = new Date(`${suggestedNewDate}T${suggestedNewTime}`);
      if (isNaN(dateTime.getTime())) {
        setError('Некорректная дата или время');
        return;
      }
      suggestedNewDateTime = dateTime.toISOString();
    }

    try {
      await onConfirm(cancellationReason.trim(), suggestedNewDateTime);
      // Закрываем модальное окно после успешной отмены
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка при отмене приёма');
    }
  };

  if (!appointment) return null;

  // Форматируем дату и время приёма для отображения
  const appointmentDate = new Date(appointment.appointmentDate);
  const formattedDate = appointmentDate.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Отмена приёма"
      size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading || !cancellationReason.trim()}
          >
            Подтвердить отмену
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Информация о приёме */}
        <div className="bg-bg-primary p-4 rounded-lg border border-stroke">
          <p className="text-sm text-text-50 mb-2">Информация о приёме:</p>
          <p className="text-text-100 font-medium">
            {appointment.patient?.name || 'Пациент'}
          </p>
          <p className="text-sm text-text-10 mt-1">
            {formattedDate}
          </p>
          {appointment.doctor && (
            <p className="text-sm text-text-10 mt-1">
              Врач: {appointment.doctor.name}
              {appointment.doctor.specialization && ` (${appointment.doctor.specialization})`}
            </p>
          )}
        </div>

        {/* Причина отмены (обязательное поле) */}
        <div>
          <label htmlFor="cancellationReason" className="block text-sm font-medium text-text-50 mb-2">
            Причина отмены <span className="text-red-500">*</span>
          </label>
          <textarea
            id="cancellationReason"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Укажите причину отмены приёма..."
            className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-main-100 focus:border-transparent resize-none"
            rows={4}
            required
            disabled={isLoading}
          />
          <p className="text-xs text-text-10 mt-1">
            Это поле обязательно для заполнения
          </p>
        </div>

        {/* Предложенное новое время (опционально) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-50">
            Предложить новое время (опционально)
          </label>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="suggestedNewDate" className="block text-xs text-text-10 mb-1">
                Дата
              </label>
              <Input
                id="suggestedNewDate"
                type="date"
                value={suggestedNewDate}
                onChange={(e) => setSuggestedNewDate(e.target.value)}
                disabled={isLoading}
                min={new Date().toISOString().split('T')[0]} // Минимальная дата - сегодня
              />
            </div>
            <div>
              <label htmlFor="suggestedNewTime" className="block text-xs text-text-10 mb-1">
                Время
              </label>
              <Input
                id="suggestedNewTime"
                type="time"
                value={suggestedNewTime}
                onChange={(e) => setSuggestedNewTime(e.target.value)}
                disabled={isLoading || !suggestedNewDate}
              />
            </div>
          </div>
          <p className="text-xs text-text-10">
            Если указана дата, необходимо указать и время
          </p>
        </div>

        {/* Сообщение об ошибке */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </p>
          </div>
        )}

        {/* Предупреждение */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ После подтверждения приём будет отменён, и пациент получит уведомление.
          </p>
        </div>
      </form>
    </Modal>
  );
};

