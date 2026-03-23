import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  fetchInterestRequests,
  fetchMatches,
  fetchMessages,
  createMatch,
  sendInterestRequest,
  respondToInterestRequest,
  sendMessage as dbSendMessage,
  markMessagesRead,
  softDeleteMessage,
  subscribeToMessages,
  subscribeToInterestRequests,
  subscribeToMatches,
  getOtherUserId,
  type DbInterestRequest,
  type DbMatch,
  type DbMessage,
} from '@/lib/chatService';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { createDefaultUser } from '@/lib/demoData';
import type { Match, InterestRequest, Message, User } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

// Shape-compatible with the existing Match, InterestRequest, Message types
// so Chat.tsx / Matches.tsx work without changes.

function dbMatchToChatMatch(
  dbMatch: DbMatch,
  currentUserId: string,
  otherUserProfile: User,
): Match {
  return {
    id: dbMatch.id,
    userId: currentUserId,
    matchedUserId: getOtherUserId(dbMatch, currentUserId),
    matchedUser: otherUserProfile,
    status: 'matched' as const,
    createdAt: new Date(dbMatch.created_at),
  };
}

function dbInterestToInterestRequest(req: DbInterestRequest): InterestRequest {
  return {
    id: req.id,
    fromUserId: req.from_user_id,
    toUserId: req.to_user_id,
    message: req.message,
    status: req.status,
    createdAt: new Date(req.created_at),
  };
}

function dbMessageToChatMessage(msg: DbMessage): Message {
  return {
    id: msg.id,
    matchId: msg.match_id,
    senderId: msg.sender_id,
    content: msg.content,
    read: msg.read,
    createdAt: new Date(msg.created_at),
    deleted: msg.deleted ?? false,
    replyToContent: msg.reply_to_content ?? undefined,
  };
}

// ─── Fetch other users' profiles ─────────────────────────────────────────────

