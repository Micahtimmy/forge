import { createUntypedAdminClient } from "@/lib/db/client";

export interface QualityGate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  trigger_transition: string;
  min_score: number;
  action: "block" | "warn" | "comment";
  required_dimensions: string[] | null;
  notification_channels: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GateCondition {
  type: "min_score" | "required_fields" | "max_points" | "has_acceptance_criteria";
  config: Record<string, unknown>;
}

export interface GateAction {
  type: "block_transition" | "add_label" | "notify" | "create_violation";
  config: Record<string, unknown>;
}

export interface QualityViolation {
  id: string;
  workspace_id: string;
  gate_id: string;
  story_id: string;
  violation_type: "score_below_threshold" | "missing_dimension" | "blocked";
  score_at_time: number;
  required_score: number;
  jira_comment_id: string | null;
  resolution_status: "open" | "resolved" | "waived" | "expired";
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  gate?: QualityGate;
  story?: {
    id: string;
    title: string;
    jira_key: string | null;
  };
}

export interface GateCheckResult {
  gate: QualityGate;
  passed: boolean;
  violations: Array<{
    condition: GateCondition;
    message: string;
    details: Record<string, unknown>;
  }>;
}

/**
 * Create a quality gate
 */
export async function createQualityGate(
  workspaceId: string,
  _userId: string,
  input: {
    name: string;
    description?: string;
    trigger_transition: string;
    min_score: number;
    action: QualityGate["action"];
    required_dimensions?: string[];
    notification_channels?: string[];
  }
): Promise<QualityGate> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("quality_gates")
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      description: input.description || null,
      trigger_transition: input.trigger_transition,
      min_score: input.min_score,
      action: input.action,
      required_dimensions: input.required_dimensions || null,
      notification_channels: input.notification_channels || [],
    })
    .select()
    .single();

  if (error) throw error;

  return data as QualityGate;
}

/**
 * List quality gates
 */
export async function listQualityGates(
  workspaceId: string,
  options?: { trigger?: string; is_active?: boolean }
): Promise<QualityGate[]> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("quality_gates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (options?.is_active !== undefined) {
    query = query.eq("is_active", options.is_active);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []) as QualityGate[];
}

/**
 * Update quality gate
 */
export async function updateQualityGate(
  workspaceId: string,
  gateId: string,
  updates: Partial<Omit<QualityGate, "id" | "workspace_id" | "created_at">>
): Promise<QualityGate> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("quality_gates")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", gateId)
    .select()
    .single();

  if (error) throw error;

  return data as QualityGate;
}

/**
 * Delete quality gate
 */
export async function deleteQualityGate(
  workspaceId: string,
  gateId: string
): Promise<void> {
  const supabase = createUntypedAdminClient();

  const { error } = await supabase
    .from("quality_gates")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", gateId);

  if (error) throw error;
}

/**
 * Check quality gate against a story
 */
