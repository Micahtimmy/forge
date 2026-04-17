import { createUntypedServerClient } from "../client";
import type { PICanvasData } from "@/types/pi";

export interface ProgramIncrement {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: "planning" | "active" | "completed";
  iterationCount: number;
  iterationLengthWeeks: number;
  canvasData: PICanvasData | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PITeam {
  id: string;
  piId: string;
  name: string;
  totalCapacity: number;
  createdAt: Date;
}

export interface PIFeature {
  id: string;
  piId: string;
  teamId: string | null;
  title: string;
  description: string | null;
  points: number | null;
  iterationIndex: number | null;
  jiraKey: string | null;
  riskLevel: "none" | "low" | "medium" | "high" | null;
  status: "backlog" | "planned" | "committed" | "completed";
  positionX: number | null;
  positionY: number | null;
  createdAt: Date;
}

export interface PIDependency {
  id: string;
  piId: string;
  sourceFeatureId: string;
  targetFeatureId: string;
  status: "open" | "resolved" | "at_risk" | "blocked";
  description: string | null;
  createdAt: Date;
}

export interface PIRisk {
  id: string;
  piId: string;
  title: string;
  description: string | null;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation: string | null;
  ownerId: string | null;
  status: "identified" | "mitigating" | "resolved" | "accepted";
  createdAt: Date;
}

// Get all PIs for a workspace
export async function getProgramIncrements(
  workspaceId: string,
  options: {
    status?: "planning" | "active" | "completed";
    limit?: number;
  } = {}
): Promise<ProgramIncrement[]> {
  const supabase = createUntypedServerClient();
  const { status, limit = 20 } = options;

  let query = supabase
    .from("program_increments")
    .select(
      `
      id,
      workspace_id,
      name,
      description,
      start_date,
      end_date,
      status,
      iteration_count,
      iteration_length_weeks,
      canvas_data,
      created_at,
      updated_at
    `
    )
    .eq("workspace_id", workspaceId)
    .order("start_date", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch program increments: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    status: row.status as "planning" | "active" | "completed",
    iterationCount: row.iteration_count,
    iterationLengthWeeks: row.iteration_length_weeks,
    canvasData: row.canvas_data as PICanvasData | null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

// Get PI by ID
export async function getProgramIncrementById(
  workspaceId: string,
  piId: string
): Promise<ProgramIncrement | null> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("program_increments")
    .select(
      `
      id,
      workspace_id,
      name,
      description,
      start_date,
      end_date,
      status,
      iteration_count,
      iteration_length_weeks,
      canvas_data,
      created_at,
      updated_at
    `
    )
    .eq("workspace_id", workspaceId)
    .eq("id", piId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch program increment: ${error.message}`);
  }

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    name: data.name,
    description: data.description,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    status: data.status as "planning" | "active" | "completed",
    iterationCount: data.iteration_count,
    iterationLengthWeeks: data.iteration_length_weeks,
    canvasData: data.canvas_data as PICanvasData | null,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// Create a new PI
export async function createProgramIncrement(
  workspaceId: string,
  data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    iterationCount?: number;
    iterationLengthWeeks?: number;
  }
): Promise<ProgramIncrement> {
  const supabase = createUntypedServerClient();

  const { data: created, error } = await supabase
    .from("program_increments")
    .insert({
      workspace_id: workspaceId,
      name: data.name,
      description: data.description,
      start_date: data.startDate.toISOString().split("T")[0],
      end_date: data.endDate.toISOString().split("T")[0],
      status: "planning",
      iteration_count: data.iterationCount || 5,
      iteration_length_weeks: data.iterationLengthWeeks || 2,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create program increment: ${error.message}`);
  }

  return {
    id: created.id,
    workspaceId: created.workspace_id,
    name: created.name,
    description: created.description,
    startDate: new Date(created.start_date),
    endDate: new Date(created.end_date),
    status: created.status as "planning" | "active" | "completed",
    iterationCount: created.iteration_count,
    iterationLengthWeeks: created.iteration_length_weeks,
    canvasData: created.canvas_data as PICanvasData | null,
    createdAt: new Date(created.created_at),
    updatedAt: new Date(created.updated_at),
  };
}

// Update PI canvas data
export async function updatePICanvasData(
  workspaceId: string,
  piId: string,
  canvasData: PICanvasData
): Promise<void> {
  const supabase = createUntypedServerClient();

  const { error } = await supabase
    .from("program_increments")
    .update({ canvas_data: canvasData })
    .eq("workspace_id", workspaceId)
    .eq("id", piId);

  if (error) {
    throw new Error(`Failed to update canvas data: ${error.message}`);
  }
}

// Get teams for a PI
export async function getPITeams(piId: string): Promise<PITeam[]> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("pi_teams")
    .select("id, pi_id, name, total_capacity, created_at")
    .eq("pi_id", piId)
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch PI teams: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    piId: row.pi_id,
    name: row.name,
    totalCapacity: row.total_capacity,
    createdAt: new Date(row.created_at),
  }));
}

