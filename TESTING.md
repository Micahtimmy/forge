# FORGE Testing Guide

This document explains how to test the FORGE application, covering unit tests, integration tests, and end-to-end tests.

---

## Quick Start

```bash
# Run all unit tests
npm test

# Run unit tests with watch mode (interactive)
npm run test:ui

# Run unit tests once (CI mode)
npm run test:run

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests (requires dev server running)
npm run e2e

# Run E2E tests with UI
npm run e2e:ui

# Run E2E tests in headed mode (see the browser)
npm run e2e:headed

# Install Playwright browsers (first time only)
npm run e2e:install
```

---

## Test Infrastructure

### Unit Tests (Vitest)

- **Framework**: Vitest v4+
- **Testing Library**: @testing-library/react
- **Location**: `tests/` directory
- **Config**: `vitest.config.ts`

#### File Structure

```
tests/
├── setup.tsx              # Global test setup (mocks, globals)
├── lib/                   # Utility function tests
│   └── cn.test.ts
├── components/
│   └── ui/
│       ├── button.test.tsx
│       └── score-ring.test.tsx
└── hooks/                 # Custom hook tests (TODO)
```

#### Writing Unit Tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MyComponent } from "@/components/my-component";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests (Playwright)

- **Framework**: Playwright v1.59+
- **Location**: `e2e/` directory
- **Config**: `playwright.config.ts`

#### File Structure

```
e2e/
├── auth.spec.ts           # Authentication flow tests
├── navigation.spec.ts     # Navigation and routing tests
├── quality-gate.spec.ts   # Quality Gate feature tests (TODO)
├── signal.spec.ts         # Signal feature tests (TODO)
└── horizon.spec.ts        # Horizon feature tests (TODO)
```

#### Writing E2E Tests

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    await page.goto("/some-route");
    await expect(page.getByRole("heading")).toHaveText("Expected Title");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page).toHaveURL("/success");
  });
});
```

---

## Testing the Application

### Prerequisites

1. **Environment Setup**: Copy `.env.local.example` to `.env.local` and fill in values
2. **Database**: Ensure Supabase is configured and running
3. **Dependencies**: Run `npm install`

### Starting the Dev Server

```bash
npm run dev
```

The app runs at `http://localhost:3000`

---

## Feature Testing Guide

### 1. Authentication Flow

**What to Test:**
- [ ] Login page renders
- [ ] Signup page renders
- [ ] Form validation (email format, password requirements)
- [ ] Successful login redirects to dashboard
- [ ] Failed login shows error message
- [ ] Logout works correctly
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Password reset flow works

**Manual Test Steps:**
1. Go to `/login`
2. Try submitting empty form (should show validation errors)
3. Enter invalid credentials (should show error)
4. Create account via `/signup`
5. Login with new credentials
6. Verify redirect to dashboard
7. Click logout, verify redirect to login

### 2. Quality Gate Module

**What to Test:**
- [ ] Story list renders
- [ ] Score rings display correct colors for score tiers
- [ ] Search/filter functionality
- [ ] Sprint selector works
- [ ] Score Sprint button triggers AI scoring
- [ ] Story detail panel opens
- [ ] AI suggestions display correctly
- [ ] Score trends chart renders

**Score Tier Colors:**
| Score | Color | Tier |
|-------|-------|------|
| 85+ | Jade (green) | Excellent |
| 70-84 | Iris (purple) | Good |
| 50-69 | Amber (yellow) | Fair |
| <50 | Coral (red) | Poor |

**Manual Test Steps:**
1. Login and navigate to `/quality-gate`
2. Verify sprint health snapshot shows
3. Check story cards display scores correctly
4. Use search to filter stories
5. Use score filter dropdown
6. Click "Score Sprint" button
7. Click a story card to open details
8. Verify AI suggestions appear for low-scoring stories

### 3. Signal Module

**What to Test:**
- [ ] Update composer loads
- [ ] Audience selector works
- [ ] AI generates draft updates
- [ ] Draft editing works
- [ ] Send flow completes
- [ ] Update history displays

**Manual Test Steps:**
1. Navigate to `/signal/new`
2. Select audiences (Executive, Team Lead, etc.)
3. Click "Generate Draft"
4. Verify AI-generated content appears
5. Edit the draft
6. Send the update
7. Check `/signal` for update history

### 4. Horizon Module

**What to Test:**
- [ ] PI canvas renders with React Flow
- [ ] Feature cards can be dragged
- [ ] Dependency edges display correctly
- [ ] Capacity model calculations
- [ ] Risk register shows AI-detected risks
- [ ] PI objectives generate correctly

**Manual Test Steps:**
1. Navigate to `/horizon`
2. Create a new PI or select existing
3. View the PI canvas
4. Drag feature cards between iterations
5. Check dependency map
6. Review capacity model
7. View risk register

### 5. JIRA Integration

**What to Test:**
- [ ] OAuth flow completes
- [ ] JIRA connection status displays
- [ ] Sync pulls stories correctly
- [ ] Webhook receives updates
- [ ] Disconnect works

**Manual Test Steps:**
1. Go to `/settings/jira`
2. Click "Connect JIRA"
3. Complete OAuth authorization
4. Verify connection status shows "Connected"
5. Click "Sync Now"
6. Verify stories appear in Quality Gate
7. Test disconnect

### 6. Settings & Team Management

**What to Test:**
- [ ] Settings pages load
- [ ] Team member list displays
- [ ] Invite flow works
- [ ] Role changes persist
- [ ] Billing page loads (if applicable)

---

## Running Tests in CI

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:run

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e -- --project=chromium
```

---

## Known Issues & Limitations

1. **Mock Data**: Some components (like Quality Gate page) use hardcoded mock data. Full testing requires JIRA integration or database seeding.

2. **Authentication Required**: Most E2E tests need authenticated sessions. Consider creating test fixtures for logged-in state.

3. **AI Responses**: AI features require valid API keys. Tests should mock AI responses for reliability.

4. **Database State**: E2E tests may need database seeding/cleanup between runs.

---

## Adding New Tests

### Naming Convention

- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`

### Test Organization

- Place unit tests in `tests/` mirroring the source structure
- Place E2E tests in `e2e/` organized by feature

### Best Practices

1. Test behavior, not implementation
2. Use meaningful test descriptions
3. Keep tests independent (no shared state)
4. Mock external dependencies
5. Test edge cases and error states
6. Use data-testid for stable selectors in E2E

---

## Coverage Goals

| Category | Target |
|----------|--------|
| UI Components | 80% |
| Utility Functions | 100% |
| Custom Hooks | 90% |
| API Routes | 80% |
| E2E Critical Paths | 100% |

Run coverage report:
```bash
npm run test:coverage
```
