-- Migration: Decision Intelligence System
-- Features: JIRA Bi-directional Sync, Decisions, Notifications, Health Score, Predictions

-- ============================================
-- JIRA SYNC OPERATIONS (Bi-directional)
-- ============================================

CREATE TABLE IF NOT EXISTS jira_sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  jira_issue_key TEXT NOT NULL,

  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'update_field', 'add_comment', 'transition', 'apply_suggestion', 'add_label', 'remove_label'
  )),

  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'failed', 'conflict'
  )),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  initiated_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jira_sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  operation_id UUID NOT NULL REFERENCES jira_sync_operations(id) ON DELETE CASCADE,

  field_name TEXT NOT NULL,
  forge_value JSONB,
  jira_value JSONB,
  jira_updated_at TIMESTAMPTZ,

  resolution TEXT CHECK (resolution IN ('forge_wins', 'jira_wins', 'manual', 'merged')),
  resolved_value JSONB,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_ops_workspace ON jira_sync_operations(workspace_id, created_at DESC);
CREATE INDEX idx_sync_ops_status ON jira_sync_operations(workspace_id, status) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_sync_ops_story ON jira_sync_operations(story_id);
CREATE INDEX idx_sync_conflicts_pending ON jira_sync_conflicts(workspace_id) WHERE resolution IS NULL;

-- ============================================
-- DECISION INTELLIGENCE LAYER
-- ============================================

-- Drop existing simpler decisions table from migration 002
DROP TABLE IF EXISTS decisions CASCADE;

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),

  title TEXT NOT NULL,
  description TEXT,
  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'scope_change', 'priority_shift', 'resource_allocation',
    'technical_decision', 'process_change', 'risk_acceptance', 'other'
  )),

  -- Context snapshot at decision time (immutable)
  context JSONB NOT NULL DEFAULT '{}',

  -- The actual decision
  decision JSONB NOT NULL,

  -- AI-generated insights
  ai_summary TEXT,
  ai_risk_assessment JSONB,

  -- Outcome tracking
  outcome_status TEXT DEFAULT 'pending' CHECK (outcome_status IN (
    'pending', 'successful', 'partial', 'failed', 'unknown'
  )),
  outcome JSONB,
  outcome_evaluated_at TIMESTAMPTZ,
  outcome_evaluated_by UUID REFERENCES users(id),

  tags TEXT[] DEFAULT '{}',
  visibility TEXT DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'workspace')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decision_story_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('caused_by', 'affects', 'blocks', 'related')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(decision_id, story_id, link_type)
);

CREATE TABLE IF NOT EXISTS decision_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  template JSONB NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decisions_workspace ON decisions(workspace_id, created_at DESC);
CREATE INDEX idx_decisions_type ON decisions(workspace_id, decision_type);
CREATE INDEX idx_decisions_outcome ON decisions(workspace_id, outcome_status);
CREATE INDEX idx_decisions_tags ON decisions USING GIN (tags);
CREATE INDEX idx_decision_links_story ON decision_story_links(story_id);

-- ============================================
-- SMART NOTIFICATION SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  source_type TEXT NOT NULL, -- 'quality_gate', 'signal', 'horizon', 'jira', 'decision', 'system'
  source_id TEXT,

  importance TEXT DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high', 'critical')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),

  name TEXT NOT NULL,
  description TEXT,

  event_types TEXT[] NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',

  channels TEXT[] NOT NULL, -- ['email', 'slack', 'in_app']
  recipients JSONB NOT NULL, -- { type: 'user'|'role'|'team', ids: string[] }

  template_override JSONB,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  event_id UUID REFERENCES notification_events(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES notification_rules(id) ON DELETE SET NULL,

  channel TEXT NOT NULL CHECK (channel IN ('email', 'slack', 'in_app')),

  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,

  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  email_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,

  digest_frequency TEXT DEFAULT 'realtime' CHECK (digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  digest_time TIME DEFAULT '09:00',
  digest_timezone TEXT DEFAULT 'UTC',

  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  event_preferences JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, workspace_id)
);

CREATE INDEX idx_events_workspace ON notification_events(workspace_id, created_at DESC);
CREATE INDEX idx_events_type ON notification_events(workspace_id, event_type);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE status != 'read';
CREATE INDEX idx_notifications_pending ON notifications(status) WHERE status = 'pending';

-- ============================================
-- PROGRAM HEALTH SCORE
-- ============================================

CREATE TABLE IF NOT EXISTS program_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pi_id UUID REFERENCES program_increments(id) ON DELETE SET NULL,

  health_score INTEGER NOT NULL CHECK (health_score BETWEEN 0 AND 100),
  health_status TEXT NOT NULL CHECK (health_status IN ('excellent', 'good', 'at_risk', 'critical')),

  dimensions JSONB NOT NULL,
  top_positive_drivers JSONB,
  top_negative_drivers JSONB,

  ai_recommendations JSONB,

  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_workspace ON program_health_scores(workspace_id, calculated_at DESC);
CREATE INDEX idx_health_pi ON program_health_scores(pi_id, calculated_at DESC);

-- ============================================
-- PREDICTIVE DELIVERY INTELLIGENCE
-- ============================================

