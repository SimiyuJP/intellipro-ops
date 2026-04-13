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
  historicalSnapshots?: HistoricalSnapshot[];
  commitments?: Commitment[];
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

// Visibility Layer

export interface HistoricalSnapshot {
  date: string;
  weekLabel: string; // e.g. "Week 1", "Week 2"
  healthScore: number;
  healthStatus: HealthStatus;
  completedDeliverables: number;
  totalDeliverables: number;
  activeBlockers: number;
  confidence: number;
  burnRate: number; // dollars spent that week
  forecastedDelivery: string;
  note?: string;
  rooms: {
    id: string;
    name: string;
    healthScore: number;
    healthStatus: HealthStatus;
    confidence: number;
    blockers: number;
    completedDeliverables: number;
    totalDeliverables: number;
  }[];
}

// Predictive Layer

export interface DeliveryForecast {
  p50Date: string; // 50% probability date
  p70Date: string;
  p95Date: string;
  currentVelocity: number; // deliverables per week
  requiredVelocity: number;
  remainingWork: number; // deliverables left
  completedWork: number;
  weeksElapsed: number;
  weeksRemaining: number;
  onTrackProbability: number; // 0-100
}

export interface PatternMatch {
  projectName: string;
  similarity: number; // 0-100
  week: number;
  outcome: 'slipped' | 'delivered_on_time' | 'delivered_early';
  slipDays?: number;
  warningPattern: string;
  recommendation: string;
  riskFactors: string[];
}

// Accountability Layer

export interface Commitment {
  id: string;
  person: string;
  promise: string;
  dueDate: string;       // promised delivery date
  madeAt: string;        // date promise was made
  source: string;        // meeting title, update, or chat
  roomId?: string;
  deliverableId?: string;
  status: 'pending' | 'delivered' | 'missed' | 'partial';
  deliveredAt?: string;
  note?: string;         // PM-only context
}

// Institutional Memory

export interface PostMortemLesson {
  category: 'what_worked' | 'what_failed' | 'bottleneck' | 'missed_assumption' | 'lesson';
  text: string;
  evidence?: string;
  roomId?: string;
}
