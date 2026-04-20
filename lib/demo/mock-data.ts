import type { StoryWithScore } from "@/types/story";
import type { AudienceType } from "@/types/signal";

// Realistic mock stories with various scores and states
export const DEMO_STORIES: StoryWithScore[] = [
  {
    id: "1",
    workspaceId: "demo-ws",
    jiraId: "10001",
    jiraKey: "FORGE-101",
    title: "Implement OAuth2 authentication with Google SSO",
    description: "As a user, I want to sign in with my Google account so that I can access the platform without creating a new password. The login flow should be seamless and redirect users back to where they were.",
    acceptanceCriteria: "Given I am on the login page, when I click 'Sign in with Google', then I am redirected to Google OAuth, and upon successful authentication, I am redirected to the dashboard with my session active.",
    storyPoints: 5,
    status: "In Progress",
    assigneeId: "user-1",
    epicKey: "AUTH",
    sprintId: "sprint-22",
    labels: ["security", "auth", "mvp"],
    jiraUpdatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-1",
      storyId: "1",
      rubricId: "rubric-1",
      totalScore: 92,
      completeness: 24,
      clarity: 23,
      estimability: 18,
      traceability: 14,
      testability: 13,
      aiSuggestions: null,
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "2",
    workspaceId: "demo-ws",
    jiraId: "10002",
    jiraKey: "FORGE-102",
    title: "Add Paystack payment gateway integration",
    description: "Handle payments for subscription plans",
    acceptanceCriteria: null,
    storyPoints: 8,
    status: "To Do",
    assigneeId: null,
    epicKey: "BILLING",
    sprintId: "sprint-22",
    labels: ["payments", "integration"],
    jiraUpdatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-2",
      storyId: "2",
      rubricId: "rubric-1",
      totalScore: 38,
      completeness: 8,
      clarity: 7,
      estimability: 10,
      traceability: 8,
      testability: 5,
      aiSuggestions: [
        {
          type: "acceptance_criteria",
          current: "",
          improved: "Given a user is on the checkout page with a selected plan, when they enter valid card details and click 'Subscribe', then the payment is processed via Paystack within 5 seconds, a success confirmation appears, and their subscription is activated immediately.",
        },
        {
          type: "description",
          current: "Handle payments for subscription plans",
          improved: "As a customer, I want to pay for my subscription using Nigerian cards (Verve, Mastercard, Visa) or bank transfer via Paystack so that I can access premium features. The system should handle webhook callbacks for payment confirmation and retry failed charges.",
        },
      ],
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "3",
    workspaceId: "demo-ws",
    jiraId: "10003",
    jiraKey: "FORGE-103",
    title: "Create real-time dashboard with KPI widgets",
    description: "As a product manager, I want to see key metrics on my dashboard including DAU, sprint velocity, and story completion rate so I can track team progress at a glance.",
    acceptanceCriteria: "Dashboard displays: DAU with 7-day trend, current sprint velocity vs average, story completion percentage. Data refreshes every 30 seconds without page reload.",
    storyPoints: 5,
    status: "In Review",
    assigneeId: "user-2",
    epicKey: "ANALYTICS",
    sprintId: "sprint-22",
    labels: ["analytics", "dashboard", "realtime"],
    jiraUpdatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-3",
      storyId: "3",
      rubricId: "rubric-1",
      totalScore: 85,
      completeness: 22,
      clarity: 21,
      estimability: 17,
      traceability: 13,
      testability: 12,
      aiSuggestions: null,
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "4",
    workspaceId: "demo-ws",
    jiraId: "10004",
    jiraKey: "FORGE-104",
    title: "Build email notification system with templates",
    description: "Send emails for account events",
    acceptanceCriteria: "Emails are sent when things happen",
    storyPoints: 5,
    status: "To Do",
    assigneeId: null,
    epicKey: "NOTIFICATIONS",
    sprintId: "sprint-22",
    labels: ["notifications", "email"],
    jiraUpdatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-4",
      storyId: "4",
      rubricId: "rubric-1",
      totalScore: 45,
      completeness: 10,
      clarity: 9,
      estimability: 12,
      traceability: 8,
      testability: 6,
      aiSuggestions: [
        {
          type: "description",
          current: "Send emails for account events",
          improved: "As a user, I want to receive email notifications for critical account events (password changes, login from new device, payment confirmations, subscription expiry warnings) so I stay informed and can act on security concerns immediately.",
        },
        {
          type: "acceptance_criteria",
          current: "Emails are sent when things happen",
          improved: "Given any trigger event occurs, when the system processes it, then an email is sent within 60 seconds using the appropriate template, with correct personalization (user name, event details), proper formatting across email clients, and unsubscribe link included.",
        },
      ],
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "5",
    workspaceId: "demo-ws",
    jiraId: "10005",
    jiraKey: "FORGE-105",
    title: "Implement JIRA OAuth integration with token refresh",
    description: "As an admin, I want to connect my workspace to JIRA Cloud so that stories are automatically synced and scored. The connection should persist and automatically refresh expired tokens.",
    acceptanceCriteria: "Admin can initiate OAuth flow, grant permissions, and see connected status. Tokens refresh automatically before expiry. Sync runs every 15 minutes. Connection status is visible in settings.",
    storyPoints: 8,
    status: "Done",
    assigneeId: "user-1",
    epicKey: "INTEGRATIONS",
    sprintId: "sprint-22",
    labels: ["integration", "jira", "oauth"],
    jiraUpdatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-5",
      storyId: "5",
      rubricId: "rubric-1",
      totalScore: 94,
      completeness: 25,
      clarity: 24,
      estimability: 18,
      traceability: 14,
      testability: 13,
      aiSuggestions: null,
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "6",
    workspaceId: "demo-ws",
    jiraId: "10006",
    jiraKey: "FORGE-106",
    title: "Add dark mode toggle with system preference detection",
    description: "Users should be able to switch between light and dark themes",
    acceptanceCriteria: null,
    storyPoints: 2,
    status: "To Do",
    assigneeId: "user-3",
    epicKey: "UX",
    sprintId: "sprint-22",
    labels: ["ux", "theming"],
    jiraUpdatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-6",
      storyId: "6",
      rubricId: "rubric-1",
      totalScore: 52,
      completeness: 12,
      clarity: 13,
      estimability: 14,
      traceability: 7,
      testability: 6,
      aiSuggestions: [
        {
          type: "acceptance_criteria",
          current: "",
          improved: "Given I am logged in, when I click the theme toggle, then the UI switches between light/dark mode instantly. Given I visit for the first time, when my system is set to dark mode, then the app defaults to dark theme. Theme preference persists across sessions.",
        },
      ],
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "7",
    workspaceId: "demo-ws",
    jiraId: "10007",
    jiraKey: "FORGE-107",
    title: "Create API rate limiting middleware",
    description: "As a platform operator, I want to protect our API from abuse by implementing rate limiting per user and per IP address. The system should return appropriate 429 responses with retry-after headers.",
    acceptanceCriteria: "Rate limit of 100 requests/minute per authenticated user, 20 requests/minute for unauthenticated IPs. 429 response includes Retry-After header. Rate limit status available in response headers (X-RateLimit-Remaining).",
    storyPoints: 3,
    status: "In Progress",
    assigneeId: "user-2",
    epicKey: "SECURITY",
    sprintId: "sprint-22",
    labels: ["security", "api", "infrastructure"],
    jiraUpdatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-7",
      storyId: "7",
      rubricId: "rubric-1",
      totalScore: 88,
      completeness: 23,
      clarity: 22,
      estimability: 17,
      traceability: 13,
      testability: 13,
      aiSuggestions: null,
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "8",
    workspaceId: "demo-ws",
    jiraId: "10008",
    jiraKey: "FORGE-108",
    title: "Fix: Login button unresponsive on mobile Safari",
    description: "Bug: The login button doesn't respond to taps on iOS Safari. Works fine on Chrome mobile.",
    acceptanceCriteria: "Login button is tappable and functional on iOS Safari 15+. No visual glitches on tap.",
    storyPoints: 1,
    status: "Done",
    assigneeId: "user-1",
    epicKey: "BUGS",
    sprintId: "sprint-22",
    labels: ["bug", "mobile", "safari"],
    jiraUpdatedAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-8",
      storyId: "8",
      rubricId: "rubric-1",
      totalScore: 78,
      completeness: 20,
      clarity: 19,
      estimability: 16,
      traceability: 12,
      testability: 11,
      aiSuggestions: null,
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "9",
    workspaceId: "demo-ws",
    jiraId: "10009",
    jiraKey: "FORGE-109",
    title: "Implement story export to CSV and PDF",
    description: "Allow users to export stories",
    acceptanceCriteria: null,
    storyPoints: 3,
    status: "To Do",
    assigneeId: null,
    epicKey: "EXPORT",
    sprintId: "sprint-22",
    labels: ["export", "reporting"],
    jiraUpdatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-9",
      storyId: "9",
      rubricId: "rubric-1",
      totalScore: 35,
      completeness: 8,
      clarity: 7,
      estimability: 10,
      traceability: 6,
      testability: 4,
      aiSuggestions: [
        {
          type: "description",
          current: "Allow users to export stories",
          improved: "As a Scrum Master, I want to export sprint stories to CSV (for spreadsheet analysis) and PDF (for stakeholder reports) so I can share progress outside the platform. Export should include story details, scores, and AI suggestions.",
        },
        {
          type: "acceptance_criteria",
          current: "",
          improved: "Given I am viewing a sprint, when I click Export and select CSV, then a file downloads with columns: Key, Title, Status, Score, Points, Assignee. When I select PDF, then a formatted report generates with score breakdowns and charts.",
        },
      ],
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "10",
    workspaceId: "demo-ws",
    jiraId: "10010",
    jiraKey: "FORGE-110",
    title: "Add keyboard shortcuts for power users",
    description: "As a power user, I want to navigate the app using keyboard shortcuts so I can work faster. Common actions like opening command palette (Cmd+K), navigating sections (G+D for dashboard), and quick actions should be supported.",
    acceptanceCriteria: "Cmd+K opens command palette. G then H goes to Horizon. G then Q goes to Quality Gate. G then S goes to Signal. ? shows shortcut help overlay. Shortcuts work when no input is focused.",
    storyPoints: 3,
    status: "In Review",
    assigneeId: "user-3",
    epicKey: "UX",
    sprintId: "sprint-22",
    labels: ["ux", "accessibility", "power-users"],
    jiraUpdatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-10",
      storyId: "10",
      rubricId: "rubric-1",
      totalScore: 91,
      completeness: 24,
      clarity: 23,
      estimability: 17,
      traceability: 14,
      testability: 13,
      aiSuggestions: null,
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "11",
    workspaceId: "demo-ws",
    jiraId: "10011",
    jiraKey: "FORGE-111",
    title: "Implement team invitation flow",
    description: "Admin should invite team members",
    acceptanceCriteria: "Invites can be sent",
    storyPoints: 5,
    status: "To Do",
    assigneeId: "user-1",
    epicKey: "TEAM",
    sprintId: "sprint-22",
    labels: ["team", "onboarding"],
    jiraUpdatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-11",
      storyId: "11",
      rubricId: "rubric-1",
      totalScore: 42,
      completeness: 10,
      clarity: 8,
      estimability: 12,
      traceability: 7,
      testability: 5,
      aiSuggestions: [
        {
          type: "description",
          current: "Admin should invite team members",
          improved: "As a workspace admin, I want to invite team members via email so they can join my workspace and collaborate. Invited users should receive an email with a secure link, and upon clicking, be taken through a streamlined onboarding that pre-fills their workspace.",
        },
        {
          type: "acceptance_criteria",
          current: "Invites can be sent",
          improved: "Given I am an admin, when I enter an email and click Invite, then an invitation email is sent within 60 seconds. The invite link expires after 7 days. Pending invites are visible in Team settings with option to resend or revoke. Invited user clicking the link is added to the workspace after authentication.",
        },
      ],
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "12",
    workspaceId: "demo-ws",
    jiraId: "10012",
    jiraKey: "FORGE-112",
    title: "Create audit log for workspace activities",
    description: "As a workspace admin, I want to see an audit log of all significant actions taken in the workspace so I can monitor for unauthorized access and understand who made changes.",
    acceptanceCriteria: "Audit log captures: user logins, JIRA syncs, team member changes, settings updates, story score overrides. Each entry shows timestamp, user, action type, and details. Logs retained for 90 days. Filterable by date range and action type.",
    storyPoints: 5,
    status: "In Progress",
    assigneeId: "user-2",
    epicKey: "SECURITY",
    sprintId: "sprint-22",
    labels: ["security", "compliance", "admin"],
    jiraUpdatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-12",
      storyId: "12",
      rubricId: "rubric-1",
      totalScore: 90,
      completeness: 24,
      clarity: 22,
      estimability: 17,
      traceability: 14,
      testability: 13,
      aiSuggestions: null,
      scoredAt: new Date().toISOString(),
    },
  },
];

