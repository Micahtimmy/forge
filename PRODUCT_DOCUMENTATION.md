# FORGE Product Documentation

## Executive Summary

**FORGE** is an AI-powered program intelligence platform designed for agile practitioners - Scrum Masters, Product Managers, Program Managers, and SAFe Release Train Engineers (RTEs). It integrates with JIRA and leverages Google's Gemini AI to provide intelligent insights across four core systems: Quality Gate, Signal, Horizon, and Decision Intelligence.

**Target Market**: B2B SaaS for enterprise agile teams, with initial focus on the Nigerian market (Paystack billing integration).

**Design Philosophy**: Dense Clarity - maximum information density with zero cognitive noise. Dark-first UI inspired by Linear, Vercel dashboard, and Raycast.

**Core Systems**:
1. **Quality Gate** - AI-powered story quality scoring with configurable rubrics and quality gates
2. **Signal** - Stakeholder communication with AI-generated drafts and decision tracking
3. **Horizon** - PI planning with capacity modeling, dependencies, and AI risk analysis
4. **Decision Intelligence** - Cross-module decision tracking, predictions, and proactive notifications

---

## Architecture Overview

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (App Router), TypeScript | Server-side rendering, type safety |
| **Styling** | Tailwind CSS v4, CSS Variables | Design system tokens, theming |
| **Animation** | Framer Motion v11 | Micro-interactions, page transitions |
| **UI Primitives** | Radix UI | Accessible, unstyled components |
| **State** | Zustand v5 | Global client state |
| **Data Fetching** | TanStack Query v5 | Server state, caching, mutations |
| **Canvas** | React Flow v12 | PI planning canvas, dependency maps |
| **Charts** | Recharts v2 | Analytics visualizations |
| **Database** | Supabase (PostgreSQL) | Auth, Realtime, RLS |
| **AI** | Google Gemini API (gemini-2.0-flash) | Scoring, generation, analysis |
| **Background Jobs** | Inngest v4 | JIRA sync, batch scoring |
| **Email** | Resend | Transactional emails |
| **Billing** | Paystack | Nigerian payment processing |
| **Deployment** | Vercel | Edge functions, CDN |

### System Architecture Diagram

```
                                    +------------------+
                                    |    Vercel CDN    |
                                    +--------+---------+
                                             |
                    +------------------------+------------------------+
                    |                        |                        |
            +-------v-------+       +--------v--------+      +--------v--------+
            |   Next.js     |       |   API Routes    |      |   Middleware    |
            |   App Router  |       |   /api/*        |      |   Auth Guard    |
            +-------+-------+       +--------+--------+      +--------+--------+
                    |                        |                        |
                    |    +-------------------+-------------------+    |
                    |    |                   |                   |    |
            +-------v----v--+       +--------v--------+  +------v----v------+
            |   Supabase    |       |  Gemini AI API  |  |     Inngest      |
            |   PostgreSQL  |       |  (gemini-2.0)   |  |  Background Jobs |
            +-------+-------+       +-----------------+  +------------------+
                    |                        |
        +-----------+-----------+            |
        |           |           |            |
   +----v----+ +----v----+ +----v----+  +----v-----+
   | Stories | | Scores  | | PIs     |  | Decision |
   | Rubrics | | Signals | | Teams   |  | Intel.   |
   | Users   | | Decisions| | Deps   |  | System   |
   +---------+ +---------+ +---------+  +----------+
                    |
    +---------------+---------------+
    |               |               |
+---v----+    +-----v-----+   +-----v------+
| Quality|    | Notif.    |   | Predictions|
| Gates  |    | Engine    |   | & Scenarios|
+--------+    +-----------+   +------------+
```

### Decision Intelligence Architecture

```
                           +------------------------+
                           |   Decision Tracking    |
                           |   (Signal Module)      |
                           +----------+-------------+
                                      |
              +-----------------------+-----------------------+
              |                       |                       |
    +---------v---------+   +---------v---------+   +---------v---------+
    |  Quality Gates    |   |  Scenario Planning |   |    Predictions   |
    |  - Transitions    |   |  - What-If Analysis|   |  - Sprint Risk   |
    |  - Min Scores     |   |  - Baseline/Changes|   |  - Story Quality |
    |  - Violations     |   |  - Simulation      |   |  - Health Scores |
    +-------------------+   +-------------------+   +-------------------+
              |                       |                       |
              +-----------------------+-----------------------+
                                      |
                           +----------v-------------+
                           |   Notification Engine  |
                           |   - Events             |
                           |   - Rules              |
                           |   - Preferences        |
                           |   - Multi-channel      |
                           +------------------------+
                                      |
                    +----------------+----------------+
                    |                |                |
               +----v----+      +----v----+      +----v----+
               | In-App  |      |  Email  |      |  Slack  |
               +---------+      +---------+      +---------+
```

---

## Core Modules

### 1. Quality Gate (Story Scoring)

**Purpose**: AI-powered story quality assessment using configurable rubrics.

**Key Features**:
- **Sprint Board View**: Kanban-style view of stories with quality scores
- **Score Ring Component**: Visual indicator showing score (0-100) with color coding
- **AI Scoring Engine**: Analyzes stories against 5 dimensions:
  - Completeness (25 points)
  - Clarity (25 points)
  - Estimability (20 points)
  - Traceability (15 points)
  - Testability (15 points)
- **Rubric Configuration**: Customizable scoring weights and blocklist terms
- **AI Suggestions**: Automated improvement recommendations for acceptance criteria
- **Trend Analytics**: Historical score tracking with Recharts visualizations

**API Routes**:
- `POST /api/ai/score-story` - Score single or multiple stories
- Background: `score-sprint` Inngest function for batch processing

**Data Flow**:
```
JIRA Story -> Sync to DB -> AI Scoring -> Store Score -> Update UI
                              |
                              v
                      XML Output Parsing
                      (5 dimension scores + suggestions)
```

### 2. Signal (Stakeholder Updates)

**Purpose**: AI-generated stakeholder communications tailored to different audiences.

**Key Features**:
- **Update Composer**: Rich editor for creating stakeholder updates
- **Audience Selection**: Different tones for executives, technical teams, stakeholders
- **AI Draft Generation**: Streaming response for real-time draft creation
- **Context Ingestion**: Pulls sprint data, blockers, achievements automatically
- **Decision Logger**: Track decisions made and their rationale
- **Multi-channel Delivery**: Email and Slack integration (planned)

