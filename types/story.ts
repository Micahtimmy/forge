// Story types for FORGE Quality Gate module

export interface Story {
  id: string;
  workspaceId: string;
  jiraId: string;
  jiraKey: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  storyPoints: number | null;
  status: string | null;
  assigneeId: string | null;
  epicKey: string | null;
  sprintId: string | null;
  labels: string[] | null;
  jiraUpdatedAt: string | null;
  syncedAt: string;
}

export interface StoryWithScore extends Story {
  score: StoryScore | null;
}

export interface StoryScore {
  id: string;
  storyId: string;
  rubricId: string;
  totalScore: number;
  completeness: number | null;
  clarity: number | null;
  estimability: number | null;
  traceability: number | null;
  testability: number | null;
  aiSuggestions: AISuggestion[] | null;
  scoredAt: string;
}

export interface AISuggestion {
  type: "acceptance_criteria" | "description" | "title" | "split";
  current: string;
  improved: string;
  reasoning?: string;
}

export interface ScoreDimension {
  name: string;
  key: "completeness" | "clarity" | "estimability" | "traceability" | "testability";
  score: number;
  maxScore: number;
  reasoning?: string;
}

export interface ScoreBreakdown {
  totalScore: number;
  dimensions: ScoreDimension[];
  suggestions: AISuggestion[];
}

// Helper function to get score tier
export function getScoreTier(
  score: number
): "excellent" | "good" | "fair" | "poor" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

// Helper function to get tier label
export function getTierLabel(tier: "excellent" | "good" | "fair" | "poor"): string {
  const labels = {
    excellent: "Excellent",
    good: "Good",
    fair: "Needs Work",
    poor: "Critical",
  };
  return labels[tier];
}
