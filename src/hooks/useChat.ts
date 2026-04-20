import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_seen_at: string;
}

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name: string | null;
  created_by: string;
  last_message_at: string;
  created_at: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  last_read_at: string;
  joined_at: string;
}

export interface MessageAttachment {
  path: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachments: MessageAttachment[];
  mentions: string[];
  edited_at: string | null;
  created_at: string;
}

export interface ConversationWithMeta extends Conversation {
  members: (ConversationMember & { profile: Profile | null })[];
  unread_count: number;
  last_message?: Message;
}

// ---------- PROFILES ----------
export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.from('profiles').select('*').order('display_name').then(({ data }) => {
      if (mounted && data) setProfiles(data as Profile[]);
      if (mounted) setLoading(false);
    });

    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProfiles((prev) => [...prev, payload.new as Profile]);
        } else if (payload.eventType === 'UPDATE') {
          setProfiles((prev) => prev.map((p) => (p.id === (payload.new as Profile).id ? (payload.new as Profile) : p)));
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { profiles, loading };
}

// ---------- CONVERSATIONS ----------
export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;

    // Get all conversations user is in
    const { data: memberRows } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    if (!memberRows || memberRows.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = memberRows.map((m) => m.conversation_id);
    const lastReadMap = new Map(memberRows.map((m) => [m.conversation_id, m.last_read_at]));

    const [{ data: convs }, { data: allMembers }, { data: profiles }, { data: lastMessages }, { data: unreadMessages }] =
      await Promise.all([
        supabase.from('conversations').select('*').in('id', convIds).order('last_message_at', { ascending: false }),
        supabase.from('conversation_members').select('*').in('conversation_id', convIds),
        supabase.from('profiles').select('*'),
        supabase
          .from('messages')
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
          .limit(convIds.length * 5),
        supabase.from('messages').select('conversation_id, created_at, sender_id').in('conversation_id', convIds),
      ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
    const lastMsgMap = new Map<string, Message>();
    (lastMessages ?? []).forEach((m) => {
      const msg = m as unknown as Message;
      if (!lastMsgMap.has(msg.conversation_id)) lastMsgMap.set(msg.conversation_id, msg);
    });

    const unreadMap = new Map<string, number>();
    (unreadMessages ?? []).forEach((m: any) => {
      const lr = lastReadMap.get(m.conversation_id);
      if (m.sender_id !== user.id && lr && new Date(m.created_at) > new Date(lr)) {
        unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) ?? 0) + 1);
      }
    });

    const result: ConversationWithMeta[] = (convs ?? []).map((c) => {
      const mem = (allMembers ?? [])
        .filter((m) => m.conversation_id === c.id)
        .map((m) => ({ ...(m as ConversationMember), profile: profileMap.get(m.user_id) ?? null }));
      return {
        ...(c as Conversation),
        members: mem,
        unread_count: unreadMap.get(c.id) ?? 0,
        last_message: lastMsgMap.get(c.id),
      };
    });

    setConversations(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: refresh on any change to conversations / members / messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user-conversations-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return { conversations, loading, reload: load };
}

// ---------- MESSAGES (single conversation) ----------
export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (data) setMessages(data as unknown as Message[]);
        setLoading(false);
      });

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => {
            const newMsg = payload.new as unknown as Message;
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => prev.map((m) => (m.id === (payload.new as any).id ? (payload.new as unknown as Message) : m)));
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
        },
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!user || payload.user_id === user.id) return;
        setTypingUsers((prev) => (prev.includes(payload.user_id) ? prev : [...prev, payload.user_id]));
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== payload.user_id));
        }, 3000);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user]);

  const sendTyping = useCallback(() => {
    if (!user || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id },
    });
  }, [user]);

  return { messages, loading, typingUsers, sendTyping };
}

// ---------- ACTIONS ----------
export async function markConversationRead(conversationId: string, userId: string) {
  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
  attachments: MessageAttachment[] = [],
  mentions: string[] = [],
) {
  return supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body,
    attachments: attachments as any,
    mentions,
  });
}

export async function createDM(currentUserId: string, otherUserId: string): Promise<string | null> {
  // Check if a DM already exists between these two users
  const { data: existing } = await supabase
    .from('conversation_members')
    .select('conversation_id, conversations!inner(type)')
    .eq('user_id', currentUserId);

  if (existing) {
    for (const row of existing as any[]) {
      if (row.conversations.type !== 'dm') continue;
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', row.conversation_id);
      if (members?.length === 2 && members.some((m: any) => m.user_id === otherUserId)) {
        return row.conversation_id;
      }
    }
  }

  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ type: 'dm', created_by: currentUserId })
    .select()
    .single();
  if (error || !conv) return null;

  await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, user_id: currentUserId },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);

  return conv.id;
}

export async function createGroup(currentUserId: string, name: string, memberIds: string[]): Promise<string | null> {
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ type: 'group', name, created_by: currentUserId })
    .select()
    .single();
  if (error || !conv) return null;

  const allMembers = Array.from(new Set([currentUserId, ...memberIds]));
  await supabase.from('conversation_members').insert(
    allMembers.map((uid) => ({
      conversation_id: conv.id,
      user_id: uid,
      role: uid === currentUserId ? 'admin' : 'member',
    })),
  );

  return conv.id;
}

export async function uploadChatFile(conversationId: string, userId: string, file: File): Promise<MessageAttachment | null> {
  const path = `${conversationId}/${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
  if (error) return null;
  return { path, name: file.name, type: file.type, size: file.size };
}

export function getAttachmentUrl(path: string) {
  return supabase.storage.from('chat-attachments').createSignedUrl(path, 3600);
}
