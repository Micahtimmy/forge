-- FORGE Complete Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ayfjdrilpwzrodigkdex/sql/new
-- This migration creates ALL required tables for FORGE to function

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CORE TABLES
-- ============================================

-- Workspaces table (multi-tenant root)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    team_size TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Users profile table (links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    display_name TEXT,
    role TEXT CHECK (role IN ('sm', 'pm', 'pgm', 'rte', 'admin', 'member')),
    avatar_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workspace members (links users to workspaces with roles)
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(workspace_id, user_id)
);

-- ============================================
-- JIRA INTEGRATION
-- ============================================

-- JIRA connections
CREATE TABLE IF NOT EXISTS jira_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
    cloud_id TEXT NOT NULL,
    site_url TEXT NOT NULL,
    site_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    scopes TEXT[] NOT NULL,
    connected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'in_progress', 'partial')),
    last_sync_error TEXT,
    stories_synced INTEGER DEFAULT 0
);

-- Sprints (synced from JIRA)
CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    jira_sprint_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('active', 'closed', 'future')),
    goal TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    complete_date TIMESTAMPTZ,
    board_id INTEGER NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(workspace_id, jira_sprint_id)
);

-- Stories (synced from JIRA)
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    jira_key TEXT NOT NULL,
    jira_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    acceptance_criteria TEXT,
    story_points DECIMAL,
    status TEXT NOT NULL,
    status_category TEXT NOT NULL CHECK (status_category IN ('todo', 'in_progress', 'done')),
    issue_type TEXT NOT NULL,
    priority TEXT,
    labels TEXT[],
    epic_key TEXT,
    epic_name TEXT,
    sprint_id INTEGER,
    sprint_name TEXT,
    assignee_email TEXT,
    assignee_name TEXT,
    reporter_email TEXT,
    reporter_name TEXT,
    jira_created_at TIMESTAMPTZ NOT NULL,
    jira_updated_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(workspace_id, jira_key)
);

-- ============================================
-- QUALITY GATE (Scoring)
-- ============================================

-- Story scores (AI-generated quality scores)
CREATE TABLE IF NOT EXISTS story_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
    completeness_score INTEGER NOT NULL,
    completeness_max INTEGER NOT NULL DEFAULT 25,
    clarity_score INTEGER NOT NULL,
    clarity_max INTEGER NOT NULL DEFAULT 25,
    estimability_score INTEGER NOT NULL,
    estimability_max INTEGER NOT NULL DEFAULT 20,
    traceability_score INTEGER NOT NULL,
    traceability_max INTEGER NOT NULL DEFAULT 15,
    testability_score INTEGER NOT NULL,
    testability_max INTEGER NOT NULL DEFAULT 15,
    completeness_reasoning TEXT,
    clarity_reasoning TEXT,
    estimability_reasoning TEXT,
    traceability_reasoning TEXT,
    testability_reasoning TEXT,
    suggestions JSONB DEFAULT '[]'::jsonb,
    ai_model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    scored_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Scoring rubrics (configurable per workspace)
CREATE TABLE IF NOT EXISTS scoring_rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    completeness_weight INTEGER NOT NULL DEFAULT 25,
    clarity_weight INTEGER NOT NULL DEFAULT 25,
    estimability_weight INTEGER NOT NULL DEFAULT 20,
    traceability_weight INTEGER NOT NULL DEFAULT 15,
    testability_weight INTEGER NOT NULL DEFAULT 15,
    custom_rules JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- SIGNAL (Stakeholder Updates)
-- ============================================

-- Signal updates (stakeholder communications)
CREATE TABLE IF NOT EXISTS signal_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    sprint_ref TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'archived')),
    author_id UUID NOT NULL REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Signal update drafts (per audience)
