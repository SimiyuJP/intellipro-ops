import { Project } from '@/types/project';
import { computeDrift, analyzeAssumptions, generateSignals, filterSignals } from './intelligence';
import { computeProjectScore } from './healthScoring';

const TODAY = '2026-04-14';

function daysSince(dateStr: string): number {
  if (!dateStr) return 999;
  return Math.max(0, Math.round((new Date(TODAY).getTime() - new Date(dateStr).getTime()) / 86400000));
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - new Date(TODAY).getTime()) / 86400000);
}

function wordFor(days: number): string {
  if (days <= 0) return 'overdue';
  if (days === 1) return 'tomorrow';
  if (days <= 7) return `in ${days} days`;
  if (days <= 14) return 'in ~2 weeks';
  return `in ${Math.round(days / 7)} weeks`;
}

// ─── Intent detection ───────────────────────────────────────────────────────

function matches(q: string, patterns: string[]): boolean {
  return patterns.some(p => q.includes(p));
}

function extractName(q: string, members: Project['teamMembers']): Project['teamMembers'][0] | null {
  const sorted = [...members].sort((a, b) => b.name.length - a.name.length);
  return sorted.find(m => q.includes(m.name.toLowerCase())) ?? null;
}

function extractRoomName(q: string, rooms: Project['rooms']): Project['rooms'][0] | null {
  return rooms.find(r => q.includes(r.name.toLowerCase())) ?? null;
}

// ─── Response builders ──────────────────────────────────────────────────────

function buildStatus(p: Project): string {
  const score = computeProjectScore(p);
  const drift = computeDrift(p);
  const criticalBlockers = p.blockers.filter(b => b.severity === 'critical');
  const overdue = p.rooms.flatMap(r => r.deliverables).filter(d => d.status !== 'done' && new Date(d.dueDate) < new Date(TODAY));

  const healthLine = `**${p.healthStatus.toUpperCase()} (${score.overallPercent}%)** — ${score.totalDone}/${score.totalDeliverables} deliverables complete`;

  const driftLine = drift.willMissDeadline
    ? `🔴 At current pace (${drift.velocityPerWeek}%/wk), deadline will be missed. Need ${drift.requiredVelocityPerWeek}%/wk.`
    : `✅ Velocity on track (${drift.velocityPerWeek}%/wk vs ${drift.requiredVelocityPerWeek}%/wk required).`;

  const blockerLines = criticalBlockers.length > 0
    ? `**Critical Blockers:**\n${criticalBlockers.map(b => `🔴 ${b.title} — ${b.owner}`).join('\n')}`
    : '**Blockers:** None critical ✅';

  const overdueLines = overdue.length > 0
    ? `**Overdue:** ${overdue.length} deliverable${overdue.length > 1 ? 's' : ''} past due date`
    : '';

  const roomLines = `**Rooms:**\n${p.rooms.map(r => {
    const flag = r.teamMembers.length === 0 ? ' ⚠️ UNSTAFFED' : '';
    return `${r.icon} ${r.name}: ${r.healthStatus.toUpperCase()} (${r.healthScore}%)${flag}`;
  }).join('\n')}`;

  return [
    `**${p.name}** — ${healthLine}`,
    '',
    driftLine,
    '',
    blockerLines,
    overdueLines,
    '',
    roomLines,
    '',
    `**Deadline:** ${p.deadline} (${daysUntil(p.deadline)} days away)`,
  ].filter(l => l !== undefined).join('\n');
}

function buildBlockers(p: Project): string {
  if (p.blockers.length === 0) return `✅ **No active blockers** in ${p.name}.`;
  const grouped = { critical: p.blockers.filter(b => b.severity === 'critical'), high: p.blockers.filter(b => b.severity === 'high'), medium: p.blockers.filter(b => b.severity === 'medium') };
  const lines: string[] = [`**Blockers in ${p.name}** (${p.blockers.length} total)`, ''];
  for (const [sev, items] of Object.entries(grouped)) {
    if (items.length === 0) continue;
    lines.push(`**${sev.toUpperCase()} (${items.length}):**`);
    items.forEach(b => {
      const room = p.rooms.find(r => r.id === b.roomId);
      lines.push(`• ${b.title}`);
      lines.push(`  Owner: ${b.owner} · Room: ${room?.name ?? 'Unknown'} · Open since: ${b.createdAt} (${daysSince(b.createdAt)}d)`);
      lines.push(`  ${b.description}`);
    });
    lines.push('');
  }
  return lines.join('\n');
}

