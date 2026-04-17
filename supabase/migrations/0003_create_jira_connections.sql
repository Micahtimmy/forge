-- Create JIRA connections table
CREATE TABLE IF NOT EXISTS jira_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  access_token TEXT NOT NULL, -- encrypted at application level
  refresh_token TEXT,
  token_expires TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  sync_error TEXT, -- store last error message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One JIRA connection per workspace (for now)
CREATE UNIQUE INDEX IF NOT EXISTS idx_jira_connections_workspace ON jira_connections(workspace_id);

-- Enable RLS
ALTER TABLE jira_connections ENABLE ROW LEVEL SECURITY;
