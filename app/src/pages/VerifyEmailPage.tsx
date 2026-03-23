import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Heart, Loader2, Mail, XCircle } from 'lucide-react';
import { buildPathWithRedirect, getRedirectFromSearchParams } from '@/lib/authRedirect';
import {
  buildVerifiedEmailVerificationStatus,
  getPendingProfileFromAuthUser,
  sendEmailVerificationLink,
} from '@/lib/emailVerification';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { createDefaultUser } from '@/lib/demoData';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/types';

type Status = 'pending' | 'verifying' | 'success' | 'error';
type SupportedVerificationType = 'email' | 'signup' | 'magiclink';

function isSupportedVerificationType(value: string | null): value is SupportedVerificationType {
  return value === 'email' || value === 'signup' || value === 'magiclink';
}

function formatAuthErrorMessage(error: string | null) {
  if (!error) {
    return 'Invalid or missing verification link. Please request a new one.';
  }

  const normalizedError = error.toLowerCase();

  if (normalizedError.includes('expired')) {
    return 'This verification link has expired. Please request a fresh one below.';
  }

  if (normalizedError.includes('invalid') || normalizedError.includes('missing')) {
    return 'This verification link is no longer valid. Please request a fresh one below.';
  }

  if (normalizedError.includes('already') && normalizedError.includes('used')) {
    return 'This verification link was already used. Try signing in, or request a fresh link if you still cannot access your account.';
  }

  return error;
}

async function createOrFetchProfile(user: SupabaseUser) {
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('profile_data')
    .eq('id', user.id)
    .maybeSingle();

  const pendingData = getPendingProfileFromAuthUser(user);
  const verifiedAccountStatus = buildVerifiedEmailVerificationStatus(
    (profileRow?.profile_data as Partial<User> | undefined)?.accountStatus,
  );

  let resolvedUser: User;
  if (!profileRow) {
    resolvedUser = createDefaultUser(user.email ?? '', {
      ...pendingData,
      id: user.id,
      email: user.email ?? '',
      accountStatus: verifiedAccountStatus,
    });
  } else {
    resolvedUser = createDefaultUser(user.email ?? '', {
      ...(profileRow.profile_data as Partial<User>),
      id: user.id,
      email: user.email ?? '',
      accountStatus: verifiedAccountStatus,
    });
  }

  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? '',
    profile_data: resolvedUser,
  });

  return resolvedUser;
}

