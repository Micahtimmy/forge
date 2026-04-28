# FORGE Product Brief
> Comprehensive overview for stakeholders, developers, and new team members

---

## Executive Summary

**FORGE** is a B2B SaaS platform that brings AI-powered intelligence to agile program management. It integrates with JIRA and uses Google Gemini AI to help Scrum Masters, Product Managers, Program Managers, and SAFe Release Train Engineers (RTEs) deliver higher-quality work with less overhead.

The platform consists of three core modules:
1. **Quality Gate** - AI-powered user story scoring and improvement suggestions
2. **Signal** - Automated stakeholder update generation
3. **Horizon** - Visual PI (Program Increment) planning canvas

**Target Market:** Mid-to-large enterprises using JIRA with agile/SAFe methodologies, primarily in Nigeria and expanding globally.

**Business Model:** Freemium SaaS with Paystack billing (Nigerian market focus)

---

## Problem Statement

### The Pain Points

**For Scrum Masters:**
- Spend 2-4 hours per sprint reviewing story quality manually
- Inconsistent quality standards across teams
- Backlog refinement becomes a bottleneck
- No objective way to measure "definition of ready"

**For Product Managers:**
- Writing stakeholder updates takes 30-60 minutes each
- Different audiences need different detail levels
- Easy to miss key information or provide wrong context
- Updates often delayed or skipped entirely

**For Program Managers & RTEs:**
- PI planning is done in spreadsheets or physical boards
- Cross-team dependencies are tracked manually
- Risk identification is reactive, not proactive
- Capacity planning relies on tribal knowledge

### The Opportunity

- **$2.8B** global agile project management market (2024)
- **68%** of Fortune 500 use SAFe or similar scaled frameworks
- **0** AI-native tools specifically designed for SAFe RTEs
- Nigerian tech ecosystem rapidly adopting agile practices

---

## Product Vision

> Make every agile team operate like their best sprint, every sprint.

FORGE doesn't replace JIRA - it augments it. We're the intelligence layer that sits on top of existing workflow tools and provides:

1. **Proactive quality assurance** - Catch story problems before sprint planning
2. **Automated communication** - Keep stakeholders informed without manual effort
3. **Visual dependency management** - See the program-level picture at a glance

---

## Core Modules

### 1. Quality Gate

**What it does:** Analyzes JIRA user stories against configurable rubrics and provides AI-generated quality scores with improvement suggestions.

**Key Features:**
| Feature | Description |
|---------|-------------|
| Story Scoring | 0-100 score based on 5 dimensions: Completeness, Clarity, Estimability, Traceability, Testability |
| Sprint Health Snapshot | Aggregate view of sprint backlog quality |
| AI Suggestions | Specific rewrites for descriptions, acceptance criteria, and titles |
| Configurable Rubrics | Customize scoring weights per workspace/team |
| Quality Trends | Track improvement over sprints |
| Story Writer | AI-assisted story creation from natural language |

**Scoring Dimensions:**
| Dimension | Weight | What it measures |
|-----------|--------|------------------|
| Completeness | 25% | All required fields populated, acceptance criteria present |
| Clarity | 25% | Unambiguous language, no vague verbs, specific outcomes |
| Estimability | 20% | Story points assigned, appropriately sized, dependencies clear |
| Traceability | 15% | Linked to epic, proper labels, roadmap alignment |
| Testability | 15% | Verifiable acceptance criteria, measurable outcomes |

**User Flow:**
```
JIRA Sync -> Stories Imported -> AI Scores Each Story -> 
Dashboard Shows Sprint Health -> User Reviews Suggestions -> 
Apply Improvements Back to JIRA
```

---

### 2. Signal

**What it does:** Generates audience-appropriate stakeholder updates from sprint context, reducing the time to create communications from 30-60 minutes to 2-3 minutes.

