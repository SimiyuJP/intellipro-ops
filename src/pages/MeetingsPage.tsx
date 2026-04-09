import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { Meeting } from '@/types/project';

function MeetingStatusBadge({ status }: { status: Meeting['status'] }) {
  return (
    <span className={`text-[10px] font-display px-2 py-0.5 rounded border ${
      status === 'completed'
        ? 'text-health-green bg-health-green/10 border-health-green/30'
        : 'text-primary bg-primary/10 border-primary/30'
    }`}>
      {status.toUpperCase()}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const cls = source === 'blocker'
    ? 'text-health-red bg-health-red/10'
    : source === 'overdue'
    ? 'text-health-yellow bg-health-yellow/10'
    : source === 'decision'
    ? 'text-primary bg-primary/10'
    : 'text-muted-foreground bg-muted/50';
  return <span className={`text-[9px] font-display px-1.5 py-0.5 rounded ${cls}`}>{source.toUpperCase()}</span>;
}

export default function MeetingsPage() {
  const { activeProject } = useProject();

  if (!activeProject) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-4xl mb-4">📂</div>
            <h2 className="font-display text-xl font-bold mb-2">No Project Selected</h2>
            <p className="text-sm text-muted-foreground">Select a project from the sidebar.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const meetings = activeProject.meetings;
  const upcoming = meetings.filter(m => m.status === 'upcoming');
  const completed = meetings.filter(m => m.status === 'completed');

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Meeting Killer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeProject.name} — AI-generated agendas & auto-minutes
          </p>
        </div>

        {/* Upcoming Meetings */}
        {upcoming.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xs text-muted-foreground uppercase tracking-wider">Upcoming — AI-Generated Agenda</h2>
            {upcoming.map((m, i) => {
              const rooms = m.roomIds.map(rid => activeProject.rooms.find(r => r.id === rid)).filter(Boolean);
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-elevated p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MeetingStatusBadge status={m.status} />
                        <span className="text-xs text-muted-foreground">{m.date}</span>
                      </div>
                      <h3 className="font-display font-bold">{m.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {rooms.map(r => r && (
                          <span key={r.id} className="text-xs text-muted-foreground">{r.icon} {r.name}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.agenda.reduce((sum, a) => sum + a.duration, 0)} min total
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-display text-muted-foreground mb-2 uppercase tracking-wider">AI-Generated Agenda</div>
                    <div className="space-y-2">
                      {m.agenda.map((item, j) => (
                        <div key={j} className="flex items-center justify-between bg-secondary/30 rounded px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-display text-muted-foreground w-5">{j + 1}.</span>
                            <span className="text-sm">{item.topic}</span>
                            <SourceBadge source={item.source} />
                          </div>
                          <span className="text-xs text-muted-foreground font-display">{item.duration}m</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-display uppercase tracking-wider">Attendees:</span> {m.attendees.join(', ')}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Completed Meetings */}
        {completed.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xs text-muted-foreground uppercase tracking-wider">Completed — Auto-Minutes</h2>
            {completed.map((m, i) => {
              const rooms = m.roomIds.map(rid => activeProject.rooms.find(r => r.id === rid)).filter(Boolean);
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MeetingStatusBadge status={m.status} />
                        <span className="text-xs text-muted-foreground">{m.date}</span>
                      </div>
                      <h3 className="font-display font-bold">{m.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {rooms.map(r => r && (
                          <span key={r.id} className="text-xs text-muted-foreground">{r.icon} {r.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {m.minutes && (
                    <div>
                      <div className="text-xs font-display text-muted-foreground mb-1.5 uppercase tracking-wider">AI Summary</div>
                      <p className="text-sm text-foreground/80 bg-secondary/20 rounded p-3">{m.minutes}</p>
                    </div>
                  )}

                  {m.actionItems.length > 0 && (
                    <div>
                      <div className="text-xs font-display text-muted-foreground mb-2 uppercase tracking-wider">Action Items</div>
                      <div className="space-y-2">
                        {m.actionItems.map(ai => (
                          <div key={ai.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={ai.status === 'done' ? 'text-health-green' : 'text-muted-foreground'}>
                                {ai.status === 'done' ? '✓' : '○'}
                              </span>
                              <span className={ai.status === 'done' ? 'line-through text-muted-foreground' : ''}>{ai.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{ai.owner}</span>
                              <span>·</span>
                              <span>{ai.dueDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    <span className="font-display uppercase tracking-wider">Attendees:</span> {m.attendees.join(', ')}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {meetings.length === 0 && (
          <div className="glass-card p-10 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="font-display font-bold mb-2">No Meetings Scheduled</h3>
            <p className="text-sm text-muted-foreground">The AI will auto-generate agendas from blockers and overdue work.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
