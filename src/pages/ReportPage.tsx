import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { computeProjectScore } from '@/lib/healthScoring';
import { computeDrift } from '@/lib/intelligence';

const TODAY = '2026-04-14';

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return 999;
  return Math.max(0, Math.round((new Date(TODAY).getTime() - new Date(dateStr).getTime()) / 86400000));
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - new Date(TODAY).getTime()) / 86400000);
}

type Audience = 'ceo' | 'sponsor' | 'tech_lead';

const audiences: { id: Audience; label: string; icon: string; desc: string }[] = [
  { id: 'ceo', label: 'CEO', icon: '🎯', desc: 'Plain English, top risks, go/no-go' },
  { id: 'sponsor', label: 'Sponsor', icon: '💼', desc: 'Budget, milestones, escalations' },
  { id: 'tech_lead', label: 'Tech Lead', icon: '⚡', desc: 'Room status, blockers, critical path' },
];

function useReport(project: NonNullable<ReturnType<typeof useProject>['activeProject']>) {
  const score = computeProjectScore(project);
  const drift = computeDrift(project);
  const allDeliverables = project.rooms.flatMap(r => r.deliverables);
  const done = allDeliverables.filter(d => d.status === 'done');
  const blocked = allDeliverables.filter(d => d.status === 'blocked');
  const inProgress = allDeliverables.filter(d => d.status === 'in_progress');
  const critBlockers = project.blockers.filter(b => b.severity === 'critical');
  const highBlockers = project.blockers.filter(b => b.severity === 'high');
  const atRiskMilestones = project.milestones.filter(m => m.status === 'at_risk' || m.status === 'overdue');
  const upcomingMilestones = project.milestones.filter(m => m.status !== 'completed').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const silentMembers = project.teamMembers.filter(tm => daysSince(tm.lastUpdate) >= 5);
  const unstaffedRooms = project.rooms.filter(r => r.teamMembers.length === 0);
  const brokenAssumptions = project.intelligence?.assumptions.filter(a => a.status === 'broken') ?? [];
  const scopeCreep = project.scopeChanges.filter(s => s.type === 'added' && !s.hasTradeoff);
  const daysLeft = daysUntil(project.deadline);
  const missedCommitments = (project.commitments ?? []).filter(c => c.status === 'missed');

  return {
    score, drift, allDeliverables, done, blocked, inProgress,
    critBlockers, highBlockers, atRiskMilestones, upcomingMilestones,
    silentMembers, unstaffedRooms, brokenAssumptions, scopeCreep, daysLeft,
    missedCommitments,
  };
}

// ─── Section components ───────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-display text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1">{title}</div>
      {children}
    </div>
  );
}

