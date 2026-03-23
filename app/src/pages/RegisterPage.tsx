import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { buildPathWithRedirect, buildPendingVerificationPath, getRedirectFromSearchParams } from '@/lib/authRedirect';
import { communityOptions, motherTongueOptions } from '@/lib/demoData';
import {
  getPasswordStrengthScore,
  getPasswordValidationMessage,
  normalizeEmailAddress,
} from '@/lib/passwordSecurity';
import { StyledSelectField, type StyledSelectOption } from '@/components/StyledSelectField';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const steps = ['Account', 'Profile', 'Intentions', 'Verify Email'];

const stepDescriptions = [
  'Secure your account and get ready to join.',
  'Add the profile basics Indian members look for first.',
  'Choose the kind of partnership you want to build.',
  'Confirm your inbox before Soulmate opens your dashboard.',
];

const registrationHighlights = [
  'Profiles built around family values & intent',
  'A calmer, more focused matchmaking flow',
  'Built-in privacy controls, contact rules, and email verification',
];

const genderOptions: StyledSelectOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const profileForOptions: StyledSelectOption[] = [
  { value: 'self', label: 'Self' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'friend', label: 'Friend' },
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    gender: '',
    profileFor: 'self',
    location: '',
    motherTongue: '',
    community: '',
    lookingFor: 'marriage',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getRedirectFromSearchParams(searchParams);
  const loginPath = buildPathWithRedirect('/login', redirectTo);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Password strength logic
  const passwordStrength = useMemo(() => {
    return getPasswordStrengthScore(formData.password);
  }, [formData.password]);

  const strengthColor = useMemo(() => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-400';
    if (passwordStrength <= 75) return 'bg-yellow-400';
    return 'bg-green-500';
  }, [passwordStrength]);

  const strengthText = useMemo(() => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  }, [passwordStrength]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    setError('');

    if (currentStep === 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email || !emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        triggerShake();
        return false;
      }

      const passwordError = getPasswordValidationMessage(formData.password, {
        confirmPassword: formData.confirmPassword,
        email: formData.email,
      });
      if (passwordError) {
        setError(passwordError);
        triggerShake();
        return false;
      }
    }

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        triggerShake();
        return false;
      }
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 70) {
        setError('Please enter a valid age between 18 and 70');
        triggerShake();
        return false;
      }
      if (!formData.gender) {
        setError('Please select your gender');
        triggerShake();
        return false;
      }
      if (!formData.motherTongue || !formData.community || !formData.location) {
        setError('Please complete your profile basics to continue');
        triggerShake();
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.agreeToTerms) {
        setError('Please agree to the terms and privacy policy to create your account');
        triggerShake();
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep((step) => Math.max(step - 1, 0));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep()) return;
    const normalizedEmail = normalizeEmailAddress(formData.email);

    const result = await register({
      email: normalizedEmail,
      password: formData.password,
      redirectTo,
      name: formData.name,
      age: parseInt(formData.age, 10),
      gender: formData.gender as 'male' | 'female' | 'other',
      profileFor: formData.profileFor as 'self' | 'son' | 'daughter' | 'brother' | 'sister' | 'friend',
      location: formData.location,
      details: {
        education: 'Bachelors',
        company: '',
        annualIncome: 'Prefer not to say',
        motherTongue: formData.motherTongue,
        community: formData.community,
        familyValues: 'balanced',
        familyBackground: '',
        maritalStatus: 'never-married',
        height: '',
        diet: 'non-vegetarian',
      },
      preferences: {
        lookingFor: formData.lookingFor as 'relationship' | 'marriage' | 'friendship' | 'casual',
        ageRange: [21, 35],
        distance: 25,
        genderPreference: formData.gender === 'male' ? 'female' : 'male',
        verifiedOnly: false,
        preferredMotherTongues: [formData.motherTongue],
        preferredCommunities: [formData.community],
        preferredEducation: [],
        familyValues: ['balanced'],
      },
    });

    if (result.confirmEmail) {
      if (result.ok) {
        toast.success(`Verification email sent to ${normalizedEmail}. Please check your inbox.`);
      } else {
        toast.error(result.error || 'Your account was created, but the verification email needs to be resent.');
      }
      navigate(buildPendingVerificationPath(normalizedEmail, redirectTo), { replace: true });
    } else if (result.ok) {
      toast.success(`Account created for ${normalizedEmail}. Please verify your email to continue.`);
      navigate(buildPendingVerificationPath(normalizedEmail, redirectTo), { replace: true });
    } else {
      const alreadyExists =
        result.error?.toLowerCase().includes('already exists') ||
        result.error?.toLowerCase().includes('already registered');

      if (alreadyExists) {
        // Go back to step 1 so user can see the email field and the error
        setCurrentStep(0);
        setError('An account with this email already exists. Sign in instead?');
        triggerShake();
      } else {
        setError(result.error || 'Registration failed. Please try again.');
        triggerShake();
      }
    }
  };

  return (
    <div className="page-shell px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-6xl gap-4 sm:gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        
        {/* Left Side - Context */}
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
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white/50">Modern Indian Introductions</p>
                </div>
              </Link>

              <div className="mt-10">
                <span className="eyebrow border-white/10 bg-white/10 text-white/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Begin your journey
                </span>
              </div>

              <h1 className="mt-5 text-[clamp(2.4rem,8vw,4.2rem)] font-bold italic leading-[1.1] tracking-tight text-white sm:mt-6">
                Build a profile that feels <span className="text-[#efc18d]">real</span>.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                We capture the details that matter most for serious Indian matchmaking while keeping your setup simple.
              </p>

              <div className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:mt-10">
                <div className="flex items-center justify-between">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-white/40">Step {currentStep + 1} of {steps.length}</p>
                  <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                      <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-[#efc18d]' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-5 text-3xl font-bold tracking-tight text-white">{steps[currentStep]}</p>
                <p className="mt-2 text-[0.92rem] leading-7 text-white/60">{stepDescriptions[currentStep]}</p>
              </div>

              <div className="mt-8 space-y-3">
                {registrationHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/8">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 shadow-lg shadow-black/10">
                      <Check className="h-4 w-4 text-[#efc18d]" />
                    </div>
                    <p className="text-sm leading-6 text-white/80">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 overflow-hidden rounded-[32px] ring-1 ring-white/10 sm:mt-12">
              <img
                src="/cta_field_couple.jpg"
                alt="Couple at golden hour"
                className="h-48 w-full object-cover opacity-85 transition-transform duration-700 hover:scale-105 sm:h-80"
              />
            </div>
          </div>
        </section>

        {/* Right Side - Form */}
        <section className="order-1 glass-card p-6 sm:p-10 lg:order-2 lg:p-14">
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-xl">
              <header>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#8c7c6c]">Membership Setup</p>
                <h2 className="mt-4 text-[clamp(2rem,7vw,3.6rem)] font-bold tracking-tight text-[#1f2330]">Join the Soulmate community.</h2>
                <p className="mt-4 text-sm leading-7 text-[#62584d] sm:text-lg">
                  Setup takes less than 3 minutes. Your journey to a refined connection starts here.
                </p>
              </header>

              <div className="mt-8 flex items-center gap-3">
                {steps.map((_, i) => (
                  <div key={i} className="flex flex-1 items-center gap-2">
                    <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-[#b84f45]' : 'bg-[#eadcca]'}`} />
                  </div>
                ))}
              </div>

              {error && (
                <div
                  className={`mt-6 rounded-[22px] border border-[#d26852]/20 bg-[#fff2ee] px-4 py-3.5 text-[0.92rem] font-medium text-[#b84f45] shadow-sm ${
                    isShaking ? 'animate-shake' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error.includes('Sign in instead?') ? (
                      <span>
                        An account with this email already exists.{' '}
                        <button
                          type="button"
                          onClick={() => navigate(loginPath)}
                          className="underline font-bold hover:opacity-80"
                        >
                          Sign in instead
                        </button>
                      </span>
                    ) : (
                      error
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 sm:mt-10">
                {currentStep === 0 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="space-y-2">
                      <label className="block px-1 text-sm font-bold text-[#1f2330]">Email Address</label>
                      <div className="relative group">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8c7c6c] transition-colors group-focus-within:text-[#b84f45]" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          className={`input-surface pl-12 transition-all hover:bg-[#fcf8f3] focus:ring-4 focus:ring-[#b84f45]/10 ${
                            error && !formData.email ? 'input-error' : ''
                          }`}
                          placeholder="you@example.com"
                          autoComplete="email"
                          autoCapitalize="none"
                          inputMode="email"
                          spellCheck={false}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block px-1 text-sm font-bold text-[#1f2330]">Create Password</label>
                      <div className="relative group">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8c7c6c] transition-colors group-focus-within:text-[#b84f45]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          className={`input-surface pl-12 pr-12 transition-all hover:bg-[#fcf8f3] focus:ring-4 focus:ring-[#b84f45]/10 ${
                            error && formData.password.length < 8 ? 'input-error' : ''
                          }`}
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c7c6c] hover:text-[#1f2330]"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      <div className="px-1 pt-1.5">
                        <div className="flex items-center justify-between text-[0.7rem] font-bold uppercase tracking-wider text-[#8c7c6c]">
                          <span>Password Strength</span>
                          <span className={passwordStrength > 50 ? 'text-green-600' : ''}>{strengthText}</span>
                        </div>
                        <div className="mt-1.5 flex gap-1.5">
                          {[1, 2, 3, 4].map((div) => (
                            <div 
                              key={div} 
                              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                                passwordStrength >= div * 25 ? strengthColor : 'bg-[#eadcca]'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block px-1 text-sm font-bold text-[#1f2330]">Confirm Password</label>
                      <div className="relative group">
                        <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8c7c6c] transition-colors group-focus-within:text-[#b84f45]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={(e) => updateField('confirmPassword', e.target.value)}
                          className={`input-surface pl-12 transition-all hover:bg-[#fcf8f3] focus:ring-4 focus:ring-[#b84f45]/10 ${
                            error && formData.password !== formData.confirmPassword ? 'input-error' : ''
                          }`}
                          placeholder="Re-type your password"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="space-y-2">
                      <label className="block px-1 text-sm font-bold text-[#1f2330]">Full Name</label>
                      <div className="relative group">
                        <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8c7c6c] transition-colors group-focus-within:text-[#b84f45]" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          className="input-surface pl-12 transition-all hover:bg-[#fcf8f3] focus:ring-4 focus:ring-[#b84f45]/10"
                          placeholder="e.g. Arjun Mehta"
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block px-1 text-sm font-bold text-[#1f2330]">Age</label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) => updateField('age', e.target.value)}
                          className="input-surface"
                          placeholder="e.g. 28"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block px-1 text-sm font-bold text-[#1f2330]">Gender</label>
                        <StyledSelectField
                          value={formData.gender}
                          onValueChange={(value) => updateField('gender', value)}
                          options={genderOptions}
                          placeholder="Select gender"
                          ariaLabel="Gender"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block px-1 text-sm font-bold text-[#1f2330]">Creating profile for</label>
                        <StyledSelectField
                          value={formData.profileFor}
                          onValueChange={(value) => updateField('profileFor', value)}
                          options={profileForOptions}
                          ariaLabel="Creating profile for"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block px-1 text-sm font-bold text-[#1f2330]">Mother Tongue</label>
                        <StyledSelectField
                          value={formData.motherTongue}
                          onValueChange={(value) => updateField('motherTongue', value)}
                          options={motherTongueOptions.map((opt) => ({ value: opt, label: opt }))}
                          placeholder="Select language"
                          ariaLabel="Mother tongue"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block px-1 text-sm font-bold text-[#1f2330]">Community</label>
                        <StyledSelectField
                          value={formData.community}
                          onValueChange={(value) => updateField('community', value)}
                          options={communityOptions.map((opt) => ({ value: opt, label: opt }))}
                          placeholder="Select community"
                          ariaLabel="Community"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block px-1 text-sm font-bold text-[#1f2330]">Current Location</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => updateField('location', e.target.value)}
                          className="input-surface"
                          placeholder="e.g. Mumbai, Maharashtra"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="space-y-4">
                      <label className="block px-1 text-sm font-bold text-[#1f2330]">Intentions: I'm primarily looking for</label>
                      <div className="grid gap-4">
                        {[
                          { id: 'relationship', label: 'Relationship', desc: 'A meaningful connection that can grow naturally.' },
                          { id: 'marriage', label: 'Long-term / Marriage', desc: 'Introductions with commitment and family clarity.' },
                          { id: 'friendship', label: 'Friendship', desc: 'Connection first, with no immediate pressure.' }
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateField('lookingFor', option.id)}
                            className={`group relative rounded-[28px] border-2 p-5 text-left transition-all hover:border-[#b84f45]/40 ${
                              formData.lookingFor === option.id
                                ? 'border-[#b84f45] bg-[#fff2ee] shadow-md shadow-[#b84f45]/5'
                                : 'border-[#eadcca] bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className={`text-lg font-bold ${formData.lookingFor === option.id ? 'text-[#b84f45]' : 'text-[#1f2330]'}`}>{option.label}</p>
                              {formData.lookingFor === option.id && <div className="rounded-full bg-[#b84f45] p-1"><Check className="h-3 w-3 text-white" /></div>}
                            </div>
                            <p className="mt-2 text-[0.92rem] leading-7 text-[#62584d] group-hover:text-[#4a423a]">{option.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[28px] bg-[#f9f3ed] p-6 border border-[#eadcca]">
                      <div className="flex items-start gap-4">
                        <div className="relative flex h-6 w-6 mt-1 shrink-0 items-center justify-center">
                          <input
                            type="checkbox"
                            id="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onChange={(e) => updateField('agreeToTerms', e.target.checked)}
                            className="peer absolute h-full w-full cursor-pointer opacity-0 shadow-none ring-0"
                          />
                          <div className="pointer-events-none flex h-6 w-6 items-center justify-center rounded-lg border-2 border-[#d9caba] bg-white transition-all peer-checked:border-[#b84f45] peer-checked:bg-[#b84f45] peer-focus:ring-4 peer-focus:ring-[#b84f45]/10">
                            <Check className="h-3.5 w-3.5 scale-0 text-white transition-transform duration-200 peer-checked:scale-100" />
                          </div>
                        </div>
                        <label htmlFor="agreeToTerms" className="cursor-pointer text-[0.88rem] leading-7 text-[#62584d] select-none hover:text-[#1f2330]">
                          I understand that Soulmate is for serious intentions. I agree to the{' '}
                          <Link to="/terms" className="font-bold text-[#b84f45] hover:opacity-80">Terms</Link> and{' '}
                          <Link to="/privacy" className="font-bold text-[#b84f45] hover:opacity-80">Privacy Policy</Link>.
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="rounded-[28px] border border-[#eadcca] bg-[linear-gradient(180deg,rgba(255,247,241,0.95),rgba(255,252,248,0.9))] p-6 shadow-sm">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-[#b84f45]">Final security step</p>
                      <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#1f2330]">Verify your email before entry.</h3>
                      <p className="mt-3 text-[0.96rem] leading-7 text-[#62584d]">
                        We will send a secure verification link to <span className="font-bold text-[#1f2330]">{formData.email}</span>.
                        Until that link is opened, dashboard access stays locked.
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {[
                        'Create your account securely with the profile details you entered.',
                        'Send a verification link to your inbox right away.',
                        'Unlock your dashboard only after the email link is confirmed.',
                      ].map((item, index) => (
                        <div key={item} className="flex items-start gap-3 rounded-[24px] border border-[#eadcca] bg-white/80 p-4 shadow-sm">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f9e2da] text-xs font-black text-[#b84f45]">
                            {index + 1}
                          </div>
                          <p className="text-[0.92rem] leading-6 text-[#4f473f]">{item}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[28px] border border-[#eadcca] bg-white/90 p-5 shadow-sm">
                      <label className="block px-1 text-sm font-bold text-[#1f2330]">Verification email</label>
                      <div className="mt-3 input-surface flex min-h-[3.6rem] items-center gap-3 pl-4 pr-4">
                        <Mail className="h-5 w-5 text-[#b84f45]" />
                        <span className="truncate font-medium text-[#1f2330]">{formData.email}</span>
                      </div>
                      <p className="field-hint px-1">
                        Use an inbox you can open now. If the first email does not appear, the next screen lets you resend it.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  {currentStep > 0 && (
                    <button type="button" onClick={prevStep} className="btn-secondary h-14 flex-1">
                      <ChevronLeft className="h-5 w-5" />
                      Previous Step
                    </button>
                  )}

                  {currentStep < steps.length - 1 ? (
                    <button type="button" onClick={nextStep} className="btn-primary h-14 flex-1 shadow-lg shadow-[#b84f45]/10">
                      {currentStep === steps.length - 2 ? 'Continue to Verification' : 'Continue to Next'}
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary h-14 flex-1 shadow-lg shadow-[#b84f45]/20 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Preparing verification...
                        </>
                      ) : (
                        <>
                          Create Account & Send Verification
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              <div className="soft-divider my-10" />

              <footer className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[0.92rem] text-[#62584d]">
                  Already registered?{' '}
                  <Link to={loginPath} className="font-bold text-[#b84f45] transition-opacity hover:opacity-80">
                    Member sign in
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
