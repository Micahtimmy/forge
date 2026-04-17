-- Create signal_updates table (stakeholder communications)
CREATE TABLE IF NOT EXISTS signal_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Sprint/context reference
  sprint_ref TEXT,
  title TEXT,
  -- Raw context data used for generation
  context_data JSONB,
  -- Target audiences
  audiences TEXT[] DEFAULT ARRAY['executive', 'team', 'client', 'council'],
  -- Generated drafts per audience
  drafts JSONB, -- { "executive": "...", "team": "...", ... }
  -- Final content (after edits)
  final_content JSONB,
  -- Tone setting (1=formal, 5=conversational)
  tone INTEGER DEFAULT 3 CHECK (tone >= 1 AND tone <= 5),
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'archived')),
  -- Send metadata
  sent_via TEXT[], -- ['email', 'slack', 'confluence']
  sent_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_signal_updates_workspace ON signal_updates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_signal_updates_author ON signal_updates(author_id);
CREATE INDEX IF NOT EXISTS idx_signal_updates_status ON signal_updates(status);
CREATE INDEX IF NOT EXISTS idx_signal_updates_sent_at ON signal_updates(sent_at);

-- Enable RLS
ALTER TABLE signal_updates ENABLE ROW LEVEL SECURITY;
