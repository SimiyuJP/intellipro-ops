import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { ChatMessage, Project } from '@/types/project';
import { FileUpload, UploadedFile } from '@/components/FileUpload';
import { computeDrift, analyzeAssumptions, generateSignals, filterSignals } from '@/lib/intelligence';

const quickCommands = [
  { cmd: '/status', label: 'Project Status' },
  { cmd: '/blockers', label: 'Blockers' },
  { cmd: '/risks', label: 'Risks' },
  { cmd: '/confidence', label: 'Confidence' },
  { cmd: '/decisions', label: 'Decisions' },
  { cmd: '/red-flags', label: 'Red Flags' },
  { cmd: '/scope-creep', label: 'Scope Creep' },
  { cmd: '/drift', label: 'Drift' },
  { cmd: '/assumptions', label: 'Assumptions' },
  { cmd: '/signals', label: 'Signals' },
  { cmd: '/who-is-lagging', label: 'Who\'s Lagging' },
  { cmd: '/next', label: 'Next Priorities' },
  { cmd: '/weekly-report', label: 'Weekly Report' },
  { cmd: '/projects', label: 'List Projects' },
];

function generateResponse(input: string, project: Project | null, projects: Project[], switchProject: (id: string | null) => void): string {
  const q = input.toLowerCase().trim();

  // /projects command
  if (q === '/projects') {
    return `**Available Projects:**\n\n${projects.map((p, i) => `${i + 1}. **${p.name}** — ${p.healthStatus.toUpperCase()} (${p.healthScore}%) ${p.id === project?.id ? '← ACTIVE' : ''}`).join('\n')}\n\nTo switch, type: \`/switch <project name>\``;
  }

  // /switch command
  if (q.startsWith('/switch ')) {
    const name = input.slice(8).trim().toLowerCase();
    const match = projects.find(p => p.name.toLowerCase().includes(name));
    if (match) {
      switchProject(match.id);
      return `✅ Switched active project to **${match.name}**.\n\nAll data now scoped to this project. Ask me anything about it.`;
    }
    return `❌ No project found matching "${input.slice(8).trim()}".\n\nAvailable projects:\n${projects.map(p => `• ${p.name}`).join('\n')}\n\nTry: \`/switch ${projects[0].name}\``;
  }

  // No project selected guard
  if (!project) {
    return `⚠️ **No project selected.** Please choose an active project from the sidebar, or type \`/projects\` to list available projects and \`/switch <name>\` to activate one.`;
  }

  if (q === '/status' || q.includes('where are we') || q.includes('status')) {
    return `**Project: ${project.name}**\n**Health: ${project.healthStatus.toUpperCase()} (${project.healthScore}%)**\n\n**Critical Blockers:**\n${project.blockers.filter(b => b.severity === 'critical').map(b => `• ${b.title} — Owner: ${b.owner}`).join('\n') || '• None'}\n\n**Room Health:**\n${project.rooms.map(r => `• ${r.icon} ${r.name}: ${r.healthStatus.toUpperCase()} (${r.healthScore}%)`).join('\n')}\n\n**Team Members:**\n${project.teamMembers.map(t => `• ${t.name} (${t.role}) — last update: ${t.lastUpdate}`).join('\n')}\n\n**Milestones:**\n${project.milestones.map(m => `• ${m.title} — ${m.dueDate} [${m.status.replace('_', ' ').toUpperCase()}]`).join('\n')}`;
  }

  if (q === '/blockers' || q.includes('blocked') || q.includes('blocker')) {
    if (project.blockers.length === 0) return `**${project.name}** — No active blockers! 🎉`;
    return `**Active Blockers in ${project.name} (${project.blockers.length})**\n\n${project.blockers.map(b => {
      const room = project.rooms.find(r => r.id === b.roomId);
      return `**${b.severity.toUpperCase()}** — ${b.title}\n  Room: ${room?.name} · Owner: ${b.owner}\n  ${b.description}`;
    }).join('\n\n')}`;
  }

  if (q === '/risks' || q.includes('risk') || q.includes('deadline')) {
    const overdueCount = project.rooms.flatMap(r => r.deliverables).filter(d => d.status !== 'done' && new Date(d.dueDate) < new Date()).length;
    const unstaffedRooms = project.rooms.filter(r => r.teamMembers.length === 0);
    return `**Risk Assessment — ${project.name}**\n\n${project.blockers.filter(b => b.severity === 'critical').length > 0 ? `🔴 **HIGH RISK: Critical Blockers**\n${project.blockers.filter(b => b.severity === 'critical').map(b => `• ${b.title}`).join('\n')}\n\n` : ''}${overdueCount > 0 ? `🔴 **Overdue Items:** ${overdueCount} deliverables past due date\n\n` : ''}${unstaffedRooms.length > 0 ? `🟡 **Staffing Gaps:** ${unstaffedRooms.map(r => r.name).join(', ')} rooms have no team members\n\n` : ''}**Deadline:** ${project.deadline}\n**Budget:** ${project.budget}`;
  }

  if (q === '/who-is-lagging' || q.includes('lagging') || q.includes('follow up')) {
    const today = new Date();
    const lagging = project.teamMembers.filter(tm => {
      if (!tm.lastUpdate) return true;
      const diff = (today.getTime() - new Date(tm.lastUpdate).getTime()) / (1000 * 60 * 60 * 24);
      return diff > 3;
    });
    const unstaffed = project.rooms.filter(r => r.teamMembers.length === 0);
    let report = `**Accountability Report — ${project.name}**\n\n`;
    if (lagging.length > 0) {
      report += lagging.map(tm => `⚠️ **${tm.name}** (${tm.role})\nLast update: ${tm.lastUpdate || 'Never'}`).join('\n\n');
    } else {
      report += '✅ All team members have recent updates.\n';
    }
    if (unstaffed.length > 0) {
      report += `\n\n⚠️ **Unstaffed Rooms:** ${unstaffed.map(r => `${r.icon} ${r.name}`).join(', ')}`;
    }
    return report;
  }

  if (q === '/confidence' || q.includes('confidence')) {
    return `**Confidence Scoring — ${project.name}**\n\nHealth ≠ Confidence. Health shows current status. Confidence shows how much we *trust* that status.\n\n${project.rooms.map(r => {
      const flag = r.healthStatus === 'green' && r.confidence < 60 ? ' ⚠️ GREEN BUT LOW CONFIDENCE' : '';
      return `**${r.icon} ${r.name}**: Health ${r.healthStatus.toUpperCase()} (${r.healthScore}%) · Confidence **${r.confidence}%**${flag}\n${r.confidenceFactors.map(f => `  → ${f.label}: ${f.score}% — ${f.reason}`).join('\n')}`;
    }).join('\n\n')}`;
  }

  if (q === '/decisions' || q.includes('decision') || q.includes('why did we') || q.includes('why are we')) {
    if (project.decisions.length === 0) return `**${project.name}** — No decisions logged yet.`;
    return `**Decision Log — ${project.name}** (${project.decisions.length} recorded)\n\n${project.decisions.map(d => {
      const room = project.rooms.find(r => r.id === d.roomId);
      return `**${d.title}** [${d.status.toUpperCase()}]\n  Room: ${room?.name} · Decided by: ${d.decidedBy} · Approved by: ${d.approvedBy} · ${d.date}\n  ${d.description}\n  Rejected: ${d.alternativesRejected.join('; ')}\n  Assumptions: ${d.assumptions.join('; ')}`;
    }).join('\n\n')}`;
  }

  if (q === '/red-flags' || q.includes('red flag') || q.includes('alert')) {
    if (project.redFlags.length === 0) return `**${project.name}** — No red flags detected. ✅`;
    const critical = project.redFlags.filter(f => f.severity === 'critical');
    const warnings = project.redFlags.filter(f => f.severity === 'warning');
    return `**🚩 Red Flag Alerts — ${project.name}** (${project.redFlags.length} active)\n\n${critical.length > 0 ? `**CRITICAL (${critical.length}):**\n${critical.map(f => `🔴 ${f.title}\n  ${f.description}`).join('\n\n')}\n\n` : ''}${warnings.length > 0 ? `**WARNINGS (${warnings.length}):**\n${warnings.map(f => `🟡 ${f.title}\n  ${f.description}`).join('\n\n')}` : ''}`;
  }

  if (q === '/scope-creep' || q.includes('scope')) {
    if (project.scopeChanges.length === 0) return `**${project.name}** — No scope changes recorded.`;
    const added = project.scopeChanges.filter(sc => sc.type === 'added');
    const noTradeoff = added.filter(sc => !sc.hasTradeoff);
    return `**Scope Creep Analysis — ${project.name}**\n\n**Changes This Period:** ${project.scopeChanges.length} total\n• Added: ${added.length}\n• Removed: ${project.scopeChanges.filter(sc => sc.type === 'removed').length}\n• Modified: ${project.scopeChanges.filter(sc => sc.type === 'modified').length}\n\n${noTradeoff.length > 0 ? `⚠️ **SCOPE CREEP ALERT:** ${noTradeoff.length} item${noTradeoff.length > 1 ? 's' : ''} added without deadline/budget adjustment:\n${noTradeoff.map(sc => `• ${sc.description} — added by ${sc.addedBy} on ${sc.date}`).join('\n')}\n\n` : '✅ All scope changes have recorded tradeoffs.\n\n'}**Full Log:**\n${project.scopeChanges.map(sc => `${sc.type === 'added' ? '+' : sc.type === 'removed' ? '−' : '~'} ${sc.description} (${sc.date})${sc.hasTradeoff ? ` ✓ Tradeoff: ${sc.tradeoffNote}` : ' ⚠ No tradeoff'}`).join('\n')}`;
  }

  if (q === '/next' || q.includes('priorit') || q.includes('next')) {
    const notDone = project.rooms.flatMap(r => r.deliverables).filter(d => d.status !== 'done').sort((a, b) => {
      const p: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (p[a.priority] ?? 4) - (p[b.priority] ?? 4);
    });
    return `**Next Priorities — ${project.name}**\n\n${notDone.slice(0, 5).map((d, i) => `${i + 1}. **${d.title}** — Owner: ${d.owner}\n   Priority: ${d.priority.toUpperCase()} · Due: ${d.dueDate} · Status: ${d.status.replace('_', ' ')}`).join('\n\n')}`;
  }

  if (q === '/weekly-report' || q.includes('weekly') || q.includes('report') || q.includes('summary') || q.includes('ceo')) {
    const done = project.rooms.flatMap(r => r.deliverables).filter(d => d.status === 'done');
    const inProg = project.rooms.flatMap(r => r.deliverables).filter(d => d.status === 'in_progress');
    const blockedD = project.rooms.flatMap(r => r.deliverables).filter(d => d.status === 'blocked');
    const total = project.rooms.flatMap(r => r.deliverables).length;
    return `**Weekly Status Report — ${project.name}**\n*Generated ${new Date().toLocaleDateString()}*\n\n---\n\n**Overall: ${project.healthStatus.toUpperCase()} (${project.healthScore}%)**\n\n**Progress:** ${done.length}/${total} deliverables complete (${Math.round(done.length / total * 100)}%)\n• In Progress: ${inProg.length}\n• Blocked: ${blockedD.length}\n\n**Room Status:**\n${project.rooms.map(r => `• ${r.icon} ${r.name}: ${r.healthStatus.toUpperCase()} (${r.healthScore}%)`).join('\n')}\n\n**Active Blockers:**\n${project.blockers.map(b => `• ${b.title} (${b.severity})`).join('\n') || '• None'}\n\n**Team:**\n${project.teamMembers.map(t => `• ${t.name} — ${t.role}`).join('\n')}\n\n---\n*Report scoped to: ${project.name} (${project.id})*`;
  }

  // Room-specific queries
  const roomMatch = project.rooms.find(r => q.includes(`room ${r.name.toLowerCase()}`));
  if (roomMatch) {
    return `**${roomMatch.name} Room Status — ${project.name}: ${roomMatch.healthStatus.toUpperCase()} (${roomMatch.healthScore}%)**\n\n**Objective:** ${roomMatch.objective}\n\n**Deliverables:**\n${roomMatch.deliverables.map(d => `• ${d.status === 'done' ? '✅' : d.status === 'blocked' ? '🔴' : d.status === 'in_progress' ? '🟡' : '⚪'} ${d.title} — ${d.owner} (due ${d.dueDate})`).join('\n')}\n\n${roomMatch.blockers.length > 0 ? `**Blockers:**\n${roomMatch.blockers.map(b => `• ${b.title}: ${b.description}`).join('\n')}\n\n` : ''}**AI Recommendations:**\n${roomMatch.recommendations.map(r => `→ ${r}`).join('\n')}`;
  }

  return `**Project: ${project.name}** (${project.id})\nHealth: **${project.healthStatus.toUpperCase()} (${project.healthScore}%)**\nRooms: ${project.rooms.length} · Blockers: ${project.blockers.length} · Team: ${project.teamMembers.length}\n\nTry: \`/status\`, \`/blockers\`, \`/risks\`, \`/who-is-lagging\`, \`/next\`, \`/weekly-report\`\nOr: \`/projects\`, \`/switch <name>\``;
}