**API Routes**:
- `POST /api/ai/generate-update` - Stream-based update generation

**Audience Types**:
- Executive (high-level, business impact focus)
- Technical (detailed, implementation focus)
- Stakeholder (balanced, milestone focus)

### 3. Horizon (PI Planning)

**Purpose**: Visual PI planning with AI-powered risk analysis and objective generation.

**Key Features**:
- **PI Canvas**: React Flow-based visual planning board
  - Feature card nodes (draggable)
  - Iteration header nodes
  - Team row nodes
- **Dependency Map**: Directed graph showing cross-team dependencies
  - Edge types: resolved, at-risk, blocked
- **Capacity Modeling**: Team velocity tracking and load balancing
- **Risk Register**: AI-identified risks with ROAM categorization
- **PI Objectives**: AI-generated objectives from features

**API Routes**:
- `POST /api/ai/pi-objectives` - Generate team objectives (streaming supported)
- `POST /api/ai/analyze-risks` - Risk analysis with recommendations (streaming supported)

**Custom React Flow Nodes**:
- `FeatureCardNode` - Story/feature representation
- `IterationHeaderNode` - Sprint columns
- `TeamRowNode` - Team swimlanes

---

### 4. Decision Intelligence System

**Purpose**: Cross-module intelligence layer providing decision tracking, quality enforcement, predictive analytics, scenario planning, and proactive notifications.

#### 4.1 Decision Tracking

**Purpose**: Capture and learn from decisions across the product lifecycle.

**Key Features**:
- **Decision Types**: scope_change, priority_shift, resource_allocation, technical_decision, process_change, risk_acceptance
- **Rich Context**: Capture what was decided, why, and what alternatives were considered
- **AI Summaries**: Automatic summarization of complex decisions
- **Outcome Tracking**: Track whether decisions were successful, partial, failed, or unknown
- **Story Linking**: Connect decisions to affected stories (caused_by, affects, blocks, related)
- **Decision Templates**: Reusable templates for common decision types

**API Routes**:
- `GET/POST /api/decisions` - List and create decisions
- `GET/PATCH/DELETE /api/decisions/[id]` - Manage individual decisions
- `POST /api/decisions/[id]/outcome` - Record decision outcomes
- `GET /api/decisions/templates` - Get decision templates

**Data Model**:
```typescript
interface Decision {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  description: string | null;
  decision_type: "scope_change" | "priority_shift" | "resource_allocation" | "technical_decision" | "process_change" | "risk_acceptance" | "other";
  context: Record<string, unknown>;
  decision: Record<string, unknown>;
  ai_summary: string | null;
  ai_risk_assessment: Record<string, unknown> | null;
  outcome_status: "pending" | "successful" | "partial" | "failed" | "unknown";
  outcome: Record<string, unknown> | null;
  tags: string[];
  visibility: "private" | "team" | "workspace";
}
```

#### 4.2 Quality Gates

**Purpose**: Enforce story quality standards at workflow transitions.

**Key Features**:
- **Transition-Based Triggers**: Gates trigger when stories move between statuses (e.g., "To Do" → "In Progress")
- **Minimum Score Enforcement**: Block or warn when stories don't meet quality thresholds
- **Required Dimensions**: Ensure specific scoring dimensions pass (testability, clarity, etc.)
- **Action Types**: block (prevent transition), warn (allow with warning), comment (JIRA comment)
- **Violation Tracking**: Log and manage violations with resolution workflow
- **Notification Channels**: Alert relevant stakeholders when gates fail

**API Routes**:
- `GET/POST /api/quality-gates` - List and create gates
- `GET/PATCH/DELETE /api/quality-gates/[id]` - Manage individual gates
- `POST /api/quality-gates/check` - Check a story against all applicable gates
- `GET /api/quality-gates/violations` - List violations
- `PATCH /api/quality-gates/violations/[id]` - Resolve or waive violations

**Data Model**:
```typescript
interface QualityGate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  trigger_transition: string;        // e.g., "todo_to_inprogress"
  min_score: number;                  // 0-100
  action: "block" | "warn" | "comment";
  required_dimensions: string[] | null;  // ["testability", "clarity"]
  notification_channels: string[];
  is_active: boolean;
}

interface QualityViolation {
  id: string;
  gate_id: string;
  story_id: string;
  violation_type: "score_below_threshold" | "missing_dimension" | "blocked";
  score_at_time: number;
  required_score: number;
  resolution_status: "open" | "resolved" | "waived" | "expired";
  resolved_by: string | null;
  resolution_notes: string | null;
}
```

#### 4.3 Scenario Planning

**Purpose**: What-if analysis for sprint and PI planning decisions.

**Key Features**:
- **Baseline Capture**: Snapshot current state (capacity, stories, velocity)
- **Modification Types**: add_scope, remove_scope, change_capacity, shift_timeline, add_dependency, remove_dependency
- **Simulation Engine**: Calculate predicted outcomes based on changes
- **Results Analysis**: Completion probability, risk level, capacity utilization, overflow points
- **Scenario Comparison**: Compare multiple scenarios side-by-side
- **Scenario Lifecycle**: draft → simulated → applied → archived

**API Routes**:
- `GET/POST /api/scenarios` - List and create scenarios
- `GET/PATCH/DELETE /api/scenarios/[id]` - Manage scenarios
- `POST /api/scenarios/[id]/simulate` - Run simulation
- `POST /api/scenarios/[id]/apply` - Apply scenario to real planning
- `POST /api/scenarios/compare` - Compare multiple scenarios

**Data Model**:
```typescript
interface Scenario {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  baseline: ScenarioBaseState;
  changes: { modifications: ScenarioModification[] };
  results: ScenarioResults | null;
  status: "draft" | "simulated" | "applied" | "archived";
}

interface ScenarioResults {
  predicted_completion_date: string | null;
  completion_probability: number;
  risk_level: "low" | "medium" | "high" | "critical";
  capacity_utilization: number;
  overflow_points: number;
  key_risks: string[];
  recommendations: string[];
  comparison_to_baseline: {
    delta_days: number;
    delta_probability: number;
    delta_risk: string;
  };
}
```

#### 4.4 Predictive Analytics

**Purpose**: AI-powered predictions for sprints, stories, and program health.

**Key Features**:
- **Sprint Predictions**: Completion likelihood, risk factors, recommended actions
- **Story Predictions**: Quality trajectory, blocker probability, effort accuracy
- **Program Health Scores**: Aggregate health metrics with trend analysis
- **Team Member Profiles**: Individual metrics, strengths, growth areas, velocity/quality trends

