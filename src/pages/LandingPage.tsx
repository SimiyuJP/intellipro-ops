import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: '◈',
    title: 'Brief → Structure',
    desc: 'Paste a project brief. AI generates rooms, milestones, deliverables, and team recommendations instantly.',
  },
  {
    icon: '▦',
    title: 'Multi-Room System',
    desc: 'Every department gets its own autonomous workspace with health scoring, blockers, and AI recommendations.',
  },
  {
    icon: '▸',
    title: 'Command Interface',
    desc: 'Ask "Where are we?" and get evidence-based answers. No fluff. No status meetings.',
  },
  {
    icon: '◉',
    title: 'Health Engine',
    desc: 'Continuous project health scoring. Green/Yellow/Red with confidence scores and root cause analysis.',
  },
  {
    icon: '⚡',
    title: 'Accountability Detection',
    desc: 'AI detects who\'s lagging, what\'s stale, and where scope creep is happening.',
  },
  {
    icon: '△',
    title: 'Critical Path Analysis',
    desc: 'Know exactly which delayed deliverable will collapse your timeline.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-display font-bold text-xs">PP</span>
            </div>
            <span className="font-display font-bold text-sm tracking-tight">PROJECT PULSE</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="font-display text-xs">
                Demo
              </Button>
            </Link>
            <Link to="/brief">
              <Button size="sm" className="font-display text-xs">
                Start Project
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block mb-6">
              <span className="health-badge-green text-xs">AI-POWERED PROJECT INTELLIGENCE</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
              <span className="text-foreground">Know where your</span>
              <br />
              <span className="text-gradient-primary">project stands.</span>
              <br />
              <span className="text-foreground">Always.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 font-body">
              Project Pulse is an AI-first project intelligence system. Paste a brief, 
              get instant structure. Ask "where are we?" and get evidence-based answers.
              No Kanban boards. No status meetings.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/brief">
                <Button size="lg" className="font-display text-sm px-8">
                  Start a Project →
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="font-display text-sm px-8">
                  View Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Terminal preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 glass-card-elevated p-1 max-w-3xl mx-auto"
          >
            <div className="bg-background rounded-md p-4 font-display text-xs text-left space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-health-red" />
                <div className="w-2.5 h-2.5 rounded-full bg-health-yellow" />
                <div className="w-2.5 h-2.5 rounded-full bg-health-green" />
                <span className="ml-2">project-pulse — command</span>
              </div>
              <div className="text-primary">▸ /status</div>
              <div className="text-muted-foreground mt-1">Analyzing project data...</div>
              <div className="mt-3 space-y-1">
                <div><span className="text-health-yellow">Project Health: Yellow (62%)</span></div>
                <div className="text-foreground">Critical Blockers:</div>
                <div className="text-health-red ml-2">• Ahrefs API key not provisioned</div>
                <div className="text-health-red ml-2">• No backend engineer for AI engine</div>
                <div className="text-foreground mt-2">Who is Lagging:</div>
                <div className="text-health-yellow ml-2">• Alex Chen: no update in 6 days</div>
                <div className="text-health-yellow ml-2">• Ops: 2 overdue deliverables, no owner</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-center mb-12">
            NOT A TASK APP.
            <span className="text-gradient-primary"> AN INTELLIGENCE SYSTEM.</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="glass-card p-5 hover:border-primary/30 transition-colors"
              >
                <div className="text-2xl mb-3 text-primary font-display">{f.icon}</div>
                <h3 className="font-display font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">
            Stop chasing. Start knowing.
          </h2>
          <p className="text-muted-foreground mb-8">
            Upload your project brief and let AI structure, track, and analyze your project in real time.
          </p>
          <Link to="/brief">
            <Button size="lg" className="font-display text-sm px-10">
              Create Your First Project →
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-muted-foreground font-display">
          <span>PROJECT PULSE © 2026</span>
          <span>AI-FIRST PROJECT INTELLIGENCE</span>
        </div>
      </footer>
    </div>
  );
}
