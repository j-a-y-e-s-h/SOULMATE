import { create } from 'zustand';
import { createClient, type RealtimeChannel, type User as SupabaseUser } from '@supabase/supabase-js';
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
  requiresReactivation: boolean;
  pendingVerificationEmail: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; confirmEmail?: boolean; notRegistered?: boolean; deactivated?: boolean }>;
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
  deactivateAccount: (currentPassword: string) => Promise<{ ok: boolean; error?: string; message?: string }>;
  reactivateAccount: () => Promise<{ ok: boolean; error?: string }>;
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

interface ProfileRecord {
  profile: User;
  isActive: boolean;
  deactivatedAt: string | null;
}

async function fetchProfileRecord(userId: string, email: string): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('profile_data, is_active, deactivated_at')
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

  return {
    profile: normalizedProfile,
    isActive: data.is_active ?? true,
    deactivatedAt: data.deactivated_at ?? null,
  };
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

async function upsertProfileWithRetry(userId: string, email: string, profileData: User) {
  try {
    await upsertProfile(userId, email, profileData);
  } catch {
    try {
      await upsertProfile(userId, email, profileData);
    } catch {
      await supabase.auth.signOut({ scope: 'local' });
      throw new Error('Account setup failed, please try again');
    }
  }
}

async function createVerifiedProfile(authUser: SupabaseUser): Promise<ProfileRecord> {
  const email = authUser.email ?? '';
  const pendingProfile = getPendingProfileFromAuthUser(authUser);
  const profile = createDefaultUser(email, {
    ...pendingProfile,
    id: authUser.id,
    email,
    accountStatus: buildVerifiedEmailVerificationStatus(),
  });

  await upsertProfile(authUser.id, email, profile);
  return {
    profile,
    isActive: true,
    deactivatedAt: null,
  };
}

async function resolveSignedInProfile(authUser: SupabaseUser): Promise<ProfileRecord> {
  const email = authUser.email ?? '';
  const profileRecord = await fetchProfileRecord(authUser.id, email);
  if (!profileRecord) return createVerifiedProfile(authUser);

  // Supabase has confirmed the email but our profile still says unverified — sync it
  if (authUser.email_confirmed_at && isEmailVerificationPending(profileRecord.profile)) {
    const syncedProfile = createDefaultUser(email, {
      ...profileRecord.profile,
      accountStatus: buildVerifiedEmailVerificationStatus(profileRecord.profile.accountStatus),
    });
    await upsertProfile(authUser.id, email, syncedProfile);
    return {
      ...profileRecord,
      profile: syncedProfile,
    };
  }

  return profileRecord;
}

// Single subscription reference — prevents duplicate listeners when initialize() is called
// from multiple places (App.tsx, VerifyEmailPage, etc.)
let _authSub: { unsubscribe: () => void } | null = null;
// Realtime channel for detecting profile deletion / verification changes while logged in
let _profileChannel: RealtimeChannel | null = null;

function unsubscribeProfileChannel() {
  if (_profileChannel) {
    supabase.removeChannel(_profileChannel);
    _profileChannel = null;
  }
}

