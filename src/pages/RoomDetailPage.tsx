import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { HealthMeter } from '@/components/HealthMeter';
import { HealthBadge } from '@/components/HealthBadge';
import { seedProject } from '@/data/seedProject';
import { FileUpload, UploadedFile } from '@/components/FileUpload';

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') return <span className="text-health-green">✓</span>;
  if (status === 'blocked') return <span className="text-health-red">✕</span>;
  if (status === 'in_progress') return <span className="text-health-yellow">◉</span>;
  return <span className="text-muted-foreground">○</span>;
}

export default function RoomDetailPage() {
  const { roomId } = useParams();
  const room = seedProject.rooms.find(r => r.id === roomId);
  const [updateText, setUpdateText] = useState('');
  const [updateFiles, setUpdateFiles] = useState<UploadedFile[]>([]);

  if (!room) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-muted-foreground">Room not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link to="/rooms" className="text-muted-foreground hover:text-foreground text-sm font-display">← Rooms</Link>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{room.icon}</span>
                <h1 className="text-2xl font-display font-bold">{room.name} Room</h1>
                <HealthBadge status={room.healthStatus} label={`${room.healthScore}%`} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{room.objective}</p>
            </div>
          </div>
          <HealthMeter score={room.healthScore} status={room.healthStatus} size="md" />
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Deliverables */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-8 glass-card p-5"
          >
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">
              Deliverables ({room.deliverables.length})
            </h2>
            <div className="space-y-3">
              {room.deliverables.map(d => (
                <div key={d.id} className="flex items-start justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <StatusIcon status={d.status} />
                    <div>
                      <div className="text-sm font-medium">{d.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{d.description}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Owner: <span className="text-foreground">{d.owner}</span></span>
                        <span>Due: <span className="text-foreground">{d.dueDate}</span></span>
                        <span>Effort: {d.estimatedEffort}</span>
                      </div>
                      {d.dependencies.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Dependencies: {d.dependencies.map(dep => {
                            const depD = room.deliverables.find(dd => dd.id === dep);
                            return depD?.title || dep;
                          }).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-display px-1.5 py-0.5 rounded capitalize ${
                    d.status === 'blocked' ? 'text-health-red bg-health-red/10' :
                    d.status === 'done' ? 'text-health-green bg-health-green/10' :
                    d.status === 'in_progress' ? 'text-health-yellow bg-health-yellow/10' :
                    'text-muted-foreground bg-muted/50'
                  }`}>
                    {d.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right sidebar */}
          <div className="col-span-4 space-y-4">
            {/* Team */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-5"
            >
              <h2 className="font-display text-xs text-muted-foreground mb-3 uppercase tracking-wider">Team</h2>
              {room.teamMembers.length === 0 ? (
                <div className="text-sm text-health-red">⚠ No team members assigned</div>
              ) : (
                <div className="space-y-2">
                  {room.teamMembers.map(tm => (
                    <div key={tm.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm">{tm.name}</div>
                        <div className="text-xs text-muted-foreground">{tm.role}</div>
                      </div>
                      {tm.lastUpdate && (
                        <div className="text-[10px] text-muted-foreground">{tm.lastUpdate}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Blockers */}
            {room.blockers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-5"
              >
                <h2 className="font-display text-xs text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-health-red animate-pulse" />
                  Blockers
                </h2>
                <div className="space-y-2">
                  {room.blockers.map(b => (
                    <div key={b.id} className="border-l-2 border-health-red/50 pl-3">
                      <div className="text-sm font-medium">{b.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{b.description}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-5 border-primary/20"
            >
              <h2 className="font-display text-xs text-primary mb-3 uppercase tracking-wider">⚡ AI Recommendations</h2>
              <div className="space-y-2">
                {room.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-display text-xs mt-0.5">→</span>
                    <span className="text-foreground/90">{rec}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-5"
            >
              <h2 className="font-display text-xs text-muted-foreground mb-3 uppercase tracking-wider">Milestones</h2>
              <div className="space-y-2">
                {room.milestones.map(m => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="text-sm">{m.title}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{m.dueDate}</span>
                      <span className={`text-[10px] font-display px-1.5 py-0.5 rounded ${
                        m.status === 'at_risk' ? 'text-health-red bg-health-red/10' :
                        m.status === 'on_track' ? 'text-health-green bg-health-green/10' :
                        'text-muted-foreground bg-muted/50'
                      }`}>
                        {m.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Post Update */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-5"
        >
          <h2 className="font-display text-xs text-muted-foreground mb-3 uppercase tracking-wider">Post Update</h2>
          <textarea
            value={updateText}
            onChange={e => setUpdateText(e.target.value)}
            placeholder="What was done, what's next, what's blocked..."
            className="command-input w-full p-3 text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary/50 font-body mb-3"
          />
          <FileUpload files={updateFiles} onFilesChange={setUpdateFiles} compact />
          <div className="flex justify-end mt-3">
            <button
              disabled={!updateText.trim() && updateFiles.length === 0}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-display text-xs disabled:opacity-50 hover:bg-primary/90 transition-colors"
              onClick={() => { setUpdateText(''); setUpdateFiles([]); }}
            >
              Submit Update
            </button>
          </div>
        </motion.div>

        {/* Updates */}
        {room.updates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-5"
          >
            <h2 className="font-display text-xs text-muted-foreground mb-4 uppercase tracking-wider">Recent Updates</h2>
            <div className="space-y-4">
              {room.updates.map(u => (
                <div key={u.id} className="border-l-2 border-primary/30 pl-4 py-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">{u.author}</span>
                    <span>·</span>
                    <span>{u.createdAt}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-health-green font-display text-xs">DONE:</span> {u.whatDone}</div>
                    <div><span className="text-primary font-display text-xs">NEXT:</span> {u.whatNext}</div>
                    {u.whatBlocked && (
                      <div><span className="text-health-red font-display text-xs">BLOCKED:</span> {u.whatBlocked}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
