import { supabase } from '@/lib/supabase';

/**
 * Password reset — OTP flow (replaces the broken link-based flow).
 *
 * Requires a one-time Dashboard change: Authentication > Email Templates >
 * Reset Password must use {{ .Token }} instead of {{ .ConfirmationURL }}.
 * See the setup note shared alongside this file.
 */

/**
 * Step 1 — Request a reset code.
 * Triggers Supabase to email a 6-digit OTP (once the template is switched
 * to {{ .Token }}). Supabase enforces a 60s cooldown between calls for the
 * same email — surface `error.message` to the user if they resend too fast.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase()
  );
  if (error) throw error;
}

/**
 * Step 2 — Verify the 6-digit code the user typed in.
 * On success, supabase-js persists an authenticated "recovery" session
 * client-side (and fires a PASSWORD_RECOVERY auth state change event —
 * see setup note if you have a global onAuthStateChange listener).
 */
export async function verifyPasswordResetOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'recovery',
  });
  if (error) throw error;
  return data;
}

/**
 * Step 3 — Set the new password.
 * Requires the recovery session from verifyPasswordResetOtp() to still be
 * active in the client, which it is immediately after that call resolves.
 */
export async function updatePasswordAfterReset(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data;
}
