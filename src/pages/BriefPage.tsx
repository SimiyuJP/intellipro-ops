import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { FileUpload, UploadedFile } from '@/components/FileUpload';
import { useAuth } from '@/contexts/AuthContext';

const bestPractices = [
  { icon: '🎯', title: 'Define success first', desc: 'What does "done" look like? Be specific — metrics, dates, outcomes.' },
  { icon: '👥', title: 'List your team', desc: 'Name each person, their role, and what they own. AI uses this to assign rooms.' },
  { icon: '⏱️', title: 'Set real deadlines', desc: 'Include hard deadlines, dependencies, and any dates that can\'t move.' },
  { icon: '⚠️', title: 'Flag known risks', desc: 'Budget caps, tech debt, missing skills, vendor dependencies — say it now.' },
  { icon: '📎', title: 'Attach context', desc: 'Docs, briefs, Figma links, prior research. The more context, the smarter the structure.' },
];

const clarificationQuestions = [
  'What does success look like for this project? (KPIs, metrics)',
  'Who are the key stakeholders and decision-makers?',
  'Are there any legal or compliance requirements?',
  'What existing assets or tools does the team have access to?',
  'Are there any hard constraints we should know about?',
];

type Step = 'brief' | 'analyzing' | 'clarifications' | 'generating' | 'review' | 'login-prompt';

