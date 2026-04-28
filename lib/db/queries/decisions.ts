import { createUntypedAdminClient } from "@/lib/db/client";

export interface Decision {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  description: string | null;
  decision_type: "scope_change" | "priority_shift" | "resource_allocation" | "technical_decision" | "process_change" | "risk_acceptance" | "other";
  context: Record<string, unknown>;
  decision: Record<string, unknown>;
  ai_summary: string | null;
  ai_risk_assessment: Record<string, unknown> | null;
  outcome_status: "pending" | "successful" | "partial" | "failed" | "unknown";
  outcome: Record<string, unknown> | null;
  outcome_evaluated_at: string | null;
  outcome_evaluated_by: string | null;
  tags: string[];
  visibility: "private" | "team" | "workspace";
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  linked_stories?: Array<{
    id: string;
    title: string;
    jira_key: string | null;
    link_type: string;
  }>;
}

export interface DecisionStoryLink {
  id: string;
  decision_id: string;
  story_id: string;
  link_type: "caused_by" | "affects" | "blocks" | "related";
  created_at: string;
}

export interface DecisionTemplate {
  id: string;
  workspace_id: string;
  name: string;
  decision_type: string;
  template: Record<string, unknown>;
  usage_count: number;
  created_at: string;
}

export interface CreateDecisionInput {
  title: string;
  description?: string;
  decision_type?: Decision["decision_type"];
  context?: Record<string, unknown>;
  decision?: Record<string, unknown>;
  tags?: string[];
  visibility?: Decision["visibility"];
  linked_story_ids?: Array<{ story_id: string; link_type: DecisionStoryLink["link_type"] }>;
  generate_ai_summary?: boolean;
}

export interface DecisionFilters {
  decision_type?: Decision["decision_type"];
  outcome_status?: Decision["outcome_status"];
  sprint_id?: number;
  pi_id?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Create a new decision
 */
export async function createDecision(
  workspaceId: string,
  userId: string,
  input: CreateDecisionInput
): Promise<Decision> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("decisions")
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      title: input.title,
      description: input.description || null,
      decision_type: input.decision_type || "other",
      context: input.context || {},
      decision: input.decision || {},
      tags: input.tags || [],
      visibility: input.visibility || "team",
    })
    .select()
    .single();

  if (error) throw error;

  // Link stories if provided
  if (input.linked_story_ids && input.linked_story_ids.length > 0) {
    const links = input.linked_story_ids.map((link) => ({
      decision_id: data.id,
      story_id: link.story_id,
      link_type: link.link_type,
    }));

    await supabase.from("decision_story_links").insert(links);
  }

  return data as Decision;
}

/**
 * Get a decision by ID
 * Uses a single query to fetch decision with creator and linked stories (no N+1)
 */
