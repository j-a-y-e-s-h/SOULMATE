import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Heart, Shield, UserCheck } from 'lucide-react';

const termSections = [
  {
    title: 'Eligibility & Honest Profiles',
    icon: UserCheck,
    points: [
      'You must provide truthful account details, including your age, relationship intent, and profile information.',
      'You are responsible for keeping your login credentials secure and current.',
      'Profiles that impersonate others or misrepresent key facts may be suspended without notice.',
    ],
  },
  {
    title: 'Respectful Use',
    icon: Heart,
    points: [
      'Soulmate is built for serious, respectful matchmaking and not for harassment, spam, or deceptive conduct.',
      'Members are expected to use profile views, interests, and messaging responsibly.',
      'We may limit or remove access when behavior puts trust, safety, or community standards at risk.',
    ],
  },
  {
    title: 'Platform Rules & Moderation',
    icon: Shield,
    points: [
      'Verification, visibility, and communication rules may evolve to improve member safety and matchmaking quality.',
      'We may investigate suspicious behavior, policy violations, or misuse of introductions and messaging tools.',
      'Repeated or severe violations can result in permanent removal from the service.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="page-shell px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff2ee] text-[#b84f45] shadow-xl shadow-[#b84f45]/10">
            <FileText className="h-8 w-8" />
          </div>
          <p className="mt-8 text-[0.72rem] font-black uppercase tracking-[0.3em] text-[#8c7c6c]">Terms of Service</p>
          <h1 className="mt-4 text-[clamp(2.5rem,8vw,4.6rem)] font-black tracking-tight text-[#1f2330]">
            Clear rules for a <span className="text-[#b84f45]">trust-led community</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#62584d]">
            These terms explain the basic expectations around account access, member conduct, and how Soulmate protects the integrity of its matchmaking experience.
          </p>
        </header>

        <section className="mt-16 grid gap-8 md:grid-cols-3">
          {termSections.map((section) => (
            <article key={section.title} className="glass-card p-8 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2ee] text-[#b84f45]">
                <section.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-[#1f2330]">{section.title}</h2>
              <ul className="mt-6 space-y-4 text-[0.95rem] leading-7 text-[#62584d]">
                {section.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#b84f45]" />
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
              <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-white/40">Before You Join</p>
              <h2 className="mt-4 text-3xl font-black">Read the community code alongside these terms.</h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                The rules on identity, respectful communication, privacy, and trust work together. The terms tell you how the service is used; the Soulmate Code explains how the community is expected to behave.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/rules" className="btn-primary bg-[#efc18d] text-[#1f2330] hover:bg-[#f5d5b0]">
                View Soulmate Code
              </Link>
              <Link to="/privacy" className="btn-secondary border-white/20 text-white hover:bg-white/10">
                Privacy policy
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
