import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DbInterestRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface DbMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface DbMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  deleted?: boolean;
  reply_to_content?: string;
}

function getChatErrorMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
  const detail =
    typeof error === 'object' && error && 'details' in error && typeof error.details === 'string'
      ? error.details
      : '';
  const code =
    typeof error === 'object' && error && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';

  if (message.includes('INTEREST_REQUEST_RATE_LIMIT')) {
    return detail || 'You have reached the limit of 20 interest requests in 24 hours. Please try again later.';
  }

  if (code === '23505' || message.toLowerCase().includes('duplicate key value')) {
    return 'You already sent this person an interest request.';
  }

  if (
    message.toLowerCase().includes('row-level security') ||
    message.toLowerCase().includes('permission denied')
  ) {
    return 'This profile is no longer available.';
  }

  if (message.toLowerCase().includes('invalid jwt')) {
    return 'We could not verify your session. Please sign in again and retry.';
  }

  return detail || message || 'Something went wrong. Please try again.';
}

// ─── Interest Requests ────────────────────────────────────────────────────────

export async function fetchInterestRequests(userId: string): Promise<DbInterestRequest[]> {
  const { data, error } = await supabase
    .from('interest_requests')
    .select('*')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function sendInterestRequest(
  fromUserId: string,
  toUserId: string,
  message: string,
): Promise<DbInterestRequest> {
  const { data, error } = await supabase
    .from('interest_requests')
    .insert({ from_user_id: fromUserId, to_user_id: toUserId, message })
    .select()
    .single();

  if (error) throw new Error(getChatErrorMessage(error));
  return data;
}

export async function respondToInterestRequest(
  requestId: string,
  status: 'pending' | 'accepted' | 'declined',
): Promise<DbInterestRequest> {
  const { data, error } = await supabase
    .from('interest_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function fetchMatches(userId: string): Promise<DbMatch[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Creates a match from an accepted interest request through the secured Edge Function.
 */
export async function createMatch(interestRequestId: string): Promise<DbMatch> {
  const { data, error } = await supabase.functions.invoke<DbMatch>('create-match', {
    body: { interestRequestId },
  });

  if (error) {
    let message = error.message?.trim();

    const responseContext =
      typeof error === 'object' && error && 'context' in error ? error.context : null;

    if (responseContext instanceof Response) {
      const payload = await responseContext
        .clone()
        .json()
        .catch(async () => {
          const text = await responseContext.clone().text().catch(() => '');
          return text ? { message: text } : null;
        });

      if (payload && typeof payload === 'object') {
        if ('error' in payload && typeof payload.error === 'string' && payload.error.trim()) {
          message = payload.error.trim();
        } else if ('message' in payload && typeof payload.message === 'string' && payload.message.trim()) {
          message = payload.message.trim();
        }
      }
    }

    if (message?.toLowerCase().includes('invalid jwt')) {
      throw new Error('We could not verify your session. Please sign in again and retry.');
    }

    throw new Error(message || 'We could not create the match right now.');
  }

  if (!data) {
    throw new Error('We could not create the match right now.');
  }

  return data;
}

export function getOtherUserId(match: DbMatch, currentUserId: string): string {
  return match.user1_id === currentUserId ? match.user2_id : match.user1_id;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function fetchMessages(matchId: string): Promise<DbMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string,
  replyToContent?: string,
): Promise<DbMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, content, reply_to_content: replyToContent ?? null })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function softDeleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ deleted: true })
    .eq('id', messageId);

  if (error) throw error;
}

// ─── Dismissed Profiles ───────────────────────────────────────────────────────

export async function fetchDismissedProfileIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('dismissed_profiles')
    .select('dismissed_user_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(getChatErrorMessage(error));
  return data?.map((row) => row.dismissed_user_id) ?? [];
}

export async function saveDismissedProfiles(userId: string, dismissedUserIds: string[]): Promise<void> {
  const uniqueDismissedUserIds = [...new Set(dismissedUserIds)]
    .map((dismissedUserId) => dismissedUserId.trim())
    .filter((dismissedUserId) => dismissedUserId && dismissedUserId !== userId);

  if (uniqueDismissedUserIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('dismissed_profiles')
    .upsert(
      uniqueDismissedUserIds.map((dismissed_user_id) => ({
        user_id: userId,
        dismissed_user_id,
      })),
      {
        onConflict: 'user_id,dismissed_user_id',
        // Discover can mount twice in development/StrictMode. Ignore duplicate inserts
        // so the second request does not attempt an UPDATE that RLS could reject.
        ignoreDuplicates: true,
      },
    );

  if (error) throw new Error(getChatErrorMessage(error));
}

export async function markMessagesRead(matchId: string, currentUserId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('match_id', matchId)
    .neq('sender_id', currentUserId)
    .eq('read', false);

  if (error) throw error;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to new messages in a specific match.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  matchId: string,
  onInsert: (message: DbMessage) => void,
  onUpdate: (message: DbMessage) => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        onInsert(payload.new as DbMessage);
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        onUpdate(payload.new as DbMessage);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to new/updated interest requests for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToInterestRequests(
  userId: string,
  onUpdate: () => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`interest_requests:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'interest_requests',
        filter: `to_user_id=eq.${userId}`,
      },
      () => onUpdate(),
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'interest_requests',
        filter: `from_user_id=eq.${userId}`,
      },
      () => onUpdate(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to new matches for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToMatches(
  userId: string,
  onUpdate: () => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`matches:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user1_id=eq.${userId}`,
      },
      () => onUpdate(),
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user2_id=eq.${userId}`,
      },
      () => onUpdate(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
