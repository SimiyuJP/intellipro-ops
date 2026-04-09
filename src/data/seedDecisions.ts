import { Decision, Meeting, ScopeChange, RedFlag } from '@/types/project';

// ====== AI SEO Project ======
export const seoDecisions: Decision[] = [
  { id: 'dec-1', title: 'Use Ahrefs over SEMrush for backlink data', description: 'Ahrefs has better API rate limits and more accurate backlink data for our use case.', decidedBy: 'Alex Chen', approvedBy: 'Marcus Webb', date: '2026-03-28', roomId: 'room-tech', alternativesRejected: ['SEMrush API — higher cost, lower rate limits', 'Moz API — incomplete backlink coverage'], assumptions: ['Ahrefs API pricing stays under $200/mo', 'API key will be provisioned within 1 week'], status: 'active' },
  { id: 'dec-2', title: 'Launch with 3 integrations, not 5', description: 'Reduced scope to Search Console + GA4 + Ahrefs. Bing and Semrush deferred to v2.', decidedBy: 'Marcus Webb', approvedBy: 'Alex Chen', date: '2026-04-01', roomId: 'room-tech', alternativesRejected: ['Launch with all 5 integrations — timeline too tight', 'Launch with just Search Console — too limited for PMF'], assumptions: ['3 integrations sufficient for initial launch', 'v2 can add more within 4 weeks post-launch'], status: 'active' },
  { id: 'dec-3', title: 'Target mid-market, not enterprise', description: 'Marketing positioning focuses on 50-500 employee companies. Enterprise requires SOC2 we don\'t have.', decidedBy: 'Jordan Blake', approvedBy: 'Marcus Webb', date: '2026-03-30', roomId: 'room-marketing', alternativesRejected: ['Enterprise-first — requires compliance investment', 'SMB-only — market too fragmented'], assumptions: ['Mid-market has budget for $99-299/mo tools', 'No SOC2 needed for first 6 months'], status: 'active' },
];

export const seoMeetings: Meeting[] = [
  { id: 'mtg-1', title: 'Sprint Review — Week 2', date: '2026-04-07', status: 'completed', roomIds: ['room-tech', 'room-marketing'], attendees: ['Alex Chen', 'Sarah Kim', 'Jordan Blake', 'Marcus Webb'], agenda: [
    { topic: 'Ahrefs API key blocker — still unresolved', source: 'blocker', sourceId: 'b-1', duration: 10 },
    { topic: 'GA4 Pipeline overdue — status check', source: 'overdue', sourceId: 'd-2', duration: 10 },
    { topic: 'Positioning document timeline', source: 'custom', duration: 5 },
  ], minutes: 'Ahrefs key escalated to procurement. GA4 pipeline delayed by OAuth complexity — Alex estimates 2 more days. Jordan presented positioning draft — feedback positive, minor revisions needed.', actionItems: [
    { id: 'ai-1', title: 'Follow up with procurement on Ahrefs API key', owner: 'Marcus Webb', dueDate: '2026-04-08', status: 'pending' },
    { id: 'ai-2', title: 'Complete GA4 OAuth flow', owner: 'Alex Chen', dueDate: '2026-04-09', status: 'done' },
    { id: 'ai-3', title: 'Revise positioning based on team feedback', owner: 'Jordan Blake', dueDate: '2026-04-10', status: 'pending' },
  ] },
  { id: 'mtg-2', title: 'Weekly Standup — All Hands', date: '2026-04-14', status: 'upcoming', roomIds: ['room-tech', 'room-marketing', 'room-research', 'room-ops', 'room-design'], attendees: ['Alex Chen', 'Sarah Kim', 'Jordan Blake', 'Priya Patel', 'Marcus Webb'], agenda: [
    { topic: 'Ahrefs blocker: 11 days unresolved', source: 'blocker', sourceId: 'b-1', duration: 10 },
    { topic: 'Design room unstaffed — impact on timeline', source: 'blocker', sourceId: 'b-5', duration: 10 },
    { topic: 'Research findings: early user interview insights', source: 'custom', duration: 10 },
    { topic: 'Milestone check: API Integrations (at risk)', source: 'overdue', duration: 5 },
  ], actionItems: [] },
];

export const seoScopeChanges: ScopeChange[] = [
  { id: 'sc-1', type: 'added', description: 'AI Insights Engine added as a deliverable', itemType: 'deliverable', date: '2026-04-02', addedBy: 'Marcus Webb', hasTradeoff: false },
  { id: 'sc-2', type: 'added', description: 'Brand Assets Package deliverable added to Design room', itemType: 'deliverable', date: '2026-04-03', addedBy: 'Marcus Webb', hasTradeoff: false },
  { id: 'sc-3', type: 'removed', description: 'Bing Webmaster integration removed from scope', itemType: 'deliverable', date: '2026-04-01', addedBy: 'Alex Chen', hasTradeoff: true, tradeoffNote: 'Removed to keep 6-week timeline. Will add in v2.' },
];

