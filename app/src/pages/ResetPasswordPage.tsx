import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { buildForgotPasswordPath, buildPathWithRedirect, getRedirectFromSearchParams } from '@/lib/authRedirect';
import {
  getPasswordRequirementChecks,
  getPasswordValidationMessage,
} from '@/lib/passwordSecurity';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Status = 'verifying' | 'ready' | 'success' | 'error';
const PASSWORD_RECOVERY_SESSION_KEY = 'passwordRecoveryReady';
const PASSWORD_RECOVERY_SESSION_MAX_AGE_MS = 15 * 60 * 1000;

function formatResetErrorMessage(error: string | null) {
  if (!error) {
    return 'This reset link is missing or invalid. Please request a fresh one.';
  }

  const normalized = error.toLowerCase();
  if (normalized.includes('expired')) {
    return 'This reset link has expired. Request a fresh email and try again.';
  }

  if (normalized.includes('invalid') || normalized.includes('missing')) {
    return 'This reset link is no longer valid. Request a fresh email to continue.';
  }

  if (normalized.includes('already') && normalized.includes('used')) {
    return 'This reset link was already used. Please request another one if you still need access.';
  }

  return error;
}

function isFreshOtpSession(accessToken?: string | null) {
  if (!accessToken) return false;

  try {
    const [, payloadSegment] = accessToken.split('.');
    if (!payloadSegment) return false;

    const payload = JSON.parse(atob(payloadSegment));
    const amr = Array.isArray(payload?.amr) ? payload.amr : [];
    const issuedAt = typeof payload?.iat === 'number' ? payload.iat : 0;
    const usedOtp = amr.some((entry: { method?: string } | null) => entry?.method === 'otp');

    return usedOtp && issuedAt > 0 && Date.now() / 1000 - issuedAt < 5 * 60;
  } catch {
    return false;
  }
}

