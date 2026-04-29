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
  { id: "sprint-23", name: "Sprint 23", startDate: "2026-04-28", endDate: "2026-05-11", state: "active" },
  { id: "sprint-22", name: "Sprint 22", startDate: "2026-04-14", endDate: "2026-04-27", state: "closed" },
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
  { id: "user-1", name: "Adaora Okonkwo", email: "adaora@example.com", role: "Scrum Master", avatar: null, status: "online" },
  { id: "user-2", name: "Chidi Eze", email: "chidi@example.com", role: "Product Manager", avatar: null, status: "online" },
  { id: "user-3", name: "Ngozi Obi", email: "ngozi@example.com", role: "Senior Engineer", avatar: null, status: "away" },
  { id: "user-4", name: "Emeka Nwosu", email: "emeka@example.com", role: "Engineer", avatar: null, status: "online" },
  { id: "user-5", name: "Funke Adeyemi", email: "funke@example.com", role: "UX Designer", avatar: null, status: "offline" },
  { id: "user-6", name: "Tunde Bakare", email: "tunde@example.com", role: "DevOps Engineer", avatar: null, status: "online" },
  { id: "user-7", name: "Amara Okafor", email: "amara@example.com", role: "QA Engineer", avatar: null, status: "online" },
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
  { sprint: "S18", avgScore: 58, stories: 10 },
  { sprint: "S19", avgScore: 62, stories: 11 },
  { sprint: "S20", avgScore: 68, stories: 12 },
  { sprint: "S21", avgScore: 72, stories: 10 },
  { sprint: "S22", avgScore: 74, stories: 12 },
  { sprint: "S23", avgScore: 71, stories: 8 },
];

// Quality trend data for charts
export const DEMO_QUALITY_TREND = [
  { sprint: "S15", score: 45 },
  { sprint: "S16", score: 48 },
  { sprint: "S17", score: 55 },
  { sprint: "S18", score: 58 },
  { sprint: "S19", score: 62 },
  { sprint: "S20", score: 68 },
  { sprint: "S21", score: 72 },
  { sprint: "S22", score: 74 },
  { sprint: "S23", score: 71 },
];

// Velocity data
export const DEMO_VELOCITY = [
  { sprint: "S18", committed: 26, completed: 24 },
  { sprint: "S19", committed: 28, completed: 26 },
  { sprint: "S20", committed: 30, completed: 28 },
  { sprint: "S21", committed: 28, completed: 28 },
  { sprint: "S22", committed: 32, completed: 30 },
  { sprint: "S23", committed: 30, completed: 18 },
];

// Burndown data for current sprint
export const DEMO_BURNDOWN = [
  { day: "Day 1", ideal: 32, actual: 32, forecast: null },
  { day: "Day 2", ideal: 29, actual: 30, forecast: null },
  { day: "Day 3", ideal: 26, actual: 28, forecast: null },
  { day: "Day 4", ideal: 22, actual: 26, forecast: null },
  { day: "Day 5", ideal: 19, actual: 22, forecast: null },
  { day: "Day 6", ideal: 16, actual: 18, forecast: null },
  { day: "Day 7", ideal: 13, actual: 14, forecast: null },
  { day: "Day 8", ideal: 10, actual: 12, forecast: null },
  { day: "Day 9", ideal: 6, actual: null, forecast: 10 },
  { day: "Day 10", ideal: 0, actual: null, forecast: 6 },
];

// Team comparison data for radar chart
export const DEMO_TEAM_RADAR = [
  { metric: "Velocity", fullMark: 100, "Platform": 85, "Integrations": 78, "Analytics": 72 },
  { metric: "Quality", fullMark: 100, "Platform": 88, "Integrations": 82, "Analytics": 90 },
  { metric: "Consistency", fullMark: 100, "Platform": 92, "Integrations": 75, "Analytics": 85 },
  { metric: "Collaboration", fullMark: 100, "Platform": 78, "Integrations": 88, "Analytics": 80 },
  { metric: "Improvement", fullMark: 100, "Platform": 70, "Integrations": 85, "Analytics": 95 },
];

// Capacity data
export const DEMO_CAPACITY = [
  { name: "Adaora Okonkwo", allocated: 8, capacity: 10 },
  { name: "Chidi Eze", allocated: 10, capacity: 10 },
  { name: "Ngozi Obi", allocated: 12, capacity: 10 },
  { name: "Emeka Nwosu", allocated: 5, capacity: 10 },
];

// PI Confidence tracking
export const DEMO_PI_CONFIDENCE = {
  weeks: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
  objectives: [
    {
      name: "Payment Integration",
      color: "var(--color-iris)",
      data: [75, 78, 82, 80, 85, 85],
    },
    {
      name: "JIRA Reliability",
      color: "var(--color-jade)",
      data: [80, 85, 88, 92, 95, 95],
    },
    {
      name: "Mobile Beta",
      color: "var(--color-amber)",
      data: [70, 68, 65, 62, 68, 70],
    },
  ],
};

