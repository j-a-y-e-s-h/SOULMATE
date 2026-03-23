import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, Heart, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import {
  buildForgotPasswordPath,
  buildPathWithRedirect,
  buildPendingVerificationPath,
  getRedirectFromSearchParams,
} from '@/lib/authRedirect';
import { normalizeEmailAddress } from '@/lib/passwordSecurity';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const trustPoints = [
  'Profiles built around family values, intent, and long-term fit',
  'Detailed introductions with calmer, more trustworthy flow',
  'Safer contact rules and stronger momentum after interest acceptance',
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isNotRegistered, setIsNotRegistered] = useState(false);

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getRedirectFromSearchParams(searchParams);
  const registerPath = buildPathWithRedirect('/register', redirectTo);
  const forgotPasswordPath = buildForgotPasswordPath(undefined, redirectTo);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsNotRegistered(false);

    if (!email || !password) {
      setError('Please enter both your email and password');
      triggerShake();
      return;
    }

    const normalizedEmail = normalizeEmailAddress(email);
    const result = await login(normalizedEmail, password);
    if (result.ok) {
      toast.success('Welcome back to Soulmate!');
      navigate(redirectTo, { replace: true });
    } else if (result.confirmEmail) {
      toast.info('Please verify your email to finish signing in.');
      navigate(buildPendingVerificationPath(normalizedEmail, redirectTo), { replace: true });
    } else if (result.notRegistered) {
      setIsNotRegistered(true);
    } else {
      setError(result.error || 'Sign in failed. Please check your credentials.');
      triggerShake();
    }
  };

  return (
    <div className="page-shell px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-6xl gap-4 sm:gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        {/* Left Side - Hero / Context */}
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
                  Continue your journey
                </span>
              </div>

              <h1 className="mt-5 text-[clamp(2.4rem,8vw,4.2rem)] font-bold italic leading-[1.1] tracking-tight text-white sm:mt-6">
                Return to refined <span className="text-[#efc18d]">connections</span>.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                Sign in to review new introductions, respond to messages, and keep your profile moving forward with intention.
              </p>

              <div className="mt-8 space-y-3 sm:mt-10">
                {trustPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/8">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 shadow-lg shadow-black/10">
                      <Check className="h-4 w-4 text-[#efc18d]" />
                    </div>
                    <p className="text-sm leading-6 text-white/80">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 overflow-hidden rounded-[32px] ring-1 ring-white/10 sm:mt-12">
              <img
                src="/hero_dock_couple.jpg"
                alt="Couple enjoying a quiet moment"
                className="h-48 w-full object-cover opacity-85 transition-transform duration-700 hover:scale-105 sm:h-80"
              />
            </div>
          </div>
        </section>

        {/* Right Side - Login Form */}
        <section className="order-1 glass-card flex flex-col justify-center p-6 sm:p-10 lg:order-2 lg:p-14">
          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-xl">
            <header>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#8c7c6c]">Secure Access</p>
              <h2 className="mt-4 text-[clamp(2rem,7vw,3.6rem)] font-bold tracking-tight text-[#1f2330]">Good to see you.</h2>
              <p className="mt-4 text-sm leading-7 text-[#62584d] sm:text-lg">
                Sign in to your account with your email.
              </p>
            </header>

            {isNotRegistered && (
              <div className="animate-slide-down-fade mt-6 rounded-[22px] border border-[#d26852]/30 bg-[#fff2ee] px-5 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#d26852]" />
                  <div>
                    <p className="text-[0.92rem] font-semibold text-[#b84f45]">
                      No account found with this email.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#8c7c6c]">
                      You haven't registered yet.{' '}
                      <Link
                        to={registerPath}
                        className="font-bold text-[#b84f45] underline underline-offset-2 transition-opacity hover:opacity-75"
                      >
                        Register for free →
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                className={`mt-6 rounded-[22px] border border-[#d26852]/20 bg-[#fff2ee] px-4 py-3.5 text-[0.92rem] font-medium text-[#b84f45] shadow-sm ${
                  isShaking ? 'animate-shake' : ''
                }`}
              >
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
                    onChange={(e) => { setEmail(e.target.value); setIsNotRegistered(false); }}
                    className={`input-surface pl-12 transition-all hover:bg-[#fcf8f3] focus:ring-4 focus:ring-[#b84f45]/10 ${
                      error && !email ? 'input-error' : ''
                    }`}
                    placeholder="Enter your registered email"
                    autoComplete="email"
                    autoCapitalize="none"
                    inputMode="email"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="block text-sm font-bold text-[#1f2330]">Password</label>
                  <Link
                    to={forgotPasswordPath}
                    className="text-xs font-bold text-[#b84f45] transition-opacity hover:opacity-80"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8c7c6c] transition-colors group-focus-within:text-[#b84f45]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`input-surface pl-12 pr-12 transition-all hover:bg-[#fcf8f3] focus:ring-4 focus:ring-[#b84f45]/10 ${
                      error && !password ? 'input-error' : ''
                    }`}
                    placeholder="Enter your security password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c7c6c] transition-colors hover:text-[#1f2330]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-1 py-1">
                <div className="relative flex h-5 w-5 items-center justify-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer absolute h-full w-full cursor-pointer opacity-0 shadow-none ring-0"
                  />
                  <div className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-lg border-2 border-[#d9caba] bg-transparent transition-all peer-checked:border-[#1f2330] peer-checked:bg-[#1f2330]">
                    <Check className="h-3 w-3 scale-0 text-white transition-transform duration-200 peer-checked:scale-100" />
                  </div>
                </div>
                <label htmlFor="rememberMe" className="cursor-pointer text-[0.92rem] font-medium text-[#62584d] select-none hover:text-[#1f2330]">
                  Remember me on this device
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full shadow-lg shadow-[#b84f45]/16 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign in to Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="soft-divider my-10" />

            <footer className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.92rem] text-[#62584d]">
                No account yet?{' '}
                <Link to={registerPath} className="font-bold text-[#b84f45] transition-opacity hover:opacity-80">
                  Register free
                </Link>
              </p>
              <Link to="/" className="text-[0.92rem] font-bold text-[#62584d] transition-colors hover:text-[#1f2330]">
                Back to Site
              </Link>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
