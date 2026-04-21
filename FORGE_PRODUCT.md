# FORGE — Product Documentation

> AI-Powered Program Intelligence Platform for Agile Teams

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Target Users](#target-users)
4. [Core Modules](#core-modules)
5. [Important Features](#important-features)
6. [Architecture Overview](#architecture-overview)
7. [Technology Stack](#technology-stack)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [AI Capabilities](#ai-capabilities)
11. [Design System](#design-system)
12. [Security & Multi-tenancy](#security--multi-tenancy)
13. [Integrations](#integrations)
14. [Deployment](#deployment)
15. [Roadmap](#roadmap)

---

## Executive Summary

**FORGE** is a B2B SaaS platform that brings AI-powered intelligence to agile program management. It serves Scrum Masters, Product Managers, Program Managers, and SAFe Release Train Engineers (RTEs) by providing:

- **Automated story quality scoring** before sprint planning
- **AI-generated stakeholder updates** tailored to different audiences
- **Visual PI planning** with dependency tracking and risk analysis

FORGE integrates with JIRA to pull real-time project data and uses Google Gemini AI to surface insights that would otherwise require hours of manual analysis.

### Key Value Propositions

| Pain Point | FORGE Solution |
|------------|----------------|
| Poorly written stories cause sprint disruption | AI scores stories and suggests improvements before planning |
| Stakeholder updates take hours to write | One-click generation of audience-tailored updates |
| Cross-team dependencies cause PI failures | Visual dependency map with AI risk detection |
| Decisions get lost in Slack/email | Structured decision log linked to sprints |

---

## Product Vision

**Mission:** Reduce cognitive overhead for agile leaders so they can focus on high-value decisions instead of administrative tasks.

**Design Philosophy — Dense Clarity:**
- Maximum information, zero cognitive noise
- Dark-first, rich, opinionated UI
- NOT generic SaaS. NOT white with purple gradients
- Inspired by: Linear, Vercel dashboard, Raycast

**Target Market:**
- Mid-market to Enterprise organizations (50-5000 employees)
- Teams practicing Scrum, Kanban, or SAFe
- Geographic focus: Africa (Paystack billing), expanding globally

---

## Target Users

### Primary Personas

| Role | Key Needs | FORGE Value |
|------|-----------|-------------|
| **Scrum Master (SM)** | Story quality, sprint health, team velocity | Quality Gate scoring, burndown charts |
| **Product Manager (PM)** | Backlog refinement, stakeholder communication | Story Writer AI, Signal updates |
| **Program Manager (PGM)** | Cross-team coordination, risk management | Horizon PI planning, dependency map |
| **RTE (Release Train Engineer)** | ART-level planning, confidence tracking | PI canvas, risk register, capacity model |
| **Engineering Lead** | Technical debt visibility, team capacity | Analytics dashboard, quality trends |
| **Executive** | High-level progress, investment outcomes | Executive Signal updates, PI confidence |

---

## Core Modules

### 1. Quality Gate — Story Scoring Engine

**Purpose:** Ensure user stories are ready for development before sprint planning.

**How it works:**
1. Stories are synced from JIRA automatically
2. AI analyzes each story against 5 dimensions
3. Scores (0-100) surface at-risk stories
4. Suggestions help PMs improve stories quickly

**Scoring Dimensions:**

| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| **Completeness** | 25% | Description, acceptance criteria, epic links |
| **Clarity** | 25% | Specific language, no vague verbs |
| **Estimability** | 20% | Clear scope for team estimation |
| **Traceability** | 15% | Epic connection, labels, roadmap fit |
| **Testability** | 15% | Verifiable acceptance criteria |

**Key Pages:**
- `/quality-gate` — Sprint board with score badges
- `/quality-gate/story/[id]` — Story detail with AI suggestions
- `/quality-gate/rubrics` — Configure scoring weights
- `/quality-gate/trends` — Quality trends over time
- `/quality-gate/writer` — AI Story Writer

### 2. Signal — Stakeholder Communication

**Purpose:** Generate tailored updates for different stakeholders from the same sprint data.

**Audience Types:**

| Audience | Tone | Content Focus |
|----------|------|---------------|
| **Executive** | Concise, outcome-focused | Risks, decisions needed, investment ROI |
| **Team** | Technical, detailed | Blockers, dependencies, velocity |
| **Client** | Professional, reassuring | Deliverables, timelines, visible progress |
| **Board** | Strategic, high-level | KPIs, market position, growth |

**Key Pages:**
- `/signal` — Update history and drafts
- `/signal/new` — AI update composer
- `/signal/[id]` — Update detail view
- `/signal/decisions` — Decision log

**Decision Log:**
Track important decisions made during sprints:
- Scope changes
- Technical trade-offs
- Timeline adjustments
- Resource allocation

### 3. Horizon — PI Planning Canvas

**Purpose:** Visual planning and tracking for Program Increments (8-12 week cycles).

**Features:**
- Drag-and-drop feature planning
- Team capacity modeling
- Cross-team dependency mapping
- AI-powered risk detection
- PI objective confidence tracking

**Key Pages:**
- `/horizon` — PI list view
- `/horizon/[piId]` — Interactive planning canvas
- `/horizon/[piId]/capacity` — Team capacity model
- `/horizon/[piId]/dependencies` — Visual dependency map
- `/horizon/[piId]/risks` — Risk register

---

## Important Features

This section highlights the most valuable features across the entire platform.

### AI-Powered Features

#### 1. Story Quality Scoring
**Location:** Quality Gate module  
**Value:** Prevents sprint disruption from poorly defined stories

The AI evaluates each story against industry best practices and your custom rubric. It provides:
- Overall score (0-100)
- Dimension breakdowns with reasoning
- Specific improvement suggestions
- Before/after acceptance criteria rewrites

```
Example:
Score: 58/100
Issue: "User should be happy with the experience" (not testable)
Suggestion: "Given user on checkout, when they tap Pay, then confirmation 
             appears within 3 seconds and order ID is visible"
```

#### 2. Story Writer AI
**Location:** `/quality-gate/writer`  
**Value:** Transform brief ideas into well-structured stories in seconds

Input a brief description like "user can pay with Verve card" and get:
- Complete user story with context
- 4-5 testable acceptance criteria (Given/When/Then)
- Suggested story points
- Relevant labels
- Implementation notes

#### 3. Stakeholder Update Generation
**Location:** Signal module  
**Value:** Hours of writing reduced to minutes

The AI ingests:
- Sprint progress data
- Completed/in-progress stories
- Logged decisions
- Risk indicators

Then generates tailored updates for each audience with appropriate tone and detail level.

#### 4. PI Risk Analysis
**Location:** Horizon module  
**Value:** Proactive risk identification before issues become blockers

AI analyzes:
- Cross-team dependencies
- Capacity utilization
- Historical delivery patterns
- Scope complexity

And surfaces risks categorized by probability and impact.

#### 5. PI Objectives Generation
**Location:** Horizon module  
**Value:** Well-formed objectives aligned with business outcomes

Based on planned features and team capacity, AI suggests:
- Committed objectives (high confidence)
- Uncommitted/stretch objectives
- Business value ratings
- Success metrics

### Visual Analytics

#### 6. Score Ring Component
**Location:** Throughout Quality Gate  
**Value:** At-a-glance story health

Animated SVG rings that:
- Show score with tier-based colors (jade/iris/amber/coral)
- Animate on mount for engagement
- Support multiple sizes (sm/md/lg/xl)
- Work in lists with staggered animation

#### 7. Sprint Health Snapshot
**Location:** Quality Gate dashboard  
**Value:** Immediate sprint risk visibility

Single card showing:
- Overall sprint health percentage
- Story count by score tier
- Average score trend
- At-risk story count

#### 8. Velocity & Burndown Charts
**Location:** Analytics module  
**Value:** Team performance visibility

Interactive charts showing:
- Sprint-over-sprint velocity trends
- Ideal vs actual burndown
- Completion rate patterns

#### 9. PI Canvas (React Flow)
**Location:** Horizon module  
**Value:** Visual planning at scale

Interactive canvas with:
- Custom feature card nodes
- Iteration/team grid layout
- Drag-and-drop planning
- Real-time dependency edges
- Canvas state persistence

### Productivity Features

#### 10. Command Palette (Cmd+K)
**Location:** Global  
**Value:** Keyboard-first navigation

Quick access to:
- Navigate to any page
- Search stories
- Create new items
- Toggle settings

#### 11. Contextual Glossary System
**Location:** Throughout app  
**Value:** Self-explanatory UI without documentation

Every technical term has:
- Short definition (hover tooltip)
- Full explanation (expandable panel)
- Real-world example
- Optional learn-more link

Implemented via `<InfoPanel termKey="qualityScore" />` components.

#### 12. Decision Logger
**Location:** `/signal/decisions`  
**Value:** Institutional memory

Track decisions with:
- Title and reasoning
- Affected JIRA tickets
- Tags (scope-change, technical, timeline, etc.)
- Linkage to stakeholder updates

#### 13. My Work Dashboard
**Location:** `/my-dashboard`  
**Value:** Personal productivity view

Shows individual:
- Assigned stories
- Personal velocity
- Active items in progress
- Recent activity

#### 14. Kanban Board
**Location:** `/kanban`  
**Value:** Flow-based work visualization

Visual board with:
- To Do / In Progress / Done columns
- WIP limits
- Story cards with quality scores
- Drag-and-drop (future)

### Integration Features

#### 15. JIRA OAuth Integration
**Location:** Settings  
**Value:** Seamless data sync

- OAuth 2.0 3-legged flow
- Real-time webhook updates
- Background sync (Inngest)
- Rate limit handling

#### 16. AI Assistant
**Location:** Floating button (global)  
**Value:** Natural language queries

Ask questions like:
- "What's the health of Sprint 22?"
- "Which stories need attention?"
- "Summarize this week's decisions"

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│  Next.js App Router │ React │ TanStack Query │ Zustand      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  /api/ai/*        │ /api/jira/*  │ /api/analytics/*         │
│  /api/decisions/* │ /api/billing/* │ /api/webhooks/*        │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Supabase      │ │  Google Gemini  │ │    Inngest      │
│  PostgreSQL     │ │   AI API        │ │  Background     │
│  Auth           │ │                 │ │  Jobs           │
│  Realtime       │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    JIRA         │ │    Resend       │ │   Paystack      │
│    Cloud        │ │    Email        │ │   Billing       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Data Flow

1. **Story Sync:** JIRA → Webhook/Inngest → Supabase
2. **AI Scoring:** Story → Gemini API → Score stored in Supabase
3. **Update Generation:** Sprint data → Gemini → Signal drafts
4. **Analytics:** Supabase → Aggregation → Charts

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 (App Router) | Server/client rendering, routing |
| **Language** | TypeScript (strict) | Type safety |
| **Styling** | Tailwind CSS v4 | Utility-first styling |
| **Animation** | Framer Motion v11 | Smooth transitions |
| **UI Primitives** | Radix UI | Accessible components |
| **State** | Zustand v5 | Client state management |
| **Data Fetching** | TanStack Query v5 | Server state, caching |
| **Canvas** | React Flow v12 | PI planning board |
| **Charts** | Recharts v2 | Data visualization |
| **Database** | Supabase (PostgreSQL) | Data persistence, auth |
| **AI** | Google Gemini 2.0 Flash | Story scoring, generation |
| **Jobs** | Inngest | Background processing |
| **Email** | Resend | Transactional email |
| **Billing** | Paystack | Payment processing (Nigeria) |
| **Monitoring** | Sentry | Error tracking |
| **Deployment** | Vercel | Hosting, edge functions |

---

## Database Schema

### Core Tables

```sql
-- Multi-tenant root
workspaces (id, name, slug, plan, created_by)

-- User profiles
users (id, workspace_id, email, full_name, role, onboarding_completed)

-- Workspace membership
workspace_members (id, workspace_id, user_id, role)
```

### Quality Gate Tables

```sql
-- JIRA data
stories (id, workspace_id, jira_key, title, description, 
         acceptance_criteria, story_points, status, status_category,
         sprint_id, sprint_name, assignee_name, ...)

-- AI-generated scores
story_scores (id, story_id, total_score,
              completeness_score, clarity_score, estimability_score,
              traceability_score, testability_score,
              suggestions JSONB, ai_model, prompt_version)

-- Custom scoring rules
scoring_rubrics (id, workspace_id, name, completeness_weight, 
                 clarity_weight, estimability_weight, ...)
```

### Signal Tables

```sql
-- Stakeholder updates
signal_updates (id, workspace_id, sprint_ref, status, author_id)

-- Per-audience drafts
signal_drafts (id, update_id, audience, content, tone, ai_generated)

-- Decision tracking
decisions (id, workspace_id, title, reasoning, 
           affected_tickets, tags, made_by_id)
```

### Horizon Tables

```sql
-- Program Increments
program_increments (id, workspace_id, name, start_date, end_date,
                    status, iteration_count, canvas_data JSONB)

-- PI teams
pi_teams (id, pi_id, name, total_capacity)

-- Planned features
pi_features (id, pi_id, team_id, title, points, iteration_index,
             risk_level, status, position_x, position_y)

-- Cross-team dependencies
pi_dependencies (id, pi_id, source_feature_id, target_feature_id,
                 status, description)

-- Risk register
pi_risks (id, pi_id, title, probability, impact, 
          mitigation, owner_id, status)
```

### Supporting Tables

```sql
-- JIRA connection
jira_connections (id, workspace_id, cloud_id, access_token,
                  refresh_token, expires_at, last_sync_at)

-- Sprints
sprints (id, workspace_id, jira_sprint_id, name, state,
         start_date, end_date)

-- Billing
subscriptions (id, workspace_id, paystack_subscription_code,
               plan, status, current_period_end)
```

---

## API Reference

### AI Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/score-story` | POST | Score a single story |
| `/api/ai/generate-update` | POST | Generate stakeholder update (streaming) |
| `/api/ai/generate-story` | POST | Generate story from brief description |
| `/api/ai/pi-objectives` | POST | Generate PI objectives |
| `/api/ai/analyze-risks` | POST | Analyze PI risks |

### JIRA Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jira/auth` | GET | Initiate OAuth flow |
| `/api/jira/callback` | GET | OAuth callback handler |
| `/api/jira/sync` | POST | Trigger manual sync |
| `/api/jira/webhook` | POST | JIRA webhook receiver |
| `/api/jira/status` | GET | Connection status |
| `/api/jira/disconnect` | POST | Remove JIRA connection |

### Analytics Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/velocity` | GET | Velocity trend data |
| `/api/analytics/quality-trend` | GET | Quality score trends |
| `/api/analytics/capacity` | GET | Team capacity data |
| `/api/analytics/burndown` | GET | Sprint burndown data |
| `/api/analytics/individual` | GET | Individual stats |
| `/api/analytics/kanban` | GET | Kanban board data |

### Other Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/decisions` | GET/POST | List/create decisions |
| `/api/decisions/[id]` | DELETE | Delete decision |
| `/api/dashboard` | GET | Dashboard summary data |
| `/api/billing/checkout` | POST | Initiate payment |
| `/api/billing/subscription` | GET | Subscription status |
| `/api/team/invite` | POST | Invite team member |
| `/api/health` | GET | Health check |

---

## AI Capabilities

### Model Configuration

- **Model:** Google Gemini 2.0 Flash
- **Temperature:** 0.3 (scoring), 0.7 (generation)
- **Max Tokens:** Varies by task (1024-4096)
- **Output Format:** Structured XML for parsing

### Prompt Engineering

All prompts are versioned and stored in `lib/ai/prompts/`:

```typescript
// Example: Story scoring prompt structure
export const SCORE_STORY_SYSTEM = `
You are a senior agile coach and story quality expert.
Analyse the given JIRA user story against the provided rubric.

Output format (XML):
<analysis>
  <total_score>72</total_score>
  <dimensions>
    <completeness score="20" max="25">
      <reasoning>...</reasoning>
    </completeness>
    ...
  </dimensions>
  <suggestions>
    <suggestion type="acceptance_criteria">
      <current>...</current>
      <improved>...</improved>
    </suggestion>
  </suggestions>
</analysis>
`;
```

### Streaming Responses

For long-form generation (updates, objectives), we use streaming:

```typescript
const stream = await model.generateContentStream([...]);

for await (const chunk of result.stream) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
}
```

---

## Design System

### Color Palette

```css
/* Surfaces */
--color-canvas: #0D0D0F;
--color-surface-01: #141417;
--color-surface-02: #1A1A1F;
--color-surface-03: #222228;

/* Accent Colors */
--color-iris: #6E56CF;      /* Primary */
--color-coral: #F2555A;     /* Error/Critical */
--color-jade: #30A46C;      /* Success */
--color-amber: #FFB224;     /* Warning */
--color-cyan: #00C2D7;      /* Info */

/* Text */
--color-text-primary: #EDEDEF;
--color-text-secondary: #A0A0A8;
--color-text-tertiary: #6C6C75;
```

### Typography

- **Display:** JetBrains Mono (scores, metrics)
- **Body:** Inter (all other text)
- **Font Sizes:** 12px-48px scale

### Component Library

Located in `components/ui/`:

| Component | Purpose |
|-----------|---------|
| `score-ring.tsx` | Animated score visualization |
| `button.tsx` | Primary/secondary/ghost variants |
| `badge.tsx` | Status indicators |
| `toast.tsx` | Notifications |
| `modal.tsx` | Dialogs |
| `tabs.tsx` | Tab navigation |
| `input.tsx` | Text inputs, textareas |
| `dropdown.tsx` | Menus |
| `tooltip.tsx` | Hover hints |
| `avatar.tsx` | User avatars |
| `animated.tsx` | Animated card wrapper |
| `info-tip.tsx` | Glossary tooltips |
| `empty-state.tsx` | Empty state illustrations |
| `chart-container.tsx` | Chart wrapper |

---

## Security & Multi-tenancy

### Row Level Security (RLS)

Every table has RLS policies ensuring users can only access data within their workspace:

```sql
CREATE POLICY stories_access ON stories
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );
```

### Data Isolation

- All queries filter by `workspace_id`
- Middleware validates workspace membership
- API routes verify user has workspace access
- No cross-workspace data leakage possible

### Token Security

- JIRA tokens encrypted at rest
- API keys never exposed to client
- Secure HTTP-only session cookies
- CSRF protection enabled

---

## Integrations

### JIRA Integration

**Authentication:** OAuth 2.0 (3-legged)

**Scopes:**
- `read:jira-work` — Read issues, sprints
- `write:jira-work` — Update issues (future)
- `read:me` — User profile

**Sync Strategy:**
- Initial: Full backfill of all sprints and stories
- Ongoing: Webhook-triggered incremental sync
- Fallback: Scheduled sync every 15 minutes (Inngest)

**Data Mapped:**
- Sprints (active, future, closed)
- Stories/tasks with all fields
- Story points, status, assignees
- Epics and labels

### Email (Resend)

Used for:
- Team invitations
- Stakeholder update distribution
- Notification summaries

### Billing (Paystack)

- Naira-based pricing
- Subscription management
- Webhook for payment events
- Plans: Free, Pro, Team, Enterprise

---

## Deployment

### Vercel Configuration

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

### Environment Variables

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

# Email
RESEND_API_KEY=

# Billing
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Roadmap

### Current State (v1.0)

- [x] Quality Gate with AI scoring
- [x] Story Writer AI
- [x] Signal stakeholder updates
- [x] Decision Logger
- [x] Horizon PI canvas
- [x] JIRA integration
- [x] Analytics dashboard
- [x] Kanban board
- [x] My Work personal view
- [x] Contextual glossary
- [x] AI Assistant

### Near-term (v1.1)

- [ ] Role-based dashboards (RTE, SM, PM views)
- [ ] Scheduled Signal updates
- [ ] Slack integration for updates
- [ ] Live collaboration on Horizon canvas
- [ ] What-if simulator for capacity

### Future (v2.0)

- [ ] Multi-division hierarchy
- [ ] Solution Train support (SAFe)
- [ ] Predictive analytics / Risk radar
- [ ] Custom AI rubric training
- [ ] Mobile companion app

---

## File Structure Reference

```
forge/
├── app/
│   ├── (auth)/           # Login, signup
│   ├── (app)/            # Authenticated pages
│   │   ├── quality-gate/ # Story scoring
│   │   ├── signal/       # Stakeholder updates
│   │   ├── horizon/      # PI planning
│   │   ├── analytics/    # Charts & metrics
│   │   ├── kanban/       # Flow board
│   │   ├── my-dashboard/ # Personal view
│   │   └── settings/     # Config pages
│   ├── api/              # API routes
│   └── demo/             # Public demo pages
├── components/
│   ├── ui/               # Base components
│   ├── layout/           # Sidebar, topbar
│   ├── quality-gate/     # QG-specific
│   ├── signal/           # Signal-specific
│   ├── horizon/          # Horizon-specific
│   ├── charts/           # Chart components
│   └── ai/               # AI assistant
├── lib/
│   ├── ai/               # AI client & prompts
│   ├── db/               # Database queries
│   ├── jira/             # JIRA integration
│   └── utils/            # Helpers
├── hooks/                # React hooks
├── stores/               # Zustand stores
├── types/                # TypeScript types
└── supabase/             # DB migrations
```

---

## Contributing

1. Follow TypeScript strict mode
2. Use TanStack Query for server data
3. All AI calls via `/api/ai/*` routes
4. Test in demo mode before main app
5. Add glossary entries for new concepts

---

*FORGE — Forging clarity from complexity.*
