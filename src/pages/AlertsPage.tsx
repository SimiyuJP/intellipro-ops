import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useProject } from '@/contexts/ProjectContext';
import { RedFlag } from '@/types/project';

function SeverityIcon({ severity }: { severity: RedFlag['severity'] }) {
  if (severity === 'critical') return <span className="text-health-red text-lg">🔴</span>;
  if (severity === 'warning') return <span className="text-health-yellow text-lg">🟡</span>;
  return <span className="text-muted-foreground text-lg">🔵</span>;
}

function TypeBadge({ type }: { type: RedFlag['type'] }) {
  const labels: Record<string, string> = {
    stale_room: 'STALE',
    slipping_milestone: 'SLIPPING',
    unresolved_blocker: 'UNRESOLVED',
    missing_owner: 'UNOWNED',
    scope_creep: 'SCOPE CREEP',
    overloaded_member: 'OVERLOAD',
  };
  return (
    <span className="text-[9px] font-display px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
      {labels[type] || type}
    </span>
  );
}

export default function AlertsPage() {
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

  const redFlags = activeProject.redFlags;
  const scopeChanges = activeProject.scopeChanges;
  const criticalFlags = redFlags.filter(f => f.severity === 'critical');
  const warningFlags = redFlags.filter(f => f.severity === 'warning');
  const infoFlags = redFlags.filter(f => f.severity === 'info');

  // Scope creep detection
  const addedWithoutTradeoff = scopeChanges.filter(sc => sc.type === 'added' && !sc.hasTradeoff);

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Red Flag Alerts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeProject.name} — {redFlags.length} active alerts
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-display">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-health-red" /> {criticalFlags.length} Critical</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-health-yellow" /> {warningFlags.length} Warning</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> {infoFlags.length} Info</span>
          </div>
        </div>

        {/* Scope Creep Alert */}
        {addedWithoutTradeoff.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-health-yellow/50 bg-health-yellow/5 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚠️</span>
              <h2 className="font-display font-bold text-sm text-health-yellow">Scope Creep Detected</h2>
            </div>
            <p className="text-sm text-foreground/80 mb-3">
              {addedWithoutTradeoff.length} new item{addedWithoutTradeoff.length > 1 ? 's were' : ' was'} added this period without a corresponding deadline or budget adjustment.
            </p>
            <div className="space-y-2">
              {addedWithoutTradeoff.map(sc => (
                <div key={sc.id} className="flex items-start gap-2 text-sm">
                  <span className="text-health-yellow mt-0.5">+</span>
                  <div>
                    <span>{sc.description}</span>
                    <span className="text-xs text-muted-foreground ml-2">— {sc.addedBy}, {sc.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Red Flags */}
        <div className="space-y-3">
          {redFlags.map((flag, i) => {
            const room = flag.roomId ? activeProject.rooms.find(r => r.id === flag.roomId) : null;
            return (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass-card p-4 border-l-4 ${
                  flag.severity === 'critical' ? 'border-l-health-red' :
                  flag.severity === 'warning' ? 'border-l-health-yellow' : 'border-l-primary'
                }`}
              >
                <div className="flex items-start gap-3">
                  <SeverityIcon severity={flag.severity} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-display font-bold text-sm">{flag.title}</h3>
                      <TypeBadge type={flag.type} />
                    </div>
                    <p className="text-sm text-foreground/70">{flag.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {room && <span>{room.icon} {room.name}</span>}
                      <span>Detected: {flag.detectedAt}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Scope Change Log */}
        {scopeChanges.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">Scope Change Log</h2>
            <div className="space-y-2">
              {scopeChanges.map(sc => (
                <div key={sc.id} className="flex items-start gap-2 text-sm">
                  <span className={
                    sc.type === 'added' ? 'text-health-green' :
                    sc.type === 'removed' ? 'text-health-red' : 'text-health-yellow'
                  }>
                    {sc.type === 'added' ? '+' : sc.type === 'removed' ? '−' : '~'}
                  </span>
                  <div className="flex-1">
                    <span>{sc.description}</span>
                    {sc.hasTradeoff && sc.tradeoffNote && (
                      <div className="text-xs text-muted-foreground mt-0.5 italic">Tradeoff: {sc.tradeoffNote}</div>
                    )}
                    {!sc.hasTradeoff && sc.type === 'added' && (
                      <div className="text-xs text-health-yellow mt-0.5">⚠ No tradeoff recorded</div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{sc.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {redFlags.length === 0 && (
          <div className="glass-card p-10 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="font-display font-bold mb-2">No Red Flags</h3>
            <p className="text-sm text-muted-foreground">All systems operating normally.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
