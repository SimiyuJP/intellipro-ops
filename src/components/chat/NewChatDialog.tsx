import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProfiles, createDM, createGroup } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewChatDialog({ open, onOpenChange }: NewChatDialogProps) {
  const { user } = useAuth();
  const { profiles } = useProfiles();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const otherProfiles = profiles.filter((p) => p.id !== user?.id);
  const filtered = otherProfiles.filter((p) =>
    (p.display_name ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const startDM = async (otherId: string) => {
    if (!user) return;
    setLoading(true);
    const id = await createDM(user.id, otherId);
    setLoading(false);
    if (id) {
      onOpenChange(false);
      navigate(`/chat/${id}`);
    }
  };

  const startGroup = async () => {
    if (!user || !groupName.trim() || selected.length === 0) return;
    setLoading(true);
    const id = await createGroup(user.id, groupName.trim(), selected);
    setLoading(false);
    if (id) {
      onOpenChange(false);
      setGroupName('');
      setSelected([]);
      navigate(`/chat/${id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Start a new chat</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="dm">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="dm">Direct Message</TabsTrigger>
            <TabsTrigger value="group">Group</TabsTrigger>
          </TabsList>
          <TabsContent value="dm" className="space-y-3 mt-4">
            <Input placeholder="Search people…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-72 overflow-y-auto space-y-1">
              {filtered.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">No people found</div>
              )}
              {filtered.map((p) => (
                <button
                  key={p.id}
                  disabled={loading}
                  onClick={() => startDM(p.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-secondary/60 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-display text-primary">
                    {(p.display_name ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm">{p.display_name ?? 'Unnamed'}</span>
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="group" className="space-y-3 mt-4">
            <Input placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            <Input placeholder="Search people…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-56 overflow-y-auto space-y-1">
              {filtered.map((p) => {
                const isSel = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      setSelected((prev) => (isSel ? prev.filter((id) => id !== p.id) : [...prev, p.id]))
                    }
                    className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
                      isSel ? 'bg-primary/15 border border-primary/30' : 'hover:bg-secondary/60'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-display text-primary">
                      {(p.display_name ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm flex-1">{p.display_name ?? 'Unnamed'}</span>
                    {isSel && <span className="text-primary text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
            <Button
              className="w-full"
              onClick={startGroup}
              disabled={loading || !groupName.trim() || selected.length === 0}
            >
              Create group ({selected.length} {selected.length === 1 ? 'member' : 'members'})
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
