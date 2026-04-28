# CLAUDE.md — FORGE Build Instructions
> This file is the primary instruction set for Claude Code. Read it fully before taking any action.

---

## Project Identity

**FORGE** is a B2B SaaS web application — an AI-powered program intelligence platform for Scrum Masters, Product Managers, Program Managers, and SAFe RTEs. It integrates with JIRA and uses the Google Gemini API to power three core modules: Quality Gate (story scoring), Signal (stakeholder updates), and Horizon (PI planning).

**Design philosophy:** Dense Clarity — maximum information, zero cognitive noise. Dark-first, rich, opinionated. NOT generic SaaS. NOT white with purple gradients. Reference: Linear, Vercel dashboard, Raycast.

---

## Current Implementation Status (April 2026)

### Overall: ~95% Complete

**Fully Implemented:**
- Authentication (email/password, Google OAuth, GitHub OAuth)
- Onboarding wizard (workspace creation, role selection)
- JIRA OAuth integration with auto-refresh tokens
- JIRA sync (manual + scheduled every 15 min via Inngest)
- Quality Gate module (story list, AI scoring, rubrics, trends)
- Signal module (AI draft generation, email sending via Resend)
- Horizon module (PI canvas, teams, features, dependencies, risks)
- Analytics dashboards (velocity, quality trends, burndown, capacity)
- Kanban board view
- Billing integration (Paystack)
- Demo mode with realistic mock data
- All API endpoints connected to frontend hooks

**Remaining Work:**
- Team Settings page: Uses mock data for member list (invite flow works, needs GET /api/team/members endpoint)
- Slack integration for Signal (email-only currently)
- Mobile optimization (responsive but not mobile-first)

### Module Status

| Module | Backend | Frontend | AI | Status |
|--------|---------|----------|-----|--------|
| Quality Gate | 100% | 100% | 100% | Complete |
| Signal | 100% | 100% | 100% | Complete |
| Horizon | 100% | 100% | 100% | Complete |
| Analytics | 100% | 100% | N/A | Complete |
| JIRA Integration | 100% | 100% | N/A | Complete |
| Team Management | 80% | 60% | N/A | Needs member list |
| Billing | 100% | 100% | N/A | Complete |

### Key Files by Feature

**JIRA Integration:**
- `lib/jira/auth.ts` - OAuth flow, token refresh
- `lib/jira/client.ts` - JIRA API client
- `lib/jira/sync.ts` - Story/sprint sync logic
- `app/api/jira/` - Auth, callback, sync, webhook routes
- `hooks/use-jira.ts` - Frontend hooks

**Quality Gate:**
- `lib/ai/score-story.ts` - AI scoring logic
- `lib/db/queries/stories.ts` - Story queries
- `lib/db/queries/scores.ts` - Score queries
- `hooks/use-stories.ts` - useStories(), useSprints(), useStoryStats()
- `app/api/stories/` - CRUD + scoring routes

**Signal:**
- `lib/ai/generate-update.ts` - AI draft generation
- `lib/db/queries/signals.ts` - Signal queries
- `lib/email/resend.ts` - Email sending
- `hooks/use-signal.ts` - All Signal hooks
- `app/api/signal/` - Updates, drafts, send routes

**Horizon:**
- `lib/ai/generate-pi-objectives.ts` - AI objectives
- `lib/ai/analyze-risks.ts` - AI risk analysis
- `lib/db/queries/pis.ts` - PI, teams, features, deps, risks queries
- `hooks/use-pi.ts` - All PI hooks including AI mutations
- `app/api/pi/` - PI CRUD + teams/features/deps/risks routes

**Analytics:**
- `lib/db/queries/analytics.ts` - Aggregation queries
- `hooks/use-analytics.ts` - All analytics hooks
- `components/charts/` - Recharts wrappers

---

## Tech Stack — Authoritative

```
Frontend:     Next.js 16 (App Router), TypeScript strict mode
Styling:      Tailwind CSS v4, CSS custom properties (design tokens)
Animation:    Framer Motion v11
UI Primitives: Radix UI
State:        Zustand v5
Data fetching: TanStack Query v5
Canvas:       React Flow v12 (Horizon PI canvas + dependency map)
Charts:       Recharts v2
Database:     Supabase (PostgreSQL + Realtime + Auth)
AI:           Google Gemini API (@google/generative-ai) — gemini-2.0-flash ONLY
Jobs:         Inngest v4 (background job queue)
Email:        Resend
Testing:      Vitest (unit), Playwright (e2e)
Deployment:   Vercel
Monitoring:   Sentry
```

