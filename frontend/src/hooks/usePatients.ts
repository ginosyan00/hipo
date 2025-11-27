import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patient.service';
import { Patient, DoctorPatient, PaginatedResponse } from '../types/api.types';

/**
 * React Query Hooks для пациентов
 */

export function usePatients(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientService.getAll(params),
    staleTime: 30000, // 30 секунд
    // Всегда загружаем данные, даже если они в кеше
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Patient>) => patientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Patient> }) =>
      patientService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', variables.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

/**
 * Hook для получения агрегированных данных пациентов врача
 */
export function useDoctorPatients(
  doctorId: string | undefined,
  params?: { search?: string; page?: number; limit?: number }
) {
  return useQuery<PaginatedResponse<DoctorPatient>>({
    queryKey: ['doctorPatients', doctorId, params],
    queryFn: () => patientService.getDoctorPatients(doctorId!, params),
    enabled: !!doctorId,
    staleTime: 30000, // 30 секунд
  });
}


