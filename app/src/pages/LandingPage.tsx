import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Heart,
  Quote,
  Search,
  Sparkles,
  Target,
  ShieldCheck,
} from 'lucide-react';

const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Experience', href: '#experience' },
];

const rituals = [
  {
    title: 'Detail First',
    description: 'Every profile opens with values, family context, and relationship intent before looks take over.',
    icon: Heart,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    title: 'Curated Intros',
    description: 'We surface a smaller set of stronger fits so you can focus on compatibility, not endless sorting.',
    icon: Search,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    title: 'Guided Success',
    description: 'Clear prompts move good matches into real conversations, ensuring a respectful and steady pace.',
    icon: Calendar,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
];

const storyCards = [
  {
    name: 'Nisha + Karan',
    copy: 'One thoughtful introduction led to family conversations, a sea-facing first date in Mumbai, and an engagement six months later.',
    image: '/story_mumbai.jpg',
    tag: 'Mumbai',
  },
  {
    name: 'Ananya + Rohit',
    copy: 'They matched on cultural values, moved from long calls to Chennai coffee walks, and are now planning their wedding.',
    image: '/story_chennai.jpg',
    tag: 'Chennai',
  },
  {
    name: 'Sneha + Rohan',
    copy: 'From the first message, both felt a deep connection. A four-hour dinner in Ahmedabad became weekly calls and a beautiful Gujarati wedding.',
    image: '/hero_dock_couple.jpg',
    tag: 'Ahmedabad',
  },
  {
    name: 'Priya + Aditya',
    copy: 'Both wanted warmth, family fit, and clarity. Soulmate helped them skip the noise and find the right pace.',
    image: '/cta_field_couple.jpg',
    tag: 'Delhi',
  },
];

const footerLinks = [
  { label: 'Stories', to: '/success-stories' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Safety', to: '/rules' },
  { label: 'Help', to: '/help' },
];

export default function LandingPage() {
  return (
    <div className="page-shell overflow-hidden selection:bg-[#b84f45] selection:text-white">
      <div className="grain-overlay opacity-50" />
      
      {/* Premium Background Blurs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60rem] bg-[radial-gradient(circle_at_top_left,rgba(222,168,125,0.2),transparent_40%),radial-gradient(circle_at_top_right,rgba(101,142,129,0.1),transparent_30%)]" />

      {/* Navigation */}
      <nav className="sticky top-0 z-[100] px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between rounded-[32px] bg-white/60 backdrop-blur-3xl border border-white/40 px-6 py-4 shadow-2xl">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#1f2330] text-white shadow-xl transition-transform group-hover:scale-110">
              <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <p className="text-xl font-black text-[#1f2330] tracking-tight sm:text-2xl">Soulmate</p>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8c7c6c]">Indian Matchmaking</p>
            </div>
          </Link>

          <div className="hidden items-center gap-10 lg:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-xs font-black uppercase tracking-widest text-[#64594d] hover:text-[#b84f45] transition-colors">{link.label}</a>
            ))}
            <Link to="/success-stories" className="text-xs font-black uppercase tracking-widest text-[#64594d] hover:text-[#b84f45] transition-colors">Stories</Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="hidden px-3 text-xs font-black uppercase tracking-widest text-[#1f2330] hover:underline sm:inline-block">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary rounded-2xl px-4 py-3 text-[11px] shadow-xl shadow-[#b84f45]/20 sm:px-8 sm:py-3.5 sm:text-xs">
              <span className="sm:hidden">Join</span>
              <span className="hidden sm:inline">Join Free</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 px-4 pb-16 sm:px-8 sm:pb-32">
        
        {/* Hero Section */}
        <section id="experience" className="mx-auto grid max-w-7xl gap-16 py-16 sm:py-24 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-12 xl:col-span-7">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#fdf2f2] text-[#b84f45]">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[.4em] text-[#8c7c6c]">Modern Traditions</span>
            </div>

            <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-black text-[#1f2330] leading-[0.85] tracking-tighter">
              Serious Matchmaking. <br />
              <span className="text-[#b84f45]">Simplified.</span>
            </h1>

            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[#62584d] sm:text-2xl font-medium">
              Find long-term compatibility through curated introductions, verified trust signals, and a calm interface built for the modern Indian heart.
            </p>

            <div className="mt-12 flex flex-col gap-5 sm:flex-row">
              <Link to="/register" className="btn-primary px-12 py-6 text-base rounded-[32px] shadow-2xl shadow-[#b84f45]/30">
                Start Your Profile
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#how-it-works" className="btn-secondary px-10 py-6 text-base rounded-[32px] border-none bg-white shadow-sm flex items-center gap-3 group">
                See How It Works
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            {/* Live Metrics */}
            <div className="mt-20 grid gap-8 sm:grid-cols-3">
              {[
                { label: 'Active Members', value: '150K+' },
                { label: 'Verified Profiles', value: '100%' },
                { label: 'Successful Matches', value: '12K+' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-4xl font-black text-[#1f2330] tracking-tighter">{stat.value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#8c7c6c]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-5 relative">
            <div className="relative group">
              {/* Main Landing Image */}
              <div className="aspect-[4/5] overflow-hidden rounded-[80px] shadow-2xl border-8 border-white/50 relative">
                <img src="/hero_dock_couple.jpg" className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" />
                <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-[#1f2330] via-transparent to-transparent opacity-90" />
                
                {/* Floating Preview Card */}
                <div className="absolute bottom-10 left-10 right-10 glass-card bg-[#1f2330]/80 border-white/10 p-6 rounded-[40px] text-white">
                   <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                         <Target className="h-7 w-7 text-[#efc18d]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Next Introduction</p>
                        <p className="text-xl font-bold leading-none mt-1">Available in 2h 45m</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 h-40 w-40 bg-[#fdf2f2] rounded-full -z-10 animate-pulse" />
              <div className="absolute top-20 -left-10 glass-card bg-white p-6 rounded-[32px] shadow-2xl hidden xl:block animate-bounce-slow">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                       <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-black text-[#1f2330] uppercase tracking-widest">Verified 100%</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works section */}
        <section id="how-it-works" className="mx-auto max-w-7xl py-24 sm:py-32">
          <div className="mb-20 grid gap-10 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c]">The Workflow</p>
              <h2 className="mt-4 text-[clamp(2.5rem,6vw,5.5rem)] font-black text-[#1f2330] leading-[0.9] tracking-tighter">
                A Calmer Path to <br /> <span className="text-[#b84f45]">Commitment.</span>
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-[#62584d] font-medium max-w-xl">
              We've replaced the shallow swipe cycle with a structured introduction flow designed to build trust, respect, and real compatibility.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
            {rituals.map((ritual, i) => (
              <div key={i} className="glass-card p-10 sm:p-14 border-none shadow-xl bg-white/80 group hover:bg-white hover:-translate-y-4 transition-all duration-500">
                <div className={`h-20 w-20 flex items-center justify-center rounded-[32px] ${ritual.bg} ${ritual.color} shadow-lg mb-10`}>
                   <ritual.icon className="h-10 w-10" />
                </div>
                <h3 className="text-4xl font-black text-[#1f2330] tracking-tight">{ritual.title}</h3>
                <p className="mt-6 text-[#62584d] leading-relaxed font-semibold italic opacity-80">0{i+1} — Step Description</p>
                <p className="mt-4 text-lg text-[#62584d] leading-relaxed font-medium">{ritual.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stories Section */}
        <section id="stories" className="mx-auto max-w-7xl py-24">
           <div className="flex items-center justify-between mb-16">
              <h2 className="text-4xl font-black text-[#1f2330]">Success Stories</h2>
              <Link to="/success-stories" className="btn-secondary px-8 border-none bg-gray-100 flex items-center gap-2">
                View all stories
                <ArrowRight className="h-4 w-4" />
              </Link>
           </div>
           <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
             {storyCards.map((story, i) => (
               <article key={i} className="group glass-card overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-700">
                 <div className="aspect-[3/4] relative overflow-hidden">
                    <img src={story.image} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1f2330] via-transparent to-transparent opacity-80" />
                    <span className="absolute top-6 left-6 rounded-full bg-white/20 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white border border-white/20">{story.tag}</span>
                    <div className="absolute bottom-8 left-8 right-8 text-white">
                       <Quote className="h-8 w-8 text-[#efc18d] mb-4" />
                       <p className="text-lg font-medium leading-relaxed italic">"{story.copy}"</p>
                       <h4 className="mt-6 text-2xl font-black">{story.name}</h4>
                    </div>
                 </div>
               </article>
             ))}
           </div>
        </section>

        {/* Final CTA Card */}
        <section className="mx-auto max-w-7xl py-24">
           <div className="glass-dark p-12 sm:p-24 rounded-[80px] bg-[#1f2330] relative overflow-hidden text-center">
              {/* Background Art */}
              <div className="absolute top-0 left-0 p-20 opacity-5 pointer-events-none">
                 <Heart className="h-[400px] w-[400px]" />
              </div>
              
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[.6em] text-white/40">The Final Step</span>
                <h2 className="mt-10 text-[clamp(2.5rem,7vw,6.5rem)] font-black text-white leading-[0.9] tracking-tighter max-w-4xl mx-auto">
                   Build Your Life <br /> Story with <span className="text-rose-500">Soulmate.</span>
                </h2>
                <p className="mt-12 text-lg sm:text-2xl text-white/60 max-w-2xl mx-auto font-medium">
                   Stop swiping and start connecting. Join thousands of serious singles looking for deeper meaning and lifelong commitment.
                </p>
                <div className="mt-16 flex flex-col sm:flex-row justify-center gap-6">
                   <Link to="/register" className="btn-primary bg-white text-[#1f2330] hover:bg-gray-100 px-16 py-6 text-lg rounded-[32px] shadow-2xl">
                      Create Profile
                   </Link>
                   <Link to="/login" className="btn-secondary bg-white/10 border-none text-white hover:bg-white/20 px-12 py-6 text-lg rounded-[32px]">
                      Member Sign In
                   </Link>
                </div>
              </div>
           </div>
        </section>

        {/* Footer */}
        <footer className="mx-auto max-w-7xl pt-24 pb-12 border-t border-gray-100 text-center">
           <div className="flex flex-col items-center gap-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-[#b84f45]">
                 <Heart className="h-6 w-6 fill-current" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-[#8c7c6c]">Soulmate • Since 2026</p>
              <div className="flex flex-wrap justify-center gap-10">
                 {footerLinks.map((item) => (
                   <Link
                     key={item.label}
                     to={item.to}
                     className="text-[10px] font-black uppercase tracking-widest text-[#62584d] transition-colors hover:text-[#b84f45]"
                   >
                     {item.label}
                   </Link>
                 ))}
              </div>
              <p className="text-[10px] font-medium text-[#8c7c6c]/60 max-w-sm leading-relaxed">
                 © 2026 Soulmate Matchmaking Services. Made with love for the Indian community. All rights reserved.
              </p>
           </div>
        </footer>
      </main>
    </div>
  );
}
