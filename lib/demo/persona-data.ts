/**
 * Persona-specific mock data and filtering utilities
 *
 * This module provides role-aware data filtering so each persona sees
 * contextually relevant information across all FORGE modules.
 *
 * Role Hierarchy:
 * - Developer: Individual contributor view
 * - Scrum Master: Team/sprint view
 * - Product Manager: Backlog/stakeholder view
 * - Engineering Manager: Team performance + SM visibility
 * - RTE: Cross-team coordination + EM + SM visibility
 * - Program Manager: Cross-team + client/board communication
 * - Executive: Portfolio view + all subordinate visibility
 */

import type { StoryWithScore } from "@/types/story";
import type { AudienceType } from "@/types/signal";
import {
  DEMO_STORIES,
  DEMO_UPDATES,
  DEMO_PIS,
} from "./mock-data";

// ============================================================================
// PERSONA DEFINITIONS
// ============================================================================

export type PersonaRole =
  | "scrum_master"
  | "product_manager"
  | "engineering_manager"
  | "developer"
  | "rte"
  | "executive"
  | "program_manager";

export interface PersonaConfig {
  role: PersonaRole;
  label: string;
  description: string;
  primaryModules: string[];
  secondaryModules: string[];
  canAccessRoles: PersonaRole[]; // Roles whose data this role can see
  dataFocus: {
    stories: "assigned" | "team" | "sprint" | "all" | "at_risk" | "cross_team";
    signals: AudienceType[];
    horizon: "my_features" | "team" | "dependencies" | "portfolio" | "all_teams";
  };
  keyMetrics: string[];
  quickActions: string[];
  dashboardWidgets: string[];
  notifications: string[];
}

export const PERSONA_CONFIGS: Record<PersonaRole, PersonaConfig> = {
  developer: {
    role: "developer",
    label: "Developer",
    description: "Individual contributor focused on assigned work and technical quality",
    primaryModules: ["quality-gate"],
    secondaryModules: ["kanban"],
    canAccessRoles: [],
    dataFocus: {
      stories: "assigned",
      signals: ["team"],
      horizon: "my_features",
    },
    keyMetrics: ["My stories", "Quality score", "Points delivered", "PR queue"],
    quickActions: ["View my stories", "Check blockers", "PR queue", "Daily standup notes"],
    dashboardWidgets: ["my-stories", "quality-score", "pr-queue", "blockers"],
    notifications: ["story-assigned", "pr-review-requested", "blocker-resolved", "story-scored"],
  },
  scrum_master: {
    role: "scrum_master",
    label: "Scrum Master",
    description: "Sprint health, team performance, and impediment removal",
    primaryModules: ["quality-gate", "analytics"],
    secondaryModules: ["horizon", "kanban"],
    canAccessRoles: ["developer"],
    dataFocus: {
      stories: "sprint",
      signals: ["team"],
      horizon: "team",
    },
    keyMetrics: ["Sprint health", "Velocity", "At-risk stories", "Team capacity", "Blocked items"],
    quickActions: ["Sprint review", "Quality alerts", "Team health", "Standup facilitation", "Retro prep"],
    dashboardWidgets: ["sprint-health", "velocity-trend", "at-risk-stories", "team-capacity", "blockers"],
    notifications: ["sprint-at-risk", "story-blocked", "capacity-warning", "quality-drop"],
  },
  product_manager: {
    role: "product_manager",
    label: "Product Manager",
    description: "Backlog quality, roadmap alignment, and stakeholder communication",
    primaryModules: ["quality-gate", "signal"],
    secondaryModules: ["horizon", "analytics"],
    canAccessRoles: ["developer"],
    dataFocus: {
      stories: "all",
      signals: ["executive", "client", "team"],
      horizon: "team",
    },
    keyMetrics: ["Backlog health", "Story quality trend", "Stakeholder updates", "Feature progress"],
    quickActions: ["Draft update", "Review backlog", "Quality trends", "Prioritization review"],
    dashboardWidgets: ["backlog-health', 'quality-trend', 'stakeholder-updates', 'feature-progress"],
    notifications: ["update-sent", "story-quality-change", "feature-at-risk", "stakeholder-feedback"],
  },
  engineering_manager: {
    role: "engineering_manager",
    label: "Engineering Manager",
    description: "Team capacity, delivery performance, and people management",
    primaryModules: ["analytics", "quality-gate"],
    secondaryModules: ["horizon", "signal"],
    canAccessRoles: ["developer", "scrum_master"], // Can see SM data too
    dataFocus: {
      stories: "team",
      signals: ["team", "executive"],
      horizon: "team",
    },
    keyMetrics: ["Team velocity", "Capacity utilization", "Quality trend", "Team health", "Delivery predictability"],
    quickActions: ["Capacity planning", "Performance review", "Risk assessment", "1:1 prep", "Hiring pipeline"],
    dashboardWidgets: ["team-velocity", "capacity-utilization", "quality-trend", "team-health", "individual-stats"],
    notifications: ["capacity-warning", "burnout-risk", "quality-drop", "delivery-risk", "team-change"],
  },
  rte: {
    role: "rte",
    label: "Release Train Engineer",
    description: "Cross-team coordination, PI planning, and dependency management",
    primaryModules: ["horizon", "signal", "analytics"],
    secondaryModules: ["quality-gate"],
    canAccessRoles: ["developer", "scrum_master", "engineering_manager"], // Full visibility
    dataFocus: {
      stories: "cross_team",
      signals: ["executive", "team"],
      horizon: "dependencies",
    },
    keyMetrics: ["PI progress", "Dependencies", "Cross-team risks", "Objectives", "Train velocity"],
    quickActions: ["Dependency map", "PI objectives", "Risk review", "Scrum of Scrums prep", "PI planning"],
    dashboardWidgets: ["pi-progress", "dependency-status", "cross-team-risks", 'objectives-confidence', 'train-velocity'],
    notifications: ["dependency-at-risk", "objective-confidence-change", "cross-team-blocker", "pi-milestone"],
  },
  program_manager: {
    role: "program_manager",
    label: "Program Manager",
    description: "Cross-team coordination, milestone tracking, and external stakeholder management",
    primaryModules: ["horizon", "signal"],
    secondaryModules: ["analytics"],
    canAccessRoles: ["scrum_master", "engineering_manager", "rte"],
    dataFocus: {
      stories: "at_risk",
      signals: ["executive", "client", "board"],
      horizon: "dependencies",
    },
    keyMetrics: ["Milestones", "Program risks", "Cross-team blockers", "Client deliverables", "Budget status"],
    quickActions: ["Milestone review", "Stakeholder update", "Risk report", "Client demo prep", "Budget review"],
    dashboardWidgets: ["milestones", 'program-risks', 'client-deliverables', 'budget-status', 'cross-team-blockers'],
    notifications: ["milestone-at-risk", "client-feedback", "budget-alert", "program-risk-escalation"],
  },
  executive: {
    role: "executive",
    label: "Executive",
    description: "Portfolio-level visibility, strategic decisions, and organizational health",
    primaryModules: ["signal", "horizon", "analytics"],
    secondaryModules: ["quality-gate"],
    canAccessRoles: ["developer", "scrum_master", "product_manager", "engineering_manager", "rte", "program_manager"], // Everything
    dataFocus: {
      stories: "at_risk",
      signals: ["board", "executive"],
      horizon: "portfolio",
    },
    keyMetrics: ["Portfolio health", "Strategic risks", "Team performance", "Budget utilization", "OKR progress"],
    quickActions: ["Executive summary", "Portfolio risks", "Team comparison", "Board prep", "Strategic review"],
    dashboardWidgets: ["portfolio-health", "strategic-risks", "team-comparison', 'budget-overview', 'okr-progress"],
    notifications: ["strategic-risk", "budget-alert", "portfolio-health-change", "board-action-needed"],
  },
};

