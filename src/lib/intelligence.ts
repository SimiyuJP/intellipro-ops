import { Project, Assumption, DriftSnapshot, Signal, ProjectIntelligence } from '@/types/project';
import { computeProjectScore } from './healthScoring';

// ─── DRIFT DETECTION ────────────────────────────────────────

export interface DriftAnalysis {
  currentPercent: number;
  expectedPercent: number;
  driftDays: number; // positive = behind, negative = ahead
  driftPercent: number; // gap between expected and actual
  projectedCompletionDate: string;
  deadline: string;
  willMissDeadline: boolean;
  velocityPerWeek: number; // actual % per week
  requiredVelocityPerWeek: number; // needed to hit deadline
  status: 'on_track' | 'slight_drift' | 'significant_drift' | 'critical_drift';
  summary: string;
  snapshots: DriftSnapshot[];
}

export function computeDrift(project: Project): DriftAnalysis {
  const score = computeProjectScore(project);
  const now = new Date();
  const start = new Date(project.createdAt);
  const deadline = new Date(project.deadline);

  const totalDays = Math.max(1, (deadline.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const elapsedFraction = Math.min(1, elapsedDays / totalDays);
  const expectedPercent = Math.round(elapsedFraction * 100 * 10) / 10;
  const currentPercent = score.overallPercent;
  const driftPercent = Math.round((expectedPercent - currentPercent) * 10) / 10;

  // Velocity: % per week based on actual progress
  const elapsedWeeks = Math.max(0.1, elapsedDays / 7);
  const velocityPerWeek = Math.round((currentPercent / elapsedWeeks) * 10) / 10;

  // Required velocity to finish on time
  const remainingPercent = 100 - currentPercent;
  const remainingWeeks = Math.max(0.1, remainingDays / 7);
  const requiredVelocityPerWeek = Math.round((remainingPercent / remainingWeeks) * 10) / 10;

  // Projected completion date
  let projectedCompletionDate: string;
  if (velocityPerWeek <= 0) {
    projectedCompletionDate = 'Never (no progress detected)';
  } else {
    const weeksToComplete = remainingPercent / velocityPerWeek;
    const projected = new Date(now.getTime() + weeksToComplete * 7 * 24 * 60 * 60 * 1000);
    projectedCompletionDate = projected.toISOString().split('T')[0];
  }

  const willMissDeadline = velocityPerWeek <= 0 || requiredVelocityPerWeek > velocityPerWeek * 1.5;

  // Drift in days
  const driftDays = velocityPerWeek > 0
    ? Math.round((driftPercent / velocityPerWeek) * 7)
    : Math.round(driftPercent);

  // Status
  let status: DriftAnalysis['status'];
  if (Math.abs(driftPercent) <= 5) status = 'on_track';
  else if (driftPercent <= 15) status = 'slight_drift';
  else if (driftPercent <= 30) status = 'significant_drift';
  else status = 'critical_drift';

  // Generate snapshots from intelligence data or synthesize
  const intel = project.intelligence;
  const snapshots: DriftSnapshot[] = intel?.driftSnapshots?.length
    ? intel.driftSnapshots
    : generateSyntheticSnapshots(project, currentPercent, expectedPercent);

  // Summary
  let summary: string;
  if (status === 'on_track') {
    summary = `Project is tracking within 5% of plan. Current: ${currentPercent}%, Expected: ${expectedPercent}%.`;
  } else if (status === 'slight_drift') {
    summary = `You're ${driftPercent}% behind plan (~${driftDays} days). At current velocity (${velocityPerWeek}%/week), you need to accelerate to ${requiredVelocityPerWeek}%/week to hit ${project.deadline}.`;
  } else if (status === 'significant_drift') {
    summary = `⚠️ Significant drift: ${driftPercent}% behind schedule (~${driftDays} days). Projected completion: ${projectedCompletionDate}. Deadline: ${project.deadline}. Action required.`;
  } else {
    summary = `🔴 CRITICAL: ${driftPercent}% behind schedule (~${driftDays} days behind). At current pace, projected completion is ${projectedCompletionDate} vs deadline ${project.deadline}. Immediate intervention needed.`;
  }

  return {
    currentPercent,
    expectedPercent,
    driftDays,
    driftPercent,
    projectedCompletionDate,
    deadline: project.deadline,
    willMissDeadline,
    velocityPerWeek,
    requiredVelocityPerWeek,
    status,
    summary,
    snapshots,
  };
}

function generateSyntheticSnapshots(project: Project, currentPercent: number, expectedPercent: number): DriftSnapshot[] {
  const start = new Date(project.createdAt);
  const now = new Date();
  const totalWeeks = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const snapshots: DriftSnapshot[] = [];

  for (let w = 0; w <= totalWeeks; w++) {
    const date = new Date(start.getTime() + w * 7 * 24 * 60 * 60 * 1000);
    if (date > now) break;
    const fraction = w / totalWeeks;
    // Simulate: planned is linear, actual lags behind with some noise
    const planned = Math.round(expectedPercent * (w / totalWeeks) * 10) / 10;
    const actual = Math.round(currentPercent * (w / totalWeeks) * (0.7 + Math.random() * 0.6) * 10) / 10;
    snapshots.push({
      date: date.toISOString().split('T')[0],
      plannedPercent: Math.min(100, planned),
      actualPercent: Math.min(currentPercent, Math.max(0, actual)),
    });
  }

  // Ensure last snapshot is accurate
  if (snapshots.length > 0) {
    snapshots[snapshots.length - 1].actualPercent = currentPercent;
    snapshots[snapshots.length - 1].plannedPercent = expectedPercent;
  }

  return snapshots;
}

// ─── ASSUMPTION TRACKER ────────────────────────────────────

export interface AssumptionAnalysis {
  total: number;
  active: number;
  validated: number;
  broken: number;
  retired: number;
  criticalBroken: Assumption[];
  unvalidated: Assumption[];
  cascadeRisks: { assumption: Assumption; affectedDeliverables: string[]; affectedRooms: string[] }[];
}

export function analyzeAssumptions(project: Project): AssumptionAnalysis {
  const assumptions = project.intelligence?.assumptions ?? [];

  const active = assumptions.filter(a => a.status === 'active');
  const validated = assumptions.filter(a => a.status === 'validated');
  const broken = assumptions.filter(a => a.status === 'broken');
  const retired = assumptions.filter(a => a.status === 'retired');
  const criticalBroken = broken.filter(a => a.impact === 'critical' || a.impact === 'high');
  const unvalidated = active.filter(a => a.confidence < 50);

  const cascadeRisks = broken.map(a => {
    const affectedRooms = a.roomIds
      .map(rid => project.rooms.find(r => r.id === rid)?.name)
      .filter(Boolean) as string[];
    const affectedDeliverables = a.linkedDeliverables
      .map(did => {
        for (const room of project.rooms) {
          const d = room.deliverables.find(d => d.id === did);
          if (d) return d.title;
        }
        return null;
      })
      .filter(Boolean) as string[];
    return { assumption: a, affectedDeliverables, affectedRooms };
  });

  return {
    total: assumptions.length,
    active: active.length,
    validated: validated.length,
    broken: broken.length,
    retired: retired.length,
    criticalBroken,
    unvalidated,
    cascadeRisks,
  };
}

// ─── SIGNAL VS. NOISE FILTER ──────────────────────────────

export function generateSignals(project: Project): Signal[] {
  const signals: Signal[] = [];
  const now = new Date();

  // 1. Overdue deliverables
  for (const room of project.rooms) {
    for (const d of room.deliverables) {
      if (d.status !== 'done' && new Date(d.dueDate) < now) {
        const daysOverdue = Math.floor((now.getTime() - new Date(d.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        signals.push({
          id: `sig-overdue-${d.id}`,
          type: 'deliverable_overdue',
          severity: d.priority === 'critical' ? 'critical' : d.priority === 'high' ? 'high' : 'medium',
          title: `${d.title} is ${daysOverdue} days overdue`,
          description: `Owner: ${d.owner}. Due: ${d.dueDate}. Priority: ${d.priority}. Room: ${room.name}.`,
          roomId: room.id,
          timestamp: now.toISOString(),
          impactScore: d.priority === 'critical' ? 90 : d.priority === 'high' ? 70 : 40,
        });
      }
    }
  }

  // 2. Critical blockers
  for (const b of project.blockers) {
    if (b.severity === 'critical') {
      const age = Math.floor((now.getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      signals.push({
        id: `sig-blocker-${b.id}`,
        type: 'blocker_added',
        severity: 'critical',
        title: `Critical blocker: ${b.title} (${age} days old)`,
        description: `${b.description}. Owner: ${b.owner}.`,
        roomId: b.roomId,
        timestamp: b.createdAt,
        impactScore: Math.min(100, 80 + age * 2),
      });
    }
  }

  // 3. Milestones at risk
  for (const m of project.milestones) {
    if (m.status === 'at_risk') {
      signals.push({
        id: `sig-milestone-${m.id}`,
        type: 'milestone_at_risk',
        severity: 'high',
        title: `Milestone at risk: ${m.title}`,
        description: `Due: ${m.dueDate}. Room: ${project.rooms.find(r => r.id === m.roomId)?.name}.`,
        roomId: m.roomId,
        timestamp: now.toISOString(),
        impactScore: 75,
      });
    }
  }

  // 4. Silent team members (no update > 5 days)
  for (const tm of project.teamMembers) {
    if (tm.lastUpdate) {
      const daysSilent = Math.floor((now.getTime() - new Date(tm.lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSilent > 5) {
        signals.push({
          id: `sig-silent-${tm.id}`,
          type: 'member_silent',
          severity: daysSilent > 10 ? 'high' : 'medium',
          title: `${tm.name} hasn't updated in ${daysSilent} days`,
          description: `${tm.role}. Last update: ${tm.lastUpdate}.`,
          timestamp: now.toISOString(),
          impactScore: Math.min(60, 30 + daysSilent * 3),
        });
      }
    }
  }

  // 5. Unstaffed rooms
  for (const room of project.rooms) {
    if (room.teamMembers.length === 0 && room.deliverables.length > 0) {
      signals.push({
        id: `sig-unstaffed-${room.id}`,
        type: 'blocker_added',
        severity: 'critical',
        title: `${room.name} room has no team members`,
        description: `${room.deliverables.length} deliverables with no one assigned to the room.`,
        roomId: room.id,
        timestamp: now.toISOString(),
        impactScore: 85,
      });
    }
  }

  // 6. Broken assumptions
  const assumptions = project.intelligence?.assumptions ?? [];
  for (const a of assumptions) {
    if (a.status === 'broken') {
      signals.push({
        id: `sig-assumption-${a.id}`,
        type: 'assumption_broken',
        severity: a.impact === 'critical' ? 'critical' : a.impact === 'high' ? 'high' : 'medium',
        title: `Assumption broken: ${a.statement}`,
        description: `Impact: ${a.impactDescription}. Affects ${a.roomIds.length} rooms.`,
        timestamp: a.brokenAt || now.toISOString(),
        impactScore: a.impact === 'critical' ? 95 : a.impact === 'high' ? 75 : 50,
      });
    }
  }

  // 7. Drift warning
  const drift = computeDrift(project);
  if (drift.status !== 'on_track') {
    signals.push({
      id: 'sig-drift',
      type: 'drift_warning',
      severity: drift.status === 'critical_drift' ? 'critical' : drift.status === 'significant_drift' ? 'high' : 'medium',
      title: `Project is ${drift.driftPercent}% behind plan`,
      description: drift.summary,
      timestamp: now.toISOString(),
      impactScore: drift.status === 'critical_drift' ? 95 : drift.status === 'significant_drift' ? 75 : 45,
    });
  }

  // 8. Scope creep
  const scopeAddsNoTradeoff = project.scopeChanges.filter(sc => sc.type === 'added' && !sc.hasTradeoff);
  if (scopeAddsNoTradeoff.length > 0) {
    signals.push({
      id: 'sig-scope-creep',
      type: 'scope_added',
      severity: scopeAddsNoTradeoff.length >= 3 ? 'high' : 'medium',
      title: `${scopeAddsNoTradeoff.length} scope items added without tradeoffs`,
      description: scopeAddsNoTradeoff.map(s => s.description).join('; '),
      timestamp: now.toISOString(),
      impactScore: Math.min(80, 40 + scopeAddsNoTradeoff.length * 15),
    });
  }

  // Sort by impact score descending
  return signals.sort((a, b) => b.impactScore - a.impactScore);
}

// Filter signals: only show what moves the needle (impact >= threshold)
export function filterSignals(signals: Signal[], threshold: number = 40): Signal[] {
  return signals.filter(s => s.impactScore >= threshold);
}
