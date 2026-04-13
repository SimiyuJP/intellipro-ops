import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { HealthBadge } from '@/components/HealthBadge';
import { historicalPatterns } from '@/data/seedSnapshots';

// ─── Delivery Forecast ────────────────────────────────────────────────────────

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function DeliveryForecast() {
  const { activeProject } = useProject();

  const forecast = useMemo(() => {
    if (!activeProject) return null;

    const allDeliverables = activeProject.rooms.flatMap(r => r.deliverables);
    const done = allDeliverables.filter(d => d.status === 'done').length;
    const total = allDeliverables.length;
    const remaining = total - done;

    const snapshots = activeProject.historicalSnapshots ?? [];
    const weeksElapsed = snapshots.length;
    const velocity = weeksElapsed > 0 ? done / weeksElapsed : 0.5;

    const deadline = new Date(activeProject.deadline);
    const today = new Date('2026-04-13');
    const daysToDeadline = Math.max(0, Math.round((deadline.getTime() - today.getTime()) / 86400000));
    const weeksToDeadline = daysToDeadline / 7;

    const weeksNeededAtCurrentVelocity = velocity > 0 ? remaining / velocity : 99;
    const requiredVelocity = weeksToDeadline > 0 ? remaining / weeksToDeadline : 99;

    const onTrackProbability = Math.min(100, Math.max(0, Math.round(
      (velocity / Math.max(requiredVelocity, 0.01)) * 100 * (done / Math.max(total, 1) + 0.3)
    )));

    const p50Days = Math.round(weeksNeededAtCurrentVelocity * 7);
    const p70Days = Math.round(p50Days * 1.15);
    const p95Days = Math.round(p50Days * 1.4);

    return {
      p50Date: formatDate(addDays(today, p50Days)),
      p70Date: formatDate(addDays(today, p70Days)),
      p95Date: formatDate(addDays(today, p95Days)),
      deadlineDate: formatDate(deadline),
      currentVelocity: Math.round(velocity * 10) / 10,
      requiredVelocity: Math.round(requiredVelocity * 10) / 10,
      remainingWork: remaining,
      completedWork: done,
      totalWork: total,
      weeksElapsed,
      weeksToDeadline: Math.round(weeksToDeadline * 10) / 10,
      onTrackProbability,
      p50Days,
      p70Days,
      p95Days,
      daysToDeadline,
    };
  }, [activeProject]);

  if (!activeProject || !forecast) return null;

  const pctDone = Math.round((forecast.completedWork / Math.max(forecast.totalWork, 1)) * 100);

  // Timeline bar data
  const today = new Date('2026-04-13');
  const maxDays = Math.max(forecast.p95Days, forecast.daysToDeadline) + 10;

  const barItems = [
    { label: 'Today', days: 0, color: '#6b7280' },
    { label: `P50 — 50% chance\n${forecast.p50Date}`, days: forecast.p50Days, color: '#3b82f6' },
    { label: `P70 — 70% chance\n${forecast.p70Date}`, days: forecast.p70Days, color: '#a855f7' },
    { label: `Deadline\n${forecast.deadlineDate}`, days: forecast.daysToDeadline, color: '#f59e0b' },
    { label: `P95 — 95% chance\n${forecast.p95Date}`, days: forecast.p95Days, color: '#ef4444' },
  ].sort((a, b) => a.days - b.days);

  return (
    <div className="space-y-5">
      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="text-xs text-muted-foreground font-display mb-2">ON-TRACK PROBABILITY</div>
          <div className={`text-4xl font-display font-bold ${forecast.onTrackProbability >= 70 ? 'text-health-green' : forecast.onTrackProbability >= 45 ? 'text-health-yellow' : 'text-health-red'}`}>
            {forecast.onTrackProbability}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">chance of hitting deadline</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-xs text-muted-foreground font-display mb-2">CURRENT VELOCITY</div>
          <div className="text-4xl font-display font-bold">{forecast.currentVelocity}</div>
          <div className="text-xs text-muted-foreground mt-1">deliverables/week</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-xs text-muted-foreground font-display mb-2">REQUIRED VELOCITY</div>
          <div className={`text-4xl font-display font-bold ${forecast.currentVelocity < forecast.requiredVelocity ? 'text-health-red' : 'text-health-green'}`}>
            {forecast.requiredVelocity}
          </div>
          <div className="text-xs text-muted-foreground mt-1">to hit deadline</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-xs text-muted-foreground font-display mb-2">REMAINING WORK</div>
          <div className="text-4xl font-display font-bold">{forecast.remainingWork}</div>
          <div className="text-xs text-muted-foreground mt-1">of {forecast.totalWork} deliverables</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-display text-muted-foreground uppercase tracking-wider">Delivery Progress</div>
          <div className="text-xs text-muted-foreground">{forecast.completedWork}/{forecast.totalWork} done</div>
        </div>
        <div className="bg-secondary/30 rounded-full h-3">
          <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${pctDone}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>0%</span>
          <span className="font-display text-foreground">{pctDone}% complete</span>
          <span>100%</span>
        </div>
      </div>

      {/* Probability timeline */}
      <div className="glass-card p-5">
        <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">Delivery Probability Timeline</div>
        <div className="relative h-24 bg-secondary/20 rounded-lg overflow-hidden">
          {barItems.map((item, i) => {
            const pct = (item.days / maxDays) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 flex flex-col items-center"
                style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
              >
                <div className="h-full w-0.5 opacity-60" style={{ background: item.color }} />
                <div
                  className="absolute top-2 text-[9px] font-display text-center whitespace-pre-line leading-tight"
                  style={{ color: item.color, minWidth: 60 }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
          {/* Gradient fill */}
          <div className="absolute inset-0 bg-gradient-to-r from-health-green/10 via-health-yellow/10 to-health-red/10 pointer-events-none" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { label: '50% Confidence', date: forecast.p50Date, color: 'text-blue-400', note: 'Best-case scenario' },
            { label: '70% Confidence', date: forecast.p70Date, color: 'text-violet-400', note: 'Realistic estimate' },
            { label: '95% Confidence', date: forecast.p95Date, color: 'text-health-red', note: 'Near-certain delivery' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className={`text-lg font-display font-bold ${item.color}`}>{item.date}</div>
              <div className="text-xs font-display text-muted-foreground mt-0.5">{item.label}</div>
              <div className="text-[10px] text-muted-foreground">{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight box */}
      <div className={`glass-card p-5 border-l-2 ${forecast.onTrackProbability < 50 ? 'border-health-red/50' : forecast.onTrackProbability < 70 ? 'border-health-yellow/50' : 'border-health-green/50'}`}>
        <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-2">Forecast Insight</div>
        {forecast.onTrackProbability < 50 ? (
          <p className="text-sm">At current velocity of <strong>{forecast.currentVelocity}</strong> deliverables/week, you need <strong>{forecast.requiredVelocity}</strong> to hit the deadline. You are running at <strong>{Math.round((forecast.currentVelocity / Math.max(forecast.requiredVelocity, 0.01)) * 100)}%</strong> of required pace. Significant intervention needed to hit the deadline.</p>
        ) : forecast.onTrackProbability < 70 ? (
          <p className="text-sm">Velocity is close to required pace but not there yet. Resolving current blockers could push you over the line. Consider adding capacity or descoping low-priority deliverables.</p>
        ) : (
          <p className="text-sm">You are on track. Maintain current velocity and resolve blockers proactively to keep the 70%+ probability.</p>
        )}
      </div>
    </div>
  );
}

// ─── Risk Heatmap ─────────────────────────────────────────────────────────────

function RiskHeatmap() {
  const { activeProject } = useProject();
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  if (!activeProject) return null;

  const rooms = activeProject.rooms.map(r => {
    const blockerCount = activeProject.blockers.filter(b => b.roomId === r.id).length;
    const criticalBlockers = activeProject.blockers.filter(b => b.roomId === r.id && b.severity === 'critical').length;
    const overdueMilestones = r.milestones.filter(m => m.status === 'overdue' || m.status === 'at_risk').length;
    const hasOwner = r.teamMembers.length > 0;
    const doneRatio = r.deliverables.length > 0
      ? r.deliverables.filter(d => d.status === 'done').length / r.deliverables.length
      : 0;
    const blockedCount = r.deliverables.filter(d => d.status === 'blocked').length;

    const riskScore = Math.min(100,
      criticalBlockers * 20 +
      blockerCount * 8 +
      overdueMilestones * 12 +
      (hasOwner ? 0 : 25) +
      blockedCount * 10 +
      (100 - r.confidence) * 0.3 +
      (100 - r.healthScore) * 0.25
    );

    const riskLevel: 'critical' | 'high' | 'medium' | 'low' =
      riskScore >= 60 ? 'critical' : riskScore >= 35 ? 'high' : riskScore >= 15 ? 'medium' : 'low';

    return { ...r, riskScore: Math.round(riskScore), riskLevel, blockerCount, criticalBlockers, overdueMilestones, hasOwner, doneRatio, blockedCount };
  });

  const sorted = [...rooms].sort((a, b) => b.riskScore - a.riskScore);

  const riskColors: Record<string, string> = {
    critical: 'bg-health-red/20 border-health-red/40 text-health-red',
    high: 'bg-health-yellow/20 border-health-yellow/40 text-health-yellow',
    medium: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    low: 'bg-health-green/10 border-health-green/30 text-health-green',
  };

  const riskBarColors: Record<string, string> = {
    critical: 'bg-health-red',
    high: 'bg-health-yellow',
    medium: 'bg-blue-500',
    low: 'bg-health-green',
  };

  return (
    <div className="space-y-5">
      {/* Grid heatmap */}
      <div className="glass-card p-5">
        <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">Risk Heatmap — All Rooms</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sorted.map(r => (
            <motion.div
              key={r.id}
              onHoverStart={() => setHoveredRoom(r.id)}
              onHoverEnd={() => setHoveredRoom(null)}
              className={`relative p-4 rounded-xl border cursor-default transition-all ${riskColors[r.riskLevel]} ${hoveredRoom === r.id ? 'scale-[1.02]' : ''}`}
              style={{ transition: 'transform 0.15s' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{r.icon}</span>
                  <span className="text-sm font-display font-medium text-foreground">{r.name}</span>
                </div>
                <span className={`text-[10px] font-display px-1.5 py-0.5 rounded uppercase font-bold ${riskColors[r.riskLevel]}`}>
                  {r.riskLevel}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Risk score</span>
                  <span className="font-display font-bold">{r.riskScore}/100</span>
                </div>
                <div className="bg-black/20 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${riskBarColors[r.riskLevel]}`} style={{ width: `${r.riskScore}%` }} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <div>🔴 {r.criticalBlockers} critical</div>
                <div>⚠️ {r.blockerCount} blockers</div>
                <div>{r.hasOwner ? '✅ Staffed' : '❌ No owner'}</div>
                <div>📊 {Math.round(r.doneRatio * 100)}% done</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ranked list with risk factors */}
      <div className="glass-card p-5">
        <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">Risk Ranking — Highest to Lowest</div>
        <div className="space-y-3">
          {sorted.map((r, i) => (
            <div key={r.id} className="flex items-center gap-4">
              <div className="text-2xl font-display text-muted-foreground/30 w-6 text-right">{i + 1}</div>
              <div className="flex items-center gap-2 w-36">
                <span>{r.icon}</span>
                <span className="text-sm font-medium truncate">{r.name}</span>
              </div>
              <div className="flex-1 bg-secondary/30 rounded-full h-2">
                <div className={`h-2 rounded-full ${riskBarColors[r.riskLevel]}`} style={{ width: `${r.riskScore}%` }} />
              </div>
              <div className="w-10 text-right text-sm font-display">{r.riskScore}</div>
              <HealthBadge status={r.healthStatus} />
            </div>
          ))}
        </div>
      </div>

      {/* Red flags */}
      {activeProject.redFlags.filter(rf => !rf.acknowledged).length > 0 && (
        <div className="glass-card p-5">
          <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">🚩 Active Red Flags Contributing to Risk</div>
          <div className="space-y-2">
            {activeProject.redFlags.filter(rf => !rf.acknowledged).map(rf => (
              <div key={rf.id} className={`flex items-start gap-3 p-3 rounded-lg border ${rf.severity === 'critical' ? 'border-health-red/30 bg-health-red/5' : rf.severity === 'warning' ? 'border-health-yellow/30 bg-health-yellow/5' : 'border-border bg-secondary/20'}`}>
                <span className={`text-[10px] font-display px-1.5 py-0.5 rounded uppercase flex-shrink-0 mt-0.5 ${rf.severity === 'critical' ? 'bg-health-red/20 text-health-red' : rf.severity === 'warning' ? 'bg-health-yellow/20 text-health-yellow' : 'bg-secondary text-muted-foreground'}`}>
                  {rf.severity}
                </span>
                <div>
                  <div className="text-sm font-medium">{rf.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{rf.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pattern Matching ─────────────────────────────────────────────────────────

function PatternMatching() {
  const { activeProject } = useProject();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  if (!activeProject) return null;

  const patterns = historicalPatterns;
  const topMatch = patterns[0];

  const outcomeColor = (o: string) =>
    o === 'slipped' ? 'text-health-red' :
    o === 'delivered_on_time' ? 'text-health-green' :
    'text-primary';

  const outcomeLabel = (o: string, days?: number) =>
    o === 'slipped' ? `Slipped ${days}d` :
    o === 'delivered_on_time' ? 'On Time' :
    'Early';

  return (
    <div className="space-y-5">
      {/* Top match highlight */}
      <motion.div
        className="glass-card p-5 border border-health-yellow/20 bg-health-yellow/5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔮</span>
          <div className="text-xs font-display text-health-yellow uppercase tracking-wider">Strongest Pattern Match</div>
          <span className="ml-auto text-xs font-display text-health-yellow bg-health-yellow/10 px-2 py-0.5 rounded">{topMatch.similarity}% similar</span>
        </div>
        <div className="text-base font-medium mb-1">{topMatch.projectName}</div>
        <div className="text-sm text-muted-foreground mb-3">{topMatch.warningPattern}</div>
        <div className={`inline-flex items-center gap-1.5 text-sm font-display font-bold ${outcomeColor(topMatch.outcome)} bg-current/10 px-3 py-1 rounded-lg`} style={{ color: undefined }}>
          <span className={outcomeColor(topMatch.outcome)}>
            {outcomeLabel(topMatch.outcome, topMatch.slipDays)} — {topMatch.outcome === 'slipped' ? '⚠️' : '✅'}
          </span>
        </div>
        <div className="mt-3 p-3 bg-secondary/30 rounded-lg border-l-2 border-health-yellow/40">
          <div className="text-xs font-display text-muted-foreground mb-1 uppercase tracking-wider">Recommended Action</div>
          <div className="text-sm">{topMatch.recommendation}</div>
        </div>
      </motion.div>

      {/* All matches */}
      <div className="glass-card p-5">
        <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">All Pattern Matches — Ranked by Similarity</div>
        <div className="space-y-3">
          {patterns.map((p, i) => (
            <div key={i} className="border border-border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-left"
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              >
                <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-display font-bold">{p.similarity}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{p.projectName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{p.warningPattern}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm font-display font-bold ${outcomeColor(p.outcome)}`}>
                    {outcomeLabel(p.outcome, p.slipDays)}
                  </span>
                  <div className="bg-secondary/30 rounded-full h-1.5 w-24">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${p.similarity}%` }} />
                  </div>
                  <span className="text-muted-foreground text-xs">{expandedIdx === i ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedIdx === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border bg-secondary/10 p-4 space-y-3"
                >
                  <div>
                    <div className="text-[10px] font-display text-muted-foreground uppercase tracking-wider mb-2">Matching Risk Factors</div>
                    <div className="flex flex-wrap gap-2">
                      {p.riskFactors.map((rf, j) => (
                        <span key={j} className="text-xs bg-health-red/10 text-health-red border border-health-red/20 px-2 py-0.5 rounded-full">
                          {rf}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg border-l-2 border-primary/40">
                    <div className="text-[10px] font-display text-muted-foreground uppercase tracking-wider mb-1">Recommendation</div>
                    <div className="text-sm">{p.recommendation}</div>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Historical context */}
      <div className="glass-card p-5">
        <div className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">Pattern Analysis Summary</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-display font-bold text-health-red">{patterns.filter(p => p.outcome === 'slipped').length}</div>
            <div className="text-xs text-muted-foreground mt-1">Similar projects slipped</div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-health-green">{patterns.filter(p => p.outcome === 'delivered_on_time' || p.outcome === 'delivered_early').length}</div>
            <div className="text-xs text-muted-foreground mt-1">Delivered on time</div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-health-yellow">
              {Math.round(patterns.filter(p => p.slipDays).reduce((s, p) => s + (p.slipDays ?? 0), 0) / Math.max(patterns.filter(p => p.slipDays).length, 1))}d
            </div>
            <div className="text-xs text-muted-foreground mt-1">Avg slip when slipped</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-secondary/20 rounded-lg text-sm text-muted-foreground">
          <strong className="text-foreground">Bottom line:</strong> Projects with this pattern at week 3 slipped 67% of the time. The common intervention that worked: contracting out the blocked dependency within 48 hours of identifying it.
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'forecast' | 'heatmap' | 'patterns';

const tabs: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'forecast', label: 'Delivery Forecast', icon: '🎯', desc: 'Probability-based delivery dates' },
  { id: 'heatmap', label: 'Risk Heatmap', icon: '🌡', desc: 'Real-time room risk status' },
  { id: 'patterns', label: 'Pattern Matching', icon: '🔮', desc: 'Learn from past projects' },
];

export default function PredictivePage() {
  const { activeProject } = useProject();
  const [activeTab, setActiveTab] = useState<Tab>('forecast');

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
          <h1 className="text-2xl font-display font-bold">Predictive Layer</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeProject.name} — See what's coming before it happens</p>
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
          {activeTab === 'forecast' && <DeliveryForecast />}
          {activeTab === 'heatmap' && <RiskHeatmap />}
          {activeTab === 'patterns' && <PatternMatching />}
        </motion.div>
      </div>
    </AppLayout>
  );
}
