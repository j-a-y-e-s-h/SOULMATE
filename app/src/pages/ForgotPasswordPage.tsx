import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Heart,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { buildPathWithRedirect, getRedirectFromSearchParams } from '@/lib/authRedirect';
import { maskEmailAddress, normalizeEmailAddress } from '@/lib/passwordSecurity';
import { useAuthStore } from '@/store/authStore';

const reassurancePoints = [
  {
    icon: ShieldCheck,
    title: 'Private by default',
    description: 'We only deliver a reset link to the inbox already attached to the account.',
  },
  {
    icon: Clock3,
    title: 'Time-limited access',
    description: 'Every recovery link expires automatically so stale emails cannot be reused later.',
  },
  {
    icon: KeyRound,
    title: 'Continue your journey',
    description: 'Once your password is updated, you can sign back in and return to your matches safely.',
  },
];

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = getRedirectFromSearchParams(searchParams);
  const loginPath = buildPathWithRedirect('/login', redirectTo);
  const registerPath = buildPathWithRedirect('/register', redirectTo);

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { resetPassword, isLoading } = useAuthStore();

  useEffect(() => {
    if (resendCooldown === 0) return;

    const interval = window.setInterval(() => {
      setResendCooldown((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmailAddress(email);

    if (!normalizedEmail) {
      setError('Enter the email address linked to your account.');
      return;
    }

    setError('');
    const result = await resetPassword(normalizedEmail, redirectTo);

    if (!result.ok) {
      setError(result.error || 'We could not send the reset email right now. Please try again in a moment.');
      return;
    }

    setSubmittedEmail(normalizedEmail);
    setIsSubmitted(true);
    setResendCooldown(30);
  };

  const handleResend = async () => {
    if (!submittedEmail || resendCooldown > 0) return;

    setError('');
    const result = await resetPassword(submittedEmail, redirectTo);
    if (!result.ok) {
      setError(result.error || 'We could not send another reset email right now. Please try again shortly.');
      return;
    }

    setResendCooldown(30);
  };

  const maskedSubmittedEmail = maskEmailAddress(submittedEmail);

  return (
    <div className="page-shell px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-6xl gap-4 sm:gap-6 lg:grid-cols-[0.95fr_1.05fr]">
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
                  Password recovery
                </span>
              </div>

              <h1 className="mt-5 text-[clamp(2.4rem,8vw,4.1rem)] font-bold italic leading-[1.08] tracking-tight text-white sm:mt-6">
                Restore access with calm, secure steps.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                We will email a secure recovery link so you can set a fresh password without losing your place in the conversation.
              </p>

              <div className="mt-8 grid gap-3 sm:mt-10">
                {reassurancePoints.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="rounded-[26px] border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/8"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                        <Icon className="h-5 w-5 text-[#efc18d]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-white/72">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 overflow-hidden rounded-[32px] ring-1 ring-white/10 sm:mt-12">
              <img
                src="/hero_dock_couple.jpg"
                alt="Couple sharing a quiet moment together"
                className="h-48 w-full object-cover opacity-85 transition-transform duration-700 hover:scale-105 sm:h-80"
              />
            </div>
          </div>
        </section>

        <section className="order-1 glass-card flex flex-col justify-center p-6 sm:p-10 lg:order-2 lg:p-14">
          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-xl">
            {!isSubmitted ? (
              <>
                <header>
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#8c7c6c]">Account recovery</p>
                  <h2 className="mt-4 text-[clamp(2rem,7vw,3.6rem)] font-bold tracking-tight text-[#1f2330]">
                    Forgot your password?
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#62584d] sm:text-lg">
                    Enter the email on your profile and we will send a reset link to continue securely.
                  </p>
                </header>

                {error && (
                  <div className="mt-6 rounded-[22px] border border-[#d26852]/20 bg-[#fff2ee] px-4 py-3.5 text-[0.92rem] font-medium text-[#b84f45] shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#d26852]" />
                      {error}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6 sm:mt-10">
                  <div className="space-y-2">
                    <label className="block px-1 text-sm font-bold text-[#1f2330]">Email Address</label>
                    <div className="relative group">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8c7c6c] transition-colors group-focus-within:text-[#b84f45]" />
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-surface pl-12 transition-all hover:bg-[#fcf8f3] focus:ring-4 focus:ring-[#b84f45]/10"
                        placeholder="Enter your registered email"
                        autoComplete="email"
                        autoCapitalize="none"
                        inputMode="email"
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full shadow-lg shadow-[#b84f45]/16 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending secure link...
                      </>
                    ) : (
                      <>
                        Send reset link
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="soft-divider my-10" />

                <footer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link to={loginPath} className="inline-flex items-center gap-2 text-[0.92rem] font-bold text-[#62584d] transition-colors hover:text-[#1f2330]">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Link>
                  <p className="text-[0.92rem] text-[#62584d]">
                    Need an account?{' '}
                    <Link to={registerPath} className="font-bold text-[#b84f45] transition-opacity hover:opacity-80">
                      Register free
                    </Link>
                  </p>
                </footer>
              </>
            ) : (
              <>
                <header>
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#eff7f2] text-[#4b7165] shadow-sm">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <p className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#8c7c6c]">Inbox check</p>
                  <h2 className="mt-4 text-[clamp(2rem,7vw,3.6rem)] font-bold tracking-tight text-[#1f2330]">
                    Reset link sent.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#62584d] sm:text-lg">
                    If a Soulmate account exists for <span className="font-semibold text-[#1f2330]">{maskedSubmittedEmail}</span>, a secure password reset email is on its way now.
                  </p>
                </header>

                <div className="mt-8 rounded-[26px] border border-[#eadbcc] bg-[#fcf8f3] p-5">
                  <p className="text-sm font-semibold text-[#1f2330]">What happens next</p>
                  <div className="mt-4 grid gap-3 text-sm leading-6 text-[#62584d]">
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-[#b84f45]" />
                      Open the email and tap the reset button.
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-[#b84f45]" />
                      Set a new password on the next screen.
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-[#b84f45]" />
                      Sign back in and continue with your matches and messages.
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading || resendCooldown > 0}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending again...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        Resend in {resendCooldown}s
                        <Clock3 className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Resend email
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <Link
                    to={loginPath}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[#d9caba] px-5 py-3.5 text-sm font-semibold text-[#62584d] transition-colors hover:border-[#c9b6a1] hover:text-[#1f2330]"
                  >
                    Back to Sign In
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setError('');
                  }}
                  className="mt-4 text-sm font-semibold text-[#b84f45] transition-opacity hover:opacity-80"
                >
                  Use another email address
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
