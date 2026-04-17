# FORGE — Complete Setup Guide
> End-to-end environment setup for building FORGE with Claude Code

---

## Prerequisites Checklist

Before you open VS Code, confirm you have everything below installed and configured.

### Required Software

| Tool | Version | Install |
|---|---|---|
| Node.js | 20.x LTS or 22.x | https://nodejs.org or `nvm install 20` |
| npm | 10.x+ (ships with Node 20) | `npm -v` to verify |
| Git | 2.40+ | https://git-scm.com |
| VS Code | 1.95+ | https://code.visualstudio.com |
| Claude Code | Latest | `npm install -g @anthropic-ai/claude-code` |
| Supabase CLI | Latest | `npm install -g supabase` |
| Vercel CLI | Latest | `npm install -g vercel` |

### Required Accounts

| Service | Purpose | Free Tier? |
|---|---|---|
| Anthropic Console | Claude API key | Yes (limited) |
| Supabase | Database + Auth | Yes (generous) |
| Atlassian Developer | JIRA OAuth app | Yes |
| Vercel | Deployment | Yes |
| Inngest | Background jobs | Yes |
| Resend | Email sending | Yes (100/day) |
| Sentry | Error monitoring | Yes |

---

## Step 1 — Clone and Bootstrap

```bash
# Create project directory
mkdir forge && cd forge

# Initialise git
git init

# Create the project using Claude Code
claude code

# Claude Code will read CLAUDE.md and begin scaffolding
# See "Claude Code Usage" section below for commands
```

---

## Step 2 — Anthropic API Setup

1. Go to https://console.anthropic.com
2. Create a new API key — name it "FORGE Development"
3. Copy the key — you'll add it to `.env.local` as `ANTHROPIC_API_KEY`

**Important:** The project uses `claude-sonnet-4-20250514` exclusively. Do not change this.

**Estimated costs during development:**
- Active development day (100 story scores + 10 updates): ~$0.50
- Full test suite run: ~$1.20
- Monthly active team of 10 (Pro plan usage): ~$8–15

---

## Step 3 — Supabase Setup

### 3.1 Create a Supabase Project
```bash
# Login to Supabase CLI
supabase login

# Initialise Supabase in your project root
supabase init

# Link to a remote project (create one at supabase.com first)
supabase link --project-ref YOUR_PROJECT_REF
```

### 3.2 Run Migrations
```bash
# Apply all migrations to your remote project
supabase db push

# Or run locally with Supabase local development
supabase start
# This starts a local Postgres + Auth + Storage instance at http://localhost:54321
```

### 3.3 Get Your Keys
From your Supabase project dashboard → Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (server-side only, never expose to client)

### 3.4 Generate TypeScript Types
```bash
supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts
```

Re-run this every time you change the database schema.

---

## Step 4 — Atlassian JIRA OAuth App Setup

This is required for JIRA integration. Follow these steps exactly.

### 4.1 Create Developer App
1. Go to https://developer.atlassian.com/console/myapps/
2. Click "Create" → "OAuth 2.0 integration"
3. Name it: "FORGE (Development)"
4. Click "Create"

### 4.2 Configure Permissions
In your app settings → "Permissions":

Add the following JIRA scopes:
```
read:jira-work        — Read issues, projects, sprints
write:jira-work       — Write issue fields, add comments
read:jira-user        — Read user profiles
offline_access        — Refresh tokens (required for background sync)
```

### 4.3 Configure Callback URL
Under "Authorization" → "Add callback URL":
```
Development:   http://localhost:3000/api/jira/callback
Production:    https://your-domain.com/api/jira/callback
```

### 4.4 Copy Credentials
From "Settings":
- `JIRA_CLIENT_ID` — Client ID
- `JIRA_CLIENT_SECRET` — Client secret

---

## Step 5 — Inngest Setup

```bash
# Install Inngest CLI
npm install -g inngest-cli

# Start Inngest Dev Server (runs alongside your Next.js app)
npx inngest-cli@latest dev -u http://localhost:3000/api/webhooks/inngest
```

From https://www.inngest.com:
1. Create a free account
2. Create a new app
3. Copy `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

---

## Step 6 — Environment Variables

Create `.env.local` in the project root:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit with your values
code .env.local
```

Fill in all values:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# JIRA
JIRA_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
JIRA_CLIENT_SECRET=ATOA...
JIRA_REDIRECT_URI=http://localhost:3000/api/jira/callback

# Inngest
INNGEST_EVENT_KEY=evt_...
INNGEST_SIGNING_KEY=signkey_...

# Resend (email)
RESEND_API_KEY=re_...

# Sentry (optional for development)
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## Step 7 — VS Code Setup

### Required Extensions
Install these before opening the project:

```bash
# Install via command line
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension Prisma.prisma
code --install-extension mtxr.sqltools
code --install-extension usernamehw.errorlens
code --install-extension antfu.iconify
```

### Recommended VS Code Settings
Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## Step 8 — Claude Code Configuration

### Install Claude Code
```bash
npm install -g @anthropic-ai/claude-code
```

