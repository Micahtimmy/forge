-- Performance indexes for common query patterns
-- Run: supabase db push

-- Stories table - frequently filtered/sorted
CREATE INDEX IF NOT EXISTS idx_stories_workspace_sprint
  ON stories(workspace_id, sprint_id)
  WHERE sprint_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stories_workspace_status
  ON stories(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_stories_workspace_created
  ON stories(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stories_jira_key
  ON stories(workspace_id, jira_key)
  WHERE jira_key IS NOT NULL;

-- Story scores - join performance
CREATE INDEX IF NOT EXISTS idx_story_scores_story_latest
  ON story_scores(story_id, scored_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_scores_workspace
  ON story_scores(workspace_id, scored_at DESC);

-- Decisions table - common filters
CREATE INDEX IF NOT EXISTS idx_decisions_workspace_type
  ON decisions(workspace_id, decision_type);

CREATE INDEX IF NOT EXISTS idx_decisions_workspace_outcome
  ON decisions(workspace_id, outcome_status);

CREATE INDEX IF NOT EXISTS idx_decisions_workspace_created
  ON decisions(workspace_id, created_at DESC);

-- Decision story links - join performance
CREATE INDEX IF NOT EXISTS idx_decision_story_links_decision
  ON decision_story_links(decision_id);

CREATE INDEX IF NOT EXISTS idx_decision_story_links_story
  ON decision_story_links(story_id);

-- Signal updates - common queries
CREATE INDEX IF NOT EXISTS idx_signal_updates_workspace_status
  ON signal_updates(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_signal_updates_workspace_created
  ON signal_updates(workspace_id, created_at DESC);

-- Sprints - active sprint lookup
CREATE INDEX IF NOT EXISTS idx_sprints_workspace_state
  ON sprints(workspace_id, state);

-- Program increments - status filter
CREATE INDEX IF NOT EXISTS idx_pis_workspace_status
  ON program_increments(workspace_id, status);

-- PI features - canvas data
CREATE INDEX IF NOT EXISTS idx_pi_features_pi_team
  ON pi_features(pi_id, team_id);

CREATE INDEX IF NOT EXISTS idx_pi_features_pi_iteration
  ON pi_features(pi_id, iteration_id);

-- Dependencies - graph queries
CREATE INDEX IF NOT EXISTS idx_pi_dependencies_pi
  ON pi_dependencies(pi_id);

CREATE INDEX IF NOT EXISTS idx_pi_dependencies_from
  ON pi_dependencies(from_feature_id);

CREATE INDEX IF NOT EXISTS idx_pi_dependencies_to
  ON pi_dependencies(to_feature_id);

-- Risks - status filter
CREATE INDEX IF NOT EXISTS idx_pi_risks_pi_status
  ON pi_risks(pi_id, status);

-- JIRA connections - lookup by workspace
CREATE INDEX IF NOT EXISTS idx_jira_connections_workspace
  ON jira_connections(workspace_id);

-- Workspace members - permission checks
CREATE INDEX IF NOT EXISTS idx_workspace_members_user
  ON workspace_members(user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_role
  ON workspace_members(workspace_id, role);

-- Scoring rubrics - default lookup
CREATE INDEX IF NOT EXISTS idx_scoring_rubrics_workspace_default
  ON scoring_rubrics(workspace_id, is_default DESC);

-- Analytics - time-series queries
CREATE INDEX IF NOT EXISTS idx_analytics_workspace_date
  ON analytics_snapshots(workspace_id, snapshot_date DESC)
  WHERE snapshot_date IS NOT NULL;

-- Partial index for active items (common filter)
CREATE INDEX IF NOT EXISTS idx_stories_workspace_active
  ON stories(workspace_id)
  WHERE status NOT IN ('done', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_pi_risks_workspace_open
  ON pi_risks(pi_id)
  WHERE status NOT IN ('resolved', 'closed');

-- Full text search indexes (if pg_trgm extension is available)
-- Uncomment after enabling: CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_stories_title_trgm ON stories USING gin(title gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_decisions_title_trgm ON decisions USING gin(title gin_trgm_ops);
