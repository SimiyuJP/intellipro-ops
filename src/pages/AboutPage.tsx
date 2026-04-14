import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { HealthMeter } from '@/components/HealthMeter';
import { HealthBadge } from '@/components/HealthBadge';
import { useProject } from '@/contexts/ProjectContext';
import { computeProjectScore, getRoomStatus } from '@/lib/healthScoring';
import { Link } from 'react-router-dom';

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') return <span className="text-health-green">✓</span>;
  if (status === 'blocked') return <span className="text-health-red">✕</span>;
  if (status === 'in_progress') return <span className="text-health-yellow">◉</span>;
  return <span className="text-muted-foreground">○</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === 'critical'
    ? 'text-health-red bg-health-red/10 border-health-red/20'
    : priority === 'high'
    ? 'text-health-yellow bg-health-yellow/10 border-health-yellow/20'
    : 'text-muted-foreground bg-muted/50 border-border';
  return (
    <span className={`text-[10px] font-display px-1.5 py-0.5 rounded border ${cls}`}>
      {priority.toUpperCase()}
    </span>
  );
}

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? 'bg-health-green' : value >= 40 ? 'bg-health-yellow' : 'bg-health-red';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-display text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

export default function AboutPage() {
  const { activeProject } = useProject();
  const [showBowlTooltip, setShowBowlTooltip] = useState(false);

  if (!activeProject) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-4xl mb-4">📂</div>
            <h2 className="font-display text-xl font-bold mb-2">No Project Selected</h2>
            <p className="text-sm text-muted-foreground">Select a project from the sidebar to view its dashboard.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const project = activeProject;
  const projectScore = computeProjectScore(project);

  const allDeliverables = project.rooms.flatMap(r => r.deliverables);
  const overdue = allDeliverables.filter(d => d.status !== 'done' && new Date(d.dueDate) < new Date());
  const blocked = allDeliverables.filter(d => d.status === 'blocked');
  const criticalPath = allDeliverables.filter(d => d.priority === 'critical' && d.status !== 'done');
  const criticalRedFlags = project.redFlags.filter(f => f.severity === 'critical');

  const staffingGaps = project.rooms
    .filter(r => r.teamMembers.length === 0 || r.deliverables.some(d => d.owner === 'Unassigned'))
    .flatMap(r => {
      const gaps: string[] = [];
      if (r.teamMembers.length === 0) gaps.push(`${r.name} room has no team members assigned`);
      r.deliverables.filter(d => d.owner === 'Unassigned').forEach(d => {
        gaps.push(`${d.title} — needs an owner (${r.name})`);
      });
      return gaps;
    });

  const focusAreas = project.rooms
    .flatMap(r => r.recommendations.slice(0, 1))
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Project Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {project.name} · Deadline: {project.deadline} · Budget: {project.budget} · {project.teamMembers.length} team members
            </p>
          </div>
          <Link to="/chat">
            <button className="command-input px-4 py-2 text-sm hover:border-primary/50 transition-colors">
              ▸ Ask anything...
            </button>
          </Link>
        </div>

        {/* Red Flag Banner */}
        {criticalRedFlags.length > 0 && (
          <Link to="/alerts">
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="border border-health-red/30 bg-health-red/5 rounded-lg p-3 flex items-center justify-between hover:bg-health-red/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-health-red">🔴</span>
                <span className="text-sm font-display font-bold text-health-red">{criticalRedFlags.length} Critical Alert{criticalRedFlags.length > 1 ? 's' : ''}</span>
                <span className="text-sm text-foreground/70">— {criticalRedFlags[0].title}</span>
              </div>
              <span className="text-xs text-muted-foreground font-display">VIEW ALL →</span>
            </motion.div>
          </Link>
        )}

        {/* Top row: Overall Bowl + Room Health + AI Focus */}
        <div className="grid grid-cols-12 gap-4">
          {/* Overall Bowl with hover tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-3 glass-card-elevated p-5 flex flex-col items-center justify-center relative"
            onMouseEnter={() => setShowBowlTooltip(true)}
            onMouseLeave={() => setShowBowlTooltip(false)}
          >
            <HealthMeter score={projectScore.overallPercent} status={projectScore.status} size="lg" label="Project Progress" />
            <div className="text-[10px] text-muted-foreground mt-2 text-center">
              {projectScore.totalDone}/{projectScore.totalDeliverables} tasks done
            </div>

            {/* Hover tooltip — shows done vs pending per room */}
            {showBowlTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-80 glass-card-elevated border border-border p-4 rounded-lg shadow-xl"
              >
                <div className="text-xs font-display font-bold mb-3 text-center">
                  Progress Breakdown — {projectScore.overallPercent}% Complete
                </div>
                <div className="space-y-3">
                  {projectScore.roomScores.map(rs => (
                    <div key={rs.roomId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{rs.roomIcon}</span>
                          <span className="text-xs font-display font-medium">{rs.roomName}</span>
                        </div>
                        <span className="text-[10px] font-display text-muted-foreground">
                          {rs.doneCount}/{rs.totalCount} · {rs.completionPercent}% · wt {Math.round(rs.weight * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full ${
                            rs.completionPercent >= 70 ? 'bg-health-green' :
                            rs.completionPercent >= 35 ? 'bg-health-yellow' : 'bg-health-red'
                          }`}
                          style={{ width: `${rs.completionPercent}%` }}
                        />
                      </div>
                      {rs.doneItems.length > 0 && (
                        <div className="text-[9px] text-health-green">
                          ✓ {rs.doneItems.join(', ')}
                        </div>
                      )}
                      {rs.pendingItems.length > 0 && (
                        <div className="text-[9px] text-muted-foreground">
                          ○ {rs.pendingItems.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-t border-border/50 mt-3 pt-2 text-center text-[10px] text-muted-foreground">
                  Weighted by task priority (critical=4×, high=3×, medium=2×, low=1×)
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-5 glass-card p-5">
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">Room Progress</h2>
            <div className="space-y-2.5">
              {projectScore.roomScores.map(rs => {
                const room = project.rooms.find(r => r.id === rs.roomId)!;
                const roomStatus = getRoomStatus(rs.completionPercent);
                return (
                  <Link key={rs.roomId} to={`/rooms/${rs.roomId}`} className="flex items-center justify-between hover:bg-secondary/30 p-2 rounded transition-colors -mx-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{rs.roomIcon}</span>
                      <div>
                        <span className="text-sm font-medium">{rs.roomName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-display text-muted-foreground">
                            {rs.doneCount}/{rs.totalCount} tasks · wt {Math.round(rs.weight * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            roomStatus === 'green' ? 'bg-health-green' :
                            roomStatus === 'yellow' ? 'bg-health-yellow' : 'bg-health-red'
                          }`}
                          style={{ width: `${rs.completionPercent}%` }}
                        />
                      </div>
                      <HealthBadge status={roomStatus} label={`${rs.completionPercent}%`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-4 glass-card p-5">
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">⚡ AI Focus Areas</h2>
            <div className="space-y-2">
              {focusAreas.map((area, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-display text-xs mt-0.5">{i + 1}.</span>
                  <span className="text-foreground/90">{area}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
              <Link to="/decisions" className="text-[10px] font-display text-muted-foreground hover:text-primary transition-colors">
                {project.decisions.length} Decisions
              </Link>
              <span className="text-muted-foreground/30">·</span>
              <Link to="/meetings" className="text-[10px] font-display text-muted-foreground hover:text-primary transition-colors">
                {project.meetings.length} Meetings
              </Link>
              <span className="text-muted-foreground/30">·</span>
              <Link to="/alerts" className="text-[10px] font-display text-muted-foreground hover:text-primary transition-colors">
                {project.redFlags.length} Alerts
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-health-red animate-pulse" />
              Critical Blockers ({project.blockers.filter(b => b.severity === 'critical').length})
            </h2>
            <div className="space-y-3">
              {project.blockers.filter(b => b.severity === 'critical' || b.severity === 'high').map(b => (
                <div key={b.id} className="border-l-2 border-health-red/50 pl-3 py-1">
                  <div className="text-sm font-medium">{b.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Owner: {b.owner} · {project.rooms.find(r => r.id === b.roomId)?.name}
                  </div>
                </div>
              ))}
              {project.blockers.filter(b => b.severity === 'critical' || b.severity === 'high').length === 0 && (
                <div className="text-sm text-muted-foreground">No critical blockers 🎉</div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">
              Overdue & Blocked ({overdue.length + blocked.length})
            </h2>
            <div className="space-y-2.5">
              {[...overdue, ...blocked].slice(0, 5).map(d => (
                <div key={d.id} className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <StatusIcon status={d.status} />
                    <div>
                      <div className="text-sm">{d.title}</div>
                      <div className="text-xs text-muted-foreground">{d.owner} · Due {d.dueDate}</div>
                    </div>
                  </div>
                  <PriorityBadge priority={d.priority} />
                </div>
              ))}
              {overdue.length + blocked.length === 0 && (
                <div className="text-sm text-muted-foreground">Nothing overdue or blocked ✓</div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">Upcoming Milestones</h2>
            <div className="space-y-2.5">
              {project.milestones.map(m => {
                const room = project.rooms.find(r => r.id === m.roomId);
                return (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{room?.icon}</span>
                      <div>
                        <div className="text-sm">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.dueDate}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-display px-1.5 py-0.5 rounded ${
                      m.status === 'at_risk' ? 'text-health-red bg-health-red/10' :
                      m.status === 'on_track' ? 'text-health-green bg-health-green/10' :
                      m.status === 'completed' ? 'text-health-green bg-health-green/10' :
                      'text-muted-foreground bg-muted/50'
                    }`}>
                      {m.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Confidence Overview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-5">
          <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">🎯 Confidence Scoring — Beyond Health Status</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {project.rooms.map(room => {
              const rs = projectScore.roomScores.find(r => r.roomId === room.id);
              const roomStatus = getRoomStatus(rs?.completionPercent ?? 0);
              return (
                <Link key={room.id} to={`/rooms/${room.id}`} className="bg-secondary/20 rounded-lg p-3 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{room.icon}</span>
                    <span className="text-sm font-display font-bold">{room.name}</span>
                    <HealthBadge status={roomStatus} label={`${rs?.completionPercent ?? 0}%`} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-lg font-display font-bold ${
                      room.confidence >= 70 ? 'text-health-green' :
                      room.confidence >= 40 ? 'text-health-yellow' : 'text-health-red'
                    }`}>{room.confidence}%</span>
                    <span className="text-xs text-muted-foreground">confidence</span>
                  </div>
                  <div className="space-y-1.5">
                    {room.confidenceFactors.map((f, i) => (
                      <ConfidenceBar key={i} value={f.score} label={f.label} />
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-4">
          {staffingGaps.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
              <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">🚨 Staffing Gaps Detected</h2>
              <div className="space-y-2">
                {staffingGaps.map((gap, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-health-yellow">△</span>
                    {gap}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className={`glass-card p-5 ${staffingGaps.length === 0 ? 'col-span-2' : ''}`}>
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">Recent Activity</h2>
            <div className="space-y-3">
              {project.updates.map(u => {
                const room = project.rooms.find(r => r.id === u.roomId);
                return (
                  <div key={u.id} className="border-l-2 border-border pl-3 py-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{room?.icon}</span>
                      <span className="font-medium text-foreground">{u.author}</span>
                      <span>·</span>
                      <span>{u.createdAt}</span>
                    </div>
                    <div className="text-sm mt-0.5">{u.content}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Critical Path */}
        {criticalPath.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-card p-5">
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">🔥 Critical Path — What Slips If These Slip</h2>
            <div className="grid grid-cols-3 gap-3">
              {criticalPath.map(d => {
                const room = project.rooms.find(r => r.id === d.roomId);
                const dependents = allDeliverables.filter(other => other.dependencies.includes(d.id));
                return (
                  <div key={d.id} className="border border-health-red/20 bg-health-red/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{room?.icon}</span>
                      <span className="text-xs text-muted-foreground">{room?.name}</span>
                    </div>
                    <div className="text-sm font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{d.owner} · Due {d.dueDate}</div>
                    <div className="flex items-center gap-1 mt-2">
                      <StatusIcon status={d.status} />
                      <span className="text-xs text-muted-foreground capitalize">{d.status.replace('_', ' ')}</span>
                    </div>
                    {dependents.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-health-red/10">
                        <div className="text-[10px] font-display text-health-red">IF THIS SLIPS →</div>
                        {dependents.map(dep => (
                          <div key={dep.id} className="text-[10px] text-muted-foreground mt-0.5">• {dep.title}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
