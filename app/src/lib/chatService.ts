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

  if (error) throw error;
  return data;
}

export async function respondToInterestRequest(
  requestId: string,
  status: 'accepted' | 'declined',
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
 * Creates a match between two users.
 * Enforces canonical ordering (smaller UUID first) to satisfy the table constraint.
 */
export async function createMatch(userA: string, userB: string): Promise<DbMatch> {
  const [user1_id, user2_id] = [userA, userB].sort();

  const { data, error } = await supabase
    .from('matches')
    .upsert({ user1_id, user2_id }, { onConflict: 'user1_id,user2_id' })
    .select()
    .single();

  if (error) throw error;
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