**Data Model**:
```typescript
interface SprintPrediction {
  id: string;
  sprint_id: string;
  predicted_completion_pct: number;
  risk_factors: Record<string, unknown>;
  confidence_level: number;
  recommendations: string[];
  predicted_at: string;
}

interface ProgramHealthScore {
  id: string;
  workspace_id: string;
  pi_id: string | null;
  score_date: string;
  overall_score: number;
  dimensions: {
    quality: number;
    velocity: number;
    predictability: number;
    collaboration: number;
  };
  trend: "improving" | "stable" | "declining";
}

interface TeamMemberProfile {
  id: string;
  workspace_id: string;
  user_id: string;
  metrics: Record<string, unknown>;
  strengths: string[] | null;
  growth_areas: string[] | null;
  coaching_suggestions: Record<string, unknown> | null;
  velocity_trend: "improving" | "stable" | "declining" | null;
  quality_trend: "improving" | "stable" | "declining" | null;
  visibility: "self_only" | "manager_visible" | "team_visible" | "anonymous_team";
}
```

#### 4.5 Notification Engine

**Purpose**: Proactive, multi-channel notifications based on events and rules.

**Key Features**:
- **Event-Driven**: Notifications triggered by system events (quality drops, gate failures, sprint risks)
- **Rule-Based**: Configurable rules determine who gets notified and how
- **Multi-Channel**: In-app, email, and Slack delivery
- **User Preferences**: Per-user notification settings, digest options, quiet hours
- **Event Types**:
  - Quality: score_dropped, gate_failed, score_improved
  - Delivery: sprint_at_risk, story_blocked, sprint_completed
  - Decision: created, outcome_due
  - Health: score_changed, critical
  - JIRA: sync_completed, sync_failed
  - Team: member_invited, member_joined

**API Routes**:
- `GET/POST /api/notifications` - List and create notifications
- `PATCH /api/notifications/[id]/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all read
- `GET/PUT /api/notifications/preferences` - User preferences
- `GET/POST /api/notifications/rules` - Notification rules

**Data Model**:
```typescript
interface NotificationEvent {
  id: string;
  workspace_id: string;
  event_type: EventType;
  event_data: Record<string, unknown>;
  source_type: string;
  source_id: string | null;
  importance: "low" | "normal" | "high" | "critical";
}

interface Notification {
  id: string;
  user_id: string;
  event_id: string | null;
  channel: "email" | "slack" | "in_app";
  title: string;
  body: string;
  action_url: string | null;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
}

interface NotificationPreferences {
  email_enabled: boolean;
  slack_enabled: boolean;
  in_app_enabled: boolean;
  digest_frequency: "realtime" | "hourly" | "daily" | "weekly";
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  event_preferences: Record<EventType, boolean>;
}
```

---

## Database Schema

### Tables Overview

#### Core Tables
| Table | Purpose |
|-------|---------|
| `workspaces` | Multi-tenant organization container |
| `users` | User profiles with roles |
| `workspace_members` | User-workspace associations |
| `jira_connections` | OAuth tokens for JIRA integration |
| `jira_sync_operations` | JIRA sync history and status |
| `stories` | Synced JIRA stories |
| `rubrics` | Scoring configuration |
| `story_scores` | AI-generated scores per story |
| `subscriptions` | Paystack billing records |

#### Signal Module Tables
| Table | Purpose |
|-------|---------|
| `signal_updates` | Stakeholder updates |
| `signal_drafts` | AI-generated draft content |

#### Decision Intelligence Tables
| Table | Purpose |
|-------|---------|
| `decisions` | Decision records with context and outcomes |
| `decision_story_links` | Links decisions to affected stories |
| `decision_templates` | Reusable decision templates |
| `quality_gates` | Quality enforcement rules |
| `quality_violations` | Gate violation records |
| `scenarios` | What-if scenario definitions and results |
| `team_member_profiles` | Individual contributor metrics |
| `team_member_metrics_history` | Historical metrics per team member |
| `sprint_predictions` | AI sprint completion predictions |
| `story_predictions` | AI story-level predictions |
| `program_health_scores` | Aggregate program health metrics |

#### Notification System Tables
| Table | Purpose |
|-------|---------|
| `notification_events` | System events that trigger notifications |
| `notifications` | Individual notifications per user |
| `notification_rules` | Configurable notification routing rules |
| `notification_preferences` | Per-user notification settings |

#### Horizon Module Tables
| Table | Purpose |
|-------|---------|
| `program_increments` | PI metadata and canvas state |
| `pi_teams` | Teams within a PI |
| `pi_features` | Features assigned to PIs |
| `pi_dependencies` | Cross-team dependencies |
| `pi_risks` | Identified risks with ROAM status |
| `pi_objectives` | Team objectives per PI |

### Key Relationships

```
Workspace
    |-- has many --> Users (via workspace_members)
    |-- has one --> JiraConnection
    |-- has many --> Stories
    |-- has many --> Rubrics
    |-- has many --> SignalUpdates
    |-- has many --> Decisions
    |-- has many --> QualityGates
    |-- has many --> Scenarios
    |-- has many --> NotificationRules
    |-- has many --> TeamMemberProfiles
    |-- has many --> ProgramHealthScores
    |-- has many --> ProgramIncrements
    |-- has one --> Subscription

Story
    |-- has many --> StoryScores (via rubric)
    |-- has many --> QualityViolations
    |-- has many --> StoryPredictions
    |-- has many --> DecisionStoryLinks

Decision
    |-- has many --> DecisionStoryLinks --> Stories
    |-- belongs to --> User (created_by)
    |-- belongs to --> User (outcome_evaluated_by)

QualityGate
    |-- has many --> QualityViolations

ProgramIncrement
    |-- has many --> PITeams
    |-- has many --> PIFeatures
    |-- has many --> PIDependencies
    |-- has many --> PIRisks
    |-- has many --> PIObjectives
    |-- has many --> ProgramHealthScores

Sprint
    |-- has many --> Stories
    |-- has many --> SprintPredictions

User
    |-- has one --> TeamMemberProfile (per workspace)
    |-- has many --> Notifications
    |-- has one --> NotificationPreferences (per workspace)
