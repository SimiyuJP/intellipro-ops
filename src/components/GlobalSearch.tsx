import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { Project } from '@/types/project';

// ─── Result types ─────────────────────────────────────────────────────────────

type ResultType =
  | 'room'
  | 'deliverable'
  | 'decision'
  | 'person'
  | 'milestone'
  | 'blocker'
  | 'meeting'
  | 'assumption'
  | 'scope';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  meta?: string;
  url: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}

const TYPE_ORDER: ResultType[] = [
  'room', 'person', 'deliverable', 'blocker', 'decision',
  'milestone', 'meeting', 'assumption', 'scope',
];

const TYPE_LABELS: Record<ResultType, string> = {
  room: 'Rooms',
  deliverable: 'Deliverables',
  decision: 'Decisions',
  person: 'People',
  milestone: 'Milestones',
  blocker: 'Blockers',
  meeting: 'Meetings',
  assumption: 'Assumptions',
  scope: 'Scope',
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-health-red bg-health-red/10',
  high: 'text-health-yellow bg-health-yellow/10',
  medium: 'text-muted-foreground bg-secondary',
  low: 'text-muted-foreground bg-secondary',
};

const STATUS_COLOR: Record<string, string> = {
  blocked: 'text-health-red bg-health-red/10',
  in_progress: 'text-health-yellow bg-health-yellow/10',
  done: 'text-health-green bg-health-green/10',
  not_started: 'text-muted-foreground bg-secondary',
  broken: 'text-health-red bg-health-red/10',
  at_risk: 'text-health-yellow bg-health-yellow/10',
  overdue: 'text-health-red bg-health-red/10',
  completed: 'text-health-green bg-health-green/10',
  critical: 'text-health-red bg-health-red/10',
  high: 'text-health-yellow bg-health-yellow/10',
  active: 'text-primary bg-primary/10',
};

// ─── Indexing ─────────────────────────────────────────────────────────────────

function buildIndex(project: Project): SearchResult[] {
  const results: SearchResult[] = [];

  // Rooms
  project.rooms.forEach(room => {
    results.push({
      id: `room-${room.id}`,
      type: 'room',
      title: `${room.icon} ${room.name}`,
      subtitle: room.objective,
      meta: `${room.healthStatus.toUpperCase()} · ${room.healthScore}%`,
      url: '/rooms',
      icon: room.icon,
      badge: room.healthStatus.toUpperCase(),
      badgeColor: STATUS_COLOR[room.healthStatus] ?? '',
    });
  });

  // Deliverables (from rooms)
  const allDeliverables = project.rooms.flatMap(r =>
    r.deliverables.map(d => ({ ...d, roomName: r.name, roomIcon: r.icon }))
  );
  allDeliverables.forEach(d => {
    const statusLabel = d.status.replace('_', ' ');
    results.push({
      id: `del-${d.id}`,
      type: 'deliverable',
      title: d.title,
      subtitle: `${d.owner} · ${d.roomIcon} ${d.roomName} · Due ${d.dueDate}`,
      meta: d.description,
      url: '/rooms',
      icon: d.status === 'done' ? '✅' : d.status === 'blocked' ? '🔴' : d.status === 'in_progress' ? '🟡' : '⚪',
      badge: statusLabel,
      badgeColor: STATUS_COLOR[d.status] ?? '',
    });
  });

  // Team members
  project.teamMembers.forEach(tm => {
    const memberRooms = tm.roomIds.map(id => project.rooms.find(r => r.id === id)?.name).filter(Boolean).join(', ');
    results.push({
      id: `person-${tm.id}`,
      type: 'person',
      title: tm.name,
      subtitle: `${tm.role} · ${memberRooms || 'No rooms assigned'}`,
      meta: tm.lastUpdate ? `Last update: ${tm.lastUpdate}` : 'Never updated',
      url: '/people',
      icon: '👤',
    });
  });

  // Decisions
  project.decisions.forEach(d => {
    const room = project.rooms.find(r => r.id === d.roomId);
    results.push({
      id: `dec-${d.id}`,
      type: 'decision',
      title: d.title,
      subtitle: `${d.decidedBy} · ${room ? `${room.icon} ${room.name}` : ''} · ${d.date}`,
      meta: d.description,
      url: '/decisions',
      icon: '⚖',
      badge: d.status.toUpperCase(),
      badgeColor: d.status === 'active' ? STATUS_COLOR.active : STATUS_COLOR.completed ?? '',
    });
  });

  // Milestones
  project.milestones.forEach(m => {
    const room = project.rooms.find(r => r.id === m.roomId);
    results.push({
      id: `mil-${m.id}`,
      type: 'milestone',
      title: m.title,
      subtitle: `${room ? `${room.icon} ${room.name}` : ''} · Due ${m.dueDate}`,
      url: '/visibility',
      icon: '🎯',
      badge: m.status.replace('_', ' ').toUpperCase(),
      badgeColor: STATUS_COLOR[m.status] ?? '',
    });
  });

  // Blockers
  project.blockers.forEach(b => {
    const room = project.rooms.find(r => r.id === b.roomId);
    results.push({
      id: `blk-${b.id}`,
      type: 'blocker',
      title: b.title,
      subtitle: `${b.owner} · ${room ? `${room.icon} ${room.name}` : ''} · Since ${b.createdAt}`,
      meta: b.description,
      url: '/alerts',
      icon: '🔴',
      badge: b.severity.toUpperCase(),
      badgeColor: STATUS_COLOR[b.severity] ?? '',
    });
  });

  // Meetings
  project.meetings.forEach(m => {
    results.push({
      id: `mtg-${m.id}`,
      type: 'meeting',
      title: m.title,
      subtitle: `${m.date} · ${(m.attendees ?? []).slice(0, 3).join(', ')}${(m.attendees ?? []).length > 3 ? ` +${(m.attendees ?? []).length - 3}` : ''}`,
      meta: m.minutes ?? '',
      url: '/meetings',
      icon: '📅',
    });
  });

  // Assumptions
  const assumptions = project.intelligence?.assumptions ?? [];
  assumptions.forEach(a => {
    results.push({
      id: `asm-${a.id}`,
      type: 'assumption',
      title: a.statement,
      subtitle: `${a.owner} · ${a.category} · ${a.confidence}% confidence`,
      meta: a.impactDescription,
      url: '/intelligence',
      icon: '🧪',
      badge: a.status.toUpperCase(),
      badgeColor: STATUS_COLOR[a.status] ?? '',
    });
  });

  // Scope changes
  project.scopeChanges.forEach(s => {
    results.push({
      id: `sc-${s.id}`,
      type: 'scope',
      title: s.description,
      subtitle: `${s.type.toUpperCase()} · ${s.addedBy} · ${s.date}`,
      meta: s.hasTradeoff ? `Tradeoff: ${s.tradeoffNote}` : '⚠️ No tradeoff documented',
      url: '/memory',
      icon: s.type === 'added' ? '+' : s.type === 'removed' ? '−' : '~',
      badge: s.hasTradeoff ? 'HAS TRADEOFF' : 'NO TRADEOFF',
      badgeColor: s.hasTradeoff ? STATUS_COLOR.completed : STATUS_COLOR.blocked,
    });
  });

  return results;
}

