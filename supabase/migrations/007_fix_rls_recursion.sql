-- Fix infinite recursion in RLS policies
-- The workspace_members policy was referencing itself, causing infinite recursion

-- Drop problematic policies
DROP POLICY IF EXISTS workspace_members_access ON workspace_members;
DROP POLICY IF EXISTS users_workspace_read ON users;

-- Fix workspace_members policy - use direct user_id check only
CREATE POLICY workspace_members_access ON workspace_members
    FOR ALL USING (user_id = auth.uid());

-- Fix users policy - allow users to read their own profile
-- and read other users in the same workspace (without recursion)
DROP POLICY IF EXISTS users_self_access ON users;
CREATE POLICY users_self_access ON users
    FOR ALL USING (id = auth.uid());

-- Allow reading other users in same workspace via a function to avoid recursion
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
  SELECT workspace_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY users_workspace_read ON users
    FOR SELECT USING (
        workspace_id = get_user_workspace_id()
    );
