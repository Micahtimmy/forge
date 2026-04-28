import { createUntypedAdminClient } from "@/lib/db/client";

export interface Scenario {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  description: string | null;
  baseline: Record<string, unknown>;
  changes: Record<string, unknown>;
  results: ScenarioResults | null;
  status: "draft" | "simulated" | "applied" | "archived";
  simulated_at: string | null;
  applied_at: string | null;
  applied_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface ScenarioBaseState {
  pi_id?: string;
  sprint_id?: string;
  snapshot_date: string;
  team_capacity: Record<string, number>;
  story_count: number;
  total_points: number;
  current_velocity: number;
}

export interface ScenarioModification {
  type: "add_scope" | "remove_scope" | "change_capacity" | "shift_timeline" | "add_dependency" | "remove_dependency";
  description: string;
  config: Record<string, unknown>;
}

export interface ScenarioResults {
  predicted_completion_date: string | null;
  completion_probability: number;
  risk_level: "low" | "medium" | "high" | "critical";
  capacity_utilization: number;
  overflow_points: number;
  key_risks: string[];
  recommendations: string[];
  comparison_to_baseline: {
    delta_days: number;
    delta_probability: number;
    delta_risk: string;
  };
  detailed_breakdown: {
    sprint_by_sprint?: Array<{
      sprint: number;
      planned_points: number;
      capacity: number;
      overflow: number;
    }>;
    team_breakdown?: Array<{
      team: string;
      allocated_points: number;
      capacity: number;
      utilization: number;
    }>;
  };
}

/**
 * Create a scenario
 */
export async function createScenario(
  workspaceId: string,
  userId: string,
  input: {
    name: string;
    description?: string;
    scenario_type?: string;
    base_state?: ScenarioBaseState;
    modifications?: ScenarioModification[];
  }
): Promise<Scenario> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      name: input.name,
      description: input.description || null,
      baseline: input.base_state || {},
      changes: { modifications: input.modifications || [] },
    })
    .select()
    .single();

  if (error) throw error;

  return data as Scenario;
}

/**
 * List scenarios
 */