function subscribeToProfileChanges(userId: string) {
  // Avoid duplicate subscriptions
  unsubscribeProfileChannel();

  _profileChannel = supabase
    .channel(`profile-watch-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      async () => {
        // Profile was deleted from DB — force sign out immediately
        await supabase.auth.signOut({ scope: 'local' });
        rememberPendingVerificationEmail(null);
        unsubscribeProfileChannel();
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          requiresEmailVerification: false,
          requiresReactivation: false,
          pendingVerificationEmail: null,
        });
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const profileRow = payload.new as {
          profile_data?: Partial<User>;
          is_active?: boolean | null;
        };
        const profileData = profileRow?.profile_data;

        if (profileRow?.is_active === false) {
          const email = profileData?.email || useAuthStore.getState().user?.email || '';
          const nextUser = profileData
            ? createDefaultUser(email, { ...profileData, id: userId, email })
            : useAuthStore.getState().user;

          rememberPendingVerificationEmail(null);
          useAuthStore.setState({
            user: nextUser ?? null,
            isAuthenticated: false,
            requiresEmailVerification: false,
            requiresReactivation: true,
            pendingVerificationEmail: null,
            isLoading: false,
          });
          return;
        }

        // If profile_data was updated and emailVerified was flipped to false, force re-verification
        if (profileData?.accountStatus?.emailVerified === false) {
          const email = profileData.email || useAuthStore.getState().user?.email || '';
          rememberPendingVerificationEmail(email);
          useAuthStore.setState({
            isAuthenticated: false,
            requiresEmailVerification: true,
            requiresReactivation: false,
            pendingVerificationEmail: email,
          });
        }
      },
    )
    .subscribe();
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const buildSignedOutState = () => ({
    user: null,
    isAuthenticated: false,
    requiresEmailVerification: false,
    requiresReactivation: false,
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
    unsubscribeProfileChannel();
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

  const applyResolvedProfileState = (
    authUser: SupabaseUser,
    resolvedProfile: ProfileRecord,
    options?: { isInitialized?: boolean },
  ) => {
    const email = authUser.email ?? resolvedProfile.profile.email;
    const nextState = options?.isInitialized === undefined ? {} : { isInitialized: options.isInitialized };

    if (isEmailVerificationPending(resolvedProfile.profile)) {
      unsubscribeProfileChannel();
      rememberPendingVerificationEmail(email);
      set({
        user: resolvedProfile.profile,
        isAuthenticated: false,
        requiresEmailVerification: true,
        requiresReactivation: false,
        pendingVerificationEmail: email,
        isLoading: false,
        ...nextState,
      });
      return;
    }

    if (!resolvedProfile.isActive) {
      unsubscribeProfileChannel();
      rememberPendingVerificationEmail(null);
      set({
        user: resolvedProfile.profile,
        isAuthenticated: false,
        requiresEmailVerification: false,
        requiresReactivation: true,
        pendingVerificationEmail: null,
        isLoading: false,
        ...nextState,
      });
      return;
    }

    rememberPendingVerificationEmail(null);
    subscribeToProfileChanges(authUser.id);
    set({
      user: resolvedProfile.profile,
      isAuthenticated: true,
      requiresEmailVerification: false,
      requiresReactivation: false,
      pendingVerificationEmail: null,
      isLoading: false,
      ...nextState,
    });
  };

  const finalizeAccountSetupFailure = (error: unknown) => {
    rememberPendingVerificationEmail(null);
    set({
      ...buildSignedOutState(),
      isLoading: false,
    });

    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Account setup failed, please try again',
    };
  };

  return ({
    user: null,
    isAuthenticated: false,
    requiresEmailVerification: false,
    requiresReactivation: false,
    pendingVerificationEmail: null,
    isLoading: true,
    isInitialized: false,

  initialize: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const profileRecord = await resolveSignedInProfile(session.user);
      applyResolvedProfileState(session.user, profileRecord, { isInitialized: true });
    } else {
      const pendingVerificationEmail = sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
      set({
        user: null,
        isAuthenticated: false,
        requiresEmailVerification: !!pendingVerificationEmail,
        requiresReactivation: false,
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
        // the auth flow and will handle profile creation / inactive-account prompts themselves.
        if (get().isLoading) return;

        const profileRecord = await resolveSignedInProfile(session.user);
        applyResolvedProfileState(session.user, profileRecord);
      } else if (event === 'SIGNED_OUT') {
        unsubscribeProfileChannel();
        const pendingVerificationEmail = sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
        set({
          user: null,
          isAuthenticated: false,
          requiresEmailVerification: !!pendingVerificationEmail,
          requiresReactivation: false,
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

    const profileRecord = await resolveSignedInProfile(data.user);
    const profile = profileRecord.profile;

    if (isEmailVerificationPending(profile)) {
      await supabase.auth.signOut({ scope: 'local' });
      rememberPendingVerificationEmail(normalizedEmail);
      set({
        user: profile,
        isAuthenticated: false,
        requiresEmailVerification: true,
        requiresReactivation: false,
        pendingVerificationEmail: normalizedEmail,
        isLoading: false,
      });
      return {
        ok: false,
        error: 'Please verify your email before accessing your dashboard.',
        confirmEmail: true,
      };
    }

    if (!profileRecord.isActive) {
      rememberPendingVerificationEmail(null);
      set({
        user: profile,
        isAuthenticated: false,
        requiresEmailVerification: false,
        requiresReactivation: true,
        pendingVerificationEmail: null,
        isLoading: false,
      });
      return { ok: false, deactivated: true };
    }

    applyResolvedProfileState(data.user, profileRecord);
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
        (error as { code?: string })?.code === 'user_already_exists' ||
        error.message?.toLowerCase().includes('already registered') ||
        error.message?.toLowerCase().includes('already exists');

      if (isAlreadyExists) {
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
        set({ isLoading: false });
        return { ok: false, error: 'An account with this email already exists. Try signing in.' };
      }

      rememberPendingVerificationEmail(normalizedEmail);
      set({
        user: null,
        isAuthenticated: false,
        requiresEmailVerification: true,
        requiresReactivation: false,
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

    const profileData: Partial<User> & { password?: string } = { ...newUser };
    delete profileData.password;

    try {
      await upsertProfileWithRetry(data.user.id, normalizedEmail, profileData as User);
    } catch (accountSetupError) {
      return finalizeAccountSetupFailure(accountSetupError);
    }

    const verificationResult = await sendEmailVerificationLink(normalizedEmail, normalizedUserData.redirectTo);
    await supabase.auth.signOut({ scope: 'local' });

    rememberPendingVerificationEmail(normalizedEmail);
    set({
      user: null,
      isAuthenticated: false,
      requiresEmailVerification: true,
      requiresReactivation: false,
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
    unsubscribeProfileChannel();
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

  deactivateAccount: async (currentPassword: string) => {
    const user = get().user;
    if (!user) return { ok: false, error: 'Not authenticated' };

    const sessionCheck = await ensureFreshAuthSession();
    if (!sessionCheck.ok) return sessionCheck;

    const reauthResult = await reauthenticateSensitiveAction(user.email, currentPassword);
    if (!reauthResult.ok) return reauthResult;

    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      if (isSessionErrorMessage(error.message)) {
        await clearLocalAuthSession();
        return {
          ok: false,
          error: 'Your session expired while deactivating your account. Please sign in again and retry.',
        };
      }

      return { ok: false, error: error.message };
    }

    unsubscribeProfileChannel();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      await supabase.auth.signOut({ scope: 'local' });
    }

    rememberPendingVerificationEmail(null);
    set(buildSignedOutState());

    return { ok: true, message: 'Your account has been deactivated' };
  },

  reactivateAccount: async () => {
    const user = get().user;
    if (!user) return { ok: false, error: 'Not authenticated' };

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      await clearLocalAuthSession();
      return {
        ok: false,
        error: 'Your session has expired. Please sign in again to continue.',
      };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: true,
        deactivated_at: null,
      })
      .eq('id', user.id);

    if (error) {
      if (isSessionErrorMessage(error.message)) {
        await clearLocalAuthSession();
        return {
          ok: false,
          error: 'Your session expired while reactivating your account. Please sign in again.',
        };
      }

      return { ok: false, error: error.message };
    }

    const resolvedProfile = await resolveSignedInProfile(session.user);
    applyResolvedProfileState(session.user, {
      ...resolvedProfile,
      isActive: true,
      deactivatedAt: null,
    });

    return { ok: true };
  },
  });
});
