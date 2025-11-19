import React, { useState } from 'react';
import { Modal, Input, Button } from '../common';
import { Appointment } from '../../types/api.types';

interface EditAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onUpdate: (appointmentId: string, amount: number) => Promise<void>;
  isLoading?: boolean;
}

/**
 * EditAmountModal Component
 * Модальное окно для редактирования суммы завершенного приёма
 */
export const EditAmountModal: React.FC<EditAmountModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onUpdate,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Инициализация значения при открытии
  React.useEffect(() => {
    if (isOpen && appointment) {
      setAmount(appointment.amount ? String(appointment.amount) : '');
      setError('');
    }
  }, [isOpen, appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!appointment) {
      setError('Приём не выбран');
      return;
    }

    // Валидация суммы
    const amountNum = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(amountNum) || amountNum < 0) {
      setError('Введите корректную сумму (положительное число)');
      return;
    }

    try {
      await onUpdate(appointment.id, amountNum);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении суммы');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Разрешаем только цифры, точку, запятую и пробелы
    if (value === '' || /^[\d\s.,]+$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  if (!appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Изменить сумму"
      size="md"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            Сохранить
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Информация о приёме */}
        <div className="bg-bg-primary p-4 rounded-sm border border-stroke">
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-text-10">Врач: </span>
              <span className="font-semibold text-text-100">{appointment.doctor?.name}</span>
            </div>
            <div>
              <span className="text-text-10">Пациент: </span>
              <span className="font-semibold text-text-100">{appointment.patient?.name}</span>
            </div>
            <div>
              <span className="text-text-10">Процедура: </span>
              <span className="text-text-100">{appointment.reason || '—'}</span>
            </div>
            {appointment.amount && (
              <div>
                <span className="text-text-10">Текущая сумма: </span>
                <span className="font-semibold text-text-100">
                  {appointment.amount.toLocaleString('ru-RU')} ֏
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Поле ввода суммы */}
        <Input
          label="Новая сумма оплаты"
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Например: 15000"
          required
          error={error}
          helperText="Введите новую сумму в драмах или рублях"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-sm">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </form>
    </Modal>
  );
};