// Individual contributor data
export const DEMO_INDIVIDUAL_STATS = {
  userId: "user-1",
  name: "Adaora Okonkwo",
  role: "Scrum Master",
  team: "Platform",
  currentPI: {
    storiesCompleted: 12,
    pointsDelivered: 34,
    avgQuality: 87,
    prReviews: 18,
    rank: 3,
  },
  sprintHistory: [
    { sprint: "S19", points: 8, quality: 85, reviews: 4 },
    { sprint: "S20", points: 10, quality: 88, reviews: 5 },
    { sprint: "S21", points: 8, quality: 91, reviews: 6 },
    { sprint: "S22", points: 8, quality: 84, reviews: 3 },
  ],
  currentWork: {
    inProgress: [
      { key: "FORGE-101", title: "OAuth2 authentication", points: 5, daysIn: 2 },
    ],
    toDo: [
      { key: "FORGE-111", title: "Team invitation flow", points: 5 },
    ],
    doneThisSprint: [
      { key: "FORGE-105", title: "JIRA OAuth integration", points: 8, score: 94 },
      { key: "FORGE-108", title: "Safari login fix", points: 1, score: 78 },
    ],
  },
  aiInsights: [
    "Your acceptance criteria quality improved 15% this PI",
    "Consider mentoring new team member Ngozi",
    "3 of your stories became team templates",
  ],
  strengths: [
    "Consistently high quality (top 10% in org)",
    "Strong code reviewer - thorough feedback",
    "Reliable estimation - 95% accuracy",
  ],
  growthAreas: [
    "Acceptance criteria could be more detailed",
    "Consider taking on more complex stories",
  ],
};

// Kanban board data
export const DEMO_KANBAN_BOARD = {
  columns: [
    {
      id: "backlog",
      name: "Backlog",
      wipLimit: null,
      items: [
        { id: "k1", key: "OPS-101", title: "Update SSL certificates", priority: "high", daysInColumn: 5 },
        { id: "k2", key: "OPS-102", title: "Optimize database queries", priority: "medium", daysInColumn: 3 },
        { id: "k3", key: "OPS-103", title: "Review monitoring alerts", priority: "low", daysInColumn: 1 },
      ],
    },
    {
      id: "ready",
      name: "Ready",
      wipLimit: 5,
      items: [
        { id: "k4", key: "OPS-098", title: "Implement log rotation", priority: "medium", daysInColumn: 2 },
        { id: "k5", key: "OPS-099", title: "Update API documentation", priority: "low", daysInColumn: 1 },
      ],
    },
    {
      id: "in-progress",
      name: "In Progress",
      wipLimit: 3,
      items: [
        { id: "k6", key: "OPS-095", title: "Migrate to new CDN", priority: "high", daysInColumn: 3, assignee: "Chidi" },
        { id: "k7", key: "OPS-096", title: "Setup staging environment", priority: "medium", daysInColumn: 2, assignee: "Ngozi" },
        { id: "k8", key: "OPS-097", title: "Fix memory leak", priority: "high", daysInColumn: 1, assignee: "Emeka" },
      ],
    },
    {
      id: "review",
      name: "In Review",
      wipLimit: 3,
      items: [
        { id: "k9", key: "OPS-093", title: "Upgrade Node.js version", priority: "medium", daysInColumn: 1, assignee: "Adaora" },
      ],
    },
    {
      id: "done",
      name: "Done",
      wipLimit: null,
      items: [
        { id: "k10", key: "OPS-090", title: "Configure auto-scaling", priority: "high", daysInColumn: 0 },
        { id: "k11", key: "OPS-091", title: "Update firewall rules", priority: "medium", daysInColumn: 0 },
        { id: "k12", key: "OPS-092", title: "Deploy hotfix", priority: "high", daysInColumn: 0 },
      ],
    },
  ],
  metrics: {
    avgCycleTime: 3.2,
    avgLeadTime: 5.8,
    throughputThisWeek: 12,
    throughputAvg: 10,
    blockedPercentage: 8,
  },
};

// Cumulative flow data for Kanban
export const DEMO_CUMULATIVE_FLOW = [
  { date: "Apr 1", backlog: 15, ready: 5, inProgress: 3, review: 2, done: 10 },
  { date: "Apr 5", backlog: 14, ready: 4, inProgress: 4, review: 2, done: 14 },
  { date: "Apr 10", backlog: 12, ready: 5, inProgress: 3, review: 3, done: 18 },
  { date: "Apr 15", backlog: 10, ready: 4, inProgress: 3, review: 2, done: 24 },
  { date: "Apr 20", backlog: 8, ready: 3, inProgress: 3, review: 1, done: 30 },
];