// ─── Fuzzy match ──────────────────────────────────────────────────────────────

function score(result: SearchResult, query: string): number {
  const q = query.toLowerCase();
  const fields = [
    result.title.toLowerCase(),
    result.subtitle.toLowerCase(),
    result.meta?.toLowerCase() ?? '',
    result.type,
  ];

  let s = 0;
  if (fields[0].startsWith(q)) s += 100;
  if (fields[0].includes(q)) s += 60;
  if (fields[1].includes(q)) s += 30;
  if (fields[2].includes(q)) s += 10;
  if (result.badge?.toLowerCase().includes(q)) s += 20;
  // Boost exact word matches
  const words = q.split(' ').filter(Boolean);
  words.forEach(w => {
    if (fields[0].includes(w)) s += 5;
    if (fields[1].includes(w)) s += 2;
  });
  return s;
}

function search(index: SearchResult[], query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return index
    .map(r => ({ result: r, score: score(r, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ result }) => result)
    .slice(0, 20);
}

// ─── Highlight ────────────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-primary/20 text-primary rounded-sm">{part}</mark>
          : part
      )}
    </>
  );
}

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({
  result,
  query,
  isActive,
  onClick,
}: {
  result: SearchResult;
  query: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      data-testid={`search-result-${result.id}`}
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-secondary/40'}`}
    >
      <span className="text-base mt-0.5 flex-shrink-0 w-5 text-center">{result.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">
            <Highlight text={result.title} query={query} />
          </span>
          {result.badge && (
            <span className={`text-[9px] font-display px-1.5 py-0.5 rounded flex-shrink-0 ${result.badgeColor ?? 'bg-secondary text-muted-foreground'}`}>
              {result.badge}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          <Highlight text={result.subtitle} query={query} />
        </div>
      </div>
      {isActive && (
        <div className="flex-shrink-0 text-[10px] text-muted-foreground mt-1 font-display">↵</div>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

function GlobalSearchModal({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const index = activeProject ? buildIndex(activeProject) : [];

  // Recent commands as default suggestions when empty
  const defaultSuggestions: SearchResult[] = [
    { id: 'quick-status', type: 'room', title: 'Project Status', subtitle: 'Overview of health, blockers, and progress', url: '/about', icon: '▦' },
    { id: 'quick-people', type: 'person', title: 'People', subtitle: 'Team directory, workload, silence detection', url: '/people', icon: '👤' },
    { id: 'quick-rooms', type: 'room', title: 'Rooms', subtitle: 'All workstreams and their deliverables', url: '/rooms', icon: '⬡' },
    { id: 'quick-alerts', type: 'blocker', title: 'Alerts & Blockers', subtitle: 'Critical issues and red flags', url: '/alerts', icon: '🚩' },
    { id: 'quick-intelligence', type: 'assumption', title: 'Intelligence Layer', subtitle: 'Signals, assumptions, drift analysis', url: '/intelligence', icon: '🧠' },
    { id: 'quick-report', type: 'milestone', title: 'Status Report', subtitle: 'CEO / Sponsor / Tech Lead reports', url: '/report', icon: '📄' },
    { id: 'quick-chat', type: 'decision', title: 'Command Interface', subtitle: 'Ask anything about your project', url: '/chat', icon: '▸' },
    { id: 'quick-decisions', type: 'decision', title: 'Decision Log', subtitle: 'Why we chose what we chose', url: '/decisions', icon: '⚖' },
  ];

  const results = query.trim() ? search(index, query) : defaultSuggestions;

  // Group results by type (only when searching)
  const grouped: { type: ResultType; items: SearchResult[] }[] = [];
  if (query.trim()) {
    TYPE_ORDER.forEach(type => {
      const items = results.filter(r => r.type === type);
      if (items.length > 0) grouped.push({ type, items });
    });
  }

  // Flat list for keyboard nav
  const flatResults = query.trim() ? results : defaultSuggestions;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.url);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[activeIndex]) handleSelect(flatResults[activeIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [flatResults, activeIndex, handleSelect, onClose]);

  if (!open) return null;

  const renderResults = () => {
    if (query.trim() && results.length === 0) {
      return (
        <div className="px-4 py-8 text-center">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-sm text-muted-foreground">No results for "<span className="text-foreground">{query}</span>"</div>
          <div className="text-xs text-muted-foreground mt-1">Try a deliverable name, person, decision, or room</div>
        </div>
      );
    }

    if (query.trim() && grouped.length > 0) {
      let runningIndex = 0;
      return grouped.map(({ type, items }) => {
        const groupStart = runningIndex;
        runningIndex += items.length;
        return (
          <div key={type}>
            <div className="px-4 py-1.5 text-[10px] font-display text-muted-foreground/50 uppercase tracking-widest bg-secondary/30 border-b border-border/30">
              {TYPE_LABELS[type]} ({items.length})
            </div>
            {items.map((result, i) => (
              <ResultRow
                key={result.id}
                result={result}
                query={query}
                isActive={groupStart + i === activeIndex}
                onClick={() => handleSelect(result)}
              />
            ))}
          </div>
        );
      });
    }

    // Default suggestions
    return (
      <div>
        <div className="px-4 py-1.5 text-[10px] font-display text-muted-foreground/50 uppercase tracking-widest bg-secondary/30 border-b border-border/30">
          Quick Navigation
        </div>
        {defaultSuggestions.map((result, i) => (
          <ResultRow
            key={result.id}
            result={result}
            query={query}
            isActive={i === activeIndex}
            onClick={() => handleSelect(result)}
          />
        ))}
      </div>
    );
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[101] w-full max-w-2xl px-4">
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <span className="text-muted-foreground text-sm">🔍</span>
            <input
              ref={inputRef}
              data-testid="global-search-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeProject ? `Search in ${activeProject.name}…` : 'Search…'}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
            <kbd className="hidden sm:flex text-[10px] font-display text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {!activeProject ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No active project. Select one from the sidebar.
              </div>
            ) : (
              renderResults()
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-secondary/20">
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-display">
              <span><kbd className="bg-secondary px-1 py-0.5 rounded border border-border text-[9px]">↑↓</kbd> navigate</span>
              <span><kbd className="bg-secondary px-1 py-0.5 rounded border border-border text-[9px]">↵</kbd> open</span>
              <span><kbd className="bg-secondary px-1 py-0.5 rounded border border-border text-[9px]">ESC</kbd> close</span>
            </div>
            {query.trim() && (
              <div className="text-[10px] text-muted-foreground font-display">
                {results.length} result{results.length !== 1 ? 's' : ''}
                {activeProject ? ` in ${activeProject.name}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Exported hook + trigger ──────────────────────────────────────────────────

export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen };
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  return <GlobalSearchModal open={open} onClose={onClose} />;
}
