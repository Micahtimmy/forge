-- Row Level Security Policies for FORGE
-- All tables must enforce workspace isolation

-- Helper function to get current user's workspace_id from JWT
CREATE OR REPLACE FUNCTION auth.workspace_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'workspace_id')::uuid,
    NULL
  );
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is workspace admin
CREATE OR REPLACE FUNCTION auth.is_workspace_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND workspace_id = auth.workspace_id()
    AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE;

-- ==================== WORKSPACES ====================
CREATE POLICY "Users can view their own workspace"
  ON workspaces FOR SELECT
  USING (id = auth.workspace_id());

CREATE POLICY "Admins can update their workspace"
  ON workspaces FOR UPDATE
  USING (id = auth.workspace_id() AND auth.is_workspace_admin());

-- ==================== USERS ====================
CREATE POLICY "Users can view users in their workspace"
  ON users FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can manage users in their workspace"
  ON users FOR ALL
  USING (workspace_id = auth.workspace_id() AND auth.is_workspace_admin());

-- ==================== JIRA CONNECTIONS ====================
CREATE POLICY "Users can view JIRA connections in their workspace"
  ON jira_connections FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "Admins can manage JIRA connections"
  ON jira_connections FOR ALL
  USING (workspace_id = auth.workspace_id() AND auth.is_workspace_admin());

-- ==================== STORIES ====================
CREATE POLICY "Users can view stories in their workspace"
  ON stories FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "System can insert/update stories during sync"
  ON stories FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "System can update stories during sync"
  ON stories FOR UPDATE
  USING (workspace_id = auth.workspace_id());

-- ==================== RUBRICS ====================
CREATE POLICY "Users can view rubrics in their workspace"
  ON rubrics FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "Admins can manage rubrics"
  ON rubrics FOR ALL
  USING (workspace_id = auth.workspace_id() AND auth.is_workspace_admin());

-- ==================== STORY SCORES ====================
CREATE POLICY "Users can view scores in their workspace"
  ON story_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_scores.story_id
      AND stories.workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "System can insert scores"
  ON story_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_scores.story_id
      AND stories.workspace_id = auth.workspace_id()
    )
  );

-- ==================== SIGNAL UPDATES ====================
CREATE POLICY "Users can view updates in their workspace"
  ON signal_updates FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "Users can create updates in their workspace"
  ON signal_updates FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id() AND author_id = auth.uid());

CREATE POLICY "Authors can update their own updates"
  ON signal_updates FOR UPDATE
  USING (workspace_id = auth.workspace_id() AND author_id = auth.uid());

CREATE POLICY "Authors can delete their own drafts"
  ON signal_updates FOR DELETE
  USING (workspace_id = auth.workspace_id() AND author_id = auth.uid() AND status = 'draft');

-- ==================== DECISIONS ====================
CREATE POLICY "Users can view decisions in their workspace"
  ON decisions FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "Users can create decisions"
  ON decisions FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id() AND made_by_id = auth.uid());

CREATE POLICY "Decision makers can update their decisions"
  ON decisions FOR UPDATE
  USING (workspace_id = auth.workspace_id() AND made_by_id = auth.uid());

-- ==================== PROGRAM INCREMENTS ====================
CREATE POLICY "Users can view PIs in their workspace"
  ON program_increments FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "RTEs and Admins can manage PIs"
  ON program_increments FOR ALL
  USING (
    workspace_id = auth.workspace_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND workspace_id = auth.workspace_id()
      AND role IN ('rte', 'admin', 'pgm')
    )
  );

-- ==================== PI TEAMS ====================
CREATE POLICY "Users can view PI teams in their workspace"
  ON pi_teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_increments
      WHERE program_increments.id = pi_teams.pi_id
      AND program_increments.workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "RTEs and Admins can manage PI teams"
  ON pi_teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM program_increments
      WHERE program_increments.id = pi_teams.pi_id
      AND program_increments.workspace_id = auth.workspace_id()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('rte', 'admin', 'pgm')
    )
  );

-- ==================== PI DEPENDENCIES ====================
CREATE POLICY "Users can view dependencies in their workspace"
  ON pi_dependencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_increments
      WHERE program_increments.id = pi_dependencies.pi_id
      AND program_increments.workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "Users can manage dependencies in their workspace"
  ON pi_dependencies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM program_increments
      WHERE program_increments.id = pi_dependencies.pi_id
      AND program_increments.workspace_id = auth.workspace_id()
    )
  );

-- ==================== SUBSCRIPTIONS ====================
CREATE POLICY "Users can view their workspace subscription"
  ON subscriptions FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "Admins can manage subscription"
  ON subscriptions FOR ALL
  USING (workspace_id = auth.workspace_id() AND auth.is_workspace_admin());

-- ==================== PAYMENT HISTORY ====================
CREATE POLICY "Users can view payment history"
  ON payment_history FOR SELECT
  USING (workspace_id = auth.workspace_id());

-- Only system (service role) can insert payment history
-- No user-facing insert policy needed
