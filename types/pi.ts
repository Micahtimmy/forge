// Program Increment types for FORGE Horizon module

export interface ProgramIncrement {
  id: string;
  workspaceId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: "planning" | "active" | "completed";
  iterations: number;
  canvasData: PICanvasData | null;
  createdAt: string;
}

export interface PITeam {
  id: string;
  piId: string;
  name: string;
  jiraBoardId: string | null;
  capacityPerIteration: number[] | null;
  velocityHistory: number[] | null;
}

export interface PIDependency {
  id: string;
  piId: string;
  fromStoryId: string;
  toStoryId: string;
  fromTeamId: string | null;
  toTeamId: string | null;
  status: "open" | "resolved" | "at_risk" | "blocked";
  createdAt: string;
}

export interface PICanvasData {
  nodes: PICanvasNode[];
  edges: PICanvasEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface PICanvasNode {
  id: string;
  type: "featureCard" | "iterationHeader" | "teamRowHeader" | "backlogItem";
  position: { x: number; y: number };
  data: FeatureCardData | IterationHeaderData | TeamRowData | BacklogItemData;
}

export interface PICanvasEdge {
  id: string;
  source: string;
  target: string;
  type: "dependency";
  data?: {
    status: "open" | "resolved" | "at_risk" | "blocked";
  };
}

export interface FeatureCardData {
  title: string;
  points: number;
  teamId: string;
  iterationIndex: number;
  jiraKey?: string;
  riskLevel?: "none" | "low" | "medium" | "high";
}

export interface IterationHeaderData {
  iterationNumber: number;
  startDate: string;
  endDate: string;
}

export interface TeamRowData {
  teamId: string;
  teamName: string;
  totalCapacity: number;
  committed: number;
}

export interface BacklogItemData {
  title: string;
  points: number;
  jiraKey?: string;
}

export interface PIRisk {
  id: string;
  piId: string;
  title: string;
  type: "dependency" | "capacity" | "technical" | "scope" | "external";
  impact: "low" | "medium" | "high" | "critical";
  likelihood: "low" | "medium" | "high";
  mitigation: string | null;
  owner: string | null;
  status: "identified" | "mitigating" | "accepted" | "resolved";
  createdAt: string;
}

// Helper to get dependency edge color
export function getDependencyColor(
  status: PIDependency["status"]
): string {
  switch (status) {
    case "resolved":
      return "var(--color-jade)";
    case "at_risk":
      return "var(--color-amber)";
    case "blocked":
      return "var(--color-coral)";
    default:
      return "var(--color-sky)";
  }
}

// Helper to calculate capacity utilization
export function getCapacityUtilization(
  committed: number,
  capacity: number
): { percentage: number; status: "healthy" | "warning" | "danger" } {
  if (capacity === 0) return { percentage: 0, status: "healthy" };
  const percentage = (committed / capacity) * 100;

  if (percentage <= 90) return { percentage, status: "healthy" };
  if (percentage <= 110) return { percentage, status: "warning" };
  return { percentage, status: "danger" };
}