**Key Features:**
| Feature | Description |
|---------|-------------|
| Update Composer | Streaming AI draft generation |
| Audience Selection | Executive, Team, Client, Board presets |
| Tone Control | 5-level slider from formal to casual |
| Multi-Draft Support | Generate and compare multiple audience versions |
| Decision Logger | Track and surface key decisions made |
| Send Flows | Email (Resend) and Slack integration |

**Audience Presets:**
| Audience | Tone | Content Focus |
|----------|------|---------------|
| Executive | Formal, brief | Outcomes, metrics, blockers only |
| Team | Casual, detailed | Technical details, shoutouts, next sprint |
| Client | Professional | Deliverables, timeline, risks |
| Board | Formal, strategic | Portfolio impact, financials, strategic alignment |

**User Flow:**
```
Select Sprint Context -> Choose Audience -> AI Generates Draft ->
User Edits (optional) -> Log Decisions -> Send via Email/Slack
```

---

### 3. Horizon

**What it does:** Provides a visual canvas for SAFe PI Planning with AI-assisted dependency detection and risk analysis.

**Key Features:**
| Feature | Description |
|---------|-------------|
| PI Canvas | React Flow-based visual planning board |
| Capacity Modeling | Team capacity per iteration |
| Dependency Map | Directed graph of cross-team dependencies |
| Risk Register | AI-detected and manually added risks |
| PI Objectives | AI-generated objectives from planned features |
| Feature Cards | Drag-and-drop planning with JIRA sync |

**Canvas Layout:**
```
         | Iteration 1 | Iteration 2 | Iteration 3 | Iteration 4 | IP Sprint |
---------+-------------+-------------+-------------+-------------+-----------+
Team A   | [Feature 1] | [Feature 3] |             | [Feature 6] |           |
---------+-------------+-------------+-------------+-------------+-----------+
Team B   | [Feature 2] |             | [Feature 4] | [Feature 5] |           |
---------+-------------+-------------+-------------+-------------+-----------+

         [Dependencies shown as connecting edges between features]
```

**Dependency States:**
| State | Color | Meaning |
|-------|-------|---------|
| Open | Sky Blue | Identified, not yet addressed |
| Resolved | Jade Green | Confirmed and planned for |
| At Risk | Amber | May not be met, needs attention |
| Blocked | Coral Red | Cannot proceed, escalation needed |

---

## Target Users

### Primary Personas

**1. Sarah - Scrum Master**
- Manages 2-3 teams
- Spends too much time on backlog hygiene
- Wants objective quality metrics
- *FORGE Value:* Automated story scoring saves 2+ hours/sprint

**2. Marcus - Product Manager**
- Owns product roadmap
- Drowning in stakeholder communication
- Needs to keep multiple audiences informed
- *FORGE Value:* Signal reduces update time by 90%

**3. Diana - Release Train Engineer (RTE)**
- Coordinates 5-10 teams in SAFe ART
- PI Planning is her biggest quarterly effort
- Cross-team dependencies are her nightmare
- *FORGE Value:* Horizon visualizes the entire program

**4. James - Engineering Manager**
- Wants data-driven decisions
- Needs visibility without micromanaging
- Cares about team health metrics
- *FORGE Value:* Dashboard analytics and trends

---

## Technical Architecture

### Stack Overview

```
Frontend:     Next.js 15 (App Router) + TypeScript (strict mode)
Styling:      Tailwind CSS v4 + CSS custom properties
Animation:    Framer Motion v11
UI Library:   Radix UI primitives
State:        Zustand v5 (client) + TanStack Query v5 (server)
Canvas:       React Flow v12 (Horizon PI planning)
Charts:       Recharts v2
Database:     Supabase (PostgreSQL + Realtime + Auth)
AI:           Google Gemini API (gemini-2.0-flash)
Jobs:         Inngest (background processing)
Email:        Resend
Payments:     Paystack (Nigerian market)
Monitoring:   Sentry
Hosting:      Vercel
```

### Data Flow Architecture

