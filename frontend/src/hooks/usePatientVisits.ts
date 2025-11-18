import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/patient.service';
import { PaginatedResponse, PatientVisit } from '../types/api.types';

interface UsePatientVisitsParams {
  doctorId?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook для получения всех визитов пациентов
 */
export function usePatientVisits(params: UsePatientVisitsParams = {}) {
  return useQuery<PaginatedResponse<PatientVisit>>({
    queryKey: ['patientVisits', params],
    queryFn: () => patientService.getAllVisits(params),
    staleTime: 30000, // 30 секунд
  });
}



