import { Link } from 'react-router-dom';
import { ChevronRight, Eye, Lock, ShieldCheck, UserRoundCheck } from 'lucide-react';

const privacySections = [
  {
    title: 'Information We Collect',
    icon: Eye,
    points: [
      'Account details such as your email address, profile basics, and photos you upload.',
      'Preference and privacy settings that shape matchmaking visibility and communication rules.',
      'Activity data needed to deliver introductions, profile views, messages, and trust signals.',
    ],
  },
  {
    title: 'How We Use It',
    icon: UserRoundCheck,
    points: [
      'To create and maintain your account, profile, and secure sign-in session.',
      'To improve matching quality, surface relevant introductions, and reduce spam or misuse.',
      'To send essential account communications such as verification, password reset, and security notices.',
    ],
  },
  {
    title: 'Sharing & Visibility',
    icon: ShieldCheck,
    points: [
      'Profile information is shown according to the visibility controls you choose in your account settings.',
      'Private contact details stay protected until the platform rules for mutual interest or acceptance are met.',
      'We do not sell your personal data to advertisers or unrelated third parties.',
    ],
  },
  {
    title: 'Retention & Control',
    icon: Lock,
    points: [
      'You can update your profile, change your email, or adjust privacy settings from your account at any time.',
      'Deleting your account removes your active access and begins cleanup of stored account data.',
      'Security and moderation records may be retained when required to investigate abuse or protect other members.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="page-shell px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef5f2] text-[#4b7165] shadow-xl shadow-[#4b7165]/10">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <p className="mt-8 text-[0.72rem] font-black uppercase tracking-[0.3em] text-[#8c7c6c]">Privacy First</p>
          <h1 className="mt-4 text-[clamp(2.5rem,8vw,4.6rem)] font-black tracking-tight text-[#1f2330]">
            Your privacy, <span className="text-[#4b7165]">clearly explained</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#62584d]">
            Soulmate is designed for serious matchmaking, which means privacy controls, measured sharing, and clear communication about how your information is used.
          </p>
        </header>

        <section className="mt-16 grid gap-8 md:grid-cols-2">
          {privacySections.map((section) => (
            <article key={section.title} className="glass-card p-8 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5f2] text-[#4b7165]">
                <section.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-[#1f2330]">{section.title}</h2>
              <ul className="mt-6 space-y-4 text-[0.95rem] leading-7 text-[#62584d]">
                {section.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#4b7165]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-[40px] bg-[#1f2330] p-8 text-white shadow-2xl sm:p-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-white/40">Your Choices</p>
              <h2 className="mt-4 text-3xl font-black">Control visibility from your own account.</h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Once you are signed in, you can update profile visibility, photo access, notification preferences, and security settings directly from your dashboard.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/settings" className="btn-primary bg-[#efc18d] text-[#1f2330] hover:bg-[#f5d5b0]">
                Account settings
              </Link>
              <Link to="/terms" className="btn-secondary border-white/20 text-white hover:bg-white/10">
                Read terms
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
