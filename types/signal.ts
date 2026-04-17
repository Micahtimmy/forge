// Signal types for FORGE Signal module

export type AudienceType = "executive" | "team" | "client" | "board";

export type ToneLevel = 1 | 2 | 3 | 4 | 5; // 1 = formal, 5 = casual

export type UpdateFormat = "email" | "slack" | "confluence" | "pdf";

export interface SignalUpdate {
  id: string;
  workspaceId: string;
  authorId: string;
  sprintRef: string | null;
  contextData: SignalContext | null;
  audiences: AudienceType[] | null;
  drafts: Record<AudienceType, string> | null;
  status: "draft" | "sent" | "archived";
  sentAt: string | null;
  createdAt: string;
}

export interface SignalContext {
  // Sprint data
  sprintName?: string;
  sprintGoal?: string;
  completedStories?: Array<{
    key: string;
    title: string;
    points?: number;
  }>;
  inProgressStories?: Array<{
    key: string;
    title: string;
    points?: number;
    progress?: number;
  }>;
  blockers?: Array<{
    description: string;
    impact: string;
    resolution?: string;
  }>;

  // Metrics
  velocityTarget?: number;
  velocityActual?: number;
  burndownOnTrack?: boolean;

  // Highlights
  highlights?: string[];
  risks?: string[];
  decisions?: string[];

  // Custom notes
  additionalContext?: string;
}

export interface UpdateDraft {
  audience: AudienceType;
  content: string;
  tone: ToneLevel;
  format: UpdateFormat;
  generatedAt: string;
}

// Alias for convenience
export type SignalDraft = UpdateDraft;

export interface Decision {
  id: string;
  workspaceId: string;
  signalUpdateId: string | null;
  madeById: string;
  title: string;
  reasoning: string | null;
  affectedTickets: string[] | null;
  tags: string[] | null;
  createdAt: string;
}

// Audience display labels
export const audienceLabels: Record<AudienceType, string> = {
  executive: "Executive Leadership",
  team: "Engineering Team",
  client: "Client / Customer",
  board: "Board / Investors",
};

// Audience descriptions
export const audienceDescriptions: Record<AudienceType, string> = {
  executive: "High-level summary focused on business impact and outcomes",
  team: "Technical details with specific ticket references and blockers",
  client: "Customer-facing update with delivery timelines and features",
  board: "Strategic overview with metrics and risk assessment",
};

// Tone labels
export const toneLabels: Record<ToneLevel, string> = {
  1: "Formal",
  2: "Professional",
  3: "Balanced",
  4: "Friendly",
  5: "Casual",
};
