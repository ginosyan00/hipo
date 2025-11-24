import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';

/**
 * React Query Hooks для аутентификации
 */

/**
 * Изменить пароль текущего пользователя (для всех ролей)
 */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.updatePassword(currentPassword, newPassword),
  });
}

