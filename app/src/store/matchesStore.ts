import { create } from 'zustand';

// matchesStore is now an in-memory fallback only.
// Persisted dismissed profiles now live in the database via public.dismissed_profiles.

interface MatchesState {
  dismissedProfiles: string[];
  passUser: (userId: string) => void;
  resetDismissed: () => void;
}

export const useMatchesStore = create<MatchesState>()(
  (set) => ({
    dismissedProfiles: [],

    passUser: (userId) => {
      set((state) => ({
        dismissedProfiles: state.dismissedProfiles.includes(userId)
          ? state.dismissedProfiles
          : [...state.dismissedProfiles, userId],
      }));
    },

    resetDismissed: () => {
      set({ dismissedProfiles: [] });
    },
  }),
);
