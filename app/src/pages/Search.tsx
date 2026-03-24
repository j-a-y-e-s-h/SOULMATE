import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Search as SearchIcon,
  SlidersHorizontal,
  Sparkles,
  X,
  Filter,
  Briefcase,
  Building,
} from 'lucide-react';
import { ProfilePhoto } from '@/components/ProfilePhoto';
import { getProfilePhotoSrc } from '@/components/profilePhotoUtils';
import {
  communityOptions,
  dietOptions,
  educationOptions,
  employmentTypeOptions,
  familyTypeOptions,
  familyValueOptions,
  foreignStatusOptions,
  mangalStatusOptions,
  maritalStatusOptions,
  motherTongueOptions,
} from '@/lib/demoData';
import { getInterestState, getVerificationLabel, isRecentlyActive } from '@/lib/matchmaking';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useNotificationStore } from '@/store/notificationStore';
import { toast } from 'sonner';
import type { SearchFilters } from '@/types';

const defaultFilters: SearchFilters = {
  ageRange: [22, 36],
  distance: 100,
  interests: [],
  hasPhoto: true,
  onlineOnly: false,
  verifiedOnly: false,
  lookingFor: 'any',
  motherTongues: [],
  communities: [],
  educationLevels: [],
  familyValues: [],
  maritalStatus: [],
  diet: [],
  familyType: [],
  mangalStatus: [],
  foreignStatus: [],
  employmentType: [],
};

