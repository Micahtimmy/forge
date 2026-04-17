# AGENTS.md — FORGE Multi-Agent Workflow Instructions
> Used by Claude Code sub-agents for parallel and specialised build tasks.

---

## Agent Overview

FORGE uses Claude Code's multi-agent capability to parallelize complex build tasks. Each agent below has a defined scope, input requirements, and output expectations.

---

## Agent 0 — Orchestrator

**Role:** Reads CLAUDE.md and this file. Breaks the current task into sub-tasks. Assigns to appropriate agents. Reviews and integrates outputs.

**Rules:**
- Always read `CLAUDE.md` first before planning work
- Never skip the build order defined in CLAUDE.md
- Create a task checklist before spawning sub-agents
- Validate each agent's output before proceeding
- If any agent fails, retry once then surface the error clearly

---

## Agent 1 — Foundation Agent

**Scope:** Project scaffolding, design system, base components

**Triggers:** Run first — nothing else can proceed without this

**Tasks:**
```
1. npx create-next-app@latest forge --typescript --tailwind --app --src-dir no
2. Install all dependencies (see package.json requirements below)
3. Configure tailwind.config.ts with all design tokens
4. Create styles/globals.css with all CSS custom properties
5. Set up Google Fonts: Syne, DM Sans, JetBrains Mono (next/font)
6. Create base UI components: Button, Badge, Toast, Modal, Skeleton, ScoreRing
7. Set up Supabase client (lib/db/client.ts)
8. Set up Gemini AI client (lib/ai/client.ts)
9. Configure Sentry (sentry.client.config.ts, sentry.server.config.ts)
10. Create .env.local.example
```

**Package.json requirements:**
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@google/generative-ai": "latest",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "latest",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-tooltip": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-slider": "latest",
    "@radix-ui/react-switch": "latest",
    "@radix-ui/react-select": "latest",
    "framer-motion": "^11.0.0",
    "reactflow": "^12.0.0",
    "recharts": "^2.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "inngest": "latest",
    "resend": "latest",
    "zod": "^3.0.0",
    "@sentry/nextjs": "latest",
    "cmdk": "latest",
    "date-fns": "^3.0.0",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

**Output validation:**
- [ ] `npm run dev` starts without errors
- [ ] Design tokens visible in browser DevTools CSS variables
- [ ] ScoreRing component renders with animation
- [ ] Supabase and Gemini AI clients export without errors

---

## Agent 2 — Auth & Database Agent

**Scope:** Authentication, database schema, migrations, RLS policies

**Depends on:** Agent 1 complete

**Tasks:**
```
1. Create Supabase project (output: project URL + anon key for .env)
2. Write all migration files (supabase/migrations/)
3. Apply RLS policies to all tables
4. Generate TypeScript types (supabase gen types typescript)
5. Create lib/db/queries/ files for all entities
6. Implement Supabase Auth: sign up, login, session refresh
7. Build auth pages: /login, /signup, /forgot-password
8. Build auth middleware (middleware.ts): protect (app) routes
9. Create onboarding check: redirect new users to /onboarding
```

**Migration file naming:**
```
0001_create_workspaces.sql
0002_create_users.sql
0003_create_jira_connections.sql
0004_create_stories.sql
0005_create_rubrics.sql
0006_create_story_scores.sql
0007_create_signal_updates.sql
0008_create_decisions.sql
0009_create_program_increments.sql
0010_create_pi_teams.sql
0011_create_pi_dependencies.sql
0012_rls_policies.sql
```

**RLS Policy Requirements:**
Every table must have:
- SELECT: `workspace_id = auth.jwt() ->> 'workspace_id'`
- INSERT: `workspace_id = auth.jwt() ->> 'workspace_id'`
- UPDATE: `workspace_id = auth.jwt() ->> 'workspace_id'`
- DELETE: Admin role only for most tables

**Output validation:**
- [ ] All migrations apply cleanly to a fresh Supabase project
- [ ] Login / signup flow works end-to-end
- [ ] Accessing (app) routes while logged out redirects to /login
- [ ] Cross-workspace query returns 0 rows (RLS working)

---

## Agent 3 — JIRA Integration Agent

**Scope:** JIRA OAuth, story sync, webhook handling

**Depends on:** Agent 2 complete

**Tasks:**
```
1. Register Atlassian OAuth 2.0 app (document steps in SETUP.md)
2. Build JIRA OAuth flow: /settings/jira → OAuth dance → callback → token store
3. Implement lib/jira/client.ts: authenticated JIRA API wrapper
4. Implement lib/jira/sync.ts: fetch projects, boards, sprints, stories
5. Build Inngest background job: sync-jira (runs every 15 min)
6. Build webhook endpoint: /api/jira/webhook (handles story create/update)
7. Build sync status indicator in topbar (idle/syncing/error/last synced time)
8. Handle JIRA custom fields gracefully (don't break if fields are missing)
9. Implement token refresh flow (silent, on 401 from JIRA)
```

