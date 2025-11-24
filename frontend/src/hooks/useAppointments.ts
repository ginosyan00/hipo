import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../services/appointment.service';
import { Appointment } from '../types/api.types';

/**
 * React Query Hooks для приёмов
 */

export function useAppointments(params?: {
  doctorId?: string;
  patientId?: string;
  status?: string;
  date?: string;
  time?: string;
  week?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentService.getAll(params),
    staleTime: 10000, // 10 секунд
    placeholderData: (previousData) => previousData, // Плавный переход - сохраняем предыдущие данные
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    gcTime: 300000, // 5 минут - кешируем данные дольше
    retry: 1, // Меньше попыток для быстрого ответа
    refetchOnMount: false, // Не обновлять при монтировании если данные свежие
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentService.getById(id),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => appointmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Также инвалидируем patient appointments, чтобы пациент видел обновления
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      appointmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Также инвалидируем patient appointments, чтобы пациент видел обновления
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      status, 
      amount, 
      cancellationReason, 
      suggestedNewDate 
    }: { 
      id: string; 
      status: string; 
      amount?: number;
      cancellationReason?: string;
      suggestedNewDate?: string;
    }) =>
      appointmentService.updateStatus(id, status, amount, cancellationReason, suggestedNewDate),
    onSuccess: (data, variables) => {
      // Инвалидируем кеш приёмов
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Также инвалидируем patient appointments, чтобы пациент видел обновления
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      
      // Если статус изменен на 'completed', также инвалидируем кеш визитов пациентов
      // Это гарантирует, что завершенный приём сразу появится в разделе Patients
      if (variables.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['patientVisits'] });
        console.log('✅ [APPOINTMENTS] Приём завершен, обновляем кеш для раздела Patients и patient-appointments');
      }
      
      // Если статус изменен на 'cancelled', инвалидируем кеш уведомлений
      if (variables.status === 'cancelled') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        console.log('✅ [APPOINTMENTS] Приём отменён, обновляем кеш уведомлений');
      }
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Также инвалидируем patient appointments, чтобы пациент видел обновления
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
  });
}


