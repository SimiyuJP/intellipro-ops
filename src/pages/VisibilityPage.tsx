import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { HealthBadge } from '@/components/HealthBadge';
import { HistoricalSnapshot, Deliverable } from '@/types/project';

// ─── Stakeholder Lens ───────────────────────────────────────────────────────

type Lens = 'ceo' | 'tech_lead' | 'finance';

const lensConfig: Record<Lens, { label: string; icon: string; description: string; color: string }> = {
  ceo: {
    label: 'CEO View',
    icon: '👔',
    description: 'Strategic overview: health, risk, forecast',
    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  },
  tech_lead: {
    label: 'Tech Lead View',
    icon: '🛠',
    description: 'Blockers, dependencies, engineering status',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  },
  finance: {
    label: 'Finance View',
    icon: '💰',
    description: 'Burn rate, budget tracking, cost forecast',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  },
};

function StakeholderLens() {
  const { activeProject } = useProject();
  const [lens, setLens] = useState<Lens>('ceo');

  if (!activeProject) return null;

  const allDeliverables = activeProject.rooms.flatMap(r => r.deliverables);
  const done = allDeliverables.filter(d => d.status === 'done').length;
  const total = allDeliverables.length;
  const blocked = allDeliverables.filter(d => d.status === 'blocked').length;
  const criticalBlockers = activeProject.blockers.filter(b => b.severity === 'critical');
  const atRiskMilestones = activeProject.milestones.filter(m => m.status === 'at_risk' || m.status === 'overdue');
  const snapshots = activeProject.historicalSnapshots ?? [];
  const latestBurnRate = snapshots[snapshots.length - 1]?.burnRate ?? 2600;
  const totalBurned = snapshots.reduce((s, sn) => s + sn.burnRate, 0);
  const budgetNum = parseInt(activeProject.budget.replace(/[^0-9]/g, ''), 10);
  const remainingBudget = budgetNum - totalBurned;
  const weeksToDeadline = Math.round((new Date(activeProject.deadline).getTime() - Date.now()) / (7 * 86400000));

  return (
    <div className="space-y-6">
      {/* Lens selector */}
      <div className="flex gap-3 flex-wrap">
        {(Object.keys(lensConfig) as Lens[]).map(l => (
          <button
            key={l}
            onClick={() => setLens(l)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-display border transition-all ${
              lens === l
                ? lensConfig[l].color
                : 'text-muted-foreground border-border hover:text-foreground hover:bg-secondary/40'
            }`}
          >
            <span>{lensConfig[l].icon}</span>
            {lensConfig[l].label}
          </button>
        ))}
      </div>

      <motion.div key={lens} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="text-xs text-muted-foreground mb-4 font-display uppercase tracking-wider">
          {lensConfig[lens].description}
        </div>

        {/* CEO VIEW */}
        {lens === 'ceo' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-5">
                <div className="text-xs text-muted-foreground font-display mb-2">PROJECT HEALTH</div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-display font-bold">{activeProject.healthScore}</div>
                  <HealthBadge status={activeProject.healthStatus} />
                </div>
                <div className="text-xs text-muted-foreground mt-2">{activeProject.name}</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-muted-foreground font-display mb-2">DEADLINE</div>
                <div className="text-3xl font-display font-bold">{weeksToDeadline}w</div>
                <div className="text-xs text-muted-foreground mt-2">remaining · {activeProject.deadline}</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-muted-foreground font-display mb-2">DELIVERY RISK</div>
                <div className={`text-3xl font-display font-bold ${criticalBlockers.length > 0 ? 'text-health-red' : 'text-health-yellow'}`}>
                  {criticalBlockers.length > 0 ? 'HIGH' : 'MED'}
                </div>
                <div className="text-xs text-muted-foreground mt-2">{criticalBlockers.length} critical blocker{criticalBlockers.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="text-xs text-muted-foreground font-display mb-4 uppercase tracking-wider">Executive Summary</div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-health-green mt-0.5">▸</span>
                  <span>{done}/{total} deliverables completed ({Math.round((done / total) * 100)}% done)</span>
                </li>
                {atRiskMilestones.map(m => (
                  <li key={m.id} className="flex items-start gap-2 text-sm">
                    <span className="text-health-yellow mt-0.5">▸</span>
                    <span>Milestone at risk: <strong>{m.title}</strong> · due {m.dueDate}</span>
                  </li>
                ))}
                {criticalBlockers.map(b => (
                  <li key={b.id} className="flex items-start gap-2 text-sm">
                    <span className="text-health-red mt-0.5">▸</span>
                    <span>Critical blocker: <strong>{b.title}</strong> · owner: {b.owner}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground mt-0.5">▸</span>
                  <span>Budget spent: ~${totalBurned.toLocaleString()} of {activeProject.budget}</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-5">
              <div className="text-xs text-muted-foreground font-display mb-3 uppercase tracking-wider">Rooms at a Glance</div>
              <div className="space-y-2">
                {activeProject.rooms.map(r => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="w-5 text-center">{r.icon}</span>
                    <span className="text-sm w-28 truncate">{r.name}</span>
                    <div className="flex-1 bg-secondary/30 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${r.healthStatus === 'green' ? 'bg-health-green' : r.healthStatus === 'yellow' ? 'bg-health-yellow' : 'bg-health-red'}`}
                        style={{ width: `${r.healthScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{r.healthScore}</span>
                    <HealthBadge status={r.healthStatus} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TECH LEAD VIEW */}
        {lens === 'tech_lead' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-5">
                <div className="text-xs text-muted-foreground font-display mb-2">ACTIVE BLOCKERS</div>
                <div className={`text-3xl font-display font-bold ${activeProject.blockers.length > 3 ? 'text-health-red' : 'text-health-yellow'}`}>
                  {activeProject.blockers.length}
                </div>
                <div className="text-xs text-muted-foreground mt-2">{criticalBlockers.length} critical</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-muted-foreground font-display mb-2">BLOCKED DELIVERABLES</div>
                <div className="text-3xl font-display font-bold text-health-red">{blocked}</div>
                <div className="text-xs text-muted-foreground mt-2">of {total} total</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-muted-foreground font-display mb-2">VELOCITY</div>
                <div className="text-3xl font-display font-bold">{done}</div>
                <div className="text-xs text-muted-foreground mt-2">deliverables done / {total} total</div>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="text-xs text-muted-foreground font-display mb-3 uppercase tracking-wider">All Blockers</div>
              <div className="space-y-3">
                {activeProject.blockers.map(b => (
                  <div key={b.id} className={`flex items-start gap-3 p-3 rounded-lg border ${b.severity === 'critical' ? 'border-health-red/30 bg-health-red/5' : b.severity === 'high' ? 'border-health-yellow/30 bg-health-yellow/5' : 'border-border bg-secondary/20'}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${b.severity === 'critical' ? 'bg-health-red' : b.severity === 'high' ? 'bg-health-yellow' : 'bg-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{b.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{b.description}</div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">Owner: {b.owner}</span>
                        <span className="text-xs text-muted-foreground">Since: {b.createdAt}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-display px-1.5 py-0.5 rounded uppercase ${b.severity === 'critical' ? 'text-health-red bg-health-red/10' : b.severity === 'high' ? 'text-health-yellow bg-health-yellow/10' : 'text-muted-foreground bg-secondary'}`}>
                      {b.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="text-xs text-muted-foreground font-display mb-3 uppercase tracking-wider">Cross-Room Dependencies</div>
              <div className="space-y-2">
                {allDeliverables.filter(d => d.dependencies.length > 0).map(d => {
                  const room = activeProject.rooms.find(r => r.id === d.roomId);
                  const deps = d.dependencies.map(depId => allDeliverables.find(x => x.id === depId)).filter(Boolean) as Deliverable[];
                  return (
                    <div key={d.id} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{room?.icon}</span>
                      <span className="font-medium truncate">{d.title}</span>
                      <span className="text-muted-foreground">←</span>
                      <span className="text-muted-foreground truncate">{deps.map(dep => dep.title).join(', ')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* FINANCE VIEW */}
        {lens === 'finance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-5">
                <div className="text-xs text-muted-foreground font-display mb-2">TOTAL BUDGET</div>
                <div className="text-3xl font-display font-bold">{activeProject.budget}</div>
                <div className="text-xs text-muted-foreground mt-2">approved</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-muted-foreground font-display mb-2">SPENT TO DATE</div>
                <div className="text-3xl font-display font-bold text-health-yellow">${totalBurned.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-2">{Math.round((totalBurned / budgetNum) * 100)}% of budget</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-muted-foreground font-display mb-2">WEEKLY BURN</div>
                <div className="text-3xl font-display font-bold">${latestBurnRate.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-2">current week</div>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="text-xs text-muted-foreground font-display mb-4 uppercase tracking-wider">Budget Burn Over Time</div>
              <div className="space-y-3">
                {snapshots.map((sn, i) => {
                  const cumulative = snapshots.slice(0, i + 1).reduce((s, x) => s + x.burnRate, 0);
                  const pct = Math.min(100, Math.round((cumulative / budgetNum) * 100));
                  return (
                    <div key={sn.date} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{sn.weekLabel} · {sn.date}</span>
                        <span className="font-medium">${cumulative.toLocaleString()} <span className="text-muted-foreground">({pct}%)</span></span>
                      </div>
                      <div className="bg-secondary/30 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${pct > 80 ? 'bg-health-red' : pct > 55 ? 'bg-health-yellow' : 'bg-health-green'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="text-xs text-muted-foreground font-display mb-3 uppercase tracking-wider">Forecast</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Remaining Budget</div>
                  <div className={`text-2xl font-display font-bold mt-1 ${remainingBudget < 2000 ? 'text-health-red' : remainingBudget < 5000 ? 'text-health-yellow' : 'text-health-green'}`}>
                    ${remainingBudget.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Weeks Remaining</div>
                  <div className="text-2xl font-display font-bold mt-1">{weeksToDeadline}w</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Projected Final Cost</div>
                  <div className="text-2xl font-display font-bold mt-1 text-health-yellow">
                    ${(totalBurned + latestBurnRate * weeksToDeadline).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Budget Status</div>
                  <div className={`text-2xl font-display font-bold mt-1 ${totalBurned + latestBurnRate * weeksToDeadline > budgetNum ? 'text-health-red' : 'text-health-green'}`}>
                    {totalBurned + latestBurnRate * weeksToDeadline > budgetNum ? 'OVER' : 'OK'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Timeline Replay ──────────────────────────────────────────────────────────

function TimelineReplay() {
  const { activeProject } = useProject();
  const snapshots = activeProject?.historicalSnapshots ?? [];
  const [selectedIdx, setSelectedIdx] = useState(snapshots.length - 1);
  const snapshot: HistoricalSnapshot | undefined = snapshots[selectedIdx];

  if (!activeProject || snapshots.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-muted-foreground">
        No historical snapshots available for this project.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scrubber */}
      <div className="glass-card p-5">
        <div className="text-xs text-muted-foreground font-display mb-4 uppercase tracking-wider">Time Machine — Scrub Project History</div>
        <div className="flex gap-2 flex-wrap">
          {snapshots.map((sn, i) => (
            <button
              key={sn.date}
              onClick={() => setSelectedIdx(i)}
              className={`px-3 py-2 rounded-lg text-sm font-display border transition-all ${
                i === selectedIdx
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-muted-foreground border-border hover:text-foreground hover:bg-secondary/40'
              }`}
            >
              {sn.weekLabel}
              <div className="text-[10px] text-muted-foreground mt-0.5">{sn.date}</div>
            </button>
          ))}
          <button
            onClick={() => setSelectedIdx(snapshots.length)}
            className={`px-3 py-2 rounded-lg text-sm font-display border transition-all ${
              selectedIdx === snapshots.length
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-muted-foreground border-border hover:text-foreground hover:bg-secondary/40'
            }`}
          >
            NOW
            <div className="text-[10px] text-muted-foreground mt-0.5">current</div>
          </button>
        </div>
      </div>

      {selectedIdx === snapshots.length ? (
        /* Current state */
        <motion.div key="now" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="text-xs text-muted-foreground font-display mb-1">HEALTH SCORE</div>
              <div className="text-2xl font-display font-bold">{activeProject.healthScore}</div>
              <HealthBadge status={activeProject.healthStatus} />
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-muted-foreground font-display mb-1">DELIVERABLES</div>
              <div className="text-2xl font-display font-bold">
                {activeProject.rooms.flatMap(r => r.deliverables).filter(d => d.status === 'done').length}
                <span className="text-sm text-muted-foreground">/{activeProject.rooms.flatMap(r => r.deliverables).length}</span>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-muted-foreground font-display mb-1">BLOCKERS</div>
              <div className="text-2xl font-display font-bold text-health-red">{activeProject.blockers.length}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-muted-foreground font-display mb-1">STATUS</div>
              <div className="text-sm font-display font-bold text-primary mt-1">LIVE</div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="text-xs text-muted-foreground font-display mb-3">Current room health</div>
            <div className="space-y-2">
              {activeProject.rooms.map(r => (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="w-5 text-center">{r.icon}</span>
                  <span className="text-sm w-28 truncate">{r.name}</span>
                  <div className="flex-1 bg-secondary/30 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${r.healthStatus === 'green' ? 'bg-health-green' : r.healthStatus === 'yellow' ? 'bg-health-yellow' : 'bg-health-red'}`} style={{ width: `${r.healthScore}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{r.healthScore}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : snapshot ? (
        <motion.div key={snapshot.date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {snapshot.note && (
            <div className="glass-card p-4 border-l-2 border-primary/40">
              <div className="text-xs text-muted-foreground font-display mb-1">SNAPSHOT NOTE</div>
              <div className="text-sm">{snapshot.note}</div>
            </div>
          )}
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="text-xs text-muted-foreground font-display mb-1">HEALTH SCORE</div>
              <div className="text-2xl font-display font-bold">{snapshot.healthScore}</div>
              <HealthBadge status={snapshot.healthStatus} />
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-muted-foreground font-display mb-1">DELIVERABLES</div>
              <div className="text-2xl font-display font-bold">
                {snapshot.completedDeliverables}<span className="text-sm text-muted-foreground">/{snapshot.totalDeliverables}</span>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-muted-foreground font-display mb-1">BLOCKERS</div>
              <div className={`text-2xl font-display font-bold ${snapshot.activeBlockers > 3 ? 'text-health-red' : snapshot.activeBlockers > 0 ? 'text-health-yellow' : 'text-health-green'}`}>
                {snapshot.activeBlockers}
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-muted-foreground font-display mb-1">CONFIDENCE</div>
              <div className={`text-2xl font-display font-bold ${snapshot.confidence < 50 ? 'text-health-red' : snapshot.confidence < 70 ? 'text-health-yellow' : 'text-health-green'}`}>
                {snapshot.confidence}%
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="text-xs text-muted-foreground font-display mb-3">Room health at {snapshot.weekLabel}</div>
            <div className="space-y-2">
              {snapshot.rooms.map(r => {
                const currentRoom = activeProject.rooms.find(ar => ar.id === r.id);
                const delta = currentRoom ? r.healthScore - currentRoom.healthScore : 0;
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="text-sm w-28 truncate text-muted-foreground">{r.name}</span>
                    <div className="flex-1 bg-secondary/30 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${r.healthStatus === 'green' ? 'bg-health-green' : r.healthStatus === 'yellow' ? 'bg-health-yellow' : 'bg-health-red'}`} style={{ width: `${r.healthScore}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{r.healthScore}</span>
                    {delta !== 0 && (
                      <span className={`text-[10px] font-display ${delta > 0 ? 'text-health-green' : 'text-health-red'}`}>
                        {delta > 0 ? `+${delta}` : delta} vs now
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <div className="text-xs text-muted-foreground font-display mb-1">FORECASTED DELIVERY</div>
              <div className="text-lg font-display font-bold">{snapshot.forecastedDelivery}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-muted-foreground font-display mb-1">WEEKLY BURN RATE</div>
              <div className="text-lg font-display font-bold">${snapshot.burnRate.toLocaleString()}</div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

// ─── Dependency Graph ─────────────────────────────────────────────────────────

type DepNode = {
  id: string;
  title: string;
  room: string;
  roomIcon: string;
  status: Deliverable['status'];
  x: number;
  y: number;
  layer: number;
};

function statusColor(status: Deliverable['status']) {
  if (status === 'done') return '#22c55e';
  if (status === 'in_progress') return '#3b82f6';
  if (status === 'blocked') return '#ef4444';
  return '#6b7280';
}

function DependencyGraph() {
  const { activeProject } = useProject();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    if (!activeProject) return { nodes: [], edges: [] };

    const allDeliverables = activeProject.rooms.flatMap(r =>
      r.deliverables.map(d => ({ ...d, roomName: r.name, roomIcon: r.icon }))
    );

    // Compute layers (topological sort by dependency depth)
    const layerMap: Record<string, number> = {};
    const getLayer = (id: string, visited = new Set<string>()): number => {
      if (layerMap[id] !== undefined) return layerMap[id];
      if (visited.has(id)) return 0;
      visited.add(id);
      const d = allDeliverables.find(x => x.id === id);
      if (!d || d.dependencies.length === 0) {
        layerMap[id] = 0;
        return 0;
      }
      const maxDep = Math.max(...d.dependencies.map(dep => getLayer(dep, new Set(visited))));
      layerMap[id] = maxDep + 1;
      return layerMap[id];
    };
    allDeliverables.forEach(d => getLayer(d.id));

    const maxLayer = Math.max(...Object.values(layerMap), 0);
    const layerCounts: Record<number, number> = {};
    const layerIdx: Record<number, number> = {};
    allDeliverables.forEach(d => {
      const l = layerMap[d.id] ?? 0;
      layerCounts[l] = (layerCounts[l] ?? 0) + 1;
    });

    const WIDTH = 820;
    const HEIGHT = 420;
    const PADDING = 60;

    const nodes: DepNode[] = allDeliverables.map(d => {
      const layer = layerMap[d.id] ?? 0;
      layerIdx[layer] = (layerIdx[layer] ?? 0);
      const idx = layerIdx[layer];
      layerIdx[layer]++;
      const count = layerCounts[layer] ?? 1;
      const x = PADDING + (layer / Math.max(maxLayer, 1)) * (WIDTH - PADDING * 2);
      const y = PADDING + (idx / Math.max(count - 1, 1)) * (HEIGHT - PADDING * 2);
      return {
        id: d.id,
        title: d.title,
        room: d.roomName,
        roomIcon: d.roomIcon,
        status: d.status,
        x: isNaN(x) ? WIDTH / 2 : x,
        y: isNaN(y) ? HEIGHT / 2 : y,
        layer,
      };
    });

    const edges = allDeliverables.flatMap(d =>
      d.dependencies.map(depId => ({ from: depId, to: d.id }))
    );

    return { nodes, edges };
  }, [activeProject]);

  if (!activeProject) return null;

  const NODE_W = 130;
  const NODE_H = 44;
  const hoveredNode = nodes.find(n => n.id === hoveredId);
  const highlightedIds = hoveredId
    ? new Set([
        hoveredId,
        ...edges.filter(e => e.from === hoveredId || e.to === hoveredId).flatMap(e => [e.from, e.to]),
      ])
    : null;

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">Deliverable Dependency Graph</div>
          <div className="flex gap-4 text-[10px] font-display">
            {[['done', '#22c55e', 'Done'], ['in_progress', '#3b82f6', 'In Progress'], ['blocked', '#ef4444', 'Blocked'], ['not_started', '#6b7280', 'Not Started']].map(([s, c, l]) => (
              <div key={s} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: c as string }} />
                <span className="text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground mb-3">Hover a node to highlight its dependencies. Arrows show "requires" direction.</div>

        <div className="overflow-x-auto">
          <svg width={840} height={440} className="font-sans">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#4b5563" />
              </marker>
              <marker id="arrow-highlight" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((e, i) => {
              const from = nodes.find(n => n.id === e.from);
              const to = nodes.find(n => n.id === e.to);
              if (!from || !to) return null;
              const isHighlighted = highlightedIds?.has(e.from) && highlightedIds?.has(e.to);
              const x1 = from.x + NODE_W;
              const y1 = from.y + NODE_H / 2;
              const x2 = to.x;
              const y2 = to.y + NODE_H / 2;
              const cx = (x1 + x2) / 2;
              return (
                <path
                  key={i}
                  d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                  stroke={isHighlighted ? '#ef4444' : '#374151'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeOpacity={highlightedIds && !isHighlighted ? 0.15 : 0.7}
                  fill="none"
                  markerEnd={`url(#${isHighlighted ? 'arrow-highlight' : 'arrow'})`}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(n => {
              const col = statusColor(n.status);
              const isHov = n.id === hoveredId;
              const isDimmed = highlightedIds && !highlightedIds.has(n.id);
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  onMouseEnter={() => setHoveredId(n.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: 'pointer', opacity: isDimmed ? 0.25 : 1 }}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={6}
                    fill="#1a1f2e"
                    stroke={isHov ? col : '#2d3748'}
                    strokeWidth={isHov ? 2 : 1}
                  />
                  <rect width={3} height={NODE_H} rx={1.5} fill={col} />
                  <text x={10} y={14} fontSize={9} fill="#9ca3af" fontFamily="monospace">
                    {n.roomIcon} {n.room}
                  </text>
                  <foreignObject x={8} y={18} width={116} height={22}>
                    <div style={{ fontSize: 10, color: '#e5e7eb', lineHeight: '11px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {n.title}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tooltip / detail */}
      {hoveredNode && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: statusColor(hoveredNode.status) }} />
            <span className="font-display text-sm font-medium">{hoveredNode.title}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{hoveredNode.roomIcon} {hoveredNode.room}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div>
              <div className="font-display uppercase tracking-wider mb-1 text-[10px]">Depends on</div>
              {edges.filter(e => e.to === hoveredNode.id).map(e => {
                const dep = activeProject!.rooms.flatMap(r => r.deliverables).find(d => d.id === e.from);
                return dep ? <div key={e.from} className="text-foreground">· {dep.title}</div> : null;
              })}
              {edges.filter(e => e.to === hoveredNode.id).length === 0 && <div>None</div>}
            </div>
            <div>
              <div className="font-display uppercase tracking-wider mb-1 text-[10px]">Unlocks</div>
              {edges.filter(e => e.from === hoveredNode.id).map(e => {
                const dep = activeProject!.rooms.flatMap(r => r.deliverables).find(d => d.id === e.to);
                return dep ? <div key={e.to} className="text-foreground">· {dep.title}</div> : null;
              })}
              {edges.filter(e => e.from === hoveredNode.id).length === 0 && <div>None</div>}
            </div>
            <div>
              <div className="font-display uppercase tracking-wider mb-1 text-[10px]">Status</div>
              <div className="capitalize text-foreground">{hoveredNode.status.replace('_', ' ')}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'lens' | 'timeline' | 'graph';

const tabs: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'lens', label: 'Stakeholder Lens', icon: '👁', desc: 'Same data, different views' },
  { id: 'timeline', label: 'Timeline Replay', icon: '⏪', desc: 'Scrub project history' },
  { id: 'graph', label: 'Dependency Graph', icon: '🕸', desc: 'Critical chain map' },
];

export default function VisibilityPage() {
  const { activeProject } = useProject();
  const [activeTab, setActiveTab] = useState<Tab>('lens');

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
          <h1 className="text-2xl font-display font-bold">Visibility Layer</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeProject.name} — Understand your project from every angle</p>
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
          {activeTab === 'lens' && <StakeholderLens />}
          {activeTab === 'timeline' && <TimelineReplay />}
          {activeTab === 'graph' && <DependencyGraph />}
        </motion.div>
      </div>
    </AppLayout>
  );
}