```

### Database Migrations

| Migration | Purpose |
|-----------|---------|
| `001_initial_schema.sql` | Core tables: users, workspaces, stories, scores |
| `002_signal_horizon.sql` | Signal updates, PIs, teams, dependencies |
| `003_analytics_billing.sql` | Analytics, subscriptions, rubrics |
| `004_decision_intelligence.sql` | Decisions, quality gates, scenarios, notifications, predictions |

---

## Authentication & Authorization

### Auth Flow

1. **Sign Up**: Email/password or OAuth (Google, GitHub)
2. **Email Verification**: Supabase sends verification link
3. **Onboarding**: Workspace creation, role selection, team size
4. **Session Management**: Supabase SSR cookies with middleware refresh

### Route Protection

```typescript
// middleware.ts
- Public routes: /login, /signup, /forgot-password, /reset-password
- Protected routes: Everything else
- Onboarding check: Redirects if !onboarding_completed
```

### User Roles

- `scrum_master` - Sprint-level access
- `product_manager` - Roadmap and backlog access
- `program_manager` - Cross-team visibility
- `rte` - Full PI planning access
- `engineering_manager` - Team-level access

---

## JIRA Integration

### OAuth Flow

1. User initiates connection at `/settings/jira`
2. Redirect to Atlassian OAuth consent
3. Callback at `/api/jira/callback` exchanges code for tokens
4. Tokens stored encrypted in `jira_connections` table

### Sync Process

```
Inngest: sync-jira (runs every 15 minutes per workspace)
    |
    v
1. Refresh token if expired
2. Fetch projects and boards
3. Fetch stories (paginated)
4. Upsert to stories table
5. Update sync status
```

### Webhook Support

- Endpoint: `/api/jira/webhook`
- Events: Issue created, updated, deleted
- Real-time sync for immediate score updates

---

## AI Integration Patterns

### Prompt Engineering

All prompts follow a consistent structure:
```typescript
// lib/ai/prompts/[feature].ts
export const PROMPT_VERSION = "1.0.0";  // Version tracking

export const SYSTEM_PROMPT = `
  Role definition
  Context explanation
  Output format (XML)
  Guidelines and rules
`;

export const USER_PROMPT = (context) => `
  Dynamic context injection
  Specific task instructions
`;
```

### XML Output Parsing

AI responses use XML tags for structured extraction:
```xml
<analysis>
  <total_score>72</total_score>
  <dimensions>
    <completeness score="20" max="25">
      <reasoning>...</reasoning>
    </completeness>
  </dimensions>
  <suggestions>
    <suggestion type="acceptance_criteria">
      <current>...</current>
      <improved>...</improved>
    </suggestion>
  </suggestions>
</analysis>
```

### Streaming Support

Real-time responses for better UX:
```typescript
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of result.stream) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`));
    }
  },
});
```

---

## Design System

### Color Tokens

| Token | Purpose | Hex |
|-------|---------|-----|
| `canvas` | Page background | `#0d0d0f` |
| `surface-01` | Card background | `#141416` |
| `surface-02` | Hover state | `#1a1a1d` |
| `iris` | Primary accent | `#5b5bd6` |
| `jade` | Success/Good | `#29a383` |
| `amber` | Warning/Needs work | `#f5a623` |
| `coral` | Error/Poor | `#e54d2e` |
| `sky` | Info/Neutral | `#7ce2fe` |

### Score Tier Colors

| Score Range | Color | Label |
|-------------|-------|-------|
| 80-100 | Jade | Excellent |
| 60-79 | Iris | Good |
| 40-59 | Amber | Needs Work |
| 0-39 | Coral | Poor |

### Typography

- **Display**: Inter (headings)
- **Body**: Inter (content)
- **Mono**: JetBrains Mono (scores, code)

---

## Billing (Paystack)

### Plans

| Plan | Monthly (NGN) | Features |
|------|--------------|----------|
| Free | 0 | 1 workspace, 5 members, 100 stories/month |
| Pro | 15,000 | Unlimited workspaces, 15 members, Signal |
| Team | 45,000 | 50 members, Horizon, Risk Analysis |
| Enterprise | Custom | Unlimited, SSO, dedicated support |

### Webhook Events

- `charge.success` - Payment successful, activate subscription
- `subscription.create` - Subscription created
- `subscription.disable` - Subscription cancelled
- `invoice.payment_failed` - Mark as past_due

---

## File Structure

```
forge/
├── app/
│   ├── (app)/                    # Authenticated app routes
│   │   ├── layout.tsx            # Sidebar + topbar shell
│   │   ├── page.tsx              # Dashboard
│   │   ├── quality-gate/         # Scoring module
│   │   ├── signal/               # Updates module
│   │   ├── horizon/              # PI planning module
│   │   └── settings/             # Configuration
│   ├── (auth)/                   # Auth routes
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── onboarding/               # New user flow
│   ├── api/                      # API routes
│   │   ├── ai/                   # AI endpoints
│   │   ├── billing/              # Paystack
│   │   ├── jira/                 # JIRA integration
│   │   └── webhooks/             # External webhooks
│   └── auth/callback/            # OAuth callback
├── components/
│   ├── ui/                       # Design system primitives
│   ├── layout/                   # App shell components
│   ├── quality-gate/             # Module-specific
│   ├── signal/
│   └── horizon/
├── lib/
│   ├── ai/                       # AI client and prompts
│   ├── auth/                     # Auth actions
│   ├── billing/                  # Paystack client
│   ├── db/                       # Database queries
│   ├── inngest/                  # Background jobs
│   ├── jira/                     # JIRA client
│   └── supabase/                 # Supabase client
├── hooks/                        # Custom React hooks
├── stores/                       # Zustand stores
├── types/                        # TypeScript types
└── styles/                       # Global CSS
```

---

## Unique Selling Points (USPs)

### 1. AI-First Approach
Unlike traditional agile tools that rely on manual assessment, FORGE uses AI to automatically score stories, generate updates, and identify risks - saving hours of manual work per sprint.

### 2. SAFe-Native Design
Built specifically for scaled agile with first-class support for PI planning, cross-team dependencies, and ROAM risk management.

### 3. Dense Clarity UI
Information-rich interface that shows everything needed without overwhelm. Inspired by best-in-class developer tools.

### 4. Nigerian Market Focus
Native Paystack integration with NGN pricing, addressing the underserved African enterprise software market.

### 5. Real-Time Collaboration
Supabase Realtime enables instant updates across team members during PI planning sessions.

### 6. JIRA Integration
Two-way sync with JIRA keeps stories current without manual effort. Webhook support for real-time updates.

