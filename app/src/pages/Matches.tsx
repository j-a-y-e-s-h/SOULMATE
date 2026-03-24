import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  Search,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ProfilePhoto } from '@/components/ProfilePhoto';
import { getProfilePhotoSrc } from '@/components/profilePhotoUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { getVerificationLabel } from '@/lib/matchmaking';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useEffect } from 'react';

type FilterType = 'all' | 'new' | 'shortlisted' | 'unread';

export default function Matches() {
  const isMobile = useIsMobile();
  const { user } = useAuthStore();
  const { matches, getConversation, loadAll } = useChatStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Build conversations summary from chatStore messages
  const conversations = matches.map((match) => {
    const conversation = getConversation(match.id);
    const lastMessage = conversation[conversation.length - 1];
    const unreadCount = conversation.filter(
      (m) => m.senderId !== (user?.id ?? '') && !m.read,
    ).length;
    return { matchId: match.id, user: match.matchedUser, lastMessage, unreadCount };
  });
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const shortlistedMatches = matches.filter((match) => user?.shortlisted.includes(match.matchedUserId));
  const unreadThreads = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);

  const filteredMatches = matches.filter(match => {
    const conversation = getConversation(match.id);
    const unreadCount = conversation.filter((message) => message.senderId !== (user?.id ?? '') && !message.read).length;
    const isShortlisted = user?.shortlisted.includes(match.matchedUserId);
    const matchesSearch = match.matchedUser.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'shortlisted') return isShortlisted;
    if (activeFilter === 'unread') return unreadCount > 0;
    if (activeFilter === 'new') return conversation.length === 0;
    return true;
  });

  if (matches.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 animate-fade-in">
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center shadow-2xl bg-gradient-to-br from-white/90 to-[#fdf2f2]/40 border-none">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#b84f45] blur-3xl opacity-10 rounded-full animate-pulse"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[40px] bg-[#fdf2f2] text-[#b84f45] shadow-inner">
              <HeartHandshake className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-[#1f2330]">Build Your Connections.</h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#62584d]">
            Once you and another member both express interest, your connection will appear here. This is where serious conversations begin.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link to="/discover" className="btn-primary px-10 py-4 shadow-xl">
              Explore Introductions
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/search" className="btn-secondary px-10 py-4">
              Search by Community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-5 pb-16 sm:space-y-8 sm:pb-24">
      {/* Header Section */}
      <section className="glass-card relative overflow-hidden p-5 sm:p-12">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BadgeCheck className="h-48 w-48 text-[#1f2330]" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-1 w-8 rounded-full bg-[#b84f45]"></span>
              <span className="eyebrow">Active Connections</span>
            </div>
            <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-black leading-[0.95] text-[#1f2330]">
              {isMobile ? 'Deepening Bonds.' : 'Where serious intentions turn into reality.'}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#62584d] sm:mt-6 sm:text-lg">
              Every match here is a mutual "Yes". Use this space to understand values, family expectations, and future compatibility.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="glass-card group border-none bg-white/60 p-4 text-center shadow-sm transition-transform hover:scale-105 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7c6c]">Connections</p>
              <p className="mt-2 text-3xl font-black text-[#1f2330] sm:text-4xl">{matches.length}</p>
            </div>
            <div className="glass-card group border-none bg-[#fff2ee] p-4 text-center shadow-sm transition-transform hover:scale-105 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#b84f45]">Unread</p>
              <p className="mt-2 text-3xl font-black text-[#b84f45] sm:text-4xl">{unreadThreads}</p>
            </div>
            <div className="glass-card group col-span-2 border-none bg-[#1f2330] p-4 text-center shadow-sm transition-transform hover:scale-105 sm:col-span-1 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Shortlisted</p>
              <p className="mt-2 text-3xl font-black text-white sm:text-4xl">{shortlistedMatches.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'new', 'unread', 'shortlisted'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all sm:px-6 ${
                activeFilter === filter
                  ? 'bg-[#1f2330] text-white shadow-lg'
                  : 'bg-white/70 text-[#62584d] hover:bg-white hover:shadow-md'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative group max-w-xs w-full">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7c6c] group-focus-within:text-[#1f2330] transition-colors" />
          <input
            type="text"
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border-none bg-white/80 py-3 pl-12 pr-6 text-sm outline-none ring-1 ring-[#8f7b67]/10 focus:ring-2 focus:ring-[#1f2330] transition-all"
          />
        </div>
      </div>

      {/* Matches Grid */}
      <section className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 xl:gap-8">
        {filteredMatches.map((match) => {
          const conversation = getConversation(match.id);
          const lastMessage = conversation[conversation.length - 1];
          const unreadCount = conversation.filter((message) => message.senderId !== (user?.id ?? '') && !message.read).length;
          const isShortlisted = user?.shortlisted.includes(match.matchedUserId);

          return (
            <article 
              key={match.id} 
              className="glass-card group flex flex-col overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border-[#8f7b67]/5"
            >
              {/* Profile Image View */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <ProfilePhoto
                  src={getProfilePhotoSrc(match.matchedUser.photos)}
                  name={match.matchedUser.name}
                  gender={match.matchedUser.gender}
                  alt={match.matchedUser.name}
                  className="h-full w-full"
                  mediaClassName="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1f2330] via-transparent to-transparent opacity-90" />
                
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#1f2330] flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="h-3 w-3 text-[#4b7165]" />
                    {getVerificationLabel(match.matchedUser)}
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#b84f45] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg animate-pulse">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                {isShortlisted && (
                  <div className="absolute right-4 top-4 h-10 w-10 flex items-center justify-center rounded-full bg-[#1f2330]/40 backdrop-blur-md border border-white/20 text-white">
                    <Star className="h-5 w-5 fill-white" />
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h2 className="text-3xl font-black tracking-tight leading-none group-hover:translate-x-1 transition-transform">
                    {match.matchedUser.name}, {match.matchedUser.age}
                  </h2>
                  <div className="mt-2 flex items-center gap-2 text-xs font-bold text-white/70">
                    <MapPin className="h-3.5 w-3.5 text-[#efc18d]" />
                    {match.matchedUser.location}
                  </div>
                </div>
              </div>

              {/* Content Panel */}
              <div className="flex flex-1 flex-col space-y-5 p-5 sm:space-y-6 sm:p-6">
                {/* Stats Chips */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-[#f3e5d6]/30 p-3 flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#9a8a79] mb-1">Education</p>
                    <p className="text-xs font-bold text-[#1f2330] line-clamp-1">{match.matchedUser.details.education}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f3e5d6]/30 p-3 flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#9a8a79] mb-1">Community</p>
                    <p className="text-xs font-bold text-[#1f2330] line-clamp-1">{match.matchedUser.details.community}</p>
                  </div>
                </div>

                {/* Latest Interaction */}
                <div className="relative rounded-3xl border border-[#8f7b67]/5 bg-gradient-to-br from-white to-[#fdf2f2]/40 p-4 shadow-sm transition-colors group-hover:bg-white sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-3 w-3 text-[#b84f45]" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#b84f45]">Latest Pulse</p>
                  </div>
                  <p className="text-sm leading-relaxed text-[#62584d] line-clamp-2 italic font-medium">
                    {lastMessage?.content ? `"${lastMessage.content}"` : 'Awaiting your kind introduction. Small steps lead to lifelong bonds.'}
                  </p>
                </div>

                {/* Actions Dock */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-2.5 pt-1 sm:gap-3 sm:pt-2">
                  <Link 
                    to={`/chat/${match.id}`} 
                    className="group/btn flex items-center justify-center gap-2.5 rounded-full bg-[#1f2330] py-3.5 text-[0.68rem] font-black uppercase tracking-widest text-white shadow-xl transition-all hover:scale-[1.03] active:scale-95 sm:gap-3 sm:py-4 sm:text-xs"
                  >
                    <MessageCircle className="h-4 w-4 transition-transform group-hover/btn:-rotate-12" />
                    {unreadCount > 0 ? `Reply (${unreadCount})` : 'Start Chat'}
                  </Link>
                  <button 
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#8f7b67]/10 text-[#1f2330] shadow-sm transition-all hover:bg-gray-50 active:scale-90"
                    title="Plan a meeting (coming soon)"
                  >
                    <Calendar className="h-5 w-5" />
                  </button>
                  <Link 
                    to={`/profile/${match.matchedUserId}`} 
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#8f7b67]/10 text-[#1f2330] shadow-sm transition-all hover:bg-gray-50 active:scale-90"
                  >
                    <Sparkles className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Empty State for Filters */}
      {filteredMatches.length === 0 && (
        <div className="py-20 text-center animate-in face-in duration-500">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#f3e5d6]/50 text-[#b84f45] mb-6">
            <Filter className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-black text-[#1f2330]">No connections match this filter.</h3>
          <p className="mt-2 text-[#62584d]">Try broadening your search or exploring new introductions.</p>
          <button 
            onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
            className="mt-8 btn-secondary"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
