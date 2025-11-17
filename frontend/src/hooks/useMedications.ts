import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicationService, MedicationStats } from '../services/medication.service';
import { Medication } from '../types/api.types';

/**
 * React Query Hooks для медикаментов
 */

export function useMedications(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['medications', params],
    queryFn: () => medicationService.getAll(params),
    staleTime: 30000, // 30 секунд
    keepPreviousData: true, // Keep previous data while fetching new data to prevent re-renders
  });
}

export function useMedication(id: string) {
  return useQuery({
    queryKey: ['medications', id],
    queryFn: () => medicationService.getById(id),
    enabled: !!id,
  });
}

export function useMedicationStats() {
  return useQuery({
    queryKey: ['medications', 'stats'],
    queryFn: () => medicationService.getStats(),
    staleTime: 30000, // 30 секунд
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Medication>) => medicationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medications', 'stats'] });
    },
  });
}

export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Medication> }) =>
      medicationService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medications', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['medications', 'stats'] });
    },
  });
}

export function useDeleteMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => medicationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medications', 'stats'] });
    },
  });
}

