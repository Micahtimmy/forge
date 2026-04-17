-- Create stories table (mirrored from JIRA)
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  jira_id TEXT NOT NULL,
  jira_key TEXT NOT NULL, -- e.g., "PROJ-123"
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  story_points INTEGER,
  status TEXT, -- e.g., "To Do", "In Progress", "Done"
  assignee_id TEXT, -- JIRA account ID
  assignee_name TEXT, -- Display name for convenience
  epic_key TEXT, -- e.g., "PROJ-100"
  epic_name TEXT, -- Epic summary for convenience
  sprint_id TEXT,
  sprint_name TEXT,
  labels TEXT[],
  priority TEXT,
  issue_type TEXT DEFAULT 'Story', -- Story, Bug, Task, etc.
  jira_updated_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_workspace ON stories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stories_jira_key ON stories(jira_key);
CREATE INDEX IF NOT EXISTS idx_stories_sprint ON stories(sprint_id);
CREATE INDEX IF NOT EXISTS idx_stories_epic ON stories(epic_key);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_workspace_jira ON stories(workspace_id, jira_id);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
