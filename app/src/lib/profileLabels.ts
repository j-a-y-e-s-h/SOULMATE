const explicitLabels: Record<string, string> = {
  'accepted-interest': 'Accepted interest',
  'awaiting-divorce': 'Awaiting divorce',
  'india-based': 'India based',
  'never-married': 'Never married',
  'non-mangal': 'Non-mangal',
  'non-vegetarian': 'Non-vegetarian',
  'not-specified': 'Not specified',
  'nri-australia': 'NRI / Australia',
  'nri-canada': 'NRI / Canada',
  'nri-gulf': 'NRI / Gulf',
  'nri-other': 'NRI / Other',
  'nri-uk': 'NRI / UK',
  'nri-usa': 'NRI / USA',
  'private-company': 'Private company',
  'private-mnc': 'Private / MNC',
  'self-employed': 'Self-employed',
};

const acronymLabels: Record<string, string> = {
  nri: 'NRI',
  uk: 'UK',
  usa: 'USA',
  mnc: 'MNC',
};

export function formatChoiceLabel(value?: string | null, fallback = 'Not shared yet') {
  if (!value) {
    return fallback;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return fallback;
  }

  const explicitLabel = explicitLabels[trimmedValue];
  if (explicitLabel) {
    return explicitLabel;
  }

  return trimmedValue
    .split('-')
    .map((segment) => {
      const normalized = segment.toLowerCase();
      if (acronymLabels[normalized]) {
        return acronymLabels[normalized];
      }

      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join(' ');
}
