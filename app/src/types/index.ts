export type Gender = 'male' | 'female' | 'other';
export type LookingFor = 'relationship' | 'marriage' | 'friendship' | 'casual';
export type VerificationBadge = 'none' | 'phone' | 'id';
export type ProfileVisibility = 'all' | 'matching-only' | 'hidden';
export type PhotoVisibility = 'all' | 'accepted-interest' | 'private';
export type ContactPermission = 'all' | 'verified-only' | 'accepted-interest';
export type FamilyValues = 'traditional' | 'balanced' | 'progressive';
export type MaritalStatus = 'never-married' | 'divorced' | 'widowed' | 'awaiting-divorce';
export type DietPreference = 'vegetarian' | 'eggetarian' | 'vegan' | 'non-vegetarian' | 'swaminarayan' | 'jain';
export type ProfileCreatedFor = 'self' | 'son' | 'daughter' | 'brother' | 'sister' | 'friend';
export type FamilyType = 'joint' | 'nuclear';
export type MangalStatus = 'mangal' | 'non-mangal' | 'not-specified';
export type EmploymentType = 'business' | 'government' | 'private-mnc' | 'private-company' | 'self-employed';
export type ForeignStatus = 'india-based' | 'nri-usa' | 'nri-uk' | 'nri-canada' | 'nri-australia' | 'nri-gulf' | 'nri-other';
export type HabitLevel = 'never' | 'occasionally' | 'yes';
export type CareerIntent = 'yes' | 'no' | 'optional';
export type InterestRequestStatus = 'pending' | 'accepted' | 'declined';

export interface VerificationStatus {
  phoneVerified: boolean;
  idVerified: boolean;
  profileReviewed: boolean;
  badge: VerificationBadge;
}

export interface AccountStatus {
  emailVerified: boolean;
  emailVerificationRequired: boolean;
  emailVerificationSentAt?: Date | string | null;
  emailVerifiedAt?: Date | string | null;
}

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  photoVisibility: PhotoVisibility;
  contactPermission: ContactPermission;
  showOnlineStatus: boolean;
  showLastActive: boolean;
  allowVisitorAlerts: boolean;
  hideFromFreeMembers: boolean;
}

export interface MatrimonyDetails {
  // Core
  education: string;
  company: string;
  annualIncome: string;
  motherTongue: string;
  community: string;
  familyValues: FamilyValues;
  familyBackground: string;
  maritalStatus: MaritalStatus;
  height: string;
  diet: DietPreference;
  // Extended Indian matrimony fields
  nativeVillage?: string;          // Vatan — ancestral village
  familyType?: FamilyType;         // Joint vs Nuclear
  mangalStatus?: MangalStatus;     // Kundali — Mangal/Non-Mangal
  employmentType?: EmploymentType; // Business / Govt / MNC etc.
  foreignStatus?: ForeignStatus;   // NRI status
  smokingHabits?: HabitLevel;
  drinkingHabits?: HabitLevel;
  careerIntent?: CareerIntent;     // Willing to work after marriage
}

export interface UserStats {
  profileViews: number;
  responseRate: number;
  profileCompletion: number;
  boostScore: number;
}

export interface UserPreferences {
  ageRange: [number, number];
  distance: number;
  genderPreference: 'male' | 'female' | 'both';
  lookingFor: LookingFor;
  verifiedOnly: boolean;
  preferredMotherTongues: string[];
  preferredCommunities: string[];
  preferredEducation: string[];
  familyValues: FamilyValues[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: Gender;
  location: string;
  profession: string;
  bio: string;
  photos: string[];
  interests: string[];
  preferences: UserPreferences;
  matches: string[];
  likes: string[];
  shortlisted: string[];
  recentlyViewed: string[];
  recentVisitors: string[];
  blockedUsers: string[];
  verification: VerificationStatus;
  accountStatus: AccountStatus;
  privacy: PrivacySettings;
  details: MatrimonyDetails;
  profileFor: ProfileCreatedFor;
  notifications: {
    email: boolean;
    push: boolean;
    matches: boolean;
    messages: boolean;
  };
  chatDefaults: {
    readReceipts: boolean;
    typingIndicators: boolean;
    mediaAutoDownload: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  stats: UserStats;
  lastActiveAt: Date;
  createdAt: Date;
}

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  matchedUser: User;
  status: 'pending' | 'matched' | 'declined';
  createdAt: Date;
}

export interface InterestRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  status: InterestRequestStatus;
  createdAt: Date;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  read: boolean;
  deleted?: boolean;
  replyToContent?: string;
}

export interface Conversation {
  matchId: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'match' | 'like' | 'message' | 'system' | 'visitor' | 'interest' | 'verification' | 'shortlist';
  title: string;
  message: string;
  href?: string;
  read: boolean;
  createdAt: Date;
}

export interface SearchFilters {
  ageRange: [number, number];
  distance: number;
  location?: string;
  interests: string[];
  hasPhoto: boolean;
  onlineOnly: boolean;
  verifiedOnly: boolean;
  lookingFor: LookingFor | 'any';
  motherTongues: string[];
  communities: string[];
  educationLevels: string[];
  familyValues: FamilyValues[];
  // New filters
  maritalStatus: MaritalStatus[];
  diet: DietPreference[];
  familyType: FamilyType[];
  mangalStatus: MangalStatus[];
  foreignStatus: ForeignStatus[];
  employmentType: EmploymentType[];
}

export interface SuccessStory {
  id: string;
  coupleName: string;
  story: string;
  photo: string;
  marriedDate?: Date;
  quote: string;
}