### Authenticate Claude Code
```bash
claude auth login
# Follow the browser prompt to authenticate with your Anthropic account
```

### Run Claude Code in FORGE
```bash
# Navigate to your project root
cd forge

# Start Claude Code — it will automatically find and read CLAUDE.md
claude code

# Claude Code will read:
#   1. CLAUDE.md (primary build instructions)
#   2. AGENTS.md (agent workflow configuration)
# And begin building the project in the correct order.
```

### Recommended Claude Code Commands

```bash
# Build the full project from scratch (follow the build order in CLAUDE.md)
claude code "Build the FORGE project following CLAUDE.md build order, starting with Phase 0"

# Build a specific module
claude code "Build the Quality Gate module as specified in AGENTS.md Agent 4"

# Fix a specific issue
claude code "The score ring animation is not triggering on mount — fix it"

# Add a specific feature
claude code "Add the Decision Logger to the Signal composer as specified in PRD section 8.2 F-SG-06"

# Run tests
claude code "Write and run Vitest unit tests for lib/ai/score-story.ts"
```

---

## Step 9 — Start Development

```bash
# Start all services simultaneously (use a tool like concurrently)
npx concurrently \
  "npm run dev" \
  "npx inngest-cli@latest dev -u http://localhost:3000/api/webhooks/inngest" \
  "supabase start"
```

Or run them in separate terminal windows:

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Inngest Dev Server
npx inngest-cli@latest dev -u http://localhost:3000/api/webhooks/inngest

# Terminal 3 — Supabase Local (optional — use remote Supabase if preferred)
supabase start
```

Open http://localhost:3000 — you should see the FORGE login page.

---

## Step 10 — First Run Verification

Work through this checklist after first boot:

```
□ App loads at http://localhost:3000 without console errors
□ Sign up creates a new user and workspace in Supabase
□ Login redirects to dashboard
□ JIRA OAuth flow completes (Settings → JIRA → Connect)
□ At least one JIRA project appears after connection
□ Manual sync brings stories into the Quality Gate board
□ Score a story — score ring animates with a result
□ Generate a Signal update — streaming draft appears in composer
□ Inngest dashboard (http://localhost:8288) shows job history
```

---

## Database Management

### View Data Locally
```bash
# Open Supabase Studio at http://localhost:54323
supabase studio
```

### Reset Database
```bash
# WARNING: This deletes all data
supabase db reset
```

### Create a New Migration
```bash
supabase migration new add_retro_table
# Edit the generated file in supabase/migrations/
supabase db push
```

---

## Deployment to Vercel

```bash
# Login to Vercel
vercel login

# Link project (run from project root)
vercel link

# Add environment variables
vercel env add ANTHROPIC_API_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all variables from .env.local

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Production Checklist
```
□ All env vars set in Vercel dashboard
□ JIRA callback URL updated to production domain
□ Supabase RLS policies tested on production data
□ Sentry DSN points to production project
□ Inngest configured for production (webhook URL updated)
□ Custom domain configured in Vercel
□ Analytics enabled (Vercel Analytics)
```

---

## Common Issues & Fixes

### "JIRA OAuth callback fails"
- Check `JIRA_REDIRECT_URI` matches exactly what's registered in Atlassian Developer Console
- Ensure `offline_access` scope is included

### "Supabase RLS blocking queries"
- Confirm user's JWT includes `workspace_id` claim
- Check Supabase Auth → JWT template includes workspace_id
- Use Supabase Table Editor → run query as authenticated user to debug

### "Claude API rate limit on scoring"
- Reduce sync frequency in Inngest function (increase interval)
- Enable score caching: only re-score if story was updated since last score

### "React Flow canvas performance issues"
- Ensure you're not re-rendering the whole canvas on state changes
- Use `useNodesState` / `useEdgesState` from React Flow (not external state)
- Limit feature cards to 100 visible at once (virtualise if more)

### "Inngest jobs not triggering"
- Confirm Inngest Dev Server is running (`http://localhost:8288`)
- Confirm webhook route exists at `/api/webhooks/inngest`
- Check `INNGEST_EVENT_KEY` is correct

---

## Architecture Reference

```
Local Dev Ports:
  3000  — Next.js app
  54321 — Supabase API (local)
  54323 — Supabase Studio (local)
  8288  — Inngest Dev Server

Production:
  Vercel (Next.js) → Supabase (DB/Auth) → Anthropic API
                  ↘ Inngest (jobs)
                  ↘ JIRA (OAuth + REST)
                  ↘ Resend (email)
```

---

## Support & Resources

- PRD: `PRD.md` — Full product requirements
- Build instructions: `CLAUDE.md` — Claude Code instructions
- Agent workflows: `AGENTS.md` — Multi-agent task breakdown
- Design system: `DESIGN_SYSTEM.md` — Tokens, components, specs

External documentation:
- Next.js App Router: https://nextjs.org/docs/app
- Supabase: https://supabase.com/docs
- Anthropic Claude API: https://docs.anthropic.com
- Atlassian JIRA API: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- React Flow: https://reactflow.dev/docs
- Inngest: https://www.inngest.com/docs
- Framer Motion: https://www.framer.com/motion/