// Demo decisions for Decision Intelligence module
export const DEMO_DECISIONS = [
  {
    id: "dec-1",
    title: "Migrate to Paystack from Stripe",
    description: "Switch payment provider from Stripe to Paystack to better serve Nigerian market with local payment methods (Verve, bank transfers, USSD).",
    decisionType: "technical_decision" as const,
    context: {
      currentProvider: "Stripe",
      newProvider: "Paystack",
      reason: "Better local payment support for Nigerian market",
      affectedSystems: ["Billing", "Subscriptions", "Webhooks"],
    },
    decision: {
      choice: "Migrate to Paystack",
      alternatives: ["Stay with Stripe", "Use both providers"],
      rationale: "Paystack has 95% coverage of Nigerian payment methods vs Stripe's 40%",
    },
    aiSummary: "Decision to migrate payment processing from Stripe to Paystack for improved Nigerian market coverage. Key risk: webhook migration complexity. Expected 3-week implementation timeline.",
    aiRiskAssessment: {
      riskLevel: "medium",
      risks: [
        "Webhook migration may cause payment notification delays",
        "Testing requires Nigerian bank accounts",
        "Historical subscription data needs careful migration",
      ],
      mitigations: [
        "Run parallel processing for 2 weeks",
        "Partner with Nigerian QA team for testing",
        "Create data migration scripts with rollback capability",
      ],
    },
    outcomeStatus: "successful" as const,
    outcome: {
      actualTimeline: "2.5 weeks",
      successMetrics: {
        paymentSuccessRate: "98.5%",
        localPaymentAdoption: "72%",
        customerSatisfaction: "+15%",
      },
    },
    createdBy: "user-2",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["payments", "infrastructure", "nigeria"],
    visibility: "workspace" as const,
  },
  {
    id: "dec-2",
    title: "Adopt SAFe for PI Planning",
    description: "Implement SAFe framework for quarterly planning increments to improve cross-team coordination.",
    decisionType: "process_change" as const,
    context: {
      currentProcess: "Independent Scrum teams",
      proposedProcess: "SAFe PI Planning",
      teamCount: 4,
      coordinationChallenges: ["Dependency conflicts", "Unclear priorities", "Capacity misalignment"],
    },
    decision: {
      choice: "Adopt SAFe Essential",
      alternatives: ["Continue with Scrum of Scrums", "LeSS framework", "Custom hybrid"],
      rationale: "SAFe provides structured PI planning which addresses our cross-team dependency issues",
    },
    aiSummary: "Adopting SAFe Essential framework to improve cross-team coordination. Focus on PI Planning ceremonies and dependency management. Training required for all team leads.",
    outcomeStatus: "partial" as const,
    outcome: {
      positives: ["Better dependency visibility", "Improved quarterly predictability"],
      challenges: ["Ceremony overhead initially high", "Some team resistance"],
      lessonsLearned: "Start with just PI Planning before full SAFe adoption",
    },
    createdBy: "user-1",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["process", "safe", "planning"],
    visibility: "workspace" as const,
  },
  {
    id: "dec-3",
    title: "Prioritize Mobile App over Desktop",
    description: "Focus Q2 resources on mobile app MVP instead of desktop enhancements based on user research.",
    decisionType: "priority_shift" as const,
    context: {
      userResearch: {
        mobileUsageIntent: "78%",
        desktopOnlyUsers: "12%",
        requestedMobileFeatures: ["Quick updates", "Push notifications", "Offline access"],
      },
      resourceConstraints: "Cannot do both in Q2",
    },
    decision: {
      choice: "Mobile-first for Q2",
      alternatives: ["Desktop-first", "Split 50/50"],
      rationale: "78% of target users prefer mobile access; aligns with Nigerian market where mobile-first is dominant",
    },
    aiSummary: "Strategic shift to mobile-first development based on 78% user preference. Desktop enhancements deferred to Q3. Risk: may lose some enterprise desktop users.",
    outcomeStatus: "pending" as const,
    createdBy: "user-2",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["strategy", "mobile", "prioritization"],
    visibility: "workspace" as const,
  },
  {
    id: "dec-4",
    title: "Accept Technical Debt in Auth Module",
    description: "Ship OAuth implementation with known code duplication to meet launch deadline; refactor in Sprint 24.",
    decisionType: "risk_acceptance" as const,
    context: {
      deadline: "2026-04-30",
      technicalDebt: "Duplicated token refresh logic in 3 places",
      refactorEstimate: "5 story points",
      currentSprint: "Sprint 22 (fully committed)",
    },
    decision: {
      choice: "Accept debt, ship now, refactor Sprint 24",
      alternatives: ["Delay launch", "Quick refactor now (risky)"],
      rationale: "Launch deadline is firm; debt is isolated and well-documented",
    },
    aiSummary: "Accepting isolated technical debt in OAuth module to meet launch deadline. Debt is well-documented with 5-point refactor scheduled for Sprint 24. Low risk of escalation.",
    aiRiskAssessment: {
      riskLevel: "low",
      risks: ["Maintenance burden if refactor is delayed", "Potential bugs from duplication"],
      mitigations: ["Created tech debt ticket with high priority", "Added extensive test coverage"],
    },
    outcomeStatus: "successful" as const,
    outcome: {
      launched: "On time",
      debtPaid: "Sprint 23 (ahead of schedule)",
      incidents: "Zero related incidents",
    },
    createdBy: "user-3",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["tech-debt", "auth", "tradeoff"],
    visibility: "team" as const,
  },
  {
    id: "dec-5",
    title: "Hire Contract DevOps Engineer",
    description: "Bring in a 6-month contract DevOps engineer to accelerate infrastructure automation and reduce deployment friction.",
    decisionType: "resource_allocation" as const,
    context: {
      currentState: "Manual deployments taking 2+ hours",
      teamBandwidth: "No DevOps expertise in-house",
      budget: "Available from Q2 contingency",
    },
    decision: {
      choice: "Hire 6-month contractor",
      alternatives: ["Train existing engineer", "Outsource to agency", "Continue manually"],
      rationale: "Fastest path to automation; knowledge transfer included in contract",
    },
    aiSummary: "Resource decision to hire contract DevOps engineer for infrastructure automation. 6-month engagement with knowledge transfer clause. Expected ROI: 80% reduction in deployment time.",
    outcomeStatus: "pending" as const,
    createdBy: "user-2",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["hiring", "devops", "infrastructure"],
    visibility: "workspace" as const,
  },
];

