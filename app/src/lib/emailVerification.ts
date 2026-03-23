import type { User as SupabaseUser } from '@supabase/supabase-js';
import { buildEmailVerificationRedirect } from '@/lib/authRedirect';
import { supabase } from '@/lib/supabase';
import type { AccountStatus, User } from '@/types';


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function buildPendingEmailVerificationStatus(): AccountStatus {
  return {
    emailVerified: false,
    emailVerificationRequired: true,
    emailVerificationSentAt: new Date(),
    emailVerifiedAt: null,
  };
}

export function buildVerifiedEmailVerificationStatus(
  existing?: Partial<AccountStatus> | null,
): AccountStatus {
  return {
    emailVerified: true,
    emailVerificationRequired: false,
    emailVerificationSentAt: existing?.emailVerificationSentAt ?? null,
    emailVerifiedAt: new Date(),
  };
}

export function isEmailVerificationPending(user?: Partial<User> | null) {
  return user?.accountStatus?.emailVerificationRequired === true && user.accountStatus.emailVerified === false;
}

export function getPendingProfileFromAuthUser(authUser: SupabaseUser): Partial<User> {
  const metadata = isRecord(authUser.user_metadata) ? authUser.user_metadata : {};
  const pendingFromMetadata = isRecord(metadata.pendingProfile)
    ? (metadata.pendingProfile as Partial<User>)
    : {};

  return pendingFromMetadata;
}

export async function sendEmailVerificationLink(email: string, redirectTo?: string | null) {
  const emailRedirectTo = buildEmailVerificationRedirect(redirectTo);

  // OTP (magic link) works for both confirmed and unconfirmed emails — try it first
  // to avoid the 422 that `resend({ type: 'signup' })` throws on already-confirmed accounts.
  const magicLinkResult = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
      shouldCreateUser: false,
    },
  });

  if (!magicLinkResult.error) {
    return { ok: true as const, channel: 'magic-link' as const };
  }

  // Fallback: try the signup-resend path (works for unconfirmed emails only)
  const resendResult = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo },
  });

  if (!resendResult.error) {
    return { ok: true as const, channel: 'signup' as const };
  }

  return {
    ok: false as const,
    error:
      magicLinkResult.error.message ||
      resendResult.error.message ||
      'We could not send a verification email right now.',
  };
}
