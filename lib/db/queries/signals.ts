import { createUntypedServerClient } from "../client";
import type { AudienceType } from "@/types/signal";

export interface SignalUpdate {
  id: string;
  workspaceId: string;
  sprintRef: string;
  status: "draft" | "sent" | "archived";
  authorId: string;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignalDraft {
  id: string;
  updateId: string;
  audience: AudienceType;
  content: string;
  tone: number;
  aiGenerated: boolean;
  editedAt: Date | null;
  createdAt: Date;
}

export interface SignalUpdateWithDrafts extends SignalUpdate {
  drafts: SignalDraft[];
}

// Get signal updates for a workspace
export async function getSignalUpdates(
  workspaceId: string,
  options: {
    status?: "draft" | "sent" | "archived";
    limit?: number;
    offset?: number;
  } = {}
): Promise<SignalUpdate[]> {
  const supabase = createUntypedServerClient();
  const { status, limit = 50, offset = 0 } = options;

  let query = supabase
    .from("signal_updates")
    .select(
      `
      id,
      workspace_id,
      sprint_ref,
      status,
      author_id,
      sent_at,
      created_at,
      updated_at
    `
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch signal updates: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    sprintRef: row.sprint_ref,
    status: row.status as "draft" | "sent" | "archived",
    authorId: row.author_id,
    sentAt: row.sent_at ? new Date(row.sent_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

// Get signal update by ID with drafts
export async function getSignalUpdateById(
  workspaceId: string,
  updateId: string
): Promise<SignalUpdateWithDrafts | null> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("signal_updates")
    .select(
      `
      id,
      workspace_id,
      sprint_ref,
      status,
      author_id,
      sent_at,
      created_at,
      updated_at,
      signal_drafts (
        id,
        audience,
        content,
        tone,
        ai_generated,
        edited_at,
        created_at
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .eq("id", updateId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch signal update: ${error.message}`);
  }

  const drafts = (
    data.signal_drafts as Array<{
      id: string;
      audience: string;
      content: string;
      tone: number;
      ai_generated: boolean;
      edited_at: string | null;
      created_at: string;
    }>
  ).map((d) => ({
    id: d.id,
    updateId: data.id,
    audience: d.audience as AudienceType,
    content: d.content,
    tone: d.tone,
    aiGenerated: d.ai_generated,
    editedAt: d.edited_at ? new Date(d.edited_at) : null,
    createdAt: new Date(d.created_at),
  }));

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    sprintRef: data.sprint_ref,
    status: data.status as "draft" | "sent" | "archived",
    authorId: data.author_id,
    sentAt: data.sent_at ? new Date(data.sent_at) : null,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    drafts,
  };
}

// Create a new signal update
export async function createSignalUpdate(
  workspaceId: string,
  authorId: string,
  sprintRef: string
): Promise<SignalUpdate> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("signal_updates")
    .insert({
      workspace_id: workspaceId,
      author_id: authorId,
      sprint_ref: sprintRef,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create signal update: ${error.message}`);
  }

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    sprintRef: data.sprint_ref,
    status: data.status as "draft" | "sent" | "archived",
    authorId: data.author_id,
    sentAt: data.sent_at ? new Date(data.sent_at) : null,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// Upsert a signal draft
export async function upsertSignalDraft(
  updateId: string,
  audience: AudienceType,
  content: string,
  tone: number,
  aiGenerated: boolean = true
): Promise<SignalDraft> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("signal_drafts")
    .upsert(
      {
        update_id: updateId,
        audience,
        content,
        tone,
        ai_generated: aiGenerated,
        edited_at: aiGenerated ? null : new Date().toISOString(),
      },
      {
        onConflict: "update_id,audience",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert signal draft: ${error.message}`);
  }

  return {
    id: data.id,
    updateId: data.update_id,
    audience: data.audience as AudienceType,
    content: data.content,
    tone: data.tone,
    aiGenerated: data.ai_generated,
    editedAt: data.edited_at ? new Date(data.edited_at) : null,
    createdAt: new Date(data.created_at),
  };
}

// Update signal status
export async function updateSignalStatus(
  workspaceId: string,
  updateId: string,
  status: "draft" | "sent" | "archived"
): Promise<void> {
  const supabase = createUntypedServerClient();

  const updateData: Record<string, unknown> = { status };
  if (status === "sent") {
    updateData.sent_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("signal_updates")
    .update(updateData)
    .eq("workspace_id", workspaceId)
    .eq("id", updateId);

  if (error) {
    throw new Error(`Failed to update signal status: ${error.message}`);
  }
}

// Delete signal update
export async function deleteSignalUpdate(
  workspaceId: string,
  updateId: string
): Promise<void> {
  const supabase = createUntypedServerClient();

  const { error } = await supabase
    .from("signal_updates")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", updateId);

  if (error) {
    throw new Error(`Failed to delete signal update: ${error.message}`);
  }
}

// Decision Logger
export interface Decision {
  id: string;
  workspaceId: string;
  signalUpdateId: string | null;
  madeById: string;
  madeByName?: string;
  title: string;
  reasoning: string | null;
  affectedTickets: string[];
  tags: string[];
  createdAt: Date;
}

export async function getDecisions(
  workspaceId: string,
  options: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}
): Promise<Decision[]> {
  const supabase = createUntypedServerClient();
  const { limit = 50, offset = 0, search } = options;

  let query = supabase
    .from("decisions")
    .select(`
      id,
      workspace_id,
      signal_update_id,
      made_by_id,
      title,
      reasoning,
      affected_tickets,
      tags,
      created_at,
      users!decisions_made_by_id_fkey (
        full_name,
        display_name
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,reasoning.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch decisions: ${error.message}`);
  }

  return (data || []).map((row) => {
    const user = row.users as { full_name?: string; display_name?: string } | null;
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      signalUpdateId: row.signal_update_id,
      madeById: row.made_by_id,
      madeByName: user?.full_name || user?.display_name || "Unknown",
      title: row.title,
      reasoning: row.reasoning,
      affectedTickets: row.affected_tickets || [],
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
    };
  });
}

export async function createDecision(
  workspaceId: string,
  madeById: string,
  data: {
    title: string;
    reasoning?: string;
    affectedTickets?: string[];
    tags?: string[];
    signalUpdateId?: string;
  }
): Promise<Decision> {
  const supabase = createUntypedServerClient();

  const { data: created, error } = await supabase
    .from("decisions")
    .insert({
      workspace_id: workspaceId,
      made_by_id: madeById,
      signal_update_id: data.signalUpdateId || null,
      title: data.title,
      reasoning: data.reasoning || null,
      affected_tickets: data.affectedTickets || [],
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create decision: ${error.message}`);
  }

  return {
    id: created.id,
    workspaceId: created.workspace_id,
    signalUpdateId: created.signal_update_id,
    madeById: created.made_by_id,
    title: created.title,
    reasoning: created.reasoning,
    affectedTickets: created.affected_tickets || [],
    tags: created.tags || [],
    createdAt: new Date(created.created_at),
  };
}

export async function deleteDecision(
  workspaceId: string,
  decisionId: string
): Promise<void> {
  const supabase = createUntypedServerClient();

  const { error } = await supabase
    .from("decisions")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", decisionId);

  if (error) {
    throw new Error(`Failed to delete decision: ${error.message}`);
  }
}
