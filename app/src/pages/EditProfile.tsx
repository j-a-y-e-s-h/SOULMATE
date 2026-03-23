import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Shield, Sparkles } from 'lucide-react';
import { PhotoUploader } from '@/components/PhotoUploader';
import {
  communityOptions,
  dietOptions as dietValues,
  educationOptions,
  employmentTypeOptions as employmentTypeValues,
  familyTypeOptions as familyTypeValues,
  familyValueOptions,
  foreignStatusOptions as foreignStatusValues,
  incomeBracketOptions,
  mangalStatusOptions as mangalStatusValues,
  maritalStatusOptions as maritalStatusValues,
  motherTongueOptions,
} from '@/lib/demoData';
import { StyledSelectField, type StyledSelectOption } from '@/components/StyledSelectField';
import { formatChoiceLabel } from '@/lib/profileLabels';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const interestsList = [
  'Travel',
  'Food',
  'Music',
  'Movies',
  'Cricket',
  'Reading',
  'Gaming',
  'Art',
  'Photography',
  'Fitness',
  'Yoga',
  'Hiking',
  'Cooking',
  'Dancing',
  'Writing',
  'Technology',
  'Fashion',
  'Nature',
  'Pets',
  'Coffee',
  'Long drives',
  'Festivals',
  'Family time',
  'Podcasts',
];



const toSelectOptions = (values: string[]) =>
  values.map((value) => ({
    value,
    label: formatChoiceLabel(value),
  }));

const profileForOptions: StyledSelectOption[] = toSelectOptions(['self', 'son', 'daughter', 'brother', 'sister', 'friend']);

const educationSelectOptions: StyledSelectOption[] = educationOptions.map((value) => ({ value, label: value }));
const motherTongueSelectOptions: StyledSelectOption[] = motherTongueOptions.map((value) => ({ value, label: value }));
const communitySelectOptions: StyledSelectOption[] = communityOptions.map((value) => ({ value, label: value }));
const familyValueSelectOptions: StyledSelectOption[] = toSelectOptions(familyValueOptions);
const annualIncomeSelectOptions: StyledSelectOption[] = incomeBracketOptions.map((value) => ({ value, label: value }));
const maritalStatusSelectOptions: StyledSelectOption[] = toSelectOptions(maritalStatusValues);
const dietSelectOptions: StyledSelectOption[] = toSelectOptions(dietValues);
const familyTypeSelectOptions: StyledSelectOption[] = toSelectOptions(familyTypeValues);
const mangalStatusSelectOptions: StyledSelectOption[] = toSelectOptions(mangalStatusValues);
const employmentTypeSelectOptions: StyledSelectOption[] = toSelectOptions(employmentTypeValues);
const foreignStatusSelectOptions: StyledSelectOption[] = toSelectOptions(foreignStatusValues);
const habitSelectOptions: StyledSelectOption[] = toSelectOptions(['never', 'occasionally', 'yes']);
const careerIntentSelectOptions: StyledSelectOption[] = [
  { value: 'yes', label: 'Yes, open to working' },
  { value: 'optional', label: 'Flexible / depends' },
  { value: 'no', label: 'No, not planning to' },
];
const lookingForOptions: StyledSelectOption[] = toSelectOptions(['marriage', 'relationship', 'friendship', 'casual']);
const genderPreferenceOptions: StyledSelectOption[] = toSelectOptions(['male', 'female', 'both']);
const profileVisibilityOptions: StyledSelectOption[] = [
  { value: 'all', label: 'Visible to everyone' },
  { value: 'matching-only', label: 'Matching members only' },
  { value: 'hidden', label: 'Hidden' },
];
const photoVisibilityOptions: StyledSelectOption[] = [
  { value: 'all', label: 'Visible to everyone' },
  { value: 'accepted-interest', label: 'Accepted interest only' },
  { value: 'private', label: 'Private' },
];
const contactPermissionOptions: StyledSelectOption[] = [
  { value: 'all', label: 'Anyone can contact' },
  { value: 'verified-only', label: 'Verified members only' },
  { value: 'accepted-interest', label: 'Only after accepted interest' },
];

