/**
 * Centralized TanStack Query configuration.
 * Defines consistent stale times and retry behavior across the app.
 */

// Query key factory for type-safe query keys
export const queryKeys = {
  // Dashboard
  dashboard: ["dashboard"] as const,

  // Stories & Quality Gate
  stories: {
    all: ["stories"] as const,
    list: (filters: Record<string, unknown>) => ["stories", filters] as const,
    detail: (id: string) => ["story", id] as const,
    score: (id: string) => ["story", id, "score"] as const,
  },

  // Sprints
  sprints: {
    all: ["sprints"] as const,
    detail: (id: string) => ["sprint", id] as const,
    active: ["sprints", "active"] as const,
  },

  // Signal (Updates)
  signals: {
    all: ["signals"] as const,
    list: (filters: Record<string, unknown>) => ["signals", filters] as const,
    detail: (id: string) => ["signal", id] as const,
  },

  // Horizon (PIs)
  pis: {
    all: ["pis"] as const,
    detail: (id: string) => ["pi", id] as const,
    canvas: (id: string) => ["pi", id, "canvas"] as const,
    dependencies: (id: string) => ["pi", id, "dependencies"] as const,
    risks: (id: string) => ["pi", id, "risks"] as const,
  },

  // JIRA
  jira: {
    status: ["jira", "status"] as const,
    projects: ["jira", "projects"] as const,
  },

  // Team
  team: {
    members: ["team", "members"] as const,
    invitations: ["team", "invitations"] as const,
  },

  // Billing
  billing: {
    subscription: ["billing", "subscription"] as const,
    invoices: ["billing", "invoices"] as const,
  },
} as const;

// Stale time configurations (in milliseconds)
export const staleTimes = {
  // Rarely changes - cache for longer
  user: 5 * 60 * 1000, // 5 minutes
  workspace: 5 * 60 * 1000, // 5 minutes
  sprints: 5 * 60 * 1000, // 5 minutes
  jiraStatus: 2 * 60 * 1000, // 2 minutes
  subscription: 5 * 60 * 1000, // 5 minutes

  // Changes more frequently
  dashboard: 2 * 60 * 1000, // 2 minutes
  stories: 30 * 1000, // 30 seconds
  storyDetail: 60 * 1000, // 1 minute
  signals: 60 * 1000, // 1 minute

  // Real-time data
  piCanvas: 10 * 1000, // 10 seconds (for collaboration)
  dependencies: 30 * 1000, // 30 seconds

  // Static data
  rubrics: 10 * 60 * 1000, // 10 minutes
  teams: 5 * 60 * 1000, // 5 minutes
} as const;

// Retry configuration
export const retryConfig = {
  // Default: 3 retries with exponential backoff
  default: {
    retry: 3,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // AI endpoints: fewer retries, longer delays
  ai: {
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(2000 * 2 ** attemptIndex, 60000),
  },

  // Critical operations: more retries
  critical: {
    retry: 5,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // No retry for mutations that shouldn't be repeated
  none: {
    retry: false,
  },
} as const;

// Default query options
export const defaultQueryOptions = {
  staleTime: staleTimes.stories,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  ...retryConfig.default,
} as const;