**Never substitute these.** If you think a different library is better for a specific case, add a comment explaining why — but default to this list.

---

## File Structure — Follow Exactly

```
forge/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx            # Main app shell (sidebar + topbar)
│   │   ├── page.tsx              # Dashboard (role-aware home)
│   │   ├── quality-gate/
│   │   │   ├── page.tsx          # Sprint board with scores
│   │   │   ├── story/[id]/page.tsx
│   │   │   ├── rubrics/page.tsx
│   │   │   └── trends/page.tsx
│   │   ├── signal/
│   │   │   ├── page.tsx          # Update history
│   │   │   ├── new/page.tsx      # Composer
│   │   │   └── [id]/page.tsx     # Update detail
│   │   ├── horizon/
│   │   │   ├── page.tsx          # PI list
│   │   │   └── [piId]/
│   │   │       ├── page.tsx      # PI canvas
│   │   │       ├── capacity/page.tsx
│   │   │       ├── dependencies/page.tsx
│   │   │       └── risks/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── jira/page.tsx
│   │       └── team/page.tsx
│   └── api/
│       ├── auth/[...route]/route.ts
│       ├── jira/
│       │   ├── callback/route.ts
│       │   ├── sync/route.ts
│       │   └── webhook/route.ts
│       ├── ai/
│       │   ├── score-story/route.ts
│       │   ├── generate-update/route.ts
│       │   ├── pi-objectives/route.ts
│       │   ├── detect-dependencies/route.ts
│       │   └── analyze-risks/route.ts
│       └── webhooks/
│           └── inngest/route.ts
├── components/
│   ├── ui/                       # Base design system components
│   │   ├── score-ring.tsx
│   │   ├── story-card.tsx
│   │   ├── command-palette.tsx
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   ├── modal.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── page-header.tsx
│   ├── quality-gate/
│   │   ├── story-score-card.tsx
│   │   ├── sprint-health-snapshot.tsx
│   │   ├── rubric-builder.tsx
│   │   └── quality-trends-chart.tsx
│   ├── signal/
│   │   ├── update-composer.tsx
│   │   ├── audience-selector.tsx
│   │   ├── draft-panel.tsx
│   │   └── update-history.tsx
│   └── horizon/
│       ├── pi-canvas.tsx
│       ├── capacity-model.tsx
│       ├── dependency-map.tsx
│       └── risk-register.tsx
├── lib/
│   ├── ai/
│   │   ├── client.ts             # Google Gemini SDK instance
│   │   ├── score-story.ts
│   │   ├── generate-update.ts
│   │   ├── generate-pi-objectives.ts
│   │   ├── detect-dependencies.ts
│   │   ├── analyze-risks.ts
│   │   └── prompts/
│   │       ├── score-story.ts
│   │       ├── generate-update.ts
│   │       └── ...
│   ├── jira/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── sync.ts
│   ├── db/
│   │   ├── client.ts             # Supabase client
│   │   └── queries/
│   │       ├── stories.ts
│   │       ├── scores.ts
│   │       ├── signals.ts
│   │       └── pis.ts
│   ├── inngest/
│   │   ├── client.ts
│   │   └── functions/
│   │       ├── sync-jira.ts
│   │       └── score-sprint.ts
│   └── utils/
│       ├── score-utils.ts
│       └── format-utils.ts
├── hooks/
│   ├── use-stories.ts
│   ├── use-scores.ts
│   ├── use-jira-sync.ts
│   └── use-command-palette.ts
├── stores/
│   ├── app-store.ts              # Global app state (sidebar, command palette)
│   ├── quality-gate-store.ts
│   └── horizon-store.ts
├── types/
│   ├── story.ts
│   ├── score.ts
│   ├── signal.ts
│   ├── pi.ts
│   └── jira.ts
├── styles/
│   └── globals.css               # Design tokens + base styles
├── supabase/
│   ├── migrations/               # SQL migration files
│   └── seed.sql
├── inngest.config.ts
├── next.config.ts
├── tailwind.config.ts
└── .env.local.example
```

---

## Coding Standards

### TypeScript
- Strict mode enabled at all times (`"strict": true`)
- No `any` types — use `unknown` and narrow
- All API route handlers must have typed request/response
- All Supabase queries must use generated types (`supabase gen types typescript`)
- Zod validation on all user input and API boundaries

