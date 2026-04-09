import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { seedProject } from '@/data/seedProject';
import { ChatMessage } from '@/types/project';
import { FileUpload, UploadedFile } from '@/components/FileUpload';

const quickCommands = [
  { cmd: '/status', label: 'Project Status' },
  { cmd: '/blockers', label: 'Blockers' },
  { cmd: '/risks', label: 'Risks' },
  { cmd: '/who-is-lagging', label: 'Who\'s Lagging' },
  { cmd: '/next', label: 'Next Priorities' },
  { cmd: '/weekly-report', label: 'Weekly Report' },
];

function generateResponse(input: string): string {
  const q = input.toLowerCase().trim();
  const project = seedProject;

  if (q === '/status' || q.includes('where are we') || q.includes('status')) {
    return `**Project Health: Yellow (${project.healthScore}%)**

**Critical Blockers:**
${project.blockers.filter(b => b.severity === 'critical').map(b => `• ${b.title} — Owner: ${b.owner}`).join('\n')}

**What's Done:**
• Research competitor analysis completed
• Dashboard wireframe implementation done
• Search Console OAuth flow working
• 3 of 10 user interviews completed

**What's At Risk:**
• Launch date risk: **HIGH** — Tech room at ${project.rooms.find(r => r.id === 'room-tech')?.healthScore}%
• Design system deadline: **AT RISK** — no designer assigned
• Ads timeline risk: **MEDIUM** — depends on positioning doc

**Room Health:**
${project.rooms.map(r => `• ${r.icon} ${r.name}: ${r.healthStatus.toUpperCase()} (${r.healthScore}%)`).join('\n')}`;
  }

  if (q === '/blockers' || q.includes('blocked') || q.includes('blocker')) {
    return `**Active Blockers (${project.blockers.length})**

${project.blockers.map(b => {
  const room = project.rooms.find(r => r.id === b.roomId);
  return `**${b.severity.toUpperCase()}** — ${b.title}
  Room: ${room?.name} · Owner: ${b.owner}
  ${b.description}`;
}).join('\n\n')}

**Impact:** Ahrefs API blocker is on the critical path — if unresolved by April 10, the dashboard beta milestone will slip.`;
  }

  if (q === '/risks' || q.includes('risk') || q.includes('deadline')) {
    return `**Risk Assessment**

🔴 **HIGH RISK: Launch Timeline**
If the Ahrefs API key is not provisioned by April 10, the entire API integration milestone slips, pushing dashboard beta from April 22 to April 29+. This cascades to landing page (needs demo screenshots), training docs, and launch.

🔴 **HIGH RISK: Staffing Gaps**
4 critical gaps detected:
• ML/AI Engineer — AI Insights Engine has no owner
• UI/UX Designer — Design room completely unstaffed
• Ops Lead — Training docs and onboarding unowned
• Copywriter — Landing page content at risk

🟡 **MEDIUM RISK: Marketing Dependencies**
Landing page design blocked by: missing brand assets, missing demo screenshots from Tech.

🟡 **MEDIUM RISK: Research Velocity**
Only 3/10 user interviews completed. Customer contact list still pending from Sales.

**Confidence of hitting May 6 launch: 35%**
*To restore confidence: resolve Ahrefs API + hire designer + assign ops lead within 3 days.*`;
  }

  if (q === '/who-is-lagging' || q.includes('lagging') || q.includes('follow up')) {
    return `**Accountability Report**

⚠️ **Alex Chen** (Tech Lead)
Last update: April 2 — **6 days ago**
Has 2 critical deliverables in progress. No update on GA4 pipeline (overdue).
*Recommendation: Immediate follow-up required.*

⚠️ **Operations Room**
No team lead assigned. 2 deliverables with no owner.
Both depend on Dashboard completion.
*Recommendation: Assign ops lead or these will slip past deadline.*

⚠️ **Design Room**
Completely unstaffed. 2 deliverables unowned. Brand assets overdue.
*Recommendation: URGENT — hire/contract designer this week.*

✅ **Jordan Blake** (Marketing) — Updated 2 days ago, on track
✅ **Sarah Kim** (Frontend Dev) — Updated 1 day ago, active
✅ **Priya Patel** (Research) — Updated 3 days ago, progressing`;
  }

  if (q === '/next' || q.includes('priorit') || q.includes('what should') || q.includes('next')) {
    return `**Next 5 Priorities (Critical Path Order)**

1. **Resolve Ahrefs API key** — Owner: Marcus Webb
   *Blocking: Ahrefs integration → Dashboard data → Beta launch*

2. **Hire/contract UI/UX designer** — Owner: Marcus Webb
   *Blocking: Brand assets → Landing page → Marketing launch*

3. **Follow up with Alex Chen** — Owner: Project Owner
   *6 days without update. GA4 pipeline is overdue.*

4. **Finalize positioning document** — Owner: Jordan Blake (due Apr 11)
   *Blocking: Landing page copy, ad campaign planning*

5. **Assign Operations lead** — Owner: Marcus Webb
   *Training docs and onboarding flow have no owner*

**Critical path warning:** If items 1 and 2 are not resolved by end of this week, the May 6 launch date becomes unachievable.`;
  }

  if (q === '/weekly-report' || q.includes('weekly') || q.includes('report') || q.includes('summary') || q.includes('ceo')) {
    return `**Weekly Status Report — AI SEO Dashboard**
*Generated April 8, 2026*

---

**Overall: YELLOW (62%) — Action Required**

**Executive Summary:**
Project is progressing in Marketing and Research but stalled in Tech due to missing API credentials and staffing gaps. Design and Ops rooms are critically understaffed. Launch date of May 6 is at HIGH RISK without immediate intervention.

**Completed This Week:**
✅ Dashboard wireframe implementation (Sarah Kim)
✅ Competitor analysis delivered (Priya Patel)
✅ Search Console OAuth flow working (Alex Chen)
✅ 3 user interviews completed (Priya Patel)

**Blocked:**
🔴 Ahrefs API key not provisioned (blocks integration milestone)
🔴 No designer assigned (blocks brand assets + landing page)
🔴 No ops lead (training docs + onboarding unowned)
🟡 Customer contact list needed for research interviews

**Key Metrics:**
• Deliverables completed: 1/14 (7%)
• Deliverables blocked: 1/14
• Deliverables overdue: 2/14
• Team update frequency: 60% (target: daily)

**Immediate Actions Required:**
1. Procure Ahrefs API key (Marcus Webb)
2. Hire designer (Marcus Webb)
3. Follow up with Alex Chen (6 days silent)
4. Assign ops lead (Marcus Webb)
5. Provide customer list to Research (Sales team)

**Next Week Goals:**
• Complete all 3 API integrations
• Finalize positioning document
• Complete 7 remaining user interviews
• Assign design and ops roles

---
*Report generated by Project Pulse AI from ${project.updates.length} updates, ${project.deliverables.length} deliverables, and ${project.blockers.length} blockers.*`;
  }

  if (q.includes('room tech') || q.includes('engineering') || q.includes('technical')) {
    const tech = project.rooms.find(r => r.id === 'room-tech')!;
    return `**Tech Room Status: RED (${tech.healthScore}%)**

**Objective:** ${tech.objective}

**Deliverables:**
${tech.deliverables.map(d => `• ${d.status === 'done' ? '✅' : d.status === 'blocked' ? '🔴' : d.status === 'in_progress' ? '🟡' : '⚪'} ${d.title} — ${d.owner} (due ${d.dueDate})`).join('\n')}

**Blockers:**
${tech.blockers.map(b => `• ${b.title}: ${b.description}`).join('\n')}

**AI Recommendations:**
${tech.recommendations.map(r => `→ ${r}`).join('\n')}`;
  }

  if (q.includes('room marketing')) {
    const mkt = project.rooms.find(r => r.id === 'room-marketing')!;
    return `**Marketing Room Status: GREEN (${mkt.healthScore}%)**

**Objective:** ${mkt.objective}

**Deliverables:**
${mkt.deliverables.map(d => `• ${d.status === 'done' ? '✅' : d.status === 'in_progress' ? '🟡' : '⚪'} ${d.title} — ${d.owner} (due ${d.dueDate})`).join('\n')}

**On Track:** Positioning document due April 11.
**Dependency:** Landing page needs demo screenshots from Tech + brand assets from Design.`;
  }

  return `I can help you understand project status. Here's what I found:

**Project: ${project.name}**
Health: **${project.healthStatus.toUpperCase()} (${project.healthScore}%)**
Active blockers: ${project.blockers.length}
Overdue items: ${project.rooms.flatMap(r => r.deliverables).filter(d => d.status !== 'done' && new Date(d.dueDate) < new Date()).length}

Try these commands for specific insights:
• \`/status\` — Full project status
• \`/blockers\` — Active blockers
• \`/risks\` — Risk assessment
• \`/who-is-lagging\` — Accountability report
• \`/next\` — Next priorities
• \`/weekly-report\` — Executive summary

Or ask me anything like:
• "Where are we?"
• "What's the risk of missing the deadline?"
• "Summarize progress for the CEO"`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `**Project Pulse Command Interface**

Connected to: **${seedProject.name}**
Health: **YELLOW (${seedProject.healthScore}%)**

Ask me anything about your project, or use quick commands below.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateResponse(msg);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-display font-bold">Command Interface</h1>
            <p className="text-xs text-muted-foreground">AI-powered project status queries</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-health-green animate-pulse" />
            <span className="text-xs text-muted-foreground font-display">CONNECTED</span>
          </div>
        </div>

        {/* Quick Commands */}
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

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
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
                    // Simple markdown-like rendering
                    let rendered = line;
                    // Bold
                    rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    // Code
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
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

        {/* Input */}
        <div className="p-4 border-t border-border shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about project status, or type /status, /blockers, /risks..."
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