// Decision statistics
export const DEMO_DECISION_STATS = {
  total: 5,
  byType: {
    technical_decision: 1,
    process_change: 1,
    priority_shift: 1,
    risk_acceptance: 1,
    resource_allocation: 1,
  },
  byOutcome: {
    successful: 2,
    partial: 1,
    pending: 2,
    failed: 0,
  },
  successRate: 85,
  avgTimeToOutcome: "3.2 weeks",
};

// Demo notifications
export const DEMO_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "score_alert" as const,
    title: "Low Story Score Alert",
    message: "FORGE-102 scored 38/100. Consider improving acceptance criteria.",
    storyKey: "FORGE-102",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-2",
    type: "sync_complete" as const,
    title: "JIRA Sync Complete",
    message: "Synced 12 stories from Sprint 23. 3 new, 5 updated.",
    read: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    type: "dependency_risk" as const,
    title: "Dependency At Risk",
    message: "Mobile payments depend on Payment Gateway (at risk). Review in Horizon.",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-4",
    type: "team_invite" as const,
    title: "New Team Member",
    message: "Tunde Bakare has joined the workspace as DevOps Engineer.",
    read: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-5",
    type: "pi_milestone" as const,
    title: "PI Objective Achieved",
    message: "Achieved 95% JIRA sync reliability ahead of schedule!",
    read: true,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