// Demo sprints
export const DEMO_SPRINTS = [
  { id: "sprint-22", name: "Sprint 22", startDate: "2026-04-14", endDate: "2026-04-27", state: "active" },
  { id: "sprint-21", name: "Sprint 21", startDate: "2026-03-31", endDate: "2026-04-13", state: "closed" },
  { id: "sprint-20", name: "Sprint 20", startDate: "2026-03-17", endDate: "2026-03-30", state: "closed" },
  { id: "sprint-19", name: "Sprint 19", startDate: "2026-03-03", endDate: "2026-03-16", state: "closed" },
];

// Demo signal updates
export const DEMO_UPDATES: Array<{
  id: string;
  title: string;
  sprintRef: string;
  audiences: AudienceType[];
  status: "draft" | "sent" | "archived";
  sentAt: string | null;
  createdAt: string;
  authorName: string;
  content: string;
}> = [
  {
    id: "update-1",
    title: "Sprint 22 Mid-Sprint Update",
    sprintRef: "Sprint 22",
    audiences: ["executive", "team"],
    status: "sent",
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "Adaora Okonkwo",
    content: `## Sprint 22 Progress Update

**Overall Status:** 🟢 On Track

### Highlights
- OAuth2 authentication implementation is 80% complete, ahead of schedule
- JIRA integration deployed and syncing successfully every 15 minutes
- 4 stories completed, 3 in progress, 5 remaining

### Key Metrics
- Sprint Velocity: 24 points (target: 28)
- Story Quality Score: 72 average (up from 65 last sprint)
- Blockers: 0 critical, 1 minor (waiting on design assets)

### Risks
- Payment integration dependency on Paystack API documentation review
- Mobile Safari bug discovered mid-sprint (1 point added)

### Next Steps
- Complete OAuth flow by Wednesday
- Begin payment integration testing
- Stakeholder demo scheduled for Friday`,
  },
  {
    id: "update-2",
    title: "Sprint 21 Retrospective Summary",
    sprintRef: "Sprint 21",
    audiences: ["executive", "team", "client"],
    status: "sent",
    sentAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "Chidi Eze",
    content: `## Sprint 21 Completed

**Final Status:** 🟢 Successful

### Delivered
- Dashboard analytics foundation
- Real-time KPI widgets
- Team management UI
- 28 story points completed (100% of commitment)

### Quality Summary
- Average story score improved from 58 to 72
- Zero production incidents
- 95% test coverage maintained

### Learnings
- Earlier involvement of design team improved velocity
- Story refinement sessions showing ROI in quality scores`,
  },
  {
    id: "update-3",
    title: "Q2 Board Update Draft",
    sprintRef: "Sprint 22",
    audiences: ["board"],
    status: "draft",
    sentAt: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "Adaora Okonkwo",
    content: `## Q2 2026 Engineering Update (DRAFT)

### Executive Summary
Platform development is progressing ahead of schedule with the team consistently delivering on sprint commitments. Key infrastructure including authentication and JIRA integration is now production-ready.

### Key Achievements
- 3 major features shipped
- Zero-downtime deployments established
- Story quality improved 24% via AI-powered analysis

### Upcoming Milestones
- Payment integration (April 30)
- Beta launch (May 15)
- Public launch (June 1)`,
  },
  {
    id: "update-4",
    title: "Sprint 20 Client Report",
    sprintRef: "Sprint 20",
    audiences: ["client"],
    status: "sent",
    sentAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "Chidi Eze",
    content: `## Sprint 20 Delivery Report

### Features Delivered
1. **Command Palette** - Quick navigation with Cmd+K
2. **Story Scoring Engine** - AI-powered quality analysis
3. **Sprint Health Dashboard** - Visual quality metrics

### Demo Access
Preview environment updated with latest features.

### Feedback Requested
Please review the scoring rubric configuration and provide feedback by EOW.`,
  },
];

