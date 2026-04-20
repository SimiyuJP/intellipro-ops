import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageThread } from '@/components/chat/MessageThread';
import { NewChatDialog } from '@/components/chat/NewChatDialog';
import { useConversations } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const { conversationId } = useParams();
  const { conversations, loading } = useConversations();
  const [newOpen, setNewOpen] = useState(false);

  const active = conversations.find((c) => c.id === conversationId) ?? null;

  return (
    <AppLayout>
      <div className="flex h-screen">
        {/* Conversation list */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-sm">Messages</h1>
              <p className="text-[11px] text-muted-foreground">
                {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
              </p>
            </div>
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus className="w-4 h-4" />
              New
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList conversations={conversations} loading={loading} />
          </div>
        </div>

        {/* Active thread */}
        <div className="flex-1 min-w-0">
          {active ? (
            <MessageThread conversation={active} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="w-12 h-12 opacity-30" />
              <div className="text-sm">Select a conversation or start a new one</div>
              <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>
                <Plus className="w-4 h-4" />
                New chat
              </Button>
            </div>
          )}
        </div>

        <NewChatDialog open={newOpen} onOpenChange={setNewOpen} />
      </div>
    </AppLayout>
  );
}
