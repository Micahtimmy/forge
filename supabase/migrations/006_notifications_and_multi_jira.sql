-- FORGE Enterprise: Notifications and Multi-JIRA Support
-- Migration 006

-- ============================================
-- SLACK INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS slack_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    bot_user_id TEXT NOT NULL,
    default_channel_id TEXT,
    default_channel_name TEXT,
    webhook_url TEXT,
    scopes TEXT[],
    installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    installed_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id)
);

CREATE INDEX idx_slack_integrations_workspace ON slack_integrations(workspace_id);

-- User-level Slack ID mapping
CREATE TABLE IF NOT EXISTS user_slack_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slack_user_id TEXT NOT NULL,
    slack_username TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_user_slack_mappings_workspace ON user_slack_mappings(workspace_id);
CREATE INDEX idx_user_slack_mappings_user ON user_slack_mappings(user_id);

-- ============================================
-- MICROSOFT TEAMS INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS teams_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    default_channel_id TEXT,
    default_channel_name TEXT,
    webhook_url TEXT,
    installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    installed_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id)
);

CREATE INDEX idx_teams_integrations_workspace ON teams_integrations(workspace_id);

-- User-level Teams ID mapping
CREATE TABLE IF NOT EXISTS user_teams_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teams_user_id TEXT NOT NULL,
    teams_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_user_teams_mappings_workspace ON user_teams_mappings(workspace_id);
CREATE INDEX idx_user_teams_mappings_user ON user_teams_mappings(user_id);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channels JSONB NOT NULL DEFAULT '{"slack": true, "teams": true, "email": true}',
    categories JSONB NOT NULL DEFAULT '{}',
    quiet_hours JSONB,
    digest_mode JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_notification_preferences_workspace ON notification_preferences(workspace_id);
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- ============================================
-- NOTIFICATION LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    channels_attempted TEXT[] NOT NULL DEFAULT '{}',
    channels_succeeded TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_logs_workspace ON notification_logs(workspace_id);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at DESC);
CREATE INDEX idx_notification_logs_category ON notification_logs(category);

-- Partition by month for efficient cleanup (optional, requires pg 11+)
-- CREATE INDEX idx_notification_logs_month ON notification_logs (date_trunc('month', created_at));

-- ============================================
-- MULTI-JIRA SUPPORT
-- ============================================

-- JIRA instances (multiple per workspace for enterprise)
CREATE TABLE IF NOT EXISTS jira_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cloud_id TEXT NOT NULL,
    site_url TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, cloud_id)
);

CREATE INDEX idx_jira_instances_workspace ON jira_instances(workspace_id);
CREATE INDEX idx_jira_instances_cloud_id ON jira_instances(cloud_id);

-- Ensure only one primary instance per workspace
CREATE UNIQUE INDEX idx_jira_instances_primary
ON jira_instances(workspace_id)
WHERE is_primary = true;

-- JIRA project mappings (which projects to sync from each instance)
CREATE TABLE IF NOT EXISTS jira_project_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jira_instance_id UUID NOT NULL REFERENCES jira_instances(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    project_key TEXT NOT NULL,
    project_name TEXT NOT NULL,
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_score BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    story_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(jira_instance_id, project_id)
);

CREATE INDEX idx_jira_project_mappings_instance ON jira_project_mappings(jira_instance_id);
CREATE INDEX idx_jira_project_mappings_workspace ON jira_project_mappings(workspace_id);

-- JIRA board mappings (optional granular control)
CREATE TABLE IF NOT EXISTS jira_board_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jira_instance_id UUID NOT NULL REFERENCES jira_instances(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    board_id TEXT NOT NULL,
    board_name TEXT NOT NULL,
    board_type TEXT NOT NULL, -- scrum, kanban
    project_key TEXT,
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(jira_instance_id, board_id)
);

CREATE INDEX idx_jira_board_mappings_instance ON jira_board_mappings(jira_instance_id);

-- ============================================
-- ML PREDICTION DATA
-- ============================================

