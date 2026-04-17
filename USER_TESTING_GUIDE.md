# FORGE User Testing Guide

This guide explains how to run, test, and experience the FORGE application as an end user.

---

## Quick Start

### 1. Start the Development Server

```bash
cd C:\Users\Micah.Apabiekun\Documents\Projects\forge
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Testing Flow

### Step 1: Authentication

**Sign Up (New User)**
1. Go to http://localhost:3000/signup
2. Fill in:
   - Full name
   - Work email (use a real email to receive verification)
   - Company name (optional)
   - Password (min 8 characters)
3. Click "Create account"
4. Check your email for verification link
5. Click the link to verify

**Alternative: OAuth Login**
- Click "Google" or "GitHub" button for social login
- Complete OAuth flow

**Login (Existing User)**
1. Go to http://localhost:3000/login
2. Enter email and password
3. Click "Sign in"

---

### Step 2: Onboarding

After first login, you'll be redirected to `/onboarding`:

1. **Welcome Screen** - Click "Get Started"
2. **Workspace Setup**
   - Enter workspace name (e.g., "My Team")
   - Select team size
   - Click "Continue"
3. **Role Selection**
   - Choose your role (Scrum Master, Product Manager, etc.)
   - Click "Complete Setup"
4. Automatically redirected to dashboard

---

### Step 3: Dashboard

The main dashboard (`/`) shows:
- **Sprint Health** - Overall score ring
- **Stories at Risk** - Count of low-scoring stories
- **Updates This Week** - Signal updates count
- **Active PIs** - Program Increment count
- **Stories Needing Attention** - List of low-scoring stories
- **Quick Actions** - Links to main features

---

## Feature Testing

### Quality Gate (`/quality-gate`)

**Purpose:** AI-powered story quality analysis

**What You'll See:**
- Sprint health snapshot (left panel)
- Story list with score rings (right panel)
- Filter/search controls

**Test Actions:**
1. **View Stories** - See mock story cards with scores
2. **Filter by Score** - Click "Score" dropdown, select tier (Excellent/Good/Fair/Poor)
3. **Search** - Type in search box to filter stories
4. **Change View** - Toggle between grid/list view
5. **Select Sprint** - Change sprint from dropdown
6. **Score Sprint** - Click "Score Sprint" button (triggers AI scoring)

**Score Color Guide:**
| Score | Color | Meaning |
|-------|-------|---------|
| 85-100 | Green (Jade) | Excellent |
| 70-84 | Purple (Iris) | Good |
| 50-69 | Yellow (Amber) | Fair |
| 0-49 | Red (Coral) | Poor |

**Story Detail:**
- Click a story card to view `/quality-gate/story/[id]`
- See dimension breakdown (Completeness, Clarity, etc.)
- View AI suggestions for improvement

---

### Signal (`/signal`)

**Purpose:** AI-generated stakeholder updates

**Pages:**
- `/signal` - Update history
- `/signal/new` - Create new update

**Test Actions:**
1. Go to `/signal/new`
2. Select audiences (Executive, Team Lead, etc.)
3. Click "Generate Draft" to trigger AI
4. Edit the generated content
5. Send or save as draft

---

### Horizon (`/horizon`)

**Purpose:** PI Planning with visual canvas

**Pages:**
- `/horizon` - PI list
- `/horizon/[piId]` - PI canvas (React Flow)

**Test Actions:**
1. View list of Program Increments
2. Click a PI to open the canvas
3. Drag feature cards between iterations
4. View dependency map
5. Check capacity model
6. Review risk register

---

### Settings (`/settings`)

**Pages:**
- `/settings` - General settings
- `/settings/jira` - JIRA integration
- `/settings/team` - Team management
- `/settings/billing` - Subscription/billing

**Test JIRA Integration:**
1. Go to `/settings/jira`
2. Click "Connect JIRA"
3. Complete OAuth flow (requires JIRA_CLIENT_ID/SECRET in env)
4. Once connected, click "Sync Now"
5. Stories should appear in Quality Gate

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Esc` | Close modals/palettes |

---

## Current Limitations

### 1. Mock Data
The Quality Gate page (`/quality-gate`) currently uses **hardcoded mock data** instead of real database queries. This means:
- You'll see the same 4 sample stories regardless of JIRA sync
- Scoring works visually but doesn't persist

### 2. JIRA Integration Requires Setup
To test real JIRA integration:
1. Create a JIRA OAuth app at https://developer.atlassian.com/console/
2. Add credentials to `.env.local`:
   ```
   JIRA_CLIENT_ID=your-client-id
   JIRA_CLIENT_SECRET=your-client-secret
   ```
3. Restart the dev server

### 3. AI Features Require API Key
The Gemini API key is configured, but AI features may fail if:
- Rate limits are hit
- API key is invalid/expired

### 4. Email Verification
Sign-up email verification requires valid Resend API key (configured).

---

## Testing Checklist

### Authentication
- [ ] Sign up with email/password
- [ ] Receive and click verification email
- [ ] Login with credentials
- [ ] Login with Google OAuth
- [ ] Login with GitHub OAuth
- [ ] Logout
- [ ] Password reset flow

### Onboarding
- [ ] Complete all 3 steps
- [ ] Verify redirect to dashboard

### Dashboard
- [ ] All stat cards render
- [ ] Score rings animate
- [ ] Quick actions navigate correctly
- [ ] Refresh button works

### Quality Gate
- [ ] Story list displays
- [ ] Score filter works
- [ ] Search works
- [ ] View mode toggle works
- [ ] Sprint selector works
- [ ] Story detail opens

### Signal
- [ ] Composer loads
- [ ] Audience selector works
- [ ] AI draft generation (if API works)

### Horizon
- [ ] PI list displays
- [ ] Canvas loads (React Flow)
- [ ] Nodes are draggable

### Settings
- [ ] All pages load
- [ ] Forms are functional

### UI/UX
- [ ] Dark theme renders correctly
- [ ] Responsive on mobile
- [ ] Animations smooth
- [ ] No console errors

---

## Troubleshooting

### "Missing Supabase environment variables"
Ensure `.env.local` has valid Supabase credentials.

### Redirect loop on login
Clear browser cookies and local storage, then try again.

### "Failed to load dashboard data"
Check browser console for errors. Likely database or auth issue.

### AI scoring fails
Check Gemini API key validity and rate limits.

### JIRA connect fails
Ensure JIRA OAuth credentials are set in `.env.local`.

---

## Running Automated Tests

```bash
# Unit tests
npm run test:run

# E2E tests (requires dev server)
npm run e2e

# E2E with visual browser
npm run e2e:headed
```

---

## Browser Support

Tested on:
- Chrome (recommended)
- Firefox
- Safari
- Edge

Mobile browsers work but experience is optimized for desktop.
