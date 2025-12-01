import { useQuery, useMutation } from '@tanstack/react-query';
import { publicService } from '../services/public.service';

/**
 * React Query Hooks для публичного API
 */

export function useClinics(params?: { city?: string }) {
  return useQuery({
    queryKey: ['public-clinics', params],
    queryFn: () => publicService.getClinics(params),
    staleTime: 60000, // 1 минута
  });
}

export function useClinic(slug: string) {
  return useQuery({
    queryKey: ['public-clinic', slug],
    queryFn: () => publicService.getClinicBySlug(slug),
    enabled: !!slug,
    staleTime: 60000,
  });
}

export function useClinicDoctors(slug: string) {
  return useQuery({
    queryKey: ['public-clinic-doctors', slug],
    queryFn: () => publicService.getClinicDoctors(slug),
    enabled: !!slug,
    staleTime: 60000,
  });
}

export function useClinicDoctor(slug: string, doctorId: string) {
  return useQuery({
    queryKey: ['public-clinic-doctor', slug, doctorId],
    queryFn: () => publicService.getClinicDoctor(slug, doctorId),
    enabled: !!slug && !!doctorId,
    staleTime: 60000,
  });
}

export function useCities() {
  return useQuery({
    queryKey: ['public-cities'],
    queryFn: () => publicService.getCities(),
    staleTime: 3600000, // 1 час (города не меняются часто)
  });
}

export function useCreatePublicAppointment() {
  return useMutation({
    mutationFn: (data: any) => publicService.createAppointment(data),
  });
}

export function usePatientsForTestimonials(limit: number = 3) {
  return useQuery({
    queryKey: ['public-testimonials-patients', limit],
    queryFn: () => publicService.getPatientsForTestimonials(limit),
    staleTime: 300000, // 5 минут
  });
}

export function useClinicPatients(slug: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['public-clinic-patients', slug, params],
    queryFn: () => publicService.getClinicPatients(slug, params),
    enabled: !!slug,
    staleTime: 60000, // 1 минута
  });
}