export default function BriefPage() {
  const [step, setStep] = useState<Step>('brief');
  const [projectTitle, setProjectTitle] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [brief, setBrief] = useState('');
  const [briefFiles, setBriefFiles] = useState<UploadedFile[]>([]);
  const [showTips, setShowTips] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmitBrief = () => {
    if (!projectTitle.trim()) return;
    setStep('analyzing');
    setTimeout(() => setStep('clarifications'), 2000);
  };

  const handleSkipClarifications = () => {
    setStep('generating');
    setTimeout(() => setStep('review'), 3000);
  };

  const handleLaunch = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setStep('login-prompt');
    }
  };

  const stepLabels = ['Brief', 'Analyze', 'Clarify', 'Generate', 'Review'];
  const stepKeys: Step[] = ['brief', 'analyzing', 'clarifications', 'generating', 'review'];
  const currentIdx = step === 'login-prompt' ? 4 : stepKeys.indexOf(step);

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Minimal nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-display font-bold text-xs">PP</span>
            </div>
            <span className="font-display font-bold text-sm tracking-tight">PROJECT PULSE</span>
          </Link>
          {user ? (
            <span className="text-xs text-muted-foreground font-display">{user.email}</span>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="font-display text-xs">Sign In</Button>
            </Link>
          )}
        </div>
      </nav>

      <div className="pt-20 pb-12 px-6 max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {stepLabels.map((label, i) => {
            const isActive = i <= currentIdx;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-display ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-display hidden sm:inline ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {i < 4 && <div className={`w-8 h-px ${isActive ? 'bg-primary/50' : 'bg-border'}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Brief Input */}
          {step === 'brief' && (
            <motion.div key="brief" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h1 className="text-2xl font-display font-bold mb-1">Start a New Project</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Tell us what you're building. The AI will structure everything from here.
              </p>

              {/* Best Practices Collapsible */}
              <motion.div className="glass-card mb-6 overflow-hidden">
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">
                    💡 Tips for a great brief
                  </span>
                  <span className="text-xs text-muted-foreground font-display">
                    {showTips ? '▴ Hide' : '▾ Show'}
                  </span>
                </button>
                <AnimatePresence>
                  {showTips && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {bestPractices.map((tip) => (
                          <div key={tip.title} className="flex gap-2.5">
                            <span className="text-lg mt-0.5 shrink-0">{tip.icon}</span>
                            <div>
                              <div className="text-xs font-medium font-display">{tip.title}</div>
                              <div className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block font-display">Project Title</label>
                  <input
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Q3 Brand Refresh, AI SEO Dashboard, Product Launch"
                    className="command-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 font-body"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block font-display">What Does Success Look Like?</label>
                  <textarea
                    value={successCriteria}
                    onChange={(e) => setSuccessCriteria(e.target.value)}
                    placeholder={`Define measurable outcomes. Examples:\n• Launch to 50 beta users within 6 weeks\n• Achieve 80% daily active usage\n• All 3 data sources integrated with <2s load time\n• Revenue target of $10K MRR by month 3`}
                    className="w-full h-28 command-input p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 font-body"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block font-display">Project Brief</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Include: what you're building, who's on the team (names + roles + responsibilities), timeline, budget, constraints, and any existing work.
                  </p>
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder={`Example:\nBuild and launch a new AI SEO performance dashboard for clients.\n\nTeam:\n- Sarah (PM) — owns timeline, stakeholder comms\n- Alex (Frontend Dev) — dashboard UI, data viz\n- Jordan (Backend Dev) — API integrations, data pipeline\n- Taylor (Marketing) — positioning, launch plan\n\nIntegrations: Search Console, GA4, Ahrefs\nTimeline: 6 weeks, hard launch date July 15\nBudget: $15,000\nConstraints: Must work on mobile, GDPR compliant`}
                    className="w-full h-52 command-input p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 font-body"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block font-display">
                    Attachments <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <FileUpload files={briefFiles} onFilesChange={setBriefFiles} maxFiles={5} />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSubmitBrief} disabled={!projectTitle.trim()} className="font-display">
                  Analyze Brief →
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Analyzing */}
          {step === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
              <div className="inline-block mb-4">
                <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <h2 className="font-display text-lg font-bold mb-2">Analyzing Brief</h2>
              <div className="text-sm text-muted-foreground font-display space-y-1">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>Extracting project requirements...</motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>Identifying team structure & gaps...</motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>Mapping scope & risk factors...</motion.div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Clarification Questions */}
          {step === 'clarifications' && (
            <motion.div key="clarifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-xl font-display font-bold mb-2">AI Needs Clarification</h2>
              <p className="text-sm text-muted-foreground mb-6">
                I've analyzed your brief. Here's what I understand, and what I still need:
              </p>

              <div className="glass-card p-4 mb-6">
                <h3 className="font-display text-xs text-primary mb-3 uppercase tracking-wider">✓ What I Understand</h3>
                <ul className="space-y-1 text-sm">
                  {projectTitle && <li className="flex items-center gap-2"><span className="text-health-green">✓</span> Project: {projectTitle}</li>}
                  {successCriteria && <li className="flex items-center gap-2"><span className="text-health-green">✓</span> Success criteria defined</li>}
                  {brief && <li className="flex items-center gap-2"><span className="text-health-green">✓</span> Brief provided ({brief.split(/\s+/).length} words)</li>}
                  {briefFiles.length > 0 && <li className="flex items-center gap-2"><span className="text-health-green">✓</span> {briefFiles.length} attachment(s)</li>}
                </ul>
              </div>

              <div className="glass-card p-4 mb-6 border-health-yellow/20">
                <h3 className="font-display text-xs text-health-yellow mb-3 uppercase tracking-wider">⚠ Missing Information</h3>
                <div className="space-y-4">
                  {clarificationQuestions.map((q, i) => (
                    <div key={i}>
                      <label className="text-sm font-medium mb-1 block">{q}</label>
                      <input
                        className="command-input w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 font-body"
                        placeholder="Type your answer (optional)..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleSkipClarifications} className="font-display">
                  Skip — Generate with defaults
                </Button>
                <Button onClick={handleSkipClarifications} className="font-display">
                  Submit & Generate →
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Generating */}
          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
              <div className="inline-block mb-4">
                <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <h2 className="font-display text-lg font-bold mb-2">Generating Project Structure</h2>
              <div className="text-sm text-muted-foreground font-display space-y-1">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>Creating department rooms...</motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>Assigning tasks to team members...</motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>Computing dependencies & milestones...</motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>Building risk map...</motion.div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Review */}
          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-xl font-display font-bold mb-1">Your Project is Ready</h2>
              <p className="text-sm text-muted-foreground mb-6">
                AI has generated your project structure. Here's a snapshot:
              </p>

              {/* Generated rooms */}
              <div className="space-y-3 mb-6">
                {[
                  { icon: '⚡', name: 'Tech Room', items: 'API integrations, dashboard frontend, AI engine', members: '2 assigned, 1 gap detected' },
                  { icon: '📣', name: 'Marketing Room', items: 'Positioning, landing page, launch plan', members: '1 assigned, 1 gap detected' },
                  { icon: '🔬', name: 'Research Room', items: 'User interviews, market analysis', members: '1 assigned' },
                  { icon: '⚙️', name: 'Operations Room', items: 'Training docs, onboarding flow', members: '0 assigned — needs lead' },
                  { icon: '🎨', name: 'Design Room', items: 'UI/UX design, brand assets', members: '0 assigned — needs designer' },
                ].map((room, i) => (
                  <motion.div
                    key={room.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{room.icon}</span>
                      <div>
                        <div className="text-sm font-medium">{room.name}</div>
                        <div className="text-xs text-muted-foreground">{room.items}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">{room.members}</div>
                  </motion.div>
                ))}
              </div>

              <div className="glass-card p-4 mb-6">
                <h3 className="font-display text-xs text-muted-foreground mb-2 uppercase tracking-wider">Summary</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div><div className="text-2xl font-display font-bold text-primary">5</div><div className="text-xs text-muted-foreground">Rooms</div></div>
                  <div><div className="text-2xl font-display font-bold text-primary">14</div><div className="text-xs text-muted-foreground">Deliverables</div></div>
                  <div><div className="text-2xl font-display font-bold text-primary">8</div><div className="text-xs text-muted-foreground">Milestones</div></div>
                  <div><div className="text-2xl font-display font-bold text-health-yellow">4</div><div className="text-xs text-muted-foreground">Gaps</div></div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleLaunch} className="font-display" size="lg">
                  {user ? 'Launch Project →' : 'Save & Continue →'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Login Prompt */}
          {step === 'login-prompt' && (
            <motion.div key="login-prompt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <span className="text-3xl">🚀</span>
                </div>
                <h2 className="text-xl font-display font-bold mb-2">Your project structure is ready!</h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                  Sign in or create an account to save your project, invite team members, and start tracking progress in real time.
                </p>
              </div>

              {/* Snippets preview */}
              <div className="glass-card p-4 mb-6">
                <h3 className="font-display text-xs text-primary mb-3 uppercase tracking-wider">Preview: What you'll get</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">▸</span>
                    <span className="text-muted-foreground">5 rooms with assigned owners and deliverables</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">▸</span>
                    <span className="text-muted-foreground">AI-generated timeline with dependency mapping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">▸</span>
                    <span className="text-muted-foreground">Risk analysis & staffing gap detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">▸</span>
                    <span className="text-muted-foreground">Real-time project health scoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">▸</span>
                    <span className="text-muted-foreground">Command interface: ask "where are we?" anytime</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/auth')} className="font-display" size="lg">
                  Create Account →
                </Button>
                <Button variant="outline" onClick={() => navigate('/auth')} className="font-display" size="lg">
                  Sign In
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