async function fetchProfilesForUsers(userIds: string[]): Promise<Record<string, User>> {
  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, profile_data')
    .in('id', userIds);

  if (error || !data) return {};

  const result: Record<string, User> = {};
  for (const row of data) {
    const profile = row.profile_data as Partial<User>;
    result[row.id] = createDefaultUser(row.email, { ...profile, id: row.id, email: row.email });
  }
  return result;
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface ChatState {
  matches: Match[];
  interestRequests: InterestRequest[];
  messages: Record<string, Message[]>;
  profileCache: Record<string, User>;
  profiles: User[];
  isLoading: boolean;
  isInitialized: boolean;
  /** Per-match typing state: matchId → true if the other user is typing */
  typingByMatch: Record<string, boolean>;
  /** Set of user IDs currently online via Presence */
  onlineUsers: Set<string>;

  /** Load all matches, interest requests, and profile data from Supabase */
  loadAll: () => Promise<void>;

  /** Load all discoverable profiles (excluding self and blocked) */
  loadProfiles: () => Promise<void>;

  /** Send an interest request to another user */
  sendInterest: (toUserId: string, message?: string) => Promise<{ outcome: 'pending' | 'matched' | 'existing'; matchId?: string; requestId?: string }>;

  /** Accept or decline an incoming interest request */
  respondToInterest: (requestId: string, decision: 'accepted' | 'declined') => Promise<{ outcome: string; matchId?: string }>;

  /** Send a message in a match */
  sendMessage: (matchId: string, content: string) => Promise<void>;

  /** Get messages for a given match (returns local cache) */
  getConversation: (matchId: string) => Message[];

  /** Load messages for a match from Supabase */
  loadMessages: (matchId: string) => Promise<void>;

  /** Mark all unread messages in a match as read */
  markMessagesAsRead: (matchId: string) => Promise<void>;

  /** Subscribe to real-time messages for a match. Returns unsubscribe fn. */
  subscribeToMatchMessages: (matchId: string) => () => void;

  /** Subscribe to all real-time updates (interest requests + new matches) for current user */
  subscribeGlobal: () => () => void;

  /** Broadcast a typing event for a match */
  broadcastTyping: (matchId: string) => void;

  /** Soft-delete a message (sets deleted=true in DB) */
  deleteMessage: (messageId: string, matchId: string) => Promise<void>;

  /** Send a message with optional reply quote */
  sendMessageWithReply: (matchId: string, content: string, replyToContent?: string) => Promise<void>;

  /** Check if a user is currently online */
  isUserOnline: (userId: string) => boolean;

  /** Look up a profile from cache */
  getProfileById: (userId: string) => User | undefined;

  /** Clear conversation locally (soft clear) */
  clearConversation: (matchId: string) => void;

  /** Block a user — delegates to authStore, removes from local state */
  blockUser: (userId: string) => void;
}

// ─── Store implementation ─────────────────────────────────────────────────────

// typing auto-clear timers
const typingTimers: Record<string, ReturnType<typeof setTimeout>> = {};
// store subscribed typing channels so broadcastTyping can reuse them
const typingChannels = new Map<string, ReturnType<typeof supabase.channel>>();

async function sendMatchBroadcast(matchId: string, event: 'read' | 'typing', userId: string) {
  const channel = typingChannels.get(matchId);
  if (!channel) return;

  try {
    await channel.httpSend(event, { userId });
  } catch (err) {
    console.error(`[chatStore] ${event} broadcast error:`, err);
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  matches: [],
  interestRequests: [],
  messages: {},
  profileCache: {},
  profiles: [],
  isLoading: false,
  isInitialized: false,
  typingByMatch: {},
  onlineUsers: new Set<string>(),

  loadAll: async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    const userId = currentUser.id;

    set({ isLoading: true });

    try {
      const [dbMatches, dbRequests] = await Promise.all([
        fetchMatches(userId),
        fetchInterestRequests(userId),
      ]);

      // Collect all other-user IDs we need profiles for
      const otherUserIds = dbMatches.map((m) => getOtherUserId(m, userId));
      const requestUserIds = dbRequests.flatMap((r) => [r.from_user_id, r.to_user_id]);
      const allIds = [...new Set([...otherUserIds, ...requestUserIds])].filter(
        (id) => id !== userId,
      );

      const profiles = await fetchProfilesForUsers(allIds);
      const profileCache = { ...get().profileCache, ...profiles };

      // Build typed match objects
      const matches = dbMatches
        .map((dbMatch) => {
          const otherUserId = getOtherUserId(dbMatch, userId);
          const profile = profileCache[otherUserId];
          if (!profile) return null;
          return dbMatchToChatMatch(dbMatch, userId, profile);
        })
        .filter((m): m is Match => m !== null);

      const interestRequests = dbRequests.map(dbInterestToInterestRequest);

      set({ matches, interestRequests, profileCache, isLoading: false, isInitialized: true });
    } catch (err) {
      console.error('[chatStore] loadAll error:', err);
      set({ isLoading: false, isInitialized: true });
    }
  },

  loadProfiles: async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    const blockedUsers = currentUser.blockedUsers ?? [];

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, profile_data')
      .neq('id', currentUser.id);

    if (error || !data) return;

    const profiles: User[] = data
      .map((row) => {
        const profile = row.profile_data as Partial<User>;
        return createDefaultUser(row.email, { ...profile, id: row.id, email: row.email });
      })
      .filter((p) => !blockedUsers.includes(p.id));

    const newCache: Record<string, User> = {};
    profiles.forEach((p) => { newCache[p.id] = p; });

    set((s) => ({ profiles, profileCache: { ...s.profileCache, ...newCache } }));
  },

  sendInterest: async (toUserId, message = '') => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return { outcome: 'pending' };
    const fromUserId = currentUser.id;

    const state = get();

    // Already matched?
    const existingMatch = state.matches.find((m) => m.matchedUserId === toUserId);
    if (existingMatch) return { outcome: 'matched', matchId: existingMatch.id };

    // Already sent?
    const existing = state.interestRequests.find(
      (r) => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending',
    );
    if (existing) return { outcome: 'existing', requestId: existing.id };

    // Reciprocal pending? → auto-accept and create match
    const reciprocal = state.interestRequests.find(
      (r) => r.fromUserId === toUserId && r.toUserId === fromUserId && r.status === 'pending',
    );

    if (reciprocal) {
      try {
        await respondToInterestRequest(reciprocal.id, 'accepted');
        const dbMatch = await createMatch(fromUserId, toUserId);

        // Ensure profile cache has the other user
        let profileCache = get().profileCache;
        if (!profileCache[toUserId]) {
          const profiles = await fetchProfilesForUsers([toUserId]);
          profileCache = { ...profileCache, ...profiles };
        }

        const otherProfile = profileCache[toUserId];
        const newMatch = dbMatchToChatMatch(dbMatch, fromUserId, otherProfile);

        set((s) => ({
          matches: [newMatch, ...s.matches],
          interestRequests: s.interestRequests.map((r) =>
            r.id === reciprocal.id ? { ...r, status: 'accepted' as const } : r,
          ),
          profileCache,
        }));

        return { outcome: 'matched', matchId: newMatch.id, requestId: reciprocal.id };
      } catch (err) {
        console.error('[chatStore] sendInterest reciprocal error:', err);
        return { outcome: 'pending' };
      }
    }

    // Normal send
    try {
      const dbRequest = await sendInterestRequest(fromUserId, toUserId, message);
      const newRequest = dbInterestToInterestRequest(dbRequest);

      set((s) => ({ interestRequests: [newRequest, ...s.interestRequests] }));
      return { outcome: 'pending', requestId: newRequest.id };
    } catch (err) {
      console.error('[chatStore] sendInterest error:', err);
      throw err;
    }
  },

  respondToInterest: async (requestId, decision) => {
    const state = get();
    const request = state.interestRequests.find((r) => r.id === requestId);
    if (!request) return { outcome: 'existing' };

    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return { outcome: 'existing' };

    try {
      await respondToInterestRequest(requestId, decision);

      if (decision === 'declined') {
        set((s) => ({
          interestRequests: s.interestRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'declined' as const } : r,
          ),
        }));
        return { outcome: 'declined', requestId };
      }

      // Accepted → create match
      const dbMatch = await createMatch(currentUser.id, request.fromUserId);

      let profileCache = get().profileCache;
      if (!profileCache[request.fromUserId]) {
        const profiles = await fetchProfilesForUsers([request.fromUserId]);
        profileCache = { ...profileCache, ...profiles };
      }

      const otherProfile = profileCache[request.fromUserId];
      const newMatch = dbMatchToChatMatch(dbMatch, currentUser.id, otherProfile);

      set((s) => ({
        matches: [newMatch, ...s.matches],
        interestRequests: s.interestRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'accepted' as const } : r,
        ),
        profileCache,
      }));

      return { outcome: 'matched', matchId: newMatch.id };
    } catch (err) {
      console.error('[chatStore] respondToInterest error:', err);
      throw err;
    }
  },

  sendMessage: async (matchId, content) => {
    const senderId = useAuthStore.getState().user?.id;
    if (!senderId) return;

    // Optimistic update
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      matchId,
      senderId,
      content,
      read: false,
      createdAt: new Date(),
    };

    set((s) => ({
      messages: {
        ...s.messages,
        [matchId]: [...(s.messages[matchId] ?? []), optimistic],
      },
    }));

    try {
      const dbMsg = await dbSendMessage(matchId, senderId, content);
      const confirmed = dbMessageToChatMessage(dbMsg);

      set((s) => ({
        messages: {
          ...s.messages,
          [matchId]: (s.messages[matchId] ?? []).map((m) =>
            m.id === optimistic.id ? confirmed : m,
          ),
        },
      }));
    } catch (err) {
      console.error('[chatStore] sendMessage error:', err);
      // Remove optimistic on error
      set((s) => ({
        messages: {
          ...s.messages,
          [matchId]: (s.messages[matchId] ?? []).filter((m) => m.id !== optimistic.id),
        },
      }));
      throw err;
    }
  },

  getConversation: (matchId) => get().messages[matchId] ?? [],

  loadMessages: async (matchId) => {
    try {
      const dbMsgs = await fetchMessages(matchId);
      const msgs = dbMsgs.map(dbMessageToChatMessage);
      set((s) => ({ messages: { ...s.messages, [matchId]: msgs } }));
    } catch (err) {
      console.error('[chatStore] loadMessages error:', err);
    }
  },

  markMessagesAsRead: async (matchId) => {
    const currentUserId = useAuthStore.getState().user?.id;
    if (!currentUserId) return;

    // Optimistic
    set((s) => ({
      messages: {
        ...s.messages,
        [matchId]: (s.messages[matchId] ?? []).map((m) =>
          m.senderId !== currentUserId ? { ...m, read: true } : m,
        ),
      },
    }));

    // Broadcast "read" instantly so the other user's ticks go green without waiting for DB round-trip
    void sendMatchBroadcast(matchId, 'read', currentUserId);

    try {
      await markMessagesRead(matchId, currentUserId);
    } catch (err) {
      console.error('[chatStore] markMessagesAsRead error:', err);
    }
  },

  subscribeToMatchMessages: (matchId) => {
    const currentUserId = useAuthStore.getState().user?.id ?? '';

    const unsubMessages = subscribeToMessages(
      matchId,
      // INSERT handler
      (dbMsg) => {
        const msg = dbMessageToChatMessage(dbMsg);
        set((s) => {
          const existing = s.messages[matchId] ?? [];
          if (existing.some((m) => m.id === msg.id)) return s;
          return { messages: { ...s.messages, [matchId]: [...existing, msg] } };
        });
      },
      // UPDATE handler (read receipts + deleted)
      (dbMsg) => {
        const updated = dbMessageToChatMessage(dbMsg);
        set((s) => ({
          messages: {
            ...s.messages,
            [matchId]: (s.messages[matchId] ?? []).map((m) =>
              m.id === updated.id ? { ...m, read: updated.read, deleted: updated.deleted } : m,
            ),
          },
        }));
      },
    );

    // Typing indicator + read receipts via Broadcast — reuse channel so sender can use same ref
    const typingChannel = supabase
      .channel(`typing:${matchId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId === currentUserId) return;
        set((s) => ({ typingByMatch: { ...s.typingByMatch, [matchId]: true } }));
        if (typingTimers[matchId]) clearTimeout(typingTimers[matchId]);
        typingTimers[matchId] = setTimeout(() => {
          set((s) => ({ typingByMatch: { ...s.typingByMatch, [matchId]: false } }));
        }, 2000);
      })
      .on('broadcast', { event: 'read' }, (payload) => {
        if (payload.payload?.userId === currentUserId) return;
        // Other user just read the chat — instantly mark all my sent messages as read
        set((s) => ({
          messages: {
            ...s.messages,
            [matchId]: (s.messages[matchId] ?? []).map((m) =>
              m.senderId === currentUserId ? { ...m, read: true } : m,
            ),
          },
        }));
      })
      .subscribe();

    typingChannels.set(matchId, typingChannel);

    return () => {
      unsubMessages();
      supabase.removeChannel(typingChannel);
      typingChannels.delete(matchId);
    };
  },

  subscribeGlobal: () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return () => {};

    const unsubInterests = subscribeToInterestRequests(userId, () => {
      // Reload interest requests on any change
      fetchInterestRequests(userId).then((dbRequests) => {
        const prev = get().interestRequests;
        const interestRequests = dbRequests.map(dbInterestToInterestRequest);
        set({ interestRequests });

        // Notify about newly incoming pending requests
        const newIncoming = interestRequests.filter(
          (r) => r.toUserId === userId && r.status === 'pending' && !prev.some((p) => p.id === r.id),
        );
        newIncoming.forEach((r) => {
          const from = get().profileCache[r.fromUserId];
          useNotificationStore.getState().addNotification({
            userId,
            type: 'interest',
            title: from ? `${from.name} sent you an interest` : 'New interest received',
            message: r.message || 'Someone is interested in connecting with you.',
            href: '/chat',
          });
        });
      });
    });

    const unsubMatches = subscribeToMatches(userId, () => {
      // Reload all data when a new match appears
      get().loadAll();
    });

    // Presence tracking — who is online
    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<{ user_id: string }>();
        const ids = new Set(
          Object.values(state)
            .flat()
            .map((p) => p.user_id)
            .filter(Boolean),
        );
        set({ onlineUsers: ids });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: userId });
        }
      });

    return () => {
      unsubInterests();
      unsubMatches();
      supabase.removeChannel(presenceChannel);
    };
  },

  getProfileById: (userId) => {
    return get().profileCache[userId];
  },

  clearConversation: (matchId) => {
    set((s) => ({ messages: { ...s.messages, [matchId]: [] } }));
  },

  blockUser: (userId) => {
    useAuthStore.getState().blockUser(userId);
    set((s) => ({
      matches: s.matches.filter((m) => m.matchedUserId !== userId),
      interestRequests: s.interestRequests.filter(
        (r) => r.fromUserId !== userId && r.toUserId !== userId,
      ),
    }));
  },

  broadcastTyping: (matchId) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    void sendMatchBroadcast(matchId, 'typing', userId);
  },

  deleteMessage: async (messageId, matchId) => {
    // Optimistic update
    set((s) => ({
      messages: {
        ...s.messages,
        [matchId]: (s.messages[matchId] ?? []).map((m) =>
          m.id === messageId ? { ...m, deleted: true } : m,
        ),
      },
    }));
    try {
      await softDeleteMessage(messageId);
    } catch (err) {
      console.error('[chatStore] deleteMessage error:', err);
      // Revert optimistic on error
      set((s) => ({
        messages: {
          ...s.messages,
          [matchId]: (s.messages[matchId] ?? []).map((m) =>
            m.id === messageId ? { ...m, deleted: false } : m,
          ),
        },
      }));
      throw err;
    }
  },

  sendMessageWithReply: async (matchId, content, replyToContent) => {
    const senderId = useAuthStore.getState().user?.id;
    if (!senderId) return;

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      matchId,
      senderId,
      content,
      read: false,
      createdAt: new Date(),
      replyToContent,
    };

    set((s) => ({
      messages: { ...s.messages, [matchId]: [...(s.messages[matchId] ?? []), optimistic] },
    }));

    try {
      const dbMsg = await dbSendMessage(matchId, senderId, content, replyToContent);
      const confirmed = dbMessageToChatMessage(dbMsg);
      set((s) => ({
        messages: {
          ...s.messages,
          [matchId]: (s.messages[matchId] ?? []).map((m) =>
            m.id === optimistic.id ? confirmed : m,
          ),
        },
      }));
    } catch (err) {
      console.error('[chatStore] sendMessageWithReply error:', err);
      set((s) => ({
        messages: {
          ...s.messages,
          [matchId]: (s.messages[matchId] ?? []).filter((m) => m.id !== optimistic.id),
        },
      }));
      throw err;
    }
  },

  isUserOnline: (userId) => {
    return get().onlineUsers.has(userId);
  },
}));