// Demo quality gates
export const DEMO_QUALITY_GATES = [
  {
    id: "gate-1",
    name: "Story Ready for Sprint",
    description: "Minimum criteria for a story to be pulled into a sprint",
    isActive: true,
    rules: [
      { field: "score", operator: "gte", value: 60, message: "Story score must be at least 60" },
      { field: "acceptanceCriteria", operator: "exists", value: true, message: "Acceptance criteria required" },
      { field: "storyPoints", operator: "exists", value: true, message: "Story must be estimated" },
    ],
    appliesTo: ["sprint_planning"],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "gate-2",
    name: "High-Quality Story",
    description: "Criteria for stories that meet our quality bar",
    isActive: true,
    rules: [
      { field: "score", operator: "gte", value: 80, message: "Story score must be at least 80" },
      { field: "testability", operator: "gte", value: 12, message: "Testability score must be at least 12/15" },
    ],
    appliesTo: ["quality_report"],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// =============================================================================
// ENTERPRISE FEATURES - V2 Mock Data
// =============================================================================

// ML Story Slip Predictions
export const DEMO_STORY_SLIP_PREDICTIONS = [
  {
    storyId: "2",
    storyKey: "FORGE-102",
    slipProbability: 78,
    riskLevel: "high" as const,
    predictedBy: "ml" as const,
    confidence: 0.85,
    factors: [
      { factor: "Missing acceptance criteria", weight: 0.35, impact: "high" },
      { factor: "No assignee", weight: 0.25, impact: "medium" },
      { factor: "High story points (8)", weight: 0.20, impact: "medium" },
      { factor: "Late sprint addition", weight: 0.20, impact: "medium" },
    ],
    recommendation: "Add detailed acceptance criteria and assign to team member immediately",
    historicalAccuracy: 0.82,
  },
  {
    storyId: "4",
    storyKey: "FORGE-104",
    slipProbability: 65,
    riskLevel: "medium" as const,
    predictedBy: "ml" as const,
    confidence: 0.78,
    factors: [
      { factor: "Vague description", weight: 0.40, impact: "high" },
      { factor: "No assignee", weight: 0.30, impact: "medium" },
      { factor: "Template dependency", weight: 0.30, impact: "medium" },
    ],
    recommendation: "Clarify email triggers and template requirements before starting",
    historicalAccuracy: 0.82,
  },
  {
    storyId: "9",
    storyKey: "FORGE-109",
    slipProbability: 72,
    riskLevel: "high" as const,
    predictedBy: "ml" as const,
    confidence: 0.80,
    factors: [
      { factor: "Missing acceptance criteria", weight: 0.45, impact: "high" },
      { factor: "Unclear scope (CSV vs PDF)", weight: 0.35, impact: "high" },
      { factor: "No assignee", weight: 0.20, impact: "medium" },
    ],
    recommendation: "Define export format requirements and add acceptance criteria",
    historicalAccuracy: 0.82,
  },
  {
    storyId: "11",
    storyKey: "FORGE-111",
    slipProbability: 58,
    riskLevel: "medium" as const,
    predictedBy: "ml" as const,
    confidence: 0.75,
    factors: [
      { factor: "Incomplete acceptance criteria", weight: 0.50, impact: "high" },
      { factor: "Email integration complexity", weight: 0.30, impact: "medium" },
      { factor: "Has assignee", weight: -0.20, impact: "positive" },
    ],
    recommendation: "Expand acceptance criteria to cover invite expiry and edge cases",
    historicalAccuracy: 0.82,
  },
];

// ML Sprint Failure Prediction
export const DEMO_SPRINT_PREDICTION = {
  sprintId: "sprint-23",
  sprintName: "Sprint 23",
  failureProbability: 32,
  riskLevel: "medium" as const,
  predictedBy: "ml" as const,
  confidence: 0.78,
  factors: [
    { factor: "4 stories with low quality scores", weight: 0.30, contribution: 12 },
    { factor: "2 unassigned stories", weight: 0.25, contribution: 8 },
    { factor: "Historical team velocity matches commitment", weight: -0.20, contribution: -6 },
    { factor: "Mid-sprint (day 7 of 10)", weight: 0.15, contribution: 5 },
    { factor: "No blockers currently", weight: -0.15, contribution: -5 },
    { factor: "1 dependency at risk", weight: 0.20, contribution: 8 },
  ],
  historicalComparison: {
    similarSprints: 12,
    actualFailureRate: 25,
    avgPredictedProbability: 28,
  },
  recommendation: "Focus on improving FORGE-102 and FORGE-109 quality scores. Assign owners to unassigned stories.",
  projectedCompletion: {
    optimistic: 95,
    likely: 82,
    pessimistic: 68,
  },
  alerts: [
    { type: "warning", message: "4 stories below quality threshold" },
    { type: "info", message: "Velocity on track based on historical data" },
  ],
};

// Capacity Intelligence / Burnout Detection
export const DEMO_CAPACITY_INTELLIGENCE = {
  teamHealth: {
    overallScore: 72,
    trend: "stable" as const,
    alerts: 2,
  },
  members: [
    {
      userId: "user-1",
      name: "Adaora Okonkwo",
      role: "Scrum Master",
      allocation: 85,
      capacity: 100,
      burnoutRisk: "low" as const,
      burnoutScore: 22,
      workloadTrend: "stable" as const,
      factors: {
        hoursWorked: 42,
        avgHoursLast4Weeks: 40,
        storiesInProgress: 2,
        meetingLoad: 12,
        prReviewBacklog: 3,
      },
      recommendation: null,
    },
    {
      userId: "user-2",
      name: "Chidi Eze",
      role: "Product Manager",
      allocation: 110,
      capacity: 100,
      burnoutRisk: "medium" as const,
      burnoutScore: 58,
      workloadTrend: "increasing" as const,
      factors: {
        hoursWorked: 48,
        avgHoursLast4Weeks: 44,
        storiesInProgress: 1,
        meetingLoad: 18,
        prReviewBacklog: 0,
      },
      recommendation: "Consider delegating some stakeholder meetings or reducing context switching",
    },
    {
      userId: "user-3",
      name: "Ngozi Obi",
      role: "Senior Engineer",
      allocation: 125,
      capacity: 100,
      burnoutRisk: "high" as const,
      burnoutScore: 78,
      workloadTrend: "increasing" as const,
      factors: {
        hoursWorked: 52,
        avgHoursLast4Weeks: 48,
        storiesInProgress: 4,
        meetingLoad: 8,
        prReviewBacklog: 7,
      },
      recommendation: "Immediate attention needed. Redistribute 2 stories and clear PR review backlog",
    },
    {
      userId: "user-4",
      name: "Emeka Nwosu",
      role: "Engineer",
      allocation: 55,
      capacity: 100,
      burnoutRisk: "low" as const,
      burnoutScore: 15,
      workloadTrend: "decreasing" as const,
      factors: {
        hoursWorked: 35,
        avgHoursLast4Weeks: 38,
        storiesInProgress: 1,
        meetingLoad: 6,
        prReviewBacklog: 2,
      },
      recommendation: "Has capacity for additional work. Consider pairing with Ngozi on complex stories",
    },
  ],
  teamAlerts: [
    {
      id: "alert-1",
      type: "burnout_risk" as const,
      severity: "high" as const,
      title: "High burnout risk detected",
      description: "Ngozi Obi showing signs of overload with 125% allocation",
      affectedMembers: ["user-3"],
      suggestedAction: "Redistribute workload or defer non-critical items",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "alert-2",
      type: "unbalanced_workload" as const,
      severity: "medium" as const,
      title: "Workload imbalance detected",
      description: "Team workload ranges from 55% to 125% - consider rebalancing",
      affectedMembers: ["user-3", "user-4"],
      suggestedAction: "Move 1-2 stories from Ngozi to Emeka",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// Executive Analytics Mock Data
export const DEMO_EXECUTIVE_SUMMARY = {
  totalWorkspaces: 4,
  totalStories: 156,
  totalSprints: 23,
  averageQualityScore: 71,
  qualityTrend: "improving" as const,
  atRiskSprints: 1,
  completedPoints: 342,
  plannedPoints: 420,
  velocityTrend: "stable" as const,
  teamUtilization: 81,
  period: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  },
};

export const DEMO_WORKSPACE_COMPARISON = [
  {
    workspaceId: "ws-1",
    workspaceName: "Platform Team",
    metrics: {
      avgQualityScore: 78,
      qualityTrend: 8,
      sprintSuccessRate: 92,
      velocity: 28,
      velocityTrend: 3,
      storyCount: 45,
      activeSprintCount: 1,
      teamSize: 5,
    },
    ranking: { quality: 1, velocity: 2, overall: 1 },
  },
  {
    workspaceId: "ws-2",
    workspaceName: "Integrations Team",
    metrics: {
      avgQualityScore: 72,
      qualityTrend: 5,
      sprintSuccessRate: 88,
      velocity: 32,
      velocityTrend: 5,
      storyCount: 38,
      activeSprintCount: 1,
      teamSize: 4,
    },
    ranking: { quality: 2, velocity: 1, overall: 2 },
  },
  {
    workspaceId: "ws-3",
    workspaceName: "Analytics Team",
    metrics: {
      avgQualityScore: 68,
      qualityTrend: 12,
      sprintSuccessRate: 80,
      velocity: 22,
      velocityTrend: -2,
      storyCount: 42,
      activeSprintCount: 1,
      teamSize: 4,
    },
    ranking: { quality: 3, velocity: 3, overall: 3 },
  },
  {
    workspaceId: "ws-4",
    workspaceName: "Mobile Team",
    metrics: {
      avgQualityScore: 65,
      qualityTrend: 2,
      sprintSuccessRate: 75,
      velocity: 18,
      velocityTrend: -5,
      storyCount: 31,
      activeSprintCount: 1,
      teamSize: 3,
    },
    ranking: { quality: 4, velocity: 4, overall: 4 },
  },
];

export const DEMO_VELOCITY_FORECAST = {
  periods: [
    { period: "S19", actual: 26, predicted: 26, confidenceInterval: { low: 26, high: 26 } },
    { period: "S20", actual: 28, predicted: 27, confidenceInterval: { low: 27, high: 27 } },
    { period: "S21", actual: 28, predicted: 28, confidenceInterval: { low: 28, high: 28 } },
    { period: "S22", actual: 30, predicted: 29, confidenceInterval: { low: 29, high: 29 } },
    { period: "S23", actual: 24, predicted: 30, confidenceInterval: { low: 30, high: 30 } },
    { period: "S24", predicted: 28, confidenceInterval: { low: 24, high: 32 } },
    { period: "S25", predicted: 29, confidenceInterval: { low: 23, high: 35 } },
    { period: "S26", predicted: 30, confidenceInterval: { low: 22, high: 38 } },
  ],
  trend: "stable" as const,
  confidence: 0.78,
};

export const DEMO_RISK_AGGREGATION = {
  totalRisks: 8,
  bySeverity: { critical: 1, high: 2, medium: 3, low: 2 },
  byType: {
    story_slip: 4,
    sprint_failure: 1,
    dependency_blocked: 2,
    capacity_overload: 1,
    quality_degradation: 0,
  },
  topRisks: [
    {
      id: "risk-1",
      workspaceId: "ws-1",
      workspaceName: "Platform Team",
      title: "Ngozi showing burnout risk",
      severity: "critical" as const,
      probability: 78,
      impact: "Team velocity could drop 30%",
    },
    {
      id: "risk-2",
      workspaceId: "ws-4",
      workspaceName: "Mobile Team",
      title: "Mobile payments blocked by gateway",
      severity: "high" as const,
      probability: 65,
      impact: "Q2 mobile launch at risk",
    },
    {
      id: "risk-3",
      workspaceId: "ws-2",
      workspaceName: "Integrations Team",
      title: "Slack API rate limits",
      severity: "high" as const,
      probability: 55,
      impact: "Real-time sync may degrade",
    },
  ],
  riskTrend: "stable" as const,
};

// Multi-JIRA Instance Mock Data
export const DEMO_JIRA_INSTANCES = [
  {
    id: "jira-1",
    workspaceId: "demo-ws",
    name: "FORGE Production",
    cloudId: "abc123",
    siteUrl: "https://forge-team.atlassian.net",
    status: "connected" as const,
    lastSyncAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    syncStatus: "success" as const,
    storiesCount: 156,
    sprintsCount: 23,
    projectMappings: [
      { jiraProjectKey: "FORGE", localTeamId: "team-1", enabled: true },
      { jiraProjectKey: "OPS", localTeamId: "team-2", enabled: true },
    ],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "jira-2",
    workspaceId: "demo-ws",
    name: "Client Portal",
    cloudId: "def456",
    siteUrl: "https://client-portal.atlassian.net",
    status: "connected" as const,
    lastSyncAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    syncStatus: "success" as const,
    storiesCount: 89,
    sprintsCount: 12,
    projectMappings: [
      { jiraProjectKey: "CP", localTeamId: "team-3", enabled: true },
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Notification Integration Status
export const DEMO_NOTIFICATION_INTEGRATIONS = {
  slack: {
    connected: true,
    teamName: "FORGE Team",
    defaultChannel: "#forge-alerts",
    installedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    notificationsSent: 234,
  },
  teams: {
    connected: false,
    teamName: null,
    defaultChannel: null,
    installedAt: null,
    notificationsSent: 0,
  },
  email: {
    connected: true,
    provider: "Resend",
    fromAddress: "notifications@forge.dev",
    notificationsSent: 567,
  },
};

// Sprint Command Center Data
export const DEMO_SPRINT_COMMAND_CENTER = {
  sprintId: "sprint-23",
  sprintName: "Sprint 23",
  healthStatus: "atRisk" as const,
  metrics: {
    totalStories: 12,
    completedStories: 4,
    inProgressStories: 5,
    blockedStories: 0,
    totalPoints: 32,
    completedPoints: 14,
    averageScore: 71,
    atRiskCount: 4,
    daysRemaining: 3,
    velocity: 28,
    predictedCompletion: 78,
  },
  alerts: [
    {
      id: "alert-1",
      type: "risk" as const,
      title: "4 Stories Below Quality Threshold",
      description: "FORGE-102, FORGE-104, FORGE-109, FORGE-111 have scores below 60",
      storyKeys: ["FORGE-102", "FORGE-104", "FORGE-109", "FORGE-111"],
    },
    {
      id: "alert-2",
      type: "warning" as const,
      title: "Sprint Completion At Risk",
      description: "ML predicts 78% completion based on current velocity",
    },
    {
      id: "alert-3",
      type: "info" as const,
      title: "Team Capacity Imbalance",
      description: "Ngozi at 125% capacity, Emeka at 55%",
    },
  ],
};

// Active Risks for Risk Review Panel
export const DEMO_ACTIVE_RISKS = [
  {
    id: "risk-1",
    type: "capacity_overload" as const,
    severity: "critical" as const,
    probability: 78,
    title: "Senior engineer showing burnout indicators",
    description: "Ngozi has been working 52+ hours/week for 4 consecutive weeks with increasing PR backlog",
    impactedItems: [
      { type: "team" as const, id: "team-1", name: "Platform Team" },
    ],
    mitigations: [
      "Redistribute 2 stories to Emeka",
      "Cancel non-essential meetings this week",
      "Bring in temporary contractor support",
    ],
    predictedBy: "ml" as const,
    confidence: 0.85,
    detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
  },
  {
    id: "risk-2",
    type: "story_slip" as const,
    severity: "high" as const,
    probability: 78,
    title: "FORGE-102 likely to slip",
    description: "Payment integration story missing acceptance criteria and no assignee",
    impactedItems: [
      { type: "story" as const, id: "2", name: "FORGE-102" },
      { type: "sprint" as const, id: "sprint-23", name: "Sprint 23" },
    ],
    mitigations: [
      "Add detailed acceptance criteria immediately",
      "Assign senior engineer familiar with Paystack",
      "Consider splitting into smaller stories",
    ],
    predictedBy: "ml" as const,
    confidence: 0.85,
    detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: null,
  },
  {
    id: "risk-3",
    type: "dependency_blocked" as const,
    severity: "high" as const,
    probability: 65,
    title: "Mobile payments blocked by gateway integration",
    description: "Mobile App MVP feature depends on Payment Gateway which is at risk of slipping",
    impactedItems: [
      { type: "feature" as const, id: "f-4", name: "Mobile App MVP" },
      { type: "feature" as const, id: "f-1", name: "Payment Gateway" },
    ],
    mitigations: [
      "Prioritize payment gateway completion",
      "Consider mock payment flow for mobile testing",
      "Communicate risk to stakeholders",
    ],
    predictedBy: "rule" as const,
    confidence: 0.90,
    detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: null,
  },
  {
    id: "risk-4",
    type: "sprint_failure" as const,
    severity: "medium" as const,
    probability: 32,
    title: "Sprint 23 completion at risk",
    description: "Current trajectory suggests 78% completion vs 100% commitment",
    impactedItems: [
      { type: "sprint" as const, id: "sprint-23", name: "Sprint 23" },
    ],
    mitigations: [
      "Focus on completing in-progress stories before starting new ones",
      "Consider de-scoping lowest priority items",
      "Address quality issues blocking velocity",
    ],
    predictedBy: "ml" as const,
    confidence: 0.78,
    detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
  },
  {
    id: "risk-5",
    type: "story_slip" as const,
    severity: "medium" as const,
    probability: 58,
    title: "FORGE-111 needs clarification",
    description: "Team invitation flow has incomplete acceptance criteria",
    impactedItems: [
      { type: "story" as const, id: "11", name: "FORGE-111" },
    ],
    mitigations: [
      "Schedule quick refinement session",
      "Document invite expiry and edge cases",
    ],
    predictedBy: "ml" as const,
    confidence: 0.75,
    detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
  },
];

// Story Insights for V2 Cards
export const DEMO_STORY_INSIGHTS = DEMO_STORIES.slice(0, 6).map((story, index) => {
  const slipPrediction = DEMO_STORY_SLIP_PREDICTIONS.find(p => p.storyId === story.id);
  return {
    storyId: story.id,
    storyKey: story.jiraKey,
    summary: story.title,
    score: story.score?.totalScore ?? 0,
    riskLevel: slipPrediction?.riskLevel ?? (story.score?.totalScore ?? 0) >= 70 ? "low" : (story.score?.totalScore ?? 0) >= 50 ? "medium" : "high",
    slipProbability: slipPrediction?.slipProbability ?? (100 - (story.score?.totalScore ?? 50)),
    dimensions: [
      { name: "completeness", score: story.score?.completeness ?? 0, maxScore: 25 },
      { name: "clarity", score: story.score?.clarity ?? 0, maxScore: 25 },
      { name: "estimability", score: story.score?.estimability ?? 0, maxScore: 20 },
      { name: "traceability", score: story.score?.traceability ?? 0, maxScore: 15 },
      { name: "testability", score: story.score?.testability ?? 0, maxScore: 15 },
    ],
    suggestions: story.score?.aiSuggestions?.map(s => ({
      type: s.type === "acceptance_criteria" ? "critical" : "improvement",
      message: s.improved.substring(0, 100) + "...",
      action: `Improve ${s.type}`,
    })) ?? [],
    predictedBy: "gemini" as const,
    confidence: 0.85 + (Math.random() * 0.1),
    updatedAt: story.score?.scoredAt ?? new Date().toISOString(),
  };
});

// Helper to get sprint health status
export function getSprintHealthStatus(metrics: typeof DEMO_SPRINT_COMMAND_CENTER.metrics): "healthy" | "atRisk" | "critical" {
  if (metrics.atRiskCount >= 5 || metrics.predictedCompletion < 60) return "critical";
  if (metrics.atRiskCount >= 3 || metrics.predictedCompletion < 80) return "atRisk";
  return "healthy";
}