---

## Deployment Checklist

### Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GEMINI_API_KEY=

# JIRA
JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=
JIRA_REDIRECT_URI=

# Background Jobs
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Billing
PAYSTACK_SECRET_KEY=
PAYSTACK_PRO_MONTHLY_PLAN=
PAYSTACK_PRO_YEARLY_PLAN=
PAYSTACK_TEAM_MONTHLY_PLAN=
PAYSTACK_TEAM_YEARLY_PLAN=

# App
NEXT_PUBLIC_APP_URL=
```

### Database Setup

1. Run migrations in `supabase/migrations/`
2. Enable RLS on all tables
3. Configure OAuth providers in Supabase dashboard
4. Set up database triggers for `updated_at`

---

## Typical User Journeys

### Journey 1: Scrum Master - Sprint Quality Review with Quality Gates

**Persona**: Sarah, Scrum Master for a 7-person development team
**Goal**: Ensure sprint stories meet quality standards before planning, with automated enforcement

```
1. LOGIN
   Sarah opens FORGE and logs in with Google SSO
   → Redirected to dashboard
   → Notification badge shows 2 quality violations from overnight

2. REVIEW NOTIFICATIONS
   Click notification bell
   → "FORGE-245 blocked: Score 42 below gate minimum 60"
   → "FORGE-251 warning: Missing testability criteria"

3. CONNECT JIRA (first time only)
   Settings → JIRA → Connect JIRA Account
   → OAuth flow completes
   → Auto-sync begins (pulls stories from JIRA)

4. CONFIGURE QUALITY GATE (first time)
   Quality Gate → Settings → Create Gate
   → Name: "Ready for Development"
   → Trigger: "Backlog → In Progress"
   → Minimum Score: 60
   → Required Dimensions: Testability, Clarity
   → Action: Block (prevent transition in JIRA)

5. REVIEW SPRINT HEALTH
   Navigate to Quality Gate
   → Sprint health snapshot shows 72% average score
   → 3 stories flagged as "Poor" (<50 score)
   → 2 stories blocked by quality gate (red indicators)

6. SCORE THE SPRINT
   Click "Score Sprint" button
   → AI analyzes all stories in parallel
   → Scores update in real-time with suggestions
   → Quality gate violations auto-created for failing stories

7. FIX LOW-SCORING STORIES
   Click on FORGE-102 (score: 38)
   → View AI suggestions for acceptance criteria
   → Copy improved version
   → Open JIRA link, paste improvements
   → Trigger re-sync

8. RESOLVE VIOLATIONS
   After JIRA update syncs back
   → Re-score story: now 78
   → Quality violation auto-resolved
   → Story can now transition in JIRA
   → Sprint health improves to 81%

9. LOG QUALITY DECISION
   Click "Log Decision" button
   → Decision Type: Process Change
   → Title: "Increased testability requirements for payment stories"
   → Context: "3 payment bugs in production traced to untestable stories"
   → Link affected stories
   → AI generates summary
```

**Time spent**: ~15 minutes (vs. 2+ hours manual review)
**Added value**: Quality gates prevent low-quality stories from entering sprint

---

### Journey 2: Product Manager - Stakeholder Update with Decision Tracking

**Persona**: David, Product Manager responsible for weekly exec updates
**Goal**: Generate tailored updates for different stakeholder groups and track decisions made

```
1. ACCESS SIGNAL MODULE
   Navigate to Signal → New Update

2. SELECT SPRINT CONTEXT
   Choose "Sprint 22" from dropdown
   → System pulls completed stories, blockers, metrics
   → Also pulls decisions made this sprint

3. GENERATE AI DRAFTS
   Select audiences: [Leadership] [Technical Team] [External Stakeholders]
   Click "Generate Drafts"
   → AI creates 3 versions with appropriate tone/detail
   → Drafts automatically include relevant decisions from this sprint

4. REVIEW AND EDIT
   Preview leadership version:
   - High-level summary
   - Business impact metrics
   - Key decisions made and their rationale
   - Decisions pending (awaiting stakeholder input)
   Edit minor wording tweaks inline

5. LOG IMPORTANT DECISIONS
   During update, realize scope change needs documenting
   → Click "Add Decision" inline
   → Decision Type: Scope Change
   → Title: "Deferred payment retry logic to Q3"
   → Context: { reason: "Dependency on fraud detection API not ready" }
   → Link to affected stories (FORGE-301, FORGE-302)
   → AI generates risk assessment

6. SEND UPDATES
   Click "Send" → Select channels [Email]
   Add recipient emails
   → Updates sent via Resend
   → Status changes to "Sent"
   → Decisions automatically linked to this update

7. TRACK DECISION OUTCOMES
   Signal → Decisions tab
   → View all decisions with outcome status
   → Filter: "Pending outcome" - see decisions needing follow-up
   → Update outcome: "Successful" / "Failed" / "Partial"
   → AI analyzes decision patterns over time

8. CONFIGURE DECISION NOTIFICATIONS
   Settings → Notifications
   → Enable "Decision outcome due" reminders
   → Set reminder: 30 days after decision
   → Select channels: Email + In-app
```

**Time spent**: ~10 minutes (vs. 1+ hour writing 3 separate emails)
**Added value**: Decisions are captured, linked, and tracked to outcomes

---

### Journey 3: Release Train Engineer - PI Planning with Scenario Analysis

**Persona**: Michael, RTE coordinating 4 teams in a SAFe program
**Goal**: Plan the next Program Increment with AI assistance and what-if analysis

```
1. CREATE NEW PI
   Navigate to Horizon → Create PI
   Enter: "PI 2026.2" | Apr 15 - Jun 24 | 5 iterations

2. CONFIGURE TEAMS
   Horizon → PI 2026.2 → Capacity tab
   Add teams: Platform (40 pts), Mobile (35 pts), Data (30 pts), QA (25 pts)
   Set capacity per iteration

3. IMPORT FEATURES FROM JIRA
   Features auto-populate from JIRA epics
   → Drag features onto PI canvas
   → Assign to teams and iterations

4. MAP DEPENDENCIES
   Click "Add Dependency" mode
   → Draw lines between dependent features
   → System tracks cross-team dependencies
   → See dependency status: Open → At Risk → Resolved

