import React, { useState } from 'react';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { PasswordSection } from '../../components/dashboard/PasswordSection';
import { NotificationsSection } from '../../components/dashboard/NotificationsSection';
import { useClinicSettings, useUpdateClinicSettings } from '../../hooks/useClinic';
import { useUpdatePassword } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

/**
 * Settings Page
 * Страница настроек клиники (системные настройки, пароль, уведомления)
 */
export const SettingsPage: React.FC = () => {
  const { data: settings, isLoading: settingsLoading } = useClinicSettings();
  const updateSettingsMutation = useUpdateClinicSettings();
  const updatePasswordMutation = useUpdatePassword();

  const handleUpdateSettings = async (data: any) => {
    try {
      await updateSettingsMutation.mutateAsync(data);
      toast.success('Настройки успешно обновлены');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении настроек');
      throw error;
    }
  };

  const handleUpdatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await updatePasswordMutation.mutateAsync({ currentPassword, newPassword });
      toast.success('Пароль успешно изменен');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при изменении пароля');
      throw error;
    }
  };

  if (settingsLoading) {
    return (
      <NewDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-100"></div>
        </div>
      </NewDashboardLayout>
    );
  }

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-100">Настройки</h1>
          <p className="text-sm text-text-10 mt-1">Системные настройки, пароль и уведомления</p>
        </div>

        {/* Пароль */}
        <PasswordSection
          onUpdate={handleUpdatePassword}
          isLoading={updatePasswordMutation.isPending}
        />

        {/* Настройки уведомлений */}
        <NotificationsSection
          settings={settings}
          onUpdate={handleUpdateSettings}
          isLoading={updateSettingsMutation.isPending}
        />
      </div>
    </NewDashboardLayout>
  );
};

