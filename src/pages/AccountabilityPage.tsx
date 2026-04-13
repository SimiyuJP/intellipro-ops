import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { Commitment } from '@/types/project';

// ─── Silence Detector ─────────────────────────────────────────────────────────

const TODAY = '2026-04-13';

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = new Date(TODAY).getTime();
  return Math.max(0, Math.round((now - then) / 86400000));
}

function SilenceDetector() {
  const { activeProject } = useProject();
  if (!activeProject) return null;

  // Room silence
  const roomSilence = activeProject.rooms.map(r => {
    const updates = r.updates;
    const lastUpdate = updates.length > 0
      ? updates.reduce((latest, u) => u.createdAt > latest ? u.createdAt : latest, updates[0].createdAt)
      : null;
    const days = lastUpdate ? daysSince(lastUpdate) : 99;
    const lastBlocker = r.blockers.length > 0 ? r.blockers[r.blockers.length - 1] : null;
    return { room: r, days, lastUpdate, lastBlocker };
  }).sort((a, b) => b.days - a.days);

  // Person silence
  const personSilence = activeProject.teamMembers.map(tm => {
    const days = tm.lastUpdate ? daysSince(tm.lastUpdate) : 99;
    const memberRooms = activeProject.rooms.filter(r => r.id && tm.roomIds.includes(r.id));
    const deliverables = memberRooms.flatMap(r => r.deliverables).filter(d => d.owner === tm.name);
    const criticalInProgress = deliverables.filter(d => d.priority === 'critical' && d.status === 'in_progress');
    return { tm, days, deliverables, criticalInProgress };
  }).sort((a, b) => b.days - a.days);

  const silentRooms = roomSilence.filter(r => r.days >= 3);
  const silentPeople = personSilence.filter(p => p.days >= 3);

  function SilenceBadge({ days }: { days: number }) {
    if (days >= 7) return <span className="text-[10px] font-display px-1.5 py-0.5 rounded bg-health-red/15 text-health-red uppercase">🔴 {days}d silent</span>;
    if (days >= 3) return <span className="text-[10px] font-display px-1.5 py-0.5 rounded bg-health-yellow/15 text-health-yellow uppercase">🟡 {days}d silent</span>;
    return <span className="text-[10px] font-display px-1.5 py-0.5 rounded bg-health-green/15 text-health-green uppercase">✅ Active</span>;
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground font-display mb-1">SILENT ROOMS</div>
          <div className={`text-3xl font-display font-bold ${silentRooms.length > 2 ? 'text-health-red' : silentRooms.length > 0 ? 'text-health-yellow' : 'text-health-green'}`}>
            {silentRooms.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">no update in 3+ days</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground font-display mb-1">SILENT PEOPLE</div>
          <div className={`text-3xl font-display font-bold ${silentPeople.length > 2 ? 'text-health-red' : silentPeople.length > 0 ? 'text-health-yellow' : 'text-health-green'}`}>
            {silentPeople.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">no update in 3+ days</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground font-display mb-1">MAX SILENCE</div>
          <div className="text-3xl font-display font-bold text-health-red">
            {Math.max(...roomSilence.map(r => r.days))}d
          </div>
          <div className="text-xs text-muted-foreground mt-1">longest gap</div>
        </div>
      </div>

      {/* Room Silence */}
      <div className="glass-card p-5">
        <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">Room Update Status</div>
        <div className="space-y-3">
          {roomSilence.map(({ room, days, lastUpdate, lastBlocker }) => (
            <div key={room.id} className={`p-4 rounded-xl border transition-all ${days >= 7 ? 'border-health-red/30 bg-health-red/5' : days >= 3 ? 'border-health-yellow/30 bg-health-yellow/5' : 'border-border bg-secondary/10'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl flex-shrink-0">{room.icon}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{room.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {lastUpdate ? `Last update: ${lastUpdate}` : 'No updates ever logged'}
                    </div>
                  </div>
                </div>
                <SilenceBadge days={days} />
              </div>
              {lastBlocker && days >= 3 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="text-[10px] font-display text-muted-foreground uppercase tracking-wider mb-1">Last known blocker</div>
                  <div className="text-xs text-foreground">"{lastBlocker.title}"</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Owner: {lastBlocker.owner} · Open since {lastBlocker.createdAt}</div>
                </div>
              )}
              {room.teamMembers.length === 0 && (
                <div className="mt-2 text-xs text-health-red">⚠️ No team members assigned to this room</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Person Silence */}
      <div className="glass-card p-5">
        <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">Team Member Update Status</div>
        <div className="space-y-2">
          {personSilence.map(({ tm, days, criticalInProgress }) => (
            <div key={tm.id} className={`flex items-start gap-4 p-3 rounded-lg border ${days >= 7 ? 'border-health-red/30 bg-health-red/5' : days >= 3 ? 'border-health-yellow/30 bg-health-yellow/5' : 'border-border bg-secondary/10'}`}>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-display font-bold text-primary">
                {tm.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{tm.name}</span>
                  <span className="text-xs text-muted-foreground">{tm.role}</span>
                  {criticalInProgress.length > 0 && (
                    <span className="text-[10px] font-display text-health-red bg-health-red/10 px-1.5 py-0.5 rounded">
                      {criticalInProgress.length} critical in-flight
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {tm.lastUpdate ? `Last update: ${tm.lastUpdate}` : 'Never updated'}
                </div>
              </div>
              <SilenceBadge days={days} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Commitment Tracking ──────────────────────────────────────────────────────

function CommitmentTracking() {
  const { activeProject } = useProject();
  const [filter, setFilter] = useState<'all' | 'pending' | 'missed' | 'delivered'>('all');
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

  const commitments = activeProject?.commitments ?? [];

  const filtered = filter === 'all' ? commitments : commitments.filter(c => c.status === filter);

  const byPerson = useMemo(() => {
    const map: Record<string, Commitment[]> = {};
    commitments.forEach(c => {
      if (!map[c.person]) map[c.person] = [];
      map[c.person].push(c);
    });
    return Object.entries(map).map(([person, cs]) => {
      const delivered = cs.filter(c => c.status === 'delivered').length;
      const missed = cs.filter(c => c.status === 'missed').length;
      const partial = cs.filter(c => c.status === 'partial').length;
      const total = cs.length;
      const ratio = total > 0 ? Math.round(((delivered + partial * 0.5) / total) * 100) : 100;
      return { person, commitments: cs, delivered, missed, partial, pending: cs.filter(c => c.status === 'pending').length, total, ratio };
    }).sort((a, b) => a.ratio - b.ratio);
  }, [commitments]);

  function StatusChip({ status }: { status: Commitment['status'] }) {
    const cfg = {
      delivered: { cls: 'bg-health-green/15 text-health-green', label: '✓ Delivered' },
      missed: { cls: 'bg-health-red/15 text-health-red', label: '✗ Missed' },
      partial: { cls: 'bg-health-yellow/15 text-health-yellow', label: '~ Partial' },
      pending: { cls: 'bg-primary/15 text-primary', label: '… Pending' },
    }[status];
    return <span className={`text-[10px] font-display px-1.5 py-0.5 rounded uppercase ${cfg.cls}`}>{cfg.label}</span>;
  }

  if (!activeProject) return null;

  return (
    <div className="space-y-5">
      {/* Per-person reliability scores */}
      <div className="glass-card p-5">
        <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-1">Reliability Scores — PM Eyes Only</div>
        <div className="text-[10px] text-muted-foreground mb-4">Promise-vs-delivery ratio per person. Not visible to team members.</div>
        <div className="space-y-3">
          {byPerson.map(({ person, ratio, delivered, missed, partial, pending, total, commitments: cs }) => (
            <div key={person}>
              <button
                className="w-full flex items-center gap-4 hover:bg-secondary/20 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => setExpandedPerson(expandedPerson === person ? null : person)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-[10px] font-display font-bold text-primary">
                  {person.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium">{person}</div>
                  <div className="text-xs text-muted-foreground">{delivered}✓ {missed}✗ {partial}~ {pending}… of {total}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-24 bg-secondary/30 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${ratio >= 80 ? 'bg-health-green' : ratio >= 55 ? 'bg-health-yellow' : 'bg-health-red'}`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  <span className={`text-sm font-display font-bold w-10 text-right ${ratio >= 80 ? 'text-health-green' : ratio >= 55 ? 'text-health-yellow' : 'text-health-red'}`}>
                    {ratio}%
                  </span>
                  <span className="text-muted-foreground text-xs">{expandedPerson === person ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedPerson === person && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 ml-12 space-y-2"
                >
                  {cs.map(c => (
                    <div key={c.id} className={`p-3 rounded-lg border text-xs ${c.status === 'missed' ? 'border-health-red/20 bg-health-red/5' : c.status === 'partial' ? 'border-health-yellow/20 bg-health-yellow/5' : c.status === 'delivered' ? 'border-health-green/20 bg-health-green/5' : 'border-border bg-secondary/10'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">"{c.promise}"</div>
                          <div className="text-muted-foreground mt-0.5">Source: {c.source} · Due: {c.dueDate}</div>
                          {c.note && <div className="mt-1 text-muted-foreground italic">PM note: {c.note}</div>}
                        </div>
                        <StatusChip status={c.status} />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All commitments filtered list */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-display text-muted-foreground uppercase tracking-wider">All Commitments</div>
          <div className="flex gap-1">
            {(['all', 'pending', 'missed', 'delivered'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] font-display px-2 py-1 rounded capitalize transition-colors ${filter === f ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map(c => {
            const room = c.roomId ? activeProject.rooms.find(r => r.id === c.roomId) : null;
            const overdueDays = c.status === 'missed' ? daysSince(c.dueDate) : 0;
            return (
              <div key={c.id} className={`p-3 rounded-lg border ${c.status === 'missed' ? 'border-health-red/25 bg-health-red/5' : c.status === 'partial' ? 'border-health-yellow/25 bg-health-yellow/5' : c.status === 'delivered' ? 'border-health-green/20 bg-health-green/5' : 'border-border bg-secondary/10'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 text-[9px] font-display font-bold text-primary mt-0.5">
                    {c.person.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{c.person}</span>
                      {room && <span className="text-xs text-muted-foreground">{room.icon} {room.name}</span>}
                      {overdueDays > 0 && <span className="text-[10px] text-health-red font-display">{overdueDays}d overdue</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">"{c.promise}"</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Promised {c.dueDate} · from {c.source}
                      {c.deliveredAt && ` · Delivered ${c.deliveredAt}`}
                    </div>
                  </div>
                  <StatusChip status={c.status} />
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-6">No commitments with status "{filter}"</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Escalation Triggers ─────────────────────────────────────────────────────

type EscalationItem = {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  type: string;
  title: string;
  description: string;
  daysOpen: number;
  room?: string;
  roomIcon?: string;
  owner?: string;
  action: string;
  escalateTo: string;
};

function EscalationTriggers() {
  const { activeProject } = useProject();
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const escalations = useMemo((): EscalationItem[] => {
    if (!activeProject) return [];
    const items: EscalationItem[] = [];

    // Blockers > 3 days old
    activeProject.blockers.forEach(b => {
      const days = daysSince(b.createdAt);
      if (days >= 3) {
        items.push({
          id: `blocker-${b.id}`,
          severity: days >= 7 ? 'critical' : b.severity === 'critical' ? 'critical' : 'high',
          type: 'Stale Blocker',
          title: b.title,
          description: `Blocker has been open for ${days} days with no resolution. Owner: ${b.owner}.`,
          daysOpen: days,
          room: activeProject.rooms.find(r => r.id === b.roomId)?.name,
          roomIcon: activeProject.rooms.find(r => r.id === b.roomId)?.icon,
          owner: b.owner,
          action: days >= 7
            ? 'Escalate immediately to project sponsor. Bring in contractor or reassign.'
            : 'Schedule urgent 1:1 with owner. Set 24h hard deadline for resolution.',
          escalateTo: 'Project Sponsor',
        });
      }
    });

    // Critical deliverables with no owner
    activeProject.rooms.forEach(r => {
      r.deliverables
        .filter(d => (d.owner === 'Unassigned' || !d.owner) && (d.priority === 'critical' || d.priority === 'high'))
        .forEach(d => {
          items.push({
            id: `no-owner-${d.id}`,
            severity: d.priority === 'critical' ? 'critical' : 'high',
            type: 'No Owner',
            title: `"${d.title}" has no owner`,
            description: `${d.priority === 'critical' ? 'Critical' : 'High-priority'} deliverable due ${d.dueDate} with no assigned team member.`,
            daysOpen: daysSince(activeProject.createdAt),
            room: r.name,
            roomIcon: r.icon,
            action: 'Assign owner immediately. If no capacity, escalate to sponsor to hire or contract.',
            escalateTo: 'Team Lead',
          });
        });
    });

    // Rooms with confidence below 40
    activeProject.rooms.forEach(r => {
      if (r.confidence < 40) {
        items.push({
          id: `confidence-${r.id}`,
          severity: r.confidence < 25 ? 'critical' : 'high',
          type: 'Low Confidence',
          title: `${r.name} confidence at ${r.confidence}%`,
          description: `Confidence dropped below threshold. Risk factors: ${r.confidenceFactors.filter(f => f.score < 50).map(f => f.label).join(', ')}.`,
          daysOpen: 0,
          room: r.name,
          roomIcon: r.icon,
          action: 'Run a confidence recovery session. Identify and resolve top 2 confidence factors this week.',
          escalateTo: 'Room Lead',
        });
      }
    });

    // Rooms with no updates for 5+ days
    activeProject.rooms.forEach(r => {
      const lastUpdate = r.updates.length > 0
        ? r.updates.reduce((l, u) => u.createdAt > l ? u.createdAt : l, r.updates[0].createdAt)
        : null;
      const days = lastUpdate ? daysSince(lastUpdate) : 99;
      if (days >= 5) {
        items.push({
          id: `silent-${r.id}`,
          severity: days >= 8 ? 'critical' : 'high',
          type: 'Silent Room',
          title: `${r.name} silent for ${days} days`,
          description: days === 99
            ? `Room has never posted an update. Ownership and progress are unknown.`
            : `No update posted in ${days} days. Last update was ${lastUpdate}.`,
          daysOpen: days,
          room: r.name,
          roomIcon: r.icon,
          action: 'Reach out directly to room lead. Require update by EOD today or flag to sponsor.',
          escalateTo: 'PM / Project Lead',
        });
      }
    });

    // Overdue milestones
    activeProject.milestones.filter(m => m.status === 'overdue').forEach(m => {
      const room = activeProject.rooms.find(r => r.id === m.roomId);
      items.push({
        id: `milestone-${m.id}`,
        severity: 'critical',
        type: 'Overdue Milestone',
        title: `"${m.title}" is overdue`,
        description: `Milestone was due ${m.dueDate} and is marked overdue. All downstream work is at risk.`,
        daysOpen: daysSince(m.dueDate),
        room: room?.name,
        roomIcon: room?.icon,
        action: 'Run a recovery sprint. Reforecast timeline. Communicate slip to stakeholders now.',
        escalateTo: 'Project Sponsor',
      });
    });

    return items.sort((a, b) => {
      const sv = { critical: 0, high: 1, medium: 2 };
      return sv[a.severity] - sv[b.severity] || b.daysOpen - a.daysOpen;
    });
  }, [activeProject]);

  const visible = escalations.filter(e => !acknowledged.has(e.id));

  const sevColor = { critical: 'border-health-red/35 bg-health-red/5', high: 'border-health-yellow/35 bg-health-yellow/5', medium: 'border-border bg-secondary/10' };
  const sevBadge = { critical: 'text-health-red bg-health-red/15', high: 'text-health-yellow bg-health-yellow/15', medium: 'text-muted-foreground bg-secondary' };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {(['critical', 'high', 'medium'] as const).map(s => (
          <div key={s} className={`glass-card p-4 ${s === 'critical' ? 'border-health-red/20' : s === 'high' ? 'border-health-yellow/20' : ''}`}>
            <div className="text-xs text-muted-foreground font-display mb-1 uppercase">{s}</div>
            <div className={`text-3xl font-display font-bold ${s === 'critical' ? 'text-health-red' : s === 'high' ? 'text-health-yellow' : 'text-muted-foreground'}`}>
              {escalations.filter(e => e.severity === s).length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">triggers</div>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="glass-card p-8 text-center text-muted-foreground">
          <div className="text-2xl mb-2">✅</div>
          <div className="font-display">All escalations acknowledged</div>
        </div>
      )}

      <div className="space-y-3">
        {visible.map(e => (
          <motion.div
            key={e.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`glass-card p-5 border ${sevColor[e.severity]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-[10px] font-display px-1.5 py-0.5 rounded uppercase ${sevBadge[e.severity]}`}>{e.severity}</span>
                  <span className="text-[10px] font-display text-muted-foreground bg-secondary px-1.5 py-0.5 rounded uppercase">{e.type}</span>
                  {e.room && <span className="text-[10px] text-muted-foreground">{e.roomIcon} {e.room}</span>}
                  {e.daysOpen > 0 && <span className="text-[10px] text-muted-foreground">{e.daysOpen}d open</span>}
                </div>
                <div className="font-medium text-sm">{e.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{e.description}</div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-secondary/30 rounded-lg p-2.5">
                    <div className="text-[10px] font-display text-muted-foreground uppercase tracking-wider mb-1">Recommended Action</div>
                    <div className="text-xs">{e.action}</div>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-2.5">
                    <div className="text-[10px] font-display text-muted-foreground uppercase tracking-wider mb-1">Escalate To</div>
                    <div className="text-xs font-medium">{e.escalateTo}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setAcknowledged(prev => new Set([...prev, e.id]))}
                className="flex-shrink-0 text-xs font-display text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Ack
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {acknowledged.size > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {acknowledged.size} escalation{acknowledged.size !== 1 ? 's' : ''} acknowledged this session ·{' '}
          <button onClick={() => setAcknowledged(new Set())} className="text-primary hover:underline">Reset</button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'silence' | 'commitments' | 'escalations';

const tabs: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'silence', label: 'Silence Detector', icon: '🔇', desc: 'Who went quiet' },
  { id: 'commitments', label: 'Commitment Tracking', icon: '🤝', desc: 'Promise vs delivery' },
  { id: 'escalations', label: 'Escalation Triggers', icon: '🚨', desc: 'Auto-detected alerts' },
];

export default function AccountabilityPage() {
  const { activeProject } = useProject();
  const [activeTab, setActiveTab] = useState<Tab>('silence');

  if (!activeProject) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-muted-foreground">No project selected.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Accountability Layer</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeProject.name} — Who said what, who went quiet, what needs action now</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display transition-colors ${
                activeTab === t.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
              <span className="text-[10px] text-muted-foreground hidden sm:block">— {t.desc}</span>
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'silence' && <SilenceDetector />}
          {activeTab === 'commitments' && <CommitmentTracking />}
          {activeTab === 'escalations' && <EscalationTriggers />}
        </motion.div>
      </div>
    </AppLayout>
  );
}