function buildWhoIsLagging(p: Project): string {
  const lagging = p.teamMembers.map(tm => ({ tm, days: daysSince(tm.lastUpdate ?? '') })).sort((a, b) => b.days - a.days);
  const unstaffed = p.rooms.filter(r => r.teamMembers.length === 0);
  const lines: string[] = [`**Accountability — ${p.name}**`, ''];

  const silent = lagging.filter(l => l.days >= 5);
  const slow = lagging.filter(l => l.days >= 2 && l.days < 5);
  const active = lagging.filter(l => l.days < 2);

  if (silent.length > 0) {
    lines.push('🔴 **Gone quiet (5+ days):**');
    silent.forEach(({ tm, days }) => {
      const ownedInFlight = p.rooms.flatMap(r => r.deliverables).filter(d => d.owner === tm.name && (d.status === 'in_progress' || d.status === 'blocked'));
      lines.push(`• **${tm.name}** (${tm.role}) — ${days} days silent, ${ownedInFlight.length} in-flight deliverable${ownedInFlight.length !== 1 ? 's' : ''}`);
      if (ownedInFlight.length > 0) lines.push(`  At risk: ${ownedInFlight.map(d => d.title).join(', ')}`);
    });
    lines.push('');
  }

  if (slow.length > 0) {
    lines.push('🟡 **Slow (2–4 days):**');
    slow.forEach(({ tm, days }) => lines.push(`• ${tm.name} (${tm.role}) — last update ${days} days ago`));
    lines.push('');
  }

  if (active.length > 0) {
    lines.push('✅ **Active:**');
    active.forEach(({ tm, days }) => lines.push(`• ${tm.name} — updated ${days === 0 ? 'today' : `${days}d ago`}`));
    lines.push('');
  }

  if (unstaffed.length > 0) {
    lines.push('⚠️ **Unstaffed rooms (no updates possible):**');
    unstaffed.forEach(r => lines.push(`• ${r.icon} ${r.name}`));
  }

  return lines.join('\n');
}

function buildPerson(p: Project, name: string): string {
  const member = p.teamMembers.find(tm => tm.name.toLowerCase().includes(name.toLowerCase()));
  if (!member) return `❌ No team member found matching "${name}". Team: ${p.teamMembers.map(t => t.name).join(', ')}.`;

  const allDeliverables = p.rooms.flatMap(r => r.deliverables);
  const owned = allDeliverables.filter(d => d.owner === member.name);
  const byStatus = {
    done: owned.filter(d => d.status === 'done'),
    in_progress: owned.filter(d => d.status === 'in_progress'),
    blocked: owned.filter(d => d.status === 'blocked'),
    not_started: owned.filter(d => d.status === 'not_started'),
  };
  const rooms = member.roomIds.map(id => p.rooms.find(r => r.id === id)?.name).filter(Boolean);
  const silence = daysSince(member.lastUpdate ?? '');
  const commitments = (p.commitments ?? []).filter(c => c.person === member.name);
  const missedCount = commitments.filter(c => c.status === 'missed').length;
  const reliability = commitments.length > 0
    ? Math.round((commitments.filter(c => c.status === 'delivered').length / commitments.length) * 100)
    : null;

  const lines: string[] = [
    `**${member.name}** — ${member.role}`,
    `Rooms: ${rooms.join(', ')}`,
    `Last update: ${member.lastUpdate ?? 'Never'} (${silence === 0 ? 'today' : `${silence} days ago`})${silence >= 5 ? ' 🔴 SILENT' : silence >= 2 ? ' 🟡' : ' ✅'}`,
    reliability !== null ? `Commitment reliability: ${reliability}% (${missedCount} missed of ${commitments.length})` : '',
    '',
    `**Deliverables (${owned.length} total):**`,
  ];

  if (byStatus.blocked.length > 0) {
    lines.push(`🔴 Blocked (${byStatus.blocked.length}):`);
    byStatus.blocked.forEach(d => lines.push(`  • ${d.title} — due ${d.dueDate}`));
  }
  if (byStatus.in_progress.length > 0) {
    lines.push(`🟡 In Progress (${byStatus.in_progress.length}):`);
    byStatus.in_progress.forEach(d => lines.push(`  • ${d.title} — due ${d.dueDate}`));
  }
  if (byStatus.not_started.length > 0) {
    lines.push(`⚪ Not Started (${byStatus.not_started.length}):`);
    byStatus.not_started.forEach(d => lines.push(`  • ${d.title} — due ${d.dueDate}`));
  }
  if (byStatus.done.length > 0) {
    lines.push(`✅ Done (${byStatus.done.length}):`);
    byStatus.done.forEach(d => lines.push(`  • ${d.title}`));
  }

  if (commitments.length > 0) {
    lines.push('', `**Commitment history (${commitments.length}):**`);
    commitments.slice(0, 5).forEach(c => {
      const icon = c.status === 'delivered' ? '✅' : c.status === 'missed' ? '🔴' : c.status === 'partial' ? '🟡' : '⏳';
      lines.push(`${icon} "${c.promise}" — ${c.status} (due ${c.dueDate})`);
    });
  }

  return lines.filter(Boolean).join('\n');
}

