# FORGE Product Documentation

## Executive Summary

**FORGE** is an AI-powered program intelligence platform designed for agile practitioners - Scrum Masters, Product Managers, Program Managers, and SAFe Release Train Engineers (RTEs). It integrates with JIRA and leverages Google's Gemini AI to provide intelligent insights across three core modules: Quality Gate, Signal, and Horizon.

**Target Market**: B2B SaaS for enterprise agile teams, with initial focus on the Nigerian market (Paystack billing integration).

**Design Philosophy**: Dense Clarity - maximum information density with zero cognitive noise. Dark-first UI inspired by Linear, Vercel dashboard, and Raycast.

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
                    |
        +-----------+-----------+
        |           |           |
   +----v----+ +----v----+ +----v----+
   | Stories | | Scores  | | PIs     |
   | Rubrics | | Signals | | Teams   |
   | Users   | | Decisions| | Deps   |
   +---------+ +---------+ +---------+
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

## Database Schema

### Tables Overview

| Table | Purpose |
|-------|---------|
| `workspaces` | Multi-tenant organization container |
| `users` | User profiles with roles |
| `workspace_members` | User-workspace associations |
| `jira_connections` | OAuth tokens for JIRA integration |
| `stories` | Synced JIRA stories |
| `rubrics` | Scoring configuration |
| `story_scores` | AI-generated scores per story |
| `signal_updates` | Stakeholder updates |
| `decisions` | Logged decisions |
| `program_increments` | PI metadata |
| `pi_teams` | Teams within a PI |
| `pi_dependencies` | Cross-team dependencies |
| `subscriptions` | Paystack billing records |

### Key Relationships

```
Workspace
    |-- has many --> Users (via workspace_members)
    |-- has one --> JiraConnection
    |-- has many --> Stories
    |-- has many --> Rubrics
    |-- has many --> SignalUpdates
    |-- has many --> ProgramIncrements
    |-- has one --> Subscription

Story
    |-- has many --> StoryScores (via rubric)

ProgramIncrement
    |-- has many --> PITeams
    |-- has many --> PIDependencies
```

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

## Future Roadmap

### Phase 1 (Current)
- Core modules implemented
- Basic JIRA integration
- Paystack billing

### Phase 2
- Slack integration for Signal
- Email delivery via Resend
- Enhanced analytics dashboard
- Mobile-responsive improvements

### Phase 3
- SSO support (SAML, OIDC)
- Custom integrations API
- Advanced reporting
- On-premise deployment option

---

## Contributing

See `CLAUDE.md` for detailed coding standards and contribution guidelines.

---

*Documentation Version: 1.0.0*
*Last Updated: April 2026*