// Demo Program Increments
export const DEMO_PIS = [
  {
    id: "pi-2026-2",
    name: "PI 2026.2",
    startDate: "2026-04-14",
    endDate: "2026-07-06",
    status: "active" as const,
    iterations: 5,
    teams: [
      { id: "team-1", name: "Platform", color: "#7C5CFF", capacity: 120 },
      { id: "team-2", name: "Integrations", color: "#00D68F", capacity: 100 },
      { id: "team-3", name: "Analytics", color: "#FF6B6B", capacity: 80 },
      { id: "team-4", name: "Mobile", color: "#FFB800", capacity: 90 },
    ],
    features: [
      { id: "f-1", title: "Payment Gateway Integration", team: "team-1", iteration: 1, status: "in_progress", points: 21 },
      { id: "f-2", title: "JIRA Real-time Sync", team: "team-2", iteration: 1, status: "done", points: 13 },
      { id: "f-3", title: "Advanced Analytics Dashboard", team: "team-3", iteration: 2, status: "planned", points: 18 },
      { id: "f-4", title: "Mobile App MVP", team: "team-4", iteration: 2, status: "planned", points: 34 },
      { id: "f-5", title: "Team Collaboration Features", team: "team-1", iteration: 3, status: "planned", points: 21 },
      { id: "f-6", title: "Slack Integration", team: "team-2", iteration: 2, status: "in_progress", points: 8 },
      { id: "f-7", title: "Custom Reporting", team: "team-3", iteration: 3, status: "planned", points: 13 },
      { id: "f-8", title: "Push Notifications", team: "team-4", iteration: 3, status: "planned", points: 8 },
      { id: "f-9", title: "SSO with SAML", team: "team-1", iteration: 4, status: "planned", points: 13 },
      { id: "f-10", title: "Webhook System", team: "team-2", iteration: 4, status: "planned", points: 13 },
    ],
    dependencies: [
      { id: "d-1", from: "f-1", to: "f-4", status: "at_risk", description: "Mobile payments depend on gateway" },
      { id: "d-2", from: "f-2", to: "f-3", status: "resolved", description: "Analytics needs JIRA data" },
      { id: "d-3", from: "f-6", to: "f-5", status: "open", description: "Collaboration uses Slack notifications" },
      { id: "d-4", from: "f-1", to: "f-9", status: "open", description: "SSO requires payment auth patterns" },
      { id: "d-5", from: "f-10", to: "f-7", status: "open", description: "Custom reports use webhook data" },
    ],
    risks: [
      { id: "r-1", title: "Paystack API rate limits", severity: "high", mitigation: "Implement caching layer", status: "mitigating" },
      { id: "r-2", title: "Mobile team capacity", severity: "medium", mitigation: "Cross-train platform engineer", status: "monitoring" },
      { id: "r-3", title: "Third-party Slack API changes", severity: "low", mitigation: "Abstract integration layer", status: "accepted" },
    ],
    objectives: [
      { id: "o-1", title: "Launch payment processing for Nigerian market", committed: true, confidence: 85 },
      { id: "o-2", title: "Achieve 95% JIRA sync reliability", committed: true, confidence: 95 },
      { id: "o-3", title: "Ship mobile app beta to 100 users", committed: true, confidence: 70 },
      { id: "o-4", title: "Reduce average page load to <2s", committed: false, confidence: 60 },
    ],
  },
  {
    id: "pi-2026-1",
    name: "PI 2026.1",
    startDate: "2026-01-13",
    endDate: "2026-04-06",
    status: "completed" as const,
    iterations: 5,
    teams: [
      { id: "team-1", name: "Platform", color: "#7C5CFF", capacity: 120 },
      { id: "team-2", name: "Integrations", color: "#00D68F", capacity: 100 },
      { id: "team-3", name: "Analytics", color: "#FF6B6B", capacity: 80 },
    ],
    features: [],
    dependencies: [],
    risks: [],
    objectives: [
      { id: "o-5", title: "Launch FORGE MVP", committed: true, confidence: 100 },
      { id: "o-6", title: "Onboard 10 beta customers", committed: true, confidence: 100 },
      { id: "o-7", title: "Establish CI/CD pipeline", committed: true, confidence: 100 },
    ],
  },
];