5. RUN SCENARIO ANALYSIS (NEW)
   Horizon → PI 2026.2 → Scenarios
   
   Scenario A: "Baseline Plan"
   → Capture current state as baseline
   → Run simulation
   → Results: 78% completion probability, Medium risk
   
   Scenario B: "Add Payment Feature"
   → Clone baseline
   → Add modification: +45 story points (Payment v2)
   → Run simulation
   → Results: 52% probability, High risk, 3-week overflow
   
   Scenario C: "Reduced Capacity"
   → Clone baseline
   → Add modification: Platform team -20% (vacation coverage)
   → Run simulation
   → Results: 65% probability, Medium-High risk

6. COMPARE SCENARIOS
   Click "Compare Scenarios"
   → Side-by-side view: completion dates, risk levels, utilization
   → AI recommendations: "Scenario B requires scope reduction or timeline extension"
   → Select Scenario A as the plan, archive others

7. GENERATE PI OBJECTIVES
   Click "Generate Objectives" (AI)
   → AI analyzes team capacity + features
   → Suggests SMART objectives per team
   → Identifies stretch vs. committed objectives

8. ANALYZE RISKS
   Click "Analyze Risks" (AI)
   → AI identifies: capacity risks, dependency chains, external factors
   → ROAM categorization suggested
   → Mitigation strategies proposed

9. LOG PLANNING DECISIONS
   Signal → Log Decision
   → Decision Type: Resource Allocation
   → Title: "Deferred Payment v2 to PI 2026.3"
   → Context: Scenario analysis showed 52% completion probability
   → Link to scenario analysis results
   → Notify stakeholders via Signal update

10. CONFIGURE HEALTH MONITORING
    Settings → Notifications
    → Enable "Program health score changed"
    → Threshold: Alert when health drops below 70
    → Channels: Slack + Email

11. CONDUCT PI PLANNING SESSION
    Share screen with teams
    → Real-time updates as teams adjust
    → Scenario comparison visible to all
    → Risk register visible to all
    → Final commitment captured
    → Program health baseline established
```

**Time spent**: ~2 hours prep (vs. 8+ hours traditional planning prep)
**Added value**: Data-driven decisions with scenario comparison and outcome tracking

---

### Journey 4: Engineering Manager - Team Performance with AI Insights

**Persona**: Lisa, Engineering Manager of the Platform team
**Goal**: Track individual team member performance, identify coaching opportunities, and monitor team health

```
1. ACCESS MY DASHBOARD
   Navigate to My Dashboard (role-aware view)
   → See team-specific metrics
   → Team health score: 74 (stable trend)
   → Notification: "2 team members showing quality improvement"

2. REVIEW TEAM MEMBER PROFILES (NEW)
   Analytics → Team → Member Profiles
   View per-developer profile:
   - Velocity trend: Improving / Stable / Declining
   - Quality trend: Improving / Stable / Declining
   - Strengths: ["API Design", "Testing", "Documentation"]
   - Growth areas: ["Acceptance Criteria", "Estimation"]
   - AI coaching suggestions based on patterns

3. REVIEW INDIVIDUAL METRICS
   Click on Developer Alex's profile:
   - Stories completed this sprint: 5
   - Average story points delivered: 6.2
   - Quality scores on authored stories: avg 72
   - Quality trend: Improving (+8 over 3 sprints)
   - Velocity trend: Stable

4. IDENTIFY COACHING OPPORTUNITIES
   Filter by "Quality trend: Declining"
   → Developer Charlie: Quality dropped from 78 to 62
   → AI Suggestion: "Focus on testability - 4 of 6 recent stories lacked test criteria"
   → Historical metrics show pattern started 2 sprints ago
   → Schedule 1:1 with specific, data-backed feedback

5. MONITOR WORKLOAD
   Analytics → Team → Capacity
   View capacity utilization:
   → Developer A at 95% (overloaded) - AI flag: "Burnout risk"
   → Developer B at 60% (available for support)
   → AI suggestion: "Rebalance 2 stories from A to B"

6. CONFIGURE VISIBILITY SETTINGS
   Settings → Team Profiles → Visibility
   → Individual metrics: Manager Visible (default)
   → Aggregate metrics: Team Visible
   → Option for anonymous team comparison

7. TRACK IMPROVEMENT OVER TIME
   View team member metrics history
   → 6-month trend charts per developer
   → Correlate with decisions (e.g., "Testing workshop" decision linked)
   → Program health contribution visible

8. SET UP PROACTIVE ALERTS
   Settings → Notifications
   → Enable "Team member quality declining" (threshold: 15% drop)
   → Enable "Capacity utilization critical" (threshold: >90%)
   → Digest: Daily summary at 9am
```

**Added value**: Data-driven coaching with AI suggestions and trend analysis

---

### Journey 5: New User - Onboarding Flow with Notification Setup

**Persona**: New team member joining existing workspace
**Goal**: Get set up and productive quickly with personalized notifications

```
1. RECEIVE INVITATION
   Email: "You've been invited to join Acme Engineering on FORGE"
   → Click invitation link
   → Workspace admin notified via in-app notification

2. CREATE ACCOUNT
   Sign up with Google/GitHub or email
   → Account created

3. ACCEPT INVITE
   Auto-redirected to workspace
   → Role assigned (Member by default)
   → Team member profile auto-created

4. EXPLORE DEMO
   First-time tooltip: "Try the demo to learn FORGE"
   → Tour through demo pages with realistic mock data
   → See example notifications and quality gates
   → No JIRA connection needed

5. CONFIGURE NOTIFICATION PREFERENCES
   Settings → Notifications
   → Choose digest frequency: Realtime / Hourly / Daily / Weekly
   → Enable/disable by event type:
     - Quality score drops: On
     - Sprint at risk: On
     - New decisions: On
     - JIRA sync: Off
   → Set quiet hours: 10pm - 8am
   → Connect Slack (optional)

6. ACCESS REAL DATA
   Return to main app
   → See real stories from JIRA (already synced by team)
   → View sprint health, contribute to Signal updates
   → Quality gates already configured by team

7. VIEW YOUR PROFILE
   Analytics → My Profile
   → See your velocity and quality baselines being established
   → Strengths and growth areas will populate after ~3 sprints
   → Visibility setting: Manager Visible (default)

8. PERSONALIZE DASHBOARD
   Settings → Profile
   → Configure default dashboard view
   → Pin frequently used modules
```

**Added value**: Personalized notification setup from day one

---

### Journey 6: Admin - Team Management with Quality Gates and Notifications

**Persona**: Tech Lead setting up workspace for new project
**Goal**: Configure workspace, invite team members, and set up quality enforcement

```
1. COMPLETE ONBOARDING
   First login → Onboarding wizard
   → Set workspace name: "Project Phoenix"
   → Select team size: 6-20 members
   → Choose role: Scrum Master

