import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ConversationWithMeta,
  Message,
  MessageAttachment,
  Profile,
  getAttachmentUrl,
  markConversationRead,
  sendMessage,
  uploadChatFile,
  useMessages,
  useProfiles,
} from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, X } from 'lucide-react';

interface Props {
  conversation: ConversationWithMeta;
}

export function MessageThread({ conversation }: Props) {
  const { user } = useAuth();
  const { messages, loading, typingUsers, sendTyping } = useMessages(conversation.id);
  const { profiles } = useProfiles();
  const [input, setInput] = useState('');
  const [pending, setPending] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const otherMembers = conversation.members.filter((m) => m.user_id !== user?.id);
  const title =
    conversation.type === 'group'
      ? conversation.name ?? 'Group'
      : otherMembers[0]?.profile?.display_name ?? 'Direct message';
  const subtitle =
    conversation.type === 'group'
      ? `${conversation.members.length} members`
      : 'Direct message';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typingUsers.length]);

  useEffect(() => {
    if (user && conversation.id) {
      markConversationRead(conversation.id, user.id);
    }
  }, [user, conversation.id, messages.length]);

  const handleInputChange = (val: string) => {
    setInput(val);
    sendTyping();

    // detect @mention
    const cursor = textareaRef.current?.selectionStart ?? val.length;
    const upToCursor = val.slice(0, cursor);
    const match = upToCursor.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (p: Profile) => {
    const cursor = textareaRef.current?.selectionStart ?? input.length;
    const before = input.slice(0, cursor).replace(/@\w*$/, `@${p.display_name} `);
    const after = input.slice(cursor);
    setInput(before + after);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    if (!user) return;
    const body = input.trim();
    if (!body && pending.length === 0) return;

    setSending(true);
    const attachments: MessageAttachment[] = [];
    for (const file of pending) {
      const att = await uploadChatFile(conversation.id, user.id, file);
      if (att) attachments.push(att);
    }

    // Resolve @mentions
    const mentionIds: string[] = [];
    const mentionRegex = /@(\w[\w\s]*?)(?=\s|$)/g;
    let m: RegExpExecArray | null;
    while ((m = mentionRegex.exec(body)) !== null) {
      const name = m[1].trim();
      const profile = conversation.members
        .map((cm) => cm.profile)
        .find((p) => p && p.display_name === name);
      if (profile) mentionIds.push(profile.id);
    }

    await sendMessage(conversation.id, user.id, body, attachments, mentionIds);
    setInput('');
    setPending([]);
    setSending(false);
  };

  const mentionCandidates = conversation.members
    .map((cm) => cm.profile)
    .filter((p): p is Profile => !!p && p.id !== user?.id)
    .filter((p) => (p.display_name ?? '').toLowerCase().includes(mentionQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-display text-primary">
            {conversation.type === 'group' ? '#' : (title ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display font-bold text-sm">{title}</h2>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-xs text-muted-foreground py-10">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-10">No messages yet. Say hi 👋</div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.sender_id === user?.id}
              sender={profileMap.get(msg.sender_id) ?? null}
              showSender={
                conversation.type === 'group' &&
                msg.sender_id !== user?.id &&
                (i === 0 || messages[i - 1].sender_id !== msg.sender_id)
              }
            />
          ))
        )}
        {typingUsers.length > 0 && (
          <div className="text-xs text-muted-foreground italic">
            {typingUsers.map((id) => profileMap.get(id)?.display_name ?? 'Someone').join(', ')}{' '}
            {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 shrink-0 relative">
        {showMentions && mentionCandidates.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
            {mentionCandidates.map((p) => (
              <button
                key={p.id}
                onClick={() => insertMention(p)}
                className="w-full flex items-center gap-2 p-2 hover:bg-secondary/60 text-left text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-display text-primary">
                  {(p.display_name ?? '?').slice(0, 2).toUpperCase()}
                </div>
                {p.display_name}
              </button>
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pending.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-secondary/60 px-2 py-1 rounded text-xs">
                <span className="truncate max-w-[150px]">📎 {f.name}</span>
                <button onClick={() => setPending((p) => p.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <label className="cursor-pointer p-2 rounded-md hover:bg-secondary/60 transition-colors">
            <Paperclip className="w-4 h-4 text-muted-foreground" />
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setPending((prev) => [...prev, ...files]);
                e.target.value = '';
              }}
            />
          </label>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message… use @ to mention"
            rows={1}
            className="flex-1 resize-none bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 max-h-32"
          />
          <Button onClick={handleSend} disabled={sending || (!input.trim() && pending.length === 0)} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  isOwn,
  sender,
  showSender,
}: {
  msg: Message;
  isOwn: boolean;
  sender: Profile | null;
  showSender: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {showSender && (
          <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">
            {sender?.display_name ?? 'Unknown'}
          </span>
        )}
        <div
          className={`px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${
            isOwn
              ? 'bg-primary/20 border border-primary/30 rounded-br-sm'
              : 'bg-secondary/60 border border-border rounded-bl-sm'
          }`}
        >
          {msg.body && <div>{renderBodyWithMentions(msg.body)}</div>}
          {msg.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {msg.attachments.map((a, i) => (
                <AttachmentPreview key={i} attachment={a} />
              ))}
            </div>
          )}
        </div>
        <span className="text-[9px] text-muted-foreground mt-0.5 mx-1">
          {format(new Date(msg.created_at), 'HH:mm')}
          {msg.edited_at && ' · edited'}
        </span>
      </div>
    </motion.div>
  );
}

function renderBodyWithMentions(body: string) {
  const parts = body.split(/(@\w[\w\s]*?(?=\s|$))/g);
  return parts.map((p, i) =>
    p.startsWith('@') ? (
      <span key={i} className="text-primary font-medium">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function AttachmentPreview({ attachment }: { attachment: MessageAttachment }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    getAttachmentUrl(attachment.path).then(({ data }) => {
      if (data) setUrl(data.signedUrl);
    });
  }, [attachment.path]);

  if (!url) return <div className="text-xs text-muted-foreground">Loading {attachment.name}…</div>;

  if (attachment.type.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={attachment.name} className="max-h-48 rounded border border-border" />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-xs text-primary hover:underline"
    >
      📎 {attachment.name}
    </a>
  );
}
