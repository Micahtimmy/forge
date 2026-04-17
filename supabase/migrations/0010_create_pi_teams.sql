-- Create pi_teams table (teams participating in a PI)
CREATE TABLE IF NOT EXISTS pi_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_id UUID NOT NULL REFERENCES program_increments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- JIRA board mapping
  jira_board_id TEXT,
  jira_project_key TEXT,
  -- Capacity planning
  team_size INTEGER,
  capacity_per_iteration INTEGER[], -- array of capacity per iteration
  -- Historical data
  velocity_history INTEGER[], -- last 6 sprints
  average_velocity INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN array_length(velocity_history, 1) > 0
      THEN (SELECT AVG(v)::INTEGER FROM unnest(velocity_history) AS v)
      ELSE NULL
    END
  ) STORED,
  -- PI-specific data
  committed_points INTEGER DEFAULT 0,
  completed_points INTEGER DEFAULT 0,
  -- Team objectives
  objectives JSONB,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pi_teams_pi ON pi_teams(pi_id);
CREATE INDEX IF NOT EXISTS idx_pi_teams_jira_board ON pi_teams(jira_board_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pi_teams_unique ON pi_teams(pi_id, name);

-- Enable RLS
ALTER TABLE pi_teams ENABLE ROW LEVEL SECURITY;
