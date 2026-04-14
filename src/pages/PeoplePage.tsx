import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { TeamMember, Deliverable, Commitment } from '@/types/project';

const TODAY = '2026-04-14';

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return 999;
  return Math.max(0, Math.round((new Date(TODAY).getTime() - new Date(dateStr).getTime()) / 86400000));
}

function SilenceBadge({ days }: { days: number }) {
  if (days === 999) return <span className="text-[10px] font-display px-2 py-0.5 rounded bg-health-red/10 text-health-red">NEVER UPDATED</span>;
  if (days >= 7) return <span className="text-[10px] font-display px-2 py-0.5 rounded bg-health-red/10 text-health-red">{days}d SILENT</span>;
  if (days >= 3) return <span className="text-[10px] font-display px-2 py-0.5 rounded bg-health-yellow/10 text-health-yellow">{days}d AGO</span>;
  return <span className="text-[10px] font-display px-2 py-0.5 rounded bg-health-green/10 text-health-green">{days === 0 ? 'TODAY' : `${days}d AGO`}</span>;
}

function DeliverableRow({ d, room }: { d: Deliverable; room: string }) {
  const icon = d.status === 'done' ? '✅' : d.status === 'blocked' ? '🔴' : d.status === 'in_progress' ? '🟡' : '⚪';
  const priorityColor = d.priority === 'critical' ? 'text-health-red' : d.priority === 'high' ? 'text-health-yellow' : 'text-muted-foreground';
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-border/30 last:border-0">
      <div className="flex items-start gap-2">
        <span className="text-xs mt-0.5">{icon}</span>
        <div>
          <div className="text-xs">{d.title}</div>
          <div className="text-[10px] text-muted-foreground">{room} · Due {d.dueDate}</div>
        </div>
      </div>
      <span className={`text-[10px] font-display flex-shrink-0 ml-2 ${priorityColor}`}>{d.priority.toUpperCase()}</span>
    </div>
  );
}

function CommitmentRow({ c }: { c: Commitment }) {
  const icon = c.status === 'delivered' ? '✅' : c.status === 'missed' ? '🔴' : c.status === 'partial' ? '🟡' : '⏳';
  const color = c.status === 'delivered' ? 'text-health-green' : c.status === 'missed' ? 'text-health-red' : c.status === 'partial' ? 'text-health-yellow' : 'text-muted-foreground';
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs">"{c.promise}"</div>
        <div className="text-[10px] text-muted-foreground">Due {c.dueDate} · {c.source}</div>
      </div>
      <span className={`text-[10px] font-display flex-shrink-0 ${color}`}>{c.status.toUpperCase()}</span>
    </div>
  );
}

