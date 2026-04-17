# FORGE — Product Requirements Document
**Version:** 1.0.0  
**Status:** Approved for Development  
**Product Lead:** [Your Name]  
**Last Updated:** April 2026  
**Classification:** Internal — Confidential

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem — Empathy-Led Research](#2-the-problem)
3. [User Personas](#3-user-personas)
4. [Jobs To Be Done](#4-jobs-to-be-done)
5. [Product Vision & Strategy](#5-product-vision--strategy)
6. [Information Architecture](#6-information-architecture)
7. [Module 1 — Quality Gate (Story Scorer)](#7-module-1--quality-gate)
8. [Module 2 — Signal (Stakeholder Updater)](#8-module-2--signal)
9. [Module 3 — Horizon (PI Planning Copilot)](#9-module-3--horizon)
10. [Design Language & UI Specifications](#10-design-language--ui-specifications)
11. [Technical Architecture](#11-technical-architecture)
12. [Integrations](#12-integrations)
13. [Release Roadmap](#13-release-roadmap)
14. [Success Metrics & KPIs](#14-success-metrics--kpis)
15. [Monetisation](#15-monetisation)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Open Questions & Decisions Log](#17-open-questions--decisions-log)

---

## 1. Executive Summary

**FORGE** is an AI-powered program intelligence platform for Scrum Masters, Product Managers, Program Managers, and SAFe Release Train Engineers. It unifies three high-frequency, high-pain workflows — story quality analysis, stakeholder communication, and PI planning — into a single, beautifully designed workspace that integrates directly with JIRA.

FORGE is not a project management tool. It is a *thinking partner* for the people who run programs. It absorbs the cognitive overhead of repetitive, high-stakes communications and planning work so that PMs and RTEs can focus on actual leadership.

**The three core modules are:**
- **Quality Gate** — Real-time AI scoring of JIRA stories against configurable rubrics before they enter a sprint
- **Signal** — AI-drafted stakeholder updates in seconds, audience-aware, tone-matched, always on-brand
- **Horizon** — AI-assisted Program Increment planning canvas with capacity modelling, dependency mapping, and risk surfacing

**Target Audience:** Mid-to-large engineering organisations (50–5,000 people) running Scrum or SAFe methodologies, with JIRA as their primary project management tool.

**Business Model:** B2B SaaS, per-seat pricing with team and enterprise tiers.

---

## 2. The Problem

### 2.1 Day in the Life — Empathy Scenarios

#### Scenario A: Adaeze, Scrum Master @ a 200-person FinTech
> It's Monday. Sprint planning starts in 45 minutes. Adaeze opens JIRA and sees 34 stories in the backlog ready for the sprint. She needs to scan each one — does it have acceptance criteria? Is it estimated? Is it linked to an epic? Is the description actually useful or just "as a user I want to do the thing"? She's done this 200 times. She's doing it on autopilot. She misses two stories with vague acceptance criteria. The sprint breaks on day 4. In the retro, someone says "the stories weren't clear enough." She knows. She always knows. But there's no system — just her vigilance, once a week, at 9am on a Monday.

#### Scenario B: Tunde, Senior Program Manager @ a Telco
> Every Friday, Tunde writes four separate stakeholder updates — one for the CTO, one for the product council, one for the engineering team, one for the client. Same sprint. Four different versions of the same truth. He copies from last week, changes dates, changes ticket numbers, re-words the blockers so they don't sound too bad for the CTO but are specific enough for engineering. It takes 2.5 hours. If he had 2.5 hours. He usually has 45 minutes and two meetings in the middle of it.

#### Scenario C: Funmilola, Release Train Engineer @ an Enterprise Bank
> PI Planning is in 3 weeks. Funmilola has 8 Agile Teams. She needs to model capacity, collect team objectives, map dependencies between teams, flag risks, and produce a PI Planning board that makes sense to the executives who show up for the last 30 minutes. She's using a combination of JIRA, Confluence, three spreadsheets, and a Miro board. None of them talk to each other. Every change in JIRA requires a manual update in the spreadsheet. She worked until midnight last Tuesday. She'll do it again next Tuesday.

### 2.2 Core Pain Points (Validated)

| Pain Point | Frequency | Severity | Current Workaround |
|---|---|---|---|
| Story quality review before sprint planning | Weekly | High | Manual check, tribal knowledge |
| Writing multi-audience stakeholder updates | Weekly | High | Copy-paste + manual editing |
| PI Planning preparation & capacity modelling | Quarterly | Critical | Spreadsheets + Miro + JIRA manual |
| Dependency risk visibility across teams | Ongoing | High | Periodic manual reviews |
| Decision audit trail | Ongoing | Medium | Email / Confluence (inconsistent) |
| Retro pattern analysis | Bi-weekly | Medium | None — data sits idle |

### 2.3 Why Now

- Claude API (Sonnet) is now fast and affordable enough for real-time story analysis
- JIRA REST API v3 has mature enough endpoints for deep integration
- The SAFe adoption curve is accelerating in enterprise (Africa, Europe, Southeast Asia) — a currently underserved market
- AI-native tooling expectations have been set by GitHub Copilot, Notion AI, Linear — but nothing meaningful exists for the RTE/PgM persona

---

## 3. User Personas

### Persona 1 — Sam, Scrum Master
**Age:** 28–38 | **Experience:** 2–6 years SM | **Team size:** 6–12 devs

**Goals:**
- Run clean sprints with well-formed stories
- Surface blockers early, not in standups
- Reduce the overhead of ceremony prep

**Frustrations:**
- Stories come in incomplete and it's always his job to chase down POs
- Retro data goes nowhere — same patterns repeat
- Sprint planning takes 3 hours because stories are debated on the spot

**FORGE Value:** Quality Gate catches story gaps before Sam even sees them. He sets the rubric once. The system enforces it forever.

**Quote:** *"I don't want to be the quality police. I want the system to be the quality police."*

---

### Persona 2 — Priya, Product Manager
**Age:** 30–42 | **Experience:** 5–10 years | **Team size:** 1 PM, 8–15 devs

**Goals:**
- Communicate sprint progress without it taking half a day
- Keep leadership aligned without over-communicating
- Maintain a clear history of product decisions

**Frustrations:**
- Status updates are time-consuming and feel repetitive
- Different stakeholders want different levels of detail
- She forgets why certain decisions were made 6 months ago

**FORGE Value:** Signal drafts all four of her weekly updates in 4 minutes. She edits, approves, sends. Decision Logger captures context automatically.

**Quote:** *"I need to write less and communicate more."*

---

### Persona 3 — Marcus, Senior Program Manager
**Age:** 35–50 | **Experience:** 8–15 years | **Scope:** 3–6 teams, cross-functional programs

**Goals:**
- Maintain a program-level view across multiple teams
- Keep dependencies visible and managed
- Produce executive-ready status in minutes, not hours

**Frustrations:**
- No single source of truth across teams
- Dependency tracking is completely manual
- Executive updates require translating technical reality into business language

**FORGE Value:** Signal handles the translation layer. Horizon gives him the program-level dependency map. He spends time on decisions, not documents.

**Quote:** *"My job is to see around corners. Right now I'm too busy writing emails to look up."*

---

### Persona 4 — Funmi, Release Train Engineer
**Age:** 38–52 | **Experience:** 10+ years, SAFe SPC/RTE certified | **Scope:** 5–12 Agile Teams

**Goals:**
- Run high-quality PI Planning events with minimal prep overhead
- Keep the ART health visible between PIs
- Align business and technology stakeholders on objectives

**Frustrations:**
- PI Planning prep is 3 weeks of manual data gathering
- Tools don't talk to each other
- Dependency risks discovered late in PI execution

**FORGE Value:** Horizon is her co-pilot. It ingests JIRA data, models capacity, maps cross-team dependencies, flags risks before planning begins.

**Quote:** *"I need a tool that understands SAFe, not just scrum."*

---

## 4. Jobs To Be Done

```
When I [situation] I want to [motivation] so I can [outcome].
```

| # | When I... | I want to... | So I can... |
|---|---|---|---|
| JTBD-01 | Am about to run sprint planning | Know which stories are incomplete before the meeting | Start on time and avoid 3-hour planning sessions |
| JTBD-02 | Need to update multiple stakeholders after a sprint | Get a draft that's tailored to each audience | Send communications in 10 minutes, not 2 hours |
| JTBD-03 | Am preparing for PI Planning | See a visual capacity model across all my teams | Make realistic commitments and identify risks early |
| JTBD-04 | See a pattern of blockers repeating | Get a systemic analysis, not just a list | Address root causes, not symptoms |
| JTBD-05 | Need to justify a product decision made 6 months ago | Search a structured decision log | Give stakeholders confident answers |
| JTBD-06 | Have dependencies between teams in a PI | See which ones are at risk | Escalate and resolve before they block delivery |

---

## 5. Product Vision & Strategy

### 5.1 Vision Statement
> FORGE makes the invisible work of program management visible — and makes the visible work effortless.

### 5.2 Product Positioning
FORGE sits in the **workflow intelligence** category — not project management, not BI, not standalone AI chat. It is purpose-built infrastructure for the people who run programs.

**Category Differentiation:**
- vs. JIRA: FORGE is not a tracking tool. It is an intelligence layer *on top of* JIRA
- vs. Notion AI: FORGE is deeply contextual, role-aware, and opinionated about PM workflows
- vs. GitHub Copilot: FORGE's domain is program coordination, not code
- vs. Monday.com AI: Far more opinionated, far deeper JIRA integration, SAFe-native

### 5.3 Strategic Bets
1. **JIRA-first**: Most enterprises won't leave JIRA. Be the intelligence layer they didn't know they could have.
2. **SAFe-native vocabulary**: Use the language of Lean-Agile. PI, ART, RTE, Iteration, Feature, Enabler, Capability. This alone differentiates from generic PM AI tools.
3. **Role-based experiences**: A Scrum Master sees a different home screen than an RTE. The tool adapts to the job.
4. **Configurable AI rubrics**: Every organisation has different definitions of quality. FORGE learns yours.

### 5.4 North Star Metric
**Weekly Active Users who take a FORGE-assisted action that directly replaces a manual task** (Quality Gate approvals + Signal sends + Horizon plan updates).

Target: 60% of users perform a North Star action each week.

---

## 6. Information Architecture

```
FORGE App
├── / (Dashboard — role-aware home)
├── /quality-gate
│   ├── /quality-gate/board (Sprint board view with scores)
│   ├── /quality-gate/story/:id (Story detail + AI analysis)
│   ├── /quality-gate/rubrics (Rubric configuration)
│   └── /quality-gate/trends (Quality trend analytics)
├── /signal
│   ├── /signal/new (New update composer)
│   ├── /signal/drafts (Draft updates)
│   ├── /signal/sent (Update history)
│   └── /signal/templates (Custom templates)
├── /horizon
│   ├── /horizon/pi/:id (PI Planning canvas)
│   ├── /horizon/pi/:id/capacity (Capacity model)
│   ├── /horizon/pi/:id/dependencies (Dependency map)
│   ├── /horizon/pi/:id/risks (Risk register)
│   └── /horizon/archive (Past PIs)
├── /settings
│   ├── /settings/jira (JIRA connection & mapping)
│   ├── /settings/team (Team members & roles)
│   ├── /settings/rubrics (Quality Gate rubrics)
│   ├── /settings/personas (Signal audience templates)
│   └── /settings/notifications
└── /onboarding (First-run experience)
```

### 6.1 Global Navigation
- **Left sidebar** (collapsible): Icon rail with module icons + workspace switcher
- **Top bar**: Command palette trigger (⌘K), notifications, user menu, JIRA sync status
- **Command Palette**: Universal search across stories, updates, PIs, settings

---

## 7. Module 1 — Quality Gate

### 7.1 Overview
Quality Gate is a real-time story quality scoring engine. It analyses JIRA user stories against configurable rubrics and assigns a composite score (0–100) with dimension breakdowns and AI-generated improvement suggestions.

### 7.2 Core Features

#### F-QG-01: Story Score Card
- **Trigger:** Automatic on JIRA sync (configurable: every 15min / on demand / webhook)
- **Score dimensions (configurable):**
  - **Completeness** (25pts): Title, description, acceptance criteria present
  - **Clarity** (25pts): No vague verbs (e.g., "handle", "manage", "do"), clear subject and outcome
  - **Estimability** (20pts): Story points assigned, no ambiguous scope signals
  - **Traceability** (15pts): Linked to an Epic/Feature, has a label
  - **Testability** (15pts): Acceptance criteria are verifiable, not subjective
- **Output:** Score badge on each story, full breakdown panel on click

#### F-QG-02: Sprint Health Snapshot
- Pre-sprint view showing distribution of story scores across the upcoming sprint
- "Sprint Health Score" = weighted average of all stories in sprint backlog
- Visual: Radial gauge + story score distribution histogram
- Gated recommendation: "4 stories below threshold — resolve before planning"

#### F-QG-03: AI Improvement Suggestions
- For every story scoring below 70, AI generates:
  - What's missing or weak (specific field + reasoning)
  - A rewritten version of the acceptance criteria (editable)
  - Suggested story split if story is too broad
- One-click: Copy suggestion to JIRA comment or update story directly via API

#### F-QG-04: Rubric Configuration
- Admins can create named rubrics (e.g., "Mobile Team Standard", "Platform Team v2")
- Per-dimension weight adjustment (sliders, must sum to 100)
- Custom keyword blocklist (vague verbs, forbidden terms)
- Rubric assignment per JIRA project or team

#### F-QG-05: Quality Trend Analytics
- 12-week rolling chart: average story quality per sprint
- Breakdown by team, epic, story author
- "Chronic offenders" view: stories that consistently score low
- Correlation chart: Story quality score vs. sprint velocity (if data available)

#### F-QG-06: Slack / Email Gating Alerts
- Configurable: Alert SM/PO if sprint backlog health score drops below X
- Alert format: "Sprint 47 backlog health: 61/100. 6 stories need attention before Friday planning."

### 7.3 User Flow — Story Quality Workflow

```
JIRA Sync → Stories ingested → AI scoring engine runs →
Scores written to FORGE DB → Dashboard updated →
[If score < threshold] → Alert triggered →
SM opens Quality Gate → Reviews low-scored stories →
Accepts AI suggestions → Updates pushed to JIRA →
Sprint planning proceeds with healthy backlog
```

### 7.4 Edge Cases
- Story with no description: Score = 0, quarantine flag shown
- Story in "Done" status: Excluded from active scoring, archived
- AI API timeout: Show last known score + "⚠ Score may be stale" badge
- JIRA rate limit hit: Queue sync, show progress indicator

### 7.5 Acceptance Criteria (Module)
- [ ] Stories sync from JIRA within 60 seconds of creation/update
- [ ] Scoring completes in < 3 seconds per story
- [ ] Score breakdown is explainable (each dimension shows its sub-score and reason)
- [ ] Rubric changes re-score all active stories within 5 minutes
- [ ] JIRA story can be updated from FORGE without leaving the app

---

## 8. Module 2 — Signal

### 8.1 Overview
Signal is an AI-powered stakeholder communication engine. It ingests sprint/program context and generates audience-specific status updates — executive summaries, team digests, client reports — in seconds.

### 8.2 Core Features

#### F-SG-01: Context Ingestion
Signal pulls context from:
- JIRA: Completed stories, open blockers, sprint velocity, carry-overs
- FORGE Quality Gate: Story health score delta
- FORGE Horizon: PI progress indicators (if applicable)
- Manual overrides: PM adds free-text context, wins, risks

#### F-SG-02: Audience Personas
Built-in audience types (fully customisable):
- **Executive / C-Suite**: Business outcomes, risk flags, no technical jargon, RAG status
- **Product Council**: Feature progress, upcoming roadmap, dependencies
- **Engineering Team**: Technical blockers, velocity metrics, architecture decisions
- **Client / External Stakeholder**: Delivery milestones, what's shipped, what's next, plain English

Custom personas: PM defines tone, length, technical level, focus areas, preferred format.

#### F-SG-03: Update Composer
- Split-pane UI: Left = FORGE context panel (data being used), Right = AI-generated draft
- Inline editing with AI assistance (highlight text → "make this more concise", "make this more positive")
- Format selector: Email, Slack message, Confluence page, PDF report
- Version history: All drafts saved, diff view available
- Tone dial: Formal ↔ Conversational (5-step slider)

#### F-SG-04: Audience Router
- One-click: Generate all audience variants from a single sprint context
- Side-by-side comparison view: See all four variants before sending
- "What changed between variants" — highlights the differences in framing

#### F-SG-05: Send & Archive
- Send via: Email (SMTP), Slack (bot), Confluence publish, copy to clipboard
- All sent updates stored in Signal History with metadata (who, when, which audience)
- Searchable archive: "Find all executive updates from Q1 2026"

#### F-SG-06: Decision Logger (Embedded)
- Within any update, PM can flag a decision: "We deprioritised Feature X because..."
- Decisions auto-extracted and stored in a searchable Decision Log
- Decision entries include: date, decision maker, reasoning, affected tickets, linked update

### 8.3 User Flow — Stakeholder Update

```
PM triggers new update (or scheduled trigger fires) →
Signal ingests JIRA sprint data + any manual context →
PM selects audiences (or uses saved set) →
AI generates drafts for each audience simultaneously →
PM reviews in split-pane, edits as needed →
PM approves and sends/exports →
Update archived + decisions logged →
Recipients receive formatted update
```

### 8.4 Signal Templates Library
Pre-built templates:
- Sprint Review Summary
- PI Milestone Report
- Incident / Escalation Brief
- Quarterly Business Review Prep
- Retrospective Summary (external)
- Risk Register Update
- Release Announcement

### 8.5 Acceptance Criteria (Module)
- [ ] Draft generation for all 4 audiences completes within 8 seconds
- [ ] Context panel shows exactly which JIRA data was used to generate each paragraph
- [ ] All sent updates are stored and searchable
- [ ] Inline AI editing responds within 2 seconds
- [ ] Custom persona configuration saved and reusable across updates

---

## 9. Module 3 — Horizon

### 9.1 Overview
Horizon is a SAFe-native PI Planning copilot. It ingests JIRA backlogs, team capacity, and historical velocity to help RTEs and PgMs build, visualise, and stress-test Program Increment plans.

### 9.2 Core Features

#### F-HZ-01: PI Canvas
- Visual planning board: Teams (rows) × Iterations (columns)
- Drag-and-drop JIRA features/stories onto the canvas
- Real-time capacity gauge per team per iteration (green/amber/red)
- Feature cards show: title, story points, assignee team, dependencies, risk flag

#### F-HZ-02: Capacity Modelling Engine
- Inputs:
  - Team size (from JIRA)
  - Historical velocity (auto-calculated from last 6 sprints)
  - Planned time off / holidays (manual input)
  - Innovation & Planning iteration capacity (SAFe default: 10%)
- Output: Recommended capacity per iteration per team
- Alert: "Team Phoenix is 140% committed in Iteration 3 — recommend moving 2 features"

#### F-HZ-03: Dependency Map
- Visual directed graph: Features/Stories as nodes, dependencies as edges
- Color coding: Green (resolved), Amber (at risk), Red (blocker)
- Filter by: Team, ART, Risk level, Iteration
- Auto-detect: AI scans story titles/descriptions for dependency signals and suggests links
- Export: Dependency risk matrix as CSV or Confluence table

#### F-HZ-04: Risk Register (Auto-populated)
- AI scans the PI canvas and flags risks:
  - Over-committed iterations
  - Single-team dependencies on shared services
  - Features with no acceptance criteria entering the PI
  - External dependencies with no owner
- Risk cards: Title, type, impact (H/M/L), likelihood, mitigation suggestion, owner
- PM can accept/dismiss each risk, add notes

#### F-HZ-05: PI Objective Generator
- For each Agile Team, AI drafts PI Objectives based on committed features
- Format: Business outcome + measurable result + stretch goal
- Example: "Deliver payment gateway v2 (12 stories, 80 pts) — Stretch: PCI compliance report automated"
- One-click: Export to Confluence PI Planning template

#### F-HZ-06: PI Health Dashboard
- During PI execution: Live view of progress vs. plan
- Burn-up chart: Planned features vs. completed features
- Dependency health: % resolved vs. at-risk
- Team velocity actuals vs. PI plan
- Predictability score: % of PI objectives on track

#### F-HZ-07: PI Archive & Retrospective
- Every completed PI stored with: plan, actuals, velocity, risks encountered
- Cross-PI comparison: "How did PI 5 compare to PI 4?"
- AI retrospective summary: Patterns in what was over/under-committed

### 9.3 User Flow — PI Planning

```
RTE creates new PI in FORGE →
FORGE ingests JIRA ART backlog →
Capacity modelling runs automatically →
RTE reviews and adjusts capacity inputs →
Features dragged onto PI canvas (or auto-allocated) →
Dependency Map rendered →
Risk Register populated by AI →
Team PI Objectives generated →
RTE reviews, edits, finalises →
Export: PI Plan to Confluence / PDF →
PI enters execution phase →
Horizon switches to live health tracking mode
```

### 9.4 Acceptance Criteria (Module)
- [ ] PI canvas supports up to 12 teams and 6 iterations without performance degradation
- [ ] Capacity model recalculates within 2 seconds of any input change
- [ ] Dependency map renders up to 200 nodes without layout collapse
- [ ] AI risk detection runs on full PI canvas in < 10 seconds
- [ ] Export to Confluence publishes a formatted PI Planning page

---

## 10. Design Language & UI Specifications

### 10.1 Design Philosophy
FORGE uses a design language we call **"Dense Clarity"** — the opposite of the sparse, generic SaaS aesthetic. Inspired by professional tools like Linear, Vercel's dashboard, Raycast, and Figma — but with a warmer, more purposeful colour system suited to high-stakes program work.

> *Dense Clarity: Maximum information, zero cognitive noise. Every pixel earns its place.*

### 10.2 Colour System

```css
/* Base Palette */
--color-canvas:         #080C14;   /* Deepest background */
--color-surface-01:     #0D1220;   /* Primary card surface */
--color-surface-02:     #141926;   /* Secondary surface, modals */
--color-surface-03:     #1C2333;   /* Hover states, dividers */
--color-border:         #252D3D;   /* Subtle borders */
--color-border-strong:  #2E3A52;   /* Active/focused borders */

/* Text */
--color-text-primary:   #E8EDF5;   /* Primary text */
--color-text-secondary: #8A96AB;   /* Secondary / muted */
--color-text-tertiary:  #4A5568;   /* Disabled / placeholder */

/* Brand Accents */
--color-iris:           #7C6AF7;   /* Primary brand — deep violet */
--color-iris-bright:    #A89BF9;   /* Hover / active states */
--color-iris-dim:       #3D3580;   /* Subtle iris backgrounds */
--color-coral:          #F0714B;   /* Alerts, destructive, urgent */
--color-coral-dim:      #5C2A1A;   /* Coral backgrounds */
--color-jade:           #3DD68C;   /* Success, healthy scores */
--color-jade-dim:       #0F3D24;   /* Jade backgrounds */
--color-amber:          #F0AE44;   /* Warnings, at-risk */
--color-amber-dim:      #4A2F0A;   /* Amber backgrounds */
--color-sky:            #4ABFED;   /* Information, links */

/* Score System */
--score-excellent:      #3DD68C;   /* 85–100 */
--score-good:           #7C6AF7;   /* 70–84 */
--score-fair:           #F0AE44;   /* 50–69 */
--score-poor:           #F0714B;   /* 0–49 */
```

### 10.3 Typography

```css
/* Display / Headings */
font-family: 'Syne', sans-serif;
/* Weights: 600, 700, 800 */
/* Used for: Page titles, module names, large metrics */

/* Body / UI */
font-family: 'DM Sans', sans-serif;
/* Weights: 300, 400, 500, 600 */
/* Used for: All body copy, labels, descriptions, buttons */

/* Monospace / Data */
font-family: 'JetBrains Mono', monospace;
/* Weights: 400, 500 */
/* Used for: Story IDs, scores, timestamps, code snippets */

/* Scale */
--text-xs:    11px / 1.4;
--text-sm:    13px / 1.5;
--text-base:  14px / 1.6;
--text-md:    15px / 1.5;
--text-lg:    18px / 1.4;
--text-xl:    22px / 1.3;
--text-2xl:   28px / 1.2;
--text-3xl:   36px / 1.1;
--text-4xl:   48px / 1.0;
```

### 10.4 Spatial System

```css
/* 4px base grid */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

/* Shadows */
--shadow-card: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
--shadow-modal: 0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4);
--shadow-glow-iris: 0 0 20px rgba(124,106,247,0.25);
--shadow-glow-jade: 0 0 20px rgba(61,214,140,0.2);
```

### 10.5 Core UI Components

#### Sidebar Navigation
- Width: 56px (collapsed) / 220px (expanded)
- Toggle: Click rail → expand, click elsewhere → collapse (or pinned)
- Items: Icon + label, active state = iris background pill
- Bottom: Workspace switcher, user avatar, settings
- JIRA sync indicator: Animated dot (idle/syncing/error)

#### Score Ring Component
- Animated SVG ring (stroke-dashoffset animation on mount)
- Center: Large number in JetBrains Mono, score color
- Ring color: score-excellent / score-good / score-fair / score-poor
- Size variants: sm (32px), md (48px), lg (80px), xl (120px)

#### Story Card Component
- Left accent bar: score color
- Header: Story ID (monospace, tertiary) + Title (14px, primary, semibold)
- Meta row: Epic chip + Assignee avatar + Story points badge
- Score badge: Top-right, pill shape, colored
- Expand: Click → slide-down panel with full AI analysis
- Hover: surface-03 background, subtle border-strong

#### Glassmorphism Panel
```css
.glass-panel {
  background: rgba(13, 18, 32, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: var(--radius-lg);
}
```

#### Command Palette (⌘K)
- Full-screen overlay with centred modal
- Fuzzy search across: stories, updates, PIs, settings
- Keyboard navigation: ↑↓ + Enter
- Groups: Recent, Stories, Actions, Navigation
- Animated: Fade + scale-in on open

### 10.6 Motion Design

```
Page transitions:    Fade + subtle translate Y (200ms, ease-out)
Score ring:          0 → value (800ms, spring)
Card hover:          Background colour (150ms, ease)
Sidebar expand:      Width + opacity (200ms, ease-out)
Modal open:          Scale 0.97 → 1, opacity 0 → 1 (180ms, ease-out)
Toast notifications: Slide in from bottom-right (200ms, spring)
Data loading:        Skeleton with shimmer animation (gradient sweep)
```

### 10.7 Responsive Behaviour
- **Primary target:** 1280px+ (desktop, external monitors)
- **Minimum supported:** 1024px
- **Tablet (768px+):** Sidebar collapsed, single-column layouts
- **Mobile:** Read-only mode for dashboards, Signal drafts accessible

---

## 11. Technical Architecture

### 11.1 Stack Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│  Next.js 15 · TypeScript · Tailwind · Framer Motion │
│  Radix UI · Zustand · TanStack Query · React Flow   │
└──────────────────────────┬──────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────▼──────────────────────────┐
│                  NEXT.JS APP SERVER                  │
│         API Routes · Server Actions · Edge          │
└────────┬──────────────┬──────────────┬──────────────┘
         │              │              │
┌────────▼───┐  ┌───────▼──────┐  ┌───▼───────────────┐
│  Supabase  │  │ Claude API   │  │   Atlassian JIRA   │
│ PostgreSQL │  │ (Sonnet 4)   │  │   REST API v3      │
│ Auth + RT  │  │              │  │                    │
└────────────┘  └──────────────┘  └───────────────────┘
         │
┌────────▼───────────────────────────────────────────┐
│                    BACKGROUND JOBS                  │
│  JIRA Sync · Score Computation · Alert Dispatch    │
│  (Vercel Cron / Inngest)                           │
└────────────────────────────────────────────────────┘
```

### 11.2 Key Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | SSR, streaming, server actions, best DX |
| Styling | Tailwind CSS v4 + CSS custom properties | Speed + design system tokens |
| Animation | Framer Motion | Best React animation library |
| UI primitives | Radix UI | Accessible, unstyled, composable |
| State | Zustand | Lightweight, no boilerplate |
| Data fetching | TanStack Query v5 | Caching, background sync, optimistic updates |
| Graph/Canvas | React Flow | PI dependency map and canvas |
| Database | Supabase (PostgreSQL) | Realtime, auth, managed, generous free tier |
| Auth | Supabase Auth + Clerk (fallback) | SSO/SAML for enterprise |
| AI | Anthropic Claude claude-sonnet-4-20250514 | Best reasoning, structured output, speed |
| Background jobs | Inngest | Type-safe, serverless-friendly job queue |
| Deployment | Vercel | Zero-config Next.js, edge network |
| Monitoring | Sentry + Vercel Analytics | Error tracking + performance |

### 11.3 Database Schema (Core Tables)

```sql
-- Workspaces (multi-tenant)
CREATE TABLE workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  plan        TEXT DEFAULT 'free', -- free | pro | enterprise
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id              UUID PRIMARY KEY,
  workspace_id    UUID REFERENCES workspaces(id),
  email           TEXT UNIQUE NOT NULL,
  display_name    TEXT,
  role            TEXT NOT NULL, -- sm | pm | pgm | rte | admin
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- JIRA Connections
CREATE TABLE jira_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id),
  site_url        TEXT NOT NULL,
  access_token    TEXT NOT NULL, -- encrypted
  refresh_token   TEXT,
  token_expires   TIMESTAMPTZ,
  last_synced_at  TIMESTAMPTZ,
  sync_status     TEXT DEFAULT 'idle'
);

-- Stories (mirrored from JIRA)
CREATE TABLE stories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id),
  jira_id         TEXT NOT NULL,
  jira_key        TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  acceptance_criteria TEXT,
  story_points    INTEGER,
  status          TEXT,
  assignee_id     TEXT,
  epic_key        TEXT,
  sprint_id       TEXT,
  labels          TEXT[],
  jira_updated_at TIMESTAMPTZ,
  synced_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Scores
CREATE TABLE story_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id        UUID REFERENCES stories(id),
  rubric_id       UUID REFERENCES rubrics(id),
  total_score     INTEGER NOT NULL,
  completeness    INTEGER,
  clarity         INTEGER,
  estimability    INTEGER,
  traceability    INTEGER,
  testability     INTEGER,
  ai_suggestions  JSONB,
  scored_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Rubrics
CREATE TABLE rubrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id),
  name            TEXT NOT NULL,
  is_default      BOOLEAN DEFAULT FALSE,
  weights         JSONB NOT NULL, -- { completeness: 25, clarity: 25, ... }
  blocklist       TEXT[], -- vague verbs to penalise
  threshold       INTEGER DEFAULT 70,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Signal Updates
CREATE TABLE signal_updates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id),
  author_id       UUID REFERENCES users(id),
  sprint_ref      TEXT,
  context_data    JSONB, -- raw JIRA context used
  audiences       TEXT[], -- executive | team | client | council
  drafts          JSONB, -- { audience: draft_text }
  status          TEXT DEFAULT 'draft', -- draft | sent | archived
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions
CREATE TABLE decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id),
  signal_update_id UUID REFERENCES signal_updates(id),
  made_by_id      UUID REFERENCES users(id),
  title           TEXT NOT NULL,
  reasoning       TEXT,
  affected_tickets TEXT[],
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Program Increments
CREATE TABLE program_increments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id),
  name            TEXT NOT NULL, -- "PI 7 — Q2 2026"
  start_date      DATE,
  end_date        DATE,
  status          TEXT DEFAULT 'planning', -- planning | active | completed
  iterations      INTEGER DEFAULT 5,
  canvas_data     JSONB, -- denormalised canvas state
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- PI Teams
CREATE TABLE pi_teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_id           UUID REFERENCES program_increments(id),
  name            TEXT NOT NULL,
  jira_board_id   TEXT,
  capacity_per_iteration INTEGER[],
  velocity_history INTEGER[]
);

-- PI Dependencies
CREATE TABLE pi_dependencies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_id           UUID REFERENCES program_increments(id),
  from_story_id   UUID REFERENCES stories(id),
  to_story_id     UUID REFERENCES stories(id),
  from_team_id    UUID REFERENCES pi_teams(id),
  to_team_id      UUID REFERENCES pi_teams(id),
  status          TEXT DEFAULT 'open', -- open | resolved | at_risk | blocked
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.4 AI Integration Architecture

All AI calls are routed through a central `forge/lib/ai/` service layer:

```typescript
// lib/ai/score-story.ts
// lib/ai/generate-update.ts
// lib/ai/generate-pi-objectives.ts
// lib/ai/detect-dependencies.ts
// lib/ai/analyze-risks.ts
```

**Prompting strategy:**
- System prompts are versioned and stored in `lib/ai/prompts/`
- All prompts use structured XML output for reliability
- Temperature: 0.3 for scoring (deterministic), 0.7 for drafting (creative)
- All AI responses streamed to client using Next.js streaming

**Token budget estimates per operation:**
| Operation | Input tokens | Output tokens | Cost @Sonnet |
|---|---|---|---|
| Score one story | ~400 | ~300 | ~$0.0011 |
| Generate 4-audience update | ~1,200 | ~2,000 | ~$0.0096 |
| Full PI risk analysis (20 features) | ~3,000 | ~1,500 | ~$0.0135 |
| PI objective generation (8 teams) | ~2,400 | ~1,200 | ~$0.0108 |

### 11.5 Security

- All JIRA tokens stored encrypted at rest (AES-256, key in Vault/Supabase secrets)
- Row-level security (RLS) on all Supabase tables — workspace isolation enforced at DB level
- API routes protected with middleware (session validation + workspace membership check)
- No raw JIRA data stored beyond what's needed (only fields required for scoring/display)
- GDPR: Data deletion flow — workspace delete triggers cascade delete + JIRA token revocation
- Rate limiting: 100 req/min per workspace on AI endpoints (Redis token bucket)

---

## 12. Integrations

### 12.1 JIRA (Core)
- **Auth:** OAuth 2.0 (3-legged, Atlassian identity)
- **Read:** Projects, Boards, Sprints, Stories, Epics, Labels, Velocity (Greenhopper API)
- **Write:** Story updates (description, acceptance criteria, comments), custom field writes
- **Webhooks:** Receive story created/updated events for real-time sync

### 12.2 Slack
- **Scope:** Signal send, Quality Gate alerts
- **Integration:** OAuth app install → bot token stored → messages via Web API
- **Features:** Post update to channel, @mention specific users, button interactions

### 12.3 Confluence
- **Scope:** Signal publish, Horizon PI Plan export, Retro summaries
- **Integration:** Via Atlassian Cloud API (same OAuth as JIRA)
- **Features:** Create/update pages with FORGE-generated content, structured templates

### 12.4 Email (SMTP)
- Signal send via SendGrid / Resend
- Templated HTML emails for each audience type
- Open tracking (optional, togglable)

### 12.5 Future Integrations (v2+)
- GitHub / GitLab (link PRs to stories, enrich score context)
- Linear (alternative to JIRA — same Quality Gate logic)
- Google Meet / Zoom transcripts (Meeting → Ticket feature)
- Notion (Decision Log export, roadmap sync)
- Azure DevOps Boards

---

## 13. Release Roadmap

### Phase 0 — Foundation (Weeks 1–2)
**Goal:** Running app, authenticated, JIRA connected

**Deliverables:**
- [ ] Next.js 15 project scaffolded with full design system
- [ ] Supabase project setup, schema migrated, RLS enabled
- [ ] Auth: sign up / login / invite flows (Supabase Auth)
- [ ] JIRA OAuth integration + first sync
- [ ] Sidebar nav, command palette shell, loading states
- [ ] Design tokens, component library (Score Ring, Story Card, etc.)
- [ ] Dark mode, typography, colour system implemented

**Exit criteria:** User can log in, connect JIRA, see their stories in FORGE.

---

### Phase 1 — Quality Gate Alpha (Weeks 3–5)
**Goal:** Story scoring works end-to-end

**Deliverables:**
- [ ] AI scoring engine (all 5 dimensions, default rubric)
- [ ] Story list view with score badges
- [ ] Story detail panel with AI analysis + suggestions
- [ ] Sprint Health Snapshot view
- [ ] Rubric configuration UI (weights, blocklist)
- [ ] Basic trend chart (last 6 sprints)
- [ ] Slack alert for low sprint health score

**Exit criteria:** SM can see scored stories, understand why a score is low, and use a suggestion to improve it before sprint planning.

---

### Phase 2 — Signal Beta (Weeks 6–8)
**Goal:** Stakeholder update drafting works for real users

**Deliverables:**
- [ ] Context ingestion (JIRA sprint data)
- [ ] 4 built-in audience personas
- [ ] Split-pane update composer
- [ ] Streaming AI draft generation
- [ ] Send via Email + Slack
- [ ] Update history & archive
- [ ] Decision Logger (inline flagging)
- [ ] Custom persona configuration

**Exit criteria:** PM can generate, edit, and send a professional stakeholder update in under 5 minutes.

---

### Phase 3 — Horizon Beta (Weeks 9–13)
**Goal:** RTE can plan a complete PI in FORGE

**Deliverables:**
- [ ] PI creation flow (name, dates, teams, iterations)
- [ ] PI canvas (React Flow): teams × iterations grid
- [ ] Feature cards draggable onto canvas
- [ ] Capacity modelling engine (velocity history + manual inputs)
- [ ] Dependency map (React Flow graph)
- [ ] Auto-detected dependency suggestions (AI)
- [ ] Risk Register (AI-populated)
- [ ] PI Objective generator (AI)
- [ ] Export: Confluence PI Planning page
- [ ] PI execution health dashboard (burn-up, dependency status)

**Exit criteria:** RTE can go from empty canvas to complete PI plan with objectives, capacity model, and risk register in one session.

---

### Phase 4 — Hardening & Launch Prep (Weeks 14–16)
**Goal:** Production-ready, polished, monitored

**Deliverables:**
- [ ] Performance audit (Lighthouse, bundle size, Core Web Vitals)
- [ ] Full Sentry integration (error tracking + performance)
- [ ] Onboarding flow (3-step: connect JIRA → configure rubric → first score)
- [ ] In-app help tooltips and empty states
- [ ] End-to-end test suite (Playwright)
- [ ] Multi-workspace support tested
- [ ] Billing integration (Stripe — free / pro / enterprise)
- [ ] Documentation site (Mintlify or Nextra)
- [ ] Security audit (token handling, RLS policies reviewed)
- [ ] Email onboarding sequence (3 emails: day 0, day 3, day 7)

---

### v1.0 GA Launch (Week 17)
**Channels:** Product Hunt, LinkedIn, Agile/SAFe community posts, direct outreach to RTE networks

**Pricing at launch:**
| Tier | Price | Includes |
|---|---|---|
| Starter | Free | 1 JIRA project, Quality Gate only, 50 stories/mo |
| Pro | $29/seat/mo | All modules, unlimited stories, Slack integration |
| Team | $19/seat/mo (5+ seats) | Pro + Confluence export, custom rubrics |
| Enterprise | Custom | SSO, SLA, dedicated support, on-prem option |

---

### v1.1 — Post-Launch (Weeks 18–24)
- Quality Gate: GitHub PR link enrichment
- Signal: Google Docs / Notion export
- Horizon: SAFe ART health metrics dashboard
- Retro Intelligence (new module — tracks retro patterns across sprints)
- Mobile-responsive read mode
- API access (beta) for enterprise integrations

---

## 14. Success Metrics & KPIs

### Acquisition
- Target: 500 sign-ups in 60 days post-launch
- Source breakdown: 40% product communities, 30% LinkedIn, 20% SEO, 10% direct

### Activation
- Metric: User completes first North Star action within 7 days
- Target: 45% activation rate

### Engagement
- North Star: % of weekly active users taking a FORGE-assisted action
- Target: 60% by Month 3
- Quality Gate: Avg stories scored per user per week — Target: 20+
- Signal: Avg updates drafted per user per week — Target: 2+

### Retention
- D30 retention: 50% (user returns in week 4)
- M3 retention: 35%

### Revenue
- Month 3: $5,000 MRR
- Month 6: $20,000 MRR
- Month 12: $80,000 MRR

### Quality Metrics
- AI scoring accuracy: PM satisfaction ≥ 4.0/5 on score accuracy
- Signal draft quality: % of drafts sent with < 20% edits — Target: 60%
- P95 AI response time: < 5 seconds for scoring, < 10 seconds for update generation

---

## 15. Monetisation

### Pricing Philosophy
- **Free tier is genuinely useful** — we want individual SMs and PMs to adopt organically
- **Upgrade triggers are natural**: Free tier limits hit during real work, not artificially
- **Team pricing drives viral growth**: One power user invites their team

### Feature Gates

| Feature | Free | Pro | Team | Enterprise |
|---|---|---|---|---|
| JIRA projects | 1 | Unlimited | Unlimited | Unlimited |
| Stories scored/mo | 50 | Unlimited | Unlimited | Unlimited |
| Quality Gate (basic) | ✓ | ✓ | ✓ | ✓ |
| Custom rubrics | — | ✓ | ✓ | ✓ |
| Signal updates | 5/mo | Unlimited | Unlimited | Unlimited |
| Custom personas | — | ✓ | ✓ | ✓ |
| Horizon (PI Planning) | — | ✓ | ✓ | ✓ |
| Confluence export | — | — | ✓ | ✓ |
| SSO / SAML | — | — | — | ✓ |
| API access | — | — | — | ✓ |
| SLA | — | — | — | ✓ |

---

## 16. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| JIRA API rate limits hit during heavy sync | Medium | High | Queue-based sync with exponential backoff; per-workspace rate budgets |
| Claude API cost higher than modelled at scale | Medium | Medium | Prompt caching; score only on-demand for Pro users; batch scoring for Free |
| JIRA OAuth token expiry mid-session | Medium | High | Silent token refresh; background re-auth job |
| Low PI Planning adoption (complex feature) | Medium | High | Build Quality Gate + Signal first; Horizon as upsell |
| Enterprise security review blocks adoption | Low | High | SOC 2 Type I roadmap from Month 6; offer self-hosted export option |
| User edits AI suggestions heavily → perceived low value | Medium | High | Capture edit distance; use as feedback loop for prompt improvement |
| JIRA schema variations between orgs (custom fields) | High | Medium | Flexible field mapping in settings; fallback scoring if fields missing |

---

## 17. Open Questions & Decisions Log

| # | Question | Decision | Owner | Date |
|---|---|---|---|---|
| OQ-01 | Should Horizon support non-SAFe orgs (plain Scrum multi-team)? | Yes — detect from workspace config, show Scrum view by default | Product | TBD |
| OQ-02 | Do we store full story descriptions in our DB or only score metadata? | Store full text for scoring; purge descriptions older than 90 days (configurable) | Eng | TBD |
| OQ-03 | Should Signal support real-time collaborative editing? | Defer to v1.2 — add co-author mode | Product | TBD |
| OQ-04 | Mobile app (native) vs. mobile-responsive web? | Mobile-responsive web in v1; native app in v2 if mobile DAU > 15% | Product | TBD |
| OQ-05 | Should rubric scoring run server-side or client-side? | Always server-side — protect AI prompts, ensure consistency | Eng | TBD |

---

*Document ends. Next: CLAUDE.md (build instructions for Claude Code)*