// ============================================================================
// ROLE HIERARCHY UTILITIES
// ============================================================================

/**
 * Check if a role can access data from another role
 */
export function canRoleAccessRole(viewerRole: PersonaRole, targetRole: PersonaRole): boolean {
  if (viewerRole === targetRole) return true;
  return PERSONA_CONFIGS[viewerRole].canAccessRoles.includes(targetRole);
}

/**
 * Get all roles a given role has visibility into
 */
export function getAccessibleRoles(role: PersonaRole): PersonaRole[] {
  return [role, ...PERSONA_CONFIGS[role].canAccessRoles];
}

// ============================================================================
// ENHANCED MOCK DATA WITH PERSONA ATTRIBUTES
// ============================================================================

// Extended team members with comprehensive detail
export const DEMO_TEAM_EXTENDED = [
  // Scrum Master
  {
    id: "user-1",
    name: "Adaora Okonkwo",
    email: "adaora@example.com",
    role: "scrum_master" as PersonaRole,
    title: "Scrum Master",
    team: "Platform",
    teamId: "team-1",
    avatar: null,
    status: "online" as const,
    skills: ["Agile", "Facilitation", "JIRA", "Conflict Resolution", "SAFe"],
    currentCapacity: 85,
    availableHours: 34,
    plannedHours: 40,
    reportsTo: "user-8",
    directReports: [],
    certifications: ["CSM", "SAFe Scrum Master"],
    tenure: "2 years",
  },
  // Product Manager
  {
    id: "user-2",
    name: "Chidi Eze",
    email: "chidi@example.com",
    role: "product_manager" as PersonaRole,
    title: "Product Manager",
    team: "Platform",
    teamId: "team-1",
    avatar: null,
    status: "online" as const,
    skills: ["Product Strategy", "User Research", "Roadmapping", "Stakeholder Management", "Data Analysis"],
    currentCapacity: 110,
    availableHours: 44,
    plannedHours: 40,
    reportsTo: "user-10",
    directReports: [],
    certifications: ["CSPO"],
    tenure: "3 years",
  },
  // Senior Developer - Platform
  {
    id: "user-3",
    name: "Ngozi Obi",
    email: "ngozi@example.com",
    role: "developer" as PersonaRole,
    title: "Senior Engineer",
    team: "Platform",
    teamId: "team-1",
    avatar: null,
    status: "away" as const,
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "System Design"],
    currentCapacity: 125,
    availableHours: 50,
    plannedHours: 40,
    reportsTo: "user-8",
    directReports: [],
    certifications: [],
    tenure: "4 years",
    sprintPoints: {
      committed: 13,
      completed: 8,
      carryOver: 5,
    },
  },
  // Developer - Integrations
  {
    id: "user-4",
    name: "Emeka Nwosu",
    email: "emeka@example.com",
    role: "developer" as PersonaRole,
    title: "Engineer",
    team: "Integrations",
    teamId: "team-2",
    avatar: null,
    status: "online" as const,
    skills: ["Python", "APIs", "Testing", "JIRA API", "OAuth"],
    currentCapacity: 55,
    availableHours: 22,
    plannedHours: 40,
    reportsTo: "user-8",
    directReports: [],
    certifications: [],
    tenure: "1.5 years",
    sprintPoints: {
      committed: 8,
      completed: 8,
      carryOver: 0,
    },
  },
  // UX Designer - Platform
  {
    id: "user-5",
    name: "Funke Adeyemi",
    email: "funke@example.com",
    role: "developer" as PersonaRole,
    title: "UX Designer",
    team: "Platform",
    teamId: "team-1",
    avatar: null,
    status: "offline" as const,
    skills: ["Figma", "User Research", "Prototyping", "Design Systems", "Accessibility"],
    currentCapacity: 90,
    availableHours: 36,
    plannedHours: 40,
    reportsTo: "user-8",
    directReports: [],
    certifications: [],
    tenure: "2 years",
    sprintPoints: {
      committed: 5,
      completed: 5,
      carryOver: 0,
    },
  },
  // DevOps - Integrations
  {
    id: "user-6",
    name: "Tunde Bakare",
    email: "tunde@example.com",
    role: "developer" as PersonaRole,
    title: "DevOps Engineer",
    team: "Integrations",
    teamId: "team-2",
    avatar: null,
    status: "online" as const,
    skills: ["AWS", "Terraform", "CI/CD", "Kubernetes", "Monitoring"],
    currentCapacity: 80,
    availableHours: 32,
    plannedHours: 40,
    reportsTo: "user-8",
    directReports: [],
    certifications: ["AWS Solutions Architect"],
    tenure: "3 years",
    sprintPoints: {
      committed: 8,
      completed: 5,
      carryOver: 3,
    },
  },
  // QA - Analytics
  {
    id: "user-7",
    name: "Amara Okafor",
    email: "amara@example.com",
    role: "developer" as PersonaRole,
    title: "QA Engineer",
    team: "Analytics",
    teamId: "team-3",
    avatar: null,
    status: "online" as const,
    skills: ["Test Automation", "Playwright", "API Testing", "Performance Testing"],
    currentCapacity: 75,
    availableHours: 30,
    plannedHours: 40,
    reportsTo: "user-8",
    directReports: [],
    certifications: ["ISTQB"],
    tenure: "2 years",
    sprintPoints: {
      committed: 5,
      completed: 5,
      carryOver: 0,
    },
  },
  // Engineering Manager
  {
    id: "user-8",
    name: "Oluwaseun Ajayi",
    email: "seun@example.com",
    role: "engineering_manager" as PersonaRole,
    title: "Engineering Manager",
    team: "Platform",
    teamId: "team-1",
    avatar: null,
    status: "online" as const,
    skills: ["Team Leadership", "Architecture", "Strategy", "Hiring", "Performance Management"],
    currentCapacity: 95,
    availableHours: 38,
    plannedHours: 40,
    reportsTo: "user-10",
    directReports: ["user-3", "user-4", "user-5", "user-6", "user-7"],
    certifications: [],
    tenure: "5 years",
    teamMetrics: {
      teamSize: 5,
      avgVelocity: 28,
      qualityTrend: "+7%",
      attritionRisk: "low",
    },
  },
  // RTE
  {
    id: "user-9",
    name: "Chioma Ibe",
    email: "chioma@example.com",
    role: "rte" as PersonaRole,
    title: "Release Train Engineer",
    team: "All",
    teamId: "all",
    avatar: null,
    status: "online" as const,
    skills: ["SAFe", "PI Planning", "Cross-team Coordination", "Risk Management", "Agile Coaching"],
    currentCapacity: 100,
    availableHours: 40,
    plannedHours: 40,
    reportsTo: "user-10",
    directReports: [],
    certifications: ["SAFe RTE", "SAFe SPC"],
    tenure: "4 years",
    trainMetrics: {
      teamsCount: 4,
      piProgress: 42,
      dependenciesAtRisk: 1,
      objectivesOnTrack: 3,
    },
  },
  // Executive / VP
  {
    id: "user-10",
    name: "Babatunde Olumide",
    email: "tunde.o@example.com",
    role: "executive" as PersonaRole,
    title: "VP Engineering",
    team: "All",
    teamId: "all",
    avatar: null,
    status: "online" as const,
    skills: ["Strategy", "Organizational Design", "Stakeholder Management", "Budget Management", "M&A"],
    currentCapacity: 100,
    availableHours: 40,
    plannedHours: 40,
    reportsTo: null,
    directReports: ["user-2", "user-8", "user-9"],
    certifications: [],
    tenure: "6 years",
    portfolioMetrics: {
      teamsManaged: 4,
      headcount: 15,
      budgetUtilization: 82,
      strategicRisks: 2,
    },
  },
  // Additional developers for Mobile team
  {
    id: "user-11",
    name: "Kemi Adesina",
    email: "kemi@example.com",
    role: "developer" as PersonaRole,
    title: "Mobile Engineer",
    team: "Mobile",
    teamId: "team-4",
    avatar: null,
    status: "online" as const,
    skills: ["React Native", "iOS", "Android", "Mobile UX"],
    currentCapacity: 100,
    availableHours: 40,
    plannedHours: 40,
    reportsTo: "user-8",
    directReports: [],
    certifications: [],
    tenure: "2 years",
    sprintPoints: {
      committed: 8,
      completed: 5,
      carryOver: 3,
    },
  },
  {
    id: "user-12",
    name: "Yusuf Ibrahim",
    email: "yusuf@example.com",
    role: "developer" as PersonaRole,
    title: "Backend Engineer",
    team: "Mobile",
    teamId: "team-4",
    avatar: null,
    status: "online" as const,
    skills: ["Go", "gRPC", "Mobile APIs", "Performance"],
    currentCapacity: 85,
    availableHours: 34,
    plannedHours: 40,
    reportsTo: "user-8",
    directReports: [],
    certifications: [],
    tenure: "1 year",
    sprintPoints: {
      committed: 8,
      completed: 6,
      carryOver: 2,
    },
  },
  // Program Manager
  {
    id: "user-13",
    name: "Ifeoma Chukwu",
    email: "ifeoma@example.com",
    role: "program_manager" as PersonaRole,
    title: "Program Manager",
    team: "All",
    teamId: "all",
    avatar: null,
    status: "online" as const,
    skills: ["Program Management", "Client Relations", "Risk Management", "Budget Tracking", "Reporting"],
    currentCapacity: 95,
    availableHours: 38,
    plannedHours: 40,
    reportsTo: "user-10",
    directReports: [],
    certifications: ["PMP", "SAFe PM/PO"],
    tenure: "4 years",
    programMetrics: {
      activePrograms: 2,
      milestonesAtRisk: 1,
      clientSatisfaction: 4.2,
      budgetVariance: "+3%",
    },
  },
];