function buildRoom(p: Project, roomName: string): string {
  const room = p.rooms.find(r => r.name.toLowerCase().includes(roomName.toLowerCase()));
  if (!room) return `❌ No room found matching "${roomName}". Rooms: ${p.rooms.map(r => r.name).join(', ')}.`;

  const done = room.deliverables.filter(d => d.status === 'done').length;
  const total = room.deliverables.length;
  const lines: string[] = [
    `**${room.icon} ${room.name}** — ${room.healthStatus.toUpperCase()} (${room.healthScore}%) · Confidence: ${room.confidence}%`,
    `Objective: ${room.objective}`,
    room.teamMembers.length > 0 ? `Team: ${room.teamMembers.map(t => t.name).join(', ')}` : '⚠️ No team members assigned',
    `Progress: ${done}/${total} deliverables done`,
    '',
  ];

  if (room.blockers.length > 0) {
    lines.push('**Active Blockers:**');
    room.blockers.forEach(b => lines.push(`🔴 ${b.title} — Owner: ${b.owner}`));
    lines.push('');
  }

  lines.push('**Deliverables:**');
  room.deliverables.forEach(d => {
    const icon = d.status === 'done' ? '✅' : d.status === 'blocked' ? '🔴' : d.status === 'in_progress' ? '🟡' : '⚪';
    lines.push(`${icon} ${d.title} — ${d.owner} · ${d.dueDate} [${d.priority.toUpperCase()}]`);
  });

  if (room.recommendations.length > 0) {
    lines.push('', '**AI Recommendations:**');
    room.recommendations.forEach(r => lines.push(`→ ${r}`));
  }

  return lines.join('\n');
}

function buildTeam(p: Project): string {
  const allDeliverables = p.rooms.flatMap(r => r.deliverables);
  const lines: string[] = [`**Team — ${p.name}** (${p.teamMembers.length} members)`, ''];

  p.teamMembers.forEach(tm => {
    const owned = allDeliverables.filter(d => d.owner === tm.name);
    const inFlight = owned.filter(d => d.status === 'in_progress' || d.status === 'blocked');
    const silence = daysSince(tm.lastUpdate ?? '');
    const silenceFlag = silence >= 5 ? '🔴' : silence >= 2 ? '🟡' : '✅';
    const rooms = tm.roomIds.map(id => p.rooms.find(r => r.id === id)?.name).filter(Boolean).join(', ');
    lines.push(`**${tm.name}** (${tm.role}) ${silenceFlag}`);
    lines.push(`  Rooms: ${rooms || 'None'} · Last update: ${silence}d ago · ${inFlight.length} in-flight task${inFlight.length !== 1 ? 's' : ''}`);
  });

  const unstaffed = p.rooms.filter(r => r.teamMembers.length === 0);
  if (unstaffed.length > 0) {
    lines.push('', `⚠️ **Unstaffed rooms:** ${unstaffed.map(r => `${r.icon} ${r.name}`).join(', ')}`);
  }

  return lines.join('\n');
}

