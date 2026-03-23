import { Shield, Check, Heart, ShieldCheck, UserCheck, MessageSquare, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ruleSections = [
  {
    title: 'Verification & Identity',
    icon: UserCheck,
    rules: [
      'Every profile must be verified via Government ID or LinkedIn for trust.',
      'Profile photos must be recent, clear, and represent the actual person.',
      'Misrepresentation of age, profession, or marital status leads to immediate ban.',
    ],
  },
  {
    title: 'Communication Etiquette',
    icon: MessageSquare,
    rules: [
      'Respectful and intentional communication is expected at all times.',
      'Interest requests should include a thoughtful, personalized note.',
      'Ghosting is discouraged; use the "Decline" button to provide closure.',
    ],
  },
  {
    title: 'Safety & Privacy',
    icon: ShieldCheck,
    rules: [
      'Contact details are only shared after mutual interest is accepted.',
      'Report any suspicious behavior or requests for financial assistance.',
      'We never share your private data with third-party advertisers.',
    ],
  },
  {
    title: 'Commitment to Intent',
    icon: Heart,
    rules: [
      'Soulmate is for members seeking serious, long-term partnerships.',
      'Family involvement is encouraged as a cornerstone of the journey.',
      'We prioritize quality of connections over quantity of matches.',
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="page-shell px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff2ee] text-[#b84f45] shadow-xl shadow-[#b84f45]/10">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="mt-8 text-[clamp(2.5rem,8vw,4.5rem)] font-black tracking-tight text-[#1f2330]">
            The <span className="text-gradient">Soulmate</span> Code.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#62584d]">
            To maintain a 10/10 community for serious matchmaking, we follow a set of refined rules designed for trust, safety, and cultural alignment.
          </p>
        </header>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {ruleSections.map((section) => (
            <div key={section.title} className="glass-card group p-8 transition-all hover:scale-[1.02]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3e5d6] text-[#b84f45] transition-transform group-hover:rotate-12">
                <section.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-[#1f2330]">{section.title}</h2>
              <ul className="mt-6 space-y-4">
                {section.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                    <p className="text-[0.92rem] leading-7 text-[#62584d]">{rule}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <section className="mt-16 rounded-[40px] bg-[#1f2330] p-8 text-white shadow-2xl sm:p-12">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div className="max-w-md">
              <div className="flex items-center gap-3 text-[#efc18d]">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Zero Tolerance</span>
              </div>
              <h2 className="mt-4 text-3xl font-bold">Privacy & Violations</h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Our moderation team monitors interactions for deviations from the Soulmate Code. Violations result in permanent removal from the platform without appeal.
              </p>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <Link to="/register" className="btn-primary bg-[#efc18d] text-[#1f2330] hover:bg-[#f5d5b0] whitespace-nowrap">
                Join our Community
              </Link>
              <Link to="/login" className="btn-secondary border-white/20 text-white hover:bg-white/10 whitespace-nowrap">
                Already a member?
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-12 text-center">
          <div className="flex items-center justify-center gap-6 text-sm font-bold text-[#8c7c6c]">
            <Link to="/terms" className="hover:text-[#1f2330]">Terms of Service</Link>
            <span className="h-1 w-1 rounded-full bg-[#8c7c6c]/30" />
            <Link to="/privacy" className="hover:text-[#1f2330]">Privacy Policy</Link>
            <span className="h-1 w-1 rounded-full bg-[#8c7c6c]/30" />
            <Link to="/help" className="hover:text-[#1f2330]">Support</Link>
          </div>
          <p className="mt-6 text-xs text-[#8c7c6c]/60">© 2026 Soulmate Modern Matrimony. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
