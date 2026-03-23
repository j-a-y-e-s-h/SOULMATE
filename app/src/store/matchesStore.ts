import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// matchesStore now only tracks locally-dismissed profiles (swipe-left state).
// All real data (matches, interests, messages, profiles) lives in chatStore.

interface MatchesState {
  dismissedProfiles: string[];
  passUser: (userId: string) => void;
  resetDismissed: () => void;
}

export const useMatchesStore = create<MatchesState>()(
  persist(
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
    {
      name: 'soulmate-dismissed',
      version: 1,
    },
  ),
);