2. CONNECT JIRA
   Settings → JIRA
   → Complete OAuth flow
   → Select project to sync
   → Configure webhook for real-time updates

3. INVITE TEAM
   Settings → Team → Invite Member
   → Enter email addresses
   → Assign roles (Admin, Member, Viewer)
   → Invitations sent via Resend
   → Admin notified when invites accepted

4. CONFIGURE RUBRIC
   Quality Gate → Rubrics
   → Customize scoring weights
   → Completeness: 25 (default)
   → Clarity: 25 (default)
   → Adjust testability: 20 (team priority)
   → Add blocklist terms: ["TBD", "TODO", "???"]

5. SET UP QUALITY GATES (NEW)
   Quality Gate → Settings → Create Gate
   
   Gate 1: "Ready for Development"
   → Trigger: "Backlog → In Progress"
   → Minimum Score: 60
   → Required: Testability ≥ 10, Clarity ≥ 15
   → Action: Block
   
   Gate 2: "Ready for Review"
   → Trigger: "In Progress → Review"
   → Minimum Score: 70
   → Action: Warn (allow with warning)
   
   Gate 3: "Definition of Done"
   → Trigger: "Review → Done"
   → Minimum Score: 80
   → Action: Comment (JIRA comment added)

6. CONFIGURE NOTIFICATION RULES (NEW)
   Settings → Notifications → Rules
   
   Rule 1: "Quality Gate Failures"
   → Event: quality.gate_failed
   → Condition: gate.action = "block"
   → Recipients: Story assignee + Scrum Master
   → Channels: Email + In-app
   
   Rule 2: "Sprint Risk Alert"
   → Event: delivery.sprint_at_risk
   → Condition: risk_level in ["high", "critical"]
   → Recipients: All team leads
   → Channels: Slack + Email
   
   Rule 3: "Daily Digest"
   → Events: [all quality events]
   → Recipients: Scrum Master
   → Channel: Email digest at 9am

7. SET UP BILLING
   Settings → Billing
   → Select Pro plan (15,000 NGN/month)
   → Complete Paystack checkout
   → Unlock Signal module + Quality Gates

8. CREATE DECISION TEMPLATES (NEW)
   Signal → Decisions → Templates
   → "Scope Change" template with required fields
   → "Technical Decision" template with architecture checklist
   → "Risk Acceptance" template with mitigation fields

9. VERIFY SETUP
   Dashboard shows:
   - JIRA connected (green badge)
   - 4 team members active
   - Pro plan active
   - 3 quality gates active
   - Notification rules configured
   - Decision templates ready
```

**Added value**: Complete workspace setup with quality enforcement and proactive notifications

---

### Journey 7: Program Manager - Cross-Team Health Monitoring

**Persona**: James, Program Manager overseeing 3 development teams
**Goal**: Monitor program health, track decisions across teams, and identify systemic issues

```
1. ACCESS PROGRAM DASHBOARD
   Login → Dashboard (role: Program Manager)
   → Program health score: 71 (declining trend ↓)
   → 2 critical notifications:
     - "Platform team sprint at risk (65% completion probability)"
     - "3 cross-team dependencies blocked"

2. ANALYZE PROGRAM HEALTH
   Analytics → Program Health
   → View health dimensions:
     - Quality: 78 (stable)
     - Velocity: 72 (declining)
     - Predictability: 65 (declining)
     - Collaboration: 69 (stable)
   → Drill down: Predictability dropped due to scope changes
   → AI insight: "4 scope changes in last 2 sprints correlate with prediction drop"

3. REVIEW CROSS-TEAM DECISIONS
   Signal → Decisions → Filter: Last 30 days
   → 12 decisions logged across all teams
   → 4 scope changes (unusual spike)
   → Decision outcomes:
     - 8 pending evaluation
     - 2 successful
     - 2 partial success
   → Pattern identified: All scope changes related to Payment epic

4. INVESTIGATE ROOT CAUSE
   Click scope change decision: "Added fraud detection requirement"
   → Context: Compliance mandate from legal
   → Linked stories: 8 stories across 2 teams
   → AI risk assessment: "High cascading impact - affects 3 downstream features"
   → Outcome: Partial (completed late, quality compromised)

5. CREATE SCENARIO FOR REMEDIATION
   Horizon → Scenarios → Create
   → Name: "Payment Epic Recovery Plan"
   → Baseline: Current PI state
   → Modifications:
     - Reduce scope: Remove "Payment v2 Phase 2" (-30 points)
     - Add capacity: Contract developer (+20 points)
   → Simulate
   → Results: 82% completion probability (up from 65%)

6. LOG PROGRAM DECISION
   Signal → Log Decision
   → Type: Resource Allocation
   → Title: "Contract developer for Payment epic recovery"
   → Context: Scenario analysis shows 17% probability improvement
   → Link scenario as supporting evidence
   → Visibility: Workspace (all teams can see)
   → Generate AI summary

7. CONFIGURE HEALTH MONITORING
   Settings → Notifications → Create Rule
   → Event: health.score_changed
   → Condition: overall_score < 70 OR trend = "declining"
   → Recipients: Program Manager role
   → Channels: Email + Slack
   → Immediate (not digest)

8. SET UP DECISION OUTCOME TRACKING
   Signal → Decisions → James's pending decisions
   → Set evaluation reminders:
     - "Contract developer approval" - Evaluate in 2 weeks
     - "Scope reduction" - Evaluate end of sprint
   → Notifications scheduled

9. GENERATE PROGRAM UPDATE
   Signal → New Update
   → Audience: Leadership
   → Include: Health metrics, key decisions, risk summary
   → AI generates executive summary with trend analysis
   → Include scenario comparison chart
   → Send via email
```

**Time spent**: ~30 minutes (vs. half-day of manual data gathering)
**Added value**: Data-driven program management with decision traceability and predictive insights

---

### Journey 8: External Stakeholder - Read-Only Dashboard

**Persona**: Emily, VP of Product from a partner organization
**Goal**: Review project progress without editing capabilities

```
1. RECEIVE VIEWER INVITATION
   Email: "You've been invited to view Project Phoenix on FORGE"
   → Click invitation link
   → Role: Viewer (read-only)