function MemberCard({ member, deliverables, commitments, rooms }: {
  member: TeamMember;
  deliverables: Deliverable[];
  commitments: Commitment[];
  rooms: { id: string; name: string; icon: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const silence = daysSince(member.lastUpdate);

  const byStatus = {
    blocked: deliverables.filter(d => d.status === 'blocked'),
    in_progress: deliverables.filter(d => d.status === 'in_progress'),
    not_started: deliverables.filter(d => d.status === 'not_started'),
    done: deliverables.filter(d => d.status === 'done'),
  };

  const inFlight = byStatus.blocked.length + byStatus.in_progress.length;
  const memberRooms = member.roomIds.map(id => rooms.find(r => r.id === id)).filter(Boolean) as typeof rooms;

  const delivered = commitments.filter(c => c.status === 'delivered').length;
  const missed = commitments.filter(c => c.status === 'missed').length;
  const reliability = commitments.length > 0 ? Math.round((delivered / commitments.length) * 100) : null;

  // Workload score: critical=4, high=3, medium=2, low=1 for in-flight
  const workloadScore = byStatus.blocked.reduce((s, d) => s + (d.priority === 'critical' ? 4 : d.priority === 'high' ? 3 : d.priority === 'medium' ? 2 : 1), 0)
    + byStatus.in_progress.reduce((s, d) => s + (d.priority === 'critical' ? 4 : d.priority === 'high' ? 3 : d.priority === 'medium' ? 2 : 1), 0);

  const workloadLabel = workloadScore >= 10 ? 'OVERLOADED' : workloadScore >= 6 ? 'HEAVY' : workloadScore >= 3 ? 'NORMAL' : 'LIGHT';
  const workloadColor = workloadScore >= 10 ? 'text-health-red' : workloadScore >= 6 ? 'text-health-yellow' : 'text-health-green';

  const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const avatarColor = silence >= 7 ? 'bg-health-red/20 text-health-red' : silence >= 3 ? 'bg-health-yellow/20 text-health-yellow' : 'bg-primary/20 text-primary';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-5 flex items-start gap-4 hover:bg-secondary/20 transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${avatarColor}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-sm">{member.name}</span>
            <span className="text-xs text-muted-foreground">{member.role}</span>
            <SilenceBadge days={silence} />
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {memberRooms.map(r => (
              <span key={r.id} className="text-[10px] text-muted-foreground">{r.icon} {r.name}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-right flex-shrink-0">
          <div>
            <div className={`text-sm font-display font-bold ${workloadColor}`}>{workloadLabel}</div>
            <div className="text-[10px] text-muted-foreground">{inFlight} in-flight</div>
          </div>
          {reliability !== null && (
            <div>
              <div className={`text-sm font-display font-bold ${reliability >= 70 ? 'text-health-green' : reliability >= 40 ? 'text-health-yellow' : 'text-health-red'}`}>{reliability}%</div>
              <div className="text-[10px] text-muted-foreground">reliability</div>
            </div>
          )}
          <div className="text-xs text-muted-foreground">{expanded ? '▲' : '▼'}</div>
        </div>
      </button>

      {/* Summary bar */}
      <div className="px-5 pb-3 flex gap-4">
        {[
          { label: 'Done', count: byStatus.done.length, color: 'text-health-green' },
          { label: 'In Progress', count: byStatus.in_progress.length, color: 'text-health-yellow' },
          { label: 'Blocked', count: byStatus.blocked.length, color: 'text-health-red' },
          { label: 'Not Started', count: byStatus.not_started.length, color: 'text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className={`text-base font-display font-bold ${s.color}`}>{s.count}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
        {commitments.length > 0 && (
          <>
            <div className="border-l border-border/40 mx-1" />
            <div className="text-center">
              <div className={`text-base font-display font-bold ${missed > 0 ? 'text-health-red' : 'text-health-green'}`}>{missed}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Missed</div>
            </div>
            <div className="text-center">
              <div className="text-base font-display font-bold text-health-green">{delivered}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Delivered</div>
            </div>
          </>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border/50"
        >
          <div className="grid grid-cols-2 gap-0 divide-x divide-border/50">
            {/* Deliverables */}
            <div className="p-5">
              <div className="text-[10px] font-display text-muted-foreground uppercase tracking-wider mb-3">
                Deliverables ({deliverables.length})
              </div>
              {byStatus.blocked.length > 0 && (
                <>
                  <div className="text-[10px] text-health-red font-display mb-1">🔴 BLOCKED</div>
                  {byStatus.blocked.map(d => {
                    const room = rooms.find(r => r.id === d.roomId);
                    return <DeliverableRow key={d.id} d={d} room={room?.name ?? ''} />;
                  })}
                </>
              )}
              {byStatus.in_progress.length > 0 && (
                <>
                  <div className="text-[10px] text-health-yellow font-display mb-1 mt-2">🟡 IN PROGRESS</div>
                  {byStatus.in_progress.map(d => {
                    const room = rooms.find(r => r.id === d.roomId);
                    return <DeliverableRow key={d.id} d={d} room={room?.name ?? ''} />;
                  })}
                </>
              )}
              {byStatus.not_started.length > 0 && (
                <>
                  <div className="text-[10px] text-muted-foreground font-display mb-1 mt-2">⚪ NOT STARTED</div>
                  {byStatus.not_started.map(d => {
                    const room = rooms.find(r => r.id === d.roomId);
                    return <DeliverableRow key={d.id} d={d} room={room?.name ?? ''} />;
                  })}
                </>
              )}
              {byStatus.done.length > 0 && (
                <>
                  <div className="text-[10px] text-health-green font-display mb-1 mt-2">✅ DONE</div>
                  {byStatus.done.map(d => {
                    const room = rooms.find(r => r.id === d.roomId);
                    return <DeliverableRow key={d.id} d={d} room={room?.name ?? ''} />;
                  })}
                </>
              )}
              {deliverables.length === 0 && (
                <div className="text-xs text-muted-foreground">No deliverables assigned.</div>
              )}
            </div>

            {/* Commitments */}
            <div className="p-5">
              <div className="text-[10px] font-display text-muted-foreground uppercase tracking-wider mb-3">
                Commitments ({commitments.length})
              </div>
              {commitments.length === 0 ? (
                <div className="text-xs text-muted-foreground">No commitments tracked.</div>
              ) : (
                commitments.map(c => <CommitmentRow key={c.id} c={c} />)
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

type SortKey = 'silence' | 'workload' | 'name' | 'reliability';

export default function PeoplePage() {
  const { activeProject } = useProject();
  const [sortBy, setSortBy] = useState<SortKey>('silence');
  const [filter, setFilter] = useState<'all' | 'silent' | 'overloaded' | 'missed'>('all');

  if (!activeProject) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-muted-foreground">No project selected.</div>
      </AppLayout>
    );
  }

  const project = activeProject;
  const allDeliverables = project.rooms.flatMap(r => r.deliverables);
  const rooms = project.rooms.map(r => ({ id: r.id, name: r.name, icon: r.icon }));

  // Compute per-member stats
  const memberStats = project.teamMembers.map(tm => {
    const deliverables = allDeliverables.filter(d => d.owner === tm.name);
    const commitments = (project.commitments ?? []).filter(c => c.person === tm.name);
    const silence = daysSince(tm.lastUpdate);
    const inFlight = deliverables.filter(d => d.status === 'in_progress' || d.status === 'blocked');
    const workloadScore = inFlight.reduce((s, d) => s + (d.priority === 'critical' ? 4 : d.priority === 'high' ? 3 : d.priority === 'medium' ? 2 : 1), 0);
    const delivered = commitments.filter(c => c.status === 'delivered').length;
    const reliability = commitments.length > 0 ? Math.round((delivered / commitments.length) * 100) : 100;
    const missed = commitments.filter(c => c.status === 'missed').length;
    return { tm, deliverables, commitments, silence, workloadScore, reliability, missed };
  });

  // Unstaffed rooms
  const unstaffedRooms = project.rooms.filter(r => r.teamMembers.length === 0);

  // Filter
  let filtered = memberStats;
  if (filter === 'silent') filtered = memberStats.filter(m => m.silence >= 5);
  if (filter === 'overloaded') filtered = memberStats.filter(m => m.workloadScore >= 6);
  if (filter === 'missed') filtered = memberStats.filter(m => m.missed > 0);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'silence') return b.silence - a.silence;
    if (sortBy === 'workload') return b.workloadScore - a.workloadScore;
    if (sortBy === 'name') return a.tm.name.localeCompare(b.tm.name);
    if (sortBy === 'reliability') return a.reliability - b.reliability;
    return 0;
  });

  const silentCount = memberStats.filter(m => m.silence >= 5).length;
  const overloadedCount = memberStats.filter(m => m.workloadScore >= 6).length;
  const missedCount = memberStats.filter(m => m.missed > 0).length;

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">People</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.name} — Who's doing what, who's overloaded, who's gone quiet</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Team Members', value: project.teamMembers.length, color: 'text-foreground', sub: `across ${project.rooms.filter(r => r.teamMembers.length > 0).length} rooms` },
            { label: 'Gone Quiet', value: silentCount, color: silentCount > 0 ? 'text-health-red' : 'text-health-green', sub: '5+ days silent' },
            { label: 'Overloaded', value: overloadedCount, color: overloadedCount > 0 ? 'text-health-yellow' : 'text-health-green', sub: 'heavy workload' },
            { label: 'Unstaffed Rooms', value: unstaffedRooms.length, color: unstaffedRooms.length > 0 ? 'text-health-red' : 'text-health-green', sub: 'no team members' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4">
              <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs font-display mt-1">{s.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Unstaffed rooms warning */}
        {unstaffedRooms.length > 0 && (
          <div className="border border-health-red/30 bg-health-red/5 rounded-lg p-4">
            <div className="text-sm font-display font-bold text-health-red mb-1">⚠️ Unstaffed Rooms — No output possible</div>
            <div className="flex gap-3 flex-wrap">
              {unstaffedRooms.map(r => (
                <span key={r.id} className="text-xs text-muted-foreground">{r.icon} {r.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {([
              { id: 'all', label: `All (${memberStats.length})` },
              { id: 'silent', label: `Silent (${silentCount})` },
              { id: 'overloaded', label: `Overloaded (${overloadedCount})` },
              { id: 'missed', label: `Missed Commits (${missedCount})` },
            ] as { id: typeof filter; label: string }[]).map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-display transition-colors ${filter === f.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sort:</span>
            {([
              { id: 'silence', label: 'Silence' },
              { id: 'workload', label: 'Workload' },
              { id: 'reliability', label: 'Reliability' },
              { id: 'name', label: 'Name' },
            ] as { id: SortKey; label: string }[]).map(s => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-2.5 py-1 rounded text-xs font-display transition-colors ${sortBy === s.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Member cards */}
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">No team members match this filter.</div>
          ) : (
            sorted.map(({ tm, deliverables, commitments }) => (
              <MemberCard
                key={tm.id}
                member={tm}
                deliverables={deliverables}
                commitments={commitments}
                rooms={rooms}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
