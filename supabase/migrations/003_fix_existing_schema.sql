-- FORGE Schema Fix Migration
-- Run this in Supabase SQL Editor to fix your existing database
-- This adds missing columns and policies that were in the old numbered migrations

-- ============================================
-- FIX WORKSPACES TABLE
-- ============================================
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise'));
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- ============================================
-- FIX USERS TABLE
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Make workspace_id nullable (users can exist before joining workspace)
ALTER TABLE users ALTER COLUMN workspace_id DROP NOT NULL;

-- ============================================
-- ADD MISSING RLS POLICIES
-- ============================================

-- Drop old conflicting policies if they exist
DROP POLICY IF EXISTS "Users can view their own workspace" ON workspaces;
DROP POLICY IF EXISTS "Users can view users in their workspace" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Users can read/update their own profile (CRITICAL for middleware)
DROP POLICY IF EXISTS users_self_access ON users;
CREATE POLICY users_self_access ON users
    FOR ALL USING (id = auth.uid());

-- Workspace access: members can access, or creator can access
DROP POLICY IF EXISTS workspace_member_access ON workspaces;
CREATE POLICY workspace_member_access ON workspaces
    FOR ALL USING (
        id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
        OR id IN (SELECT workspace_id FROM users WHERE id = auth.uid())
    );

-- Allow authenticated users to create workspaces
DROP POLICY IF EXISTS workspace_insert ON workspaces;
CREATE POLICY workspace_insert ON workspaces
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to create their own user profile
DROP POLICY IF EXISTS users_insert ON users;
CREATE POLICY users_insert ON users
    FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================
-- CREATE WORKSPACE_MEMBERS TABLE IF MISSING
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_members_access ON workspace_members;
CREATE POLICY workspace_members_access ON workspace_members
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS workspace_members_insert ON workspace_members;
CREATE POLICY workspace_members_insert ON workspace_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- CREATE TEAM_INVITATIONS TABLE IF MISSING
-- ============================================
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(workspace_id, email)
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_invitations_access ON team_invitations;
CREATE POLICY team_invitations_access ON team_invitations
    FOR ALL USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );
