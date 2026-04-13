import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { computeDrift, analyzeAssumptions, generateSignals, filterSignals, DriftAnalysis } from '@/lib/intelligence';
import { HealthBadge } from '@/components/HealthBadge';
import { Signal, Assumption } from '@/types/project';

function DriftStatusBadge({ status }: { status: DriftAnalysis['status'] }) {
  const cls = {
    on_track: 'text-health-green bg-health-green/10',
    slight_drift: 'text-health-yellow bg-health-yellow/10',
    significant_drift: 'text-health-red bg-health-red/10',
    critical_drift: 'text-health-red bg-health-red/20 animate-pulse',
  }[status];
  return (
    <span className={`text-[10px] font-display px-2 py-0.5 rounded ${cls}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const cls = severity === 'critical' ? 'bg-health-red' : severity === 'high' ? 'bg-health-yellow' : 'bg-muted-foreground/50';
  return <span className={`w-2 h-2 rounded-full inline-block ${cls}`} />;
}

function AssumptionStatusBadge({ status }: { status: Assumption['status'] }) {
  const cls = {
    active: 'text-primary bg-primary/10',
    validated: 'text-health-green bg-health-green/10',
    broken: 'text-health-red bg-health-red/10',
    retired: 'text-muted-foreground bg-muted/50',
  }[status];
  return (
    <span className={`text-[10px] font-display px-1.5 py-0.5 rounded ${cls}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default function IntelligencePage() {
  const { activeProject } = useProject();
  const [signalThreshold, setSignalThreshold] = useState(30);
  const [activeTab, setActiveTab] = useState<'drift' | 'assumptions' | 'signals'>('drift');

  if (!activeProject) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-muted-foreground">No project selected.</div>
      </AppLayout>
    );
  }

  const drift = computeDrift(activeProject);
  const assumptions = analyzeAssumptions(activeProject);
  const allSignals = generateSignals(activeProject);
  const signals = filterSignals(allSignals, signalThreshold);

  const tabs = [
    { id: 'drift' as const, label: 'Drift Detection', icon: '📐', count: drift.status !== 'on_track' ? 1 : 0 },
    { id: 'assumptions' as const, label: 'Assumptions', icon: '🧪', count: assumptions.broken + assumptions.unvalidated.length },
    { id: 'signals' as const, label: 'Signal Feed', icon: '📡', count: signals.length },
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Intelligence Layer</h1>
            <p className="text-sm text-muted-foreground mt-1">{activeProject.name} — Evidence-based project intelligence</p>
          </div>
          <DriftStatusBadge status={drift.status} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
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
              {t.count > 0 && (
                <span className="text-[10px] bg-health-red/20 text-health-red px-1.5 py-0.5 rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* DRIFT TAB */}
        {activeTab === 'drift' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Drift Summary Card */}
            <div className="glass-card-elevated p-6">
              <div className="grid grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-display font-bold">{drift.currentPercent}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Actual Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-muted-foreground">{drift.expectedPercent}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Expected by Now</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-display font-bold ${drift.driftPercent > 0 ? 'text-health-red' : 'text-health-green'}`}>
                    {drift.driftPercent > 0 ? '-' : '+'}{Math.abs(drift.driftPercent)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Drift</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-display font-bold ${drift.willMissDeadline ? 'text-health-red' : 'text-health-green'}`}>
                    {drift.driftDays > 0 ? `${drift.driftDays}d` : 'On time'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{drift.driftDays > 0 ? 'Behind' : 'Status'}</div>
                </div>
              </div>

              <div className="bg-secondary/20 rounded-lg p-4 text-sm">
                {drift.summary}
              </div>
            </div>

            {/* Velocity & Projection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h3 className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-4">Velocity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current velocity</span>
                    <span className="font-display font-bold">{drift.velocityPerWeek}%/week</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Required velocity</span>
                    <span className={`font-display font-bold ${drift.requiredVelocityPerWeek > drift.velocityPerWeek * 1.5 ? 'text-health-red' : 'text-foreground'}`}>
                      {drift.requiredVelocityPerWeek}%/week
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${drift.velocityPerWeek >= drift.requiredVelocityPerWeek ? 'bg-health-green' : 'bg-health-yellow'}`}
                      style={{ width: `${Math.min(100, (drift.velocityPerWeek / Math.max(1, drift.requiredVelocityPerWeek)) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center">
                    {Math.round((drift.velocityPerWeek / Math.max(1, drift.requiredVelocityPerWeek)) * 100)}% of required pace
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-4">Projection</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Deadline</span>
                    <span className="font-display font-bold">{drift.deadline}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Projected completion</span>
                    <span className={`font-display font-bold ${drift.willMissDeadline ? 'text-health-red' : 'text-health-green'}`}>
                      {drift.projectedCompletionDate}
                    </span>
                  </div>
                  {drift.willMissDeadline && (
                    <div className="bg-health-red/10 border border-health-red/20 rounded p-2 text-xs text-health-red">
                      ⚠ At current pace, this project will miss its deadline.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drift Timeline */}
            <div className="glass-card p-5">
              <h3 className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-4">Planned vs Actual Timeline</h3>
              <div className="space-y-2">
                {drift.snapshots.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-muted-foreground w-24 font-display">{s.date}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden relative">
                        <div className="absolute h-full bg-muted-foreground/30 rounded-full" style={{ width: `${s.plannedPercent}%` }} />
                        <div className={`absolute h-full rounded-full ${s.actualPercent >= s.plannedPercent ? 'bg-health-green' : 'bg-health-yellow'}`} style={{ width: `${s.actualPercent}%` }} />
                      </div>
                      <span className="text-[10px] font-display w-20 text-right">
                        <span className={s.actualPercent >= s.plannedPercent ? 'text-health-green' : 'text-health-yellow'}>{s.actualPercent}%</span>
                        <span className="text-muted-foreground"> / {s.plannedPercent}%</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1"><span className="w-3 h-1.5 bg-muted-foreground/30 rounded" /> Planned</div>
                <div className="flex items-center gap-1"><span className="w-3 h-1.5 bg-health-yellow rounded" /> Actual</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ASSUMPTIONS TAB */}
        {activeTab === 'assumptions' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Active', value: assumptions.active, cls: 'text-primary' },
                { label: 'Validated', value: assumptions.validated, cls: 'text-health-green' },
                { label: 'Broken', value: assumptions.broken, cls: 'text-health-red' },
                { label: 'Low Confidence', value: assumptions.unvalidated.length, cls: 'text-health-yellow' },
              ].map(s => (
                <div key={s.label} className="glass-card p-4 text-center">
                  <div className={`text-2xl font-display font-bold ${s.cls}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Broken Assumptions with Cascade */}
            {assumptions.cascadeRisks.length > 0 && (
              <div className="glass-card p-5 border-health-red/20">
                <h3 className="font-display text-xs text-health-red uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-health-red animate-pulse" />
                  Broken Assumptions — Cascade Impact
                </h3>
                <div className="space-y-4">
                  {assumptions.cascadeRisks.map(cr => (
                    <div key={cr.assumption.id} className="border-l-2 border-health-red/50 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{cr.assumption.statement}</span>
                        <AssumptionStatusBadge status="broken" />
                      </div>
                      <div className="text-xs text-muted-foreground">{cr.assumption.impactDescription}</div>
                      {cr.affectedRooms.length > 0 && (
                        <div className="text-xs text-health-red mt-1">
                          Affects rooms: {cr.affectedRooms.join(', ')}
                        </div>
                      )}
                      {cr.affectedDeliverables.length > 0 && (
                        <div className="text-xs text-health-yellow mt-0.5">
                          Blocks: {cr.affectedDeliverables.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Assumptions */}
            <div className="glass-card p-5">
              <h3 className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-4">
                All Assumptions ({assumptions.total})
              </h3>
              {assumptions.total === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  No assumptions tracked yet. Assumptions will be auto-generated from project briefs and decisions.
                </div>
              ) : (
                <div className="space-y-3">
                  {(activeProject.intelligence?.assumptions ?? []).map(a => (
                    <div key={a.id} className="flex items-start justify-between bg-secondary/20 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AssumptionStatusBadge status={a.status} />
                          <span className="text-[10px] font-display text-muted-foreground uppercase">{a.category}</span>
                          <span className="text-[10px] text-muted-foreground">· Owner: {a.owner}</span>
                        </div>
                        <div className="text-sm">{a.statement}</div>
                        <div className="text-xs text-muted-foreground mt-1">{a.impactDescription}</div>
                        {a.evidence && (
                          <div className="text-xs text-primary/70 mt-1">Evidence: {a.evidence}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-sm font-display font-bold ${
                          a.confidence >= 70 ? 'text-health-green' : a.confidence >= 40 ? 'text-health-yellow' : 'text-health-red'
                        }`}>{a.confidence}%</span>
                        <span className="text-[9px] text-muted-foreground">confidence</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SIGNALS TAB */}
        {activeTab === 'signals' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Filter */}
            <div className="glass-card p-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-xs text-muted-foreground uppercase tracking-wider">Signal Feed</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Showing {signals.length} of {allSignals.length} signals (impact ≥ {signalThreshold})
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Noise filter:</span>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={signalThreshold}
                  onChange={e => setSignalThreshold(Number(e.target.value))}
                  className="w-32 accent-primary"
                />
                <span className="text-xs font-display w-8">{signalThreshold}</span>
              </div>
            </div>

            {/* Signal List */}
            <div className="space-y-2">
              {signals.map(s => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-4 flex items-start gap-3"
                >
                  <SeverityDot severity={s.severity} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">{s.title}</span>
                      <span className={`text-[9px] font-display px-1.5 py-0.5 rounded ${
                        s.severity === 'critical' ? 'text-health-red bg-health-red/10' :
                        s.severity === 'high' ? 'text-health-yellow bg-health-yellow/10' :
                        'text-muted-foreground bg-muted/50'
                      }`}>{s.severity.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-display font-bold">{s.impactScore}</div>
                    <div className="text-[9px] text-muted-foreground">impact</div>
                  </div>
                </motion.div>
              ))}
              {signals.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No signals above threshold. Lower the noise filter to see more.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
