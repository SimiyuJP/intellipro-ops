export type HealthStatus = 'green' | 'yellow' | 'red';

export interface Project {
  id: string;
  name: string;
  brief: string;
  healthScore: number;
  healthStatus: HealthStatus;
  createdAt: string;
  deadline: string;
  budget: string;
  rooms: Room[];
  milestones: Milestone[];
  blockers: Blocker[];
  deliverables: Deliverable[];
  updates: Update[];
  teamMembers: TeamMember[];
  decisions: Decision[];
  meetings: Meeting[];
  scopeChanges: ScopeChange[];
  redFlags: RedFlag[];
  intelligence?: ProjectIntelligence;
}

export interface Room {
  id: string;
  name: string;
  icon: string;
  objective: string;
  healthScore: number;
  healthStatus: HealthStatus;
  confidence: number; // 0-100
  confidenceFactors: ConfidenceFactor[];
  deliverables: Deliverable[];
  milestones: Milestone[];
  blockers: Blocker[];
  teamMembers: TeamMember[];
  updates: Update[];
  recommendations: string[];
}

export interface ConfidenceFactor {
  label: string;
  score: number; // 0-100
  reason: string;
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'done';
  owner: string;
  dueDate: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  roomId: string;
  dependencies: string[];
  estimatedEffort: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: 'upcoming' | 'on_track' | 'at_risk' | 'overdue' | 'completed';
  roomId: string;
}

export interface Blocker {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  roomId: string;
  owner: string;
  createdAt: string;
}

export interface Update {
  id: string;
  author: string;
  roomId: string;
  content: string;
  whatDone: string;
  whatNext: string;
  whatBlocked: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  roomIds: string[];
  lastUpdate?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  decidedBy: string;
  approvedBy: string;
  date: string;
  roomId: string;
  alternativesRejected: string[];
  assumptions: string[];
  status: 'active' | 'revisited' | 'reversed';
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  status: 'upcoming' | 'completed';
  roomIds: string[];
  attendees: string[];
  agenda: MeetingAgendaItem[];
  minutes?: string;
  actionItems: ActionItem[];
}

export interface MeetingAgendaItem {
  topic: string;
  source: 'blocker' | 'overdue' | 'decision' | 'custom';
  sourceId?: string;
  duration: number; // minutes
}

export interface ActionItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'pending' | 'done';
}

export interface ScopeChange {
  id: string;
  type: 'added' | 'removed' | 'modified';
  description: string;
  itemType: 'deliverable' | 'milestone' | 'room';
  date: string;
  addedBy: string;
  hasTradeoff: boolean;
  tradeoffNote?: string;
}

export interface RedFlag {
  id: string;
  type: 'stale_room' | 'slipping_milestone' | 'unresolved_blocker' | 'missing_owner' | 'scope_creep' | 'overloaded_member';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  roomId?: string;
  detectedAt: string;
  acknowledged: boolean;
}

// Intelligence Layer

export interface Assumption {
  id: string;
  statement: string;
  category: 'technical' | 'resource' | 'timeline' | 'market' | 'dependency' | 'budget';
  status: 'active' | 'validated' | 'broken' | 'retired';
  confidence: number; // 0-100
  owner: string;
  createdAt: string;
  validatedAt?: string;
  brokenAt?: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  impactDescription: string;
  roomIds: string[];
  linkedDeliverables: string[];
  evidence?: string;
}

export interface DriftSnapshot {
  date: string;
  plannedPercent: number;
  actualPercent: number;
}

export interface ProjectIntelligence {
  assumptions: Assumption[];
  driftSnapshots: DriftSnapshot[];
  plannedVelocity: number; // expected % per week
  signals: Signal[];
}

export interface Signal {
  id: string;
  type: 'blocker_added' | 'blocker_resolved' | 'deliverable_completed' | 'deliverable_overdue' | 'milestone_at_risk' | 'confidence_drop' | 'assumption_broken' | 'scope_added' | 'member_silent' | 'drift_warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  roomId?: string;
  timestamp: string;
  impactScore: number; // 0-100, how much this affects delivery
}
