-- Create decisions table (decision log)
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  signal_update_id UUID REFERENCES signal_updates(id) ON DELETE SET NULL,
  made_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reasoning TEXT,
  -- Related JIRA tickets
  affected_tickets TEXT[],
  -- Categorization
  tags TEXT[],
  category TEXT, -- 'technical', 'product', 'process', 'resource', 'scope'
  -- Impact assessment
  impact TEXT CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'reversed')),
  superseded_by UUID REFERENCES decisions(id),
  -- Timestamps
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_decisions_workspace ON decisions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_decisions_signal_update ON decisions(signal_update_id);
CREATE INDEX IF NOT EXISTS idx_decisions_made_by ON decisions(made_by_id);
CREATE INDEX IF NOT EXISTS idx_decisions_tags ON decisions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_decisions_decided_at ON decisions(decided_at);

-- Full-text search on decisions
CREATE INDEX IF NOT EXISTS idx_decisions_search
  ON decisions USING GIN(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(reasoning, '')));

-- Enable RLS
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