CREATE TABLE IF NOT EXISTS signal_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    update_id UUID NOT NULL REFERENCES signal_updates(id) ON DELETE CASCADE,
    audience TEXT NOT NULL CHECK (audience IN ('executive', 'team', 'client', 'board')),
    content TEXT NOT NULL,
    tone INTEGER NOT NULL CHECK (tone >= 1 AND tone <= 5),
    ai_generated BOOLEAN DEFAULT TRUE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(update_id, audience)
);

-- Decisions log
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    decision TEXT NOT NULL,
    rationale TEXT,
    stakeholders TEXT[],
    status TEXT NOT NULL CHECK (status IN ('proposed', 'approved', 'rejected', 'superseded')),
    author_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- HORIZON (PI Planning)
-- ============================================

-- PI Planning (Program Increments)
CREATE TABLE IF NOT EXISTS program_increments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'completed')),
    iteration_count INTEGER NOT NULL DEFAULT 5,
    iteration_length_weeks INTEGER NOT NULL DEFAULT 2,
    canvas_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PI Teams
CREATE TABLE IF NOT EXISTS pi_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pi_id UUID NOT NULL REFERENCES program_increments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_capacity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PI Features (items on the planning board)
CREATE TABLE IF NOT EXISTS pi_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pi_id UUID NOT NULL REFERENCES program_increments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES pi_teams(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER,
    iteration_index INTEGER,
    jira_key TEXT,
    risk_level TEXT CHECK (risk_level IN ('none', 'low', 'medium', 'high')),
    status TEXT NOT NULL CHECK (status IN ('backlog', 'planned', 'committed', 'completed')),
    position_x DECIMAL,
    position_y DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PI Dependencies
CREATE TABLE IF NOT EXISTS pi_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pi_id UUID NOT NULL REFERENCES program_increments(id) ON DELETE CASCADE,
    source_feature_id UUID NOT NULL REFERENCES pi_features(id) ON DELETE CASCADE,
    target_feature_id UUID NOT NULL REFERENCES pi_features(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('open', 'resolved', 'at_risk', 'blocked')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(source_feature_id, target_feature_id)
);

-- PI Risks
CREATE TABLE IF NOT EXISTS pi_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pi_id UUID NOT NULL REFERENCES program_increments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    probability TEXT NOT NULL CHECK (probability IN ('low', 'medium', 'high')),
    impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
    mitigation TEXT,
    owner_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL CHECK (status IN ('identified', 'mitigating', 'resolved', 'accepted')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- BILLING (Paystack)
-- ============================================

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
    paystack_customer_code TEXT,
    paystack_subscription_code TEXT,
    plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_stories_workspace ON stories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stories_jira_key ON stories(workspace_id, jira_key);
CREATE INDEX IF NOT EXISTS idx_stories_sprint ON stories(workspace_id, sprint_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(workspace_id, status_category);
CREATE INDEX IF NOT EXISTS idx_story_scores_story ON story_scores(story_id);
CREATE INDEX IF NOT EXISTS idx_story_scores_workspace ON story_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_signal_updates_workspace ON signal_updates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_program_increments_workspace ON program_increments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pi_features_pi ON pi_features(pi_id);
CREATE INDEX IF NOT EXISTS idx_pi_dependencies_pi ON pi_dependencies(pi_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_increments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users can read/update their own profile
DROP POLICY IF EXISTS users_self_access ON users;
CREATE POLICY users_self_access ON users
    FOR ALL USING (id = auth.uid());

-- Users can view other users in same workspace
DROP POLICY IF EXISTS users_workspace_read ON users;
CREATE POLICY users_workspace_read ON users
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

-- Workspace access via membership
DROP POLICY IF EXISTS workspace_member_access ON workspaces;
CREATE POLICY workspace_member_access ON workspaces
    FOR ALL USING (
        id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );

-- Allow creating workspaces for authenticated users
DROP POLICY IF EXISTS workspace_insert ON workspaces;
CREATE POLICY workspace_insert ON workspaces
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS workspace_members_access ON workspace_members;
CREATE POLICY workspace_members_access ON workspace_members
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

-- Allow inserting workspace members for authenticated users
DROP POLICY IF EXISTS workspace_members_insert ON workspace_members;
CREATE POLICY workspace_members_insert ON workspace_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS jira_connections_access ON jira_connections;
CREATE POLICY jira_connections_access ON jira_connections
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS sprints_access ON sprints;
CREATE POLICY sprints_access ON sprints
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS stories_access ON stories;
CREATE POLICY stories_access ON stories
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS story_scores_access ON story_scores;
CREATE POLICY story_scores_access ON story_scores
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS scoring_rubrics_access ON scoring_rubrics;
CREATE POLICY scoring_rubrics_access ON scoring_rubrics
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS signal_updates_access ON signal_updates;
CREATE POLICY signal_updates_access ON signal_updates
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS signal_drafts_access ON signal_drafts;
CREATE POLICY signal_drafts_access ON signal_drafts
    FOR ALL USING (
        update_id IN (
            SELECT id FROM signal_updates
            WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS decisions_access ON decisions;
CREATE POLICY decisions_access ON decisions
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS program_increments_access ON program_increments;
CREATE POLICY program_increments_access ON program_increments
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS pi_teams_access ON pi_teams;
CREATE POLICY pi_teams_access ON pi_teams
    FOR ALL USING (
        pi_id IN (
            SELECT id FROM program_increments
            WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS pi_features_access ON pi_features;
CREATE POLICY pi_features_access ON pi_features
    FOR ALL USING (
        pi_id IN (
            SELECT id FROM program_increments
            WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS pi_dependencies_access ON pi_dependencies;
CREATE POLICY pi_dependencies_access ON pi_dependencies
    FOR ALL USING (
        pi_id IN (
            SELECT id FROM program_increments
            WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS pi_risks_access ON pi_risks;
CREATE POLICY pi_risks_access ON pi_risks
    FOR ALL USING (
        pi_id IN (
            SELECT id FROM program_increments
            WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS subscriptions_access ON subscriptions;
CREATE POLICY subscriptions_access ON subscriptions
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspaces_updated_at ON workspaces;
CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS workspace_members_updated_at ON workspace_members;
CREATE TRIGGER workspace_members_updated_at BEFORE UPDATE ON workspace_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS jira_connections_updated_at ON jira_connections;
CREATE TRIGGER jira_connections_updated_at BEFORE UPDATE ON jira_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sprints_updated_at ON sprints;
CREATE TRIGGER sprints_updated_at BEFORE UPDATE ON sprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS stories_updated_at ON stories;
CREATE TRIGGER stories_updated_at BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS scoring_rubrics_updated_at ON scoring_rubrics;
CREATE TRIGGER scoring_rubrics_updated_at BEFORE UPDATE ON scoring_rubrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS signal_updates_updated_at ON signal_updates;
CREATE TRIGGER signal_updates_updated_at BEFORE UPDATE ON signal_updates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS signal_drafts_updated_at ON signal_drafts;
CREATE TRIGGER signal_drafts_updated_at BEFORE UPDATE ON signal_drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS decisions_updated_at ON decisions;
CREATE TRIGGER decisions_updated_at BEFORE UPDATE ON decisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS program_increments_updated_at ON program_increments;
CREATE TRIGGER program_increments_updated_at BEFORE UPDATE ON program_increments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS pi_teams_updated_at ON pi_teams;
CREATE TRIGGER pi_teams_updated_at BEFORE UPDATE ON pi_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS pi_features_updated_at ON pi_features;
CREATE TRIGGER pi_features_updated_at BEFORE UPDATE ON pi_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS pi_dependencies_updated_at ON pi_dependencies;
CREATE TRIGGER pi_dependencies_updated_at BEFORE UPDATE ON pi_dependencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS pi_risks_updated_at ON pi_risks;
CREATE TRIGGER pi_risks_updated_at BEFORE UPDATE ON pi_risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Done!
-- After running this migration, Google OAuth will work correctly.
