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
}

export interface Room {
  id: string;
  name: string;
  icon: string;
  objective: string;
  healthScore: number;
  healthStatus: HealthStatus;
  deliverables: Deliverable[];
  milestones: Milestone[];
  blockers: Blocker[];
  teamMembers: TeamMember[];
  updates: Update[];
  recommendations: string[];
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
