import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { Decision } from '@/types/project';

function StatusBadge({ status }: { status: Decision['status'] }) {
  const cls = status === 'active'
    ? 'text-health-green bg-health-green/10 border-health-green/30'
    : status === 'revisited'
    ? 'text-health-yellow bg-health-yellow/10 border-health-yellow/30'
    : 'text-health-red bg-health-red/10 border-health-red/30';
  return (
    <span className={`text-[10px] font-display px-2 py-0.5 rounded border ${cls}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default function DecisionsPage() {
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

  const decisions = activeProject.decisions;

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Decision Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeProject.name} — {decisions.length} decisions recorded
          </p>
        </div>

        <div className="space-y-4">
          {decisions.map((d, i) => {
            const room = activeProject.rooms.find(r => r.id === d.roomId);
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{room?.icon}</span>
                      <span className="text-xs text-muted-foreground font-display">{room?.name}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{d.date}</span>
                    </div>
                    <h3 className="font-display font-bold text-sm">{d.title}</h3>
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                <p className="text-sm text-foreground/80">{d.description}</p>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-display text-muted-foreground mb-1 uppercase tracking-wider">Decided By</div>
                    <div className="text-foreground">{d.decidedBy}</div>
                  </div>
                  <div>
                    <div className="font-display text-muted-foreground mb-1 uppercase tracking-wider">Approved By</div>
                    <div className="text-foreground">{d.approvedBy}</div>
                  </div>
                </div>

                {d.alternativesRejected.length > 0 && (
                  <div>
                    <div className="text-xs font-display text-muted-foreground mb-1.5 uppercase tracking-wider">Alternatives Rejected</div>
                    <div className="space-y-1">
                      {d.alternativesRejected.map((alt, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs text-foreground/70">
                          <span className="text-health-red mt-0.5">✕</span>
                          <span>{alt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {d.assumptions.length > 0 && (
                  <div>
                    <div className="text-xs font-display text-muted-foreground mb-1.5 uppercase tracking-wider">Assumptions</div>
                    <div className="space-y-1">
                      {d.assumptions.map((a, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs text-foreground/70">
                          <span className="text-health-yellow mt-0.5">△</span>
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {decisions.length === 0 && (
          <div className="glass-card p-10 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-display font-bold mb-2">No Decisions Logged</h3>
            <p className="text-sm text-muted-foreground">Use the Command interface to log decisions.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