function HealthPill({ status, score }: { status: string; score: number }) {
  const color = status === 'green' ? 'bg-health-green/10 text-health-green border-health-green/20'
    : status === 'yellow' ? 'bg-health-yellow/10 text-health-yellow border-health-yellow/20'
    : 'bg-health-red/10 text-health-red border-health-red/20';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-display font-bold ${color}`}>
      <span className={`w-2 h-2 rounded-full ${status === 'green' ? 'bg-health-green' : status === 'yellow' ? 'bg-health-yellow' : 'bg-health-red'}`} />
      {status.toUpperCase()} · {score}%
    </span>
  );
}

// ─── CEO Report ───────────────────────────────────────────────────────────────

function CEOReport({ project }: { project: NonNullable<ReturnType<typeof useProject>['activeProject']> }) {
  const r = useReport(project);

  const executiveLine = r.drift.willMissDeadline
    ? `The project is currently ${r.score.overallPercent}% complete with ${r.daysLeft} days to the ${project.deadline} deadline. At the current pace, we are projected to miss the deadline by approximately ${r.drift.driftDays} days. This requires immediate executive action.`
    : `The project is ${r.score.overallPercent}% complete with ${r.daysLeft} days to the ${project.deadline} deadline. We are on track at the current pace. ${r.critBlockers.length > 0 ? `${r.critBlockers.length} critical blocker${r.critBlockers.length !== 1 ? 's' : ''} need attention.` : 'No critical blockers.'}`;

  const goNoGo = r.critBlockers.length === 0 && !r.drift.willMissDeadline && r.unstaffedRooms.length === 0
    ? { label: 'GO', color: 'text-health-green bg-health-green/10 border-health-green/20', detail: 'No blockers. On track. Proceed.' }
    : r.critBlockers.length >= 2 || r.drift.willMissDeadline
    ? { label: 'ESCALATE', color: 'text-health-red bg-health-red/10 border-health-red/20', detail: 'Critical issues require sponsor review.' }
    : { label: 'CAUTION', color: 'text-health-yellow bg-health-yellow/10 border-health-yellow/20', detail: 'Issues present. Monitor closely.' };

  return (
    <div className="space-y-6">
      <Section title="Executive Summary">
        <p className="text-sm leading-relaxed">{executiveLine}</p>
        <div className="flex items-center gap-4 mt-2">
          <HealthPill status={project.healthStatus} score={r.score.overallPercent} />
          <span className={`text-sm font-display font-bold px-3 py-1 rounded-full border ${goNoGo.color}`}>
            {goNoGo.label} — {goNoGo.detail}
          </span>
        </div>
      </Section>

      <Section title="What You Need to Know">
        <div className="space-y-2">
          {r.critBlockers.length > 0 && r.critBlockers.map(b => (
            <div key={b.id} className="flex items-start gap-2 text-sm">
              <span className="text-health-red flex-shrink-0 mt-0.5">🔴</span>
              <span><strong>{b.title}</strong> — unresolved, assigned to {b.owner}. Open for {daysSince(b.createdAt)} days.</span>
            </div>
          ))}
          {r.unstaffedRooms.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-health-red flex-shrink-0 mt-0.5">🔴</span>
              <span><strong>{r.unstaffedRooms.map(r => r.name).join(', ')}</strong> — {r.unstaffedRooms.length > 1 ? 'rooms have' : 'room has'} no team assigned. Zero output possible.</span>
            </div>
          )}
          {r.silentMembers.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-health-yellow flex-shrink-0 mt-0.5">🟡</span>
              <span><strong>{r.silentMembers.map(m => m.name).join(', ')}</strong> — {r.silentMembers.length > 1 ? 'have' : 'has'} not updated in 5+ days.</span>
            </div>
          )}
          {r.scopeCreep.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-health-yellow flex-shrink-0 mt-0.5">🟡</span>
              <span><strong>{r.scopeCreep.length} scope addition{r.scopeCreep.length > 1 ? 's' : ''}</strong> added without timeline adjustment: {r.scopeCreep.map(s => s.description).join('; ')}.</span>
            </div>
          )}
          {r.critBlockers.length === 0 && r.unstaffedRooms.length === 0 && r.silentMembers.length === 0 && r.scopeCreep.length === 0 && (
            <div className="text-sm text-health-green">✅ No critical issues to flag.</div>
          )}
        </div>
      </Section>

      <Section title="Progress at a Glance">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Complete', value: r.done.length, total: r.allDeliverables.length, color: 'text-health-green' },
            { label: 'In Progress', value: r.inProgress.length, total: r.allDeliverables.length, color: 'text-health-yellow' },
            { label: 'Blocked', value: r.blocked.length, total: r.allDeliverables.length, color: 'text-health-red' },
            { label: 'Days Left', value: r.daysLeft, total: null, color: r.daysLeft < 14 ? 'text-health-red' : r.daysLeft < 30 ? 'text-health-yellow' : 'text-health-green' },
          ].map(s => (
            <div key={s.label} className="glass-card p-3 text-center">
              <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}{s.total ? `/${s.total}` : ''}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {r.upcomingMilestones.length > 0 && (
        <Section title="Next Milestone">
          {(() => {
            const next = r.upcomingMilestones[0];
            const room = project.rooms.find(r => r.id === next.roomId);
            return (
              <div className="flex items-center gap-3 text-sm">
                <span className={`font-display font-bold px-2 py-0.5 rounded text-xs ${next.status === 'at_risk' || next.status === 'overdue' ? 'bg-health-red/10 text-health-red' : 'bg-secondary text-muted-foreground'}`}>
                  {next.status.replace('_', ' ').toUpperCase()}
                </span>
                <strong>{next.title}</strong>
                <span className="text-muted-foreground">{next.dueDate} · {room?.name}</span>
              </div>
            );
          })()}
        </Section>
      )}
    </div>
  );
}

// ─── Sponsor Report ───────────────────────────────────────────────────────────

function SponsorReport({ project }: { project: NonNullable<ReturnType<typeof useProject>['activeProject']> }) {
  const r = useReport(project);

  const escalations = [
    ...r.critBlockers.map(b => ({ type: 'BLOCKER', text: `${b.title} — assigned ${b.owner}, open ${daysSince(b.createdAt)} days`, urgent: true })),
    ...r.unstaffedRooms.map(room => ({ type: 'STAFFING', text: `${room.name} room has no team members — zero progress possible`, urgent: true })),
    ...r.atRiskMilestones.map(m => ({ type: 'MILESTONE', text: `${m.title} is ${m.status.replace('_', ' ')} (due ${m.dueDate})`, urgent: m.status === 'overdue' })),
    ...r.scopeCreep.map(s => ({ type: 'SCOPE', text: `"${s.description}" added without timeline amendment`, urgent: false })),
    ...r.missedCommitments.slice(0, 3).map(c => ({ type: 'COMMITMENT', text: `${c.person} missed: "${c.promise}" (due ${c.dueDate})`, urgent: false })),
  ];

  return (
    <div className="space-y-6">
      <Section title="Project Health">
        <div className="flex items-center gap-4">
          <HealthPill status={project.healthStatus} score={r.score.overallPercent} />
          <span className="text-sm text-muted-foreground">Deadline: <strong className="text-foreground">{project.deadline}</strong> ({r.daysLeft} days)</span>
          <span className="text-sm text-muted-foreground">Budget: <strong className="text-foreground">{project.budget}</strong></span>
        </div>
      </Section>

      <Section title="Milestone Status">
        <div className="space-y-2">
          {project.milestones.map(m => {
            const room = project.rooms.find(r => r.id === m.roomId);
            const days = daysUntil(m.dueDate);
            const color = m.status === 'completed' ? 'text-health-green' : m.status === 'overdue' ? 'text-health-red' : m.status === 'at_risk' ? 'text-health-yellow' : 'text-muted-foreground';
            const icon = m.status === 'completed' ? '✅' : m.status === 'overdue' ? '🔴' : m.status === 'at_risk' ? '🟡' : '⚪';
            return (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="font-medium">{m.title}</span>
                  <span className="text-muted-foreground text-xs">{room?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{m.dueDate}</span>
                  <span className={`text-[10px] font-display ${color}`}>{m.status.replace('_', ' ').toUpperCase()}</span>
                  {m.status !== 'completed' && <span className="text-[10px] text-muted-foreground">{days > 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title={`Escalation Required (${escalations.filter(e => e.urgent).length} urgent)`}>
        {escalations.length === 0 ? (
          <div className="text-sm text-health-green">✅ Nothing requires sponsor escalation.</div>
        ) : (
          <div className="space-y-2">
            {escalations.sort((a, b) => Number(b.urgent) - Number(a.urgent)).map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={`text-[10px] font-display px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${e.urgent ? 'bg-health-red/10 text-health-red' : 'bg-health-yellow/10 text-health-yellow'}`}>
                  {e.type}
                </span>
                <span>{e.text}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Delivery Forecast">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'P50 (likely)', value: r.drift.projectedCompletionDate, detail: 'At current pace' },
            { label: 'On-time probability', value: `${Math.max(0, Math.min(100, 100 - Math.max(0, r.drift.driftPercent) * 3))}%`, detail: 'Based on velocity' },
            { label: 'Deadline', value: project.deadline, detail: `${r.daysLeft} days away` },
          ].map(s => (
            <div key={s.label} className="glass-card p-3">
              <div className="text-sm font-display font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
              <div className="text-[9px] text-muted-foreground">{s.detail}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Tech Lead Report ─────────────────────────────────────────────────────────

function TechLeadReport({ project }: { project: NonNullable<ReturnType<typeof useProject>['activeProject']> }) {
  const r = useReport(project);
  const allDeliverables = project.rooms.flatMap(rm => rm.deliverables);

  const criticalPath = allDeliverables.filter(d =>
    d.priority === 'critical' && d.status !== 'done'
  );

  return (
    <div className="space-y-6">
      <Section title="Room Status">
        <div className="space-y-3">
          {project.rooms.map(room => {
            const rs = r.score.roomScores.find(s => s.roomId === room.id);
            const blockedInRoom = room.deliverables.filter(d => d.status === 'blocked');
            const flag = room.teamMembers.length === 0 ? ' — ⚠️ UNSTAFFED' : '';
            return (
              <div key={room.id} className="border border-border/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{room.icon}</span>
                    <span className="font-display font-semibold text-sm">{room.name}{flag}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${room.healthStatus === 'green' ? 'bg-health-green' : room.healthStatus === 'yellow' ? 'bg-health-yellow' : 'bg-health-red'}`}
                        style={{ width: `${rs?.completionPercent ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-display text-muted-foreground">{rs?.doneCount ?? 0}/{rs?.totalCount ?? 0}</span>
                    <span className={`text-[10px] font-display px-1.5 py-0.5 rounded ${room.healthStatus === 'green' ? 'bg-health-green/10 text-health-green' : room.healthStatus === 'yellow' ? 'bg-health-yellow/10 text-health-yellow' : 'bg-health-red/10 text-health-red'}`}>
                      {room.healthStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
                {blockedInRoom.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {blockedInRoom.map(d => (
                      <span key={d.id} className="text-[10px] text-health-red border border-health-red/20 bg-health-red/5 px-2 py-0.5 rounded">
                        🔴 {d.title}
                      </span>
                    ))}
                  </div>
                )}
                {room.blockers.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {room.blockers.map(b => (
                      <div key={b.id} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-health-red flex-shrink-0">⛔</span>
                        {b.title} — {b.owner}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title={`Critical Path (${criticalPath.length} items)`}>
        {criticalPath.length === 0 ? (
          <div className="text-sm text-health-green">✅ No critical-priority items pending.</div>
        ) : (
          <div className="space-y-2">
            {criticalPath.map(d => {
              const room = project.rooms.find(rm => rm.id === d.roomId);
              const dependents = allDeliverables.filter(x => x.dependencies.includes(d.id));
              return (
                <div key={d.id} className="border border-health-red/20 bg-health-red/5 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{d.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{d.owner} · {room?.name} · Due {d.dueDate}</div>
                    </div>
                    <span className={`text-[10px] font-display px-1.5 py-0.5 rounded ${d.status === 'blocked' ? 'bg-health-red/10 text-health-red' : 'bg-health-yellow/10 text-health-yellow'}`}>
                      {d.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {dependents.length > 0 && (
                    <div className="mt-2 text-[10px] text-health-red">
                      If slips → {dependents.map(dep => dep.title).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {r.brokenAssumptions.length > 0 && (
        <Section title={`Broken Assumptions (${r.brokenAssumptions.length})`}>
          <div className="space-y-2">
            {r.brokenAssumptions.map(a => (
              <div key={a.id} className="text-sm">
                <span className="text-health-red">⚠️ </span>
                <strong>{a.statement}</strong>
                <div className="text-xs text-muted-foreground ml-5 mt-0.5">{a.impactDescription}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Velocity">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Current velocity', value: `${r.drift.velocityPerWeek}%/wk` },
            { label: 'Required velocity', value: `${r.drift.requiredVelocityPerWeek}%/wk`, alert: r.drift.velocityPerWeek < r.drift.requiredVelocityPerWeek },
            { label: 'Projected finish', value: r.drift.projectedCompletionDate, alert: r.drift.willMissDeadline },
          ].map(s => (
            <div key={s.label} className={`glass-card p-3 ${s.alert ? 'border-health-red/30' : ''}`}>
              <div className={`text-sm font-display font-bold ${s.alert ? 'text-health-red' : ''}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const { activeProject } = useProject();
  const [audience, setAudience] = useState<Audience>('ceo');
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!activeProject) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-muted-foreground">No project selected.</div>
      </AppLayout>
    );
  }

  const handleCopy = () => {
    const text = reportRef.current?.innerText ?? '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Status Report</h1>
            <p className="text-sm text-muted-foreground mt-1">{activeProject.name} · Auto-generated · {TODAY}</p>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display border transition-colors ${copied ? 'bg-health-green/10 text-health-green border-health-green/30' : 'border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground'}`}
          >
            {copied ? '✅ Copied' : '⎘ Copy'}
          </button>
        </div>

        {/* Audience selector */}
        <div className="grid grid-cols-3 gap-3">
          {audiences.map(a => (
            <button
              key={a.id}
              onClick={() => setAudience(a.id)}
              className={`p-4 rounded-xl border text-left transition-all ${audience === a.id ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-border/80 hover:bg-secondary/20'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{a.icon}</span>
                <span className="font-display font-semibold text-sm">{a.label}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{a.desc}</div>
            </button>
          ))}
        </div>

        {/* Report content */}
        <motion.div
          key={audience}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          ref={reportRef}
          className="glass-card p-6 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div>
              <div className="text-[10px] font-display text-muted-foreground uppercase tracking-widest">Project Pulse · Status Report</div>
              <div className="font-display font-bold text-lg mt-0.5">{activeProject.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground font-display">{audiences.find(a => a.id === audience)?.icon} FOR: {audiences.find(a => a.id === audience)?.label.toUpperCase()}</div>
              <div className="text-[10px] text-muted-foreground font-display">{TODAY}</div>
            </div>
          </div>

          {audience === 'ceo' && <CEOReport project={activeProject} />}
          {audience === 'sponsor' && <SponsorReport project={activeProject} />}
          {audience === 'tech_lead' && <TechLeadReport project={activeProject} />}
        </motion.div>
      </div>
    </AppLayout>
  );
}
