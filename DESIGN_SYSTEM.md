# DESIGN_SYSTEM.md — FORGE Design Language
> Authoritative design specification. All UI must conform to this document.

---

## Design Philosophy: Dense Clarity

FORGE is built for professionals who live in information-dense tools — JIRA, Confluence, spreadsheets, Miro. They are comfortable with complexity. They are *frustrated* by tools that are too simple, too spacious, too slow to reveal information.

**Dense Clarity** means:
- Show as much relevant information as possible in the initial viewport
- No unnecessary whitespace — every spacing decision is intentional
- Progressive disclosure: more detail on hover/click, not on a different page
- Visual hierarchy through contrast and weight, not just size
- Dark background to reduce eye strain during 8+ hour work days

**References (study these, don't copy):**
- Linear — information density, monospace metrics, status badge system
- Vercel Dashboard — dark surface system, table design, realtime indicators
- Raycast — command palette, keyboard-first, tight typography
- Figma UI3 — dense toolbars, multi-panel layouts
- GitHub's Primer — systematic spacing, semantic colour

**Do NOT reference:**
- Notion (too editorial/minimal for this use case)
- Trello (too visual/card-based)
- Any "AI tool" with purple gradients on white

---

## Colour System

```css
/* styles/globals.css */

:root {
  /* ━━━━━━━━━━ BACKGROUNDS ━━━━━━━━━━ */
  --color-canvas:         #080C14;   /* Deepest background — page background */
  --color-surface-01:     #0D1220;   /* Primary card / panel surface */
  --color-surface-02:     #141926;   /* Secondary surface, modal backgrounds */
  --color-surface-03:     #1C2333;   /* Hover backgrounds, input fills */
  --color-surface-04:     #222C3E;   /* Active/selected backgrounds */

  /* ━━━━━━━━━━ BORDERS ━━━━━━━━━━ */
  --color-border:         #1E2840;   /* Default border */
  --color-border-strong:  #2A3654;   /* Focus / active border */
  --color-border-subtle:  #141C2E;   /* Very subtle separators */

  /* ━━━━━━━━━━ TEXT ━━━━━━━━━━ */
  --color-text-primary:   #E4EAFA;   /* Main text */
  --color-text-secondary: #7D8CA5;   /* Muted / secondary labels */
  --color-text-tertiary:  #414F66;   /* Placeholder / disabled */
  --color-text-inverse:   #0A0E1A;   /* Text on bright backgrounds */

  /* ━━━━━━━━━━ BRAND — IRIS ━━━━━━━━━━ */
  --color-iris:           #7C6AF7;   /* Primary brand */
  --color-iris-light:     #A89BFA;   /* Hover / active */
  --color-iris-dim:       rgba(124,106,247,0.12); /* Subtle iris fill */
  --color-iris-border:    rgba(124,106,247,0.3);  /* Iris border */

  /* ━━━━━━━━━━ FUNCTIONAL COLOURS ━━━━━━━━━━ */
  --color-jade:           #3DD68C;   /* Success, excellent score */
  --color-jade-dim:       rgba(61,214,140,0.1);
  --color-jade-border:    rgba(61,214,140,0.25);

  --color-amber:          #F5A623;   /* Warning, fair score, at-risk */
  --color-amber-dim:      rgba(245,166,35,0.1);
  --color-amber-border:   rgba(245,166,35,0.25);

  --color-coral:          #F0714B;   /* Error, poor score, blocked */
  --color-coral-dim:      rgba(240,113,75,0.1);
  --color-coral-border:   rgba(240,113,75,0.25);

  --color-sky:            #4AB8E8;   /* Info, links, neutral */
  --color-sky-dim:        rgba(74,184,232,0.1);

  /* ━━━━━━━━━━ SCORE SYSTEM ━━━━━━━━━━ */
  --score-excellent:      var(--color-jade);   /* 85–100 */
  --score-good:           var(--color-iris);   /* 70–84 */
  --score-fair:           var(--color-amber);  /* 50–69 */
  --score-poor:           var(--color-coral);  /* 0–49 */

  /* ━━━━━━━━━━ GRADIENTS ━━━━━━━━━━ */
  --gradient-iris:  linear-gradient(135deg, #7C6AF7 0%, #5B4CD4 100%);
  --gradient-canvas: linear-gradient(180deg, #0A0F1A 0%, #080C14 100%);
  --gradient-card-hover: linear-gradient(135deg, rgba(124,106,247,0.05) 0%, transparent 100%);
}
```

---

## Typography

### Font Loading (Next.js)
```typescript
// app/layout.tsx
import { Syne, DM_Sans } from 'next/font/google';
import localFont from 'next/font/local';

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// JetBrains Mono — load from Google Fonts
import { JetBrains_Mono } from 'next/font/google';
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});
```

### CSS Variables
```css
:root {
  --font-display: var(--font-syne), 'Georgia', serif;
  --font-body:    var(--font-dm-sans), system-ui, sans-serif;
  --font-mono:    var(--font-mono), 'Courier New', monospace;
}
```

### Type Scale
```css
:root {
  /* Scale — use these classes via Tailwind config */
  --text-xs:   11px;  --leading-xs:  1.4;   /* Timestamps, labels */
  --text-sm:   13px;  --leading-sm:  1.5;   /* Secondary body, meta */
  --text-base: 14px;  --leading-base:1.6;   /* Primary body */
  --text-md:   15px;  --leading-md:  1.5;   /* Slightly prominent body */
  --text-lg:   18px;  --leading-lg:  1.4;   /* Section headings */
  --text-xl:   22px;  --leading-xl:  1.3;   /* Page section headings */
  --text-2xl:  28px;  --leading-2xl: 1.2;   /* Module titles */
  --text-3xl:  36px;  --leading-3xl: 1.1;   /* Hero stats */
  --text-4xl:  48px;  --leading-4xl: 1.0;   /* Large display */
}
```

### Typographic Roles
| Role | Font | Size | Weight | Use |
|---|---|---|---|---|
| Display | Syne | 36–48px | 700–800 | Module names, hero stats |
| Heading 1 | Syne | 22–28px | 700 | Page titles |
| Heading 2 | DM Sans | 18px | 600 | Section headings |
| Heading 3 | DM Sans | 15px | 600 | Card titles, panel headers |
| Body | DM Sans | 14px | 400 | All body copy |
| Caption | DM Sans | 13px | 400 | Meta info, labels |
| Label | DM Sans | 11px | 500 | Uppercase labels (letter-spacing: 0.08em) |
| Mono | JetBrains Mono | 13px | 400 | Story IDs, scores, code |
| Mono Large | JetBrains Mono | 24–36px | 500 | Score display in rings |

---

## Spacing System

```css
/* 4px base grid */
:root {
  --space-px:  1px;
  --space-0-5: 2px;
  --space-1:   4px;
  --space-1-5: 6px;
  --space-2:   8px;
  --space-2-5: 10px;
  --space-3:   12px;
  --space-3-5: 14px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-7:   28px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-14:  56px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;
}
```

### Spacing Conventions
```
Between page sections:    var(--space-8)   — 32px
Between cards in a grid:  var(--space-3)   — 12px
Inside a card:            var(--space-4)   — 16px
Between card sections:    var(--space-3)   — 12px
Button padding (h):       var(--space-4)   — 16px
Button padding (v):       var(--space-2)   — 8px
Input padding:            var(--space-3) var(--space-4)
Sidebar width (open):     220px
Sidebar width (closed):   56px
Topbar height:            48px
Command palette width:    560px
Modal max-width (default):520px
Modal max-width (large):  800px
```

---

## Border Radius

```css
:root {
  --radius-xs:   2px;
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-lg:   10px;
  --radius-xl:   14px;
  --radius-2xl:  20px;
  --radius-full: 9999px;
}

/* Usage guide */
/* Buttons:        radius-md (6px) */
/* Cards:          radius-lg (10px) */
/* Modals:         radius-xl (14px) */
/* Score rings:    radius-full */
/* Badge/chips:    radius-full */
/* Input fields:   radius-md (6px) */
/* Tooltips:       radius-sm (4px) */
```

---

## Shadows & Elevation

```css
:root {
  --shadow-xs:    0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:    0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3);
  --shadow-lg:    0 10px 30px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3);
  --shadow-xl:    0 20px 60px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.4);
  --shadow-modal: 0 24px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4);

  /* Glow shadows — use sparingly */
  --shadow-iris:  0 0 24px rgba(124,106,247,0.3);
  --shadow-jade:  0 0 24px rgba(61,214,140,0.25);
  --shadow-coral: 0 0 24px rgba(240,113,75,0.25);
  --shadow-amber: 0 0 24px rgba(245,166,35,0.2);
}
```

---

## Component Specifications

### Score Ring
```
Visual: SVG circle with stroke animation
Sizes:
  xs — 24px outer, 3px stroke, font-size 9px mono
  sm — 32px outer, 3px stroke, font-size 11px mono
  md — 48px outer, 4px stroke, font-size 15px mono
  lg — 80px outer, 5px stroke, font-size 24px mono
  xl — 120px outer, 6px stroke, font-size 36px mono

Animation:
  On mount: stroke-dashoffset from circumference → 0
  Duration: 800ms, spring (stiffness: 80, damping: 20)
  Stagger in lists: 50ms delay per item

Colours (by score):
  85–100: --color-jade       + --shadow-jade glow
  70–84:  --color-iris       + --shadow-iris glow
  50–69:  --color-amber
  0–49:   --color-coral      + --shadow-coral glow

Background track: rgba(255,255,255,0.06)
Center text: JetBrains Mono, semibold
```

### Story Card
```
Container:
  background: var(--color-surface-01)
  border: 1px solid var(--color-border)
  border-radius: var(--radius-lg)
  border-left: 3px solid [score-color]
  padding: var(--space-4)
  transition: background 150ms ease, border-color 150ms ease

Hover state:
  background: var(--color-surface-02)
  border-color: var(--color-border-strong)

Header row:
  Story ID: 11px JetBrains Mono, --color-text-tertiary
  Title: 14px DM Sans 500, --color-text-primary
  Score badge: top-right, pill shape

Meta row (below title):
  Epic chip: 11px, rounded-full, iris-dim bg, iris text
  Assignee: 20px avatar circle
  Story points: monospace, badge

Expanded state (click):
  Slide-down panel (Framer Motion, height: auto)
  AI analysis breakdown: dimension scores + reasoning
  Suggestions: card per suggestion with Apply button
  Animation: 250ms ease, smooth height
```

### Button System
```css
/* Base */
.btn {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-md);
  padding: 7px 14px;
  transition: all 150ms ease;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

/* Primary */
.btn-primary {
  background: var(--color-iris);
  color: white;
  border: 1px solid var(--color-iris);
}
.btn-primary:hover { background: var(--color-iris-light); }

/* Secondary */
.btn-secondary {
  background: var(--color-surface-03);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover { border-color: var(--color-border-strong); background: var(--color-surface-04); }

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid transparent;
}
.btn-ghost:hover { background: var(--color-surface-03); color: var(--color-text-primary); }

/* Danger */
.btn-danger {
  background: var(--color-coral-dim);
  color: var(--color-coral);
  border: 1px solid var(--color-coral-border);
}
.btn-danger:hover { background: var(--color-coral); color: white; }

/* Sizes */
.btn-xs  { padding: 4px 10px; font-size: 11px; }
.btn-sm  { padding: 6px 12px; font-size: 12px; }
.btn-lg  { padding: 10px 20px; font-size: 15px; }
.btn-xl  { padding: 12px 24px; font-size: 16px; }
```

### Badge / Status Chip
```
Pill shape (radius-full)
Font: 11px DM Sans 500
Padding: 2px 8px

Score variants:
  excellent: bg jade-dim, text jade, border jade-border
  good:      bg iris-dim, text iris-light, border iris-border
  fair:      bg amber-dim, text amber, border amber-border
  poor:      bg coral-dim, text coral, border coral-border

Status variants:
  active:    bg jade-dim, text jade
  at_risk:   bg amber-dim, text amber
  blocked:   bg coral-dim, text coral
  done:      bg surface-03, text text-secondary

Dependency status:
  resolved:  jade
  at_risk:   amber
  blocked:   coral
  open:      sky
```

### Input Fields
```css
.input {
  background: var(--color-surface-02);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  padding: 8px 12px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  outline: none;
}

.input::placeholder { color: var(--color-text-tertiary); }

.input:focus {
  border-color: var(--color-iris);
  box-shadow: 0 0 0 3px var(--color-iris-dim);
}
```

### Command Palette
```
Overlay: fixed inset-0, backdrop-filter blur(4px), bg rgba(0,0,0,0.6)
Modal: 560px wide, max-height 480px, radius-xl, shadow-modal
       bg surface-02, border border-strong

Search input:
  No border on input itself — border on container bottom only
  Font size: 15px, DM Sans
  Placeholder: "Search stories, actions, navigate..."
  Leading icon: magnifier, text-tertiary

Group header: 10px DM Sans 600 uppercase letter-spacing-wide, text-tertiary, px-4 py-2

Result item:
  padding: 8px 16px
  border-radius: radius-md
  Hover: surface-03 bg
  Active: iris-dim bg, iris border-left 2px
  Layout: icon + label + right meta (kbd shortcut)

Keyboard hint: 11px mono, surface-03 bg, rounded, px-1.5 py-0.5

Animation:
  Open: opacity 0→1, scale 0.97→1, y 4→0 (180ms ease-out)
  Close: reverse (150ms ease-in)
  Items: stagger 20ms, y 4→0
```

### Sidebar
```
Width: 56px (collapsed) / 220px (expanded)
Background: var(--color-canvas), border-right border-subtle

Transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1)

Navigation item:
  height: 36px
  border-radius: radius-md
  padding: 0 10px
  gap: 10px

  Icon: 18px, text-secondary (inactive) / iris-light (active)
  Label: 13px DM Sans 500, text-secondary (inactive) / text-primary (active)
  Active background: iris-dim
  Hover background: surface-03

Module group labels (expanded only):
  9px DM Sans 600 uppercase letter-spacing-widest
  text-tertiary
  padding: 16px 14px 6px

Bottom section:
  Workspace switcher: company name + chevron
  User avatar: 28px circle, status indicator dot
  Settings gear: ghost icon button
```

### Topbar
```
Height: 48px
Background: canvas, border-bottom border-subtle
backdrop-filter: blur(8px) — semi-transparent so page scrolls beneath

Left: Breadcrumb (Module name → Page name)
Center: empty (or sync status indicator if JIRA syncing)
Right: ⌘K trigger button + notification bell + user avatar

JIRA Sync Indicator:
  Dot + text: "Syncing..." (pulsing dot) | "Synced 2m ago" (static jade dot)
  Error: coral dot + "Sync failed — retry"
```

---

## Motion Design

### Animation Principles
1. **Purposeful**: Every animation conveys meaning (state change, hierarchy, direction)
2. **Fast**: UI responds in < 200ms. Loading states are immediate.
3. **Spring, not linear**: Framer Motion spring for organic feel on interactive elements
4. **Stagger for lists**: Never animate list items simultaneously

### Standard Durations
```javascript
// Framer Motion variants — import and reuse these
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } }
};

export const slideUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.18, ease: 'easeOut' } }
};

export const springExpand = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } }
};
```

### Specific Animations
```
Score ring:        spring, stiffness 80, damping 20, on mount
Card list:         staggerContainer + staggerItem, 50ms stagger
Modal/sheet open:  scaleIn (200ms ease-out) + overlay fadeIn
Modal close:       scale 1→0.97, opacity 1→0 (150ms ease-in)
Sidebar expand:    width spring, stiffness 400, damping 40
Command palette:   scaleIn (180ms) + backdrop fadeIn (150ms)
Toast:             slideUp from bottom-right, auto-exit after 4s
Page transition:   fadeIn (150ms) + y 4→0
Skeleton shimmer:  gradient sweep left→right, 1.5s linear infinite
Number count-up:   useCountAnimation hook, 600ms ease-out
```

---

## Empty States

Every list/table must have a designed empty state:

```
Structure:
  Centered in container
  Illustration: SVG icon (48px, text-tertiary, no emoji)
  Heading: 15px DM Sans 500, text-secondary
  Description: 13px DM Sans, text-tertiary, max 2 lines
  CTA button (optional): ghost button with action

Examples:
  Quality Gate — no stories: "No stories in this sprint"
                              "Connect JIRA and run a sync to see your backlog"
                              [Sync Now] button

  Signal — no updates:       "No updates sent yet"
                              "Draft your first stakeholder update"
                              [New Update] button

  Horizon — no PIs:          "No Program Increments yet"
                              "Create your first PI to start planning"
                              [Create PI] button
```

---

## Data Visualization

### Chart Conventions (Recharts)
```
Background: transparent (show surface behind)
Grid lines: surface-03, dashed
Axis labels: 11px JetBrains Mono, text-tertiary
Tooltips: surface-02 bg, border-strong border, shadow-lg
          Font: DM Sans, 12px
Line charts: 2px stroke, jade or iris
Area charts: gradient fill (opacity 0.2 → 0 top → bottom)
Bar charts: radius top 3px, iris fill, coral for warnings
```

### Score Trend Chart
```
X-axis: Sprint numbers (monospace)
Y-axis: 0–100 (gridlines at 50, 70, 85 — the tier boundaries)
Reference lines: dashed amber at 70 ("Good threshold"), dashed jade at 85 ("Excellent")
Area fill: gradient from line colour, 15% opacity
Dot on hover: 6px circle, 2px border in chart bg
```

---

## Iconography

Use **Lucide Icons** (`lucide-react`) exclusively. Never use emoji in UI.

Key icon assignments:
```
Quality Gate:    Shield (ShieldCheck for good, ShieldAlert for poor)
Signal:          Send / MessageSquare
Horizon:         Map / Layers
Dashboard:       LayoutDashboard
Settings:        Settings2
JIRA:            Link2 (or custom Atlassian SVG)
Sync:            RefreshCw (animated when syncing)
Score:           TrendingUp
Risk:            AlertTriangle
Dependency:      GitBranch
Sprint:          Zap
PI:              Calendar
Team:            Users
Blockers:        Lock
Excellent:       CheckCircle2 (jade)
Warning:         AlertCircle (amber)
Error:           XCircle (coral)
```

---

## Accessibility

- All interactive elements: visible focus ring (iris outline, 2px, 2px offset)
- Minimum contrast: 4.5:1 for body text (verified against canvas background)
- All icons have aria-label or paired visible text
- Loading states: aria-busy + aria-label on loading containers
- Score rings: aria-label="Score: [value] out of 100, [tier]"
- Color is never the only indicator of state (always paired with icon or text)
