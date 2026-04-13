import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { PostMortemLesson, Decision } from '@/types/project';

// ─── Post-Mortem Generator ────────────────────────────────────────────────────

function generatePostMortem(project: ReturnType<typeof import('@/contexts/ProjectContext').useProject>['activeProject']): PostMortemLesson[] {
  if (!project) return [];
  const lessons: PostMortemLesson[] = [];

  const allDeliverables = project.rooms.flatMap(r => r.deliverables);
  const done = allDeliverables.filter(d => d.status === 'done').length;
  const blocked = allDeliverables.filter(d => d.status === 'blocked').length;
  const unowned = allDeliverables.filter(d => !d.owner || d.owner === 'Unassigned').length;

  // What worked
  const staffedRooms = project.rooms.filter(r => r.teamMembers.length > 0 && r.healthScore >= 70);
  staffedRooms.forEach(r => {
    lessons.push({
      category: 'what_worked',
      text: `${r.name} room maintained ${r.healthScore}% health throughout — staffed, consistent updates, clear deliverables.`,
      evidence: `${r.updates.length} updates logged, ${r.deliverables.filter(d => d.status === 'done').length}/${r.deliverables.length} deliverables done`,
      roomId: r.id,
    });
  });

  if (done > 0) {
    lessons.push({
      category: 'what_worked',
      text: `${done} of ${allDeliverables.length} deliverables completed on time — evidence of working execution when resources are in place.`,
    });
  }

  const lowBlockerRooms = project.rooms.filter(r => r.blockers.length === 0 && r.healthScore >= 70);
  if (lowBlockerRooms.length > 0) {
    lessons.push({
      category: 'what_worked',
      text: `${lowBlockerRooms.map(r => r.name).join(', ')} ran clean — zero blockers. Study these rooms' processes for replication.`,
    });
  }

  // What failed
  const unstaffedRooms = project.rooms.filter(r => r.teamMembers.length === 0);
  unstaffedRooms.forEach(r => {
    lessons.push({
      category: 'what_failed',
      text: `${r.name} room was never staffed — all ${r.deliverables.length} deliverables remained unowned and not started.`,
      evidence: `0 updates logged, 0 team members, 0% progress`,
      roomId: r.id,
    });
  });

  if (blocked > 0) {
    lessons.push({
      category: 'what_failed',
      text: `${blocked} deliverables remained blocked throughout — blockers were not escalated fast enough.`,
      evidence: `${blocked} of ${allDeliverables.length} deliverables in blocked status`,
    });
  }

  if (unowned > 0) {
    lessons.push({
      category: 'what_failed',
      text: `${unowned} deliverables had no owner assigned — work cannot happen without ownership.`,
    });
  }

  const criticalBlockers = project.blockers.filter(b => b.severity === 'critical');
  criticalBlockers.forEach(b => {
    const room = project.rooms.find(r => r.id === b.roomId);
    lessons.push({
      category: 'what_failed',
      text: `Critical blocker "${b.title}" remained unresolved, cascading into multiple downstream delays.`,
      evidence: `Opened ${b.createdAt} · Owner: ${b.owner}`,
      roomId: b.roomId,
    });
  });

  // Bottlenecks
  const scopeAdded = project.scopeChanges.filter(s => s.type === 'added');
  if (scopeAdded.length > 0) {
    lessons.push({
      category: 'bottleneck',
      text: `Scope grew by ${scopeAdded.length} item(s) mid-project without corresponding timeline or budget adjustments.`,
      evidence: scopeAdded.map(s => `"${s.description}"`).join(', '),
    });
  }

  const atRiskMilestones = project.milestones.filter(m => m.status === 'at_risk' || m.status === 'overdue');
  if (atRiskMilestones.length > 0) {
    lessons.push({
      category: 'bottleneck',
      text: `${atRiskMilestones.length} milestones slipped to at-risk or overdue status, creating cascading timeline pressure.`,
      evidence: atRiskMilestones.map(m => m.title).join(', '),
    });
  }

  const depsWithBlockedUpstream = allDeliverables.filter(d =>
    d.dependencies.some(depId => {
      const dep = allDeliverables.find(x => x.id === depId);
      return dep && (dep.status === 'blocked' || dep.status === 'not_started');
    })
  );
  if (depsWithBlockedUpstream.length > 0) {
    lessons.push({
      category: 'bottleneck',
      text: `${depsWithBlockedUpstream.length} deliverables were blocked by incomplete upstream dependencies — dependency chain created a single point of failure.`,
    });
  }

  // Missed assumptions
  const intelligence = project.intelligence;
  if (intelligence) {
    intelligence.assumptions.filter(a => a.status === 'broken').forEach(a => {
      lessons.push({
        category: 'missed_assumption',
        text: `Assumption failed: "${a.statement}"`,
        evidence: a.evidence ?? `Impact: ${a.impactDescription}`,
      });
    });
  }

  const missedCommitments = (project.commitments ?? []).filter(c => c.status === 'missed');
  if (missedCommitments.length > 0) {
    const byPerson = missedCommitments.reduce<Record<string, number>>((acc, c) => {
      acc[c.person] = (acc[c.person] ?? 0) + 1;
      return acc;
    }, {});
    const topMissers = Object.entries(byPerson).sort((a, b) => b[1] - a[1]).slice(0, 2);
    lessons.push({
      category: 'missed_assumption',
      text: `${missedCommitments.length} commitments were missed. ${topMissers.map(([p, n]) => `${p} (${n})`).join(', ')} had the most missed promises.`,
      evidence: missedCommitments.map(c => `"${c.promise}"`).join(' · '),
    });
  }

  // Lessons for next time
  lessons.push({
    category: 'lesson',
    text: 'Staff all rooms before kickoff. Rooms without owners produce zero output.',
  });
  lessons.push({
    category: 'lesson',
    text: 'Any blocker older than 3 days must auto-escalate to project sponsor — don\'t wait for it to resolve itself.',
  });
  lessons.push({
    category: 'lesson',
    text: 'Scope additions must come with corresponding timeline and budget amendments. If not, say no.',
  });
  if (intelligence?.assumptions.some(a => a.category === 'dependency' && a.status === 'broken')) {
    lessons.push({
      category: 'lesson',
      text: 'Validate all external API/vendor dependencies before kickoff. Procurement delays are predictable and must be front-loaded.',
    });
  }

  return lessons;
}

