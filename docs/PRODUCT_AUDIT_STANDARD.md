# Product Audit & Security Standard

> A comprehensive guide for systematic product auditing, security review, and code quality improvement. Use this document as a template for any web application built with Next.js, React, and TypeScript.

**Version:** 1.0.0  
**Last Updated:** May 2026  
**Based on:** FORGE Application Audit

---

## Table of Contents

1. [Overview](#overview)
2. [Audit Methodology](#audit-methodology)
3. [Security Audit](#security-audit)
4. [API Route Audit](#api-route-audit)
5. [Frontend Hooks Audit](#frontend-hooks-audit)
6. [UI/UX Audit](#uiux-audit)
7. [Performance Audit](#performance-audit)
8. [Accessibility Audit](#accessibility-audit)
9. [Multi-Tenancy Audit](#multi-tenancy-audit)
10. [Error Tracking & Monitoring](#error-tracking--monitoring)
11. [Implementation Patterns](#implementation-patterns)
12. [Audit Checklist Template](#audit-checklist-template)
13. [Automated Audit Commands](#automated-audit-commands)

---

## Overview

### Purpose

This document establishes a systematic approach to:
- Identify security vulnerabilities before they reach production
- Ensure consistent code patterns across the codebase
- Improve user experience through proper error handling
- Meet accessibility standards (WCAG 2.1)
- Establish monitoring for production issues

### When to Run Audits

| Trigger | Audit Type |
|---------|------------|
| Before major release | Full audit |
| After adding new API routes | Security + API audit |
| After UI changes | UI/UX + Accessibility audit |
| Monthly maintenance | Security + Error tracking audit |
| After security incident | Full security audit |

---

## Audit Methodology

### Parallel Agent Approach

For large codebases, run multiple focused audits in parallel:

```
Audit Agents:
├── Security Audit Agent
│   └── Authentication, authorization, input validation
├── API Routes Audit Agent
│   └── Error tracking, rate limiting, response patterns
├── Hooks Audit Agent
│   └── Error handling, caching, state management
├── UI Components Audit Agent
│   └── Accessibility, design tokens, loading states
└── Multi-Tenancy Audit Agent
    └── Workspace isolation, data leakage prevention
```

### Audit Output Format

Each audit should produce:
1. **Issue List** - Categorized by severity (Critical, High, Medium, Low)
2. **File Paths** - Exact locations of issues
3. **Remediation Steps** - How to fix each issue
4. **Verification Method** - How to confirm the fix worked

---

## Security Audit

### 1. Authentication Vulnerabilities

#### What to Check

| Check | Risk Level | Description |
|-------|------------|-------------|
| Unauthenticated endpoints | Critical | API routes accessible without login |
| Direct Supabase auth | Medium | Using `supabase.auth.getUser()` instead of centralized helper |
| Missing session validation | High | Not verifying session on sensitive operations |
| Token exposure | Critical | JWT or API keys in client-side code |

#### How to Find

```bash
# Find API routes without authentication
grep -rL "authenticateRequest\|auth.getUser\|getUser" app/api --include="*.ts" | grep route.ts

# Find routes using direct Supabase auth (should use helper)
grep -r "supabase.auth.getUser" app/api --include="*.ts" -l

# Find potential token exposure in client code
grep -r "API_KEY\|SECRET\|TOKEN" components/ hooks/ --include="*.ts" --include="*.tsx"
```

#### Correct Pattern

```typescript
// lib/api/auth.ts - Centralized authentication helper
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function authenticateRequest() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return {
      success: false as const,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }
  
  // Get workspace membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .single();
    
  if (!membership) {
    return {
      success: false as const,
      response: NextResponse.json({ error: "No workspace found" }, { status: 400 }),
    };
  }
  
  return {
    success: true as const,
    context: {
      user,
      workspaceId: membership.workspace_id,
      role: membership.role,
    },
  };
}

// Usage in API route
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.success) {
    return auth.response;
  }
  const { workspaceId, user } = auth.context;
  // ... rest of handler
}
```

### 2. Authorization Vulnerabilities

#### What to Check

| Check | Risk Level | Description |
|-------|------------|-------------|
| Missing role checks | High | Admin-only actions accessible to all users |
| IDOR vulnerabilities | Critical | Accessing resources by ID without ownership check |
| Privilege escalation | Critical | Users able to grant themselves higher roles |

#### How to Find

```bash
# Find routes that should check roles but don't
grep -r "authenticateRequest" app/api --include="*.ts" -A 5 | grep -v "role\|admin\|permission"

# Find direct ID access without workspace filtering
grep -r "\.eq.*id\)" app/api --include="*.ts" | grep -v "workspace_id"
```

#### Correct Pattern

```typescript
// Role-based access control
import { requireRole } from "@/lib/api/auth";

export async function DELETE(req: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.success) return auth.response;
  
  // Require admin role for destructive operations
  const roleCheck = requireRole(auth.context, "admin");
  if (!roleCheck.success) return roleCheck.response;
  
  // ... proceed with deletion
}
```

### 3. Input Validation

#### What to Check

| Check | Risk Level | Description |
|-------|------------|-------------|
| Missing Zod validation | High | Request bodies not validated |
| SQL injection vectors | Critical | User input in raw queries |
| XSS vulnerabilities | High | User content rendered without sanitization |
| Path traversal | Critical | File paths from user input |

#### How to Find

```bash
# Find API routes without Zod validation
grep -rL "z\.\|zod" app/api --include="*.ts" | grep route.ts

# Find potential SQL injection (raw queries)
grep -r "\.raw\|\.sql\|\.query" lib/db --include="*.ts"

# Find dangerous HTML rendering
grep -r "dangerouslySetInnerHTML" components/ --include="*.tsx"
```

#### Correct Pattern

```typescript
import { z } from "zod";

// Define strict schema with constraints
const createStorySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  labels: z.array(z.string().max(50)).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.success) return auth.response;
  
  const body = await req.json();
  const result = createStorySchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten() },
      { status: 400 }
    );
  }
  
  const validated = result.data;
  // ... use validated data
}
```

### 4. Rate Limiting

#### What to Check

| Check | Risk Level | Description |
|-------|------------|-------------|
| Missing rate limits | Medium | Endpoints vulnerable to abuse |
| Weak limits on sensitive ops | High | Auth/payment endpoints without strict limits |
| No user-based limiting | Medium | Only IP-based limits (easily bypassed) |

#### How to Find

```bash
# Find routes without rate limiting
grep -rL "checkRateLimit\|rateLimit" app/api --include="*.ts" | grep route.ts

# Check rate limit configurations
grep -r "RATE_LIMITS\|windowSeconds\|limit:" lib/api --include="*.ts"
```

#### Correct Pattern

```typescript
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

// Standard rate limits
export const RATE_LIMITS = {
  standard: { limit: 100, windowSeconds: 60, identifier: "standard" },
  aiGeneration: { limit: 20, windowSeconds: 60, identifier: "ai" },
  aiScoring: { limit: 30, windowSeconds: 60, identifier: "ai-scoring" },
  jiraSync: { limit: 5, windowSeconds: 300, identifier: "jira-sync" },
  passwordChange: { limit: 5, windowSeconds: 3600, identifier: "password" },
  checkout: { limit: 5, windowSeconds: 300, identifier: "checkout" },
};

// Usage
const rateLimit = checkRateLimit(req, auth.context.user.id, RATE_LIMITS.aiGeneration);
if (!rateLimit.allowed) {
  return rateLimit.response;
}
```

### 5. Open Redirect Prevention

#### What to Check

| Check | Risk Level | Description |
|-------|------------|-------------|
| Unvalidated redirects | High | Redirect URLs from user input |
| OAuth callback URLs | High | Callback URLs not validated |

#### Correct Pattern

```typescript
// Validate redirect paths
function isValidRedirectPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;  // Must be relative
  if (path.startsWith("//")) return false;   // Protocol-relative URL
  if (path.includes("://")) return false;    // Absolute URL
  if (path.includes("\\")) return false;     // Path traversal
  return true;
}

// Usage
const rawNext = searchParams.get("next") ?? "/";
const next = isValidRedirectPath(rawNext) ? rawNext : "/";
return NextResponse.redirect(`${origin}${next}`);
```

---

## API Route Audit

### 1. Error Tracking (Sentry)

#### What to Check

Every API route should have Sentry error capture for 500-level errors.

#### How to Find

```bash
# Find routes without Sentry
grep -rL "Sentry" app/api --include="*.ts" | grep route.ts

# Count routes with vs without Sentry
echo "With Sentry: $(grep -rl 'Sentry' app/api --include='*.ts' | wc -l)"
echo "Without: $(grep -rL 'Sentry' app/api --include='*.ts' | grep route.ts | wc -l)"
```

#### Correct Pattern

```typescript
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    // ... handler logic
  } catch (error) {
    // Handle known errors (don't send to Sentry)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }
    
    // Log and capture unknown errors
    console.error("API error:", error);
    Sentry.captureException(error, {
      tags: { api: "route-name" },
    });
    
    return NextResponse.json(
      { error: "Operation failed" },
      { status: 500 }
    );
  }
}
```

### 2. Response Consistency

#### Standard Response Formats

```typescript
// Success responses
{ success: true, data: {...} }
{ stories: [...], total: 100, hasMore: true }

// Error responses
{ error: "Human-readable message" }
{ error: "Invalid request", details: [...] }  // For validation errors
{ success: false, error: "Message" }
```

### 3. HTTP Status Codes

| Status | When to Use |
|--------|-------------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Invalid request / validation error |
| 401 | Not authenticated |
| 403 | Not authorized (authenticated but no permission) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## Frontend Hooks Audit

### 1. TanStack Query Configuration

#### What to Check

| Check | Issue |
|-------|-------|
| Missing `staleTime` | Excessive refetching, poor performance |
| Missing `onError` on mutations | Silent failures, poor UX |
| No retry configuration | Hammering failing endpoints |
| Missing `enabled` flag | Queries running when they shouldn't |

#### How to Find

```bash
# Find queries without staleTime
grep -r "useQuery" hooks/ --include="*.ts" -A 10 | grep -B 5 "queryFn" | grep -L "staleTime"

# Find mutations without onError
grep -r "useMutation" hooks/ --include="*.ts" -A 15 | grep -B 10 "mutationFn" | grep -v "onError"
```

#### Correct Patterns

```typescript
// Query with proper configuration
export function useStories(filters: Filters) {
  return useQuery({
    queryKey: ["stories", filters],
    queryFn: async () => {
      const response = await fetch(`/api/stories?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    staleTime: 30 * 1000,        // 30 seconds
    refetchOnWindowFocus: true,   // Refetch when tab regains focus
    retry: 2,                     // Retry failed requests twice
  });
}

// Mutation with error handling
export function useCreateStory() {
  const queryClient = useQueryClient();
  const { toast } = useToastActions();
  
  return useMutation({
    mutationFn: async (data: CreateStoryData) => {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create story");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Story created successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create story");
    },
  });
}
```

### 2. Recommended staleTime Values

| Data Type | staleTime | Rationale |
|-----------|-----------|-----------|
| User session | 5 minutes | Doesn't change often |
| Stories/tasks | 30 seconds | May be updated by others |
| Sprints | 5 minutes | Changed infrequently |
| Analytics | 1 minute | Can be slightly stale |
| Real-time data | 0 | Always fetch fresh |

---

## UI/UX Audit

### 1. Design Token Compliance

#### What to Check

Components should use design tokens, not hardcoded colors.

#### How to Find

```bash
# Find hardcoded colors
grep -r "rgba\|#[0-9a-fA-F]\{3,6\}" components/ --include="*.tsx"

# Find non-semantic Tailwind colors (slate, gray, etc.)
grep -r "slate-\|gray-\|zinc-\|neutral-" components/ --include="*.tsx"
```

#### Correct Pattern

```typescript
// BAD - Hardcoded colors
<div className="bg-slate-900 text-slate-100 border-slate-800">

// GOOD - Design tokens
<div className="bg-surface-01 text-text-primary border-border">

// BAD - Hardcoded RGBA
<circle stroke="rgba(255,255,255,0.06)" />

// GOOD - CSS variable
<circle stroke="var(--glass-border)" />
```

#### Standard Design Tokens

```css
/* Text colors */
--color-text-primary     /* Main text */
--color-text-secondary   /* Secondary text */
--color-text-tertiary    /* Muted text */

/* Surface colors */
--color-surface-01       /* Primary surface */
--color-surface-02       /* Elevated surface */
--color-surface-03       /* Highest elevation */
--color-canvas           /* Page background */

/* Border colors */
--color-border           /* Default border */
--color-border-strong    /* Emphasized border */

/* Semantic colors */
--color-iris             /* Primary/accent */
--color-jade             /* Success */
--color-coral            /* Error/danger */
--color-amber            /* Warning */
```

### 2. Loading States

#### What to Check

Every component that fetches data should handle loading state.

#### How to Find

```bash
# Find components using queries without loading handling
grep -r "useQuery\|useSuspenseQuery" components/ --include="*.tsx" -l
# Then manually check each for isLoading/isPending handling
```

#### Correct Pattern

```typescript
interface ChartProps {
  data: DataPoint[];
  isLoading?: boolean;
  className?: string;
}

export function VelocityChart({ data, isLoading, className }: ChartProps) {
  if (isLoading) {
    return <ChartSkeleton className={className} />;
  }
  
  if (data.length === 0) {
    return <EmptyState message="No velocity data available" />;
  }
  
  return (
    <ResponsiveContainer>
      {/* Chart content */}
    </ResponsiveContainer>
  );
}
```

### 3. Error States

Every component that can fail should display errors gracefully.

```typescript
export function StoryList() {
  const { data, isLoading, error } = useStories();
  
  if (isLoading) return <StorySkeleton count={5} />;
  
  if (error) {
    return (
      <ErrorState
        message="Failed to load stories"
        retry={() => refetch()}
      />
    );
  }
  
  if (data.stories.length === 0) {
    return <EmptyState message="No stories found" />;
  }
  
  return <StoryGrid stories={data.stories} />;
}
```

---

## Accessibility Audit

### 1. Interactive Elements

#### What to Check

| Check | WCAG | Description |
|-------|------|-------------|
| Missing aria-label on icon buttons | 1.1.1 | Screen readers can't identify purpose |
| Missing alt text on images | 1.1.1 | Images not described |
| Poor color contrast | 1.4.3 | Text not readable |
| Missing focus indicators | 2.4.7 | Keyboard users can't see focus |
| Non-semantic HTML | 1.3.1 | Using divs instead of buttons |

#### How to Find

```bash
# Find icon-only buttons without aria-label
grep -r "<button" components/ --include="*.tsx" -A 3 | grep -B 3 "Icon\|svg" | grep -v "aria-label"

# Find images without alt
grep -r "<img\|<Image" components/ --include="*.tsx" | grep -v "alt="

# Find click handlers on non-interactive elements
grep -r "onClick" components/ --include="*.tsx" | grep "<div\|<span" | grep -v "role="
```

#### Correct Pattern

```typescript
// BAD - Icon button without label
<button onClick={onClose}>
  <X className="w-5 h-5" />
</button>

// GOOD - Accessible icon button
<button 
  onClick={onClose}
  aria-label="Close dialog"
  className="p-2 rounded-md hover:bg-surface-02"
>
  <X className="w-5 h-5" />
</button>

// GOOD - Dynamic aria-label
<button
  onClick={toggleExpand}
  aria-label={expanded ? "Collapse details" : "Expand details"}
  aria-expanded={expanded}
>
  <ChevronDown className={cn("w-4 h-4", expanded && "rotate-180")} />
</button>
```

### 2. Form Accessibility

```typescript
// Always associate labels with inputs
<div>
  <label htmlFor="email" className="sr-only">Email address</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-error"
    aria-invalid={!!errors.email}
  />
  {errors.email && (
    <p id="email-error" role="alert" className="text-coral text-sm">
      {errors.email.message}
    </p>
  )}
</div>
```

---

## Multi-Tenancy Audit

### Critical Security Requirement

In multi-tenant applications, data leakage between workspaces is a **critical vulnerability**.

### What to Check

| Check | Risk Level | Description |
|-------|------------|-------------|
| Missing workspace_id in queries | Critical | Data accessible across workspaces |
| Workspace ID from client | Critical | Client-provided workspace ID trusted |
| Cross-workspace references | High | Foreign keys to other workspace data |

### How to Find

```bash
# Find queries that might be missing workspace filtering
grep -r "\.from\|\.select" lib/db --include="*.ts" | grep -v "workspace_id"

# Find routes that accept workspace_id from request
grep -r "workspaceId.*req\|body\.workspaceId" app/api --include="*.ts"
```

### Correct Pattern

```typescript
// ALWAYS get workspace ID from authenticated session, NEVER from request
export async function getStories(workspaceId: string, filters: Filters) {
  return db
    .select()
    .from(stories)
    .where(
      and(
        eq(stories.workspaceId, workspaceId),  // Always filter by workspace
        filters.sprintId ? eq(stories.sprintId, filters.sprintId) : undefined
      )
    );
}

// API route - workspace comes from auth, not request
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.success) return auth.response;
  
  const { workspaceId } = auth.context;  // From session, not request
  const stories = await getStories(workspaceId, filters);
  
  return NextResponse.json({ stories });
}
```

---

## Error Tracking & Monitoring

### Sentry Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,  // 100% of errors
  
  beforeSend(event) {
    // Don't send expected errors
    if (event.exception?.values?.[0]?.type === "ZodError") {
      return null;
    }
    return event;
  },
});
```

### Error Tagging Strategy

```typescript
// Use consistent tags for filtering in Sentry
Sentry.captureException(error, {
  tags: {
    api: "stories",           // API route name
    operation: "create",      // What was being done
    module: "quality-gate",   // Feature module
  },
  extra: {
    userId: user.id,          // For debugging (not PII)
    workspaceId,              // For scoping
  },
});
```

---

## Implementation Patterns

### Standard API Route Template

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

const requestSchema = z.object({
  // Define your schema
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    
    // 2. Rate limit
    const rateLimit = checkRateLimit(req, auth.context.user.id, RATE_LIMITS.standard);
    if (!rateLimit.allowed) return rateLimit.response;
    
    // 3. Validate input
    const body = await req.json();
    const result = requestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    // 4. Business logic (always use workspaceId from auth)
    const data = await doSomething(auth.context.workspaceId, result.data);
    
    // 5. Return success
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    // 6. Handle errors
    console.error("API error:", error);
    Sentry.captureException(error, { tags: { api: "route-name" } });
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
```

### Standard Hook Template

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastActions } from "@/components/ui/toast";

export function useItems(filters: Filters) {
  return useQuery({
    queryKey: ["items", filters],
    queryFn: async () => {
      const response = await fetch(`/api/items?${new URLSearchParams(filters)}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToastActions();
  
  return useMutation({
    mutationFn: async (data: CreateItemData) => {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item created");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create item");
    },
  });
}
```

---

## Audit Checklist Template

Use this checklist for each audit:

### Pre-Release Security Checklist

- [ ] All API routes use `authenticateRequest()` helper
- [ ] All API routes have Sentry error tracking
- [ ] All mutations have rate limiting appropriate to their risk
- [ ] All user input is validated with Zod schemas
- [ ] No sensitive data in error responses
- [ ] No hardcoded secrets in codebase
- [ ] All redirects validate destination URLs
- [ ] CORS configured correctly

### Code Quality Checklist

- [ ] No TypeScript `any` types
- [ ] All queries have `staleTime` configured
- [ ] All mutations have `onError` handlers
- [ ] No console.log in production code
- [ ] No TODO comments in critical paths

### UI/UX Checklist

- [ ] All components handle loading state
- [ ] All components handle error state
- [ ] All components handle empty state
- [ ] No hardcoded colors (use design tokens)
- [ ] Animations use Framer Motion

### Accessibility Checklist

- [ ] All icon buttons have aria-labels
- [ ] All images have alt text
- [ ] All forms have proper labels
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Keyboard navigation works

### Multi-Tenancy Checklist

- [ ] All DB queries filter by workspace_id
- [ ] Workspace ID comes from session, not request
- [ ] No cross-workspace data references
- [ ] RLS policies tested

---

## Automated Audit Commands

Save these as scripts for quick auditing:

```bash
#!/bin/bash
# audit.sh - Run all audit checks

echo "=== Security Audit ==="
echo "Routes without auth:"
grep -rL "authenticateRequest\|auth.getUser" app/api --include="*.ts" | grep route.ts | wc -l

echo "Routes without rate limiting:"
grep -rL "checkRateLimit\|rateLimit" app/api --include="*.ts" | grep route.ts | wc -l

echo "Routes without Sentry:"
grep -rL "Sentry" app/api --include="*.ts" | grep route.ts | wc -l

echo ""
echo "=== Code Quality Audit ==="
echo "TypeScript any usage:"
grep -r ": any" --include="*.ts" --include="*.tsx" | wc -l

echo "Console.log statements:"
grep -r "console.log" --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l

echo ""
echo "=== UI Audit ==="
echo "Hardcoded colors:"
grep -r "slate-\|gray-\|rgba\|#[0-9a-fA-F]" components/ --include="*.tsx" | wc -l

echo "Missing aria-labels (estimate):"
grep -r "<button" components/ --include="*.tsx" | grep -v "aria-label" | wc -l

echo ""
echo "=== Build Check ==="
npm run build 2>&1 | tail -5
```

---

## Conclusion

This audit standard should be:
1. **Run before every major release** - Full audit
2. **Run after security changes** - Security-focused audit
3. **Run monthly** - Maintenance audit
4. **Updated regularly** - As new vulnerability patterns emerge

The goal is to catch issues before users do, and to maintain consistent code quality across the entire application.

---

*Document created based on the FORGE application audit, May 2026*