**JIRA API endpoints to use:**
```
GET /rest/api/3/myself                    — Validate connection
GET /rest/api/3/project                   — List projects
GET /rest/agile/1.0/board                 — List boards
GET /rest/agile/1.0/board/{id}/sprint     — List sprints
GET /rest/agile/1.0/sprint/{id}/issue     — Get sprint stories
GET /rest/api/3/issue/{issueIdOrKey}       — Get story detail
PUT /rest/api/3/issue/{issueIdOrKey}       — Update story (for pushing AI suggestions)
POST /rest/api/3/issue/{issueIdOrKey}/comment — Add AI suggestion as comment
```

**Output validation:**
- [ ] OAuth flow completes and token is stored encrypted in DB
- [ ] Sync fetches at least one project's stories and writes to DB
- [ ] Inngest job runs and can be observed in Inngest dev server
- [ ] Webhook receives a story update event and updates the DB record

---

## Agent 4 — Quality Gate Agent

**Scope:** Story scoring AI, Quality Gate UI, rubric configuration

**Depends on:** Agent 3 complete (stories in DB)

**Tasks:**
```
1. Build AI scoring function: lib/ai/score-story.ts
2. Build AI prompt: lib/ai/prompts/score-story.ts (XML output format)
3. Build API route: POST /api/ai/score-story
4. Build score computation job (Inngest: score-sprint-backlog)
5. Build Quality Gate board view: /quality-gate (story list with scores)
6. Build ScoreRing component with Framer Motion animation
7. Build StoryCard component (score badge, expand on click)
8. Build story detail panel: /quality-gate/story/[id]
9. Build AI suggestion display + "Apply to JIRA" button
10. Build Sprint Health Snapshot component
11. Build rubric configuration UI: /quality-gate/rubrics
12. Build quality trends chart (Recharts, 12-week rolling)
```

**Scoring API contract:**
```typescript
// POST /api/ai/score-story
// Request:
{ storyId: string; rubricId: string; }

// Response:
{
  storyId: string;
  score: number;
  dimensions: {
    completeness: { score: number; max: number; reasoning: string };
    clarity: { score: number; max: number; reasoning: string };
    estimability: { score: number; max: number; reasoning: string };
    traceability: { score: number; max: number; reasoning: string };
    testability: { score: number; max: number; reasoning: string };
  };
  suggestions: Array<{
    type: string;
    current: string;
    improved: string;
  }>;
  scoredAt: string;
}
```

**Output validation:**
- [ ] Scoring a story returns valid JSON with all dimensions
- [ ] Score ring animates from 0 to value on first render
- [ ] Low-scored stories show suggestions with "Apply to JIRA" working
- [ ] Rubric weight changes cause all sprint stories to re-score
- [ ] Sprint health score updates in real-time as stories are updated

---

## Agent 5 — Signal Agent

**Scope:** Stakeholder update composer, AI drafting, send flows

**Depends on:** Agent 3 complete

**Tasks:**
```
1. Build AI drafting function: lib/ai/generate-update.ts (streaming)
2. Build API route: POST /api/ai/generate-update (streaming response)
3. Build Signal composer: /signal/new
   - Left panel: context (JIRA data being used)
   - Right panel: streaming AI draft
   - Audience selector: checkbox group
   - Tone dial: Radix Slider (formal ↔ conversational)
   - Format selector: Email / Slack / Confluence / PDF
4. Build audience variant tabs: see all drafts side-by-side
5. Build inline AI editing: highlight text → floating toolbar → refine
6. Build send flows: Email (Resend), Slack (webhook), copy
7. Build Signal history: /signal — table of all sent updates
8. Build Decision Logger: inline flag in composer → decision saved to DB
9. Build update detail view: /signal/[id]
```

**Streaming response format:**
Signal should stream text for each audience in sequence:
```
data: {"audience":"executive","chunk":"Sprint 22 delivered..."}
data: {"audience":"executive","chunk":" the payment gateway feature..."}
...
data: {"audience":"team","chunk":"This sprint we shipped..."}
```

**Output validation:**
- [ ] All 4 audience drafts generate within 10 seconds
- [ ] Streaming updates the UI in real-time (no blank then flash)
- [ ] Sent updates appear in history with correct metadata
- [ ] Decision logger saves decisions and they appear in the search
- [ ] Email send via Resend delivers a formatted email

---

## Agent 6 — Horizon Agent

**Scope:** PI canvas, capacity modelling, dependency map, risk register

**Depends on:** Agent 3 complete