### React Components
- Functional components only
- Props interfaces defined above the component (not inline)
- No default exports from component files (use named exports)
- `'use client'` directive only when necessary — prefer server components
- All components must handle: loading state, error state, empty state
- Use Framer Motion for ALL animations — no CSS transitions for interactive elements

### Naming Conventions
```
Components:    PascalCase (StoryCard, ScoreRing)
Hooks:         camelCase prefixed use- (useStories, useJiraSync)
Stores:        camelCase + -store (appStore, qualityGateStore)
API routes:    kebab-case (/api/ai/score-story)
DB queries:    camelCase verbs (getStoriesByWorkspace, upsertStoryScore)
Types:         PascalCase interfaces (Story, ScoreResult, SignalDraft)
Constants:     SCREAMING_SNAKE_CASE
```

### AI Integration Rules
```typescript
// ALWAYS use streaming for updates and objectives
// ALWAYS use structured XML output for scores
// ALWAYS handle API errors gracefully (show last-known data + stale badge)
// NEVER expose API keys in client code
// NEVER call AI APIs directly from client — always via /api/ai/* routes
// ALWAYS set maxTokens explicitly
// ALWAYS use gemini-2.0-flash — never change the model
```

### Database Rules
- All DB calls go through `lib/db/queries/` — never call Supabase directly from components
- All mutations use optimistic updates where UX demands it
- All reads go through TanStack Query with appropriate stale times
- Never SELECT * — always specify columns
- RLS policies enforced — test that cross-workspace access is impossible

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=

JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=
JIRA_REDIRECT_URI=

INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

RESEND_API_KEY=

# Paystack (Nigeria)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Design System Implementation

### CSS Custom Properties (globals.css)
All design tokens must be defined as CSS custom properties in `:root` on `body[data-theme="dark"]`. The app is dark-mode only in v1.

```css
/* Copy from DESIGN_SYSTEM.md — implement ALL tokens */
```

### Tailwind Configuration
Extend Tailwind to reference CSS variables:
```js
// tailwind.config.ts
colors: {
  canvas: 'var(--color-canvas)',
  'surface-01': 'var(--color-surface-01)',
  iris: 'var(--color-iris)',
  coral: 'var(--color-coral)',
  jade: 'var(--color-jade)',
  // ... all design tokens
}
```

### Score Ring Component — Must Implement Exactly
```typescript
// components/ui/score-ring.tsx
// Animated SVG ring with:
// - stroke-dashoffset animation from 0 → score value on mount
// - Center: score number in JetBrains Mono
// - Ring colour derived from score tier (jade/iris/amber/coral)
// - Size variants: sm (32px) | md (48px) | lg (80px) | xl (120px)
// - Framer Motion: spring animation, staggerDelay prop for lists
```

---

## AI Prompt Standards

All prompts live in `lib/ai/prompts/`. They must:
1. Have a clear system prompt defining role and output format
2. Use XML output tags for structured scoring (`<score>`, `<dimension>`, `<suggestion>`)
3. Include few-shot examples for scoring consistency
4. Be versioned: export `const PROMPT_VERSION = "1.0.0"`

### Story Scoring Prompt Structure
```typescript
export const SCORE_STORY_SYSTEM = `
You are a senior agile coach and story quality expert. 
Analyse the given JIRA user story against the provided rubric and return a structured score.

Output format (XML):
<analysis>
  <total_score>72</total_score>
  <dimensions>
    <completeness score="20" max="25">
      <reasoning>Description present but no acceptance criteria found</reasoning>
    </completeness>
    <clarity score="18" max="25">
      <reasoning>Title is clear but description uses vague verb "handle"</reasoning>
    </clarity>
    <estimability score="15" max="20">
      <reasoning>Story points assigned (5), scope feels appropriate</reasoning>
    </estimability>
    <traceability score="14" max="15">
      <reasoning>Linked to Epic "Payment Gateway", has label "mobile"</reasoning>
    </traceability>
    <testability score="5" max="15">
      <reasoning>No verifiable acceptance criteria — "user should be happy" is not testable</reasoning>
    </testability>
  </dimensions>
  <suggestions>
    <suggestion type="acceptance_criteria">
      <current>User should be happy with the experience</current>
      <improved>Given the user is on checkout, when they tap "Pay Now", then payment confirmation appears within 3 seconds and order ID is visible</improved>
    </suggestion>
  </suggestions>
</analysis>
`;
```

---

## Key Implementation Notes

