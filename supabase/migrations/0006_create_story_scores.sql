-- Create story_scores table (AI-generated scores)
CREATE TABLE IF NOT EXISTS story_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  -- Individual dimension scores
  completeness INTEGER CHECK (completeness >= 0),
  clarity INTEGER CHECK (clarity >= 0),
  estimability INTEGER CHECK (estimability >= 0),
  traceability INTEGER CHECK (traceability >= 0),
  testability INTEGER CHECK (testability >= 0),
  -- AI-generated suggestions
  ai_suggestions JSONB,
  -- AI reasoning for each dimension
  dimension_reasoning JSONB,
  -- Model and prompt version used
  model_version TEXT DEFAULT 'gemini-2.0-flash',
  prompt_version TEXT DEFAULT '1.0.0',
  -- Timestamps
  scored_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_story_scores_story ON story_scores(story_id);
CREATE INDEX IF NOT EXISTS idx_story_scores_rubric ON story_scores(rubric_id);
CREATE INDEX IF NOT EXISTS idx_story_scores_total ON story_scores(total_score);
CREATE INDEX IF NOT EXISTS idx_story_scores_scored_at ON story_scores(scored_at);

-- Keep only the latest score per story-rubric combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_story_scores_latest
  ON story_scores(story_id, rubric_id);

-- Enable RLS
ALTER TABLE story_scores ENABLE ROW LEVEL SECURITY;