```
                    +------------------+
                    |   Next.js App    |
                    |   (Vercel)       |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------v--------+  +-------v-------+  +-------v-------+
|   Supabase      |  |  Gemini API   |  |    JIRA       |
|   (Database +   |  |  (AI Engine)  |  |   (OAuth +    |
|    Auth)        |  |               |  |    REST API)  |
+-----------------+  +---------------+  +---------------+
         |
+--------v--------+
|    Inngest      |
| (Background     |
|  Jobs: Sync,    |
|  Score, Email)  |
+-----------------+
```

### Database Schema (Key Tables)

```sql
-- Multi-tenant root
workspaces (id, name, slug, plan, created_by)

-- User management
users (id, workspace_id, email, full_name, role)
workspace_members (workspace_id, user_id, role)

-- JIRA integration
jira_connections (workspace_id, cloud_id, access_token, refresh_token)
sprints (workspace_id, jira_sprint_id, name, state)
stories (workspace_id, jira_key, title, description, acceptance_criteria)

-- Quality Gate
story_scores (story_id, total_score, completeness, clarity, ...)
scoring_rubrics (workspace_id, name, weights)

-- Signal
signal_updates (workspace_id, sprint_ref, status)
signal_drafts (update_id, audience, content, tone)
decisions (workspace_id, title, decision, rationale)

-- Horizon
program_increments (workspace_id, name, start_date, end_date)
pi_teams (pi_id, name, capacity)
pi_features (pi_id, team_id, title, iteration_index, position)
pi_dependencies (pi_id, source_feature_id, target_feature_id, status)
pi_risks (pi_id, title, probability, impact, mitigation)

-- Billing
subscriptions (workspace_id, plan, status, paystack_subscription_code)
```

### Security Model

- **Row Level Security (RLS):** Every query scoped to user's workspace
- **OAuth 2.0:** JIRA integration with token encryption
- **API Authentication:** Supabase JWT with workspace claims
- **Rate Limiting:** Per-user limits on AI endpoints
- **Input Validation:** Zod schemas on all API boundaries

---

## Design Philosophy

### Dense Clarity

FORGE is built for professionals who live in information-dense tools. The design philosophy:

1. **Maximum information density** - Show everything relevant in the initial viewport
2. **Progressive disclosure** - More detail on hover/click, not a different page
3. **Visual hierarchy through contrast** - Not just size differences
4. **Dark-first** - Reduces eye strain during 8+ hour workdays

### Design References
- Linear (information density, monospace metrics)
- Vercel Dashboard (dark surfaces, real-time indicators)
- Raycast (command palette, keyboard-first)
- Figma UI3 (dense toolbars, multi-panel layouts)

### NOT These
- Notion (too minimal)
- Generic SaaS with purple gradients on white
- Trello (too card-focused)

### Color System

```css
/* Backgrounds (dark progression) */
--canvas:      #080C14   /* Page background */
--surface-01:  #0D1220   /* Primary cards */
--surface-02:  #141926   /* Secondary surfaces */
--surface-03:  #1C2333   /* Hover states */

/* Brand */
--iris:        #7C6AF7   /* Primary brand color */

/* Functional */
--jade:        #3DD68C   /* Success, excellent (85-100) */
--amber:       #F5A623   /* Warning, fair (50-69) */
--coral:       #F0714B   /* Error, poor (0-49) */
--sky:         #4AB8E8   /* Info, neutral */

/* Score Tiers */
Excellent: 85-100 (jade)
Good:      70-84  (iris)
Fair:      50-69  (amber)
Poor:      0-49   (coral)
```

### Typography

```
Display:    Syne (bold, hero stats)
Body:       DM Sans (all UI text)
Mono:       JetBrains Mono (scores, IDs, code)
```

---

## Competitive Landscape

| Competitor | Strengths | FORGE Advantage |
|------------|-----------|-----------------|
| Jira Align | SAFe native, Atlassian ecosystem | AI-native, better UX, cheaper |
| Aha! | Strong roadmapping | Better JIRA integration, AI |
| Monday.com | Easy to use | Purpose-built for agile/SAFe |
| Targetprocess | SAFe support | Modern stack, AI scoring |
| Plandek | Analytics | Proactive quality, not just metrics |

