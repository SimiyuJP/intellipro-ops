import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { HealthMeter } from '@/components/HealthMeter';
import { HealthBadge } from '@/components/HealthBadge';
import { seedProject } from '@/data/seedProject';
import { Link } from 'react-router-dom';

const project = seedProject;

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

export default function DashboardPage() {
  const allDeliverables = project.rooms.flatMap(r => r.deliverables);
  const overdue = allDeliverables.filter(d => d.status !== 'done' && new Date(d.dueDate) < new Date());
  const blocked = allDeliverables.filter(d => d.status === 'blocked');
  const criticalPath = allDeliverables.filter(d => d.priority === 'critical' && d.status !== 'done');

  const staffingGaps = [
    'ML/AI Engineer — needed for AI Insights Engine',
    'UI/UX Designer — Design room has no assignee',
    'Ops Lead — Operations deliverables unowned',
    'Copywriter — Landing page content needed',
  ];

  const focusAreas = [
    'Resolve Ahrefs API key procurement (blocking Tech)',
    'Assign Design room owner immediately',
    'Follow up with Alex Chen (6 days since last update)',
    'Finalize positioning document (due Apr 11)',
    'Assign Ops lead for training docs',
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Deadline: {project.deadline} · Budget: {project.budget} · {project.teamMembers.length} team members
            </p>
          </div>
          <Link to="/chat">
            <button className="command-input px-4 py-2 text-sm hover:border-primary/50 transition-colors">
              ▸ Ask anything...
            </button>
          </Link>
        </div>

        {/* Top row: Health + Room health */}
        <div className="grid grid-cols-12 gap-4">
          {/* Overall Health */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-3 glass-card-elevated p-5 flex flex-col items-center justify-center"
          >
            <HealthMeter score={project.healthScore} status={project.healthStatus} size="lg" label="Project Health" />
          </motion.div>

          {/* Room Health */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-5 glass-card p-5"
          >
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">Room Health</h2>
            <div className="space-y-2.5">
              {project.rooms.map(room => (
                <Link key={room.id} to={`/rooms/${room.id}`} className="flex items-center justify-between hover:bg-secondary/30 p-2 rounded transition-colors -mx-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{room.icon}</span>
                    <span className="text-sm font-medium">{room.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          room.healthStatus === 'green' ? 'bg-health-green' :
                          room.healthStatus === 'yellow' ? 'bg-health-yellow' : 'bg-health-red'
                        }`}
                        style={{ width: `${room.healthScore}%` }}
                      />
                    </div>
                    <HealthBadge status={room.healthStatus} label={`${room.healthScore}%`} />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Focus Areas */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-4 glass-card p-5"
          >
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">
              ⚡ AI Focus Areas This Week
            </h2>
            <div className="space-y-2">
              {focusAreas.map((area, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-display text-xs mt-0.5">{i + 1}.</span>
                  <span className="text-foreground/90">{area}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Middle row: Blockers + Overdue + Milestones */}
        <div className="grid grid-cols-3 gap-4">
          {/* Blockers */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
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
            </div>
          </motion.div>

          {/* Overdue / At-Risk Deliverables */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-5"
          >
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
            </div>
          </motion.div>

          {/* Milestones */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-5"
          >
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">
              Upcoming Milestones
            </h2>
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

        {/* Bottom row: Staffing + Activity */}
        <div className="grid grid-cols-2 gap-4">
          {/* Staffing Gaps */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-5"
          >
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">
              🚨 Staffing Gaps Detected
            </h2>
            <div className="space-y-2">
              {staffingGaps.map((gap, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-health-yellow">△</span>
                  {gap}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-5"
          >
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">
              Recent Activity
            </h2>
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-5"
        >
          <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">
            🔥 Critical Path Items
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {criticalPath.map(d => {
              const room = project.rooms.find(r => r.id === d.roomId);
              return (
                <div key={d.id} className="border border-health-red/20 bg-health-red/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{room?.icon}</span>
                    <span className="text-xs text-muted-foreground">{room?.name}</span>
                  </div>
                  <div className="text-sm font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {d.owner} · Due {d.dueDate}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <StatusIcon status={d.status} />
                    <span className="text-xs text-muted-foreground capitalize">{d.status.replace('_', ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