// Map existing stories with comprehensive persona info
export const DEMO_STORIES_EXTENDED: StoryWithScore[] = DEMO_STORIES.map((story, index) => {
  const assigneeMapping: Record<number, string> = {
    0: "user-3", // Ngozi - Senior Engineer
    1: "user-4", // Emeka - Engineer
    2: "user-6", // Tunde - DevOps
    3: "user-11", // Kemi - Mobile
    4: "user-12", // Yusuf - Backend
    5: "user-5", // Funke - UX
    6: "user-7", // Amara - QA
  };

  const assigneeId = story.assigneeId || assigneeMapping[index % 7] || "user-3";
  const assignee = DEMO_TEAM_EXTENDED.find(m => m.id === assigneeId);

  return {
    ...story,
    assigneeId,
    assigneeName: assignee?.name ?? "Unassigned",
    team: assignee?.team ?? "Platform",
    teamId: assignee?.teamId ?? "team-1",
    reporterId: "user-2",
    reporterName: "Chidi Eze",
    watchers: index % 2 === 0 ? ["user-1", "user-2", "user-8"] : ["user-1"],
    priority: index % 4 === 0 ? "high" : index % 3 === 0 ? "medium" : "low",
    blockedBy: index === 3 ? ["FORGE-102"] : [],
    blocks: index === 1 ? ["FORGE-106"] : [],
  };
});

