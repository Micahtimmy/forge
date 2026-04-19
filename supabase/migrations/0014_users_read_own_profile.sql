-- Allow users to always read their own profile (needed for middleware auth check)
-- Without this, RLS blocks profile reads when JWT doesn't have workspace_id yet
CREATE POLICY IF NOT EXISTS "Users can read own profile"
  ON users FOR SELECT
  USING (id = auth.uid());