export async function checkQualityGate(
  workspaceId: string,
  storyId: string,
  gateId?: string
): Promise<GateCheckResult[]> {
  const supabase = createUntypedAdminClient();

  // Get applicable gates
  let gateQuery = supabase
    .from("quality_gates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);

  if (gateId) {
    gateQuery = gateQuery.eq("id", gateId);
  }

  const { data: gates, error: gateError } = await gateQuery;
  if (gateError) throw gateError;

  // Get story's current score
  const { data: score, error: scoreError } = await supabase
    .from("story_scores")
    .select("*")
    .eq("story_id", storyId)
    .order("scored_at", { ascending: false })
    .limit(1)
    .single();

  if (scoreError && scoreError.code !== "PGRST116") throw scoreError;

  const results: GateCheckResult[] = [];

  for (const gate of gates || []) {
    const violations: GateCheckResult["violations"] = [];
    let passed = true;

    // Check minimum score
    if (score) {
      if (score.total_score < gate.min_score) {
        passed = false;
        violations.push({
          condition: { type: "min_score", config: { min: gate.min_score } },
          message: `Score ${score.total_score} is below minimum ${gate.min_score}`,
          details: { current_score: score.total_score, required_score: gate.min_score },
        });
      }

      // Check required dimensions if specified
      if (gate.required_dimensions && gate.required_dimensions.length > 0) {
        const dimensionScores: Record<string, number> = {
          completeness: score.completeness_score,
          clarity: score.clarity_score,
          estimability: score.estimability_score,
          traceability: score.traceability_score,
          testability: score.testability_score,
        };

        for (const dim of gate.required_dimensions) {
          const dimScore = dimensionScores[dim];
          if (dimScore !== undefined && dimScore < 10) {
            passed = false;
            violations.push({
              condition: { type: "required_fields", config: { dimension: dim } },
              message: `Required dimension "${dim}" score is too low`,
              details: { dimension: dim, score: dimScore },
            });
          }
        }
      }
    } else {
      passed = false;
      violations.push({
        condition: { type: "min_score", config: { min: gate.min_score } },
        message: "Story has not been scored yet",
        details: {},
      });
    }

    results.push({
      gate: gate as QualityGate,
      passed,
      violations,
    });
  }

  return results;
}

/**
 * Check quality gates (alias for compatibility)
 */
export async function checkQualityGates(
  workspaceId: string,
  storyId: string,
  gateId?: string
): Promise<GateCheckResult[]> {
  return checkQualityGate(workspaceId, storyId, gateId);
}

/**
 * Create a violation record
 */
export async function createViolation(
  workspaceId: string,
  violation: {
    gate_id: string;
    story_id: string;
    violation_type: QualityViolation["violation_type"];
    score_at_time: number;
    required_score: number;
    jira_comment_id?: string;
  }
): Promise<QualityViolation> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("quality_violations")
    .insert({
      workspace_id: workspaceId,
      gate_id: violation.gate_id,
      story_id: violation.story_id,
      violation_type: violation.violation_type,
      score_at_time: violation.score_at_time,
      required_score: violation.required_score,
      jira_comment_id: violation.jira_comment_id || null,
    })
    .select()
    .single();

  if (error) throw error;

  return data as QualityViolation;
}

/**
 * List violations for workspace
 */
export async function listViolations(
  workspaceId: string,
  options: {
    status?: QualityViolation["resolution_status"][];
    gateId?: string;
    storyId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ violations: QualityViolation[]; total: number }> {
  const supabase = createUntypedAdminClient();
  const { status, gateId, storyId, limit = 20, offset = 0 } = options;

  let query = supabase
    .from("quality_violations")
    .select("*, gate:quality_gates(*), story:stories(id, title, jira_key)", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (status && status.length > 0) {
    query = query.in("resolution_status", status);
  }

  if (gateId) {
    query = query.eq("gate_id", gateId);
  }

  if (storyId) {
    query = query.eq("story_id", storyId);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    violations: (data || []) as QualityViolation[],
    total: count || 0,
  };
}

/**
 * List quality violations (alias for compatibility)
 */
export async function listQualityViolations(
  workspaceId: string,
  options: {
    status?: QualityViolation["resolution_status"] | QualityViolation["resolution_status"][];
    gateId?: string;
    storyId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ violations: QualityViolation[]; total: number }> {
  const normalizedOptions = {
    ...options,
    status: options.status ? (Array.isArray(options.status) ? options.status : [options.status]) : undefined,
  };
  return listViolations(workspaceId, normalizedOptions);
}

/**
 * Get violation stats
 */
export async function getViolationStats(
  workspaceId: string
): Promise<{ total: number; byStatus: Record<string, number>; bySeverity: Record<string, number> }> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("quality_violations")
    .select("resolution_status, violation_type")
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  const violations = data || [];
  const byStatus: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const v of violations) {
    byStatus[v.resolution_status] = (byStatus[v.resolution_status] || 0) + 1;
    bySeverity[v.violation_type] = (bySeverity[v.violation_type] || 0) + 1;
  }

  return {
    total: violations.length,
    byStatus,
    bySeverity,
  };
}

/**
 * Update violation status (alias for resolveViolation)
 */
export async function updateViolationStatus(
  workspaceId: string,
  violationId: string,
  userId: string,
  resolution: {
    status: "resolved" | "waived";
    waiver_reason?: string;
  }
): Promise<QualityViolation> {
  return resolveViolation(workspaceId, violationId, userId, {
    status: resolution.status,
    notes: resolution.waiver_reason,
  });
}

/**
 * Resolve a violation
 */
export async function resolveViolation(
  workspaceId: string,
  violationId: string,
  userId: string,
  resolution: {
    status: "resolved" | "waived";
    notes?: string;
  }
): Promise<QualityViolation> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("quality_violations")
    .update({
      resolution_status: resolution.status,
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
      resolution_notes: resolution.notes || null,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", violationId)
    .select()
    .single();

  if (error) throw error;

  return data as QualityViolation;
}
