import { Project, Room, Deliverable, HealthStatus } from '@/types/project';

export interface RoomScore {
  roomId: string;
  roomName: string;
  roomIcon: string;
  completionPercent: number; // 0-100
  doneCount: number;
  totalCount: number;
  pendingItems: string[];
  doneItems: string[];
  weight: number; // fraction of total project (0-1)
  weightedContribution: number; // weight * completionPercent
}

export interface ProjectScore {
  overallPercent: number; // 0-100
  status: HealthStatus;
  roomScores: RoomScore[];
  totalDeliverables: number;
  totalDone: number;
  totalPending: number;
}

function getDeliverableWeight(d: Deliverable): number {
  switch (d.priority) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 1;
  }
}

export function computeRoomScore(room: Room): RoomScore {
  const deliverables = room.deliverables;
  if (deliverables.length === 0) {
    return {
      roomId: room.id,
      roomName: room.name,
      roomIcon: room.icon,
      completionPercent: 0,
      doneCount: 0,
      totalCount: 0,
      pendingItems: [],
      doneItems: [],
      weight: 0,
      weightedContribution: 0,
    };
  }

  let totalWeight = 0;
  let doneWeight = 0;
  const doneItems: string[] = [];
  const pendingItems: string[] = [];

  for (const d of deliverables) {
    const w = getDeliverableWeight(d);
    totalWeight += w;
    if (d.status === 'done') {
      doneWeight += w;
      doneItems.push(d.title);
    } else {
      pendingItems.push(`${d.title} (${d.status.replace('_', ' ')})`);
    }
  }

  const completionPercent = totalWeight > 0
    ? Math.round((doneWeight / totalWeight) * 1000) / 10
    : 0;

  return {
    roomId: room.id,
    roomName: room.name,
    roomIcon: room.icon,
    completionPercent,
    doneCount: doneItems.length,
    totalCount: deliverables.length,
    pendingItems,
    doneItems,
    weight: totalWeight, // will be normalized later
    weightedContribution: 0,
  };
}

export function computeProjectScore(project: Project): ProjectScore {
  const roomScores = project.rooms.map(computeRoomScore);

  const totalWeight = roomScores.reduce((sum, rs) => sum + rs.weight, 0);

  // Normalize weights to fractions summing to 1
  for (const rs of roomScores) {
    rs.weight = totalWeight > 0 ? rs.weight / totalWeight : 0;
    rs.weightedContribution = rs.weight * rs.completionPercent;
  }

  const overallPercent = totalWeight > 0
    ? Math.round(roomScores.reduce((sum, rs) => sum + rs.weightedContribution, 0) * 10) / 10
    : 0;

  const totalDeliverables = roomScores.reduce((s, r) => s + r.totalCount, 0);
  const totalDone = roomScores.reduce((s, r) => s + r.doneCount, 0);

  const status: HealthStatus = overallPercent >= 70 ? 'green' : overallPercent >= 35 ? 'yellow' : 'red';

  return {
    overallPercent,
    status,
    roomScores,
    totalDeliverables,
    totalDone,
    totalPending: totalDeliverables - totalDone,
  };
}

export function getRoomStatus(percent: number): HealthStatus {
  if (percent >= 70) return 'green';
  if (percent >= 35) return 'yellow';
  return 'red';
}
