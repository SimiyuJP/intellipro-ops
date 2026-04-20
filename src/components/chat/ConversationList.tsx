import { useNavigate, useParams } from 'react-router-dom';
import { ConversationWithMeta } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNowStrict } from 'date-fns';

interface Props {
  conversations: ConversationWithMeta[];
  loading: boolean;
}

export function ConversationList({ conversations, loading }: Props) {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();

  if (loading) {
    return <div className="p-4 text-xs text-muted-foreground">Loading conversations…</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        No chats yet. Click “New” to start one.
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {conversations.map((c) => {
        const isActive = c.id === conversationId;
        const otherMembers = c.members.filter((m) => m.user_id !== user?.id);
        const title =
          c.type === 'group'
            ? c.name ?? 'Group'
            : otherMembers[0]?.profile?.display_name ?? 'Direct message';
        const initials = (title ?? '?').slice(0, 2).toUpperCase();
        const preview = c.last_message?.body ?? (c.last_message?.attachments.length ? '📎 Attachment' : 'No messages yet');

        return (
          <button
            key={c.id}
            onClick={() => navigate(`/chat/${c.id}`)}
            className={`w-full flex items-start gap-3 p-2.5 rounded-md text-left transition-colors ${
              isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/60'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-display text-primary shrink-0">
              {c.type === 'group' ? '#' : initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNowStrict(new Date(c.last_message_at), { addSuffix: false })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground truncate">{preview}</span>
                {c.unread_count > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-display px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {c.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
