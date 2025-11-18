import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { ClinicSettings } from '../../types/api.types';

interface NotificationsSectionProps {
  settings: ClinicSettings | undefined;
  onUpdate: (data: Partial<ClinicSettings>) => Promise<void>;
  isLoading?: boolean;
}

/**
 * NotificationsSection Component
 * Секция для настройки уведомлений клиники
 */
export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  settings,
  onUpdate,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    appointmentReminderHours: 24,
    notifyNewAppointments: true,
    notifyCancellations: true,
    notifyConfirmations: true,
    timezone: 'Asia/Yerevan',
    language: 'ru' as 'ru' | 'en' | 'am',
    currency: 'AMD' as 'AMD' | 'RUB' | 'USD',
    defaultAppointmentDuration: 30,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        emailNotificationsEnabled: settings.emailNotificationsEnabled ?? true,
        smsNotificationsEnabled: settings.smsNotificationsEnabled ?? false,
        appointmentReminderHours: settings.appointmentReminderHours ?? 24,
        notifyNewAppointments: settings.notifyNewAppointments ?? true,
        notifyCancellations: settings.notifyCancellations ?? true,
        notifyConfirmations: settings.notifyConfirmations ?? true,
        timezone: settings.timezone || 'Asia/Yerevan',
        language: settings.language || 'ru',
        currency: settings.currency || 'AMD',
        defaultAppointmentDuration: settings.defaultAppointmentDuration || 30,
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await onUpdate(formData);
    } catch (err: any) {
      console.error('Ошибка обновления настроек:', err);
    }
  };

  return (
    <Card title="Настройки уведомлений и системы" padding="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Общие настройки */}
        <div>
          <h3 className="text-sm font-medium text-text-50 mb-4">Общие настройки</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">Часовой пояс</label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100"
              >
                <option value="Asia/Yerevan">Asia/Yerevan (GMT+4)</option>
                <option value="Europe/Moscow">Europe/Moscow (GMT+3)</option>
                <option value="UTC">UTC (GMT+0)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">Язык интерфейса</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="am">Հայերեն</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">Валюта</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100"
              >
                <option value="AMD">AMD (֏)</option>
                <option value="RUB">RUB (₽)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">
                Длительность приёма по умолчанию (минуты)
              </label>
              <input
                type="number"
                name="defaultAppointmentDuration"
                value={formData.defaultAppointmentDuration}
                onChange={e => handleNumberChange('defaultAppointmentDuration', e.target.value)}
                min="5"
                max="480"
                className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100"
              />
            </div>
          </div>
        </div>

        {/* Настройки уведомлений */}
        <div>
          <h3 className="text-sm font-medium text-text-50 mb-4">Уведомления</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="emailNotificationsEnabled"
                checked={formData.emailNotificationsEnabled}
                onChange={handleChange}
                className="w-4 h-4 text-main-100 border-stroke rounded focus:ring-main-100"
              />
              <span className="text-sm text-text-50">Email уведомления</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="smsNotificationsEnabled"
                checked={formData.smsNotificationsEnabled}
                onChange={handleChange}
                className="w-4 h-4 text-main-100 border-stroke rounded focus:ring-main-100"
              />
              <span className="text-sm text-text-50">SMS уведомления</span>
            </label>

            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">
                Напоминание о приёме (за сколько часов)
              </label>
              <input
                type="number"
                name="appointmentReminderHours"
                value={formData.appointmentReminderHours}
                onChange={e => handleNumberChange('appointmentReminderHours', e.target.value)}
                min="1"
                max="168"
                className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100"
              />
              <p className="text-xs text-text-10 mt-1">От 1 до 168 часов (7 дней)</p>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyNewAppointments"
                  checked={formData.notifyNewAppointments}
                  onChange={handleChange}
                  className="w-4 h-4 text-main-100 border-stroke rounded focus:ring-main-100"
                />
                <span className="text-sm text-text-50">Уведомления о новых заявках</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyCancellations"
                  checked={formData.notifyCancellations}
                  onChange={handleChange}
                  className="w-4 h-4 text-main-100 border-stroke rounded focus:ring-main-100"
                />
                <span className="text-sm text-text-50">Уведомления об отменах</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyConfirmations"
                  checked={formData.notifyConfirmations}
                  onChange={handleChange}
                  className="w-4 h-4 text-main-100 border-stroke rounded focus:ring-main-100"
                />
                <span className="text-sm text-text-50">Уведомления о подтверждениях</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-stroke">
          <Button type="submit" variant="primary" size="md" isLoading={isLoading} disabled={isLoading}>
            Сохранить настройки
          </Button>
        </div>
      </form>
    </Card>
  );
};

