import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  MapPin,
  Shield,
  Sparkles,
  Star,
  X,
  Users,
  GraduationCap,
  Languages,
} from 'lucide-react';
import { ProfilePhoto } from '@/components/ProfilePhoto';
import { getProfilePhotoSrc } from '@/components/profilePhotoUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchDismissedProfileIds, saveDismissedProfiles } from '@/lib/chatService';
import { getCompatibilityScore, getInterestState, getSharedInterests, getVerificationLabel } from '@/lib/matchmaking';
import { formatChoiceLabel } from '@/lib/profileLabels';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useNotificationStore } from '@/store/notificationStore';
import { toast } from 'sonner';

const LEGACY_DISMISSED_STORAGE_KEY = 'soulmate-dismissed';

function readLegacyDismissedProfileIds(): string[] {
  try {
    const rawValue = localStorage.getItem(LEGACY_DISMISSED_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    if (Array.isArray(parsedValue)) {
      return parsedValue.filter((value): value is string => typeof value === 'string');
    }

    const persistedDismissedProfiles = parsedValue?.state?.dismissedProfiles;
    return Array.isArray(persistedDismissedProfiles)
      ? persistedDismissedProfiles.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

export default function Discover() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, toggleShortlist } = useAuthStore();
  // All real data from chatStore (Supabase)
  const { profiles, matches, interestRequests, sendInterest, respondToInterest, loadAll, loadProfiles } = useChatStore();
  const { addNotification } = useNotificationStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [dismissedProfiles, setDismissedProfiles] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const loadDiscoverData = async () => {
      try {
        const legacyDismissedProfiles = readLegacyDismissedProfileIds()
          .map((dismissedUserId) => dismissedUserId.trim())
          .filter((dismissedUserId) => dismissedUserId && dismissedUserId !== user.id);

        if (legacyDismissedProfiles.length > 0) {
          await saveDismissedProfiles(user.id, legacyDismissedProfiles);
          localStorage.removeItem(LEGACY_DISMISSED_STORAGE_KEY);
        }

        const [dbDismissedProfiles] = await Promise.all([
          fetchDismissedProfileIds(user.id),
          loadProfiles(),
          loadAll(),
        ]);

        if (!isMounted) {
          return;
        }

        setDismissedProfiles(dbDismissedProfiles);
      } catch (error) {
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : 'We could not load your introduction queue.');
        }
      } finally {
        if (isMounted) {
          setHasLoaded(true);
        }
      }
    };

    void loadDiscoverData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, loadProfiles, loadAll]);

  // Build potential matches: real profiles excluding dismissed, matched, and blocked
  const potentialMatches = useMemo(() => {
    const blockedIds = new Set(user?.blockedUsers ?? []);
    const matchedIds = new Set(matches.map((m) => m.matchedUserId));
    return profiles.filter(
      (p) => !dismissedProfiles.includes(p.id) && !matchedIds.has(p.id) && !blockedIds.has(p.id),
    );
  }, [profiles, dismissedProfiles, matches, user?.blockedUsers]);

  useEffect(() => {
    if (currentIndex > Math.max(0, potentialMatches.length - 1)) {
      setCurrentIndex(Math.max(0, potentialMatches.length - 1));
    }
  }, [currentIndex, potentialMatches.length]);

  const currentProfile = potentialMatches[currentIndex];
  const currentUserId = user?.id ?? '';
  const compatibility = currentProfile ? getCompatibilityScore(user, currentProfile) : 0;
  const compatibilityCircumference = 2 * Math.PI * 44;
  const compatibilityStrokeOffset = compatibilityCircumference - (compatibility / 100) * compatibilityCircumference;
  const formatTaggedValue = (value?: string, fallback = 'Not shared yet') => formatChoiceLabel(value, fallback);
  const compatibilityBand =
    compatibility >= 90
      ? 'Rare alignment'
      : compatibility >= 80
        ? 'Very strong fit'
        : compatibility >= 68
          ? 'High potential'
          : compatibility >= 55
            ? 'Promising match'
            : 'Worth exploring';
  const compatibilityNote =
    compatibility >= 80
      ? 'Shared values, roots, and lifestyle patterns are lining up unusually well.'
      : compatibility >= 68
        ? 'A lot of the essentials already match, with room to explore chemistry.'
        : 'There are enough strong signals here to justify a closer introduction.';
  const sharedInterests = useMemo(
    () => (currentProfile ? getSharedInterests(user, currentProfile) : []),
    [currentProfile, user],
  );
  const interestState = currentProfile
    ? getInterestState(interestRequests, matches, currentUserId, currentProfile.id)
    : 'none';
  const isShortlisted = currentProfile ? user?.shortlisted.includes(currentProfile.id) : false;

  const handlePass = () => {
    if (!currentProfile || !currentUserId) return;

    setDirection('left');
    window.setTimeout(async () => {
      try {
        await saveDismissedProfiles(currentUserId, [currentProfile.id]);
        setDismissedProfiles((previous) =>
          previous.includes(currentProfile.id) ? previous : [...previous, currentProfile.id],
        );
        toast.info(`Passed ${currentProfile.name}. Moving to next profile.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'We could not dismiss this profile just now.');
      }

      setDirection(null);
      setShowDetails(false);
    }, 300);
  };

  const handlePrimaryAction = () => {
    if (!currentProfile) return;
    if (interestState === 'outgoing') return;

    setDirection('right');
    setTimeout(async () => {
      try {
        if (interestState === 'incoming') {
          const request = interestRequests.find(
            (item) => item.fromUserId === currentProfile.id && item.toUserId === currentUserId && item.status === 'pending',
          );

          if (request) {
            const result = await respondToInterest(request.id, 'accepted');
            if (result.matchId) {
              toast.success(`It's a Match! You and ${currentProfile.name} are now connected.`);
              addNotification({
                userId: currentUserId,
                type: 'match',
                title: `${currentProfile.name} is now a match`,
                message: 'Direct messaging is unlocked. Keep the momentum warm.',
                href: `/chat/${result.matchId}`,
              });
            }
          }
        } else if (interestState === 'matched') {
          const existingMatch = matches.find((m) => m.matchedUserId === currentProfile.id);
          navigate(`/chat/${existingMatch?.id ?? ''}`);
        } else {
          const result = await sendInterest(currentProfile.id);
          toast.success(`Interest sent to ${currentProfile.name}. Waiting for their response.`);
          addNotification({
            userId: currentUserId,
            type: result.outcome === 'matched' ? 'match' : 'interest',
            title: result.outcome === 'matched' ? `Matched with ${currentProfile.name}` : `Interest sent to ${currentProfile.name}`,
            message:
              result.outcome === 'matched'
                ? 'They had already expressed interest, so chat is open immediately.'
                : 'Your interest is in their inbox now. We will surface a reply here if they accept.',
            href: result.matchId ? `/chat/${result.matchId}` : `/profile/${currentProfile.id}`,
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      }

      setDirection(null);
      setShowDetails(false);
    }, 300);
  };

  const handleToggleShortlist = () => {
    if (!currentProfile) return;
    toggleShortlist(currentProfile.id);
    toast.success(isShortlisted ? `Removed ${currentProfile.name} from shortlist` : `Added ${currentProfile.name} to shortlist`);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!currentProfile) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); handlePass(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); handlePrimaryAction(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); setShowDetails(v => !v); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentProfile, interestState, interestRequests]);

  if (!hasLoaded) return <div className="app-screen-focused glass-card animate-skeleton shadow-none border-none" />;

  if (potentialMatches.length === 0) {
    return (
      <div className="app-screen-focused glass-card flex flex-col items-center justify-center p-10 text-center animate-fade-in shadow-2xl">
        <div className="flex h-24 w-24 items-center justify-center rounded-[40px] bg-[#fdf2f2] text-[#b84f45] shadow-inner mb-8">
          <Heart className="h-12 w-12 animate-pulse" />
        </div>
        <h1 className="text-4xl font-black text-[#1f2330]">Queue Explored.</h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#62584d]">
          You've handled all current introductions. New recommendations are generated periodically based on your evolving preferences.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button
            onClick={() => {
              if (!user) return;

              setHasLoaded(false);
              Promise.all([fetchDismissedProfileIds(user.id), loadProfiles(), loadAll()])
                .then(([dbDismissedProfiles]) => {
                  setDismissedProfiles(dbDismissedProfiles);
                })
                .finally(() => setHasLoaded(true));
            }}
            className="btn-primary px-10 py-4 shadow-xl"
          >
            Refresh my queue
          </button>
          <button onClick={() => navigate('/search')} className="btn-secondary px-10 py-4">
            Search broader
          </button>
        </div>
      </div>
    );
  }

  const primaryActionLabel =
    interestState === 'incoming' ? (isMobile ? 'Accept' : 'Accept Interest') :
    interestState === 'matched' ? (isMobile ? 'Chat' : 'Open Chat') :
    interestState === 'outgoing' ? (isMobile ? 'Pending' : 'Interest Sent') :
    (isMobile ? 'Connect' : 'Send Interest');

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-5 pb-16 sm:space-y-6 sm:pb-20">
      {/* Introduction Header */}
      <section className="glass-card overflow-hidden p-5 sm:p-10">
        <div className="relative z-10 flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#efc18d]" />
              <span className="eyebrow">Smart Matchmaking</span>
            </div>
            <h1 className="mt-4 text-[clamp(2.2rem,6vw,3.8rem)] font-black leading-tight text-[#1f2330]">
              {isMobile ? 'New Introductions.' : 'Curated Introductions Just for You.'}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#62584d] sm:text-lg">
              We've analyzed thousands of data points to find people who share your values, community roots, and life goals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex -space-x-3 overflow-hidden p-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-[#f3e5d6] backdrop-blur-sm shadow-sm" />
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f2330] text-[10px] font-bold text-white ring-2 ring-white">
                +{potentialMatches.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Discover Layout */}
      <section className="grid gap-5 sm:gap-6 lg:grid-cols-12 lg:items-start">
        {/* Profile Card Column */}
        <div className="lg:col-span-7">
          <div className="relative">
            {/* Background stack effect */}
            {potentialMatches.slice(currentIndex + 1, currentIndex + 3).map((_, idx) => (
              <div 
                key={idx}
                className="absolute inset-0 z-0 hidden rounded-[40px] border border-[#8f7b67]/10 bg-white/40 shadow-sm xl:block"
                style={{
                  transform: `translate(${12 + idx * 12}px, ${12 + idx * 12}px) scale(${0.98 - idx * 0.02})`,
                  opacity: 0.5 - idx * 0.2
                }}
              />
            ))}

            <div
              className={`glass-card group overflow-hidden transition-all duration-500 ease-swipe shadow-2xl relative z-10 ${
                direction === 'left' ? '-translate-x-full -rotate-12 opacity-0 scale-90' : ''
              } ${direction === 'right' ? 'translate-x-full rotate-12 opacity-0 scale-90' : ''}`}
            >
              <div className="relative h-[360px] w-full overflow-hidden sm:h-[40rem] xl:h-[45rem]">
                <ProfilePhoto
                  src={getProfilePhotoSrc(currentProfile.photos)}
                  name={currentProfile.name}
                  gender={currentProfile.gender}
                  alt={currentProfile.name}
                  className="h-full w-full"
                  mediaClassName="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  animated
                />
                
                {/* Overlay Badges */}
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3.5 sm:p-6">
                  <div className="flex max-w-[12rem] flex-wrap gap-1.5 sm:max-w-none sm:gap-2">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#1f2330] shadow-sm backdrop-blur-md sm:px-4 sm:py-1.5 sm:text-[10px] sm:tracking-widest">
                      {formatTaggedValue(currentProfile.preferences.lookingFor)}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-[#1f2330]/80 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-sm backdrop-blur-md sm:gap-1.5 sm:px-4 sm:py-1.5 sm:text-[10px] sm:tracking-widest">
                      <Shield className="h-3 w-3" />
                      {getVerificationLabel(currentProfile)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#1f2330] backdrop-blur-md shadow-lg transition-all hover:bg-white disabled:opacity-30 disabled:scale-95 sm:h-12 sm:w-12"
                    >
                      <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.min(potentialMatches.length - 1, prev + 1))}
                      disabled={currentIndex >= potentialMatches.length - 1}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#1f2330] backdrop-blur-md shadow-lg transition-all hover:bg-white disabled:opacity-30 disabled:scale-95 sm:h-12 sm:w-12"
                    >
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </div>
                </div>

                {/* Bottom Profile Info */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1f2330] via-[#1f2330]/86 via-45% to-transparent p-4 text-white sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                    <div>
                      <div className="mb-2.5 flex flex-wrap gap-2 sm:mb-4">
                        {interestState === 'incoming' && (
                          <span className="animate-bounce bg-[#efc18d] px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[#1f2330] rounded-full">
                            Interested In You
                          </span>
                        )}
                        {isShortlisted && (
                          <span className="bg-white/20 backdrop-blur-md px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white rounded-full">
                            Shortlisted
                          </span>
                        )}
                      </div>
                      <h2 className="max-w-[15rem] text-[3.25rem] font-black leading-[0.86] tracking-[-0.06em] sm:max-w-none sm:text-6xl sm:leading-none sm:tracking-tight">
                        <span>{currentProfile.name},</span>{' '}
                        <span className="block mt-1 text-white/60 sm:mt-0 sm:inline">{currentProfile.age}</span>
                      </h2>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.88rem] font-bold text-white/76 sm:mt-4 sm:gap-5 sm:text-sm sm:text-white/70">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#efc18d]" />
                          {currentProfile.location}
                        </span>
                        <span className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-[#efc18d]" />
                          {currentProfile.profession}
                        </span>
                        <span className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-[#efc18d]" />
                          {currentProfile.details.education}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowDetails(!showDetails)} 
                      className="group flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-widest text-[#1f2330] shadow-xl transition-all hover:scale-105 active:scale-95 sm:w-auto sm:px-8 sm:py-4"
                    >
                      <Info className="h-5 w-5 transition-transform group-hover:rotate-12" />
                      {showDetails ? 'Hide Details' : 'Full Profile'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details & Actions Column */}
        <div className="space-y-5 sm:space-y-6 lg:col-span-5">
          {/* Action Dock — shown first on mobile, last on desktop */}
          <div className="glass-card relative z-20 order-first border-[#8f7b67]/10 p-5 shadow-xl sm:p-8 lg:order-last">
            <p className="mb-5 text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c] sm:mb-6">Take the first step</p>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <button
                onClick={handlePass}
                className="group flex flex-col items-center justify-center gap-2.5 rounded-[28px] border border-[#d26852]/10 bg-[#fdf2f2] py-5 text-[#b84f45] transition-all hover:bg-red-100 hover:shadow-lg active:scale-95 sm:gap-3 sm:rounded-[32px] sm:py-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm transition-transform group-hover:rotate-12 sm:h-12 sm:w-12">
                  <X className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Skip</span>
              </button>

              <button
                onClick={handleToggleShortlist}
                className={`group flex flex-col items-center justify-center gap-2.5 rounded-[28px] border py-5 transition-all active:scale-95 hover:shadow-lg sm:gap-3 sm:rounded-[32px] sm:py-6 ${
                  isShortlisted
                    ? 'border-[#1f2330]/20 bg-[#1f2330] text-white shadow-xl shadow-[#1f2330]/10'
                    : 'border-[#8f7b67]/10 bg-white text-[#1f2330] hover:bg-gray-50'
                }`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition-all group-hover:scale-110 sm:h-12 sm:w-12 ${isShortlisted ? 'bg-white/20' : 'bg-gray-100'}`}>
                  <Star className={`h-6 w-6 ${isShortlisted ? 'fill-white' : ''}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{isShortlisted ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={handlePrimaryAction}
                disabled={interestState === 'outgoing'}
                className="group flex flex-col items-center justify-center gap-2.5 rounded-[28px] bg-[#1f2330] py-5 text-white shadow-2xl shadow-[#1f2330]/30 transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100 sm:gap-3 sm:rounded-[32px] sm:py-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6 sm:h-12 sm:w-12">
                  {interestState === 'incoming' ? <BadgeCheck className="h-7 w-7" /> : <Heart className="h-7 w-7 fill-white" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 text-center">{primaryActionLabel}</span>
              </button>
            </div>
          </div>

          {/* Compatibility Score */}
          <div className="glass-card group relative overflow-hidden bg-gradient-to-br from-white/80 to-[#fdf2f2]/40 p-5 sm:p-8">
            <div className="absolute right-[-0.75rem] top-[-0.75rem] h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(216,122,96,0.16),transparent_70%)] opacity-70 blur-2xl sm:right-[-1rem] sm:top-[-1rem] sm:h-36 sm:w-36 sm:opacity-80" />
            
            <div className="relative z-10 flex flex-col gap-5 sm:gap-6">
              <div className="flex items-start justify-between gap-4 sm:gap-6">
                <div className="min-w-0 flex-1 sm:max-w-[17rem]">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8c7c6c]">Match Score</p>
                  <h3 className="mt-1 text-[2.15rem] font-black leading-[0.94] text-[#1f2330] sm:text-3xl sm:leading-none">Deep Compatibility</h3>
                </div>

                <div className="relative flex h-[7.7rem] w-[7.7rem] shrink-0 items-center justify-center sm:ml-auto sm:h-[10rem] sm:w-[10rem]">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.98),rgba(248,237,228,0.92)_58%,rgba(239,220,204,0.72)_100%)] shadow-[0_18px_38px_rgba(76,53,35,0.12)] ring-1 ring-white/85 sm:shadow-[0_24px_55px_rgba(76,53,35,0.14)]" />
                  <div className="absolute inset-[0.7rem] rounded-full border border-white/70 bg-[radial-gradient(circle,rgba(255,255,255,0.78),rgba(255,248,241,0.42)_72%,rgba(255,244,236,0.18)_100%)] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:inset-[0.85rem]" />
                  <div className="absolute inset-[1.2rem] rounded-full border border-[#f0ddd1] bg-[#fffaf6] sm:inset-[1.45rem]" />

                  <svg viewBox="0 0 120 120" className="absolute inset-1/2 h-[5.75rem] w-[5.75rem] -translate-x-1/2 -translate-y-1/2 -rotate-90 sm:h-[7.9rem] sm:w-[7.9rem]">
                    <defs>
                      <linearGradient id="discover-compatibility-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e08a65" />
                        <stop offset="100%" stopColor="#b84f45" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="60"
                      cy="60"
                      r="44"
                      fill="transparent"
                      stroke="rgba(232, 222, 212, 0.9)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="44"
                      fill="transparent"
                      stroke="url(#discover-compatibility-ring)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={compatibilityCircumference}
                      strokeDashoffset={compatibilityStrokeOffset}
                      className="drop-shadow-[0_6px_14px_rgba(184,79,69,0.25)] transition-all duration-700 ease-out"
                    />
                  </svg>

                  <div className="relative z-10 flex h-[4.1rem] w-[4.1rem] flex-col items-center justify-center rounded-full border border-[#eedccd] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(255,250,245,0.96)_72%,rgba(248,236,225,0.92)_100%)] shadow-[0_12px_24px_rgba(85,59,40,0.11)] sm:h-[5.4rem] sm:w-[5.4rem] sm:shadow-[0_14px_30px_rgba(85,59,40,0.12)]">
                    <span className="font-black leading-none tracking-[-0.05em] text-[#1f2330] tabular-nums text-[1.52rem] sm:text-[1.95rem]">{compatibility}%</span>
                    <span className="mt-1 text-[0.48rem] font-black uppercase tracking-[0.32em] text-[#8c7c6c] sm:text-[0.54rem] sm:tracking-[0.34em]">match</span>
                  </div>
                </div>
              </div>

              <div className="max-w-none sm:max-w-[17rem]">
                <p className="mt-0 text-sm leading-7 text-[#62584d]">{compatibilityNote}</p>
                <span className="mt-4 inline-flex items-center rounded-full border border-[#e6d5c6] bg-white/78 px-3.5 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#b84f45] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  {compatibilityBand}
                </span>
              </div>
            </div>
            
            <div className="mt-7 grid grid-cols-2 gap-3.5 relative z-10 sm:mt-8 sm:gap-4">
              <div className="rounded-3xl bg-white/60 p-4 shadow-sm border border-[#8f7b67]/5 transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="h-4 w-4 text-[#b84f45]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7c6c]">Roots</p>
                </div>
                <p className="font-bold text-[#1f2330]">{currentProfile.details.motherTongue}</p>
                <p className="text-[10px] text-[#62584d] mt-0.5 line-clamp-1">{currentProfile.details.community}</p>
              </div>
              <div className="rounded-3xl bg-white/60 p-4 shadow-sm border border-[#8f7b67]/5 transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-[#b84f45]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7c6c]">Heritage</p>
                </div>
                <p className="font-bold text-[#1f2330]">{formatTaggedValue(currentProfile.details.familyValues)}</p>
                <p className="text-[10px] text-[#62584d] mt-0.5 line-clamp-1">{formatTaggedValue(currentProfile.details.familyType)}</p>
              </div>
            </div>

            <div className="mt-6 relative z-10">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#8c7c6c]">Shared Interests</p>
              <div className="flex flex-wrap gap-2">
                {(sharedInterests.length > 0 ? sharedInterests : currentProfile.interests.slice(0, 3)).map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#1f2330] shadow-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bio & Details Section */}
          <div className="glass-card animate-in slide-in-from-right-4 p-5 duration-500 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-1 w-6 rounded-full bg-[#1f2330]"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8c7c6c]">Personal bio</p>
            </div>
            
            <p className="text-base leading-relaxed text-[#17161c] font-medium italic">
              "{currentProfile.bio}"
            </p>

            {showDetails && (
              <div className="mt-8 space-y-6 animate-in fade-in duration-300">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="surface-muted p-5 rounded-[32px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9a8a79] mb-2">Ancestry & Origins</p>
                    <p className="font-bold text-[#1f2330]">{currentProfile.details.familyBackground}</p>
                  </div>
                  <div className="surface-muted p-5 rounded-[32px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9a8a79] mb-2">Annual Income</p>
                    <p className="font-bold text-[#1f2330]">{currentProfile.details.annualIncome}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="surface-muted p-5 rounded-[32px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9a8a79] mb-2">Family Type</p>
                    <p className="font-bold text-[#1f2330]">{formatTaggedValue(currentProfile.details.familyType)}</p>
                  </div>
                  <div className="surface-muted p-5 rounded-[32px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9a8a79] mb-2">Mangal Status</p>
                    <p className="font-bold text-[#1f2330]">{formatTaggedValue(currentProfile.details.mangalStatus)}</p>
                  </div>
                  <div className="surface-muted p-5 rounded-[32px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9a8a79] mb-2">Employment Type</p>
                    <p className="font-bold text-[#1f2330]">{formatTaggedValue(currentProfile.details.employmentType)}</p>
                  </div>
                  <div className="surface-muted p-5 rounded-[32px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9a8a79] mb-2">NRI / Foreign Status</p>
                    <p className="font-bold text-[#1f2330]">{formatTaggedValue(currentProfile.details.foreignStatus)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9a8a79] mb-3 px-1">Interests & Lifestyle</p>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.map((interest) => (
                      <span key={interest} className="rounded-full bg-[#f3e5d6]/50 border border-[#8f7b67]/10 px-4 py-2 text-xs font-bold text-[#1f2330]">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Trust Message */}
      <footer className="py-12 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-4 w-4 text-[#b84f45]" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#8c7c6c]">Private • Secure • Verified</p>
        </div>
        <p className="text-xs text-[#8c7c6c]/60 max-w-sm">
          Soulmate uses advanced encryption to protect your profile details. Connections only open upon mutual consent.
        </p>
      </footer>
    </div>
  );
}