function getAssigneeName(userId: string): string {
  const member = DEMO_TEAM_EXTENDED.find(m => m.id === userId);
  return member?.name ?? "Unassigned";
}

function getTeamForAssignee(userId: string): string {
  const member = DEMO_TEAM_EXTENDED.find(m => m.id === userId);
  return member?.team ?? "Platform";
}

// Extended Signal updates with comprehensive targeting
export const DEMO_UPDATES_EXTENDED = [
  ...DEMO_UPDATES,
  // Developer-focused update
  {
    id: "update-5",
    title: "Developer Weekly - Sprint 22 Technical Notes",
    sprintRef: "Sprint 22",
    audiences: ["team"] as AudienceType[],
    status: "sent" as const,
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "Ngozi Obi",
    authorId: "user-3",
    content: `## Technical Update - Sprint 22

### Completed
- OAuth2 flow now supports refresh tokens
- API rate limiting middleware deployed
- Safari login fix shipped

### In Progress
- Paystack integration (waiting on API docs clarification)
- Audit logging system

### Technical Debt
- Auth module has token refresh duplication (scheduled S24)
- Need to upgrade Next.js to latest patch

### For Review
- PR #234: Add keyboard shortcuts
- PR #238: Audit log schema`,
    mentionedStories: ["FORGE-101", "FORGE-107", "FORGE-108"],
    targetRole: "developer" as PersonaRole,
  },
  // Scrum Master-focused update
  {
    id: "update-6",
    title: "Scrum Master Weekly - Team Health Report",
    sprintRef: "Sprint 22",
    audiences: ["team"] as AudienceType[],
    status: "sent" as const,
    sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "Adaora Okonkwo",
    authorId: "user-1",
    content: `## Team Health Report

### Sprint Metrics
- Velocity: 24/28 points (86%)
- Quality Score: 72 avg (+7 from S21)
- Stories at Risk: 4
- Blocked Items: 1

### Team Capacity
| Member | Allocation | Status |
|--------|------------|--------|
| Ngozi | 125% | Overloaded |
| Emeka | 55% | Available |
| Tunde | 80% | Good |
| Funke | 90% | Good |

### Impediments
1. Paystack API documentation incomplete
2. Ngozi overloaded - need to redistribute

### Action Items
1. Redistribute work from Ngozi to Emeka
2. Schedule refinement for low-quality stories
3. Follow up on Paystack API docs`,
    targetRole: "scrum_master" as PersonaRole,
  },
  // Engineering Manager-focused update
  {
    id: "update-7",
    title: "Engineering Leadership Update - Q2 Progress",
    sprintRef: "Sprint 22",
    audiences: ["executive"] as AudienceType[],
    status: "draft" as const,
    sentAt: null,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    authorName: "Oluwaseun Ajayi",
    authorId: "user-8",
    content: `## Engineering Leadership Update

### Key Achievements
- JIRA integration at 95% reliability
- Authentication system production-ready
- 4 of 5 PI objectives on track

### Team Health
- Platform: Healthy (minor capacity issue)
- Integrations: Healthy
- Analytics: Healthy
- Mobile: At Risk (velocity -15%)

### Areas of Concern
- Mobile team velocity below target (-15%)
- 1 critical dependency at risk (payments → mobile)
- Senior engineer capacity issue identified

### Budget & Resources
- On budget for Q2
- Contractor request for DevOps submitted
- Hiring pipeline: 2 candidates in final rounds

### Next Quarter Planning
- Begin Q3 roadmap discussions
- Team scaling needs assessment
- Tech debt sprint scheduled`,
    targetRole: "engineering_manager" as PersonaRole,
  },
  // RTE-focused update
  {
    id: "update-8",
    title: "RTE PI Progress Update",
    sprintRef: "PI 2026.2",
    audiences: ["executive", "team"] as AudienceType[],
    status: "sent" as const,
    sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "Chioma Ibe",
    authorId: "user-9",
    content: `## PI 2026.2 Progress Report

### Objectives Status
| Objective | Confidence | Trend |
|-----------|------------|-------|
| Payment Processing | 85% | → |
| JIRA Reliability | 95% | ↑ |
| Mobile Beta | 70% | ↓ |
| Analytics Dashboard | 90% | → |

### Cross-Team Dependencies
- 2 of 5 resolved
- 1 at risk (payments → mobile)
- 2 on track

### Key Risks
1. **High**: Mobile payments blocked by gateway
2. **Medium**: Slack API rate limits may impact notifications
3. **Low**: Third-party API changes (mitigated)

### Scrum of Scrums Highlights
- Platform unblocked on auth
- Mobile needs support from Integrations
- Analytics on track for demo

### Upcoming
- PI Planning for PI 2026.3 in 4 weeks
- Innovation sprint next iteration`,
    targetRole: "rte" as PersonaRole,
  },
  // Product Manager-focused update
  {
    id: "update-9",
    title: "Product Update - Feature Readiness",
    sprintRef: "Sprint 22",
    audiences: ["executive", "client"] as AudienceType[],
    status: "sent" as const,
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "Chidi Eze",
    authorId: "user-2",
    content: `## Product Update - Q2 Feature Readiness

### Released This Sprint
- Google OAuth login
- Enhanced story scoring
- Real-time dashboard updates

### Coming Next Sprint
- Paystack payment integration
- Slack notifications
- Mobile app beta

### Backlog Health
- 42 stories in backlog
- 28 ready for sprint (score ≥70)
- 14 need refinement

### Customer Feedback
- "Love the new scoring" - Beta Customer A
- "Need mobile support ASAP" - Beta Customer B

### Roadmap Status
- Q2 objectives: 75% complete
- On track for GA launch`,
    targetRole: "product_manager" as PersonaRole,
  },
  // Program Manager-focused update
  {
    id: "update-10",
    title: "Program Status - Client Deliverables",
    sprintRef: "May 2026",
    audiences: ["executive", "client", "board"] as AudienceType[],
    status: "draft" as const,
    sentAt: null,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    authorName: "Ifeoma Chukwu",
    authorId: "user-13",
    content: `## Program Status Report

### Milestone Status
| Milestone | Due Date | Status |
|-----------|----------|--------|
| Payment Integration | May 15 | At Risk |
| Mobile Beta | May 30 | On Track |
| GA Release | June 30 | On Track |

### Client Deliverables
- Demo environment: Ready
- API documentation: 80% complete
- Integration guide: In progress

### Budget Status
- Q2 Spend: $485,000 / $550,000 (88%)
- Forecast: On budget
- Variance: +3% (within threshold)

### Risks & Issues
1. Payment integration delay may impact mobile
2. Client requested scope addition (being evaluated)

### Next Steps
1. Escalate payment dependency
2. Schedule client demo for May 12
3. Finalize Q3 budget proposal`,
    targetRole: "program_manager" as PersonaRole,
  },
  // Executive-focused update
  {
    id: "update-11",
    title: "Executive Summary - Q2 Engineering",
    sprintRef: "Q2 2026",
    audiences: ["board", "executive"] as AudienceType[],
    status: "draft" as const,
    sentAt: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    authorName: "Babatunde Olumide",
    authorId: "user-10",
    content: `## Executive Summary - Engineering Q2

### Portfolio Health: 78%
- 4 teams operational
- 1 team at risk (Mobile -15% velocity)
- Overall delivery confidence: High

### Strategic Objectives
| Objective | Status | Notes |
|-----------|--------|-------|
| Market Launch | On Track | GA June 30 |
| Payment Revenue | At Risk | Integration delayed |
| Mobile First | On Track | Beta May 30 |

### Financial Summary
- Q2 Budget: $550,000
- YTD Spend: $485,000
- Forecast: On budget

### Key Decisions Needed
1. Approve contractor for DevOps (Critical)
2. Scope decision on client request
3. Q3 headcount planning

### Team Performance
- Velocity: +12% QoQ
- Quality: +24% improvement
- Retention: 100% (no attrition)`,
    targetRole: "executive" as PersonaRole,
  },
];