const recoverySteps = [
  'We validate the secure link from your email.',
  'You choose a new password for your account.',
  'You sign back in and continue with your matches safely.',
];

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const redirectTo = getRedirectFromSearchParams(searchParams);
  const loginPath = buildPathWithRedirect('/login', redirectTo);
  const requestNewLinkPath = buildForgotPasswordPath(undefined, redirectTo);
  const authCode = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const verificationType = searchParams.get('type');
  const errorDescription =
    searchParams.get('error_description') ?? searchParams.get('error') ?? searchParams.get('message');
  const hashParams = useMemo(
    () => new URLSearchParams(window.location.hash.replace(/^#/, '')),
    [],
  );
  const hasRecoveryHash = hashParams.get('type') === 'recovery';
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const cleanResetPath = buildPathWithRedirect('/reset-password', redirectTo);
  const passwordChecks = getPasswordRequirementChecks(newPassword, {
    confirmPassword,
    email: recoveryEmail,
  });

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer: number | null = null;
    const markRecoverySessionReady = (sessionEmail?: string | null) => {
      sessionStorage.setItem(PASSWORD_RECOVERY_SESSION_KEY, Date.now().toString());
      setRecoveryEmail(sessionEmail ?? '');
    };

    const clearRecoverySessionReady = () => {
      sessionStorage.removeItem(PASSWORD_RECOVERY_SESSION_KEY);
    };

    const markReady = () => {
      if (cancelled) return;
      setStatus('ready');

      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (window.location.hash || currentUrl !== cleanResetPath) {
        navigate(cleanResetPath, { replace: true });
      }
    };

    const markError = (message: string) => {
      if (cancelled) return;
      clearRecoverySessionReady();
      setStatus('error');
      setErrorMessage(message);
    };

    if (errorDescription) {
      markError(formatResetErrorMessage(errorDescription));
      return () => {
        cancelled = true;
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;

      if (event === 'PASSWORD_RECOVERY' || (hasRecoveryHash && event === 'SIGNED_IN')) {
        if (fallbackTimer) {
          window.clearTimeout(fallbackTimer);
        }
        markRecoverySessionReady(session.user.email);
        markReady();
      }
    });

    (async () => {
      if (tokenHash && verificationType === 'recovery') {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });

        if (error || !data.session) {
          markError(formatResetErrorMessage(error?.message ?? null));
          return;
        }

        markRecoverySessionReady(data.session.user.email);
        markReady();
        return;
      }

      if (authCode) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

        if (error || !data.session) {
          markError(formatResetErrorMessage(error?.message ?? null));
          return;
        }

        markRecoverySessionReady(data.session.user.email);
        markReady();
        return;
      }

      if (hasRecoveryHash && accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error || !data.session) {
          markError(formatResetErrorMessage(error?.message ?? null));
          return;
        }

        markRecoverySessionReady(data.session.user.email);
        markReady();
        return;
      }

      const storedRecoveryTimestamp = Number(sessionStorage.getItem(PASSWORD_RECOVERY_SESSION_KEY));
      const hasStoredRecoverySession =
        Number.isFinite(storedRecoveryTimestamp) &&
        Date.now() - storedRecoveryTimestamp < PASSWORD_RECOVERY_SESSION_MAX_AGE_MS;
      const { data: { session } } = await supabase.auth.getSession();
      if (hasRecoveryHash && session) {
        markRecoverySessionReady(session.user.email ?? '');
        markReady();
        return;
      }

      if (hasStoredRecoverySession && session) {
        setRecoveryEmail(session.user.email ?? '');
        markReady();
        return;
      }

      if (session && isFreshOtpSession(session.access_token)) {
        markRecoverySessionReady(session.user.email ?? '');
        markReady();
        return;
      }

      if (!hasStoredRecoverySession || !session) {
        clearRecoverySessionReady();
      }

      if (hasRecoveryHash) {
        fallbackTimer = window.setTimeout(() => {
          markError('We could not validate this reset link. Please request a fresh email and try again.');
        }, 5000);
        return;
      }

      markError('This reset page must be opened from your recovery email. Please request a new reset link.');
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, [accessToken, authCode, cleanResetPath, errorDescription, hasRecoveryHash, navigate, refreshToken, tokenHash, verificationType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = getPasswordValidationMessage(newPassword, {
      confirmPassword,
      email: recoveryEmail,
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || 'Failed to update password. Please try again.');
      return;
    }

    sessionStorage.removeItem(PASSWORD_RECOVERY_SESSION_KEY);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      await supabase.auth.signOut({ scope: 'local' });
    }
    setStatus('success');
    toast.success('Password updated. Sign in with your new password.');
    window.setTimeout(() => navigate(loginPath, { replace: true }), 1800);
  };

  return (
    <div className="page-shell px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-6xl gap-4 sm:gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <section className="order-2 glass-dark relative overflow-hidden p-6 sm:p-10 lg:order-1">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,193,141,0.22),transparent_36%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <Link to="/" className="inline-flex items-center gap-3 transition-transform active:scale-95">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-xl shadow-black/10">
                  <Heart className="h-5 w-5 fill-white" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-white">Soulmate</p>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white/50">Modern Indian Matchmaking</p>
                </div>
              </Link>

              <div className="mt-8">
                <span className="eyebrow border-white/10 bg-white/10 text-white/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Secure reset
                </span>
              </div>

              <h1 className="mt-5 text-[clamp(2.4rem,8vw,4.1rem)] font-bold italic leading-[1.08] tracking-tight text-white sm:mt-6">
                Set a fresh password and return with confidence.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                This screen only works with the secure recovery link from your email, so you can reset access without exposing your account.
              </p>

              <div className="mt-8 space-y-3 sm:mt-10">
                {recoverySteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/8"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-[#efc18d]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-white/80">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 rounded-[30px] border border-white/10 bg-white/6 p-5 sm:mt-12">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldCheck className="h-5 w-5 text-[#efc18d]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Security note</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    If you did not request this reset, close the page and ignore the email. Your current password stays unchanged until you save a new one.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 glass-card flex flex-col justify-center p-6 sm:p-10 lg:order-2 lg:p-14">
          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-xl">
            <header>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#8c7c6c]">Password reset</p>

              {status === 'verifying' && (
                <>
                  <h2 className="mt-4 text-[clamp(2rem,7vw,3.6rem)] font-bold tracking-tight text-[#1f2330]">
                    Preparing secure access...
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#62584d] sm:text-lg">
                    We are validating the recovery link from your email now.
                  </p>
                </>
              )}

              {status === 'ready' && (
                <>
                  <h2 className="mt-4 text-[clamp(2rem,7vw,3.6rem)] font-bold tracking-tight text-[#1f2330]">
                    Choose your new password.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#62584d] sm:text-lg">
                    Pick a strong password you have not used elsewhere, then sign in again with it.
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <h2 className="mt-4 text-[clamp(2rem,7vw,3.6rem)] font-bold tracking-tight text-[#1f2330]">
                    Password updated.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#62584d] sm:text-lg">
                    Your account is secure again. We are sending you back to sign in.
                  </p>
                </>
              )}

              {status === 'error' && (
                <>
                  <h2 className="mt-4 text-[clamp(2rem,7vw,3.6rem)] font-bold tracking-tight text-[#1f2330]">
                    Link could not be used.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#62584d] sm:text-lg">{errorMessage}</p>
                </>
              )}
            </header>

            {status === 'verifying' && (
              <div className="mt-10 rounded-[26px] border border-[#eadbcc] bg-[#fcf8f3] p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#f3e5d6] text-[#b84f45]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1f2330]">Checking your recovery session</p>
                    <p className="mt-1 text-sm leading-6 text-[#62584d]">This usually takes just a moment.</p>
                  </div>
                </div>
              </div>
            )}

            {status === 'ready' && (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6 sm:mt-10">
                <input
                  type="email"
                  name="email"
                  value={recoveryEmail}
                  autoComplete="username"
                  readOnly
                  tabIndex={-1}
                  className="sr-only"
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <label className="block px-1 text-sm font-bold text-[#1f2330]">New Password</label>
                  <div className="relative group">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8c7c6c] transition-colors group-focus-within:text-[#b84f45]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-surface pl-12 pr-12 transition-all hover:bg-[#fcf8f3] focus:ring-4 focus:ring-[#b84f45]/10"
                      placeholder="Create a strong new password"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c7c6c] transition-colors hover:text-[#1f2330]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block px-1 text-sm font-bold text-[#1f2330]">Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8c7c6c] transition-colors group-focus-within:text-[#b84f45]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-surface pl-12 transition-all hover:bg-[#fcf8f3] focus:ring-4 focus:ring-[#b84f45]/10"
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#eadbcc] bg-[#fcf8f3] p-4">
                  <p className="text-sm font-semibold text-[#1f2330]">Before you save</p>
                  <div className="mt-3 grid gap-2 text-sm text-[#62584d]">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-3">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            check.passed ? 'bg-[#4b7165]' : 'bg-[#d8c9ba]'
                          }`}
                        />
                        <span>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || passwordChecks.some((check) => !check.passed)}
                  className="btn-primary w-full shadow-lg shadow-[#b84f45]/16 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving new password...
                    </>
                  ) : (
                    <>
                      Update password
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {status === 'success' && (
              <div className="mt-10 space-y-4">
                <div className="rounded-[26px] border border-[#d7e8dc] bg-[#eff7f2] p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white text-[#4b7165] shadow-sm">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1f2330]">Your password has been saved</p>
                      <p className="mt-1 text-sm leading-6 text-[#62584d]">Use it on the next sign-in screen.</p>
                    </div>
                  </div>
                </div>

                <Link to={loginPath} className="btn-primary w-full">
                  Sign in now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-10 flex flex-col gap-3">
                <Link to={requestNewLinkPath} className="btn-primary w-full">
                  Request a new reset link
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={loginPath}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[#d9caba] px-5 py-3.5 text-sm font-semibold text-[#62584d] transition-colors hover:border-[#c9b6a1] hover:text-[#1f2330]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            )}

            <div className="mt-10 flex items-center justify-center gap-2 text-xs text-[#8c7c6c]">
              {status === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#4b7165]" />
              ) : status === 'error' ? (
                <XCircle className="h-3.5 w-3.5 text-[#b84f45]" />
              ) : (
                <Heart className="h-3.5 w-3.5 fill-current text-[#b84f45]" />
              )}
              <span>Soulmate secure account recovery</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
