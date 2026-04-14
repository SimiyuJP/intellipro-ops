import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { computeProjectScore } from '@/lib/healthScoring';

const capabilities = [
  {
    icon: '◈',
    title: 'Brief → Structure',
    desc: 'Paste a project brief. Rooms, milestones, deliverables, and team recommendations appear instantly.',
  },
  {
    icon: '▦',
    title: 'Multi-Room System',
    desc: 'Every workstream gets its own autonomous workspace with health scoring, blockers, and AI recommendations.',
  },
  {
    icon: '▸',
    title: 'Command Interface',
    desc: 'Ask "Where are we?" and get evidence-based answers. No status meetings. No chasing.',
  },
  {
    icon: '◉',
    title: 'Health Engine',
    desc: 'Continuous scoring — green, yellow, red — with confidence factors and root-cause analysis behind every number.',
  },
  {
    icon: '⚡',
    title: 'Accountability Detection',
    desc: 'Know who has gone quiet, what commitments were missed, and where scope is drifting before it costs you.',
  },
  {
    icon: '△',
    title: 'Institutional Memory',
    desc: 'Every decision, every assumption, every lesson — indexed, searchable, and tied back to outcomes.',
  },
];

const layers = [
  { path: '/intelligence', label: 'Intelligence', icon: '🧠', desc: 'Drift, assumptions, signals' },
  { path: '/visibility', label: 'Visibility', icon: '👁', desc: 'Stakeholder views, timeline replay' },
  { path: '/predictive', label: 'Predictive', icon: '🔮', desc: 'Delivery forecast, risk heatmap' },
  { path: '/accountability', label: 'Accountability', icon: '🤝', desc: 'Silence detector, escalations' },
  { path: '/memory', label: 'Memory', icon: '📋', desc: 'Post-mortems, decision replay' },
];

export default function DashboardPage() {
  const { activeProject } = useProject();
  const score = activeProject ? computeProjectScore(activeProject) : null;

  const healthColor = !score ? 'text-muted-foreground'
    : score.status === 'green' ? 'text-health-green'
    : score.status === 'yellow' ? 'text-health-yellow'
    : 'text-health-red';

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-16">

        {/* Active project strip */}
        {activeProject && score && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between border border-border/60 rounded-lg px-5 py-3 bg-secondary/20"
          >
            <div>
              <span className="text-xs font-display text-muted-foreground uppercase tracking-widest">Active Project</span>
              <div className="font-display font-bold text-sm mt-0.5">{activeProject.name}</div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className={`text-2xl font-display font-bold ${healthColor}`}>{score.overallPercent}%</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{score.status} health</div>
              </div>
              <Link
                to="/about"
                className="text-xs font-display text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 px-3 py-1.5 rounded transition-colors"
              >
                Full overview →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Manifesto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <div className="inline-block">
            <span className="health-badge-green text-xs">AI-FIRST PROJECT INTELLIGENCE</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
            NOT A TASK APP.
            <br />
            <span className="text-gradient-primary">AN INTELLIGENCE SYSTEM.</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            Project Pulse doesn't track tasks. It tracks truth — the truth about where your project stands, who's blocked, what's at risk, and what will slip if nothing changes.
          </p>
        </motion.div>

        {/* Terminal demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="glass-card-elevated p-1 max-w-2xl mx-auto"
        >
          <div className="bg-background rounded-md p-5 font-display text-xs text-left space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-health-red" />
              <div className="w-2.5 h-2.5 rounded-full bg-health-yellow" />
              <div className="w-2.5 h-2.5 rounded-full bg-health-green" />
              <span className="ml-2 text-muted-foreground/60">project-pulse — command</span>
            </div>
            <div className="text-primary">▸ where are we?</div>
            <div className="text-muted-foreground">Analyzing 7 rooms, 34 deliverables, 12 assumptions...</div>
            <div className="mt-3 space-y-1.5">
              <div><span className="text-health-yellow">Overall: Yellow (62%) — 3 rooms need attention</span></div>
              <div className="text-foreground mt-2">Critical Blockers:</div>
              <div className="text-health-red ml-3">• Ahrefs API key not provisioned — blocks 4 deliverables</div>
              <div className="text-health-red ml-3">• No backend engineer assigned — AI Engine room unowned</div>
              <div className="text-foreground mt-2">Who has gone quiet:</div>
              <div className="text-health-yellow ml-3">• Alex Chen — no update in 6 days, 2 critical deliverables in-flight</div>
              <div className="text-health-yellow ml-3">• Operations — 99 days silent, no team members</div>
              <div className="text-muted-foreground mt-2">Recommended escalation: Sponsor review by Friday.</div>
            </div>
          </div>
        </motion.div>

        {/* Capabilities grid */}
        <div>
          <div className="text-center mb-8">
            <div className="text-xs font-display text-muted-foreground uppercase tracking-widest">What this system does</div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="glass-card p-5 hover:border-primary/30 transition-colors"
              >
                <div className="text-2xl mb-3 text-primary font-display">{cap.icon}</div>
                <h3 className="font-display font-semibold text-sm mb-2">{cap.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Layer quick-jump */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border-t border-border/40 pt-10"
        >
          <div className="text-center mb-6">
            <div className="text-xs font-display text-muted-foreground uppercase tracking-widest">Intelligence layers</div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {layers.map(layer => (
              <Link
                key={layer.path}
                to={layer.path}
                className="glass-card p-4 text-center hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="text-2xl mb-2">{layer.icon}</div>
                <div className="text-xs font-display font-semibold group-hover:text-primary transition-colors">{layer.label}</div>
                <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{layer.desc}</div>
              </Link>
            ))}
          </div>
        </motion.div>

      </div>
    </AppLayout>
  );
}
