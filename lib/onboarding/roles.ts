/**
 * FORGE Role Definitions & Onboarding Configuration
 * Role-based experience customization
 */

export type UserRole =
  | 'scrum_master'
  | 'product_manager'
  | 'program_manager'
  | 'rte'
  | 'engineering_manager'
  | 'developer'
  | 'executive';

export interface RoleDefinition {
  id: UserRole;
  name: string;
  description: string;
  primaryModules: ('quality-gate' | 'signal' | 'horizon' | 'analytics')[];
  features: string[];
  defaultDashboardWidgets: string[];
  quickActions: QuickAction[];
  tips: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: 'score' | 'signal' | 'planning' | 'analytics' | 'settings' | 'sync';
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  scrum_master: {
    id: 'scrum_master',
    name: 'Scrum Master',
    description: 'Sprint facilitation, team health, impediment removal',
    primaryModules: ['quality-gate', 'analytics'],
    features: [
      'Sprint quality scoring',
      'Team velocity tracking',
      'Burndown analytics',
      'Risk identification',
      'Story scoring',
    ],
    defaultDashboardWidgets: [
      'sprint-health',
      'quality-distribution',
      'velocity-trend',
      'at-risk-stories',
      'team-capacity',
    ],
    quickActions: [
      {
        id: 'score-sprint',
        label: 'Score Sprint Stories',
        description: 'AI-analyze all stories in current sprint',
        href: '/quality-gate',
        icon: 'score',
      },
      {
        id: 'view-burndown',
        label: 'View Burndown',
        description: 'Current sprint progress',
        href: '/analytics?view=burndown',
        icon: 'analytics',
      },
      {
        id: 'sync-jira',
        label: 'Sync JIRA',
        description: 'Pull latest updates from JIRA',
        href: '/settings/jira',
        icon: 'sync',
      },
    ],
    tips: [
      'Use Quality Gate to identify poorly defined stories before sprint planning',
      'Review the AI suggestions to coach teams on better story writing',
      'Set up automated scoring when stories are created in JIRA',
    ],
  },

  product_manager: {
    id: 'product_manager',
    name: 'Product Manager',
    description: 'Backlog quality, stakeholder communication, feature delivery',
    primaryModules: ['quality-gate', 'signal'],
    features: [
      'Story quality scoring',
      'Stakeholder update generation',
      'Feature tracking',
      'Quality trends',
      'Decision logging',
    ],
    defaultDashboardWidgets: [
      'quality-overview',
      'signal-drafts',
      'feature-progress',
      'quality-trend',
      'upcoming-releases',
    ],
    quickActions: [
      {
        id: 'create-update',
        label: 'Create Signal Update',
        description: 'Generate stakeholder update with AI',
        href: '/signal/new',
        icon: 'signal',
      },
      {
        id: 'review-quality',
        label: 'Review Quality',
        description: 'Check backlog quality scores',
        href: '/quality-gate',
        icon: 'score',
      },
      {
        id: 'view-trends',
        label: 'Quality Trends',
        description: 'Track quality over time',
        href: '/quality-gate/trends',
        icon: 'analytics',
      },
    ],
    tips: [
      'Signal updates can automatically include context from JIRA sprints',
      'Use custom rubrics to enforce your teams story standards',
      'Schedule regular quality trend reviews to track improvement',
    ],
  },

  program_manager: {
    id: 'program_manager',
    name: 'Program Manager',
    description: 'Cross-team coordination, dependency management, program risks',
    primaryModules: ['horizon', 'analytics', 'signal'],
    features: [
      'PI planning canvas',
      'Cross-team dependencies',
      'Risk management',
      'Program analytics',
      'Executive updates',
    ],
    defaultDashboardWidgets: [
      'pi-overview',
      'dependency-status',
      'risk-summary',
      'cross-team-velocity',
      'program-health',
    ],
    quickActions: [
      {
        id: 'view-pi',
        label: 'PI Canvas',
        description: 'View current PI planning board',
        href: '/horizon',
        icon: 'planning',
      },
      {
        id: 'manage-risks',
        label: 'Risk Review',
        description: 'Review and manage PI risks',
        href: '/horizon?tab=risks',
        icon: 'analytics',
      },
      {
        id: 'executive-update',
        label: 'Executive Update',
        description: 'Generate program-level update',
        href: '/signal/new?type=executive',
        icon: 'signal',
      },
    ],
    tips: [
      'Use Horizon to visualize cross-team dependencies',
      'AI can detect potential dependency conflicts automatically',
      'Risk analysis considers historical data from similar PIs',
    ],
  },