// Demo rubric
export const DEMO_RUBRIC = {
  id: "rubric-1",
  name: "Standard Quality Rubric",
  description: "Default rubric for assessing user story quality",
  dimensions: [
    {
      id: "completeness",
      name: "Completeness",
      maxScore: 25,
      description: "Does the story have all required elements? (title, description, acceptance criteria, story points)",
      criteria: [
        "Has clear title describing the user need",
        "Description follows user story format",
        "Acceptance criteria are present and specific",
        "Story points are estimated",
        "Labels and epic assignment present",
      ],
    },
    {
      id: "clarity",
      name: "Clarity",
      maxScore: 25,
      description: "Is the story unambiguous and easy to understand?",
      criteria: [
        "No vague terms (handle, manage, etc.)",
        "Technical requirements are specific",
        "Edge cases are addressed",
        "No conflicting requirements",
        "Readable by non-technical stakeholders",
      ],
    },
    {
      id: "estimability",
      name: "Estimability",
      maxScore: 20,
      description: "Can the team confidently estimate this story?",
      criteria: [
        "Scope is well-defined",
        "No major unknowns",
        "Dependencies are identified",
        "Story size is appropriate (not too large)",
      ],
    },
    {
      id: "traceability",
      name: "Traceability",
      maxScore: 15,
      description: "Can this story be traced to business value?",
      criteria: [
        "Linked to epic or initiative",
        "Business value is clear",
        "Stakeholder need identified",
      ],
    },
    {
      id: "testability",
      name: "Testability",
      maxScore: 15,
      description: "Can acceptance be objectively verified?",
      criteria: [
        "Acceptance criteria are testable",
        "Success metrics are measurable",
        "No subjective criteria (user should be happy)",
      ],
    },
  ],
};