-- Sprint predictions
CREATE TABLE IF NOT EXISTS sprint_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    sprint_id INTEGER NOT NULL,
    prediction_date DATE NOT NULL,
    failure_probability NUMERIC(5,2) NOT NULL,
    risk_factors JSONB NOT NULL DEFAULT '[]',
    confidence NUMERIC(5,2),
    model_version TEXT NOT NULL,
    actual_outcome TEXT, -- 'completed', 'failed', 'partial' - filled after sprint ends
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, sprint_id, prediction_date)
);

CREATE INDEX idx_sprint_predictions_workspace ON sprint_predictions(workspace_id);
CREATE INDEX idx_sprint_predictions_sprint ON sprint_predictions(sprint_id);
CREATE INDEX idx_sprint_predictions_date ON sprint_predictions(prediction_date DESC);

-- Story slip predictions
CREATE TABLE IF NOT EXISTS story_slip_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    sprint_id INTEGER NOT NULL,
    prediction_date DATE NOT NULL,
    slip_probability NUMERIC(5,2) NOT NULL,
    risk_factors JSONB NOT NULL DEFAULT '[]',
    recommendation TEXT,
    model_version TEXT NOT NULL,
    actual_slipped BOOLEAN, -- filled after sprint ends
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, story_id, prediction_date)
);

CREATE INDEX idx_story_slip_predictions_workspace ON story_slip_predictions(workspace_id);
CREATE INDEX idx_story_slip_predictions_story ON story_slip_predictions(story_id);
CREATE INDEX idx_story_slip_predictions_date ON story_slip_predictions(prediction_date DESC);

-- Team capacity metrics (for ML training)
CREATE TABLE IF NOT EXISTS team_capacity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    team_id UUID,
    sprint_id INTEGER,
    snapshot_date DATE NOT NULL,
    total_capacity INTEGER NOT NULL,
    allocated_points INTEGER NOT NULL,
    completed_points INTEGER,
    team_size INTEGER NOT NULL,
    avg_velocity NUMERIC(10,2),
    burnout_indicators JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_capacity_snapshots_workspace ON team_capacity_snapshots(workspace_id);
CREATE INDEX idx_team_capacity_snapshots_date ON team_capacity_snapshots(snapshot_date DESC);

-- Decision outcomes (for ML learning)
CREATE TABLE IF NOT EXISTS decision_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    evaluation_date DATE NOT NULL,
    outcome_status TEXT NOT NULL,
    impact_metrics JSONB,
    lessons_learned TEXT,
    follow_up_actions JSONB,
    evaluated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_decision_outcomes_workspace ON decision_outcomes(workspace_id);
CREATE INDEX idx_decision_outcomes_decision ON decision_outcomes(decision_id);

-- ============================================
-- UPDATE STORIES TABLE FOR MULTI-JIRA
-- ============================================

-- Add jira_instance_id to stories if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stories' AND column_name = 'jira_instance_id'
    ) THEN
        ALTER TABLE stories ADD COLUMN jira_instance_id UUID REFERENCES jira_instances(id);
        CREATE INDEX idx_stories_jira_instance ON stories(jira_instance_id);
    END IF;
END $$;

-- Add jira_instance_id to sprints if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sprints' AND column_name = 'jira_instance_id'
    ) THEN
        ALTER TABLE sprints ADD COLUMN jira_instance_id UUID REFERENCES jira_instances(id);
        CREATE INDEX idx_sprints_jira_instance ON sprints(jira_instance_id);
    END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE slack_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_project_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_board_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_slip_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_capacity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_slack_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integrations (workspace members can view, admins can modify)
CREATE POLICY slack_integrations_select ON slack_integrations FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

