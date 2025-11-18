import React, { useState } from 'react';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { ProfileSection } from '../../components/dashboard/ProfileSection';
import { PasswordSection } from '../../components/dashboard/PasswordSection';
import { NotificationsSection } from '../../components/dashboard/NotificationsSection';
import { LogoUpload } from '../../components/dashboard/LogoUpload';
import { Card } from '../../components/common/Card';
import { useClinic, useUpdateClinic, useUploadLogo, useClinicSettings, useUpdateClinicSettings, useUpdateClinicPassword } from '../../hooks/useClinic';
import { toast } from 'react-hot-toast';

/**
 * Settings Page
 * Страница настроек клиники
 */
export const SettingsPage: React.FC = () => {
  const { data: clinic, isLoading: clinicLoading } = useClinic();
  const { data: settings, isLoading: settingsLoading } = useClinicSettings();
  const updateClinicMutation = useUpdateClinic();
  const uploadLogoMutation = useUploadLogo();
  const updateSettingsMutation = useUpdateClinicSettings();
  const updatePasswordMutation = useUpdateClinicPassword();

  const handleUpdateClinic = async (data: any) => {
    try {
      await updateClinicMutation.mutateAsync(data);
      toast.success('Профиль успешно обновлен');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении профиля');
      throw error;
    }
  };

  const handleUploadLogo = async (logo: string) => {
    try {
      await uploadLogoMutation.mutateAsync(logo);
      toast.success('Логотип успешно загружен');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке логотипа');
      throw error;
    }
  };

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

  if (clinicLoading || settingsLoading) {
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
          <p className="text-sm text-text-10 mt-1">Управление профилем клиники и настройками</p>
        </div>

        {/* Логотип */}
        <Card title="Логотип клиники" padding="lg">
          <LogoUpload
            currentLogo={clinic?.logo || null}
            onUpload={handleUploadLogo}
            isLoading={uploadLogoMutation.isPending}
          />
        </Card>

        {/* Профиль */}
        <ProfileSection
          clinic={clinic}
          onUpdate={handleUpdateClinic}
          isLoading={updateClinicMutation.isPending}
        />

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