export const seoRedFlags: RedFlag[] = [
  { id: 'rf-1', type: 'stale_room', severity: 'critical', title: 'Operations has no updates in 9+ days', description: 'Room has 0 updates logged. Deliverables are unowned and at risk of slipping.', roomId: 'room-ops', detectedAt: '2026-04-09', acknowledged: false },
  { id: 'rf-2', type: 'stale_room', severity: 'critical', title: 'Design has no updates in 9+ days', description: 'Room has 0 updates logged and no designer assigned.', roomId: 'room-design', detectedAt: '2026-04-09', acknowledged: false },
  { id: 'rf-3', type: 'unresolved_blocker', severity: 'critical', title: 'Ahrefs API key unresolved for 6 days', description: 'Blocker "Ahrefs API key not provisioned" has been open since April 3. Blocks Ahrefs integration.', roomId: 'room-tech', detectedAt: '2026-04-09', acknowledged: false },
  { id: 'rf-4', type: 'slipping_milestone', severity: 'warning', title: 'Design System Complete milestone at risk', description: 'Due April 12 but no designer assigned. 3 days remaining.', roomId: 'room-design', detectedAt: '2026-04-09', acknowledged: false },
  { id: 'rf-5', type: 'missing_owner', severity: 'warning', title: '4 deliverables have no owner', description: 'AI Insights Engine, Training Docs, Onboarding Flow, and Dashboard UI Design are unassigned.', detectedAt: '2026-04-09', acknowledged: false },
  { id: 'rf-6', type: 'scope_creep', severity: 'warning', title: '2 deliverables added without deadline/budget adjustment', description: 'AI Insights Engine and Brand Assets were added this week but no timeline or budget changes recorded.', detectedAt: '2026-04-09', acknowledged: false },
  { id: 'rf-7', type: 'stale_room', severity: 'warning', title: 'Alex Chen hasn\'t updated in 7 days', description: 'Last update was April 2. Multiple critical deliverables assigned.', roomId: 'room-tech', detectedAt: '2026-04-09', acknowledged: false },
];

// ====== Branding Project ======
export const brandingDecisions: Decision[] = [
  { id: 'dec-b1', title: 'Use warm color palette over corporate blue', description: 'KijijiPay targets African markets — warm gold/orange palette resonates better culturally than corporate blue.', decidedBy: 'Amara Osei', approvedBy: 'Kofi Asante', date: '2026-03-25', roomId: 'room-brand-design', alternativesRejected: ['Corporate blue/white — feels too Western', 'Green palette — too similar to M-Pesa'], assumptions: ['Cultural research supports warm tones for trust in target markets', 'Palette works across print and digital'], status: 'active' },
  { id: 'dec-b2', title: 'Skip TV advertising for launch', description: 'Focus on digital + community channels for launch. TV deferred to Phase 2.', decidedBy: 'Kofi Asante', approvedBy: 'Kofi Asante', date: '2026-03-28', roomId: 'room-brand-launch', alternativesRejected: ['TV + digital — budget insufficient', 'TV only — doesn\'t reach mobile-first audience'], assumptions: ['Target audience is primarily mobile-first', 'Digital + community has higher ROI for initial launch'], status: 'active' },
];

export const brandingMeetings: Meeting[] = [
  { id: 'mtg-b1', title: 'Brand Review — Week 3', date: '2026-04-08', status: 'completed', roomIds: ['room-brand-design', 'room-brand-strategy'], attendees: ['Amara Osei', 'David Mensah', 'Fatima Diallo', 'Kofi Asante'], agenda: [
    { topic: 'CEO feedback on positioning — still pending', source: 'blocker', sourceId: 'bb-1', duration: 10 },
    { topic: 'Brand guidelines progress', source: 'custom', duration: 10 },
    { topic: 'Launch campaign dependencies', source: 'custom', duration: 5 },
  ], minutes: 'CEO feedback escalated — Kofi will follow up directly. Brand guidelines 60% complete, on track for April 12. Launch campaign plan looks solid but depends on collateral delivery.', actionItems: [
    { id: 'ai-b1', title: 'Escalate CEO review to direct call', owner: 'Kofi Asante', dueDate: '2026-04-09', status: 'pending' },
    { id: 'ai-b2', title: 'Share color palette with Content team', owner: 'David Mensah', dueDate: '2026-04-09', status: 'done' },
  ] },
];

export const brandingScopeChanges: ScopeChange[] = [
  { id: 'sc-b1', type: 'added', description: 'Email Templates added to Content & Collateral room', itemType: 'deliverable', date: '2026-04-04', addedBy: 'Kofi Asante', hasTradeoff: false },
];

export const brandingRedFlags: RedFlag[] = [
  { id: 'rf-b1', type: 'stale_room', severity: 'warning', title: 'Content & Collateral has no updates', description: 'Room has 0 updates logged and 0 team members. All deliverables not started.', roomId: 'room-brand-content', detectedAt: '2026-04-09', acknowledged: false },
  { id: 'rf-b2', type: 'unresolved_blocker', severity: 'warning', title: 'CEO feedback pending for 4 days', description: 'Blocker on brand positioning review has been open since April 5.', roomId: 'room-brand-strategy', detectedAt: '2026-04-09', acknowledged: false },
  { id: 'rf-b3', type: 'missing_owner', severity: 'info', title: 'Email Templates has no owner', description: 'Deliverable "Email Templates" in Content room is unassigned.', roomId: 'room-brand-content', detectedAt: '2026-04-09', acknowledged: false },
];
