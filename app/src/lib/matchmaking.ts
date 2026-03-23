import type { InterestRequest, Match, User } from '@/types';

export type InterestState = 'matched' | 'incoming' | 'outgoing' | 'declined' | 'none';

export function dateValue(value: Date | string) {
  return new Date(value).getTime();
}

export function isRecentlyActive(user: User, hours = 8) {
  return Date.now() - dateValue(user.lastActiveAt) <= hours * 60 * 60 * 1000;
}

export function getVerificationLabel(user: User) {
  if (user.verification.idVerified) {
    return 'ID verified';
  }

  if (user.verification.phoneVerified) {
    return 'Phone verified';
  }

  return 'Unverified';
}

export function getSharedInterests(currentUser: User | null, profile: User) {
  if (!currentUser) {
    return [];
  }

  return profile.interests.filter((interest) => currentUser.interests.includes(interest));
}

export function getCompatibilityScore(currentUser: User | null, profile: User) {
  if (!currentUser) {
    return 76;
  }

  const sharedInterests = getSharedInterests(currentUser, profile).length * 5;
  const sameIntent = currentUser.preferences.lookingFor === profile.preferences.lookingFor ? 10 : 0;
  const verificationBoost = profile.verification.idVerified ? 5 : profile.verification.phoneVerified ? 2 : 0;
  const familyFit = currentUser.preferences.familyValues.includes(profile.details.familyValues) ? 5 : 0;
  const educationFit = currentUser.preferences.preferredEducation.length === 0 ||
    currentUser.preferences.preferredEducation.includes(profile.details.education)
      ? 4
      : 0;

  return Math.min(98, 62 + sharedInterests + sameIntent + verificationBoost + familyFit + educationFit);
}

export function getInterestRequestForProfile(
  interestRequests: InterestRequest[],
  currentUserId: string | undefined,
  profileUserId: string,
) {
  if (!currentUserId) {
    return undefined;
  }

  return interestRequests.find(
    (request) =>
      ((request.fromUserId === currentUserId && request.toUserId === profileUserId) ||
        (request.fromUserId === profileUserId && request.toUserId === currentUserId)) &&
      request.status !== 'declined',
  );
}

export function getInterestState(
  interestRequests: InterestRequest[],
  matches: Match[],
  currentUserId: string | undefined,
  profileUserId: string,
): InterestState {
  if (!currentUserId) {
    return 'none';
  }

  if (matches.some((match) => match.matchedUserId === profileUserId)) {
    return 'matched';
  }

  const request = getInterestRequestForProfile(interestRequests, currentUserId, profileUserId);

  if (!request) {
    return 'none';
  }

  if (request.status === 'declined') {
    return 'declined';
  }

  if (request.fromUserId === currentUserId) {
    return 'outgoing';
  }

  return 'incoming';
}

export function canDirectlyMessage(matches: Match[], profileUserId: string) {
  return matches.some((match) => match.matchedUserId === profileUserId);
}
