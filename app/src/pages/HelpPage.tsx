import { Link } from 'react-router-dom';
import { ArrowRight, LifeBuoy, MailCheck, ShieldCheck, UserRoundCog } from 'lucide-react';

const helpCards = [
  {
    title: 'Account access',
    icon: UserRoundCog,
    points: [
      'Use the sign-in page if you already have an account.',
      'If you forgot your password, request a reset link from the login screen.',
      'If you changed devices, sign in again and your profile will reconnect to the same account.',
    ],
  },
  {
    title: 'Email verification',
    icon: MailCheck,
    points: [
      'Check your inbox and spam folder for your verification email after registration or email change.',
      'If the link expires, request a fresh verification email from the relevant flow.',
      'Soulmate keeps dashboard access blocked until the verification link is completed.',
    ],
  },
  {
    title: 'Safety and privacy',
    icon: ShieldCheck,
    points: [
      'Review the Soulmate Code for identity, communication, and reporting standards.',
      'Use account settings to adjust visibility, notifications, and profile access rules.',
      'Report suspicious behavior quickly so trust and moderation controls can work properly.',
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="page-shell px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef3fb] text-[#456fb8] shadow-xl shadow-[#456fb8]/10">
            <LifeBuoy className="h-8 w-8" />
          </div>
          <p className="mt-8 text-[0.72rem] font-black uppercase tracking-[0.3em] text-[#8c7c6c]">Help Center</p>
          <h1 className="mt-4 text-[clamp(2.5rem,8vw,4.6rem)] font-black tracking-tight text-[#1f2330]">
            A faster path to <span className="text-[#456fb8]">getting unstuck</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#62584d]">
            Most account issues on Soulmate come down to sign-in access, verification links, or profile visibility. This page points you to the right next step quickly.
          </p>
        </header>

        <section className="mt-16 grid gap-8 md:grid-cols-3">
          {helpCards.map((card) => (
            <article key={card.title} className="glass-card p-8 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3fb] text-[#456fb8]">
                <card.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-[#1f2330]">{card.title}</h2>
              <ul className="mt-6 space-y-4 text-[0.95rem] leading-7 text-[#62584d]">
                {card.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#456fb8]" />
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
              <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-white/40">Common Next Steps</p>
              <h2 className="mt-4 text-3xl font-black">Choose the right flow and keep moving.</h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                If you are trying to register, verify, reset a password, or update your account email, the quickest path is usually through the matching auth page instead of starting over.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/login" className="btn-primary bg-[#efc18d] text-[#1f2330] hover:bg-[#f5d5b0]">
                Sign in
              </Link>
              <Link to="/register" className="btn-secondary border-white/20 text-white hover:bg-white/10">
                Create profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