// Demo team members
export const DEMO_TEAM = [
  { id: "user-1", name: "Adaora Okonkwo", email: "adaora@example.com", role: "Scrum Master", avatar: null },
  { id: "user-2", name: "Chidi Eze", email: "chidi@example.com", role: "Product Manager", avatar: null },
  { id: "user-3", name: "Ngozi Obi", email: "ngozi@example.com", role: "Engineer", avatar: null },
  { id: "user-4", name: "Emeka Nwosu", email: "emeka@example.com", role: "Engineer", avatar: null },
  { id: "user-5", name: "Funke Adeyemi", email: "funke@example.com", role: "Designer", avatar: null },
];

// Helper functions
export function calculateSprintHealth(stories: StoryWithScore[]) {
  if (stories.length === 0) return 0;
  const totalScore = stories.reduce((acc, s) => acc + (s.score?.totalScore ?? 0), 0);
  return Math.round(totalScore / stories.length);
}

export function getScoreDistribution(stories: StoryWithScore[]) {
  return {
    excellent: stories.filter((s) => (s.score?.totalScore ?? 0) >= 85).length,
    good: stories.filter((s) => {
      const score = s.score?.totalScore ?? 0;
      return score >= 70 && score < 85;
    }).length,
    fair: stories.filter((s) => {
      const score = s.score?.totalScore ?? 0;
      return score >= 50 && score < 70;
    }).length,
    poor: stories.filter((s) => (s.score?.totalScore ?? 0) < 50).length,
  };
}

export function getStoriesAtRisk(stories: StoryWithScore[]) {
  return stories.filter((s) => (s.score?.totalScore ?? 0) < 70);
}

// Sprint history for trends
export const DEMO_SPRINT_HISTORY = [
  { sprint: "Sprint 18", avgScore: 58, stories: 10 },
  { sprint: "Sprint 19", avgScore: 62, stories: 11 },
  { sprint: "Sprint 20", avgScore: 68, stories: 12 },
  { sprint: "Sprint 21", avgScore: 72, stories: 10 },
  { sprint: "Sprint 22", avgScore: 69, stories: 12 },
];
