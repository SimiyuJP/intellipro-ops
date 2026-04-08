import { Project } from '@/types/project';

export const seedProject: Project = {
  id: 'proj-001',
  name: 'AI SEO Performance Dashboard',
  brief: 'Build and launch a new AI SEO performance dashboard for clients. Must integrate Search Console, GA4, and Ahrefs. Launch within 6 weeks. Needs marketing landing page, product messaging, and internal training docs. Target audience: marketing managers at mid-sized companies. Budget: $15,000. Team currently has 2 developers and 1 marketer.',
  healthScore: 62,
  healthStatus: 'yellow',
  createdAt: '2026-03-25',
  deadline: '2026-05-06',
  budget: '$15,000',
  teamMembers: [
    { id: 'tm-1', name: 'Alex Chen', role: 'Tech Lead', roomIds: ['room-tech'], lastUpdate: '2026-04-02' },
    { id: 'tm-2', name: 'Sarah Kim', role: 'Frontend Developer', roomIds: ['room-tech'], lastUpdate: '2026-04-07' },
    { id: 'tm-3', name: 'Jordan Blake', role: 'Marketing Lead', roomIds: ['room-marketing'], lastUpdate: '2026-04-06' },
    { id: 'tm-4', name: 'Priya Patel', role: 'Research Analyst', roomIds: ['room-research'], lastUpdate: '2026-04-05' },
    { id: 'tm-5', name: 'Marcus Webb', role: 'Project Owner', roomIds: ['room-tech', 'room-marketing', 'room-research', 'room-ops', 'room-design'], lastUpdate: '2026-04-07' },
  ],
  rooms: [
    {
      id: 'room-tech',
      name: 'Tech',
      icon: '⚡',
      objective: 'Build the AI SEO dashboard with Search Console, GA4, and Ahrefs integrations',
      healthScore: 45,
      healthStatus: 'red',
      deliverables: [
        { id: 'd-1', title: 'Search Console API Integration', description: 'Connect and pull data from Google Search Console', status: 'in_progress', owner: 'Alex Chen', dueDate: '2026-04-10', priority: 'critical', roomId: 'room-tech', dependencies: [], estimatedEffort: '5 days' },
        { id: 'd-2', title: 'GA4 Data Pipeline', description: 'Build data pipeline for GA4 analytics data', status: 'not_started', owner: 'Alex Chen', dueDate: '2026-04-08', priority: 'critical', roomId: 'room-tech', dependencies: [], estimatedEffort: '4 days' },
        { id: 'd-3', title: 'Ahrefs API Integration', description: 'Connect Ahrefs API for keyword and backlink data', status: 'blocked', owner: 'Sarah Kim', dueDate: '2026-04-12', priority: 'high', roomId: 'room-tech', dependencies: ['d-2'], estimatedEffort: '3 days' },
        { id: 'd-4', title: 'Dashboard Frontend', description: 'Build the main dashboard UI with charts and data views', status: 'in_progress', owner: 'Sarah Kim', dueDate: '2026-04-18', priority: 'high', roomId: 'room-tech', dependencies: ['d-1', 'd-2', 'd-3'], estimatedEffort: '8 days' },
        { id: 'd-5', title: 'AI Insights Engine', description: 'ML model for SEO recommendations and anomaly detection', status: 'not_started', owner: 'Unassigned', dueDate: '2026-04-25', priority: 'high', roomId: 'room-tech', dependencies: ['d-1', 'd-2', 'd-3'], estimatedEffort: '6 days' },
      ],
      milestones: [
        { id: 'm-1', title: 'API Integrations Complete', dueDate: '2026-04-12', status: 'at_risk', roomId: 'room-tech' },
        { id: 'm-2', title: 'Dashboard Beta Ready', dueDate: '2026-04-22', status: 'upcoming', roomId: 'room-tech' },
      ],
      blockers: [
        { id: 'b-1', title: 'Ahrefs API key not provisioned', description: 'Cannot start Ahrefs integration without API credentials. Waiting on procurement.', severity: 'critical', roomId: 'room-tech', owner: 'Marcus Webb', createdAt: '2026-04-03' },
        { id: 'b-2', title: 'No backend engineer for AI engine', description: 'AI insights engine requires ML expertise. Current team lacks this skill.', severity: 'high', roomId: 'room-tech', owner: 'Alex Chen', createdAt: '2026-04-01' },
      ],
      teamMembers: [
        { id: 'tm-1', name: 'Alex Chen', role: 'Tech Lead', roomIds: ['room-tech'], lastUpdate: '2026-04-02' },
        { id: 'tm-2', name: 'Sarah Kim', role: 'Frontend Developer', roomIds: ['room-tech'], lastUpdate: '2026-04-07' },
      ],
      updates: [
        { id: 'u-1', author: 'Sarah Kim', roomId: 'room-tech', content: 'Dashboard layout complete, working on chart components', whatDone: 'Completed dashboard wireframe implementation, added responsive layout', whatNext: 'Integrate live data feeds once APIs are ready', whatBlocked: 'Waiting on API data schemas from backend', createdAt: '2026-04-07' },
        { id: 'u-2', author: 'Alex Chen', roomId: 'room-tech', content: 'Search Console integration progressing', whatDone: 'OAuth flow done, basic data pull working', whatNext: 'Build data transformation layer', whatBlocked: 'Need Ahrefs API key', createdAt: '2026-04-02' },
      ],
      recommendations: [
        'Prioritize GA4 pipeline — it\'s overdue and blocking Ahrefs integration',
        'Escalate Ahrefs API key request immediately',
        'Hire or contract an ML engineer for the AI insights engine',
        'Alex Chen hasn\'t posted an update in 6 days — follow up',
      ],
    },
    {
      id: 'room-marketing',
      name: 'Marketing',
      icon: '📣',
      objective: 'Create product positioning, landing page, and launch strategy',
      healthScore: 78,
      healthStatus: 'green',
      deliverables: [
        { id: 'd-6', title: 'Product Positioning Document', description: 'Define value props, messaging framework, and competitive positioning', status: 'in_progress', owner: 'Jordan Blake', dueDate: '2026-04-11', priority: 'critical', roomId: 'room-marketing', dependencies: ['d-8'], estimatedEffort: '3 days' },
        { id: 'd-7', title: 'Landing Page Copy & Design', description: 'Write and design the marketing landing page', status: 'not_started', owner: 'Jordan Blake', dueDate: '2026-04-18', priority: 'high', roomId: 'room-marketing', dependencies: ['d-6'], estimatedEffort: '4 days' },
        { id: 'd-8', title: 'Competitor Analysis', description: 'Analyze top 5 competitors for positioning gaps', status: 'done', owner: 'Priya Patel', dueDate: '2026-04-05', priority: 'medium', roomId: 'room-marketing', dependencies: [], estimatedEffort: '2 days' },
      ],
      milestones: [
        { id: 'm-3', title: 'Positioning Approved', dueDate: '2026-04-14', status: 'on_track', roomId: 'room-marketing' },
        { id: 'm-4', title: 'Landing Page Live', dueDate: '2026-04-25', status: 'upcoming', roomId: 'room-marketing' },
      ],
      blockers: [],
      teamMembers: [
        { id: 'tm-3', name: 'Jordan Blake', role: 'Marketing Lead', roomIds: ['room-marketing'], lastUpdate: '2026-04-06' },
      ],
      updates: [
        { id: 'u-3', author: 'Jordan Blake', roomId: 'room-marketing', content: 'Positioning draft in progress, competitor analysis complete', whatDone: 'Reviewed competitor analysis, started messaging framework', whatNext: 'Finalize positioning doc by Friday', whatBlocked: 'Need product demo screenshots from Tech for landing page', createdAt: '2026-04-06' },
      ],
      recommendations: [
        'Positioning doc is on track — ensure Tech provides demo screenshots by April 15',
        'Consider hiring a copywriter for landing page content',
        'Start ad campaign planning in parallel',
      ],
    },
    {
      id: 'room-research',
      name: 'Research',
      icon: '🔬',
      objective: 'Conduct user research and validate product-market fit',
      healthScore: 70,
      healthStatus: 'yellow',
      deliverables: [
        { id: 'd-9', title: 'User Needs Assessment', description: 'Interview 10 marketing managers about SEO dashboard pain points', status: 'in_progress', owner: 'Priya Patel', dueDate: '2026-04-15', priority: 'high', roomId: 'room-research', dependencies: [], estimatedEffort: '5 days' },
        { id: 'd-10', title: 'Market Size Analysis', description: 'Estimate TAM/SAM/SOM for AI SEO tools market', status: 'not_started', owner: 'Priya Patel', dueDate: '2026-04-20', priority: 'medium', roomId: 'room-research', dependencies: [], estimatedEffort: '3 days' },
      ],
      milestones: [
        { id: 'm-5', title: 'Research Summary Delivered', dueDate: '2026-04-18', status: 'on_track', roomId: 'room-research' },
      ],
      blockers: [
        { id: 'b-3', title: 'Need access to user interview panel', description: 'Cannot schedule interviews without access to customer list from sales.', severity: 'medium', roomId: 'room-research', owner: 'Priya Patel', createdAt: '2026-04-04' },
      ],
      teamMembers: [
        { id: 'tm-4', name: 'Priya Patel', role: 'Research Analyst', roomIds: ['room-research'], lastUpdate: '2026-04-05' },
      ],
      updates: [
        { id: 'u-4', author: 'Priya Patel', roomId: 'room-research', content: '3 of 10 user interviews completed', whatDone: 'Completed 3 interviews, identified common pain points around data silos', whatNext: 'Schedule remaining 7 interviews', whatBlocked: 'Waiting on customer contact list from Sales', createdAt: '2026-04-05' },
      ],
      recommendations: [
        'Escalate customer list request to Project Owner',
        'Consider using LinkedIn outreach as backup for interview recruitment',
        'Share early findings with Marketing to inform positioning',
      ],
    },
    {
      id: 'room-ops',
      name: 'Operations',
      icon: '⚙️',
      objective: 'Prepare internal training docs and client onboarding flow',
      healthScore: 55,
      healthStatus: 'yellow',
      deliverables: [
        { id: 'd-11', title: 'Internal Training Documentation', description: 'Create training guide for support team', status: 'not_started', owner: 'Unassigned', dueDate: '2026-04-28', priority: 'medium', roomId: 'room-ops', dependencies: ['d-4'], estimatedEffort: '4 days' },
        { id: 'd-12', title: 'Client Onboarding Flow', description: 'Design step-by-step onboarding for new dashboard users', status: 'not_started', owner: 'Unassigned', dueDate: '2026-04-30', priority: 'medium', roomId: 'room-ops', dependencies: ['d-4'], estimatedEffort: '3 days' },
      ],
      milestones: [
        { id: 'm-6', title: 'Training Docs Ready', dueDate: '2026-04-28', status: 'upcoming', roomId: 'room-ops' },
      ],
      blockers: [
        { id: 'b-4', title: 'No ops lead assigned', description: 'Operations deliverables have no owner. Need to assign someone or hire.', severity: 'high', roomId: 'room-ops', owner: 'Marcus Webb', createdAt: '2026-04-01' },
      ],
      teamMembers: [],
      updates: [],
      recommendations: [
        'URGENT: Assign an ops lead or these deliverables will slip',
        'Training docs depend on Dashboard — start outline now using wireframes',
        'Consider contracting a technical writer',
      ],
    },
    {
      id: 'room-design',
      name: 'Design',
      icon: '🎨',
      objective: 'Create UI/UX for the dashboard and marketing materials',
      healthScore: 60,
      healthStatus: 'yellow',
      deliverables: [
        { id: 'd-13', title: 'Dashboard UI Design', description: 'Create high-fidelity mockups for all dashboard views', status: 'in_progress', owner: 'Unassigned', dueDate: '2026-04-14', priority: 'critical', roomId: 'room-design', dependencies: [], estimatedEffort: '5 days' },
        { id: 'd-14', title: 'Brand Assets Package', description: 'Logo, color palette, typography, icon set', status: 'not_started', owner: 'Unassigned', dueDate: '2026-04-10', priority: 'high', roomId: 'room-design', dependencies: [], estimatedEffort: '3 days' },
      ],
      milestones: [
        { id: 'm-7', title: 'Design System Complete', dueDate: '2026-04-12', status: 'at_risk', roomId: 'room-design' },
      ],
      blockers: [
        { id: 'b-5', title: 'No designer on team', description: 'Design room has no assigned designer. All design deliverables are unowned.', severity: 'critical', roomId: 'room-design', owner: 'Marcus Webb', createdAt: '2026-03-28' },
      ],
      teamMembers: [],
      updates: [],
      recommendations: [
        'CRITICAL: Hire or contract a UI/UX designer immediately',
        'Brand assets are overdue — this blocks landing page design',
        'Use design templates as interim solution',
      ],
    },
  ],
  milestones: [
    { id: 'm-1', title: 'API Integrations Complete', dueDate: '2026-04-12', status: 'at_risk', roomId: 'room-tech' },
    { id: 'm-2', title: 'Dashboard Beta Ready', dueDate: '2026-04-22', status: 'upcoming', roomId: 'room-tech' },
    { id: 'm-3', title: 'Positioning Approved', dueDate: '2026-04-14', status: 'on_track', roomId: 'room-marketing' },
    { id: 'm-4', title: 'Landing Page Live', dueDate: '2026-04-25', status: 'upcoming', roomId: 'room-marketing' },
    { id: 'm-5', title: 'Research Summary Delivered', dueDate: '2026-04-18', status: 'on_track', roomId: 'room-research' },
    { id: 'm-6', title: 'Training Docs Ready', dueDate: '2026-04-28', status: 'upcoming', roomId: 'room-ops' },
    { id: 'm-7', title: 'Design System Complete', dueDate: '2026-04-12', status: 'at_risk', roomId: 'room-design' },
    { id: 'm-8', title: 'Product Launch', dueDate: '2026-05-06', status: 'upcoming', roomId: 'room-tech' },
  ],
  blockers: [
    { id: 'b-1', title: 'Ahrefs API key not provisioned', description: 'Cannot start Ahrefs integration without API credentials.', severity: 'critical', roomId: 'room-tech', owner: 'Marcus Webb', createdAt: '2026-04-03' },
    { id: 'b-2', title: 'No backend engineer for AI engine', description: 'AI insights engine requires ML expertise.', severity: 'high', roomId: 'room-tech', owner: 'Alex Chen', createdAt: '2026-04-01' },
    { id: 'b-3', title: 'Need access to user interview panel', description: 'Cannot schedule interviews without customer list.', severity: 'medium', roomId: 'room-research', owner: 'Priya Patel', createdAt: '2026-04-04' },
    { id: 'b-4', title: 'No ops lead assigned', description: 'Operations deliverables have no owner.', severity: 'high', roomId: 'room-ops', owner: 'Marcus Webb', createdAt: '2026-04-01' },
    { id: 'b-5', title: 'No designer on team', description: 'Design room has no assigned designer.', severity: 'critical', roomId: 'room-design', owner: 'Marcus Webb', createdAt: '2026-03-28' },
  ],
  deliverables: [],
  updates: [
    { id: 'u-1', author: 'Sarah Kim', roomId: 'room-tech', content: 'Dashboard layout complete', whatDone: 'Completed dashboard wireframe implementation', whatNext: 'Integrate live data feeds', whatBlocked: 'Waiting on API data schemas', createdAt: '2026-04-07' },
    { id: 'u-2', author: 'Alex Chen', roomId: 'room-tech', content: 'Search Console integration progressing', whatDone: 'OAuth flow done', whatNext: 'Build data transformation layer', whatBlocked: 'Need Ahrefs API key', createdAt: '2026-04-02' },
    { id: 'u-3', author: 'Jordan Blake', roomId: 'room-marketing', content: 'Positioning draft in progress', whatDone: 'Reviewed competitor analysis', whatNext: 'Finalize positioning doc', whatBlocked: 'Need product screenshots', createdAt: '2026-04-06' },
    { id: 'u-4', author: 'Priya Patel', roomId: 'room-research', content: '3 of 10 interviews done', whatDone: 'Completed 3 interviews', whatNext: 'Schedule remaining 7', whatBlocked: 'Waiting on customer list', createdAt: '2026-04-05' },
  ],
};
