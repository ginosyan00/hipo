import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import { Notification } from '../types/api.types';

/**
 * React Query Hooks для уведомлений
 */

export function useNotifications(params?: {
  patientId?: string;
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.getAll(params),
    staleTime: 30000, // 30 секунд
    refetchOnWindowFocus: true, // Обновлять при фокусе окна для актуальности уведомлений
  });
}

export function useUnreadNotificationsCount(patientId?: string) {
  return useQuery({
    queryKey: ['notifications', 'unread-count', patientId],
    queryFn: () => notificationService.getUnreadCount(patientId),
    staleTime: 10000, // 10 секунд
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Обновлять каждые 30 секунд
  });
}

export function useNotification(id: string, patientId?: string) {
  return useQuery({
    queryKey: ['notifications', id, patientId],
    queryFn: () => notificationService.getById(id, patientId),
    enabled: !!id,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patientId }: { id: string; patientId?: string }) =>
      notificationService.markAsRead(id, patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientId?: string) => notificationService.markAllAsRead(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patientId }: { id: string; patientId?: string }) =>
      notificationService.delete(id, patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