function PostMortemGenerator() {
  const { activeProject } = useProject();
  const [generated, setGenerated] = useState(false);
  const [filter, setFilter] = useState<PostMortemLesson['category'] | 'all'>('all');

  const lessons = useMemo(() => generatePostMortem(activeProject), [activeProject]);

  const categories: { id: PostMortemLesson['category'] | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'what_worked', label: 'What Worked', icon: '✅' },
    { id: 'what_failed', label: 'What Failed', icon: '❌' },
    { id: 'bottleneck', label: 'Bottlenecks', icon: '⛽' },
    { id: 'missed_assumption', label: 'Missed Assumptions', icon: '💥' },
    { id: 'lesson', label: 'Lessons', icon: '📖' },
  ];

  const filtered = filter === 'all' ? lessons : lessons.filter(l => l.category === filter);

  const catConfig: Record<PostMortemLesson['category'], { color: string; bg: string; border: string }> = {
    what_worked: { color: 'text-health-green', bg: 'bg-health-green/10', border: 'border-health-green/25' },
    what_failed: { color: 'text-health-red', bg: 'bg-health-red/10', border: 'border-health-red/25' },
    bottleneck: { color: 'text-health-yellow', bg: 'bg-health-yellow/10', border: 'border-health-yellow/25' },
    missed_assumption: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/25' },
    lesson: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/25' },
  };

  if (!activeProject) return null;

  return (
    <div className="space-y-5">
      {!generated ? (
        <div className="glass-card p-8 text-center space-y-4">
          <div className="text-4xl">📋</div>
          <div>
            <div className="font-display font-bold text-lg">Post-Mortem Generator</div>
            <div className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Analyzes all project data — blockers, scope changes, commitments, assumptions, milestone history, and room health — to auto-generate a structured retrospective.
            </div>
          </div>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <div><span className="font-display text-foreground">{activeProject.scopeChanges.length}</span> scope changes</div>
            <div><span className="font-display text-foreground">{activeProject.blockers.length}</span> blockers logged</div>
            <div><span className="font-display text-foreground">{(activeProject.commitments ?? []).filter(c => c.status === 'missed').length}</span> missed commitments</div>
            <div><span className="font-display text-foreground">{activeProject.intelligence?.assumptions.filter(a => a.status === 'broken').length ?? 0}</span> broken assumptions</div>
          </div>
          <button
            onClick={() => setGenerated(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-display text-sm hover:bg-primary/90 transition-colors"
          >
            Generate Post-Mortem →
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-5 gap-3">
              {categories.slice(1).map(c => {
                const count = lessons.filter(l => l.category === c.id).length;
                return (
                  <div key={c.id} className="glass-card p-3 text-center">
                    <div className="text-lg">{c.icon}</div>
                    <div className="text-2xl font-display font-bold mt-1">{count}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{c.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display transition-colors ${
                    filter === c.id
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  }`}
                >
                  {c.icon} {c.label}
                  <span className="text-muted-foreground">
                    ({c.id === 'all' ? lessons.length : lessons.filter(l => l.category === c.id).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Lesson cards */}
            <div className="space-y-3">
              {filtered.map((lesson, i) => {
                const cfg = catConfig[lesson.category];
                const catLabel = categories.find(c => c.id === lesson.category);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-sm">{catLabel?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{lesson.text}</div>
                        {lesson.evidence && (
                          <div className="mt-1.5 text-xs text-muted-foreground italic">Evidence: {lesson.evidence}</div>
                        )}
                      </div>
                      <span className={`text-[9px] font-display px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${cfg.color} ${cfg.bg}`}>
                        {catLabel?.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setGenerated(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Regenerate
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Decision Replay ──────────────────────────────────────────────────────────

function buildDecisionAnswer(decision: Decision, project: NonNullable<ReturnType<typeof import('@/contexts/ProjectContext').useProject>['activeProject']>): string {
  const room = project.rooms.find(r => r.id === decision.roomId);
  const parts: string[] = [];

  parts.push(`**${decision.title}** was decided on ${decision.date} by ${decision.decidedBy}, approved by ${decision.approvedBy}.`);

  if (room) parts.push(`This decision was made within the **${room.name}** workstream.`);

  parts.push(`\n\n**Why this choice:** ${decision.description}`);

  if (decision.alternativesRejected.length > 0) {
    parts.push(`\n\n**Alternatives considered and rejected:**`);
    decision.alternativesRejected.forEach(a => parts.push(`  • ${a}`));
  }

  if (decision.assumptions.length > 0) {
    parts.push(`\n\n**Assumptions this decision rested on:**`);
    decision.assumptions.forEach(a => {
      const broken = project.intelligence?.assumptions.find(ia =>
        ia.linkedDeliverables.some(ld => ld) && ia.statement.toLowerCase().includes(a.toLowerCase().slice(0, 20))
      );
      parts.push(`  • ${a}${broken && broken.status === 'broken' ? ' ⚠️ *This assumption has since been broken*' : ''}`);
    });
  }

  parts.push(`\n\n**Current status:** ${decision.status === 'active' ? 'Active — still in effect' : decision.status === 'revisited' ? 'Revisited — under review' : 'Reversed — no longer applies'}`);

  return parts.join('\n');
}

function DecisionReplay() {
  const { activeProject } = useProject();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ decisionId: string; query: string }[]>([]);

  if (!activeProject) return null;

  const allDecisions = activeProject.decisions;

  const filtered = query.trim()
    ? allDecisions.filter(d =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.description.toLowerCase().includes(query.toLowerCase()) ||
        d.decidedBy.toLowerCase().includes(query.toLowerCase()) ||
        d.alternativesRejected.some(a => a.toLowerCase().includes(query.toLowerCase()))
      )
    : allDecisions;

  const selected = selectedId ? allDecisions.find(d => d.id === selectedId) : null;
  const answer = selected ? buildDecisionAnswer(selected, activeProject) : null;

  function handleSelect(d: Decision) {
    setSelectedId(d.id);
    setHistory(prev => [{ decisionId: d.id, query: query || d.title }, ...prev.filter(h => h.decisionId !== d.id)].slice(0, 5));
    setQuery('');
  }

  // Render answer with markdown-like bold
  function renderAnswer(text: string) {
    return text.split('\n').map((line, i) => {
      const rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
      return <div key={i} className={`${line.startsWith('  •') ? 'ml-4' : ''} ${line.startsWith('**') ? 'mt-3' : ''}`} dangerouslySetInnerHTML={{ __html: rendered || '&nbsp;' }} />;
    });
  }

  return (
    <div className="space-y-5">
      {/* Search interface */}
      <div className="glass-card p-5">
        <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-3">Ask about any decision</div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='e.g. "Why did we choose Ahrefs?" or "Who approved the scope reduction?"'
            className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 font-mono"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
          )}
        </div>

        {/* Query results */}
        {query && filtered.length > 0 && (
          <div className="mt-2 border border-border rounded-lg overflow-hidden">
            {filtered.map(d => (
              <button
                key={d.id}
                onClick={() => handleSelect(d)}
                className="w-full flex items-start gap-3 p-3 hover:bg-secondary/40 transition-colors text-left border-b border-border last:border-0"
              >
                <span className="text-lg flex-shrink-0">⚖️</span>
                <div>
                  <div className="text-sm font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">{d.date} · {d.decidedBy}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {query && filtered.length === 0 && (
          <div className="mt-2 text-sm text-muted-foreground p-3 border border-border rounded-lg">
            No decisions match "{query}" — try different keywords
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Decision list */}
        <div className="space-y-2">
          <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-3">All Decisions ({allDecisions.length})</div>
          {allDecisions.map(d => {
            const room = activeProject.rooms.find(r => r.id === d.roomId);
            const hasBrokenAssumption = d.assumptions.some(a =>
              activeProject.intelligence?.assumptions.some(ia => ia.status === 'broken' && ia.statement.toLowerCase().includes(a.toLowerCase().slice(0, 15)))
            );
            return (
              <button
                key={d.id}
                onClick={() => handleSelect(d)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === d.id
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border hover:border-border/80 hover:bg-secondary/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-medium leading-tight">{d.title}</div>
                  {hasBrokenAssumption && <span className="text-[10px] text-health-red flex-shrink-0">⚠️</span>}
                </div>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {room && <span className="text-[10px] text-muted-foreground">{room.icon} {room.name}</span>}
                  <span className="text-[10px] text-muted-foreground">{d.date}</span>
                  <span className={`text-[10px] font-display px-1 py-0.5 rounded ${d.status === 'active' ? 'bg-health-green/10 text-health-green' : d.status === 'revisited' ? 'bg-health-yellow/10 text-health-yellow' : 'bg-secondary text-muted-foreground'}`}>
                    {d.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Decision detail */}
        <div className="col-span-2">
          {selected && answer ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚖️</span>
                <div>
                  <div className="font-display font-bold">{selected.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{selected.date} · {selected.decidedBy} → {selected.approvedBy}</div>
                </div>
              </div>

              <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed space-y-1">
                {renderAnswer(answer)}
              </div>

              {/* Related decisions */}
              {history.length > 1 && (
                <div className="pt-3 border-t border-border">
                  <div className="text-[10px] font-display text-muted-foreground uppercase tracking-wider mb-2">Previously viewed</div>
                  <div className="flex flex-wrap gap-2">
                    {history.filter(h => h.decisionId !== selected.id).map(h => {
                      const d = allDecisions.find(x => x.id === h.decisionId);
                      return d ? (
                        <button
                          key={h.decisionId}
                          onClick={() => setSelectedId(h.decisionId)}
                          className="text-[10px] text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 px-2 py-1 rounded transition-colors"
                        >
                          {d.title}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="glass-card p-8 h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
              <div className="text-3xl">⚖️</div>
              <div className="font-display">Select a decision to replay it</div>
              <div className="text-xs max-w-xs">See the full context: what was decided, who approved it, what alternatives were rejected, and whether the underlying assumptions still hold.</div>
              {history.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider mb-2">Recent</div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {history.map(h => {
                      const d = allDecisions.find(x => x.id === h.decisionId);
                      return d ? (
                        <button key={h.decisionId} onClick={() => setSelectedId(h.decisionId)} className="text-[10px] border border-border hover:border-foreground/30 px-2 py-1 rounded transition-colors hover:text-foreground">
                          {d.title}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'postmortem' | 'decisions';

const tabs: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'postmortem', label: 'Post-Mortem Generator', icon: '📋', desc: 'Auto-generated retrospective' },
  { id: 'decisions', label: 'Decision Replay', icon: '⚖️', desc: 'Why did we choose X?' },
];

export default function MemoryPage() {
  const { activeProject } = useProject();
  const [activeTab, setActiveTab] = useState<Tab>('postmortem');

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
          <h1 className="text-2xl font-display font-bold">Institutional Memory</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeProject.name} — Preserve what happened and why</p>
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
          {activeTab === 'postmortem' && <PostMortemGenerator />}
          {activeTab === 'decisions' && <DecisionReplay />}
        </motion.div>
      </div>
    </AppLayout>
  );
}
