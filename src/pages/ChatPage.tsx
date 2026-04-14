import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { ChatMessage } from '@/types/project';
import { FileUpload, UploadedFile } from '@/components/FileUpload';
import { generateResponse } from '@/lib/chatEngine';

const quickCommands = [
  { cmd: '/status', label: 'Status' },
  { cmd: '/blockers', label: 'Blockers' },
  { cmd: '/risks', label: 'Risks' },
  { cmd: '/who-is-lagging', label: "Who's Lagging" },
  { cmd: '/team', label: 'Team' },
  { cmd: '/next', label: 'Priorities' },
  { cmd: '/report', label: 'Weekly Report' },
  { cmd: '/drift', label: 'Drift' },
  { cmd: '/milestones', label: 'Milestones' },
  { cmd: '/scope', label: 'Scope' },
  { cmd: '/decisions', label: 'Decisions' },
  { cmd: '/assumptions', label: 'Assumptions' },
  { cmd: '/signals', label: 'Signals' },
  { cmd: '/projects', label: 'Projects' },
  { cmd: '/help', label: 'Help' },
];


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