**Tasks:**
```
1. Build PI creation flow: /horizon → new PI modal → setup wizard
2. Build PI canvas: /horizon/[piId] using React Flow
   - Custom node: FeatureCard (title, points, team, risk badge)
   - Custom node: IterationHeader (iteration number, capacity gauge)
   - Custom node: TeamRow (team name, velocity, total committed)
   - Drop zones: features can be dragged from backlog panel onto canvas
   - Canvas state auto-saved to DB (debounced 1s)
3. Build capacity model: /horizon/[piId]/capacity
   - Team velocity table (last 6 sprints auto-pulled)
   - Iteration capacity calculator (with IP iteration adjustment)
   - Over-commitment alerts (amber/red when > 90% / 110%)
4. Build dependency map: /horizon/[piId]/dependencies
   - React Flow directed graph
   - Custom edges: resolved (jade) / at_risk (amber) / blocked (coral)
   - AI dependency detection: POST /api/ai/detect-dependencies
   - Add/remove dependencies manually
5. Build risk register: /horizon/[piId]/risks
   - AI risk analysis: POST /api/ai/analyze-risks
   - Risk cards: title, type, impact, likelihood, mitigation, owner
   - Accept/dismiss/add-note actions
6. Build PI objective generator: POST /api/ai/pi-objectives
7. Build PI health dashboard (during execution): burn-up + dependency health
```

**React Flow node types:**
```typescript
const nodeTypes = {
  featureCard: FeatureCardNode,
  iterationHeader: IterationHeaderNode,
  teamRowHeader: TeamRowHeaderNode,
  backlogItem: BacklogItemNode,
};

const edgeTypes = {
  dependency: DependencyEdge,  // colored by status
};
```

**Output validation:**
- [ ] PI canvas renders with correct teams × iterations grid
- [ ] Feature cards can be dragged and snapped to cells
- [ ] Capacity gauges update when features are added/removed
- [ ] Dependency map renders and AI-detected dependencies are shown
- [ ] Risk register populates after AI analysis

---

## Agent 7 — App Shell & Navigation Agent

**Scope:** Global layout, sidebar, topbar, command palette, onboarding

**Depends on:** Agent 1 complete (can run in parallel with Agents 2–6 for UI shell)

**Tasks:**
```
1. Build app layout: app/(app)/layout.tsx
   - Sidebar (collapsible, pinnable)
   - Topbar (JIRA sync status, command palette trigger, user menu)
   - Main content area
2. Build sidebar with Framer Motion:
   - Collapsed: 56px icon rail
   - Expanded: 220px with labels
   - Active state: iris pill background
   - Bottom: workspace switcher + user avatar
3. Build command palette (cmdk):
   - Groups: Recent, Stories, Actions, Navigate
   - Keyboard shortcut: ⌘K
   - Animated: scale + fade on open
4. Build global JIRA sync status indicator:
   - Dot animation states: idle / syncing / error
   - Tooltip: "Last synced 3 minutes ago"
5. Build toast notification system (Framer Motion, bottom-right)
6. Build onboarding flow: /onboarding
   - Step 1: Connect JIRA
   - Step 2: Configure first rubric
   - Step 3: Score your first sprint
7. Build role-aware dashboard: /
   - SM view: Sprint health + top failing stories
   - PM view: Recent signal updates + pending stories
   - RTE view: Active PI + ART health summary
```

**Output validation:**
- [ ] Sidebar collapses/expands with smooth animation
- [ ] Command palette opens with ⌘K and closes with Escape
- [ ] JIRA sync status updates in real-time via Supabase Realtime
- [ ] Onboarding flow guides user through all 3 steps without confusion
- [ ] Dashboard shows different content based on user role

---

## Parallel Execution Plan

```
Week 1-2:
  Agent 1 (Foundation)   ←── Must complete first
  
Week 2:
  Agent 2 (Auth + DB)    ←── Depends on Agent 1
  Agent 7 (Shell - UI)   ←── Can start in parallel with Agent 2

Week 2-3:
  Agent 3 (JIRA)         ←── Depends on Agent 2

Week 3-4:
  Agent 4 (Quality Gate) ←── Depends on Agent 3
  Agent 5 (Signal)       ←── Depends on Agent 3 (parallel with 4)

Week 4-6:
  Agent 6 (Horizon)      ←── Depends on Agent 3 (starts after 4+5 stable)
```

---

## Error Handling Contract

All agents must implement these error states in UI:

```typescript
// Every async component must handle:
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Error display component: ErrorCard
// Props: message, retryFn (optional), code (optional HTTP code)
// Style: coral border, coral icon, muted message, optional retry button
```

---

## Testing Conventions

```
Unit tests: lib/ai/*.test.ts, lib/jira/*.test.ts, lib/db/queries/*.test.ts
Component tests: components/ui/*.test.tsx (render + interaction)
E2E tests: tests/e2e/ (Playwright)
  - auth.spec.ts: full login/logout flow
  - quality-gate.spec.ts: score a story, view analysis
  - signal.spec.ts: generate + send an update
  - jira-sync.spec.ts: sync stories appear in board
```