2. ACCESS SHARED DASHBOARD
   Login → Read-only dashboard
   → Sprint health visible
   → Quality trends visible
   → Cannot edit stories or scores

3. REVIEW SIGNAL UPDATES
   Signal → Updates
   → View stakeholder updates sent to external audience
   → See decision summaries (public visibility only)
   → Download PDF exports

4. CONFIGURE DIGEST NOTIFICATIONS
   Settings → Notifications
   → Enable weekly digest
   → Receive summary of sprint progress
   → No access to internal team discussions

5. VIEW PI PROGRESS
   Horizon → PI 2026.2 (read-only)
   → See feature progress
   → View dependency status
   → Cannot modify canvas
   → Risk register visible (public items only)
```

**Added value**: Transparent progress sharing without security concerns

---

## Known Limitations (Current Release)

1. **Team Settings Page**: Uses mock data for member list. Team invite/accept flows work, but listing existing members requires GET /api/team/members endpoint.

2. **Slack Integration**: Signal updates and notifications currently support email only. Slack integration planned for Phase 2.

3. **Mobile**: Responsive design works but not optimized for mobile-first workflows.

4. **Offline**: No offline support - requires active internet connection.

5. **Multi-JIRA Sites**: Currently supports one JIRA site per workspace.

6. **Prediction Accuracy**: Sprint and story predictions improve over time as more historical data accumulates. New workspaces may see lower confidence levels.

7. **Notification Delivery**: Email notifications depend on Resend service availability. Slack channel not yet implemented.

8. **Scenario Simulation**: Current simulation uses simplified velocity-based calculations. Advanced ML-based predictions planned for Phase 3.

---

## Future Roadmap

### Phase 1 (Complete)
- Core modules implemented (Quality Gate, Signal, Horizon)
- JIRA integration with OAuth and webhooks
- Paystack billing
- Decision Intelligence System:
  - Decision tracking with AI summaries
  - Quality gates with violation management
  - Scenario planning with simulation
  - Team member profiles and metrics
  - Notification engine (email + in-app)

### Phase 2 (In Progress)
- Slack integration for Signal and notifications
- Advanced team member metrics with ML insights
- Decision outcome prediction
- Quality gate JIRA automation
- Mobile-responsive improvements
- Team member list API completion

### Phase 3 (Planned)
- SSO support (SAML, OIDC)
- Custom integrations API
- Advanced ML-based predictions
- Real-time collaboration enhancements
- On-premise deployment option
- Multi-JIRA site support

### Phase 4 (Future)
- Natural language queries ("Show me decisions that affected sprint velocity")
- Automated decision recommendations
- Cross-workspace analytics for enterprise
- Custom notification channel integrations (Teams, Discord)
- API for external BI tools

---

## API Reference Summary

### Decision Intelligence APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/decisions` | GET, POST | List and create decisions |
| `/api/decisions/[id]` | GET, PATCH, DELETE | Manage individual decisions |
| `/api/decisions/[id]/outcome` | POST | Record decision outcomes |
| `/api/decisions/templates` | GET | Get decision templates |
| `/api/quality-gates` | GET, POST | List and create quality gates |
| `/api/quality-gates/[id]` | GET, PATCH, DELETE | Manage individual gates |
| `/api/quality-gates/check` | POST | Check story against gates |
| `/api/quality-gates/violations` | GET | List violations |
| `/api/quality-gates/violations/[id]` | PATCH | Resolve/waive violations |
| `/api/scenarios` | GET, POST | List and create scenarios |
| `/api/scenarios/[id]` | GET, PATCH, DELETE | Manage scenarios |
| `/api/scenarios/[id]/simulate` | POST | Run simulation |
| `/api/scenarios/compare` | POST | Compare multiple scenarios |
| `/api/notifications` | GET, POST | List and create notifications |
| `/api/notifications/[id]/read` | PATCH | Mark as read |
| `/api/notifications/preferences` | GET, PUT | User preferences |
| `/api/notifications/rules` | GET, POST | Notification rules |
| `/api/team/profiles` | GET | List team member profiles |
| `/api/team/profiles/[userId]` | GET, PATCH | Manage member profiles |
| `/api/analytics/program-health` | GET | Program health scores |
| `/api/analytics/predictions/sprint` | GET | Sprint predictions |

### Query Functions Reference

| File | Functions |
|------|-----------|
| `lib/db/queries/decisions.ts` | createDecision, getDecisionById, listDecisions, updateDecision, deleteDecision, updateDecisionOutcome, linkDecisionToStories, getDecisionStats |
| `lib/db/queries/quality-gates.ts` | createQualityGate, listQualityGates, updateQualityGate, deleteQualityGate, checkQualityGate, createViolation, listViolations, resolveViolation, getViolationStats |
| `lib/db/queries/scenarios.ts` | createScenario, listScenarios, getScenarioById, runScenario, updateScenario, deleteScenario, cloneScenario, compareScenarios |
| `lib/db/queries/notifications.ts` | emitNotificationEvent, getUserNotifications, markNotificationRead, markAllNotificationsRead, getUserNotificationPreferences, updateNotificationPreferences, createNotificationRule, listNotificationRules, createNotification |
| `lib/db/queries/team-profiles.ts` | getTeamProfiles, getTeamProfile, upsertTeamProfile, updateTeamMemberMetrics, recordTeamMemberMetrics, getTeamMemberMetricsHistory, getTeamAnalytics, findTeamMembersBySkill, getTeamCapacity, recalculateProfileMetrics |

---

## Contributing

See `CLAUDE.md` for detailed coding standards and contribution guidelines.

---

## Changelog

### Version 2.0.0 (April 2026)
- **Decision Intelligence System**: Complete decision tracking with AI summaries and outcome evaluation
- **Quality Gates**: Workflow-based quality enforcement with violation management
- **Scenario Planning**: What-if analysis with simulation engine
- **Team Member Profiles**: Individual metrics tracking with trend analysis
- **Notification Engine**: Event-driven notifications with rules and preferences
- **Predictive Analytics**: Sprint and story predictions with confidence levels
- **Program Health Scores**: Aggregate health metrics with dimensional breakdown
- **15+ new database tables** for Decision Intelligence features
- **Enhanced user journeys** for all personas incorporating new features

### Version 1.0.0 (March 2026)
- Initial release with Quality Gate, Signal, and Horizon modules
- JIRA OAuth integration
- Paystack billing
- Basic analytics dashboard

---

*Documentation Version: 2.0.0*
*Last Updated: April 2026*