const RESEND_COOLDOWN = 60; // seconds
const RESEND_TS_KEY = 'resendEmailSentAt';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState<number>(() => {
    const ts = sessionStorage.getItem(RESEND_TS_KEY);
    if (!ts) return 0;
    const elapsed = Math.floor((Date.now() - Number(ts)) / 1000);
    return Math.max(0, RESEND_COOLDOWN - elapsed);
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = getRedirectFromSearchParams(searchParams);
  const tokenHash = searchParams.get('token_hash');
  const authCode = searchParams.get('code');
  const verificationType = searchParams.get('type');
  const mode = searchParams.get('mode');
  const pendingVerificationEmail = useAuthStore((state) => state.pendingVerificationEmail);
  const email = searchParams.get('email') ?? pendingVerificationEmail ?? '';
  const errorDescription =
    searchParams.get('error_description') ?? searchParams.get('error') ?? searchParams.get('message');
  const loginPath = buildPathWithRedirect('/login', redirectTo);
  const registerPath = buildPathWithRedirect('/register', redirectTo);
  const successPath = redirectTo;
  const successLabel = redirectTo === '/dashboard' ? 'Go to Dashboard' : 'Continue';

  useEffect(() => {
    let redirectTimer: number | null = null;
    let cancelled = false;

    const completeVerification = async (verifiedUser: SupabaseUser) => {
      const resolvedUser = await createOrFetchProfile(verifiedUser);
      if (cancelled) return;

      sessionStorage.removeItem('pendingVerificationEmail');
      useAuthStore.setState({
        user: resolvedUser,
        isAuthenticated: true,
        requiresEmailVerification: false,
        pendingVerificationEmail: null,
        isLoading: false,
      });
      setStatus('success');
      toast.success('Email verified! Welcome to Soulmate.');
      redirectTimer = window.setTimeout(() => navigate(redirectTo, { replace: true }), 1500);
    };

    if (errorDescription) {
      setStatus('error');
      setErrorMessage(formatAuthErrorMessage(errorDescription));
      return;
    }

    // --- Path 1: OTP flow — Supabase redirected with ?token_hash=...&type=email|signup|magiclink ---
    if (tokenHash && isSupportedVerificationType(verificationType)) {
      (async () => {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: verificationType,
        });

        if (error || !data.session) {
          setStatus('error');
          setErrorMessage(formatAuthErrorMessage(error?.message ?? null));
          return;
        }

        await completeVerification(data.session.user);
      })();
      return () => {
        cancelled = true;
        if (redirectTimer) {
          window.clearTimeout(redirectTimer);
        }
      };
    }

    // --- Path 2: PKCE flow — Supabase redirected with ?code=... ---
    if (authCode) {
      (async () => {
        const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

        if (error || !data.session) {
          setStatus('error');
          setErrorMessage(formatAuthErrorMessage(error?.message ?? null));
          return;
        }

        await completeVerification(data.session.user);
      })();
      return () => {
        cancelled = true;
        if (redirectTimer) {
          window.clearTimeout(redirectTimer);
        }
      };
    }

    // --- Path 3+: Explicit pending state after registration ---
    if (mode === 'pending' && email) {
      setStatus('pending');
      return;
    }

    // --- Path 4: No URL params — SDK may have auto-consumed the PKCE code, or this is a
    //             hash/implicit flow where the SDK fires SIGNED_IN. Check for an existing
    //             session immediately, and also listen for SIGNED_IN in case the exchange
    //             is still in progress. Fall back to pending/error after 6 s. ---
    let fallback: number = 0;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        window.clearTimeout(fallback);
        await completeVerification(session.user);
      }
    });

    // Also check immediately — code may already be exchanged
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session?.user) return;
      subscription.unsubscribe();
      window.clearTimeout(fallback);
      completeVerification(session.user);
    });

    fallback = window.setTimeout(() => {
      if (cancelled) return;
      subscription.unsubscribe();
      if (email && useAuthStore.getState().requiresEmailVerification) {
        setStatus('pending');
      } else {
        setStatus('error');
        setErrorMessage('Invalid or missing verification link. Please request a new one.');
      }
    }, 6000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(fallback);
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [authCode, email, errorDescription, mode, navigate, redirectTo, tokenHash, verificationType]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      toast.error('Missing email address. Please register again.');
      return;
    }

    setIsResending(true);
    const result = await sendEmailVerificationLink(email, redirectTo);
    setIsResending(false);

    if (!result.ok) {
      toast.error(result.error || 'We could not resend the email link.');
      return;
    }

    sessionStorage.setItem(RESEND_TS_KEY, String(Date.now()));
    setCooldown(RESEND_COOLDOWN);
    toast.success(
      result.channel === 'signup'
        ? `A fresh verification email has been sent to ${email}.`
        : `A fresh verification magic link has been sent to ${email}.`,
    );
  };

  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-10 text-center sm:p-14">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3e5d6] text-[#b84f45]">
          {status === 'pending' ? (
            <Mail className="h-8 w-8" />
          ) : status === 'verifying' ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : status === 'success' ? (
            <CheckCircle2 className="h-8 w-8 text-[#4b7165]" />
          ) : (
            <XCircle className="h-8 w-8 text-[#b84f45]" />
          )}
        </div>

        {status === 'pending' && (
          <>
            <h1 className="text-3xl font-bold text-[#1f2330]">Check your email</h1>
            <p className="mt-4 text-sm leading-7 text-[#62584d]">
              We sent a secure sign-in link to <span className="font-semibold text-[#1f2330]">{email}</span>.
              Open it to activate your Soulmate account, and we will take you straight to your dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || cooldown > 0}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4" />
                    Resend in {cooldown}s
                  </>
                ) : (
                  <>
                    Resend email link
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('pendingVerificationEmail');
                  useAuthStore.setState({ requiresEmailVerification: false, pendingVerificationEmail: null });
                  navigate(loginPath);
                }}
                className="btn-secondary"
              >
                Already verified? Sign in
              </button>
            </div>
          </>
        )}

        {status === 'verifying' && (
          <>
            <h1 className="text-3xl font-bold text-[#1f2330]">Verifying your email…</h1>
            <p className="mt-4 text-sm leading-7 text-[#62584d]">
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-3xl font-bold text-[#1f2330]">Email verified!</h1>
            <p className="mt-4 text-sm leading-7 text-[#62584d]">
              Your account is now active. Redirecting you now…
            </p>
            <Link to={successPath} className="btn-primary mx-auto mt-8 w-fit">
              {successLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-3xl font-bold text-[#1f2330]">Verification failed</h1>
            <p className="mt-4 text-sm leading-7 text-[#62584d]">{errorMessage}</p>
            <div className="mt-8 flex flex-col gap-3">
              {email ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || cooldown > 0}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending a new link...
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <Loader2 className="h-4 w-4" />
                      Resend in {cooldown}s
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send a fresh verification link
                    </>
                  )}
                </button>
              ) : (
                <Link to={registerPath} className="btn-primary">
                  <Mail className="h-4 w-4" />
                  Register again
                </Link>
              )}
              <Link to={loginPath} className="btn-secondary">
                Back to sign in
              </Link>
            </div>
          </>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-[#8c7c6c]">
          <Heart className="h-3 w-3 fill-current text-[#b84f45]" />
          <span>Soulmate · Modern Indian Matchmaking</span>
        </div>
      </div>
    </div>
  );
}
