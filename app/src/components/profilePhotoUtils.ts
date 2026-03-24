export function getProfilePhotoSrc(
  photos?: Array<string | null | undefined>,
  index = 0,
): string | null {
  const candidateSources = [photos?.[index], photos?.[0]];

  for (const candidate of candidateSources) {
    if (typeof candidate !== 'string') continue;
    const trimmedCandidate = candidate.trim();
    if (trimmedCandidate) return trimmedCandidate;
  }

  return null;
}
