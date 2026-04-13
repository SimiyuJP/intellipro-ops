import { Project, ProjectIntelligence } from '@/types/project';
import { brandingDecisions, brandingMeetings, brandingScopeChanges, brandingRedFlags } from './seedDecisions';
import { brandingSnapshots } from './seedSnapshots';

const brandingIntelligence: ProjectIntelligence = {
  assumptions: [
    {
      id: 'ba-1', statement: 'CEO will review and approve positioning within 3 days', category: 'dependency',
      status: 'active', confidence: 35, owner: 'Kofi Asante', createdAt: '2026-03-22',
      impact: 'high', impactDescription: 'Delays voice & tone guide and downstream launch content',
      roomIds: ['room-brand-strategy'], linkedDeliverables: ['bd-6'],
    },
    {
      id: 'ba-2', statement: 'Brand design team can handle collateral in parallel', category: 'resource',
      status: 'active', confidence: 60, owner: 'Amara Osei', createdAt: '2026-03-21',
      impact: 'medium', impactDescription: 'If David is overloaded, social templates and icon set will slip',
      roomIds: ['room-brand-design', 'room-brand-content'], linkedDeliverables: ['bd-4', 'bd-8'],
    },
    {
      id: 'ba-3', statement: 'Email templates can be built by existing team', category: 'resource',
      status: 'broken', confidence: 10, owner: 'Kofi Asante', createdAt: '2026-03-23',
      brokenAt: '2026-04-06', impact: 'medium',
      impactDescription: 'No HTML email developer on team. Need to contract out.',
      roomIds: ['room-brand-content'], linkedDeliverables: ['bd-10'],
      evidence: 'No team member has HTML email expertise',
    },
    {
      id: 'ba-4', statement: 'PR contacts will be confirmed 1 week before launch', category: 'dependency',
      status: 'active', confidence: 50, owner: 'Kofi Asante', createdAt: '2026-03-25',
      impact: 'high', impactDescription: 'Without PR, launch visibility drops significantly',
      roomIds: ['room-brand-launch'], linkedDeliverables: ['bd-12'],
    },
  ],
  driftSnapshots: [
    { date: '2026-03-20', plannedPercent: 0, actualPercent: 0 },
    { date: '2026-03-27', plannedPercent: 25, actualPercent: 18 },
    { date: '2026-04-03', plannedPercent: 50, actualPercent: 38 },
    { date: '2026-04-10', plannedPercent: 75, actualPercent: 52 },
  ],
  plannedVelocity: 25,
  signals: [],
};