export async function getDecisionById(
  workspaceId: string,
  decisionId: string
): Promise<Decision | null> {
  const supabase = createUntypedAdminClient();

  // Single query fetching decision, creator, and linked stories
  const { data, error } = await supabase
    .from("decisions")
    .select(`
      *,
      creator:users!decisions_created_by_fkey(id, full_name, avatar_url),
      decision_story_links(
        link_type,
        story:stories(id, title, jira_key)
      )
    `)
    .eq("workspace_id", workspaceId)
    .eq("id", decisionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = data as any;
  const decision: Decision = {
    id: rawData.id,
    workspace_id: rawData.workspace_id,
    created_by: rawData.created_by,
    title: rawData.title,
    description: rawData.description,
    decision_type: rawData.decision_type,
    context: rawData.context,
    decision: rawData.decision,
    ai_summary: rawData.ai_summary,
    ai_risk_assessment: rawData.ai_risk_assessment,
    outcome_status: rawData.outcome_status,
    outcome: rawData.outcome,
    outcome_evaluated_at: rawData.outcome_evaluated_at,
    outcome_evaluated_by: rawData.outcome_evaluated_by,
    tags: rawData.tags,
    visibility: rawData.visibility,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    creator: rawData.creator,
  };

  // Transform linked stories from the nested join
  if (rawData.decision_story_links && Array.isArray(rawData.decision_story_links)) {
    decision.linked_stories = rawData.decision_story_links
      .filter((link: { story?: unknown }) => link.story)
      .map((link: { story: { id: string; title: string; jira_key: string | null }; link_type: string }) => ({
        id: link.story.id,
        title: link.story.title,
        jira_key: link.story.jira_key,
        link_type: link.link_type,
      }));
  }

  return decision;
}

/**
 * List decisions with filters
 */
export async function listDecisions(
  workspaceId: string,
  filters: DecisionFilters = {}
): Promise<{ decisions: Decision[]; total: number }> {
  const supabase = createUntypedAdminClient();

  const { decision_type, outcome_status, tags, search, limit = 20, offset = 0 } = filters;

  let query = supabase
    .from("decisions")
    .select("*, creator:users!decisions_created_by_fkey(id, full_name, avatar_url)", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (decision_type) {
    query = query.eq("decision_type", decision_type);
  }

  if (outcome_status) {
    query = query.eq("outcome_status", outcome_status);
  }

  if (tags && tags.length > 0) {
    query = query.overlaps("tags", tags);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    decisions: (data || []) as Decision[],
    total: count || 0,
  };
}

/**
 * Update a decision
 */
export async function updateDecision(
  workspaceId: string,
  decisionId: string,
  updates: Partial<Omit<Decision, "id" | "workspace_id" | "created_by" | "created_at">>
): Promise<Decision> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("decisions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", decisionId)
    .select()
    .single();

  if (error) throw error;

  return data as Decision;
}

/**
 * Delete a decision
 */
export async function deleteDecision(
  workspaceId: string,
  decisionId: string
): Promise<void> {
  const supabase = createUntypedAdminClient();

  const { error } = await supabase
    .from("decisions")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", decisionId);

  if (error) throw error;
}

/**
 * Update decision outcome
 */
export async function updateDecisionOutcome(
  workspaceId: string,
  decisionId: string,
  userId: string,
  evaluation: {
    outcome_status: Decision["outcome_status"];
    outcome?: Record<string, unknown>;
  }
): Promise<Decision> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("decisions")
    .update({
      outcome_status: evaluation.outcome_status,
      outcome: evaluation.outcome || null,
      outcome_evaluated_at: new Date().toISOString(),
      outcome_evaluated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", decisionId)
    .select()
    .single();

  if (error) throw error;

  return data as Decision;
}

/**
 * Link decision to stories
 * Validates that both the decision and stories belong to the specified workspace
 */
export async function linkDecisionToStories(
  workspaceId: string,
  decisionId: string,
  storyIds: string[],
  linkType: DecisionStoryLink["link_type"] = "related"
): Promise<void> {
  if (storyIds.length === 0) return;

  const supabase = createUntypedAdminClient();

  // Verify decision belongs to workspace
  const { data: decision, error: decisionError } = await supabase
    .from("decisions")
    .select("id")
    .eq("id", decisionId)
    .eq("workspace_id", workspaceId)
    .single();

  if (decisionError || !decision) {
    throw new Error("Decision not found or access denied");
  }

  // Verify all stories belong to the same workspace
  const { data: validStories, error: storiesError } = await supabase
    .from("stories")
    .select("id")
    .eq("workspace_id", workspaceId)
    .in("id", storyIds);

  if (storiesError) throw storiesError;

  const validStoryIds = new Set((validStories || []).map((s) => s.id));
  const invalidStoryIds = storyIds.filter((id) => !validStoryIds.has(id));

  if (invalidStoryIds.length > 0) {
    throw new Error(
      `Stories not found or access denied: ${invalidStoryIds.join(", ")}`
    );
  }

  const links = storyIds.map((storyId) => ({
    decision_id: decisionId,
    story_id: storyId,
    link_type: linkType,
  }));

  const { error } = await supabase
    .from("decision_story_links")
    .upsert(links, { onConflict: "decision_id,story_id,link_type" });

  if (error) throw error;
}

/**
 * Unlink story from decision
 */
export async function unlinkStoryFromDecision(
  decisionId: string,
  storyId: string
): Promise<void> {
  const supabase = createUntypedAdminClient();

  const { error } = await supabase
    .from("decision_story_links")
    .delete()
    .eq("decision_id", decisionId)
    .eq("story_id", storyId);

  if (error) throw error;
}

/**
 * Get decision templates
 */
export async function getDecisionTemplates(
  workspaceId: string
): Promise<DecisionTemplate[]> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("decision_templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("usage_count", { ascending: false });

  if (error) throw error;

  return (data || []) as DecisionTemplate[];
}

/**
 * Get decision statistics for a workspace
 */
export async function getDecisionStats(workspaceId: string): Promise<{
  total: number;
  by_type: Record<string, number>;
  by_outcome: Record<string, number>;
  success_rate: number;
}> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("decisions")
    .select("decision_type, outcome_status")
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  const decisions = data || [];
  const byType: Record<string, number> = {};
  const byOutcome: Record<string, number> = {};
  let successCount = 0;
  let evaluatedCount = 0;

  for (const d of decisions) {
    byType[d.decision_type] = (byType[d.decision_type] || 0) + 1;
    byOutcome[d.outcome_status] = (byOutcome[d.outcome_status] || 0) + 1;

    if (d.outcome_status !== "pending") {
      evaluatedCount++;
      if (d.outcome_status === "successful") {
        successCount++;
      }
    }
  }

  return {
    total: decisions.length,
    by_type: byType,
    by_outcome: byOutcome,
    success_rate: evaluatedCount > 0 ? (successCount / evaluatedCount) * 100 : 0,
  };
}