// Extended PI data with comprehensive persona-relevant info
export const DEMO_PIS_EXTENDED = DEMO_PIS.map(pi => ({
  ...pi,
  features: pi.features.map(f => ({
    ...f,
    assignees: getFeatureAssignees(f.team),
    stakeholders: ["user-2", "user-10"],
    relatedStories: getRelatedStories(f.id),
    owner: getFeatureOwner(f.team),
    progress: getFeatureProgress(f.status),
  })),
}));

function getFeatureAssignees(teamId: string): string[] {
  switch (teamId) {
    case "team-1": return ["user-3", "user-5"];
    case "team-2": return ["user-4", "user-6"];
    case "team-3": return ["user-7"];
    case "team-4": return ["user-11", "user-12"];
    default: return ["user-3"];
  }
}

function getFeatureOwner(teamId: string): string {
  switch (teamId) {
    case "team-1": return "user-3";
    case "team-2": return "user-4";
    case "team-3": return "user-7";
    case "team-4": return "user-11";
    default: return "user-3";
  }
}

function getFeatureProgress(status: string): number {
  switch (status) {
    case "done": return 100;
    case "in_progress": return 50;
    case "planned": return 0;
    default: return 0;
  }
}

function getRelatedStories(featureId: string): string[] {
  const mapping: Record<string, string[]> = {
    "f-1": ["FORGE-102", "FORGE-111"],
    "f-2": ["FORGE-105"],
    "f-3": ["FORGE-103"],
    "f-4": ["FORGE-106"],
    "f-5": ["FORGE-111"],
    "f-6": ["FORGE-104"],
    "f-7": ["FORGE-109"],
    "f-8": ["FORGE-104"],
    "f-9": ["FORGE-101"],
    "f-10": ["FORGE-107"],
  };
  return mapping[featureId] ?? [];
}

// ============================================================================
// PERSONA-AWARE FILTERING FUNCTIONS
// ============================================================================

/**
 * Filter stories based on persona role with hierarchy support
 */