**FORGE's Unique Position:**
- First AI-native tool for SAFe RTEs
- Quality scoring doesn't exist elsewhere
- Signal update generation is unique
- Nigerian market first (Paystack)

---

## Pricing Strategy

| Plan | Price (NGN) | Features |
|------|-------------|----------|
| Free | N0 | 1 workspace, 50 stories/month, basic scoring |
| Pro | N15,000/mo | Unlimited stories, Signal, rubric customization |
| Team | N45,000/mo | Multiple workspaces, Horizon, team analytics |
| Enterprise | Custom | SSO, audit logs, dedicated support, SLA |

*Prices are indicative and subject to market validation*

---

## Current Implementation Status

### Backend (Fully Implemented)
- **Database Layer:** Complete PostgreSQL schema with RLS policies, all query functions working
- **Authentication:** Supabase Auth with email/password, Google OAuth, workspace-scoped sessions
- **JIRA Integration:** Full OAuth 2.0 flow, token management, story/sprint sync
- **AI Engine:** Google Gemini integration for scoring, story generation, and update drafting
- **Background Jobs:** Inngest functions for scheduled JIRA sync (15-min intervals) and batch scoring
- **API Layer:** Complete REST API with authentication, rate limiting, and Zod validation

### API Endpoints (All Implemented)
| Category | Endpoints | Status |
|----------|-----------|--------|
| Stories | `/api/stories`, `/api/stories/[id]`, `/api/stories/[id]/score` | ✅ Complete |
| Sprints | `/api/sprints` | ✅ Complete |
| Signal | `/api/signal/updates`, `/api/signal/updates/[id]`, `/api/signal/drafts` | ✅ Complete |
| PI Planning | `/api/pi` | ✅ Complete |
| Rubrics | `/api/rubrics`, `/api/rubrics/[id]` | ✅ Complete |
| Analytics | `/api/analytics/quality-trend`, `/api/analytics/velocity` | ✅ Complete |
| JIRA | `/api/jira/auth`, `/api/jira/callback`, `/api/jira/sync`, `/api/jira/status`, `/api/jira/disconnect` | ✅ Complete |
| AI | `/api/ai/score-story`, `/api/ai/generate-update`, `/api/ai/generate-story` | ✅ Complete |

### Frontend (Fully Connected)
All pages now use real API data via TanStack Query hooks:

| Module | Page | Data Source | Status |
|--------|------|-------------|--------|
| Quality Gate | Sprint board | `useStories()`, `useSprints()` | ✅ Real data |
| Quality Gate | Story detail | `useStory()`, `useScoreStory()` | ✅ Real data |
| Quality Gate | Rubrics | `useRubrics()`, `useUpdateRubric()` | ✅ Real data |
| Quality Gate | Trends | `useQualityTrends()` | ✅ Real data |
| Signal | Update list | `useSignalUpdates()` | ✅ Real data |
| Signal | New update | `useCreateSignalUpdate()`, `useSaveDraft()` | ✅ Real data |
| Signal | Update detail | `useSignalUpdate()`, `useUpdateSignalStatus()` | ✅ Real data |
| Horizon | PI list | `usePIs()`, `useCreatePI()` | ✅ Real data |
| Horizon | PI canvas | `usePI()`, `onCanvasChange` persistence | ✅ Real data |
| Settings | JIRA | `useJiraStatus()`, `useJiraSync()` | ✅ Real data |
| Dashboard | Analytics | `useDashboardStats()`, `useRecentActivity()` | ✅ Real data |

### Demo Mode (Preserved)
Demo pages at `/demo/*` retain hardcoded mock data for exploration without authentication:
- `/demo` - Dashboard showcase
- `/demo/quality-gate` - Story scoring demo
- `/demo/signal` - Update composer demo
- `/demo/horizon` - PI canvas demo

