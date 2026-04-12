import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { HealthMeter } from '@/components/HealthMeter';
import { HealthBadge } from '@/components/HealthBadge';
import { useProject } from '@/contexts/ProjectContext';
import { computeRoomScore, getRoomStatus } from '@/lib/healthScoring';
import { Link } from 'react-router-dom';

export default function RoomsPage() {
  const { activeProject } = useProject();

  if (!activeProject) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-muted-foreground">No project selected. Choose a project from the sidebar.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Rooms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeProject.name} — Departmental workspaces with autonomous health tracking
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeProject.rooms.map((room, i) => {
            const rs = computeRoomScore(room);
            const roomStatus = getRoomStatus(rs.completionPercent);
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/rooms/${room.id}`} className="block glass-card-elevated p-5 hover:border-primary/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{room.icon}</span>
                      <div>
                        <h3 className="font-display font-semibold">{room.name}</h3>
                        <span className="text-xs text-muted-foreground">{room.teamMembers.length} members</span>
                      </div>
                    </div>
                    <HealthMeter score={rs.completionPercent} status={roomStatus} size="sm" />
                  </div>

                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{room.objective}</p>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{rs.doneCount}/{rs.totalCount} tasks done</span>
                      <span>{rs.completionPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          roomStatus === 'green' ? 'bg-health-green' :
                          roomStatus === 'yellow' ? 'bg-health-yellow' : 'bg-health-red'
                        }`}
                        style={{ width: `${rs.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="bg-secondary/50 rounded p-2">
                      <div className="text-lg font-display font-bold">{room.deliverables.length}</div>
                      <div className="text-[10px] text-muted-foreground">Deliverables</div>
                    </div>
                    <div className="bg-secondary/50 rounded p-2">
                      <div className="text-lg font-display font-bold">{room.blockers.length}</div>
                      <div className="text-[10px] text-muted-foreground">Blockers</div>
                    </div>
                    <div className="bg-secondary/50 rounded p-2">
                      <div className="text-lg font-display font-bold">{room.milestones.length}</div>
                      <div className="text-[10px] text-muted-foreground">Milestones</div>
                    </div>
                  </div>

                  {room.blockers.length > 0 && (
                    <div className="border-t border-border/50 pt-3">
                      <div className="text-[10px] font-display text-health-red mb-1">TOP BLOCKER</div>
                      <div className="text-xs text-muted-foreground truncate">{room.blockers[0].title}</div>
                    </div>
                  )}

                  {room.recommendations.length > 0 && room.blockers.length === 0 && (
                    <div className="border-t border-border/50 pt-3">
                      <div className="text-[10px] font-display text-primary mb-1">AI RECOMMENDATION</div>
                      <div className="text-xs text-muted-foreground truncate">{room.recommendations[0]}</div>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-primary font-display opacity-0 group-hover:opacity-100 transition-opacity">
                    View Room →
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