function buildDecisionSearch(p: Project, q: string): string {
  const searchTerms = q.replace(/why did we|why are we|decision about|decided on|what was decided|who decided/gi, '').trim();
  const matches = p.decisions.filter(d =>
    d.title.toLowerCase().includes(searchTerms) ||
    d.description.toLowerCase().includes(searchTerms) ||
    d.alternativesRejected.some(a => a.toLowerCase().includes(searchTerms))
  );

  if (matches.length === 0) {
    return `**Decision Search**\n\nNo decisions found matching "${searchTerms}".\n\n**All recorded decisions:**\n${p.decisions.map((d, i) => `${i + 1}. ${d.title} — ${d.decidedBy} (${d.date})`).join('\n')}`;
  }

  return matches.map(d => {
    const room = p.rooms.find(r => r.id === d.roomId);
    return [
      `**Decision: ${d.title}**`,
      `Decided by: ${d.decidedBy} · Approved by: ${d.approvedBy} · ${d.date} [${d.status.toUpperCase()}]`,
      room ? `Room: ${room.icon} ${room.name}` : '',
      ``,
      `**Why:** ${d.description}`,
      d.alternativesRejected.length > 0 ? `**Alternatives rejected:** ${d.alternativesRejected.join('; ')}` : '',
      d.assumptions.length > 0 ? `**Assumptions:** ${d.assumptions.join('; ')}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n---\n\n');
}

function buildMilestones(p: Project): string {
  const sorted = [...p.milestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const lines: string[] = [`**Milestones — ${p.name}** (${p.milestones.length} total)`, ''];
  sorted.forEach(m => {
    const room = p.rooms.find(r => r.id === m.roomId);
    const days = daysUntil(m.dueDate);
    const icon = m.status === 'completed' ? '✅' : m.status === 'overdue' ? '🔴' : m.status === 'at_risk' ? '🟡' : '⚪';
    lines.push(`${icon} **${m.title}**`);
    lines.push(`  ${m.dueDate} (${wordFor(days)}) · ${room?.name ?? ''} · ${m.status.replace('_', ' ').toUpperCase()}`);
  });
  return lines.join('\n');
}

function buildRisks(p: Project): string {
  const drift = computeDrift(p);
  const signals = filterSignals(generateSignals(p)).slice(0, 6);
  const critBlockers = p.blockers.filter(b => b.severity === 'critical');
  const overdueItems = p.rooms.flatMap(r => r.deliverables).filter(d => d.status !== 'done' && new Date(d.dueDate) < new Date(TODAY));
  const unstaffed = p.rooms.filter(r => r.teamMembers.length === 0);
  const brokenAssumptions = p.intelligence?.assumptions.filter(a => a.status === 'broken') ?? [];

  const lines: string[] = [`**Risk Assessment — ${p.name}**`, ''];

  if (drift.willMissDeadline) lines.push(`🔴 **DEADLINE RISK:** At ${drift.velocityPerWeek}%/wk velocity, project will miss ${p.deadline} by ~${drift.driftDays} days`);
  if (critBlockers.length > 0) lines.push(`🔴 **CRITICAL BLOCKERS (${critBlockers.length}):** ${critBlockers.map(b => b.title).join(', ')}`);
  if (unstaffed.length > 0) lines.push(`🔴 **UNSTAFFED (${unstaffed.length}):** ${unstaffed.map(r => r.name).join(', ')} — zero output possible`);
  if (overdueItems.length > 0) lines.push(`🟡 **OVERDUE (${overdueItems.length} items)**`);
  if (brokenAssumptions.length > 0) lines.push(`🟡 **BROKEN ASSUMPTIONS (${brokenAssumptions.length}):** ${brokenAssumptions.map(a => a.statement.slice(0, 60) + '...').join('; ')}`);

  if (signals.length > 0) {
    lines.push('', '**Top signals by impact:**');
    signals.forEach((s, i) => lines.push(`${i + 1}. [${s.severity.toUpperCase()}] ${s.title} — impact ${s.impactScore}/100`));
  }

  return lines.join('\n');
}

function buildScope(p: Project): string {
  if (p.scopeChanges.length === 0) return `**${p.name}** — No scope changes recorded.`;
  const added = p.scopeChanges.filter(s => s.type === 'added');
  const creep = added.filter(s => !s.hasTradeoff);
  const lines: string[] = [`**Scope — ${p.name}**`, ''];
  lines.push(`${p.scopeChanges.length} changes total: +${added.length} added, −${p.scopeChanges.filter(s => s.type === 'removed').length} removed, ~${p.scopeChanges.filter(s => s.type === 'modified').length} modified`);
  if (creep.length > 0) {
    lines.push('', `⚠️ **Scope creep — ${creep.length} addition${creep.length > 1 ? 's' : ''} without tradeoff:**`);
    creep.forEach(s => lines.push(`• ${s.description} — added by ${s.addedBy} (${s.date})`));
  } else {
    lines.push('✅ All scope changes have documented tradeoffs.');
  }
  lines.push('', '**Full log:**');
  p.scopeChanges.forEach(s => {
    const symbol = s.type === 'added' ? '+' : s.type === 'removed' ? '−' : '~';
    lines.push(`${symbol} ${s.description} (${s.date})${s.hasTradeoff ? ` — Tradeoff: ${s.tradeoffNote}` : ' ⚠️ no tradeoff'}`);
  });
  return lines.join('\n');
}

function buildWeeklyReport(p: Project): string {
  const score = computeProjectScore(p);
  const drift = computeDrift(p);
  const allDeliverables = p.rooms.flatMap(r => r.deliverables);
  const done = allDeliverables.filter(d => d.status === 'done');
  const blocked = allDeliverables.filter(d => d.status === 'blocked');
  const critBlockers = p.blockers.filter(b => b.severity === 'critical');
  const atRiskMilestones = p.milestones.filter(m => m.status === 'at_risk' || m.status === 'overdue');
  const silentMembers = p.teamMembers.filter(tm => daysSince(tm.lastUpdate ?? '') >= 5);
  const brokenAssumptions = p.intelligence?.assumptions.filter(a => a.status === 'broken') ?? [];
  const scopeCreep = p.scopeChanges.filter(s => s.type === 'added' && !s.hasTradeoff);

  const executiveSummary = drift.willMissDeadline
    ? `**${p.name}** is currently **${p.healthStatus.toUpperCase()}** at ${score.overallPercent}% completion. At current velocity (${drift.velocityPerWeek}%/wk), the project is projected to miss the ${p.deadline} deadline by approximately ${drift.driftDays} days. Immediate action required on ${critBlockers.length} critical blocker${critBlockers.length !== 1 ? 's' : ''}.`
    : `**${p.name}** is **${p.healthStatus.toUpperCase()}** at ${score.overallPercent}% completion and tracking to meet the ${p.deadline} deadline at current velocity (${drift.velocityPerWeek}%/wk). ${critBlockers.length > 0 ? `${critBlockers.length} critical blocker${critBlockers.length !== 1 ? 's' : ''} require attention.` : 'No critical blockers.'}`;

  const lines: string[] = [
    `**Weekly Status Report — ${p.name}**`,
    `*${TODAY} · Auto-generated by Project Pulse*`,
    '',
    '---',
    '',
    '**EXECUTIVE SUMMARY**',
    executiveSummary,
    '',
    `**PROGRESS:** ${done.length}/${allDeliverables.length} deliverables complete (${score.overallPercent}%) · ${blocked.length} blocked`,
    '',
    '---',
    '',
    '**ROOM STATUS:**',
    ...p.rooms.map(r => {
      const flag = r.teamMembers.length === 0 ? ' ⚠️ UNSTAFFED' : '';
      const rs = score.roomScores.find(s => s.roomId === r.id);
      return `${r.icon} **${r.name}**: ${r.healthStatus.toUpperCase()} (${r.healthScore}%) · ${rs?.doneCount ?? 0}/${rs?.totalCount ?? 0} done${flag}`;
    }),
    '',
    '---',
    '',
    '**CRITICAL ISSUES:**',
    ...(critBlockers.length > 0 ? critBlockers.map(b => `🔴 ${b.title} — Assigned: ${b.owner}`) : ['✅ No critical blockers']),
    ...(atRiskMilestones.length > 0 ? ['', ...atRiskMilestones.map(m => `🟡 Milestone at risk: ${m.title} (${m.dueDate})`)] : []),
    ...(brokenAssumptions.length > 0 ? ['', ...brokenAssumptions.map(a => `⚠️ Broken assumption: ${a.statement}`)] : []),
    '',
    '---',
    '',
    '**TEAM:**',
    ...(silentMembers.length > 0 ? [`🔴 Silent (5+ days): ${silentMembers.map(t => t.name).join(', ')}`] : ['✅ All team members active']),
    ...p.rooms.filter(r => r.teamMembers.length === 0).map(r => `⚠️ ${r.name} room unstaffed`),
    '',
    '---',
    '',
    '**SCOPE:**',
    scopeCreep.length > 0 ? `⚠️ ${scopeCreep.length} scope addition${scopeCreep.length > 1 ? 's' : ''} without timeline adjustment: ${scopeCreep.map(s => s.description).join('; ')}` : '✅ Scope stable',
    '',
    '---',
    '',
    `**NEXT MILESTONE:** ${p.milestones.filter(m => m.status !== 'completed').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.title ?? 'None'} — ${p.milestones.filter(m => m.status !== 'completed').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate ?? ''}`,
  ];

  return lines.join('\n');
}

function buildNext(p: Project): string {
  const allDeliverables = p.rooms.flatMap(r => r.deliverables);
  const priorityWeight: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const notDone = allDeliverables
    .filter(d => d.status !== 'done')
    .sort((a, b) => (priorityWeight[a.priority] ?? 4) - (priorityWeight[b.priority] ?? 4));

  const lines: string[] = [`**Next Priorities — ${p.name}**`, ''];
  notDone.slice(0, 8).forEach((d, i) => {
    const room = p.rooms.find(r => r.id === d.roomId);
    const icon = d.status === 'blocked' ? '🔴' : d.priority === 'critical' ? '🔥' : d.priority === 'high' ? '⚡' : '•';
    lines.push(`${i + 1}. ${icon} **${d.title}**`);
    lines.push(`   Owner: ${d.owner} · ${room?.name} · Due: ${d.dueDate} [${d.priority.toUpperCase()}]${d.status === 'blocked' ? ' — BLOCKED' : ''}`);
  });
  return lines.join('\n');
}

function buildHelp(): string {
  return `**Project Pulse Command Reference**

**Natural questions:**
• "Where are we?" / "What's the status?"
• "What's blocking us?" / "What are the blockers?"
• "Who's lagging?" / "Who has gone quiet?"
• "What are the risks?" / "Will we miss the deadline?"
• "What's next?" / "What should I prioritize?"
• "Tell me about Alex Chen" / "Who is Sarah Kim?"
• "How is the Tech room doing?"
• "Why did we choose Ahrefs?" / "What was decided about X?"
• "What's the scope situation?" / "Any scope creep?"
• "Weekly report" / "Status report for the CEO"
• "When are the milestones?" / "What's upcoming?"

**Slash commands:**
\`/status\` \`/blockers\` \`/risks\` \`/team\` \`/next\`
\`/drift\` \`/assumptions\` \`/signals\` \`/scope\`
\`/milestones\` \`/report\` \`/who-is-lagging\`
\`/projects\` \`/switch <name>\``;
}

// ─── Main router ─────────────────────────────────────────────────────────────

export function generateResponse(
  input: string,
  project: Project | null,
  projects: Project[],
  switchProject: (id: string | null) => void
): string {
  const q = input.toLowerCase().trim();

  // ── Project management ──────────────────────────────────────────────────
  if (q === '/projects' || q === 'list projects') {
    return `**Available Projects (${projects.length}):**\n\n${projects.map((p, i) => `${i + 1}. **${p.name}** — ${p.healthStatus.toUpperCase()} (${p.healthScore}%) ${p.id === project?.id ? '← ACTIVE' : ''}`).join('\n')}\n\nTo switch: \`/switch <name>\``;
  }

  if (q.startsWith('/switch ')) {
    const name = input.slice(8).trim().toLowerCase();
    const match = projects.find(p => p.name.toLowerCase().includes(name));
    if (match) { switchProject(match.id); return `✅ Switched to **${match.name}**. All queries now scoped to this project.`; }
    return `❌ No project matching "${input.slice(8).trim()}". Try: ${projects.map(p => p.name).join(', ')}`;
  }

  if (q === '/help' || q === 'help' || q === '?') return buildHelp();

  if (!project) return `⚠️ **No project selected.** Type \`/projects\` to list available projects or \`/switch <name>\` to activate one.\n\n${buildHelp()}`;

  // ── Natural language routing ─────────────────────────────────────────────

  // Person query
  const personMatch = extractName(q, project.teamMembers);
  if (personMatch && (matches(q, ['who is', 'tell me about', 'how is', 'what is', 'update on', 'status of']) || q.includes(personMatch.name.toLowerCase()))) {
    return buildPerson(project, personMatch.name);
  }

  // Room query
  const roomMatch = extractRoomName(q, project.rooms);
  if (roomMatch && matches(q, ['how is', 'status of', 'what about', 'room', 'workstream', 'tell me about'])) {
    return buildRoom(project, roomMatch.name);
  }

  // Status / where are we
  if (q === '/status' || matches(q, ['where are we', 'what\'s the status', 'whats the status', 'project status', 'overall status', 'how are we doing', 'how\'s the project', 'hows the project'])) {
    return buildStatus(project);
  }

  // Blockers
  if (q === '/blockers' || matches(q, ['blocker', 'blocked', 'blocking', 'what\'s blocking', 'whats blocking', 'what is blocking'])) {
    return buildBlockers(project);
  }

  // Who's lagging / silent
  if (q === '/who-is-lagging' || matches(q, ['who\'s lagging', 'whos lagging', 'who is lagging', 'who\'s quiet', 'whos quiet', 'gone quiet', 'who is silent', 'follow up', 'accountability', 'who hasn\'t updated', 'who hasnt updated'])) {
    return buildWhoIsLagging(project);
  }

  // Team
  if (q === '/team' || matches(q, ['who\'s on the team', 'whos on the team', 'team members', 'who is on', 'the team', 'list team'])) {
    return buildTeam(project);
  }

  // Risks / deadline
  if (q === '/risks' || matches(q, ['risk', 'risks', 'will we miss', 'miss the deadline', 'on track', 'deadline', 'are we on track'])) {
    return buildRisks(project);
  }

  // Decisions / why did we
  if (q === '/decisions' || matches(q, ['decision', 'decided', 'why did we', 'why are we', 'why was', 'who decided', 'what was decided', 'who approved'])) {
    return buildDecisionSearch(project, q);
  }

  // Milestones
  if (q === '/milestones' || matches(q, ['milestone', 'milestones', 'upcoming', 'when is', 'what\'s next on the timeline', 'timeline'])) {
    return buildMilestones(project);
  }

  // Scope
  if (q === '/scope' || q === '/scope-creep' || matches(q, ['scope', 'scope creep', 'added to scope', 'expanded'])) {
    return buildScope(project);
  }

  // Report / weekly
  if (q === '/report' || q === '/weekly-report' || matches(q, ['weekly report', 'status report', 'report for the ceo', 'executive summary', 'generate report', 'write a report', 'sponsor update'])) {
    return buildWeeklyReport(project);
  }

  // Next / priorities
  if (q === '/next' || matches(q, ['what\'s next', 'whats next', 'priorit', 'what should', 'what to do', 'focus on'])) {
    return buildNext(project);
  }

  // Drift
  if (q === '/drift' || matches(q, ['drift', 'velocity', 'behind schedule', 'pace', 'projected completion', 'when will we finish'])) {
    const drift = computeDrift(project);
    return `**Drift Detection — ${project.name}**\n\nStatus: **${drift.status.replace('_', ' ').toUpperCase()}**\n\n• Actual: ${drift.currentPercent}% · Expected: ${drift.expectedPercent}%\n• Gap: ${drift.driftPercent > 0 ? '-' : '+'}${Math.abs(drift.driftPercent)}% (${drift.driftDays > 0 ? `${drift.driftDays} days behind` : 'on time'})\n• Velocity: ${drift.velocityPerWeek}%/wk (need ${drift.requiredVelocityPerWeek}%/wk)\n• Projected: **${drift.projectedCompletionDate}** · Deadline: **${drift.deadline}**\n\n${drift.willMissDeadline ? '🔴 **AT CURRENT PACE, THIS PROJECT WILL MISS ITS DEADLINE.**' : '✅ On track to meet deadline.'}\n\n${drift.summary}`;
  }

  // Assumptions
  if (q === '/assumptions' || matches(q, ['assumption', 'assumptions', 'what are we assuming'])) {
    const analysis = analyzeAssumptions(project);
    const assumptions = project.intelligence?.assumptions ?? [];
    if (assumptions.length === 0) return `No assumptions tracked in ${project.name}.`;
    return `**Assumptions — ${project.name}** (${analysis.total} tracked)\n\nActive: ${analysis.active} · Validated: ${analysis.validated} · Broken: ${analysis.broken}\n\n${analysis.criticalBroken.length > 0 ? `**🔴 Broken:**\n${analysis.criticalBroken.map(a => `• ${a.statement}\n  Impact: ${a.impactDescription}`).join('\n\n')}\n\n` : ''}${analysis.unvalidated.length > 0 ? `**⚠️ Low confidence:**\n${analysis.unvalidated.map(a => `• ${a.statement} (${a.confidence}% confidence)`).join('\n')}` : '✅ All active assumptions ≥50% confidence.'}`;
  }

  // Signals
  if (q === '/signals' || matches(q, ['signal', 'signals', 'what matters', 'noise'])) {
    const signals = filterSignals(generateSignals(project));
    if (signals.length === 0) return `**${project.name}** — No high-impact signals. ✅`;
    return `**Signals — ${project.name}** (${signals.length} above threshold)\n\n${signals.slice(0, 8).map((s, i) => `${i + 1}. **${s.title}** [Impact: ${s.impactScore}/100]\n   ${s.severity.toUpperCase()} · ${s.description}`).join('\n\n')}`;
  }

  // Confidence
  if (q === '/confidence' || matches(q, ['confidence', 'how confident', 'how sure'])) {
    return `**Confidence Scores — ${project.name}**\n\nHealth = current status. Confidence = how much to trust it.\n\n${project.rooms.map(r => {
      const flag = r.healthStatus === 'green' && r.confidence < 60 ? ' ⚠️ Green but low confidence' : '';
      return `**${r.icon} ${r.name}**: ${r.healthStatus.toUpperCase()} (${r.healthScore}%) · Confidence **${r.confidence}%**${flag}\n${r.confidenceFactors.map(f => `  → ${f.label}: ${f.score}% — ${f.reason}`).join('\n')}`;
    }).join('\n\n')}`;
  }

  // Red flags
  if (q === '/red-flags' || matches(q, ['red flag', 'red flags', 'alert', 'alerts'])) {
    if (project.redFlags.length === 0) return `**${project.name}** — No red flags. ✅`;
    const crit = project.redFlags.filter(f => f.severity === 'critical');
    const warn = project.redFlags.filter(f => f.severity === 'warning');
    return `**Red Flags — ${project.name}** (${project.redFlags.length})\n\n${crit.length > 0 ? `**Critical (${crit.length}):**\n${crit.map(f => `🔴 ${f.title}\n  ${f.description}`).join('\n\n')}\n\n` : ''}${warn.length > 0 ? `**Warnings (${warn.length}):**\n${warn.map(f => `🟡 ${f.title}\n  ${f.description}`).join('\n\n')}` : ''}`;
  }

  // Budget
  if (matches(q, ['budget', 'cost', 'spend', 'burn rate', 'how much'])) {
    return `**Budget — ${project.name}**\n\nTotal budget: **${project.budget}**\n\nFor detailed burn rate and spend tracking, see the Predictive layer → Risk Heatmap.`;
  }

  // Fallback — try to be helpful
  const allDels = project.rooms.flatMap(r => r.deliverables);
  const matchedDel = allDels.find(d => q.includes(d.title.toLowerCase().slice(0, 10)));
  if (matchedDel) {
    const room = project.rooms.find(r => r.id === matchedDel.roomId);
    const icon = matchedDel.status === 'done' ? '✅' : matchedDel.status === 'blocked' ? '🔴' : matchedDel.status === 'in_progress' ? '🟡' : '⚪';
    return `**${matchedDel.title}**\n${icon} Status: ${matchedDel.status.replace('_', ' ')} · Priority: ${matchedDel.priority.toUpperCase()}\nOwner: ${matchedDel.owner} · Due: ${matchedDel.dueDate}\nRoom: ${room?.name}\n\n${matchedDel.description}`;
  }

  return `I understood: *"${input}"* — but couldn't match a specific query for **${project.name}**.\n\nTry asking:\n• "Where are we?" — overall status\n• "What's blocking us?" — active blockers\n• "Who's lagging?" — accountability\n• "What are the risks?" — risk assessment\n• "Tell me about [person name]" — individual status\n• "How is [room name] doing?" — room status\n• "/report" — weekly status report\n\nType \`/help\` for the full command reference.`;
}