// Get features for a PI
export async function getPIFeatures(piId: string): Promise<PIFeature[]> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("pi_features")
    .select(
      `
      id,
      pi_id,
      team_id,
      title,
      description,
      points,
      iteration_index,
      jira_key,
      risk_level,
      status,
      position_x,
      position_y,
      created_at
    `
    )
    .eq("pi_id", piId)
    .order("created_at");

  if (error) {
    throw new Error(`Failed to fetch PI features: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    piId: row.pi_id,
    teamId: row.team_id,
    title: row.title,
    description: row.description,
    points: row.points,
    iterationIndex: row.iteration_index,
    jiraKey: row.jira_key,
    riskLevel: row.risk_level as "none" | "low" | "medium" | "high" | null,
    status: row.status as "backlog" | "planned" | "committed" | "completed",
    positionX: row.position_x,
    positionY: row.position_y,
    createdAt: new Date(row.created_at),
  }));
}

// Get dependencies for a PI
export async function getPIDependencies(piId: string): Promise<PIDependency[]> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("pi_dependencies")
    .select(
      `
      id,
      pi_id,
      source_feature_id,
      target_feature_id,
      status,
      description,
      created_at
    `
    )
    .eq("pi_id", piId);

  if (error) {
    throw new Error(`Failed to fetch PI dependencies: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    piId: row.pi_id,
    sourceFeatureId: row.source_feature_id,
    targetFeatureId: row.target_feature_id,
    status: row.status as "open" | "resolved" | "at_risk" | "blocked",
    description: row.description,
    createdAt: new Date(row.created_at),
  }));
}

// Get risks for a PI
export async function getPIRisks(piId: string): Promise<PIRisk[]> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("pi_risks")
    .select(
      `
      id,
      pi_id,
      title,
      description,
      probability,
      impact,
      mitigation,
      owner_id,
      status,
      created_at
    `
    )
    .eq("pi_id", piId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch PI risks: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    piId: row.pi_id,
    title: row.title,
    description: row.description,
    probability: row.probability as "low" | "medium" | "high",
    impact: row.impact as "low" | "medium" | "high",
    mitigation: row.mitigation,
    ownerId: row.owner_id,
    status: row.status as "identified" | "mitigating" | "resolved" | "accepted",
    createdAt: new Date(row.created_at),
  }));
}

// Create PI team
export async function createPITeam(
  piId: string,
  name: string,
  totalCapacity: number = 0
): Promise<PITeam> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("pi_teams")
    .insert({
      pi_id: piId,
      name,
      total_capacity: totalCapacity,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create PI team: ${error.message}`);
  }

  return {
    id: data.id,
    piId: data.pi_id,
    name: data.name,
    totalCapacity: data.total_capacity,
    createdAt: new Date(data.created_at),
  };
}

// Create PI feature
export async function createPIFeature(
  piId: string,
  data: {
    teamId?: string;
    title: string;
    description?: string;
    points?: number;
    iterationIndex?: number;
    jiraKey?: string;
    riskLevel?: "none" | "low" | "medium" | "high";
  }
): Promise<PIFeature> {
  const supabase = createUntypedServerClient();

  const { data: created, error } = await supabase
    .from("pi_features")
    .insert({
      pi_id: piId,
      team_id: data.teamId,
      title: data.title,
      description: data.description,
      points: data.points,
      iteration_index: data.iterationIndex,
      jira_key: data.jiraKey,
      risk_level: data.riskLevel || "none",
      status: "backlog",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create PI feature: ${error.message}`);
  }

  return {
    id: created.id,
    piId: created.pi_id,
    teamId: created.team_id,
    title: created.title,
    description: created.description,
    points: created.points,
    iterationIndex: created.iteration_index,
    jiraKey: created.jira_key,
    riskLevel: created.risk_level as "none" | "low" | "medium" | "high" | null,
    status: created.status as "backlog" | "planned" | "committed" | "completed",
    positionX: created.position_x,
    positionY: created.position_y,
    createdAt: new Date(created.created_at),
  };
}

// Create PI dependency
export async function createPIDependency(
  piId: string,
  sourceFeatureId: string,
  targetFeatureId: string,
  description?: string
): Promise<PIDependency> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("pi_dependencies")
    .insert({
      pi_id: piId,
      source_feature_id: sourceFeatureId,
      target_feature_id: targetFeatureId,
      status: "open",
      description,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create PI dependency: ${error.message}`);
  }

  return {
    id: data.id,
    piId: data.pi_id,
    sourceFeatureId: data.source_feature_id,
    targetFeatureId: data.target_feature_id,
    status: data.status as "open" | "resolved" | "at_risk" | "blocked",
    description: data.description,
    createdAt: new Date(data.created_at),
  };
}

// Create PI risk
export async function createPIRisk(
  piId: string,
  data: {
    title: string;
    description?: string;
    probability: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
    mitigation?: string;
    ownerId?: string;
  }
): Promise<PIRisk> {
  const supabase = createUntypedServerClient();

  const { data: created, error } = await supabase
    .from("pi_risks")
    .insert({
      pi_id: piId,
      title: data.title,
      description: data.description,
      probability: data.probability,
      impact: data.impact,
      mitigation: data.mitigation,
      owner_id: data.ownerId,
      status: "identified",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create PI risk: ${error.message}`);
  }

  return {
    id: created.id,
    piId: created.pi_id,
    title: created.title,
    description: created.description,
    probability: created.probability as "low" | "medium" | "high",
    impact: created.impact as "low" | "medium" | "high",
    mitigation: created.mitigation,
    ownerId: created.owner_id,
    status: created.status as "identified" | "mitigating" | "resolved" | "accepted",
    createdAt: new Date(created.created_at),
  };
}
