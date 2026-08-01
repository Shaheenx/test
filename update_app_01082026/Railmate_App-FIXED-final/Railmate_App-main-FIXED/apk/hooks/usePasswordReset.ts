import { useMutation } from '@tanstack/react-query';
import {
  requestPasswordReset,
  verifyPasswordResetOtp,
  updatePasswordAfterReset,
} from '@/api/passwordReset';

export const useRequestPasswordReset = () =>
  useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });

export const useVerifyResetOtp = () =>
  useMutation({
    mutationFn: ({ email, token }: { email: string; token: string }) =>
      verifyPasswordResetOtp(email, token),
  });

export const useUpdatePasswordAfterReset = () =>
  useMutation({
    mutationFn: (newPassword: string) => updatePasswordAfterReset(newPassword),
  });
