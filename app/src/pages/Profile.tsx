import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  Calendar,
  Camera,
  Edit2,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  GraduationCap,
  Info,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { ProfilePhoto } from '@/components/ProfilePhoto';
import { getProfilePhotoSrc } from '@/components/profilePhotoUtils';
import { getInterestState, getVerificationLabel } from '@/lib/matchmaking';
import { formatChoiceLabel } from '@/lib/profileLabels';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useNotificationStore } from '@/store/notificationStore';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user, toggleShortlist, addViewedProfile } = useAuthStore();
  const { matches, interestRequests, getProfileById, sendInterest, respondToInterest, isUserOnline } = useChatStore();
  const { addNotification } = useNotificationStore();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const isOwnProfile = !userId || userId === user?.id;
  const profileUser = isOwnProfile ? user : getProfileById(userId ?? '');
  const currentUserId = user?.id ?? '';

  useEffect(() => {
    if (!isOwnProfile && userId) {
      addViewedProfile(userId);
    }
  }, [isOwnProfile, addViewedProfile, userId]);

  if (!profileUser) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 animate-fade-in">
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center shadow-2xl bg-gradient-to-br from-white/90 to-[#fdf2f2]/40 border-none">
          <Sparkles className="h-16 w-16 text-[#b84f45] animate-pulse" />
          <h1 className="mt-8 text-4xl font-black text-[#1f2330]">Profile not found.</h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#62584d]">
            This profile might have been deactivated or its visibility settings have changed.
          </p>
          <Link to="/dashboard" className="btn-primary mt-10 px-10 py-4 shadow-xl">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const joinedDate = new Date(profileUser.createdAt).toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  const verificationLabel = getVerificationLabel(profileUser);
  const interestState = isOwnProfile ? 'none' : getInterestState(interestRequests, matches, currentUserId, profileUser.id);
  const isShortlisted = user?.shortlisted.includes(profileUser.id);
  const showPremiumBadge = profileUser.verification.idVerified || profileUser.stats.boostScore >= 85;
  const formatTextValue = (value: string | undefined, fallback = 'Not shared yet') => {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : fallback;
  };
  const formatTaggedValue = (value: string | undefined, fallback = 'Not shared yet') => formatChoiceLabel(value, fallback);
  const careerIntentLabel =
    profileUser.details.careerIntent === 'yes'
      ? 'Open to working'
      : profileUser.details.careerIntent === 'optional'
        ? 'Flexible'
        : profileUser.details.careerIntent === 'no'
          ? 'Not planning to work'
          : 'Not shared yet';

  const handleInterestAction = async () => {
    if (isOwnProfile) return;
    if (interestState === 'matched') {
      const existingMatch = matches.find((m) => m.matchedUserId === profileUser.id);
      navigate(`/chat/${existingMatch?.id ?? ''}`);
      return;
    }

    try {
      if (interestState === 'incoming') {
        const request = interestRequests.find(r => r.fromUserId === profileUser.id && r.toUserId === currentUserId && r.status === 'pending');
        if (!request) return;

        const result = await respondToInterest(request.id, 'accepted');
        if (result.matchId) {
          toast.success(`You matched with ${profileUser.name}!`);
          addNotification({
            userId: currentUserId,
            type: 'match',
            title: `${profileUser.name} is now a match`,
            message: 'You accepted the interest and unlocked direct messaging.',
            href: `/chat/${result.matchId}`,
          });
        }
        return;
      }

      const result = await sendInterest(profileUser.id);
      toast.success(`Interest sent to ${profileUser.name}.`);
      addNotification({
        userId: currentUserId,
        type: result.outcome === 'matched' ? 'match' : 'interest',
        title: result.outcome === 'matched' ? `Matched with ${profileUser.name}` : `Interest sent to ${profileUser.name}`,
        message: result.outcome === 'matched' ? 'The profile had already liked you.' : 'Your interest request is now pending.',
        href: result.matchId ? `/chat/${result.matchId}` : `/profile/${profileUser.id}`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  const handleToggleShortlist = () => {
    toggleShortlist(profileUser.id);
    toast.success(isShortlisted ? `Removed ${profileUser.name} from shortlist` : `Added ${profileUser.name} to shortlist`);
  };

  const recentVisitors = (user?.recentVisitors ?? [])
    .map((id) => getProfileById(id))
    .filter((visitor): visitor is NonNullable<ReturnType<typeof getProfileById>> => Boolean(visitor));

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-5 pb-16 sm:space-y-8 sm:pb-20">
      {/* Header & Cover Section */}
      <section className="glass-card overflow-hidden bg-white/80 border-none shadow-2xl relative">
        <div className="relative h-[19rem] w-full group sm:h-[35rem]">
          <ProfilePhoto
            src={getProfilePhotoSrc(profileUser.photos, activePhotoIndex)}
            name={profileUser.name}
            gender={profileUser.gender}
            alt={profileUser.name}
            className="h-full w-full"
            mediaClassName="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
            animated
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f2330] via-[#1f2330]/40 to-transparent" />
          
          {isOwnProfile && (
            <button className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-xl transition-all backdrop-blur-md hover:bg-white/30 sm:right-6 sm:top-6 sm:h-14 sm:w-14">
              <Camera className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}

          {/* Photo Gallery Navigation */}
          {profileUser.photos.length > 1 && (
            <div className="absolute bottom-5 right-5 z-20 flex gap-2 sm:bottom-10 sm:right-10">
              {profileUser.photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${activePhotoIndex === idx ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Profile Identity Panel */}
        <div className="relative px-4 pb-6 sm:px-12 sm:pb-10">
          <div className="relative z-10 -mt-20 flex flex-col gap-5 sm:gap-8 lg:-mt-32 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-[36px] border-6 border-white bg-white shadow-2xl transition-transform hover:scale-105 sm:h-52 sm:w-52 sm:rounded-[48px] sm:border-8">
                  <ProfilePhoto
                    src={getProfilePhotoSrc(profileUser.photos)}
                    name={profileUser.name}
                    gender={profileUser.gender}
                    alt={profileUser.name}
                    className="h-full w-full"
                    mediaClassName="h-full w-full object-cover"
                  />
                </div>
                {showPremiumBadge && (
                  <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#efc18d] text-[#1f2330] shadow-lg sm:h-12 sm:w-12">
                    <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                )}
                {/* Online / Offline status badge */}
                {!isOwnProfile && (
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border-2 border-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg ${
                    isUserOnline(profileUser.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-[#9a8a79] text-white'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    {isUserOnline(profileUser.id) ? 'Online' : 'Offline'}
                  </div>
                )}
              </div>

              <div className="pb-2 sm:pb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="text-[2.85rem] font-black tracking-tight text-[#1f2330] sm:text-6xl">
                    {profileUser.name}, <span className="text-[#1f2330]/40">{profileUser.age}</span>
                  </h1>
                  <span className="rounded-full bg-[#fdf2f2] px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#b84f45] shadow-sm flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4" />
                    {verificationLabel}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-[#62584d] sm:mt-5 sm:gap-6 sm:text-sm">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#b84f45]" />
                    {profileUser.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-[#b84f45]" />
                    {profileUser.profession}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#b84f45]" />
                    Member since {joinedDate}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                  <span className="rounded-full border border-[#8f7b67]/10 bg-[#f3e5d6]/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#17161c] sm:px-5">{profileUser.details.motherTongue}</span>
                  <span className="rounded-full border border-[#8f7b67]/10 bg-[#f3e5d6]/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#17161c] sm:px-5">{profileUser.details.community}</span>
                  <span className="rounded-full border border-[#8f7b67]/10 bg-[#f3e5d6]/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#17161c] sm:px-5">{formatTaggedValue(profileUser.details.familyType)}</span>
                  <span className="rounded-full border border-[#8f7b67]/10 bg-[#f3e5d6]/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#17161c] sm:px-5">{formatTaggedValue(profileUser.details.familyValues)} Values</span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4 sm:pb-4">
              {isOwnProfile ? (
                <>
                  <Link to="/profile/edit" className="group btn-primary justify-center px-6 py-4 shadow-xl sm:px-10 sm:py-5">
                    <Edit2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
                    Edit Profile
                  </Link>
                  <Link to="/settings" className="btn-secondary justify-center px-6 py-4 sm:px-10 sm:py-5">
                    <Lock className="h-4 w-4" />
                    Privacy
                  </Link>
                </>
              ) : (
                <>
                  <button onClick={handleToggleShortlist} className="btn-secondary group justify-center px-6 py-4 sm:px-8 sm:py-5">
                    <Star className={`h-5 w-5 transition-transform group-hover:scale-110 ${isShortlisted ? 'fill-[#b84f45] text-[#b84f45]' : ''}`} />
                    {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                  </button>
                  <button 
                    onClick={handleInterestAction} 
                    disabled={interestState === 'outgoing'}
                    className="btn-primary justify-center px-6 py-4 shadow-2xl shadow-[#1f2330]/20 disabled:opacity-50 sm:px-10 sm:py-5"
                  >
                    {interestState === 'matched' ? <MessageCircle className="h-5 w-5" /> : <Heart className={`h-5 w-5 ${interestState === 'none' ? 'fill-white' : ''}`} />}
                    {interestState === 'outgoing' ? 'Request Sent' : (interestState === 'incoming' ? 'Accept Interest' : (interestState === 'matched' ? 'Start Chat' : 'Express Interest'))}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <section className="grid items-start gap-5 sm:gap-8 lg:grid-cols-12">
        {/* Left Column: Details */}
        <div className="space-y-5 sm:space-y-8 lg:col-span-12 xl:col-span-8">
          {/* Bio Section */}
          <div className="glass-card relative overflow-hidden border-none bg-gradient-to-br from-white to-[#fdf2f2]/40 p-5 shadow-xl sm:p-12">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="h-48 w-48 text-[#b84f45]" />
            </div>
            <div className="mb-6 flex items-center gap-3 sm:mb-8">
              <span className="h-1 w-8 rounded-full bg-[#1f2330]"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c]">Individual bio</p>
            </div>
            <p className="relative z-10 text-lg font-medium italic leading-relaxed text-[#17161c] sm:text-xl">
              "{profileUser.bio || 'This member is still crafting their personal story. Look for their core values in the sections below instead.'}"
            </p>
          </div>

          {/* Matrimony Specifics */}
          <div className="glass-card border-none p-5 shadow-xl sm:p-12">
            <div className="mb-7 flex items-center justify-between sm:mb-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c]">Root Essentials</p>
                <h2 className="mt-2 text-3xl font-black text-[#1f2330] sm:mt-3 sm:text-4xl">Socio-Economic Profile</h2>
              </div>
              <Info className="h-8 w-8 text-[#f3e5d6]" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              {[
                { icon: GraduationCap, label: 'Education', value: formatTextValue(profileUser.details.education) },
                { icon: Briefcase, label: 'Work At', value: formatTextValue(profileUser.details.company) },
                { icon: TrendingUp, label: 'Annual Income', value: formatTextValue(profileUser.details.annualIncome) },
                { icon: Users, label: 'Looking For', value: formatTaggedValue(profileUser.preferences.lookingFor) },
                { icon: Calendar, label: 'Marital Status', value: formatTaggedValue(profileUser.details.maritalStatus) },
                { icon: Heart, label: 'Dietary Habits', value: formatTaggedValue(profileUser.details.diet) },
              ].map((item, idx) => (
                <div key={idx} className="surface-muted group rounded-[32px] p-4 transition-all hover:bg-white hover:shadow-md sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <item.icon className="h-4 w-4 text-[#b84f45] transition-transform group-hover:scale-110" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9a8a79]">{item.label}</p>
                  </div>
                  <p className="text-base font-black text-[#1f2330] sm:text-lg">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-6">
              {[
                { icon: MapPin, label: 'Native Village', value: formatTextValue(profileUser.details.nativeVillage) },
                { icon: Users, label: 'Family Type', value: formatTaggedValue(profileUser.details.familyType) },
                { icon: Sparkles, label: 'Mangal Status', value: formatTaggedValue(profileUser.details.mangalStatus) },
                { icon: Briefcase, label: 'Employment Type', value: formatTaggedValue(profileUser.details.employmentType) },
                { icon: MapPin, label: 'NRI / Foreign Status', value: formatTaggedValue(profileUser.details.foreignStatus) },
                { icon: Heart, label: 'Smoking Habits', value: formatTaggedValue(profileUser.details.smokingHabits) },
                { icon: Heart, label: 'Drinking Habits', value: formatTaggedValue(profileUser.details.drinkingHabits) },
                { icon: Briefcase, label: 'Career After Marriage', value: careerIntentLabel },
              ].map((item, idx) => (
                <div key={idx} className="surface-muted group rounded-[32px] p-4 transition-all hover:bg-white hover:shadow-md sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <item.icon className="h-4 w-4 text-[#b84f45] transition-transform group-hover:scale-110" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9a8a79]">{item.label}</p>
                  </div>
                  <p className="text-base font-black text-[#1f2330] sm:text-lg">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="group relative mt-6 overflow-hidden rounded-[32px] bg-[#1f2330] p-5 text-white sm:mt-8 sm:rounded-[40px] sm:p-8">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="h-24 w-24" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Family Legacy & Background</p>
              <p className="text-lg leading-relaxed text-white/90 font-medium relative z-10">
                {formatTextValue(
                  profileUser.details.familyBackground,
                  'This member has not shared family background details yet.',
                )}
              </p>
            </div>
          </div>

          {/* Interests Section */}
          <div className="glass-card border-none p-5 shadow-xl sm:p-12">
            <div className="mb-6 flex items-center gap-3 sm:mb-8">
              <span className="h-1 w-8 rounded-full bg-[#1f2330]"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c]">Lifestyle & Passions</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {profileUser.interests.map((interest) => (
                <span key={interest} className="rounded-2xl border border-[#8f7b67]/10 bg-[#f3e5d6]/40 px-4 py-2.5 text-sm font-black text-[#1f2330] transition-all hover:scale-[1.03] hover:bg-[#f3e5d6] sm:px-6 sm:py-3">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-5 sm:space-y-8 lg:col-span-12 xl:col-span-4">
          {/* Trust Insight */}
          <div className="glass-dark group relative overflow-hidden rounded-[36px] p-5 shadow-2xl sm:rounded-[48px] sm:p-10">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="h-32 w-32" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Trust Insight</p>
              <h3 className="mt-4 text-[2rem] font-black leading-tight text-white sm:text-3xl">Authentic & Verified Experience.</h3>
              <div className="mt-6 space-y-5 sm:mt-10 sm:space-y-6">
                {[
                  { label: 'Verification', value: verificationLabel, icon: BadgeCheck },
                  { label: 'Communication', value: profileUser.privacy.contactPermission.replace('-', ' '), icon: MessageCircle },
                  { label: 'Activity Level', value: isOwnProfile ? 'Current User' : 'Active Member', icon: TrendingUp },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-5">
                    <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/10 text-[#efc18d] border border-white/10">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{stat.label}</p>
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="glass-card border-none p-5 shadow-xl sm:p-8">
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c] mb-6">Partner Expectations</p>
             <div className="space-y-3 sm:space-y-4">
               {[
                 { label: 'Intent', value: profileUser.preferences.lookingFor },
                 { label: 'Preferred Age', value: `${profileUser.preferences.ageRange[0]} - ${profileUser.preferences.ageRange[1]}` },
                 { label: 'Verification Req.', value: profileUser.preferences.verifiedOnly ? 'Strictly Verified' : 'Flexible' },
               ].map((pref, i) => (
                 <div key={i} className="group flex items-center justify-between rounded-2xl bg-[#f3e5d6]/20 p-3.5 transition-colors hover:bg-[#f3e5d6]/40 sm:p-4">
                   <span className="text-xs font-bold text-[#8c7c6c]">{pref.label}</span>
                   <span className="text-sm font-black text-[#1f2330] capitalize">{pref.value}</span>
                 </div>
               ))}
             </div>
          </div>

          {/* Own Profile Stats / Visitors */}
          {isOwnProfile && (
            <div className="glass-card p-8 border-none shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c]">Recent Engagement</p>
                <ChevronRight className="h-4 w-4 text-[#8c7c6c]" />
              </div>
              <div className="space-y-4">
                {recentVisitors.slice(0, 4).map((visitor, i) => (
                  <Link key={i} to={`/profile/${visitor.id}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
                    <ProfilePhoto
                      src={getProfilePhotoSrc(visitor.photos)}
                      name={visitor.name}
                      gender={visitor.gender}
                      alt={visitor.name}
                      className="h-14 w-14 rounded-2xl shadow-md"
                      mediaClassName="h-full w-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#1f2330] group-hover:text-[#b84f45] transition-colors">{visitor.name}</p>
                      <p className="text-[10px] font-bold text-[#9a8a79] truncate">{visitor.profession}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/discover" className="mt-8 btn-secondary w-full justify-center">View All Insights</Link>
            </div>
          )}
        </div>
      </section>

      {/* Safety Message */}
      <footer className="py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 rounded-full bg-[#fdf2f2] border border-[#b84f45]/10">
          <ShieldCheck className="h-5 w-5 text-[#b84f45]" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b84f45]">Secure Introductions Only</p>
        </div>
        <p className="text-xs text-[#8c7c6c]/60 max-w-sm leading-relaxed font-medium">
          Soulmate prioritizes serious intentions. Your data is encrypted and only shared with matches who meet your criteria.
        </p>
      </footer>
    </div>
  );
}
