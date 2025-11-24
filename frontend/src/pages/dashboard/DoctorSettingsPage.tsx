import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { DoctorProfileSection } from '../../components/dashboard/DoctorProfileSection';
import { PasswordSection } from '../../components/dashboard/PasswordSection';
import { useUser, useUpdateUser } from '../../hooks/useUsers';
import { useDoctorProfile, useUpdateDoctorProfile, useUploadDoctorAvatar } from '../../hooks/useDoctor';
import { useUpdatePassword } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/useAuthStore';
import { Spinner, BackButton } from '../../components/common';
import { toast } from 'react-hot-toast';

/**
 * DoctorSettingsPage - Universal Page
 * Универсальная страница настроек врача
 * Доступна и для врача (редактирование своего профиля), и для клиники (редактирование врача)
 */
export const DoctorSettingsPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  
  // Определяем, кто редактирует: врач сам себя или клиника редактирует врача
  const isEditingSelf = !doctorId || currentUser?.id === doctorId;
  
  // Если врач редактирует себя - используем doctor hooks
  const { data: doctorProfile, isLoading: doctorProfileLoading } = useDoctorProfile();
  
  // Если клиника редактирует врача - используем user hooks
  const { data: doctorUser, isLoading: doctorUserLoading } = useUser(doctorId || '');
  
  // Выбираем данные в зависимости от контекста
  const doctor = isEditingSelf ? doctorProfile : doctorUser;
  const isLoading = isEditingSelf ? doctorProfileLoading : doctorUserLoading;
  
  // Мутации для обновления
  const updateUserMutation = useUpdateUser();
  const updateDoctorProfileMutation = useUpdateDoctorProfile();
  const uploadDoctorAvatarMutation = useUploadDoctorAvatar();
  const updatePasswordMutation = useUpdatePassword();
  
  const handleUpdateProfile = async (data: any) => {
    try {
      if (isEditingSelf) {
        // Врач обновляет свой профиль
        await updateDoctorProfileMutation.mutateAsync(data);
      } else {
        // Клиника обновляет врача
        await updateUserMutation.mutateAsync({
          id: doctorId!,
          data,
        });
        toast.success('Профиль врача успешно обновлен');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении профиля');
      throw error;
    }
  };
  
  const handleAvatarUpload = async (avatar: string) => {
    try {
      if (isEditingSelf) {
        // Врач обновляет свой аватар
        await uploadDoctorAvatarMutation.mutateAsync(avatar);
      } else {
        // Клиника обновляет аватар врача
        await updateUserMutation.mutateAsync({
          id: doctorId!,
          data: { avatar },
        });
        toast.success('Фото врача успешно обновлено');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении фото');
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
  
  if (isLoading) {
    return (
      <NewDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </NewDashboardLayout>
    );
  }
  
  if (!doctor) {
    return (
      <NewDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-medium text-text-100 mb-4">Врач не найден</h2>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-main-100 hover:text-main-100/80"
            >
              ← Назад
            </button>
          </div>
        </div>
      </NewDashboardLayout>
    );
  }
  
  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton fallback="/dashboard/doctors" />
        </div>

        {isEditingSelf && (
          <div>
            <h1 className="text-2xl font-bold text-text-100">Мои настройки</h1>
            <p className="text-sm text-text-10 mt-1">Управление профилем и настройками</p>
          </div>
        )}
        
        {/* Профиль врача */}
        <DoctorProfileSection
          doctor={doctor}
          onUpdate={handleUpdateProfile}
          onAvatarUpload={handleAvatarUpload}
          isLoading={isEditingSelf ? updateDoctorProfileMutation.isPending : updateUserMutation.isPending}
          isAvatarLoading={isEditingSelf ? uploadDoctorAvatarMutation.isPending : updateUserMutation.isPending}
          isEditingSelf={isEditingSelf}
        />

        {/* Пароль (только если врач редактирует себя) */}
        {isEditingSelf && (
          <PasswordSection
            onUpdate={handleUpdatePassword}
            isLoading={updatePasswordMutation.isPending}
          />
        )}
      </div>
    </NewDashboardLayout>
  );
};