export async function listScenarios(
  workspaceId: string,
  options: {
    scenario_type?: string;
    status?: Scenario["status"];
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ scenarios: Scenario[]; total: number }> {
  const supabase = createUntypedAdminClient();
  const { status, limit = 20, offset = 0 } = options;

  let query = supabase
    .from("scenarios")
    .select("*, creator:users!scenarios_created_by_fkey(id, full_name, avatar_url)", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    scenarios: (data || []) as Scenario[],
    total: count || 0,
  };
}

/**
 * Get scenario by ID
 */
export async function getScenarioById(
  workspaceId: string,
  scenarioId: string
): Promise<Scenario | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("scenarios")
    .select("*, creator:users!scenarios_created_by_fkey(id, full_name, avatar_url)")
    .eq("workspace_id", workspaceId)
    .eq("id", scenarioId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as Scenario;
}

/**
 * Run a scenario simulation
 */
export async function runScenario(
  workspaceId: string,
  scenarioId: string
): Promise<Scenario> {
  const supabase = createUntypedAdminClient();

  // Get the scenario
  const { data: scenario, error: fetchError } = await supabase
    .from("scenarios")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", scenarioId)
    .single();

  if (fetchError) throw fetchError;

  // Simulate results based on baseline and changes
  const baseline = scenario.baseline as ScenarioBaseState;
  const changes = scenario.changes as { modifications?: ScenarioModification[] };

  // Calculate simulated results
  const totalPoints = baseline?.total_points || 0;
  const velocity = baseline?.current_velocity || 10;
  const capacitySum = Object.values(baseline?.team_capacity || {}).reduce((a, b) => a + b, 0);

  let pointsModifier = 0;
  let capacityModifier = 0;

  for (const mod of changes?.modifications || []) {
    if (mod.type === "add_scope") {
      pointsModifier += (mod.config as { points?: number }).points || 0;
    } else if (mod.type === "remove_scope") {
      pointsModifier -= (mod.config as { points?: number }).points || 0;
    } else if (mod.type === "change_capacity") {
      capacityModifier += (mod.config as { delta?: number }).delta || 0;
    }
  }

  const adjustedPoints = totalPoints + pointsModifier;
  const adjustedCapacity = capacitySum + capacityModifier;
  const sprintsNeeded = Math.ceil(adjustedPoints / velocity);
  const utilizationPct = adjustedCapacity > 0 ? (adjustedPoints / adjustedCapacity) * 100 : 0;

  const results: ScenarioResults = {
    predicted_completion_date: new Date(Date.now() + sprintsNeeded * 14 * 24 * 60 * 60 * 1000).toISOString(),
    completion_probability: Math.max(0, Math.min(100, 100 - utilizationPct + 50)),
    risk_level: utilizationPct > 100 ? "critical" : utilizationPct > 85 ? "high" : utilizationPct > 70 ? "medium" : "low",
    capacity_utilization: Math.round(utilizationPct),
    overflow_points: Math.max(0, adjustedPoints - adjustedCapacity),
    key_risks: utilizationPct > 85 ? ["Capacity overcommitment risk"] : [],
    recommendations: utilizationPct > 100 ? ["Consider reducing scope or adding capacity"] : [],
    comparison_to_baseline: {
      delta_days: pointsModifier > 0 ? Math.ceil(pointsModifier / velocity) * 14 : 0,
      delta_probability: pointsModifier > 0 ? -10 : 5,
      delta_risk: pointsModifier > 0 ? "increased" : "decreased",
    },
    detailed_breakdown: {},
  };

  // Update scenario with results
  const { data, error } = await supabase
    .from("scenarios")
    .update({
      results,
      status: "simulated",
      simulated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", scenarioId)
    .select()
    .single();

  if (error) throw error;

  return data as Scenario;
}

/**
 * Update scenario
 */
export async function updateScenario(
  workspaceId: string,
  scenarioId: string,
  updates: Partial<Omit<Scenario, "id" | "workspace_id" | "created_by" | "created_at">>
): Promise<Scenario> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("scenarios")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", scenarioId)
    .select()
    .single();

  if (error) throw error;

  return data as Scenario;
}

/**
 * Delete scenario
 */
export async function deleteScenario(
  workspaceId: string,
  scenarioId: string
): Promise<void> {
  const supabase = createUntypedAdminClient();

  const { error } = await supabase
    .from("scenarios")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", scenarioId);

  if (error) throw error;
}

/**
 * Clone scenario
 */
export async function cloneScenario(
  workspaceId: string,
  scenarioId: string,
  userId: string,
  newName: string
): Promise<Scenario> {
  const supabase = createUntypedAdminClient();

  // Get original scenario
  const { data: original, error: fetchError } = await supabase
    .from("scenarios")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", scenarioId)
    .single();

  if (fetchError) throw fetchError;

  // Create clone
  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      name: newName,
      description: `Clone of ${original.name}`,
      baseline: original.baseline,
      changes: original.changes,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw error;

  return data as Scenario;
}

/**
 * Compare scenarios
 */
export async function compareScenarios(
  workspaceId: string,
  scenarioIds: string[]
): Promise<{
  scenarios: Scenario[];
  comparison: {
    best_completion_date: string;
    best_scenario_id: string;
    comparison_matrix: Record<string, Record<string, unknown>>;
  };
}> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("workspace_id", workspaceId)
    .in("id", scenarioIds);

  if (error) throw error;

  const scenarios = (data || []) as Scenario[];

  // Find best completion date
  let bestDate = new Date().toISOString();
  let bestId = scenarioIds[0] || "";

  const comparisonMatrix: Record<string, Record<string, unknown>> = {};

  for (const s of scenarios) {
    const results = s.results;
    if (results?.predicted_completion_date) {
      if (new Date(results.predicted_completion_date) < new Date(bestDate)) {
        bestDate = results.predicted_completion_date;
        bestId = s.id;
      }
    }

    comparisonMatrix[s.id] = {
      name: s.name,
      completion_date: results?.predicted_completion_date,
      probability: results?.completion_probability,
      risk_level: results?.risk_level,
      utilization: results?.capacity_utilization,
    };
  }

  return {
    scenarios,
    comparison: {
      best_completion_date: bestDate,
      best_scenario_id: bestId,
      comparison_matrix: comparisonMatrix,
    },
  };
}
