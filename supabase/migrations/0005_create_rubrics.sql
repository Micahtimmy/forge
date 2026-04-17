-- Create rubrics table (scoring configuration)
CREATE TABLE IF NOT EXISTS rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  -- Weights for each dimension (must sum to 100)
  weights JSONB NOT NULL DEFAULT '{
    "completeness": 25,
    "clarity": 25,
    "estimability": 20,
    "traceability": 15,
    "testability": 15
  }'::jsonb,
  -- Words/phrases that penalize the score
  blocklist TEXT[] DEFAULT ARRAY['handle', 'manage', 'do', 'process', 'deal with', 'take care of'],
  -- Minimum score threshold for "healthy" stories
  threshold INTEGER DEFAULT 70,
  -- Optional: per-project assignment
  jira_project_keys TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rubrics_workspace ON rubrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_default ON rubrics(workspace_id, is_default) WHERE is_default = TRUE;

-- Enable RLS
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;

-- Function to ensure only one default rubric per workspace
CREATE OR REPLACE FUNCTION ensure_single_default_rubric()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE rubrics
    SET is_default = FALSE
    WHERE workspace_id = NEW.workspace_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for single default rubric
DROP TRIGGER IF EXISTS trigger_single_default_rubric ON rubrics;
CREATE TRIGGER trigger_single_default_rubric
  BEFORE INSERT OR UPDATE ON rubrics
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_rubric();
