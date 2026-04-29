-- Table to store which JIRA projects are selected for sync
CREATE TABLE IF NOT EXISTS jira_selected_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_key TEXT NOT NULL,
  project_name TEXT NOT NULL,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_score BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  story_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workspace_id, project_key)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jira_selected_projects_workspace
  ON jira_selected_projects(workspace_id);

CREATE INDEX IF NOT EXISTS idx_jira_selected_projects_sync_enabled
  ON jira_selected_projects(workspace_id, sync_enabled)
  WHERE sync_enabled = true;

-- RLS policies
ALTER TABLE jira_selected_projects ENABLE ROW LEVEL SECURITY;

-- Allow users to read their workspace's selected projects
CREATE POLICY "Users can view their workspace's selected projects"
  ON jira_selected_projects FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Allow users to manage their workspace's selected projects
CREATE POLICY "Users can manage their workspace's selected projects"
  ON jira_selected_projects FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