export function filterStoriesForPersona(
  stories: StoryWithScore[],
  role: PersonaRole,
  currentUserId: string = "user-3"
): StoryWithScore[] {
  const config = PERSONA_CONFIGS[role];

  switch (config.dataFocus.stories) {
    case "assigned":
      // Developer: Only their assigned stories
      return stories.filter(s => s.assigneeId === currentUserId);

    case "sprint":
      // Scrum Master: Current sprint stories
      return stories.filter(s => s.sprintId === "sprint-22" || s.sprintId === "sprint-23");

    case "team":
      // Engineering Manager: Team's stories (Platform team)
      const teamMembers = DEMO_TEAM_EXTENDED
        .filter(m => m.team === "Platform" || m.team === "Integrations")
        .map(m => m.id);
      return stories.filter(s =>
        s.assigneeId && teamMembers.includes(s.assigneeId)
      );

    case "cross_team":
      // RTE: All stories with cross-team implications
      return stories.filter(s => {
        const hasBlocks = (s as any).blocks?.length > 0 || (s as any).blockedBy?.length > 0;
        const isAtRisk = (s.score?.totalScore ?? 100) < 70;
        const isHighPriority = (s as any).priority === "high";
        return hasBlocks || isAtRisk || isHighPriority;
      });

    case "at_risk":
      // Executive/Program Manager: Only at-risk stories
      return stories.filter(s => (s.score?.totalScore ?? 100) < 70);

    case "all":
    default:
      // Product Manager: All stories
      return stories;
  }
}

/**
 * Filter Signal updates based on persona role with hierarchy
 */
export function filterUpdatesForPersona(
  updates: typeof DEMO_UPDATES_EXTENDED,
  role: PersonaRole
): typeof DEMO_UPDATES_EXTENDED {
  const config = PERSONA_CONFIGS[role];
  const relevantAudiences = config.dataFocus.signals;
  const accessibleRoles = getAccessibleRoles(role);

  return updates.filter(update => {
    // Show updates targeted at this role's audiences
    const hasRelevantAudience = update.audiences.some(a =>
      relevantAudiences.includes(a)
    );

    // Show updates created for this role type
    const isTargetedToRole = (update as any).targetRole === role;

    // Show updates from roles this persona can access
    const isFromAccessibleRole = accessibleRoles.includes((update as any).targetRole);

    return hasRelevantAudience || isTargetedToRole || isFromAccessibleRole;
  });
}

/**
 * Get relevant PI features based on persona with hierarchy
 */
export function filterPIForPersona(
  pis: typeof DEMO_PIS_EXTENDED,
  role: PersonaRole,
  currentUserId: string = "user-3"
) {
  const config = PERSONA_CONFIGS[role];

  return pis.map(pi => {
    let filteredFeatures = pi.features;

    switch (config.dataFocus.horizon) {
      case "my_features":
        // Developer: Only features they're assigned to
        filteredFeatures = pi.features.filter(f =>
          (f as any).assignees?.includes(currentUserId)
        );
        break;

      case "team":
        // Team-level view (SM, PM, EM): Their team's features
        filteredFeatures = pi.features.filter(f => f.team === "team-1" || f.team === "team-2");
        break;

      case "dependencies":
        // RTE: Focus on features with dependencies
        const featuresWithDeps = new Set(
          pi.dependencies.flatMap(d => [d.from, d.to])
        );
        filteredFeatures = pi.features.filter(f => featuresWithDeps.has(f.id));
        break;

      case "all_teams":
        // Program Manager: All teams but focused on at-risk
        filteredFeatures = pi.features.filter(f =>
          f.status === "in_progress" || featuresHasAtRiskDependency(f.id, pi.dependencies)
        );
        break;

      case "portfolio":
        // Executive: All features (no filter)
        break;
    }

    return {
      ...pi,
      features: filteredFeatures,
      dependencies: pi.dependencies.filter(d =>
        filteredFeatures.some(f => f.id === d.from || f.id === d.to)
      ),
    };
  });
}

function featuresHasAtRiskDependency(featureId: string, dependencies: any[]): boolean {
  return dependencies.some(d =>
    (d.from === featureId || d.to === featureId) && d.status === "at_risk"
  );
}

/**
 * Get persona-specific metrics summary
 */
export function getPersonaMetrics(role: PersonaRole) {
  const allStories = DEMO_STORIES_EXTENDED;
  const filteredStories = filterStoriesForPersona(allStories, role);

  const baseMetrics = {
    totalStories: filteredStories.length,
    averageScore: Math.round(
      filteredStories.reduce((acc, s) => acc + (s.score?.totalScore ?? 0), 0) /
      (filteredStories.length || 1)
    ),
    atRiskCount: filteredStories.filter(s => (s.score?.totalScore ?? 100) < 70).length,
    completedCount: filteredStories.filter(s => s.status === "Done").length,
    inProgressCount: filteredStories.filter(s => s.status === "In Progress").length,
  };

  switch (role) {
    case "developer":
      return {
        ...baseMetrics,
        myPoints: filteredStories.reduce((acc, s) => acc + (s.storyPoints ?? 0), 0),
        prReviewsPending: 3,
        daysInCurrentStory: 2,
        blockedItems: 0,
      };

    case "scrum_master":
      return {
        ...baseMetrics,
        sprintHealth: 78,
        teamVelocity: 28,
        plannedVelocity: 32,
        blockedStories: 1,
        capacityUtilization: 85,
        impedimentsOpen: 2,
      };

    case "product_manager":
      return {
        ...baseMetrics,
        backlogSize: allStories.filter(s => s.status === "To Do").length,
        readyForSprint: allStories.filter(s =>
          s.status === "To Do" && (s.score?.totalScore ?? 0) >= 70
        ).length,
        needsRefinement: allStories.filter(s =>
          (s.score?.totalScore ?? 0) < 60
        ).length,
        stakeholderUpdatesDue: 2,
      };

    case "engineering_manager":
      return {
        ...baseMetrics,
        teamSize: 7,
        overloadedMembers: 1,
        underutilizedMembers: 1,
        qualityTrend: "+7%",
        velocityTrend: "+12%",
        attritionRisk: "low",
        openReqs: 2,
      };

    case "rte":
      return {
        ...baseMetrics,
        piProgress: 42,
        dependenciesTotal: 5,
        dependenciesAtRisk: 1,
        dependenciesResolved: 2,
        objectivesOnTrack: 3,
        objectivesTotal: 4,
        teamsAtRisk: 1,
        trainVelocity: 112,
      };

    case "program_manager":
      return {
        ...baseMetrics,
        milestonesTotal: 5,
        milestonesAtRisk: 1,
        milestonesComplete: 2,
        clientDeliverables: 4,
        budgetUtilization: 88,
        programRisks: 2,
      };

    case "executive":
      return {
        ...baseMetrics,
        teamsCount: 4,
        portfolioHealth: 78,
        strategicRisks: 2,
        budgetUtilization: 82,
        headcount: 15,
        okrProgress: 75,
      };

    default:
      return baseMetrics;
  }
}