export default function ChatPage() {
  const { activeProject, activeProjectId, projects, setActiveProjectId, getChatMessages, setChatMessages } = useProject();
  const projectMessages = activeProjectId ? getChatMessages(activeProjectId) : [];

  const getInitialMessage = (): ChatMessage => ({
    id: '0',
    role: 'assistant',
    content: activeProject
      ? `**Project Pulse Command Interface**\n\nConnected to: **${activeProject.name}**\nHealth: **${activeProject.healthStatus.toUpperCase()} (${activeProject.healthScore}%)**\n\n⚠️ All queries are scoped to this project only. To switch projects, use \`/projects\` or \`/switch <name>\`.\n\nAsk me anything about your project, or use quick commands below.`
      : `**Project Pulse Command Interface**\n\n⚠️ **No project selected.** Please choose a project from the sidebar or type \`/projects\` to list available projects.`,
    timestamp: new Date().toISOString(),
  });

  const messages = projectMessages.length > 0 ? projectMessages : [getInitialMessage()];

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatFiles, setChatFiles] = useState<UploadedFile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const setMessages = (msgs: ChatMessage[]) => {
    if (activeProjectId) {
      setChatMessages(activeProjectId, msgs);
    }
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(msg, activeProject, projects, (id) => {
        setActiveProjectId(id);
      });
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages([...newMessages, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen">
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-display font-bold">Command Interface</h1>
            <p className="text-xs text-muted-foreground">
              {activeProject ? `Scoped to: ${activeProject.name}` : 'No project selected'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeProject && (
              <span className={`text-[10px] font-display px-2 py-0.5 rounded ${
                activeProject.healthStatus === 'green' ? 'text-health-green bg-health-green/10' :
                activeProject.healthStatus === 'yellow' ? 'text-health-yellow bg-health-yellow/10' :
                'text-health-red bg-health-red/10'
              }`}>
                {activeProject.healthStatus.toUpperCase()} {activeProject.healthScore}%
              </span>
            )}
            <span className="w-2 h-2 rounded-full bg-health-green animate-pulse" />
            <span className="text-xs text-muted-foreground font-display">CONNECTED</span>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border/50 flex gap-2 flex-wrap shrink-0">
          {quickCommands.map(qc => (
            <button
              key={qc.cmd}
              onClick={() => handleSend(qc.cmd)}
              className="command-input px-3 py-1.5 text-xs hover:border-primary/50 hover:text-primary transition-colors"
            >
              {qc.cmd}
            </button>
          ))}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-primary/15 border border-primary/20 rounded-lg rounded-br-sm px-4 py-3'
                  : 'glass-card px-4 py-3 rounded-lg rounded-bl-sm'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="text-[10px] font-display text-primary mb-2">PULSE AI</div>
                )}
                <div className="text-sm whitespace-pre-wrap leading-relaxed chat-content">
                  {msg.content.split('\n').map((line, j) => {
                    let rendered = line;
                    rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    rendered = rendered.replace(/`(.*?)`/g, '<code class="bg-secondary px-1 rounded text-primary font-display text-xs">$1</code>');
                    return (
                      <span key={j}>
                        <span dangerouslySetInnerHTML={{ __html: rendered }} />
                        {j < msg.content.split('\n').length - 1 && <br />}
                      </span>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="glass-card px-4 py-3 rounded-lg rounded-bl-sm">
                <div className="text-[10px] font-display text-primary mb-2">PULSE AI</div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-4 border-t border-border shrink-0 space-y-2">
          <FileUpload files={chatFiles} onFilesChange={setChatFiles} compact />
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); setChatFiles([]); }} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeProject ? `Ask about ${activeProject.name}...` : 'Select a project first...'}
              className="command-input flex-1 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-display text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