  rte: {
    id: 'rte',
    name: 'Release Train Engineer',
    description: 'Train coordination, PI planning facilitation, program execution',
    primaryModules: ['horizon', 'signal', 'analytics'],
    features: [
      'PI planning facilitation',
      'Train health monitoring',
      'Dependency resolution',
      'AI objective generation',
      'Program communication',
    ],
    defaultDashboardWidgets: [
      'train-health',
      'pi-objectives',
      'dependency-map',
      'team-capacity-overview',
      'pi-risks',
    ],
    quickActions: [
      {
        id: 'pi-canvas',
        label: 'PI Planning',
        description: 'Facilitate PI planning session',
        href: '/horizon',
        icon: 'planning',
      },
      {
        id: 'generate-objectives',
        label: 'Generate Objectives',
        description: 'AI-assisted PI objective creation',
        href: '/horizon?action=generate-objectives',
        icon: 'score',
      },
      {
        id: 'train-update',
        label: 'Train Update',
        description: 'Create train-wide communication',
        href: '/signal/new?type=train',
        icon: 'signal',
      },
    ],
    tips: [
      'Use the PI canvas during planning events for real-time collaboration',
      'AI can suggest PI objectives based on feature data',
      'Set up capacity modeling before PI planning begins',
    ],
  },

  engineering_manager: {
    id: 'engineering_manager',
    name: 'Engineering Manager',
    description: 'Team performance, capacity planning, quality standards',
    primaryModules: ['analytics', 'quality-gate'],
    features: [
      'Team velocity analytics',
      'Individual contributor metrics',
      'Quality standards enforcement',
      'Capacity intelligence',
      'Burnout detection',
    ],
    defaultDashboardWidgets: [
      'team-velocity',
      'individual-metrics',
      'quality-by-team',
      'capacity-alerts',
      'workload-balance',
    ],
    quickActions: [
      {
        id: 'team-analytics',
        label: 'Team Analytics',
        description: 'View team performance metrics',
        href: '/analytics?view=team',
        icon: 'analytics',
      },
      {
        id: 'quality-standards',
        label: 'Quality Standards',
        description: 'Configure team rubrics',
        href: '/quality-gate/rubrics',
        icon: 'score',
      },
      {
        id: 'capacity-planning',
        label: 'Capacity Planning',
        description: 'Review team capacity',
        href: '/horizon?tab=capacity',
        icon: 'planning',
      },
    ],
    tips: [
      'Capacity intelligence can predict burnout before it happens',
      'Custom rubrics help enforce consistent quality standards',
      'Use individual metrics to identify coaching opportunities',
    ],
  },

  developer: {
    id: 'developer',
    name: 'Developer',
    description: 'Story understanding, acceptance criteria clarity, sprint visibility',
    primaryModules: ['quality-gate'],
    features: [
      'Story scoring feedback',
      'Acceptance criteria suggestions',
      'Sprint progress',
      'My assigned stories',
    ],
    defaultDashboardWidgets: [
      'my-stories',
      'sprint-progress',
      'story-suggestions',
      'recent-scores',
    ],
    quickActions: [
      {
        id: 'my-stories',
        label: 'My Stories',
        description: 'View your assigned stories',
        href: '/quality-gate?filter=assigned',
        icon: 'score',
      },
      {
        id: 'sprint-board',
        label: 'Sprint Board',
        description: 'View current sprint',
        href: '/quality-gate',
        icon: 'planning',
      },
    ],
    tips: [
      'Check story scores before starting work to ensure clarity',
      'AI suggestions can help you ask better clarifying questions',
      'High-scoring stories typically have clearer requirements',
    ],
  },

  executive: {
    id: 'executive',
    name: 'Executive',
    description: 'Program health, cross-workspace insights, strategic decisions',
    primaryModules: ['analytics', 'signal'],
    features: [
      'Executive dashboard',
      'Cross-workspace analytics',
      'Program health overview',
      'Risk aggregation',
      'Stakeholder updates',
    ],
    defaultDashboardWidgets: [
      'executive-summary',
      'workspace-comparison',
      'risk-overview',
      'velocity-forecast',
      'quality-heatmap',
    ],
    quickActions: [
      {
        id: 'executive-dashboard',
        label: 'Executive View',
        description: 'Cross-workspace analytics',
        href: '/analytics/executive',
        icon: 'analytics',
      },
      {
        id: 'risk-review',
        label: 'Risk Overview',
        description: 'Organization-wide risks',
        href: '/analytics/executive?view=risks',
        icon: 'analytics',
      },
      {
        id: 'recent-updates',
        label: 'Recent Updates',
        description: 'Latest program communications',
        href: '/signal',
        icon: 'signal',
      },
    ],
    tips: [
      'Executive dashboard aggregates data across all workspaces',
      'Velocity forecasts use ML to predict future performance',
      'Quality heatmap shows team-by-team performance at a glance',
    ],
  },
};

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: {
    type: 'navigate' | 'modal' | 'tutorial';
    target: string;
  };
  completionCriteria: string;
  optional?: boolean;
}

