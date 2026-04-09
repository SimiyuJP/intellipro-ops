import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileUpload, UploadedFile } from '@/components/FileUpload';

const clarificationQuestions = [
  'What does success look like for this project? (KPIs, metrics)',
  'Who are the key stakeholders and decision-makers?',
  'Are there any legal or compliance requirements?',
  'What existing assets or tools does the team have access to?',
  'Are there any hard constraints we should know about?',
];

type Step = 'brief' | 'analyzing' | 'clarifications' | 'generating' | 'review';

export default function BriefPage() {
  const [step, setStep] = useState<Step>('brief');
  const [projectTitle, setProjectTitle] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [brief, setBrief] = useState('');
  const [briefFiles, setBriefFiles] = useState<UploadedFile[]>([]);
  const navigate = useNavigate();

  const handleSubmitBrief = () => {
    if (!brief.trim()) return;
    setStep('analyzing');
    setTimeout(() => setStep('clarifications'), 2000);
  };

  const handleSkipClarifications = () => {
    setStep('generating');
    setTimeout(() => setStep('review'), 3000);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {['Brief', 'Analyze', 'Clarify', 'Generate', 'Review'].map((label, i) => {
            const steps: Step[] = ['brief', 'analyzing', 'clarifications', 'generating', 'review'];
            const currentIdx = steps.indexOf(step);
            const isActive = i <= currentIdx;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-display ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-display ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {i < 4 && <div className={`w-8 h-px ${isActive ? 'bg-primary/50' : 'bg-border'}`} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Brief Input */}
        {step === 'brief' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-display font-bold mb-2">New Project</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Paste your project brief below. AI will analyze it, identify gaps, and generate a complete project structure.
            </p>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Paste your project brief here...

Example: Build and launch a new AI SEO performance dashboard for clients. Must integrate Search Console, GA4, and Ahrefs. Launch within 6 weeks..."
              className="w-full h-64 command-input p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 font-body"
            />
            <div className="mt-4">
              <FileUpload files={briefFiles} onFilesChange={setBriefFiles} maxFiles={5} />
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSubmitBrief} disabled={!brief.trim() && briefFiles.length === 0} className="font-display">
                Analyze Brief →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Analyzing */}
        {step === 'analyzing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="inline-block mb-4">
              <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
            <h2 className="font-display text-lg font-bold mb-2">Analyzing Brief</h2>
            <div className="text-sm text-muted-foreground font-display space-y-1">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                Extracting project requirements...
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                Identifying scope boundaries...
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
                Detecting missing information...
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Clarification Questions */}
        {step === 'clarifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-display font-bold mb-2">AI Needs Clarification</h2>
            <p className="text-sm text-muted-foreground mb-6">
              I've analyzed your brief. Here's what I understand, and what I still need:
            </p>

            <div className="glass-card p-4 mb-6">
              <h3 className="font-display text-xs text-primary mb-3 uppercase tracking-wider">What I Understand</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2"><span className="text-health-green">✓</span> Product type: AI-powered SEO dashboard</li>
                <li className="flex items-center gap-2"><span className="text-health-green">✓</span> Integrations needed: Search Console, GA4, Ahrefs</li>
                <li className="flex items-center gap-2"><span className="text-health-green">✓</span> Timeline: 6 weeks</li>
                <li className="flex items-center gap-2"><span className="text-health-green">✓</span> Budget: $15,000</li>
                <li className="flex items-center gap-2"><span className="text-health-green">✓</span> Target: Marketing managers at mid-size companies</li>
                <li className="flex items-center gap-2"><span className="text-health-green">✓</span> Current team: 2 devs + 1 marketer</li>
              </ul>
            </div>

            <div className="glass-card p-4 mb-6 border-health-yellow/20">
              <h3 className="font-display text-xs text-health-yellow mb-3 uppercase tracking-wider">Missing Information</h3>
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
                Submit & Generate Structure →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Generating */}
        {step === 'generating' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="inline-block mb-4">
              <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
            <h2 className="font-display text-lg font-bold mb-2">Generating Project Structure</h2>
            <div className="text-sm text-muted-foreground font-display space-y-1">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                Creating department rooms...
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                Mapping deliverables & milestones...
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
                Identifying dependencies...
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
                Computing staffing gaps...
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.3 }}>
                Building risk map...
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Review */}
        {step === 'review' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-display font-bold mb-2">Project Structure Generated</h2>
            <p className="text-sm text-muted-foreground mb-6">
              AI has created your project structure. Review and launch.
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
                  <div className="text-xs text-muted-foreground">{room.members}</div>
                </motion.div>
              ))}
            </div>

            <div className="glass-card p-4 mb-6 border-health-yellow/20">
              <h3 className="font-display text-xs text-health-yellow mb-2 uppercase tracking-wider">⚠ Staffing Gaps Detected</h3>
              <div className="space-y-1 text-sm">
                <div>• You need a <span className="text-foreground font-medium">ML/AI Engineer</span> for the AI insights engine</div>
                <div>• You need a <span className="text-foreground font-medium">UI/UX Designer</span> for dashboard and brand assets</div>
                <div>• You need a <span className="text-foreground font-medium">Ops Lead</span> for training and onboarding</div>
                <div>• You need a <span className="text-foreground font-medium">Copywriter</span> for landing page content</div>
              </div>
            </div>

            <div className="glass-card p-4 mb-6">
              <h3 className="font-display text-xs text-muted-foreground mb-2 uppercase tracking-wider">Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div><div className="text-2xl font-display font-bold text-primary">5</div><div className="text-xs text-muted-foreground">Rooms</div></div>
                <div><div className="text-2xl font-display font-bold text-primary">14</div><div className="text-xs text-muted-foreground">Deliverables</div></div>
                <div><div className="text-2xl font-display font-bold text-primary">8</div><div className="text-xs text-muted-foreground">Milestones</div></div>
                <div><div className="text-2xl font-display font-bold text-primary">4</div><div className="text-xs text-muted-foreground">Gaps</div></div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => navigate('/dashboard')} className="font-display" size="lg">
                Launch Project →
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