export const seedBrandingProject: Project = {
  id: 'proj-002',
  name: 'KijijiPay Branding Project',
  brief: 'Complete brand identity and visual system for KijijiPay, a mobile payments platform for African markets. Includes logo design, brand guidelines, marketing collateral, and launch campaign. Timeline: 4 weeks. Budget: $8,000.',
  healthScore: 74,
  healthStatus: 'yellow',
  createdAt: '2026-03-20',
  deadline: '2026-04-20',
  budget: '$8,000',
  decisions: brandingDecisions,
  meetings: brandingMeetings,
  scopeChanges: brandingScopeChanges,
  redFlags: brandingRedFlags,
  intelligence: brandingIntelligence,
  historicalSnapshots: brandingSnapshots,
  teamMembers: [
    { id: 'tm-b1', name: 'Amara Osei', role: 'Creative Director', roomIds: ['room-brand-design', 'room-brand-strategy'], lastUpdate: '2026-04-07' },
    { id: 'tm-b2', name: 'David Mensah', role: 'Graphic Designer', roomIds: ['room-brand-design'], lastUpdate: '2026-04-06' },
    { id: 'tm-b3', name: 'Fatima Diallo', role: 'Brand Strategist', roomIds: ['room-brand-strategy'], lastUpdate: '2026-04-08' },
    { id: 'tm-b4', name: 'Kofi Asante', role: 'Project Manager', roomIds: ['room-brand-design', 'room-brand-strategy', 'room-brand-content', 'room-brand-launch'], lastUpdate: '2026-04-08' },
  ],
  rooms: [
    {
      id: 'room-brand-design',
      name: 'Brand Design',
      icon: '🎨',
      objective: 'Create the full visual identity system including logo, color palette, typography, and icon set',
      healthScore: 80,
      healthStatus: 'green',
      confidence: 85,
      confidenceFactors: [
        { label: 'Update Frequency', score: 90, reason: 'Updates within last 2 days' },
        { label: 'Dependency Stability', score: 95, reason: 'No blocked dependencies' },
        { label: 'Clarity', score: 80, reason: 'Clear deliverables, strong ownership' },
        { label: 'Unknowns', score: 75, reason: 'Icon set scope not fully defined' },
      ],
      deliverables: [
        { id: 'bd-1', title: 'Logo Design (Primary + Variants)', description: 'Design primary logo, monochrome version, favicon, and app icon', status: 'done', owner: 'David Mensah', dueDate: '2026-04-05', priority: 'critical', roomId: 'room-brand-design', dependencies: [], estimatedEffort: '4 days' },
        { id: 'bd-2', title: 'Color Palette & Typography', description: 'Define primary, secondary, and accent colors with typography scale', status: 'done', owner: 'David Mensah', dueDate: '2026-04-07', priority: 'critical', roomId: 'room-brand-design', dependencies: ['bd-1'], estimatedEffort: '2 days' },
        { id: 'bd-3', title: 'Brand Guidelines Document', description: 'Comprehensive guidelines covering logo usage, spacing, colors, do/don\'t examples', status: 'in_progress', owner: 'Amara Osei', dueDate: '2026-04-12', priority: 'high', roomId: 'room-brand-design', dependencies: ['bd-1', 'bd-2'], estimatedEffort: '3 days' },
        { id: 'bd-4', title: 'Icon & Illustration Set', description: 'Custom icon set for app and marketing materials', status: 'not_started', owner: 'David Mensah', dueDate: '2026-04-15', priority: 'medium', roomId: 'room-brand-design', dependencies: ['bd-2'], estimatedEffort: '4 days' },
      ],
      milestones: [
        { id: 'mb-1', title: 'Visual Identity Approved', dueDate: '2026-04-08', status: 'completed', roomId: 'room-brand-design' },
        { id: 'mb-2', title: 'Brand Guidelines Delivered', dueDate: '2026-04-14', status: 'on_track', roomId: 'room-brand-design' },
      ],
      blockers: [],
      teamMembers: [
        { id: 'tm-b1', name: 'Amara Osei', role: 'Creative Director', roomIds: ['room-brand-design'], lastUpdate: '2026-04-07' },
        { id: 'tm-b2', name: 'David Mensah', role: 'Graphic Designer', roomIds: ['room-brand-design'], lastUpdate: '2026-04-06' },
      ],
      updates: [
        { id: 'ub-1', author: 'David Mensah', roomId: 'room-brand-design', content: 'Logo and color palette finalized', whatDone: 'Completed primary logo with 3 variants, finalized color palette', whatNext: 'Start icon set design', whatBlocked: '', createdAt: '2026-04-06' },
        { id: 'ub-2', author: 'Amara Osei', roomId: 'room-brand-design', content: 'Starting brand guidelines doc', whatDone: 'Reviewed and approved final logo, started guidelines template', whatNext: 'Complete guidelines first draft by April 10', whatBlocked: '', createdAt: '2026-04-07' },
      ],
      recommendations: [
        'Brand guidelines on track — aim for stakeholder review by April 12',
        'Start icon set immediately to stay ahead of schedule',
        'Share color palette with Content team for social templates',
      ],
    },
    {
      id: 'room-brand-strategy',
      name: 'Brand Strategy',
      icon: '🧭',
      objective: 'Define brand positioning, voice, tone, and messaging framework for KijijiPay',
      healthScore: 72,
      healthStatus: 'yellow',
      confidence: 54,
      confidenceFactors: [
        { label: 'Update Frequency', score: 85, reason: 'Updated yesterday' },
        { label: 'Dependency Stability', score: 30, reason: 'CEO feedback blocking progress' },
        { label: 'Clarity', score: 70, reason: 'Strategy defined but not validated' },
        { label: 'Unknowns', score: 30, reason: 'Assumptions about market not yet validated' },
      ],
      deliverables: [
        { id: 'bd-5', title: 'Brand Positioning Statement', description: 'Define KijijiPay\'s unique value proposition and market positioning', status: 'done', owner: 'Fatima Diallo', dueDate: '2026-04-03', priority: 'critical', roomId: 'room-brand-strategy', dependencies: [], estimatedEffort: '3 days' },
        { id: 'bd-6', title: 'Brand Voice & Tone Guide', description: 'Document brand personality, voice characteristics, and tone variations by context', status: 'in_progress', owner: 'Fatima Diallo', dueDate: '2026-04-10', priority: 'high', roomId: 'room-brand-strategy', dependencies: ['bd-5'], estimatedEffort: '2 days' },
        { id: 'bd-7', title: 'Competitor Brand Audit', description: 'Analyze branding of top 5 mobile payment competitors in African markets', status: 'done', owner: 'Fatima Diallo', dueDate: '2026-04-02', priority: 'medium', roomId: 'room-brand-strategy', dependencies: [], estimatedEffort: '2 days' },
      ],
      milestones: [
        { id: 'mb-3', title: 'Brand Strategy Finalized', dueDate: '2026-04-10', status: 'on_track', roomId: 'room-brand-strategy' },
      ],
      blockers: [
        { id: 'bb-1', title: 'Awaiting CEO feedback on positioning', description: 'CEO review of brand positioning has been pending for 3 days.', severity: 'medium', roomId: 'room-brand-strategy', owner: 'Kofi Asante', createdAt: '2026-04-05' },
      ],
      teamMembers: [
        { id: 'tm-b3', name: 'Fatima Diallo', role: 'Brand Strategist', roomIds: ['room-brand-strategy'], lastUpdate: '2026-04-08' },
      ],
      updates: [
        { id: 'ub-3', author: 'Fatima Diallo', roomId: 'room-brand-strategy', content: 'Voice & tone guide in progress', whatDone: 'Drafted voice characteristics and sample copy in 3 tones', whatNext: 'Finalize guide after CEO positioning feedback', whatBlocked: 'Waiting on CEO review of positioning statement', createdAt: '2026-04-08' },
      ],
      recommendations: [
        'Escalate CEO review — this blocks voice & tone finalization',
        'Share competitor audit findings with Design team for differentiation',
        'Start messaging framework draft in parallel',
      ],
    },
    {
      id: 'room-brand-content',
      name: 'Content & Collateral',
      icon: '📝',
      objective: 'Produce all marketing collateral, social templates, and launch content',
      healthScore: 60,
      healthStatus: 'yellow',
      confidence: 35,
      confidenceFactors: [
        { label: 'Update Frequency', score: 0, reason: 'No updates ever logged' },
        { label: 'Dependency Stability', score: 40, reason: 'Blocked on brand guidelines delivery' },
        { label: 'Clarity', score: 55, reason: 'Deliverables defined but no team' },
        { label: 'Unknowns', score: 45, reason: 'Email template owner missing' },
      ],
      deliverables: [
        { id: 'bd-8', title: 'Social Media Templates', description: 'Design templates for Instagram, Twitter, and LinkedIn', status: 'not_started', owner: 'David Mensah', dueDate: '2026-04-16', priority: 'high', roomId: 'room-brand-content', dependencies: ['bd-2', 'bd-3'], estimatedEffort: '3 days' },
        { id: 'bd-9', title: 'Pitch Deck Design', description: 'Redesign investor pitch deck with new brand identity', status: 'not_started', owner: 'Amara Osei', dueDate: '2026-04-18', priority: 'high', roomId: 'room-brand-content', dependencies: ['bd-3'], estimatedEffort: '3 days' },
        { id: 'bd-10', title: 'Email Templates', description: 'Design transactional and marketing email templates', status: 'not_started', owner: 'Unassigned', dueDate: '2026-04-17', priority: 'medium', roomId: 'room-brand-content', dependencies: ['bd-2'], estimatedEffort: '2 days' },
      ],
      milestones: [
        { id: 'mb-4', title: 'All Collateral Ready', dueDate: '2026-04-18', status: 'upcoming', roomId: 'room-brand-content' },
      ],
      blockers: [
        { id: 'bb-2', title: 'Email templates need a developer', description: 'No one assigned to build responsive HTML email templates.', severity: 'medium', roomId: 'room-brand-content', owner: 'Kofi Asante', createdAt: '2026-04-06' },
      ],
      teamMembers: [],
      updates: [],
      recommendations: [
        'Cannot start until brand guidelines are delivered — track closely',
        'Assign email template owner or contract a developer',
        'Social templates should align with launch campaign timeline',
      ],
    },
    {
      id: 'room-brand-launch',
      name: 'Launch Campaign',
      icon: '🚀',
      objective: 'Plan and execute the brand reveal and launch campaign',
      healthScore: 65,
      healthStatus: 'yellow',
      confidence: 60,
      confidenceFactors: [
        { label: 'Update Frequency', score: 85, reason: 'Updated yesterday' },
        { label: 'Dependency Stability', score: 45, reason: 'Depends on collateral delivery' },
        { label: 'Clarity', score: 70, reason: 'Campaign plan in progress' },
        { label: 'Unknowns', score: 40, reason: 'PR contacts not yet confirmed' },
      ],
      deliverables: [
        { id: 'bd-11', title: 'Launch Campaign Plan', description: 'Detailed plan for brand reveal across channels', status: 'in_progress', owner: 'Kofi Asante', dueDate: '2026-04-14', priority: 'critical', roomId: 'room-brand-launch', dependencies: ['bd-5'], estimatedEffort: '3 days' },
        { id: 'bd-12', title: 'Press Kit', description: 'Media kit with brand story, high-res assets, and key messages', status: 'not_started', owner: 'Fatima Diallo', dueDate: '2026-04-17', priority: 'high', roomId: 'room-brand-launch', dependencies: ['bd-3', 'bd-6'], estimatedEffort: '2 days' },
      ],
      milestones: [
        { id: 'mb-5', title: 'Launch Campaign Approved', dueDate: '2026-04-15', status: 'on_track', roomId: 'room-brand-launch' },
        { id: 'mb-6', title: 'Brand Launch Day', dueDate: '2026-04-20', status: 'upcoming', roomId: 'room-brand-launch' },
      ],
      blockers: [],
      teamMembers: [
        { id: 'tm-b4', name: 'Kofi Asante', role: 'Project Manager', roomIds: ['room-brand-launch'], lastUpdate: '2026-04-08' },
      ],
      updates: [
        { id: 'ub-4', author: 'Kofi Asante', roomId: 'room-brand-launch', content: 'Campaign plan taking shape', whatDone: 'Outlined 3-phase launch: teaser, reveal, engagement', whatNext: 'Finalize channel strategy and budget allocation', whatBlocked: '', createdAt: '2026-04-08' },
      ],
      recommendations: [
        'Align launch timeline with collateral delivery dates',
        'Book PR agency or media contacts now for press outreach',
        'Plan internal launch presentation for team alignment',
      ],
    },
  ],
  milestones: [
    { id: 'mb-1', title: 'Visual Identity Approved', dueDate: '2026-04-08', status: 'completed', roomId: 'room-brand-design' },
    { id: 'mb-2', title: 'Brand Guidelines Delivered', dueDate: '2026-04-14', status: 'on_track', roomId: 'room-brand-design' },
    { id: 'mb-3', title: 'Brand Strategy Finalized', dueDate: '2026-04-10', status: 'on_track', roomId: 'room-brand-strategy' },
    { id: 'mb-4', title: 'All Collateral Ready', dueDate: '2026-04-18', status: 'upcoming', roomId: 'room-brand-content' },
    { id: 'mb-5', title: 'Launch Campaign Approved', dueDate: '2026-04-15', status: 'on_track', roomId: 'room-brand-launch' },
    { id: 'mb-6', title: 'Brand Launch Day', dueDate: '2026-04-20', status: 'upcoming', roomId: 'room-brand-launch' },
  ],
  blockers: [
    { id: 'bb-1', title: 'Awaiting CEO feedback on positioning', description: 'CEO review pending for 3 days.', severity: 'medium', roomId: 'room-brand-strategy', owner: 'Kofi Asante', createdAt: '2026-04-05' },
    { id: 'bb-2', title: 'Email templates need a developer', description: 'No one assigned to build HTML email templates.', severity: 'medium', roomId: 'room-brand-content', owner: 'Kofi Asante', createdAt: '2026-04-06' },
  ],
  deliverables: [],
  updates: [
    { id: 'ub-1', author: 'David Mensah', roomId: 'room-brand-design', content: 'Logo and color palette finalized', whatDone: 'Completed primary logo with variants', whatNext: 'Start icon set', whatBlocked: '', createdAt: '2026-04-06' },
    { id: 'ub-2', author: 'Amara Osei', roomId: 'room-brand-design', content: 'Starting brand guidelines', whatDone: 'Approved final logo, started guidelines', whatNext: 'Complete first draft', whatBlocked: '', createdAt: '2026-04-07' },
    { id: 'ub-3', author: 'Fatima Diallo', roomId: 'room-brand-strategy', content: 'Voice & tone guide in progress', whatDone: 'Drafted voice characteristics', whatNext: 'Finalize after CEO feedback', whatBlocked: 'CEO review pending', createdAt: '2026-04-08' },
    { id: 'ub-4', author: 'Kofi Asante', roomId: 'room-brand-launch', content: 'Campaign plan taking shape', whatDone: 'Outlined 3-phase launch', whatNext: 'Finalize channel strategy', whatBlocked: '', createdAt: '2026-04-08' },
  ],
};
