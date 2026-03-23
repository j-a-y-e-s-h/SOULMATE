import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  Eye,
  Heart,
  HeartHandshake,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
  TrendingUp,
  Bell,
  ArrowUpRight,
} from 'lucide-react';
import { getVerificationLabel } from '@/lib/matchmaking';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useNotificationStore } from '@/store/notificationStore';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, toggleShortlist } = useAuthStore();
  const { profiles, interestRequests, respondToInterest, getProfileById, matches, loadAll, loadProfiles } =
    useChatStore();
  const { notifications, addNotification } = useNotificationStore();

  useEffect(() => {
    Promise.all([loadProfiles(), loadAll()]);
  }, [loadProfiles, loadAll]);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const currentUserId = user?.id ?? '1';

  const incomingInterests = interestRequests
    .filter((request) => request.toUserId === currentUserId && request.status === 'pending')
    .map((request) => ({
      request,
      profile: getProfileById(request.fromUserId),
    }))
    .filter((item): item is { request: (typeof interestRequests)[number]; profile: NonNullable<ReturnType<typeof getProfileById>> } =>
      Boolean(item.profile),
    );

  const recentVisitors = (user?.recentVisitors ?? [])
    .map((profileId) => getProfileById(profileId))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  const shortlistedProfiles = (user?.shortlisted ?? [])
    .map((profileId) => getProfileById(profileId))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const verificationLabel = user ? getVerificationLabel(user) : 'Account Verified';

  // Stats Configuration
  const stats = [
    { label: 'Profile Views', value: user?.stats.profileViews ?? 0, icon: Eye, trend: '+12%', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Interests', value: incomingInterests.length, icon: Heart, trend: 'New', color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Matches', value: matches.length, icon: HeartHandshake, trend: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Saved', value: shortlistedProfiles.length, icon: Star, trend: 'Revisit', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const handleRespondToInterest = async (requestId: string, decision: 'accepted' | 'declined', name: string) => {
    try {
      const result = await respondToInterest(requestId, decision);
      if (decision === 'accepted' && result.matchId) {
        toast.success(`Connection Established with ${name}!`);
        addNotification({
          userId: currentUserId,
          type: 'match',
          title: `${name} is now a match`,
          message: 'The interest is accepted and direct messaging is now open.',
          href: `/chat/${result.matchId}`,
        });
      } else {
        toast.info(`Interest from ${name} declined.`);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleToggleShortlist = (profileId: string, name: string) => {
    toggleShortlist(profileId);
    const isNowShortlisted = !user?.shortlisted.includes(profileId);
    toast.success(isNowShortlisted ? `Added ${name} to shortlist` : `Removed ${name} from shortlist`);
  };

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-5 pb-16 sm:space-y-8 sm:pb-20">
      {/* Dynamic Welcome Hero */}
      <section className="glass-card overflow-hidden bg-gradient-to-br from-white via-white to-[#fdf2f2]/50 border-none shadow-2xl">
        <div className="relative p-5 sm:p-12 lg:p-16">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Sparkles className="h-64 w-64 text-[#1f2330]" />
          </div>

          <div className="relative z-10 flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center">
            <div className="max-w-3xl flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6 sm:gap-3">
                <span className="rounded-full bg-[#1f2330] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">Personal Dashboard</span>
                <span className="rounded-full bg-[#fdf2f2] border border-[#b84f45]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#b84f45] flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {verificationLabel}
                </span>
                {unreadCount > 0 && (
                  <Link to="/notifications" className="rounded-full bg-[#b84f45] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white animate-pulse shadow-lg flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5" />
                    {unreadCount} New Alerts
                  </Link>
                )}
              </div>

              <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[0.9] text-[#1f2330] tracking-tight">
                Namaste, <span className="text-[#b84f45] block sm:inline">{firstName}.</span>
              </h1>
              
              <p className="mt-5 text-base font-medium leading-relaxed text-[#62584d] sm:mt-8 sm:text-xl">
                {incomingInterests.length > 0 
                  ? `You have ${incomingInterests.length} people waiting for your response. It's a great day to move towards a lifelong commitment.`
                  : "We've curated a fresh set of introductions for you today based on your traditional values and career goals."}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:mt-10 sm:gap-4 sm:flex-row">
                <Link to="/discover" className="btn-primary px-6 py-4 text-sm shadow-2xl shadow-[#1f2330]/20 sm:px-10 sm:py-5 sm:text-base">
                  Review New Intros
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/search" className="btn-secondary border-none bg-white/60 px-6 py-4 text-sm shadow-sm hover:bg-white sm:px-10 sm:py-5 sm:text-base">
                  Advanced Filters
                </Link>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:w-[420px]">
              {stats.map((stat) => (
                <div key={stat.label} className="glass-card group border-none bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 sm:p-6">
                  <div className="mb-4 flex items-center justify-between sm:mb-6">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} shadow-inner sm:h-12 sm:w-12`}>
                      <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${stat.color} px-2 py-1 rounded-full bg-opacity-10 ${stat.bg}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-3xl font-black tracking-tighter text-[#1f2330] sm:text-4xl">{stat.value}</p>
                  <p className="mt-1 text-xs font-bold text-[#8c7c6c] uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <section className="grid items-start gap-5 sm:gap-8 lg:grid-cols-12">
        
        {/* Left Column: Activity */}
        <div className="space-y-5 sm:space-y-8 lg:col-span-12 xl:col-span-8">
          
          {/* Interests Section */}
          <div className="glass-card border-none bg-white/80 p-5 shadow-xl sm:p-12">
            <div className="mb-7 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c]">Pending Introductions</p>
                <h2 className="mt-2 text-3xl font-black text-[#1f2330] sm:mt-3 sm:text-4xl">Who's Interested?</h2>
              </div>
              <Link to="/matches" className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#b84f45]">
                View All <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="space-y-6">
              {incomingInterests.length > 0 ? (
                incomingInterests.map(({ request, profile }) => (
                  <div key={request.id} className="surface-muted group rounded-[32px] border border-transparent p-5 transition-all hover:border-[#8f7b67]/10 hover:bg-white hover:shadow-lg sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                      <div className="relative">
                        <img src={profile.photos[0] || '/gallery_1.jpg'} className="h-24 w-24 rounded-[32px] object-cover shadow-md" />
                        <div className="absolute -bottom-2 -right-2 h-8 w-8 flex items-center justify-center rounded-full bg-white text-[#b84f45] shadow-lg border-2 border-white">
                          <Heart className="h-4 w-4 fill-current" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-3xl font-black text-[#1f2330]">{profile.name}, {profile.age}</h3>
                          <span className="chip bg-[#fff2ee] text-[#b84f45] border-none px-4 text-[9px] font-black">
                            {getVerificationLabel(profile)}
                          </span>
                        </div>
                        <p className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-[#62584d]">
                          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>
                          <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> {profile.details.annualIncome}</span>
                          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {profile.details.community}</span>
                        </p>
                        <div className="mt-4 rounded-2xl border border-[#8f7b67]/5 bg-white/60 p-4 sm:mt-5">
                          <p className="text-sm leading-relaxed text-[#17161c] font-medium italic">"{request.message}"</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3 sm:mt-6">
                      <button 
                        onClick={() => handleRespondToInterest(request.id, 'accepted', profile.name)}
                        className="btn-primary px-8 py-3.5 text-xs flex-1 sm:flex-none justify-center shadow-lg"
                      >
                        Accept & Chat
                      </button>
                      <button 
                        onClick={() => handleRespondToInterest(request.id, 'declined', profile.name)}
                        className="btn-secondary px-6 py-3.5 text-xs flex-1 sm:flex-none justify-center"
                      >
                        Decline
                      </button>
                      <Link to={`/profile/${profile.id}`} className="btn-secondary px-6 py-3.5 text-xs flex-1 sm:flex-none justify-center bg-gray-50 border-none group">
                        See Full Profile <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center py-14 text-center sm:py-20">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#fdf2f2] text-[#b84f45] sm:mb-6 sm:h-20 sm:w-20">
                    <Zap className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black text-[#1f2330]">Inbox Quiet.</h3>
                  <p className="mt-2 text-[#62584d] max-w-sm">Use our 'Boost' feature or complete your photo gallery to attract more serious interests.</p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Picks Section */}
          <div className="glass-card border-none p-5 shadow-xl sm:p-12">
             <div className="mb-7 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
               <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c]">Today's Selection</p>
                 <h2 className="mt-2 text-3xl font-black text-[#1f2330] sm:mt-3 sm:text-4xl">Curated for You</h2>
               </div>
               <Link to="/discover" className="btn-secondary px-6 border-none shadow-sm">Review All Feed</Link>
             </div>

             <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
               {profiles.slice(0, 3).map((profile) => (
                 <article key={profile.id} className="group relative overflow-hidden rounded-[40px] bg-white border border-[#8f7b67]/5 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                   <div className="aspect-[4/5] relative overflow-hidden">
                     <img src={profile.photos[0] || '/gallery_1.jpg'} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#1f2330] via-transparent to-transparent opacity-80" />
                     <button 
                       onClick={() => handleToggleShortlist(profile.id, profile.name)}
                       className={`absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all ${user?.shortlisted.includes(profile.id) ? 'bg-[#b84f45] text-white shadow-xl' : 'bg-white/20 text-white border border-white/30 hover:bg-white/40'}`}
                     >
                       <Star className={`h-5 w-5 ${user?.shortlisted.includes(profile.id) ? 'fill-current' : ''}`} />
                     </button>
                   </div>
                   <div className="p-6">
                     <h3 className="text-2xl font-black text-[#1f2330] tracking-tight">{profile.name}, {profile.age}</h3>
                     <p className="text-[10px] font-bold text-[#8c7c6c] mt-1 line-clamp-1">{profile.profession} • {profile.location}</p>
                     <div className="mt-6 flex gap-2">
                       <Link to={`/profile/${profile.id}`} className="btn-primary w-full justify-center text-[10px] py-3 tracking-[0.2em] shadow-lg">View Intro</Link>
                     </div>
                   </div>
                 </article>
               ))}
             </div>
          </div>
        </div>

        {/* Right Column: Insights & Stats */}
        <div className="space-y-5 sm:space-y-8 lg:col-span-12 xl:col-span-4">
          
          {/* Trust Score Card */}
          <div className="glass-dark group relative overflow-hidden rounded-[36px] bg-[#1f2330] p-5 shadow-2xl sm:rounded-[48px] sm:p-10">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="h-32 w-32" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[.4em] text-white/40">Profile Health</p>
              <h3 className="mt-4 text-[2rem] font-black leading-[1.05] text-white sm:mt-6 sm:text-3xl">Your trust signals are at 85%.</h3>
              
              <div className="mt-6 space-y-5 sm:mt-10 sm:space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-3 text-xs font-black uppercase tracking-widest">
                    <span className="text-white/60">Completion</span>
                    <span className="text-white">85%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[85%] shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {[
                    { label: 'Verified Identity', icon: BadgeCheck, status: 'Active' },
                    { label: 'Privacy Control', icon: LockKeyhole, status: 'Secure' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-[#efc18d]" />
                        <span className="text-xs font-bold text-white/80">{item.label}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">{item.status}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full btn-secondary bg-white/10 border-none text-white hover:bg-white/20 transition-all font-black text-[10px] tracking-[0.3em] uppercase py-4">Boost Visibility</button>
              </div>
            </div>
          </div>

          {/* Recent Visitors */}
          <div className="glass-card border-none bg-white/90 p-5 shadow-xl sm:p-8">
             <div className="mb-6 flex items-center justify-between sm:mb-8">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c]">Recent Engagement</p>
               <Eye className="h-4 w-4 text-[#8c7c6c]" />
             </div>
             <div className="space-y-4">
               {recentVisitors.slice(0, 4).map((visitor, i) => (
                 <Link key={i} to={`/profile/${visitor.id}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100">
                    <img src={visitor.photos[0] || '/gallery_1.jpg'} className="h-14 w-14 rounded-2xl object-cover shadow-md transition-transform group-hover:scale-105" />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#1f2330] group-hover:text-[#b84f45] transition-colors line-clamp-1">{visitor.name}</p>
                      <p className="text-[10px] font-bold text-[#9a8a79] uppercase tracking-tighter truncate">{visitor.profession}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#efc18d] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                 </Link>
               ))}
               {recentVisitors.length === 0 && (
                 <p className="text-sm text-center py-6 text-[#62584d] bg-gray-50 rounded-3xl border border-dashed border-[#8f7b67]/20">No profile views yet.</p>
               )}
             </div>
             {recentVisitors.length > 4 && (
               <Link to="/notifications" className="mt-6 block text-center text-[10px] font-black uppercase tracking-widest text-[#8c7c6c] hover:text-[#1f2330] transition-colors">See all visitors</Link>
             )}
          </div>

          {/* Quick Support / Feedback */}
          <div className="glass-card border-none bg-gradient-to-br from-[#f3e5d6]/40 to-transparent p-5 shadow-sm sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c] mb-4 text-center">Premium Assistance</p>
            <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-[#8f7b67]/5">
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#efc18d] text-[#1f2330]">
                <Crown className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-[#1f2330]">Dedicated Advisor</p>
                <p className="text-[10px] font-bold text-[#62584d]">Human-led matchmaking</p>
              </div>
              <button className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-50 text-[#1f2330] hover:bg-[#1f2330] hover:text-white transition-all shadow-inner">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Policy Footer */}
      <footer className="flex flex-col items-center py-14 sm:py-20">
        <div className="mb-6 flex items-center gap-5 brightness-0 opacity-20 transition-opacity hover:opacity-40 sm:mb-8 sm:gap-6">
          <ShieldCheck className="h-10 w-10" />
          <LockKeyhole className="h-10 w-10" />
          <Target className="h-10 w-10" />
        </div>
        <p className="text-xs font-bold text-[#8c7c6c] tracking-[0.2em] uppercase">100% Secure • Privacy First • Verified Profiles Only</p>
        <p className="mt-4 text-[10px] text-[#8c7c6c]/60 text-center max-w-sm leading-relaxed">
          Your profile is encrypted and only visible to matching members based on your specific privacy rules.
        </p>
      </footer>
    </div>
  );
}