export default function EditProfile() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    location: user?.location || '',
    profession: user?.profession || '',
    bio: user?.bio || '',
    interests: user?.interests || [],
    photos: user?.photos || [],
    profileFor: user?.profileFor || 'self',
    details: {
      education: user?.details.education || 'Bachelors',
      company: user?.details.company || '',
      annualIncome: user?.details.annualIncome || 'Prefer not to say',
      motherTongue: user?.details.motherTongue || 'Hindi',
      community: user?.details.community || 'Intercaste',
      familyValues: user?.details.familyValues || 'balanced',
      familyBackground: user?.details.familyBackground || '',
      maritalStatus: user?.details.maritalStatus || 'never-married',
      height: user?.details.height || '',
      diet: user?.details.diet || 'non-vegetarian',
      nativeVillage: user?.details.nativeVillage || '',
      familyType: user?.details.familyType || 'nuclear',
      mangalStatus: user?.details.mangalStatus || 'not-specified',
      employmentType: user?.details.employmentType || 'private-company',
      foreignStatus: user?.details.foreignStatus || 'india-based',
      smokingHabits: user?.details.smokingHabits || 'never',
      drinkingHabits: user?.details.drinkingHabits || 'never',
      careerIntent: user?.details.careerIntent || 'yes',
    },
    preferences: {
      ageRange: user?.preferences.ageRange || [24, 33],
      distance: user?.preferences.distance || 50,
      genderPreference: user?.preferences.genderPreference || 'both',
      lookingFor: user?.preferences.lookingFor || 'marriage',
      verifiedOnly: user?.preferences.verifiedOnly ?? true,
      preferredMotherTongues: user?.preferences.preferredMotherTongues || [],
      preferredCommunities: user?.preferences.preferredCommunities || [],
      preferredEducation: user?.preferences.preferredEducation || [],
      familyValues: user?.preferences.familyValues || ['balanced'],
    },
    privacy: {
      profileVisibility: user?.privacy.profileVisibility || 'matching-only',
      photoVisibility: user?.privacy.photoVisibility || 'accepted-interest',
      contactPermission: user?.privacy.contactPermission || 'accepted-interest',
      showOnlineStatus: user?.privacy.showOnlineStatus ?? true,
      showLastActive: user?.privacy.showLastActive ?? true,
      allowVisitorAlerts: user?.privacy.allowVisitorAlerts ?? true,
      hideFromFreeMembers: user?.privacy.hideFromFreeMembers ?? false,
    },
  });

  const updateField = (field: keyof typeof formData, value: (typeof formData)[typeof field]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDetailsField = (field: keyof typeof formData.details, value: string) => {
    setFormData((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        [field]: value,
      },
    }));
  };

  const updatePreferenceField = <T extends keyof typeof formData.preferences>(
    field: T,
    value: (typeof formData.preferences)[T],
  ) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  };

  const updatePrivacyField = <T extends keyof typeof formData.privacy>(
    field: T,
    value: (typeof formData.privacy)[T],
  ) => {
    setFormData((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: value,
      },
    }));
  };

  const toggleInterest = (interest: string) => {
    const nextInterests = formData.interests.includes(interest)
      ? formData.interests.filter((item) => item !== interest)
      : [...formData.interests, interest];

    updateField('interests', nextInterests);
  };

  const togglePreferenceArray = (
    field: 'preferredMotherTongues' | 'preferredCommunities' | 'preferredEducation' | 'familyValues',
    value: string,
  ) => {
    const values = formData.preferences[field] as string[];
    updatePreferenceField(
      field,
      (values.includes(value) ? values.filter((item) => item !== value) : [...values, value]) as never,
    );
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));

      await updateUser({
        name: formData.name,
        age: parseInt(formData.age || '0', 10),
        location: formData.location,
        profession: formData.profession,
        bio: formData.bio.slice(0, 500),
        interests: formData.interests,
        photos: formData.photos,
        profileFor: formData.profileFor,
        details: formData.details,
        preferences: formData.preferences,
        privacy: formData.privacy,
        stats: {
          ...(user?.stats || { profileViews: 0, responseRate: 0, profileCompletion: 0, boostScore: 0 }),
          profileCompletion: Math.min(100, profileStrength),
        },
      });

      navigate('/profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'We could not save your profile just now.');
    } finally {
      setIsLoading(false);
    }
  };

  const profileStrength = Math.min(
    100,
    36 +
      (formData.bio ? 12 : 0) +
      (formData.photos.length > 1 ? 16 : 0) +
      (formData.interests.length >= 4 ? 12 : 0) +
      (formData.details.education ? 8 : 0) +
      (formData.details.community ? 6 : 0) +
      (formData.details.familyBackground ? 6 : 0) +
      (formData.details.annualIncome ? 4 : 0) +
      (formData.details.nativeVillage ? 4 : 0) +
      (formData.details.familyType ? 2 : 0) +
      (formData.details.employmentType ? 2 : 0) +
      (formData.preferences.verifiedOnly ? 6 : 0) +
      (formData.privacy.profileVisibility ? 6 : 0),
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/profile" className="btn-secondary px-4 py-3">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8c7c6c]">Profile editor</p>
          <h1 className="text-[clamp(2rem,8vw,2.8rem)] text-[#1f2330]">Refine profile, preferences, and privacy.</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <PhotoUploader
            photos={formData.photos}
            userId={user?.id ?? ''}
            onPhotosChange={(photos) => updateField('photos', photos)}
            maxPhotos={6}
          />

          <div className="glass-card p-5 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7c6c]">Basics</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Full name</label>
                <input type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="input-surface" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Age</label>
                <input type="number" min="18" max="100" value={formData.age} onChange={(e) => updateField('age', e.target.value)} className="input-surface" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Profile created for</label>
                <StyledSelectField
                  value={formData.profileFor}
                  onValueChange={(value) => updateField('profileFor', value)}
                  options={profileForOptions}
                  ariaLabel="Profile created for"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Location</label>
                <input type="text" value={formData.location} onChange={(e) => updateField('location', e.target.value)} className="input-surface" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Profession</label>
                <input type="text" value={formData.profession} onChange={(e) => updateField('profession', e.target.value)} className="input-surface" />
              </div>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7c6c]">Bio</p>
                <h2 className="mt-3 text-[clamp(2rem,8vw,2.8rem)] text-[#1f2330]">Write like a real person.</h2>
              </div>
              <span className="chip">{formData.bio.length}/500</span>
            </div>

            <textarea
              value={formData.bio}
              onChange={(e) => updateField('bio', e.target.value.slice(0, 500))}
              rows={6}
              className="input-surface mt-6 resize-none"
              placeholder="What kind of life are you building, what matters to you, and what kind of partnership are you hoping for?"
            />
          </div>

          <div className="glass-card p-5 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7c6c]">Matrimony details</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Education</label>
                <StyledSelectField
                  value={formData.details.education}
                  onValueChange={(value) => updateDetailsField('education', value)}
                  options={educationSelectOptions}
                  ariaLabel="Education"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Company</label>
                <input type="text" value={formData.details.company} onChange={(e) => updateDetailsField('company', e.target.value)} className="input-surface" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Annual income</label>
                <StyledSelectField
                  value={formData.details.annualIncome}
                  onValueChange={(value) => updateDetailsField('annualIncome', value)}
                  options={annualIncomeSelectOptions}
                  ariaLabel="Annual income"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Mother tongue</label>
                <StyledSelectField
                  value={formData.details.motherTongue}
                  onValueChange={(value) => updateDetailsField('motherTongue', value)}
                  options={motherTongueSelectOptions}
                  ariaLabel="Mother tongue"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Community</label>
                <StyledSelectField
                  value={formData.details.community}
                  onValueChange={(value) => updateDetailsField('community', value)}
                  options={communitySelectOptions}
                  ariaLabel="Community"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Family values</label>
                <StyledSelectField
                  value={formData.details.familyValues}
                  onValueChange={(value) => updateDetailsField('familyValues', value)}
                  options={familyValueSelectOptions}
                  ariaLabel="Family values"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Native village (Vatan)</label>
                <input
                  type="text"
                  value={formData.details.nativeVillage}
                  onChange={(e) => updateDetailsField('nativeVillage', e.target.value)}
                  className="input-surface"
                  placeholder="e.g. Anand, Gujarat"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Family type</label>
                <StyledSelectField
                  value={formData.details.familyType}
                  onValueChange={(value) => updateDetailsField('familyType', value)}
                  options={familyTypeSelectOptions}
                  ariaLabel="Family type"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Marital status</label>
                <StyledSelectField
                  value={formData.details.maritalStatus}
                  onValueChange={(value) => updateDetailsField('maritalStatus', value)}
                  options={maritalStatusSelectOptions}
                  ariaLabel="Marital status"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Diet</label>
                <StyledSelectField
                  value={formData.details.diet}
                  onValueChange={(value) => updateDetailsField('diet', value)}
                  options={dietSelectOptions}
                  ariaLabel="Diet"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Mangal status</label>
                <StyledSelectField
                  value={formData.details.mangalStatus}
                  onValueChange={(value) => updateDetailsField('mangalStatus', value)}
                  options={mangalStatusSelectOptions}
                  ariaLabel="Mangal status"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Employment type</label>
                <StyledSelectField
                  value={formData.details.employmentType}
                  onValueChange={(value) => updateDetailsField('employmentType', value)}
                  options={employmentTypeSelectOptions}
                  ariaLabel="Employment type"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Foreign / NRI status</label>
                <StyledSelectField
                  value={formData.details.foreignStatus}
                  onValueChange={(value) => updateDetailsField('foreignStatus', value)}
                  options={foreignStatusSelectOptions}
                  ariaLabel="Foreign status"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Smoking habits</label>
                <StyledSelectField
                  value={formData.details.smokingHabits}
                  onValueChange={(value) => updateDetailsField('smokingHabits', value)}
                  options={habitSelectOptions}
                  ariaLabel="Smoking habits"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Drinking habits</label>
                <StyledSelectField
                  value={formData.details.drinkingHabits}
                  onValueChange={(value) => updateDetailsField('drinkingHabits', value)}
                  options={habitSelectOptions}
                  ariaLabel="Drinking habits"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Career after marriage</label>
                <StyledSelectField
                  value={formData.details.careerIntent}
                  onValueChange={(value) => updateDetailsField('careerIntent', value)}
                  options={careerIntentSelectOptions}
                  ariaLabel="Career after marriage"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Family background</label>
                <textarea
                  rows={4}
                  value={formData.details.familyBackground}
                  onChange={(e) => updateDetailsField('familyBackground', e.target.value)}
                  className="input-surface resize-none"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7c6c]">Partner preferences</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Looking for</label>
                <StyledSelectField
                  value={formData.preferences.lookingFor}
                  onValueChange={(value) => updatePreferenceField('lookingFor', value as typeof formData.preferences.lookingFor)}
                  options={lookingForOptions}
                  ariaLabel="Looking for"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Gender preference</label>
                <StyledSelectField
                  value={formData.preferences.genderPreference}
                  onValueChange={(value) => updatePreferenceField('genderPreference', value as typeof formData.preferences.genderPreference)}
                  options={genderPreferenceOptions}
                  ariaLabel="Gender preference"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">
                  Age range: {formData.preferences.ageRange[0]} - {formData.preferences.ageRange[1]}
                </label>
                <input
                  type="range"
                  min="21"
                  max="45"
                  value={formData.preferences.ageRange[1]}
                  onChange={(e) => updatePreferenceField('ageRange', [formData.preferences.ageRange[0], parseInt(e.target.value, 10)])}
                  className="w-full"
                />
              </div>

              <label className="surface-muted sm:col-span-2 flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold text-[#1f2330]">Verified profiles only</p>
                  <p className="mt-1 text-sm leading-6 text-[#62584d]">Prioritize phone or ID verified members.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.preferences.verifiedOnly}
                  onChange={(e) => updatePreferenceField('verifiedOnly', e.target.checked)}
                />
              </label>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="mb-3 text-sm font-semibold text-[#1f2330]">Preferred mother tongues</p>
                <div className="flex flex-wrap gap-2">
                  {motherTongueOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => togglePreferenceArray('preferredMotherTongues', option)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        formData.preferences.preferredMotherTongues.includes(option)
                          ? 'bg-[#1f2330] text-white'
                          : 'bg-white/70 text-[#1f2330] hover:bg-[#fff2ee] hover:text-[#b84f45]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-[#1f2330]">Preferred community</p>
                <div className="flex flex-wrap gap-2">
                  {communityOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => togglePreferenceArray('preferredCommunities', option)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        formData.preferences.preferredCommunities.includes(option)
                          ? 'bg-[#1f2330] text-white'
                          : 'bg-white/70 text-[#1f2330] hover:bg-[#fff2ee] hover:text-[#b84f45]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-[#1f2330]">Preferred education</p>
                <div className="flex flex-wrap gap-2">
                  {educationOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => togglePreferenceArray('preferredEducation', option)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        formData.preferences.preferredEducation.includes(option)
                          ? 'bg-[#1f2330] text-white'
                          : 'bg-white/70 text-[#1f2330] hover:bg-[#fff2ee] hover:text-[#b84f45]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7c6c]">Privacy</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Profile visibility</label>
                <StyledSelectField
                  value={formData.privacy.profileVisibility}
                  onValueChange={(value) => updatePrivacyField('profileVisibility', value as typeof formData.privacy.profileVisibility)}
                  options={profileVisibilityOptions}
                  ariaLabel="Profile visibility"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Photo privacy</label>
                <StyledSelectField
                  value={formData.privacy.photoVisibility}
                  onValueChange={(value) => updatePrivacyField('photoVisibility', value as typeof formData.privacy.photoVisibility)}
                  options={photoVisibilityOptions}
                  ariaLabel="Photo privacy"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#1f2330]">Contact permission</label>
                <StyledSelectField
                  value={formData.privacy.contactPermission}
                  onValueChange={(value) => updatePrivacyField('contactPermission', value as typeof formData.privacy.contactPermission)}
                  options={contactPermissionOptions}
                  ariaLabel="Contact permission"
                />
              </div>

              <label className="surface-muted sm:col-span-2 flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold text-[#1f2330]">Hide from free members</p>
                  <p className="mt-1 text-sm leading-6 text-[#62584d]">Reserve visibility for serious members.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.privacy.hideFromFreeMembers}
                  onChange={(e) => updatePrivacyField('hideFromFreeMembers', e.target.checked)}
                />
              </label>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7c6c]">Interests</p>
                <h2 className="mt-3 text-[clamp(2rem,8vw,2.8rem)] text-[#1f2330]">Choose what feels genuinely true.</h2>
              </div>
              <span className="chip bg-[#fff2ee] text-[#b84f45]">{formData.interests.length} selected</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {interestsList.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    formData.interests.includes(interest)
                      ? 'bg-[#1f2330] text-white'
                      : 'bg-white/70 text-[#1f2330] hover:bg-[#fff2ee] hover:text-[#b84f45]'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-dark p-5 sm:p-8 xl:sticky xl:top-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Preview</p>
            <div className="mt-5 overflow-hidden rounded-[28px]">
              <img src={formData.photos[0] || '/gallery_1.jpg'} alt={formData.name || 'Profile preview'} className="h-72 w-full object-cover" />
            </div>

            <h2 className="mt-6 text-5xl text-white">
              {formData.name || 'Your name'}
              {formData.age ? `, ${formData.age}` : ''}
            </h2>
            <p className="mt-2 text-sm text-white/65">
              {[formData.location, formData.profession].filter(Boolean).join(' • ') || 'Add location and profession'}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip border-white/10 bg-white/10 text-white">{formData.details.motherTongue}</span>
              <span className="chip border-white/10 bg-white/10 text-white">{formData.details.community}</span>
              <span className="chip border-white/10 bg-white/10 text-white">{formatChoiceLabel(formData.details.familyType)}</span>
              <span className="chip border-white/10 bg-white/10 text-white">{formData.details.annualIncome}</span>
              <span className="chip border-white/10 bg-white/10 text-white capitalize">{formData.preferences.lookingFor}</span>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#efc18d] to-[#d78a61]" style={{ width: `${profileStrength}%` }} />
            </div>
            <p className="mt-3 text-sm text-white/72">Profile strength: {profileStrength}%</p>

            <p className="mt-5 text-sm leading-7 text-white/72">
              {formData.bio || 'Your bio preview will appear here as you type.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {formData.interests.slice(0, 5).map((interest) => (
                <span key={interest} className="chip border-white/10 bg-white/10 text-white">
                  {interest}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/6 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-5 w-5 text-[#efc18d]" />
                <p className="text-sm leading-7 text-white/72">
                  Privacy mode: {formData.privacy.profileVisibility.replace('-', ' ')}. Contact rule: {formData.privacy.contactPermission.replace('-', ' ')}.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving changes
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Save profile
                  </>
                )}
              </button>
              <Link to="/profile" className="btn-secondary w-full justify-center">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