CREATE TABLE IF NOT EXISTS sprint_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sprint_id INTEGER NOT NULL,

  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  contributing_factors JSONB NOT NULL,
  recommendations JSONB,

  -- Outcome tracking for model improvement
  actual_completion_rate NUMERIC(5,2),
  actual_outcome TEXT CHECK (actual_outcome IN ('on_track', 'partial', 'failed')),
  prediction_accuracy NUMERIC(5,2),

  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  sprint_id INTEGER,

  slip_probability NUMERIC(5,4) NOT NULL CHECK (slip_probability BETWEEN 0 AND 1),
  risk_factors JSONB NOT NULL,
  recommended_actions JSONB,

  actual_slipped BOOLEAN,

  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sprint_pred_workspace ON sprint_predictions(workspace_id, sprint_id);
CREATE INDEX idx_sprint_pred_risk ON sprint_predictions(workspace_id, risk_level);
CREATE INDEX idx_story_pred_workspace ON story_predictions(workspace_id, story_id);
CREATE INDEX idx_story_pred_risk ON story_predictions(workspace_id, slip_probability DESC);

-- ============================================
-- QUALITY GATES (Continuous Enforcement)
-- ============================================

CREATE TABLE IF NOT EXISTS quality_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  trigger_transition TEXT NOT NULL, -- e.g., "any->Ready for Dev", "Backlog->Selected"
  min_score INTEGER NOT NULL CHECK (min_score BETWEEN 0 AND 100),

  action TEXT NOT NULL CHECK (action IN ('block', 'warn', 'comment')),
  required_dimensions TEXT[], -- specific dimensions that must pass

  notification_channels TEXT[] DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  gate_id UUID NOT NULL REFERENCES quality_gates(id) ON DELETE CASCADE,

  violation_type TEXT NOT NULL CHECK (violation_type IN ('score_below_threshold', 'missing_dimension', 'blocked')),
  score_at_time INTEGER NOT NULL,
  required_score INTEGER NOT NULL,

  jira_comment_id TEXT,

  resolution_status TEXT DEFAULT 'open' CHECK (resolution_status IN ('open', 'resolved', 'waived', 'expired')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quality_gates_workspace ON quality_gates(workspace_id);
CREATE INDEX idx_quality_violations_open ON quality_violations(workspace_id, resolution_status) WHERE resolution_status = 'open';
CREATE INDEX idx_quality_violations_story ON quality_violations(story_id);

-- ============================================
-- TEAM INTELLIGENCE PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS team_member_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  metrics JSONB NOT NULL DEFAULT '{}',

  strengths TEXT[],
  growth_areas TEXT[],
  coaching_suggestions JSONB,

  velocity_trend TEXT CHECK (velocity_trend IN ('improving', 'stable', 'declining')),
  quality_trend TEXT CHECK (quality_trend IN ('improving', 'stable', 'declining')),

  visibility TEXT DEFAULT 'manager_visible' CHECK (visibility IN (
    'self_only', 'manager_visible', 'team_visible', 'anonymous_team'
  )),

  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_member_metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES team_member_profiles(id) ON DELETE CASCADE,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_profiles_workspace ON team_member_profiles(workspace_id);
CREATE INDEX idx_team_profiles_user ON team_member_profiles(user_id);
CREATE INDEX idx_team_metrics_history ON team_member_metrics_history(profile_id, period_end DESC);

-- ============================================
-- SCENARIO SIMULATION ENGINE
-- ============================================

CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),

  name TEXT NOT NULL,
  description TEXT,

  baseline JSONB NOT NULL,
  changes JSONB NOT NULL,
  results JSONB,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'simulated', 'applied', 'archived')),

  simulated_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scenarios_workspace ON scenarios(workspace_id, created_at DESC);
CREATE INDEX idx_scenarios_status ON scenarios(workspace_id, status);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE jira_sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_story_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Workspace isolation policies
CREATE POLICY workspace_isolation ON jira_sync_operations USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY workspace_isolation ON jira_sync_conflicts USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY workspace_isolation ON decisions USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY workspace_isolation ON decision_story_links USING (
  decision_id IN (SELECT id FROM decisions WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE POLICY workspace_isolation ON decision_templates USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY workspace_isolation ON notification_events USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY workspace_isolation ON notification_rules USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY user_notifications ON notifications USING (user_id = auth.uid());

CREATE POLICY user_preferences ON notification_preferences USING (user_id = auth.uid());

CREATE POLICY workspace_isolation ON program_health_scores USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY workspace_isolation ON sprint_predictions USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY workspace_isolation ON story_predictions USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY workspace_isolation ON quality_gates USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY workspace_isolation ON quality_violations USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY workspace_isolation ON scenarios USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

-- Team profiles have special visibility rules
CREATE POLICY team_profiles_visibility ON team_member_profiles USING (
  user_id = auth.uid() -- Can always see own profile
  OR (
    visibility IN ('team_visible', 'manager_visible')
    AND workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY team_metrics_visibility ON team_member_metrics_history USING (
  profile_id IN (SELECT id FROM team_member_profiles WHERE user_id = auth.uid())
  OR profile_id IN (
    SELECT id FROM team_member_profiles
    WHERE visibility IN ('team_visible', 'manager_visible')
    AND workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  )
);
