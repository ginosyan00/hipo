import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicService } from '../services/clinic.service';
import { Clinic, ClinicSettings } from '../types/api.types';

/**
 * React Query Hooks для клиники
 */

/**
 * Получить данные текущей клиники
 */
export function useClinic() {
  return useQuery({
    queryKey: ['clinic', 'me'],
    queryFn: () => clinicService.getClinic(),
    staleTime: 60000, // 1 минута
  });
}

/**
 * Обновить профиль клиники
 */
export function useUpdateClinic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Clinic>) => clinicService.updateClinic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic'] });
    },
  });
}

/**
 * Загрузить логотип клиники
 */
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logo: string) => clinicService.uploadLogo(logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic'] });
    },
  });
}

/**
 * Получить настройки клиники
 */
export function useClinicSettings() {
  return useQuery({
    queryKey: ['clinic', 'settings'],
    queryFn: () => clinicService.getSettings(),
    staleTime: 60000, // 1 минута
  });
}

/**
 * Обновить настройки клиники
 */
export function useUpdateClinicSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ClinicSettings>) => clinicService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['clinic'] });
    },
  });
}

/**
 * Обновить пароль администратора клиники
 */
export function useUpdateClinicPassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      clinicService.updatePassword(currentPassword, newPassword),
  });
}

