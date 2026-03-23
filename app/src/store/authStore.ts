import { create } from 'zustand';
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { buildEmailVerificationRedirect, buildPasswordResetRedirect } from '@/lib/authRedirect';
import {
  getPasswordValidationMessage,
  normalizeEmailAddress,
} from '@/lib/passwordSecurity';
import {
  buildPendingEmailVerificationStatus,
  buildVerifiedEmailVerificationStatus,
  getPendingProfileFromAuthUser,
  isEmailVerificationPending,
  sendEmailVerificationLink,
} from '@/lib/emailVerification';
import { createDefaultUser } from '@/lib/demoData';
import type { MatrimonyDetails, PrivacySettings, User, UserPreferences } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  requiresEmailVerification: boolean;
  pendingVerificationEmail: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; confirmEmail?: boolean; notRegistered?: boolean }>;
  register: (userData: Partial<User> & { email: string; password: string; redirectTo?: string }) => Promise<{ ok: boolean; error?: string; confirmEmail?: boolean }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  updatePrivacy: (updates: Partial<PrivacySettings>) => Promise<void>;
  updateDetails: (updates: Partial<MatrimonyDetails>) => Promise<void>;
  toggleShortlist: (userId: string) => void;
  addViewedProfile: (userId: string) => void;
  addVisitor: (userId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  addMatch: (userId: string) => void;
  addLike: (userId: string) => void;
  updateNotifications: (updates: Partial<User['notifications']>) => Promise<void>;
  updateChatDefaults: (updates: Partial<User['chatDefaults']>) => Promise<void>;
  updateAppearance: (updates: Partial<User['appearance']>) => Promise<void>;
  
  // New Methods
  resetPassword: (email: string, redirectTo?: string | null) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  changeEmail: (newEmail: string, currentPassword: string, redirectTo?: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>;
}

const PENDING_VERIFICATION_EMAIL_KEY = 'pendingVerificationEmail';

function pushRecent(list: string[], value: string, limit = 8) {
  return [value, ...list.filter((item) => item !== value)].slice(0, limit);
}

function rememberPendingVerificationEmail(email?: string | null) {
  if (!email) {
    sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
    return;
  }

  sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
}

function buildPendingProfile(userData: Partial<User>) {
  return {
    name: userData.name,
    age: userData.age,
    gender: userData.gender,
    location: userData.location,
    profileFor: userData.profileFor,
    details: userData.details,
    preferences: userData.preferences,
    photos: userData.photos ?? [],
    interests: userData.interests ?? ['Travel', 'Family time'],
  };
}

async function fetchProfile(userId: string, email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('profile_data')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const profile = data.profile_data as Partial<User>;
  const normalizedProfile = createDefaultUser(email, { ...profile, id: userId, email });

  if (profile.email !== email) {
    await supabase
      .from('profiles')
      .update({
        email,
        profile_data: normalizedProfile,
      })
      .eq('id', userId);
  }

  return normalizedProfile;
}

async function persistProfile(userId: string, profileData: User) {
  const { error } = await supabase
    .from('profiles')
    .update({ profile_data: profileData })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertProfile(userId: string, email: string, profileData: User) {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      profile_data: profileData,
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function createVerifiedProfile(authUser: SupabaseUser) {
  const email = authUser.email ?? '';
  const pendingProfile = getPendingProfileFromAuthUser(authUser);
  const profile = createDefaultUser(email, {
    ...pendingProfile,
    id: authUser.id,
    email,
    accountStatus: buildVerifiedEmailVerificationStatus(),
  });

  await upsertProfile(authUser.id, email, profile);
  return profile;
}

async function resolveSignedInProfile(authUser: SupabaseUser) {
  const email = authUser.email ?? '';
  const profile = await fetchProfile(authUser.id, email);
  if (!profile) return createVerifiedProfile(authUser);

  // Supabase has confirmed the email but our profile still says unverified — sync it
  if (authUser.email_confirmed_at && isEmailVerificationPending(profile)) {
    const syncedProfile = createDefaultUser(email, {
      ...profile,
      accountStatus: buildVerifiedEmailVerificationStatus(profile.accountStatus),
    });
    await upsertProfile(authUser.id, email, syncedProfile);
    return syncedProfile;
  }

  return profile;
}

// Single subscription reference — prevents duplicate listeners when initialize() is called
// from multiple places (App.tsx, VerifyEmailPage, etc.)
let _authSub: { unsubscribe: () => void } | null = null;

export const useAuthStore = create<AuthState>()((set, get) => {
  const buildSignedOutState = () => ({
    user: null,
    isAuthenticated: false,
    requiresEmailVerification: false,
    pendingVerificationEmail: null,
  });

  const isSessionErrorMessage = (message?: string | null) => {
    const normalizedMessage = message?.toLowerCase() ?? '';

    return [
      'auth session missing',
      'jwt expired',
      'invalid refresh token',
      'refresh token',
      'session not found',
      'not authenticated',
      'missing sub claim',
      'token has expired',
      'session from session_id claim in jwt does not exist',
      'user from sub claim in jwt does not exist',
    ].some((fragment) => normalizedMessage.includes(fragment));
  };

  const reauthenticateSensitiveAction = async (email: string, currentPassword: string) => {
    if (!currentPassword) {
      return {
        ok: false as const,
        error: 'Enter your current password to confirm this change.',
      };
    }

    const verificationClient = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );

    try {
      const { data, error } = await verificationClient.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (error || !data.user) {
        return {
          ok: false as const,
          error: 'Your current password is incorrect.',
        };
      }

      return { ok: true as const };
    } finally {
      await verificationClient.auth.signOut({ scope: 'local' });
    }
  };

  const clearLocalAuthSession = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    rememberPendingVerificationEmail(null);
    set(buildSignedOutState());
  };

  const ensureFreshAuthSession = async () => {
    const {
      data: { session: existingSession },
    } = await supabase.auth.getSession();

    if (!existingSession) {
      await clearLocalAuthSession();
      return {
        ok: false as const,
        error: 'Your session has expired. Please sign in again to continue.',
      };
    }

    const {
      data: { session: refreshedSession },
      error,
    } = await supabase.auth.refreshSession();

    if (error || !refreshedSession) {
      await clearLocalAuthSession();
      return {
        ok: false as const,
        error: 'Your session is no longer valid. Please sign in again to continue.',
      };
    }

    return { ok: true as const };
  };

  const commitProfileUpdate = async (previousUser: User, nextUser: User) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      await clearLocalAuthSession();
      return {
        ok: false as const,
        error: 'Your session has expired. Please sign in again to continue.',
      };
    }

    set({ user: nextUser });

    try {
      await persistProfile(previousUser.id, nextUser);
      return { ok: true as const };
    } catch (error) {
      set({ user: previousUser });

      if (error instanceof Error && isSessionErrorMessage(error.message)) {
        await clearLocalAuthSession();
        return {
          ok: false as const,
          error: 'Your session is no longer valid. Please sign in again to continue.',
        };
      }

      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'We could not save your changes just now.',
      };
    }
  };

  return ({
    user: null,
    isAuthenticated: false,
    requiresEmailVerification: false,
    pendingVerificationEmail: null,
    isLoading: true,
    isInitialized: false,

  initialize: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const profile = await resolveSignedInProfile(session.user);
      if (isEmailVerificationPending(profile)) {
        rememberPendingVerificationEmail(session.user.email ?? profile.email);
        set({
          user: profile,
          isAuthenticated: false,
          requiresEmailVerification: true,
          pendingVerificationEmail: session.user.email ?? profile.email,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        rememberPendingVerificationEmail(null);
        set({
          user: profile,
          isAuthenticated: true,
          requiresEmailVerification: false,
          pendingVerificationEmail: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    } else {
      const pendingVerificationEmail = sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
      set({
        user: null,
        isAuthenticated: false,
        requiresEmailVerification: !!pendingVerificationEmail,
        pendingVerificationEmail,
        isLoading: false,
        isInitialized: true,
      });
    }

    // Only register the listener once — subsequent calls to initialize() (e.g. from
    // VerifyEmailPage after email confirmation) will skip this to avoid duplicates.
    if (_authSub) return;

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // If login() / register() already set this user, skip to avoid a race condition
        // where fetchProfile returns null (profile not yet written) and clears isAuthenticated.
        if (get().user?.id === session.user.id) return;
        // If login() / register() is currently in progress (isLoading=true), skip — they own
        // the auth flow and will handle profile creation / notRegistered themselves.
        if (get().isLoading) return;

        const profile = await resolveSignedInProfile(session.user);
        if (profile) {
          if (isEmailVerificationPending(profile)) {
            rememberPendingVerificationEmail(session.user.email ?? profile.email);
            set({
              user: profile,
              isAuthenticated: false,
              requiresEmailVerification: true,
              pendingVerificationEmail: session.user.email ?? profile.email,
              isLoading: false,
            });
          } else {
            rememberPendingVerificationEmail(null);
            set({
              user: profile,
              isAuthenticated: true,
              requiresEmailVerification: false,
              pendingVerificationEmail: null,
              isLoading: false,
            });
          }
        }
        // If profile is still null, login() will handle creating it — don't override state.
      } else if (event === 'SIGNED_OUT') {
        const pendingVerificationEmail = sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
        set({
          user: null,
          isAuthenticated: false,
          requiresEmailVerification: !!pendingVerificationEmail,
          pendingVerificationEmail,
          isLoading: false,
        });
      }
    });
    _authSub = data.subscription;
  },

  login: async (email: string, password: string) => {
    const normalizedEmail = normalizeEmailAddress(email);
    set({ isLoading: true });

    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (error || !data.user) {
      set({ isLoading: false });
      if (error?.message?.toLowerCase().includes('email not confirmed')) {
        return {
          ok: false,
          error: 'Please confirm your email before signing in. Check your inbox.',
          confirmEmail: true,
        };
      }
      return { ok: false, error: 'Invalid email or password. Please check your credentials.' };
    }

    // Check if the user has completed registration (profile exists in our DB).
    // If not, they exist in Auth but never went through our registration flow —
    // sign them out and redirect to register instead of auto-creating a bare profile.
    const existingProfile = await fetchProfile(data.user.id, data.user.email ?? normalizedEmail);
    if (!existingProfile) {
      await supabase.auth.signOut({ scope: 'local' });
      set({ isLoading: false });
      return { ok: false, notRegistered: true };
    }

    const profile = await resolveSignedInProfile(data.user);

    if (isEmailVerificationPending(profile)) {
      await supabase.auth.signOut({ scope: 'local' });
      rememberPendingVerificationEmail(normalizedEmail);
      set({
        user: profile,
        isAuthenticated: false,
        requiresEmailVerification: true,
        pendingVerificationEmail: normalizedEmail,
        isLoading: false,
      });
      return {
        ok: false,
        error: 'Please verify your email before accessing your dashboard.',
        confirmEmail: true,
      };
    }

    rememberPendingVerificationEmail(null);
    set({
      user: profile,
      isAuthenticated: true,
      requiresEmailVerification: false,
      pendingVerificationEmail: null,
      isLoading: false,
    });
    return { ok: true };
  },

  register: async (userData) => {
    const normalizedEmail = normalizeEmailAddress(userData.email);
    const normalizedUserData = { ...userData, email: normalizedEmail };
    set({ isLoading: true });
    const pendingProfile = buildPendingProfile(normalizedUserData);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedUserData.password as string,
      options: {
        emailRedirectTo: buildEmailVerificationRedirect(normalizedUserData.redirectTo),
        data: {
          pendingProfile,
        },
      },
    });

    if (error) {
      const isAlreadyExists =
        (error as any)?.code === 'user_already_exists' ||
        error.message?.toLowerCase().includes('already registered') ||
        error.message?.toLowerCase().includes('already exists');

      if (isAlreadyExists) {
        // isLoading is still true here so the onAuthStateChange SIGNED_IN guard stays active.
        // Attempt orphaned-account recovery: user exists in Auth but may have no profile.
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedUserData.password as string,
        });

        if (!signInError && signInData.user) {
          const existingProfile = await fetchProfile(signInData.user.id, normalizedEmail);
          if (!existingProfile) {
            const newUser = createDefaultUser(normalizedEmail, {
              ...pendingProfile,
              id: signInData.user.id,
              name: normalizedUserData.name || normalizedEmail.split('@')[0],
              photos: [],
              interests: ['Travel', 'Family time'],
              accountStatus: buildPendingEmailVerificationStatus(),
            });
            const { password: _pw, ...profileData } = newUser as typeof newUser & { password?: string };
            await upsertProfile(signInData.user.id, normalizedEmail, profileData);

            const verificationResult = await sendEmailVerificationLink(normalizedEmail, normalizedUserData.redirectTo);
            await supabase.auth.signOut({ scope: 'local' });

            rememberPendingVerificationEmail(normalizedEmail);
            set({
              user: null,
              isAuthenticated: false,
              requiresEmailVerification: true,
              pendingVerificationEmail: normalizedEmail,
              isLoading: false,
            });

            if (!verificationResult.ok) {
              return {
                ok: false,
                error: `Profile set up, but we could not send the verification email. ${verificationResult.error}`,
                confirmEmail: true,
              };
            }
            return { ok: true, confirmEmail: true };
          }
          await supabase.auth.signOut({ scope: 'local' });
        }

        set({ isLoading: false });
        return { ok: false, error: 'An account with this email already exists. Try signing in.' };
      }

      set({ isLoading: false });
      return { ok: false, error: error.message || 'Registration failed. Please try again.' };
    }

    if (!data.user) {
      set({ isLoading: false });
      return { ok: false, error: 'Registration failed. Please try again.' };
    }

    if (!data.session) {
      // When "Confirm email" is ON, Supabase silently returns the existing user with
      // identities:[] instead of an error — this detects that case.
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {

        // Check if this is an orphaned account: exists in Supabase Auth but has no profile
        // in our DB (e.g. profile was deleted). Try signing in to verify ownership, then
        // create the missing profile so the user can complete registration normally.
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedUserData.password as string,
        });
        if (!signInError && signInData.user) {
          const existingProfile = await fetchProfile(signInData.user.id, normalizedEmail);
          if (!existingProfile) {
            // Orphaned account — create the profile from the form data they just entered
            const newUser = createDefaultUser(normalizedEmail, {
              ...pendingProfile,
              id: signInData.user.id,
              name: normalizedUserData.name || normalizedEmail.split('@')[0],
              photos: [],
              interests: ['Travel', 'Family time'],
              accountStatus: buildPendingEmailVerificationStatus(),
            });
            const { password: _pw, ...profileData } = newUser as typeof newUser & { password?: string };
            await upsertProfile(signInData.user.id, normalizedEmail, profileData);

            const verificationResult = await sendEmailVerificationLink(normalizedEmail, normalizedUserData.redirectTo);
            await supabase.auth.signOut({ scope: 'local' });

            rememberPendingVerificationEmail(normalizedEmail);
            set({
              user: null,
              isAuthenticated: false,
              requiresEmailVerification: true,
              pendingVerificationEmail: normalizedEmail,
              isLoading: false,
            });

            if (!verificationResult.ok) {
              return {
                ok: false,
                error: `Profile set up, but we could not send the verification email. ${verificationResult.error}`,
                confirmEmail: true,
              };
            }
            return { ok: true, confirmEmail: true };
          }
          // Profile exists — just sign them back out and tell them to sign in
          await supabase.auth.signOut({ scope: 'local' });
        }

        set({ isLoading: false });
        return { ok: false, error: 'An account with this email already exists. Try signing in.' };
      }

      rememberPendingVerificationEmail(normalizedEmail);
      set({
        user: null,
        isAuthenticated: false,
        requiresEmailVerification: true,
        pendingVerificationEmail: normalizedEmail,
        isLoading: false,
      });
      return { ok: true, confirmEmail: true };
    }

    const newUser = createDefaultUser(normalizedEmail, {
      ...normalizedUserData,
      id: data.user.id,
      name: normalizedUserData.name || normalizedEmail.split('@')[0],
      photos: normalizedUserData.photos || [],
      interests: normalizedUserData.interests || ['Travel', 'Family time'],
      accountStatus: buildPendingEmailVerificationStatus(),
    });

    const { password: _password, ...profileData } = newUser as User & { password?: string };

    await upsertProfile(data.user.id, normalizedEmail, profileData);

    const verificationResult = await sendEmailVerificationLink(normalizedEmail, normalizedUserData.redirectTo);
    await supabase.auth.signOut({ scope: 'local' });

    rememberPendingVerificationEmail(normalizedEmail);
    set({
      user: null,
      isAuthenticated: false,
      requiresEmailVerification: true,
      pendingVerificationEmail: normalizedEmail,
      isLoading: false,
    });

    if (!verificationResult.ok) {
      return {
        ok: false,
        error: `Account created, but we could not send the verification email yet. ${verificationResult.error}`,
        confirmEmail: true,
      };
    }

    return { ok: true, confirmEmail: true };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      await supabase.auth.signOut({ scope: 'local' });
    }
    rememberPendingVerificationEmail(null);
    set(buildSignedOutState());
  },

  updateUser: async (updates) => {
    const user = get().user;
    if (!user) return;
    const updated = createDefaultUser(user.email, { ...user, ...updates });
    const result = await commitProfileUpdate(user, updated);
    if (!result.ok) throw new Error(result.error);
  },

  updatePreferences: async (updates) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, preferences: { ...user.preferences, ...updates } };
    const result = await commitProfileUpdate(user, updated);
    if (!result.ok) throw new Error(result.error);
  },

  updatePrivacy: async (updates) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, privacy: { ...user.privacy, ...updates } };
    const result = await commitProfileUpdate(user, updated);
    if (!result.ok) throw new Error(result.error);
  },

  updateDetails: async (updates) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, details: { ...user.details, ...updates } };
    const result = await commitProfileUpdate(user, updated);
    if (!result.ok) throw new Error(result.error);
  },

  toggleShortlist: (userId) => {
    const user = get().user;
    if (!user) return;
    const exists = user.shortlisted.includes(userId);
    const updated = {
      ...user,
      shortlisted: exists
        ? user.shortlisted.filter((id) => id !== userId)
        : [userId, ...user.shortlisted],
    };
    set({ user: updated });
    supabase.from('profiles').update({ profile_data: updated }).eq('id', user.id);
  },

  addViewedProfile: (userId) => {
    const user = get().user;
    if (!user || user.id === userId) return;
    const updated = { ...user, recentlyViewed: pushRecent(user.recentlyViewed, userId) };
    set({ user: updated });
    supabase.from('profiles').update({ profile_data: updated }).eq('id', user.id);
  },

  addVisitor: (userId) => {
    const user = get().user;
    if (!user || user.id === userId) return;
    const updated = { ...user, recentVisitors: pushRecent(user.recentVisitors, userId) };
    set({ user: updated });
    supabase.from('profiles').update({ profile_data: updated }).eq('id', user.id);
  },

  blockUser: (userId) => {
    const user = get().user;
    if (!user || user.blockedUsers.includes(userId)) return;
    const updated = {
      ...user,
      blockedUsers: [...user.blockedUsers, userId],
      shortlisted: user.shortlisted.filter((id) => id !== userId),
    };
    set({ user: updated });
    supabase.from('profiles').update({ profile_data: updated }).eq('id', user.id);
  },

  unblockUser: (userId) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, blockedUsers: user.blockedUsers.filter((id) => id !== userId) };
    set({ user: updated });
    supabase.from('profiles').update({ profile_data: updated }).eq('id', user.id);
  },

  addMatch: (userId) => {
    const user = get().user;
    if (!user || user.matches.includes(userId)) return;
    const updated = { ...user, matches: [...user.matches, userId] };
    set({ user: updated });
    supabase.from('profiles').update({ profile_data: updated }).eq('id', user.id);
  },

  addLike: (userId) => {
    const user = get().user;
    if (!user || user.likes.includes(userId)) return;
    const updated = { ...user, likes: [...user.likes, userId] };
    set({ user: updated });
    supabase.from('profiles').update({ profile_data: updated }).eq('id', user.id);
  },

  updateNotifications: async (updates) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, notifications: { ...user.notifications, ...updates } };
    const result = await commitProfileUpdate(user, updated);
    if (!result.ok) throw new Error(result.error);
  },

  updateChatDefaults: async (updates) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, chatDefaults: { ...user.chatDefaults, ...updates } };
    const result = await commitProfileUpdate(user, updated);
    if (!result.ok) throw new Error(result.error);
  },

  updateAppearance: async (updates) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, appearance: { ...user.appearance, ...updates } };
    const result = await commitProfileUpdate(user, updated);
    if (!result.ok) throw new Error(result.error);
  },

  resetPassword: async (email: string, redirectTo) => {
    const normalizedEmail = normalizeEmailAddress(email);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: buildPasswordResetRedirect(redirectTo),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const user = get().user;
    if (!user) return { ok: false, error: 'Not authenticated' };

    const validationError = getPasswordValidationMessage(newPassword, {
      email: user.email,
      currentPassword,
      requireCurrentDifference: true,
    });
    if (validationError) {
      return { ok: false, error: validationError };
    }

    const sessionCheck = await ensureFreshAuthSession();
    if (!sessionCheck.ok) return sessionCheck;

    const reauthResult = await reauthenticateSensitiveAction(user.email, currentPassword);
    if (!reauthResult.ok) return reauthResult;

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      if (error.message?.toLowerCase().includes('auth session missing')) {
        await clearLocalAuthSession();
        return {
          ok: false,
          error: 'Your session expired while updating your password. Please sign in again and retry.',
        };
      }

      return { ok: false, error: error.message };
    }
    return { ok: true };
  },

  changeEmail: async (newEmail: string, currentPassword: string, redirectTo = '/settings') => {
    const user = get().user;
    if (!user) return { ok: false, error: 'Not authenticated' };
    const normalizedEmail = normalizeEmailAddress(newEmail);

    if (!normalizedEmail) {
      return { ok: false, error: 'Enter the new email address you want to use.' };
    }

    const sessionCheck = await ensureFreshAuthSession();
    if (!sessionCheck.ok) return sessionCheck;

    const reauthResult = await reauthenticateSensitiveAction(user.email, currentPassword);
    if (!reauthResult.ok) return reauthResult;

    const { error } = await supabase.auth.updateUser(
      { email: normalizedEmail },
      { emailRedirectTo: buildEmailVerificationRedirect(redirectTo) },
    );

    if (error) {
      if (error.message?.toLowerCase().includes('auth session missing')) {
        await clearLocalAuthSession();
        return {
          ok: false,
          error: 'Your session expired while updating your email. Please sign in again and retry.',
        };
      }

      return { ok: false, error: error.message };
    }
    return { ok: true };
  },

  deleteAccount: async () => {
    const user = get().user;
    if (!user) return { ok: false, error: 'Not authenticated' };
    return {
      ok: false,
      error: 'Permanent account deletion is not enabled in this build yet. Use log out for now.',
    };
  },
  });
});