export default function Search() {
  const { user, addViewedProfile } = useAuthStore();
  const { profiles, matches, interestRequests, loadAll, loadProfiles, sendInterest, respondToInterest } =
    useChatStore();
  const { addNotification } = useNotificationStore();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  useEffect(() => {
    Promise.all([loadProfiles(), loadAll()]);
  }, [loadProfiles, loadAll]);

  const currentUserId = user?.id ?? '';
  const allInterests = useMemo(
    () => Array.from(new Set(profiles.flatMap((profile) => profile.interests))).slice(0, 20),
    [profiles],
  );

  const filteredMatches = profiles.filter((profile) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesQuery =
        profile.name.toLowerCase().includes(query) ||
        profile.location.toLowerCase().includes(query) ||
        profile.profession.toLowerCase().includes(query) ||
        profile.details.community.toLowerCase().includes(query) ||
        profile.details.motherTongue.toLowerCase().includes(query) ||
        profile.interests.some((interest) => interest.toLowerCase().includes(query));

      if (!matchesQuery) return false;
    }

    if (profile.age < filters.ageRange[0] || profile.age > filters.ageRange[1]) return false;
    if (filters.hasPhoto && profile.photos.length === 0) return false;
    if (filters.onlineOnly && !isRecentlyActive(profile)) return false;
    if (filters.verifiedOnly && !profile.verification.phoneVerified && !profile.verification.idVerified) return false;
    if (filters.lookingFor !== 'any' && profile.preferences.lookingFor !== filters.lookingFor) return false;
    if (filters.interests.length > 0 && !filters.interests.some((interest) => profile.interests.includes(interest))) return false;
    if (filters.motherTongues.length > 0 && !filters.motherTongues.includes(profile.details.motherTongue)) return false;
    if (filters.communities.length > 0 && !filters.communities.includes(profile.details.community)) return false;
    if (filters.educationLevels.length > 0 && !filters.educationLevels.includes(profile.details.education)) return false;
    if (filters.familyValues.length > 0 && !filters.familyValues.includes(profile.details.familyValues)) return false;
    if (filters.maritalStatus.length > 0 && !filters.maritalStatus.includes(profile.details.maritalStatus)) return false;
    if (filters.diet.length > 0 && !filters.diet.includes(profile.details.diet)) return false;
    if (filters.familyType.length > 0 && profile.details.familyType && !filters.familyType.includes(profile.details.familyType)) return false;
    if (filters.mangalStatus.length > 0 && profile.details.mangalStatus && !filters.mangalStatus.includes(profile.details.mangalStatus)) return false;
    if (filters.foreignStatus.length > 0 && profile.details.foreignStatus && !filters.foreignStatus.includes(profile.details.foreignStatus)) return false;
    if (filters.employmentType.length > 0 && profile.details.employmentType && !filters.employmentType.includes(profile.details.employmentType)) return false;

    return true;
  });

  const activeFilterCount =
    filters.interests.length +
    filters.motherTongues.length +
    filters.communities.length +
    filters.educationLevels.length +
    filters.familyValues.length +
    filters.maritalStatus.length +
    filters.diet.length +
    filters.familyType.length +
    filters.mangalStatus.length +
    filters.foreignStatus.length +
    filters.employmentType.length +
    (filters.ageRange[0] !== defaultFilters.ageRange[0] || filters.ageRange[1] !== defaultFilters.ageRange[1] ? 1 : 0) +
    (filters.onlineOnly ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (!filters.hasPhoto ? 1 : 0) +
    (filters.lookingFor !== 'any' ? 1 : 0);
  const toggleArrayFilter = (
    key: 'interests' | 'motherTongues' | 'communities' | 'educationLevels' | 'familyValues' | 'maritalStatus' | 'diet' | 'familyType' | 'mangalStatus' | 'foreignStatus' | 'employmentType',
    value: string,
  ) => {
    setFilters((prev) => {
      const values = prev[key] as string[];
      return {
        ...prev,
        [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      } as SearchFilters;
    });
  };

  const handleInterestAction = async (profileId: string, profileName: string) => {
    const state = getInterestState(interestRequests, matches, currentUserId, profileId);
    if (state === 'matched') return;

    try {
      if (state === 'incoming') {
        const request = interestRequests.find(
          (item) => item.fromUserId === profileId && item.toUserId === currentUserId && item.status === 'pending',
        );
        if (!request) return;

        const result = await respondToInterest(request.id, 'accepted');
        if (result.matchId) {
          toast.success(`You matched with ${profileName}!`);
          addNotification({
            userId: currentUserId,
            type: 'match',
            title: `${profileName} is now a match`,
            message: 'Interest accepted from search.',
            href: `/chat/${result.matchId}`,
          });
        }
        return;
      }

      await sendInterest(profileId);
      toast.success(`Interest sent to ${profileName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  const filterSection = (title: string, options: string[], key: any, isCapitalize = false) => (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8c7c6c]">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggleArrayFilter(key, opt)}
            className={`rounded-xl px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
              (filters[key as keyof SearchFilters] as string[]).includes(opt)
                ? 'bg-[#1f2330] text-white shadow-lg scale-105'
                : 'bg-white text-[#1f2330] border border-[#8f7b67]/10 hover:border-[#b84f45]/50'
            } ${isCapitalize ? 'capitalize' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  const filtersPanel = (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#1f2330] text-white">
            <Filter className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black text-[#1f2330]">Refine Search</h2>
        </div>
        {activeFilterCount > 0 && (
          <button onClick={() => setFilters(defaultFilters)} className="text-[10px] font-black uppercase tracking-widest text-[#b84f45] hover:underline">
            Reset
          </button>
        )}
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8c7c6c]">Age Range</h3>
            <span className="text-sm font-black text-[#1f2330]">{filters.ageRange[0]} - {filters.ageRange[1]}</span>
          </div>
          <input
            type="range"
            min="21"
            max="45"
            value={filters.ageRange[1]}
            onChange={(e) => setFilters(prev => ({ ...prev, ageRange: [prev.ageRange[0], parseInt(e.target.value)] }))}
            className="w-full accent-[#b84f45]"
          />
        </div>

        {filterSection('Mother Tongue', motherTongueOptions, 'motherTongues')}
        {filterSection('Community / Sub-Caste', communityOptions, 'communities')}
        {filterSection('Education', educationOptions, 'educationLevels')}
        {filterSection('Family Values', familyValueOptions, 'familyValues', true)}
        {filterSection('Family Type', familyTypeOptions, 'familyType', true)}
        {filterSection('Mangal Status', mangalStatusOptions, 'mangalStatus', true)}
        {filterSection('Diet', dietOptions, 'diet', true)}
        {filterSection('Marital Status', maritalStatusOptions, 'maritalStatus', true)}
        {filterSection('NRI / Foreign Status', foreignStatusOptions, 'foreignStatus', true)}
        {filterSection('Employment Type', employmentTypeOptions, 'employmentType', true)}
        {filterSection('Interests', allInterests, 'interests')}

        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8c7c6c]">Verification & Activity</h3>
          {[
            { label: 'Has Photo', key: 'hasPhoto' },
            { label: 'Recently Active', key: 'onlineOnly' },
            { label: 'Verified Only', key: 'verifiedOnly' },
          ].map((toggle) => (
            <label key={toggle.key} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-[#8f7b67]/10 cursor-pointer group hover:bg-[#fff2ee] transition-all">
              <span className="text-xs font-black text-[#1f2330] uppercase tracking-widest">{toggle.label}</span>
              <input
                type="checkbox"
                checked={filters[toggle.key as keyof SearchFilters] as boolean}
                onChange={(e) => setFilters(prev => ({ ...prev, [toggle.key]: e.target.checked }))}
                className="w-5 h-5 accent-[#b84f45] rounded-lg"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-5 pb-16 sm:space-y-8 sm:pb-20">
      {/* Header & Search Bar */}
      <section className="glass-card relative overflow-hidden border-none bg-gradient-to-br from-white via-[#fffaf6] to-[#fdf2f2]/30 p-4 shadow-2xl sm:p-12 lg:p-16">
        <div className="pointer-events-none absolute -right-14 top-0 h-40 w-40 rounded-full bg-[#efc18d]/18 blur-3xl sm:h-56 sm:w-56" />
        <div className="pointer-events-none absolute bottom-[-4rem] left-[-2rem] h-36 w-36 rounded-full bg-[#b84f45]/10 blur-3xl sm:h-52 sm:w-52" />
        <div className="relative z-10">
          <h1 className="max-w-4xl text-[clamp(1.9rem,8vw,3.1rem)] font-black leading-[0.94] tracking-tighter text-[#1f2330] sm:text-[clamp(2.5rem,8vw,5.5rem)] sm:leading-[0.9]">
            Search with <span className="text-[#b84f45]">intention.</span>
          </h1>

          <p className="mt-2 max-w-2xl text-[0.92rem] leading-6 text-[#62584d] sm:mt-5 sm:text-lg sm:leading-8">
            Use filters to surface serious, better-aligned matches faster.
          </p>

          <div className="mt-4 grid max-w-4xl grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:mt-12 lg:flex">
            <div className="relative col-span-2 flex-1 group">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8c7c6c] transition-colors group-focus-within:text-[#b84f45] sm:left-6 sm:h-6 sm:w-6" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, profession, or city..."
                className="w-full rounded-[22px] border-2 border-[#8f7b67]/10 bg-white py-3.5 pl-12 pr-5 text-base font-bold placeholder:text-[#8c7c6c]/50 outline-none transition-all focus:border-[#b84f45]/30 focus:shadow-2xl sm:rounded-[32px] sm:py-6 sm:pl-16 sm:pr-8 sm:text-lg"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary justify-center rounded-[22px] border-[#8f7b67]/10 px-4 py-3.5 text-sm lg:hidden sm:rounded-[32px] sm:px-10 sm:py-6"
            >
              <SlidersHorizontal className="h-5 w-5" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <Link to="/discover" className="btn-primary justify-center rounded-[22px] px-4 py-3.5 text-sm shadow-xl shadow-[#b84f45]/20 sm:rounded-[32px] sm:px-10 sm:py-6">
              <span className="sm:hidden">Intros</span>
              <span className="hidden sm:inline">Personalized Intros</span>
              <Sparkles className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-8">
          <div className="glass-card p-10 border-none shadow-xl bg-white/80">
            {filtersPanel}
          </div>
        </aside>

        {/* Results Area */}
        <main className="space-y-5 sm:space-y-8 lg:col-span-8 xl:col-span-9">
          {/* Results Summary */}
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7c6c]">Search Results</p>
              <h2 className="mt-1 text-2xl font-black text-[#1f2330]">
                {filteredMatches.length} <span className="text-gray-400 font-medium">Matches Found</span>
              </h2>
            </div>
          </div>

          {filteredMatches.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 xl:gap-8">
              {filteredMatches.map((profile) => {
                const interestState = getInterestState(interestRequests, matches, currentUserId, profile.id);
                const existingMatch = matches.find((match) => match.matchedUserId === profile.id);
                return (
                  <article key={profile.id} className="group glass-card overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white">
                    <div className="aspect-[4/5] relative overflow-hidden">
                      <ProfilePhoto
                        src={getProfilePhotoSrc(profile.photos)}
                        name={profile.name}
                        gender={profile.gender}
                        alt={profile.name}
                        className="h-full w-full"
                        mediaClassName="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1f2330] via-transparent to-transparent opacity-80" />
                      
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {isRecentlyActive(profile) && (
                          <span className="w-fit rounded-full bg-emerald-500/90 backdrop-blur-md px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white">Active</span>
                        )}
                        <span className="w-fit rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[8px] font-black uppercase tracking-widest text-[#b84f45]">
                          {getVerificationLabel(profile)}
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                        <h3 className="text-2xl font-black leading-none tracking-tight text-white sm:text-3xl">{profile.name}, {profile.age}</h3>
                        <p className="mt-2 text-xs font-bold text-white/70 flex items-center gap-1.5 uppercase tracking-widest">
                          <MapPin className="h-3.5 w-3.5" />
                          {profile.location}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 p-5 sm:space-y-6 sm:p-8">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 group-hover:bg-[#fff2ee] transition-colors">
                          <Briefcase className="h-4 w-4 text-[#8c7c6c]" />
                          <p className="text-[10px] font-black text-[#1f2330] uppercase truncate">{profile.profession}</p>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 group-hover:bg-[#fff2ee] transition-colors">
                          <Building className="h-4 w-4 text-[#8c7c6c]" />
                          <p className="text-[10px] font-black text-[#1f2330] uppercase truncate">{profile.details.community}</p>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed text-[#62584d] font-medium line-clamp-3 italic">
                        "{profile.bio}"
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {profile.interests.slice(0, 2).map((interest) => (
                          <span key={interest} className="rounded-lg bg-gray-50 px-3 py-1 text-[9px] font-black uppercase tracking-tighter text-[#8c7c6c]">{interest}</span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 sm:pt-4">
                        <Link 
                          to={`/profile/${profile.id}`} 
                          onClick={() => addViewedProfile(profile.id)}
                          className="btn-secondary py-4 text-[10px] font-black uppercase tracking-[0.2em] border-none bg-gray-100 hover:bg-[#1f2330] hover:text-white transition-all shadow-sm"
                        >
                          View Full
                        </Link>
                        
                        {interestState === 'matched' ? (
                          <Link to={existingMatch ? `/chat/${existingMatch.id}` : '/chat'} className="btn-primary py-4 text-[10px] font-black uppercase tracking-[0.2em] border-none shadow-lg">
                            Chat Now
                          </Link>
                        ) : interestState === 'outgoing' ? (
                          <button disabled className="btn-secondary py-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-50 cursor-not-allowed">
                            Requested
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleInterestAction(profile.id, profile.name)}
                            className="btn-primary py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg"
                          >
                            Send Interest
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center sm:py-24">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[32px] bg-[#fdf2f2] text-[#b84f45] sm:mb-8 sm:h-24 sm:w-24 sm:rounded-[40px]">
                <SearchIcon className="h-10 w-10" />
              </div>
              <h3 className="text-3xl font-black text-[#1f2330]">No matches for these criteria.</h3>
              <p className="mt-4 text-[#62584d] max-w-md font-medium leading-relaxed">
                Matrimony is a journey. Try expanding your age range or being more flexible with community preferences for a broader selection.
              </p>
              <button 
                onClick={() => setFilters(defaultFilters)}
                className="mt-8 btn-secondary px-10 py-4 border-none shadow-sm"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#17161c]/40 backdrop-blur-md" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 right-0 top-0 w-full max-w-[360px] overflow-y-auto bg-white p-5 shadow-2xl animate-in slide-in-from-right duration-500 sm:max-w-[400px] sm:p-8">
            <div className="mb-5 flex justify-end sm:mb-6">
              <button onClick={() => setShowFilters(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 sm:h-12 sm:w-12">
                <X className="h-6 w-6 text-[#1f2330]" />
              </button>
            </div>
            {filtersPanel}
          </div>
        </div>
      )}
    </div>
  );
}