export interface OnboardingFlow {
  role: UserRole;
  steps: OnboardingStep[];
  estimatedMinutes: number;
}

export const ONBOARDING_FLOWS: Record<UserRole, OnboardingFlow> = {
  scrum_master: {
    role: 'scrum_master',
    estimatedMinutes: 8,
    steps: [
      {
        id: 'connect-jira',
        title: 'Connect JIRA',
        description: 'Link your JIRA workspace to import sprints and stories',
        action: { type: 'navigate', target: '/settings/jira' },
        completionCriteria: 'jira_connected',
      },
      {
        id: 'first-sync',
        title: 'Sync Your Data',
        description: 'Import your current sprint data from JIRA',
        action: { type: 'navigate', target: '/settings/jira' },
        completionCriteria: 'first_sync_completed',
      },
      {
        id: 'score-first-story',
        title: 'Score a Story',
        description: 'See how AI analyzes story quality',
        action: { type: 'navigate', target: '/quality-gate' },
        completionCriteria: 'first_score',
      },
      {
        id: 'review-suggestions',
        title: 'Review AI Suggestions',
        description: 'Learn how to use improvement suggestions',
        action: { type: 'modal', target: 'suggestions-tutorial' },
        completionCriteria: 'tutorial_completed',
      },
      {
        id: 'customize-rubric',
        title: 'Customize Your Rubric',
        description: 'Adjust scoring criteria to match your teams standards',
        action: { type: 'navigate', target: '/quality-gate/rubrics' },
        completionCriteria: 'rubric_modified',
        optional: true,
      },
    ],
  },

  product_manager: {
    role: 'product_manager',
    estimatedMinutes: 10,
    steps: [
      {
        id: 'connect-jira',
        title: 'Connect JIRA',
        description: 'Link your JIRA workspace to import your backlog',
        action: { type: 'navigate', target: '/settings/jira' },
        completionCriteria: 'jira_connected',
      },
      {
        id: 'first-sync',
        title: 'Import Backlog',
        description: 'Sync your stories from JIRA',
        action: { type: 'navigate', target: '/settings/jira' },
        completionCriteria: 'first_sync_completed',
      },
      {
        id: 'score-stories',
        title: 'Score Your Stories',
        description: 'Run AI quality analysis on your backlog',
        action: { type: 'navigate', target: '/quality-gate' },
        completionCriteria: 'first_score',
      },
      {
        id: 'create-signal',
        title: 'Create Your First Update',
        description: 'Generate a stakeholder update with AI',
        action: { type: 'navigate', target: '/signal/new' },
        completionCriteria: 'first_signal',
      },
      {
        id: 'customize-rubric',
        title: 'Define Quality Standards',
        description: 'Set up scoring criteria for your team',
        action: { type: 'navigate', target: '/quality-gate/rubrics' },
        completionCriteria: 'rubric_modified',
        optional: true,
      },
    ],
  },

  program_manager: {
    role: 'program_manager',
    estimatedMinutes: 12,
    steps: [
      {
        id: 'connect-jira',
        title: 'Connect JIRA',
        description: 'Link your JIRA workspace',
        action: { type: 'navigate', target: '/settings/jira' },
        completionCriteria: 'jira_connected',
      },
      {
        id: 'create-pi',
        title: 'Create a Program Increment',
        description: 'Set up your first PI in Horizon',
        action: { type: 'navigate', target: '/horizon' },
        completionCriteria: 'first_pi_created',
      },
      {
        id: 'add-features',
        title: 'Add Features to Canvas',
        description: 'Map out features for your teams',
        action: { type: 'navigate', target: '/horizon' },
        completionCriteria: 'first_feature_added',
      },
      {
        id: 'map-dependencies',
        title: 'Map Dependencies',
        description: 'Connect features with cross-team dependencies',
        action: { type: 'navigate', target: '/horizon' },
        completionCriteria: 'first_dependency_added',
      },
      {
        id: 'analyze-risks',
        title: 'Analyze PI Risks',
        description: 'Use AI to identify potential risks',
        action: { type: 'navigate', target: '/horizon?tab=risks' },
        completionCriteria: 'risk_analysis_run',
        optional: true,
      },
    ],
  },

  rte: {
    role: 'rte',
    estimatedMinutes: 15,
    steps: [
      {
        id: 'connect-jira',
        title: 'Connect JIRA',
        description: 'Link your trains JIRA workspace',
        action: { type: 'navigate', target: '/settings/jira' },
        completionCriteria: 'jira_connected',
      },
      {
        id: 'setup-teams',
        title: 'Configure Teams',
        description: 'Set up your Agile teams in Horizon',
        action: { type: 'navigate', target: '/horizon' },
        completionCriteria: 'teams_configured',
      },
      {
        id: 'create-pi',
        title: 'Create PI',
        description: 'Set up a Program Increment',
        action: { type: 'navigate', target: '/horizon' },
        completionCriteria: 'first_pi_created',
      },
      {
        id: 'capacity-model',
        title: 'Set Up Capacity',
        description: 'Configure team capacity for the PI',
        action: { type: 'navigate', target: '/horizon?tab=capacity' },
        completionCriteria: 'capacity_configured',
      },
      {
        id: 'generate-objectives',
        title: 'Generate PI Objectives',
        description: 'Use AI to draft PI objectives',
        action: { type: 'navigate', target: '/horizon' },
        completionCriteria: 'objectives_generated',
      },
    ],
  },

  engineering_manager: {
    role: 'engineering_manager',
    estimatedMinutes: 8,
    steps: [
      {
        id: 'connect-jira',
        title: 'Connect JIRA',
        description: 'Link your teams JIRA project',
        action: { type: 'navigate', target: '/settings/jira' },
        completionCriteria: 'jira_connected',
      },
      {
        id: 'first-sync',
        title: 'Sync Team Data',
        description: 'Import your teams sprint history',
        action: { type: 'navigate', target: '/settings/jira' },
        completionCriteria: 'first_sync_completed',
      },
      {
        id: 'view-analytics',
        title: 'Review Team Analytics',
        description: 'Explore velocity and quality metrics',
        action: { type: 'navigate', target: '/analytics' },
        completionCriteria: 'analytics_viewed',
      },
      {
        id: 'setup-rubric',
        title: 'Define Quality Standards',
        description: 'Configure your teams quality rubric',
        action: { type: 'navigate', target: '/quality-gate/rubrics' },
        completionCriteria: 'rubric_modified',
      },
    ],
  },

  developer: {
    role: 'developer',
    estimatedMinutes: 5,
    steps: [
      {
        id: 'view-sprint',
        title: 'View Your Sprint',
        description: 'See the current sprint and story scores',
        action: { type: 'navigate', target: '/quality-gate' },
        completionCriteria: 'sprint_viewed',
      },
      {
        id: 'understand-scores',
        title: 'Understand Scoring',
        description: 'Learn how AI evaluates story quality',
        action: { type: 'modal', target: 'scoring-tutorial' },
        completionCriteria: 'tutorial_completed',
      },
      {
        id: 'review-suggestions',
        title: 'Review a Suggestion',
        description: 'See how AI can improve a story',
        action: { type: 'navigate', target: '/quality-gate' },
        completionCriteria: 'suggestion_viewed',
      },
    ],
  },

  executive: {
    role: 'executive',
    estimatedMinutes: 5,
    steps: [
      {
        id: 'view-dashboard',
        title: 'Executive Dashboard',
        description: 'See organization-wide metrics at a glance',
        action: { type: 'navigate', target: '/analytics/executive' },
        completionCriteria: 'executive_dashboard_viewed',
      },
      {
        id: 'workspace-comparison',
        title: 'Compare Workspaces',
        description: 'See how teams compare on quality and velocity',
        action: { type: 'navigate', target: '/analytics/executive?view=comparison' },
        completionCriteria: 'comparison_viewed',
      },
      {
        id: 'recent-updates',
        title: 'Recent Updates',
        description: 'Review latest stakeholder communications',
        action: { type: 'navigate', target: '/signal' },
        completionCriteria: 'updates_viewed',
      },
    ],
  },
};

export function getRoleDefinition(role: UserRole): RoleDefinition {
  return ROLE_DEFINITIONS[role];
}

export function getOnboardingFlow(role: UserRole): OnboardingFlow {
  return ONBOARDING_FLOWS[role];
}

export function getRoleQuickActions(role: UserRole): QuickAction[] {
  return ROLE_DEFINITIONS[role].quickActions;
}

export function getRoleDashboardWidgets(role: UserRole): string[] {
  return ROLE_DEFINITIONS[role].defaultDashboardWidgets;
}