/**
 * Get persona-specific insights/recommendations
 */
export function getPersonaInsights(role: PersonaRole): Array<{
  type: "info" | "warning" | "success" | "action";
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
  priority?: "high" | "medium" | "low";
}> {
  switch (role) {
    case "developer":
      return [
        {
          type: "info",
          title: "2 stories assigned to you",
          description: "FORGE-101 (In Progress) and FORGE-111 (To Do)",
          action: "View my stories",
          actionHref: "/demo/quality-gate",
          priority: "high",
        },
        {
          type: "warning",
          title: "FORGE-111 needs attention",
          description: "Score is 42/100 - add acceptance criteria before starting",
          action: "Improve story",
          actionHref: "/demo/quality-gate",
          priority: "high",
        },
        {
          type: "success",
          title: "FORGE-105 scored 94/100",
          description: "Your JIRA OAuth story is now a quality template",
          priority: "low",
        },
        {
          type: "action",
          title: "3 PRs awaiting review",
          description: "From Emeka, Tunde, and Kemi",
          action: "Review PRs",
          priority: "medium",
        },
      ];

    case "scrum_master":
      return [
        {
          type: "warning",
          title: "4 stories below quality threshold",
          description: "FORGE-102, FORGE-104, FORGE-109, FORGE-111 need refinement",
          action: "Review at-risk stories",
          actionHref: "/demo/quality-gate",
          priority: "high",
        },
        {
          type: "warning",
          title: "Team capacity imbalance",
          description: "Ngozi at 125%, Emeka at 55% - consider rebalancing",
          action: "View capacity",
          actionHref: "/demo/analytics",
          priority: "high",
        },
        {
          type: "warning",
          title: "1 blocked story",
          description: "FORGE-106 blocked by FORGE-102 payment dependency",
          action: "View blockers",
          actionHref: "/demo/kanban",
          priority: "high",
        },
        {
          type: "success",
          title: "Quality improving",
          description: "Average score up 7 points from last sprint",
          priority: "low",
        },
        {
          type: "action",
          title: "Retro prep needed",
          description: "Sprint 22 ends in 3 days",
          action: "Prepare retro",
          priority: "medium",
        },
      ];

    case "product_manager":
      return [
        {
          type: "action",
          title: "5 stories ready for sprint",
          description: "Stories with score ≥70 and all criteria met",
          action: "Review backlog",
          actionHref: "/demo/quality-gate",
          priority: "high",
        },
        {
          type: "warning",
          title: "4 stories need refinement",
          description: "Low scores due to missing acceptance criteria",
          action: "Schedule refinement",
          priority: "high",
        },
        {
          type: "info",
          title: "Stakeholder update due",
          description: "Q2 board update draft is waiting for review",
          action: "Review draft",
          actionHref: "/demo/signal",
          priority: "medium",
        },
        {
          type: "info",
          title: "Client demo scheduled",
          description: "May 12 - prepare demo environment",
          action: "Prep demo",
          priority: "medium",
        },
      ];

    case "engineering_manager":
      return [
        {
          type: "warning",
          title: "Burnout risk detected",
          description: "Ngozi showing high workload for 4+ weeks (125% capacity)",
          action: "Review capacity",
          actionHref: "/demo/analytics",
          priority: "high",
        },
        {
          type: "warning",
          title: "Mobile team velocity down",
          description: "-15% velocity, may impact PI objectives",
          action: "Investigate",
          actionHref: "/demo/analytics",
          priority: "high",
        },
        {
          type: "info",
          title: "Team velocity stable",
          description: "Platform averaging 28 points/sprint, on track for PI goals",
          priority: "low",
        },
        {
          type: "success",
          title: "Quality trend positive",
          description: "Team average score improved 24% this quarter",
          priority: "low",
        },
        {
          type: "action",
          title: "2 candidates in final rounds",
          description: "DevOps and Backend roles",
          action: "Review pipeline",
          priority: "medium",
        },
      ];

    case "rte":
      return [
        {
          type: "warning",
          title: "1 dependency at risk",
          description: "Mobile payments blocked by gateway integration",
          action: "View dependencies",
          actionHref: "/demo/horizon",
          priority: "high",
        },
        {
          type: "warning",
          title: "Mobile team at risk",
          description: "Velocity -15%, may miss PI objective",
          action: "Escalate",
          actionHref: "/demo/analytics",
          priority: "high",
        },
        {
          type: "info",
          title: "PI 2026.2 at 42% progress",
          description: "3 of 4 objectives on track, 4 weeks remaining",
          action: "View PI canvas",
          actionHref: "/demo/horizon",
          priority: "medium",
        },
        {
          type: "action",
          title: "PI planning in 4 weeks",
          description: "Start preparing PI 2026.3 objectives",
          action: "Begin planning",
          priority: "medium",
        },
        {
          type: "info",
          title: "Scrum of Scrums tomorrow",
          description: "Prepare cross-team updates",
          priority: "low",
        },
      ];

    case "program_manager":
      return [
        {
          type: "warning",
          title: "Payment milestone at risk",
          description: "May 15 deadline, blocked by integration",
          action: "Review milestone",
          actionHref: "/demo/horizon",
          priority: "high",
        },
        {
          type: "warning",
          title: "Client scope request pending",
          description: "Additional analytics features requested",
          action: "Evaluate scope",
          priority: "high",
        },
        {
          type: "info",
          title: "Budget on track",
          description: "88% utilized, within threshold",
          priority: "low",
        },
        {
          type: "action",
          title: "Client demo in 11 days",
          description: "May 12 - coordinate with PM",
          action: "Prep demo",
          priority: "medium",
        },
        {
          type: "info",
          title: "Q3 planning kickoff",
          description: "Budget proposal due May 20",
          action: "Start proposal",
          priority: "medium",
        },
      ];

    case "executive":
      return [
        {
          type: "info",
          title: "Portfolio health: 78%",
          description: "4 teams active, 1 at-risk team (Mobile)",
          action: "View portfolio",
          actionHref: "/demo/analytics",
          priority: "medium",
        },
        {
          type: "warning",
          title: "2 strategic risks",
          description: "Mobile launch delay and capacity concerns",
          action: "Review risks",
          actionHref: "/demo/horizon",
          priority: "high",
        },
        {
          type: "warning",
          title: "Decision needed: DevOps contractor",
          description: "Critical for Q2 delivery",
          action: "Approve request",
          priority: "high",
        },
        {
          type: "success",
          title: "Q2 on budget",
          description: "82% budget utilization, on track",
          priority: "low",
        },
        {
          type: "action",
          title: "Board update due",
          description: "Quarterly engineering summary needed",
          action: "Review draft",
          actionHref: "/demo/signal",
          priority: "medium",
        },
      ];

    default:
      return [];
  }
}

