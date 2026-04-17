-- Create pi_dependencies table (cross-team dependencies)
CREATE TABLE IF NOT EXISTS pi_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_id UUID NOT NULL REFERENCES program_increments(id) ON DELETE CASCADE,
  -- Source (depends ON)
  from_story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  from_team_id UUID REFERENCES pi_teams(id) ON DELETE CASCADE,
  from_iteration INTEGER, -- which iteration the source is planned for
  -- Target (depended BY)
  to_story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  to_team_id UUID REFERENCES pi_teams(id) ON DELETE CASCADE,
  to_iteration INTEGER, -- which iteration the target is planned for
  -- Dependency metadata
  description TEXT,
  dependency_type TEXT DEFAULT 'finish-to-start' CHECK (
    dependency_type IN ('finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish')
  ),
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'at_risk', 'blocked')),
  -- Risk assessment
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_notes TEXT,
  -- Owner responsible for resolution
  owner_id UUID REFERENCES users(id),
  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  -- AI-detected flag
  ai_detected BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pi_dependencies_pi ON pi_dependencies(pi_id);
CREATE INDEX IF NOT EXISTS idx_pi_dependencies_from_team ON pi_dependencies(from_team_id);
CREATE INDEX IF NOT EXISTS idx_pi_dependencies_to_team ON pi_dependencies(to_team_id);
CREATE INDEX IF NOT EXISTS idx_pi_dependencies_status ON pi_dependencies(status);
CREATE INDEX IF NOT EXISTS idx_pi_dependencies_from_story ON pi_dependencies(from_story_id);
CREATE INDEX IF NOT EXISTS idx_pi_dependencies_to_story ON pi_dependencies(to_story_id);

-- Enable RLS
ALTER TABLE pi_dependencies ENABLE ROW LEVEL SECURITY;