### JIRA Sync
- Use Atlassian OAuth 2.0 3-legged flow
- Store tokens encrypted in DB (use `lib/jira/auth.ts` for all token operations)
- Background sync via Inngest: `sync-jira` function runs every 15 min per workspace
- Webhook endpoint at `/api/jira/webhook` for real-time story updates
- Handle rate limits: 429 → exponential backoff, log to Inngest

### Streaming AI Responses
For Signal update generation and PI objectives, stream the response:
```typescript
// app/api/ai/generate-update/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const result = await model.generateContentStream([...]);
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      }
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### React Flow (Horizon)
- PI Canvas: Custom node types for Feature cards, Iteration headers, Team rows
- Dependency Map: Directed graph, custom edge types (resolved/at-risk/blocked)
- Canvas state saved to DB on every drag-end (debounced 1000ms)
- Never re-render the whole canvas on data changes — use React Flow's internal state

### Multi-tenancy
- Every DB query must include `workspace_id` from the user's session
- Middleware (`middleware.ts`) validates workspace membership before any page loads
- Zustand stores are per-session, not shared across tabs

---

## Build Order — Completed

All major milestones have been implemented:

```
✅ 1. Project scaffolding + design system (tokens, fonts, base components)
✅ 2. Auth (Supabase Auth: sign up, login, session handling)
✅ 3. App shell (sidebar, topbar, command palette shell)
✅ 4. JIRA OAuth + first sync
✅ 5. Quality Gate: story list + score badges
✅ 6. Quality Gate: AI scoring engine
✅ 7. Quality Gate: story detail panel + suggestions
✅ 8. Quality Gate: rubric configuration
✅ 9. Quality Gate: sprint health snapshot + trends
✅ 10. Signal: context ingestion + composer UI
✅ 11. Signal: AI draft generation (streaming)
✅ 12. Signal: send flows (email only - Slack pending)
✅ 13. Signal: decision logger
✅ 14. Horizon: PI creation + canvas (React Flow)
✅ 15. Horizon: capacity modelling
✅ 16. Horizon: dependency map
✅ 17. Horizon: risk register (AI)
✅ 18. Horizon: PI objectives (AI)
✅ 19. Onboarding flow
✅ 20. Billing (Paystack - Nigeria)
⏳ 21. Tests + monitoring (Sentry configured, tests pending)
```

### Remaining Tasks

1. **Team Member List API** - Create `GET /api/team/members` to replace mock data in settings/team page
2. **Slack Integration** - Add Slack OAuth and message sending to Signal module
3. **E2E Tests** - Playwright tests for critical user journeys
4. **Mobile Optimization** - Improve touch targets and responsive layouts

---

## Do Not

- Do NOT use `create-react-app` or Vite — use Next.js App Router exclusively
- Do NOT use `pages/` directory — App Router only
- Do NOT call the Anthropic API from the browser
- Do NOT commit `.env.local` or any secrets
- Do NOT use `useEffect` for data fetching — use TanStack Query
- Do NOT use `useState` for server data — use TanStack Query
- Do NOT write inline styles — use Tailwind classes or CSS variables
- Do NOT use emoji in UI components (they render inconsistently cross-platform)
- Do NOT skip error boundaries — wrap all async UI in error boundaries
- Do NOT use `console.log` in production code — use structured logging

---

## API Endpoints Reference

### Stories & Scoring
```
GET    /api/stories              - List stories (with filters)
GET    /api/stories/[id]         - Get single story with score
POST   /api/stories/[id]/score   - AI score a story
GET    /api/sprints              - List sprints
```

### Signal (Stakeholder Updates)
```
GET    /api/signal/updates       - List signal updates
POST   /api/signal/updates       - Create new update
GET    /api/signal/updates/[id]  - Get update with drafts
PATCH  /api/signal/updates/[id]  - Update status
DELETE /api/signal/updates/[id]  - Delete update
POST   /api/signal/drafts        - Save/update draft
POST   /api/signal/[id]/send     - Send via email
```

### Horizon (PI Planning)
```
GET    /api/pi                   - List PIs
POST   /api/pi                   - Create PI
GET    /api/pi/[piId]            - Get PI with canvas data
PATCH  /api/pi/[piId]            - Update PI canvas
GET    /api/pi/[piId]/teams      - List PI teams
POST   /api/pi/[piId]/teams      - Create team
GET    /api/pi/[piId]/features   - List features
POST   /api/pi/[piId]/features   - Create feature
GET    /api/pi/[piId]/dependencies - List dependencies
POST   /api/pi/[piId]/dependencies - Create dependency
GET    /api/pi/[piId]/risks      - List risks
POST   /api/pi/[piId]/risks      - Create risk
```

### AI Endpoints
```
POST   /api/ai/score-story       - Score stories with AI
POST   /api/ai/generate-update   - Generate Signal drafts (streaming)
POST   /api/ai/pi-objectives     - Generate PI objectives
POST   /api/ai/analyze-risks     - Analyze PI risks
POST   /api/ai/generate-story    - Generate story from description
```

### JIRA Integration
```
GET    /api/jira/auth            - Initiate OAuth flow
GET    /api/jira/callback        - OAuth callback
POST   /api/jira/sync            - Trigger manual sync
GET    /api/jira/status          - Connection status
POST   /api/jira/disconnect      - Remove connection
POST   /api/jira/webhook         - JIRA webhook receiver
```

### Rubrics
```
GET    /api/rubrics              - List rubrics
POST   /api/rubrics              - Create rubric
GET    /api/rubrics/[id]         - Get rubric
PATCH  /api/rubrics/[id]         - Update rubric
DELETE /api/rubrics/[id]         - Delete rubric
```

### Team Management
```
POST   /api/team/invite          - Send team invitation
PATCH  /api/team/invite          - Resend invitation
POST   /api/team/accept          - Accept invitation
```

### Analytics
```
GET    /api/analytics/velocity        - Sprint velocity data
GET    /api/analytics/quality-trend   - Quality score trends
GET    /api/analytics/capacity        - Team capacity data
GET    /api/analytics/burndown        - Sprint burndown
GET    /api/analytics/kanban          - Kanban board data
GET    /api/analytics/individual      - Individual contributor metrics
```

---

## Hooks Reference

### Stories
```typescript
useStories(filters)      // List stories with filtering
useStory(storyId)        // Single story
useSprints()             // List sprints
useStoryStats(stories)   // Computed stats from stories array
useScoreStory()          // Mutation to score a story
```

### Signal
```typescript
useSignalUpdates(filters)    // List signal updates
useSignalUpdate(updateId)    // Single update with drafts
useCreateSignalUpdate()      // Create mutation
useSaveDraft()               // Save draft mutation
useSendUpdate()              // Send via email mutation
useDeleteUpdate()            // Delete mutation
useGenerateUpdate()          // AI generation mutation
useGenerateUpdateStream()    // AI generation with streaming
```

### Horizon
```typescript
usePIs(status?)              // List PIs
usePI(piId)                  // Single PI with canvas
useCreatePI()                // Create mutation
usePICanvasMutation(piId)    // Update canvas mutation
usePITeams(piId)             // List teams
useCreatePITeam(piId)        // Create team mutation
usePIFeatures(piId)          // List features
useCreatePIFeature(piId)     // Create feature mutation
usePIDependencies(piId)      // List dependencies
useCreatePIDependency(piId)  // Create dependency mutation
usePIRisks(piId)             // List risks
useCreatePIRisk(piId)        // Create risk mutation
useGeneratePIObjectives()    // AI objectives mutation
useAnalyzeRisks()            // AI risk analysis mutation
```

### Analytics
```typescript
useVelocityData()            // Sprint velocity
useQualityTrend()            // Quality trends
useTeamCapacity()            // Capacity data
useBurndownData()            // Burndown chart
useKanbanBoard()             // Kanban columns
useIndividualMetrics(userId) // Individual stats
```

### JIRA
```typescript
useJiraStatus()              // Connection status
useJiraSync()                // Manual sync mutation
useJiraDisconnect()          // Disconnect mutation
```

### Rubrics
```typescript
useRubrics()                 // List rubrics
useRubric(rubricId)          // Single rubric
useCreateRubric()            // Create mutation
useUpdateRubric()            // Update mutation
useDeleteRubric()            // Delete mutation
```

---

## Demo Mode

The `/demo/*` routes provide a fully functional demo without requiring JIRA connection or real data:

- Uses mock data from `lib/demo/mock-data.ts`
- All UI interactions work (filtering, search, navigation)
- AI features simulate responses with realistic delays
- Completely isolated from production data

Demo pages mirror the main app structure:
```
/demo                        - Demo dashboard
/demo/quality-gate           - Story scoring demo
/demo/signal                 - Signal updates demo
/demo/horizon                - PI planning demo
/demo/analytics              - Analytics demo
/demo/kanban                 - Kanban demo
/demo/settings               - Settings demo
```