// ============================================================================
// HELP CONTENT FOR COMPONENTS
// ============================================================================

export const HELP_CONTENT = {
  // Quality Gate
  scoreRing: "The overall quality score (0-100) based on 5 dimensions: Completeness, Clarity, Estimability, Traceability, and Testability. Stories scoring below 70 are flagged as at-risk.",
  sprintHealth: "Aggregate health of the sprint based on average story scores, completion rate, and blocked items. Green (≥80), Yellow (60-79), Red (<60).",
  atRiskStories: "Stories with quality scores below 70. These often have missing acceptance criteria, vague descriptions, or unclear scope.",
  qualityTrend: "How your average story quality has changed over the past 6 sprints. Upward trend indicates improving backlog health.",
  storyDimensions: {
    completeness: "Does the story have all required elements? Title, description, acceptance criteria, story points, and proper categorization.",
    clarity: "Is the story unambiguous? Clear language, no vague terms like 'handle' or 'manage', specific technical requirements.",
    estimability: "Can the team confidently estimate this? Well-defined scope, identified dependencies, appropriate size.",
    traceability: "Can this be traced to business value? Linked to epic, clear stakeholder need, business context.",
    testability: "Can acceptance be objectively verified? Measurable criteria, no subjective measures like 'user should be happy'.",
  },
  aiSuggestions: "AI-generated improvements for your story. Click to see the suggested revision and apply it directly.",

  // Signal
  audienceTypes: {
    team: "Internal team members - detailed technical updates and blockers.",
    executive: "Leadership - high-level progress, risks, and strategic decisions.",
    client: "External stakeholders - deliverables, timelines, and demos.",
    board: "Board members - strategic summary, milestones, and financials.",
  },
  signalDraft: "AI-generated draft based on your sprint data. Customize tone, detail level, and focus areas before sending.",
  updateStatus: "Draft (not sent), Sent (delivered), Archived (historical record).",

  // Horizon
  piCanvas: "Visual representation of your Program Increment. Drag features between iterations, create dependencies, track objectives.",
  dependencies: "Connections between features that must be coordinated. Status: Open (needs attention), At Risk (blocking), Resolved (complete).",
  piObjectives: "Business outcomes this PI aims to achieve. Committed objectives must be delivered; Uncommitted are stretch goals.",
  confidenceVote: "Team's confidence in achieving this objective (0-100%). Re-vote as the PI progresses to track changes.",
  riskRegister: "Identified risks to PI success. Severity levels: Low, Medium, High, Critical. Track mitigation status.",

  // Analytics
  velocity: "Story points completed per sprint. Used to forecast future capacity and detect trends.",
  burndown: "Remaining work over time. Ideal line shows expected progress; actual line shows real progress.",
  capacityUtilization: "Percentage of team's available capacity being used. Over 100% indicates overload risk.",
  cycleTime: "Average time from 'In Progress' to 'Done'. Lower is better - indicates efficient flow.",

  // Role-specific
  roleHierarchy: "Some roles can see data from subordinate roles. EMs see SM data, RTEs see EM+SM data, Executives see all.",

  // Role tips for dashboard
  roles: {
    developer: "Focus on your assigned stories and code quality. Use the Quality Gate to ensure your stories are well-defined before starting work.",
    scrum_master: "Monitor sprint health and help the team remove impediments. Use AI insights to identify stories needing attention before standup.",
    product_manager: "Keep your backlog healthy and communicate progress to stakeholders. Use Signal to send targeted updates to different audiences.",
    engineering_manager: "Track team performance and capacity across sprints. Use analytics to identify bottlenecks and support your team leads.",
    rte: "Coordinate across teams and manage dependencies. Use Horizon to track PI progress and identify cross-team risks early.",
    program_manager: "Maintain portfolio-level visibility and track milestones. Use Signal for executive updates and Horizon for strategic planning.",
    executive: "Get high-level insights across the organization. Use dashboards for strategic decisions without needing to drill into details.",
  } as Record<PersonaRole, string>,
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DEMO_STORIES_EXTENDED as PERSONA_STORIES,
  DEMO_UPDATES_EXTENDED as PERSONA_UPDATES,
  DEMO_PIS_EXTENDED as PERSONA_PIS,
  DEMO_TEAM_EXTENDED as PERSONA_TEAM,
};
