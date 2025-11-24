import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/patient.service';

/**
 * React Query Hook для получения appointments пациента (PATIENT role)
 */
export function usePatientAppointments(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['patient-appointments', params],
    queryFn: () => patientService.getMyAppointments(params),
    staleTime: 5000, // 5 секунд - более частое обновление для актуальных данных
    refetchOnWindowFocus: true, // Обновлять при фокусе окна
  });
}