### In Progress / Planned
- JIRA webhook integration (real-time push sync vs. current pull)
- Signal: Slack integration for update delivery
- Horizon: AI risk analysis (`/api/ai/analyze-risks`)
- Horizon: AI PI objectives generation (`/api/ai/pi-objectives`)
- Full Paystack billing integration
- E2E test suite (Playwright)
- Production deployment optimization

---

## API Endpoints

### AI Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/score-story` | POST | Score single or multiple stories |
| `/api/ai/generate-update` | POST | Generate Signal update (streaming) |
| `/api/ai/generate-story` | POST | AI-assisted story creation |
| `/api/ai/pi-objectives` | POST | Generate PI objectives |
| `/api/ai/analyze-risks` | POST | Analyze PI risks |

### JIRA Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jira/auth` | GET | Initiate OAuth flow |
| `/api/jira/callback` | GET | OAuth callback handler |
| `/api/jira/sync` | POST | Trigger manual sync |
| `/api/jira/webhook` | POST | Receive JIRA webhooks |
| `/api/jira/status` | GET | Check connection status |
| `/api/jira/disconnect` | POST | Disconnect JIRA |

### Analytics Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/velocity` | GET | Team velocity data |
| `/api/analytics/quality-trend` | GET | Score trends over time |
| `/api/analytics/capacity` | GET | Capacity utilization |
| `/api/analytics/burndown` | GET | Sprint burndown data |

---

## Development Workflow

### Local Development
```bash
# Start all services
npm run dev                    # Next.js on :3000
npx inngest-cli dev           # Inngest on :8288
supabase start                 # Local Supabase on :54321
```

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
JIRA_CLIENT_ID
JIRA_CLIENT_SECRET
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
RESEND_API_KEY
```

### Key Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Vitest unit tests
npm run e2e          # Playwright e2e tests
npm run lint         # ESLint
```

---

## Success Metrics

### Product KPIs
| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first value | < 5 minutes | User completes JIRA connection and sees scores |
| Story scoring accuracy | > 85% agreement | User feedback on score relevance |
| Update generation time | < 30 seconds | Time from request to complete draft |
| Weekly active users | 70%+ of registered | Users who score at least one story/week |
| NPS | > 50 | Quarterly survey |

### Technical KPIs
| Metric | Target | Measurement |
|--------|--------|-------------|
| API latency (p95) | < 500ms | Non-AI endpoints |
| AI latency (p95) | < 5s | Scoring endpoints |
| Uptime | 99.9% | Vercel + Supabase |
| Error rate | < 0.1% | Sentry |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API rate limits | High | Caching, batch scoring, backoff |
| JIRA API changes | Medium | Abstract client layer, version pinning |
| Supabase outage | High | Local-first caching, graceful degradation |
| AI hallucination in suggestions | Medium | Structured output format, validation |
| Nigerian internet reliability | Medium | Optimistic updates, offline indicators |

---

## Roadmap

### Q2 2026 (Current)
- Complete core modules
- Launch beta in Nigeria
- 100 beta users

### Q3 2026
- Public launch
- Slack integration
- Mobile-responsive improvements
- 500 paid users

### Q4 2026
- Confluence integration
- Custom AI model fine-tuning
- Enterprise features (SSO, audit)
- Expand to South Africa, Kenya

### 2027
- MS Azure DevOps integration
- On-premise deployment option
- AI agent for automated refinement
- Series A fundraising

---

## Team & Resources

### Required Roles
- Full-stack Engineer (Next.js, TypeScript)
- AI/ML Engineer (Prompt engineering, Gemini)
- Designer (Figma, design systems)
- DevOps (Vercel, Supabase, monitoring)
- Product Manager

### Documentation
| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Primary build instructions for Claude Code |
| `DESIGN_SYSTEM.md` | Visual design specifications |
| `README.md` | Setup and development guide |
| `AGENTS.md` | Agent workflow configuration |

---

## Contact & Support

- **Repository:** Internal Git
- **Issue Tracker:** GitHub Issues
- **Documentation:** This file + inline docs
- **Support Email:** TBD

---

*Last Updated: April 2026*
*Version: 0.1.0 (Beta)*