CREATE POLICY slack_integrations_insert ON slack_integrations FOR INSERT
    WITH CHECK (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY slack_integrations_update ON slack_integrations FOR UPDATE
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY slack_integrations_delete ON slack_integrations FOR DELETE
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Similar policies for teams_integrations
CREATE POLICY teams_integrations_select ON teams_integrations FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

CREATE POLICY teams_integrations_insert ON teams_integrations FOR INSERT
    WITH CHECK (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY teams_integrations_update ON teams_integrations FOR UPDATE
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY teams_integrations_delete ON teams_integrations FOR DELETE
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Notification preferences (users can manage their own)
CREATE POLICY notification_preferences_select ON notification_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY notification_preferences_insert ON notification_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_preferences_update ON notification_preferences FOR UPDATE
    USING (user_id = auth.uid());

-- Notification logs (workspace members can view)
CREATE POLICY notification_logs_select ON notification_logs FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

-- JIRA instances (workspace members can view, admins can modify)
CREATE POLICY jira_instances_select ON jira_instances FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

CREATE POLICY jira_instances_insert ON jira_instances FOR INSERT
    WITH CHECK (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY jira_instances_update ON jira_instances FOR UPDATE
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY jira_instances_delete ON jira_instances FOR DELETE
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- JIRA project/board mappings follow same pattern
CREATE POLICY jira_project_mappings_select ON jira_project_mappings FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

CREATE POLICY jira_project_mappings_all ON jira_project_mappings FOR ALL
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY jira_board_mappings_select ON jira_board_mappings FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

CREATE POLICY jira_board_mappings_all ON jira_board_mappings FOR ALL
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Prediction tables (workspace members can view)
CREATE POLICY sprint_predictions_select ON sprint_predictions FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

CREATE POLICY story_slip_predictions_select ON story_slip_predictions FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

CREATE POLICY team_capacity_snapshots_select ON team_capacity_snapshots FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

CREATE POLICY decision_outcomes_select ON decision_outcomes FOR SELECT
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

-- User mappings
CREATE POLICY user_slack_mappings_select ON user_slack_mappings FOR SELECT
    USING (user_id = auth.uid() OR workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY user_slack_mappings_insert ON user_slack_mappings FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY user_slack_mappings_update ON user_slack_mappings FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY user_teams_mappings_select ON user_teams_mappings FOR SELECT
    USING (user_id = auth.uid() OR workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY user_teams_mappings_insert ON user_teams_mappings FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY user_teams_mappings_update ON user_teams_mappings FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get all JIRA instances for a workspace
CREATE OR REPLACE FUNCTION get_workspace_jira_instances(p_workspace_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    cloud_id TEXT,
    site_url TEXT,
    is_primary BOOLEAN,
    sync_enabled BOOLEAN,
    last_sync_at TIMESTAMPTZ,
    project_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ji.id,
        ji.name,
        ji.cloud_id,
        ji.site_url,
        ji.is_primary,
        ji.sync_enabled,
        ji.last_sync_at,
        COUNT(jpm.id) as project_count
    FROM jira_instances ji
    LEFT JOIN jira_project_mappings jpm ON jpm.jira_instance_id = ji.id
    WHERE ji.workspace_id = p_workspace_id
    GROUP BY ji.id
    ORDER BY ji.is_primary DESC, ji.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user should receive notification
CREATE OR REPLACE FUNCTION should_notify_user(
    p_user_id UUID,
    p_workspace_id UUID,
    p_category TEXT,
    p_channel TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_prefs JSONB;
    v_category_prefs JSONB;
BEGIN
    -- Get user preferences
    SELECT categories INTO v_prefs
    FROM notification_preferences
    WHERE user_id = p_user_id AND workspace_id = p_workspace_id;

    -- If no preferences, use defaults (notify)
    IF v_prefs IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check category preferences
    v_category_prefs := v_prefs -> p_category;

    IF v_category_prefs IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check if category is enabled
    IF NOT (v_category_prefs ->> 'enabled')::boolean THEN
        RETURN FALSE;
    END IF;

    -- Check if channel is in allowed channels
    RETURN p_channel = ANY(
        SELECT jsonb_array_elements_text(v_category_prefs -> 'channels')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
