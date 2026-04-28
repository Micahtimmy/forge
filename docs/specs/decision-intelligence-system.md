# FORGE Decision Intelligence System
## Complete Architecture Specification

> Evolving FORGE from "Smart automation on top of JIRA" to "The memory and decision layer for agile teams"

---

# Feature 1: Decision Intelligence Layer

## 1.1 Product Definition

**Problem:** Agile teams make hundreds of decisions weekly (scope changes, priority shifts, resource allocation) but have no system to capture, track, or learn from these decisions. When a project fails, teams can't trace back which decisions led to the outcome.

**Persona:** Scrum Master, Product Manager, RTE

**Trigger Moment:** 
- Sprint planning when prioritizing stories
- Mid-sprint when scope changes are requested
- PI planning when allocating capacity
- Retrospectives when analyzing what went wrong

**Decision Enabled:** "Should we make this change, and what's the likely impact based on similar past decisions?"

## 1.2 System Design

```
DECISION INTELLIGENCE LAYER
├── FRONTEND
│   ├── DecisionLogger (capture decisions in context)
│   ├── DecisionTimeline (visualize decision history)
│   ├── DecisionAnalyzer (AI-powered outcome analysis)
│   └── DecisionSearch (find similar past decisions)
├── BACKEND
│   ├── /api/decisions/* (CRUD + analytics)
│   ├── DecisionContextBuilder (links stories, risks, deps)
│   └── OutcomeTracker (monitors decision results over time)
├── AI LAYER
│   ├── DecisionSummarizer (generates decision briefs)
│   ├── SimilarDecisionFinder (retrieves relevant precedents)
│   └── OutcomePredictor (predicts likely outcomes)
└── INTEGRATIONS
    ├── Quality Gate: Links decisions to story score changes
    ├── Signal: Auto-includes decisions in stakeholder updates
    ├── Horizon: Tracks PI-level strategic decisions
    └── JIRA: Syncs decisions as issue comments
```

## 1.3 Database Design

```sql
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'scope_change', 'priority_shift', 'resource_allocation', 
    'technical_decision', 'process_change', 'risk_acceptance', 'other'
  )),
  context JSONB NOT NULL DEFAULT '{}',
  decision JSONB NOT NULL,
  ai_summary TEXT,
  ai_risk_assessment JSONB,
  outcome_status TEXT DEFAULT 'pending' CHECK (outcome_status IN (
    'pending', 'successful', 'partial', 'failed', 'unknown'
  )),
  outcome JSONB,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT DEFAULT 'team',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE decision_story_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('caused_by', 'affects', 'blocks', 'related')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(decision_id, story_id, link_type)
);

CREATE INDEX idx_decisions_workspace ON decisions(workspace_id);
CREATE INDEX idx_decisions_type ON decisions(workspace_id, decision_type);
CREATE INDEX idx_decisions_created ON decisions(workspace_id, created_at DESC);
```

## 1.4 API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/decisions` | POST | Create decision |
| `/api/decisions` | GET | List with filters |
| `/api/decisions/[id]` | GET | Get single decision |
| `/api/decisions/[id]` | PATCH | Update outcome |
| `/api/decisions/[id]/analyze` | POST | AI analysis |
| `/api/decisions/similar` | GET | Find similar decisions |

## 1.5 AI Integration

**Decision Summarizer Prompt:**
```xml
<summary>
  <one_liner>50 words max summary</one_liner>
  <risk_level>low|medium|high|critical</risk_level>
  <key_tradeoffs>What was gained vs given up</key_tradeoffs>
  <success_criteria>How to know if this worked</success_criteria>
</summary>
```

## 1.6 Frontend Routes

- `/decisions` - Timeline view
- `/decisions/new` - Create with context
- `/decisions/[id]` - Detail + outcome tracking

---

# Feature 2: Predictive Delivery Intelligence

## 2.1 Product Definition

**Problem:** Teams are surprised by sprint failures, story slips, and missed deadlines. By the time problems are visible, it's too late to course-correct.

**Persona:** Scrum Master, Delivery Manager, RTE

**Trigger Moment:**
- Sprint start (assess risk)
- Mid-sprint (early warning)
- Story assignment (individual risk)
- PI planning (portfolio risk)

**Decision Enabled:** "Which stories/sprints are at risk, and what should we do about it now?"

## 2.2 System Design

```
PREDICTIVE DELIVERY INTELLIGENCE
├── PREDICTION ENGINE
│   ├── SprintRiskPredictor (0-100 risk score)
│   ├── StorySlipPredictor (probability of not completing)
│   ├── DependencyRiskScorer (blocked probability)
│   └── VelocityForecaster (expected vs planned)
├── DATA PIPELINE
│   ├── HistoricalAnalyzer (learns from past sprints)
│   ├── PatternDetector (identifies risk patterns)
│   └── MetricAggregator (combines signals)
└── ALERT SYSTEM
    ├── ThresholdMonitor (triggers on risk changes)
    └── RecommendationEngine (suggests actions)
```

## 2.3 Database Design

```sql
CREATE TABLE sprint_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  sprint_id INTEGER NOT NULL,
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  contributing_factors JSONB NOT NULL,
  recommendations JSONB,
  actual_outcome TEXT,
  prediction_accuracy NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE story_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  story_id UUID NOT NULL REFERENCES stories(id),
  sprint_id INTEGER,
  slip_probability NUMERIC(3,2) NOT NULL,
  risk_factors JSONB NOT NULL,
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  actual_slipped BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sprint_pred_workspace ON sprint_predictions(workspace_id, sprint_id);
CREATE INDEX idx_story_pred_workspace ON story_predictions(workspace_id, story_id);
```

## 2.4 Prediction Model

**Sprint Risk Score Formula:**
```typescript
function calculateSprintRisk(sprint: SprintContext): RiskScore {
  const factors = {
    // Historical factors (40% weight)
    velocityVariance: getVelocityVariance(sprint.teamId, 6), // last 6 sprints
    historicalCompletionRate: getCompletionRate(sprint.teamId, 6),
    
    // Current sprint factors (35% weight)
    capacityUtilization: sprint.committedPoints / sprint.availableCapacity,
    storyQualityAvg: getAverageQualityScore(sprint.stories),
    unrefinedStoryRatio: countUnrefined(sprint.stories) / sprint.stories.length,
    
    // Dependency factors (25% weight)
    blockedStoryCount: countBlocked(sprint.stories),
    externalDependencyCount: countExternalDeps(sprint.stories),
    crossTeamDependencies: countCrossTeamDeps(sprint.stories),
  };
  
  const score = 
    (factors.velocityVariance * 0.2) +
    ((1 - factors.historicalCompletionRate) * 0.2) +
    (Math.max(0, factors.capacityUtilization - 0.8) * 100 * 0.15) +
    ((100 - factors.storyQualityAvg) * 0.1) +
    (factors.unrefinedStoryRatio * 50 * 0.1) +
    (factors.blockedStoryCount * 10 * 0.1) +
    (factors.externalDependencyCount * 5 * 0.1) +
    (factors.crossTeamDependencies * 8 * 0.05);
  
  return {
    score: Math.min(100, Math.round(score)),
    factors: factors,
    topContributors: getTopContributors(factors, 3),
  };
}
```

## 2.5 API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/predictions/sprint/[id]` | GET | Get sprint risk |
| `/api/predictions/sprint/[id]/refresh` | POST | Recalculate |
| `/api/predictions/stories` | GET | Batch story predictions |
| `/api/predictions/portfolio` | GET | PI-level risk view |

## 2.6 Frontend Routes

- `/analytics/predictions` - Risk dashboard
- Integrated into Quality Gate sprint view
- Risk badges on story cards

---

# Feature 3: Continuous Story Quality Enforcement

## 3.1 Product Definition

**Problem:** Low-quality stories enter sprints and cause confusion, rework, and missed deadlines. Quality feedback comes too late to be actionable.

**Persona:** Product Owner, Scrum Master

**Trigger Moment:**
- Story moves to "Ready for Dev"
- Story added to sprint
- Refinement session

**Decision Enabled:** "Is this story ready to be worked on, and if not, what needs to change?"

## 3.2 System Design

```
CONTINUOUS QUALITY ENFORCEMENT
├── WEBHOOK LISTENER
│   ├── JiraWebhookHandler (story created/updated)
│   └── StatusChangeDetector (transition monitoring)
├── SCORING ENGINE
│   ├── RealTimeScorer (scores on change)
│   └── ThresholdEnforcer (blocks if < threshold)
├── FEEDBACK LOOP
│   ├── JiraCommentWriter (posts feedback to JIRA)
│   ├── SlackNotifier (alerts PO/SM)
│   └── DashboardUpdater (reflects in FORGE)
└── CONFIGURATION
    ├── QualityGates (per-transition thresholds)
    └── EnforcementRules (block vs warn)
```

## 3.3 Database Design

```sql
CREATE TABLE quality_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  trigger_transition TEXT NOT NULL, -- e.g., "any->Ready for Dev"
  min_score INTEGER NOT NULL CHECK (min_score BETWEEN 0 AND 100),
  action TEXT NOT NULL CHECK (action IN ('block', 'warn', 'comment')),
  required_dimensions TEXT[], -- e.g., ['acceptance_criteria', 'clarity']
  notification_channels TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quality_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  story_id UUID NOT NULL REFERENCES stories(id),
  gate_id UUID NOT NULL REFERENCES quality_gates(id),
  violation_type TEXT NOT NULL,
  score_at_time INTEGER NOT NULL,
  required_score INTEGER NOT NULL,
  resolution_status TEXT DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3.4 JIRA Comment Format

```typescript
const QUALITY_FEEDBACK_TEMPLATE = `
🔍 **FORGE Quality Assessment**

**Score: {score}/100** {scoreEmoji}

{dimensionBreakdown}

**Suggestions:**
{suggestions}

---
_Automated feedback from FORGE Quality Gate_
_[View in FORGE]({forgeUrl})_
`;
```

## 3.5 API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/quality-gates` | GET/POST | Manage gates |
| `/api/quality-gates/[id]` | PATCH/DELETE | Update/remove |
| `/api/webhooks/jira/quality` | POST | JIRA webhook |
| `/api/stories/[id]/enforce` | POST | Manual check |

---

# Feature 4: Team Intelligence Profiles

## 4.1 Product Definition

**Problem:** Managers don't have visibility into team member strengths, weaknesses, and growth areas. Coaching is generic rather than data-driven.

**Persona:** Engineering Manager, Scrum Master

**Trigger Moment:**
- 1:1 meetings
- Performance reviews
- Team formation decisions
- Capacity planning

**Decision Enabled:** "Where does this person excel, where do they struggle, and how can I help them grow?"

## 4.2 System Design

```
TEAM INTELLIGENCE PROFILES
├── METRIC AGGREGATOR
│   ├── StoryMetrics (throughput, quality, complexity)
│   ├── CollaborationMetrics (reviews, pairing, mentoring)
│   └── GrowthMetrics (skill expansion, improvement trends)
├── PROFILE BUILDER
│   ├── StrengthIdentifier (top performing areas)
│   ├── GrowthAreaDetector (improvement opportunities)
│   └── TrendAnalyzer (trajectory over time)
├── AI COACH
│   ├── CoachingSuggester (personalized recommendations)
│   └── PeerMatcher (suggests mentors/mentees)
└── PRIVACY LAYER
    ├── VisibilityController (who sees what)
    └── AnonymizationEngine (team-level only option)
```

## 4.3 Database Design

```sql
CREATE TABLE team_member_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Aggregated metrics (updated weekly)
  metrics JSONB NOT NULL DEFAULT '{}',
  -- {
  --   stories_completed_30d: number,
  --   avg_story_points_30d: number,
  --   avg_quality_score_authored: number,
  --   on_time_delivery_rate: number,
  --   complexity_preference: 'low'|'medium'|'high',
  --   collaboration_score: number,
  --   review_participation: number
  -- }
  
  -- AI-generated insights
  strengths TEXT[],
  growth_areas TEXT[],
  coaching_suggestions JSONB,
  
  -- Trends
  velocity_trend TEXT CHECK (velocity_trend IN ('improving', 'stable', 'declining')),
  quality_trend TEXT CHECK (quality_trend IN ('improving', 'stable', 'declining')),
  
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE team_member_metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES team_member_profiles(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4.4 Privacy Controls

```typescript
enum ProfileVisibility {
  SELF_ONLY = 'self_only',           // Only the person can see
  MANAGER_VISIBLE = 'manager_visible', // Person + their manager
  TEAM_VISIBLE = 'team_visible',       // Entire team can see
  ANONYMOUS_TEAM = 'anonymous_team',   // Team sees aggregates only
}
```

## 4.5 API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/team/profiles` | GET | List team profiles |
| `/api/team/profiles/[userId]` | GET | Individual profile |
| `/api/team/profiles/[userId]/coaching` | GET | AI suggestions |
| `/api/team/analytics` | GET | Team-level aggregates |

---

# Feature 5: Deep JIRA Bi-Directional Sync

## 5.1 Product Definition

**Problem:** FORGE insights don't flow back to JIRA where developers work. Teams have to context-switch between tools.

**Persona:** All FORGE users

**Trigger Moment:**
- Viewing story in FORGE (want to edit)
- AI generates suggestion (want to apply)
- Score changes (want to see in JIRA)

**Decision Enabled:** "I can act on FORGE insights without leaving my workflow"

## 5.2 System Design

```
DEEP JIRA SYNC
├── READ OPERATIONS
│   ├── StoryFetcher (full story details)
│   ├── SprintFetcher (sprint metadata)
│   └── BoardFetcher (board configuration)
├── WRITE OPERATIONS
│   ├── StoryUpdater (edit fields)
│   ├── CommentWriter (add comments)
│   ├── TransitionExecutor (move status)
│   └── CustomFieldWriter (FORGE score field)
├── SYNC ENGINE
│   ├── ConflictDetector (concurrent edits)
│   ├── ConflictResolver (strategies)
│   └── SyncQueue (ordered operations)
└── WEBHOOK HANDLER
    ├── ChangeListener (JIRA → FORGE)
    └── AuditLogger (track all syncs)
```

## 5.3 Database Design

```sql
CREATE TABLE jira_sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  story_id UUID REFERENCES stories(id),
  jira_issue_key TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'update_field', 'add_comment', 'transition', 'apply_suggestion'
  )),
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'failed', 'conflict'
  )),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  initiated_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jira_sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES jira_sync_operations(id),
  field_name TEXT NOT NULL,
  forge_value JSONB,
  jira_value JSONB,
  resolution TEXT CHECK (resolution IN ('forge_wins', 'jira_wins', 'manual', 'merged')),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 5.4 Conflict Resolution Strategies

```typescript
enum ConflictStrategy {
  FORGE_WINS = 'forge_wins',     // FORGE value overwrites
  JIRA_WINS = 'jira_wins',       // Keep JIRA value
  LATEST_WINS = 'latest_wins',   // Most recent edit wins
  MANUAL = 'manual',             // User must resolve
  MERGE = 'merge',               // Combine (for arrays/text)
}

const DEFAULT_STRATEGIES: Record<string, ConflictStrategy> = {
  'summary': ConflictStrategy.MANUAL,
  'description': ConflictStrategy.MANUAL,
  'story_points': ConflictStrategy.JIRA_WINS,
  'labels': ConflictStrategy.MERGE,
  'forge_score': ConflictStrategy.FORGE_WINS,
};
```

## 5.5 API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jira/stories/[key]` | PATCH | Update JIRA story |
| `/api/jira/stories/[key]/comment` | POST | Add comment |
| `/api/jira/stories/[key]/transition` | POST | Change status |
| `/api/jira/stories/[key]/apply-suggestion` | POST | Apply AI fix |
| `/api/jira/sync/conflicts` | GET | List conflicts |
| `/api/jira/sync/conflicts/[id]` | POST | Resolve conflict |

---

# Feature 6: Program Health Score

## 6.1 Product Definition

**Problem:** Leadership lacks a single metric to understand program health. They rely on gut feeling or wait for problems to surface.

**Persona:** RTE, Program Manager, Director of Engineering

**Trigger Moment:**
- Executive standup
- Steering committee meeting
- Portfolio review
- Investor update

**Decision Enabled:** "Is this program healthy, and what's the single biggest thing to fix?"

## 6.2 System Design

```
PROGRAM HEALTH SCORE
├── DIMENSION SCORERS
│   ├── QualityScorer (story quality aggregate)
│   ├── DeliveryScorer (velocity, predictability)
│   ├── RiskScorer (open risks, blockers)
│   ├── DependencyScorer (blocked %, external deps)
│   └── CapacityScorer (utilization, availability)
├── AGGREGATOR
│   ├── WeightedScoreCalculator
│   ├── TrendCalculator (vs last period)
│   └── BenchmarkComparer (vs similar programs)
└── PRESENTER
    ├── HealthDashboard (single view)
    ├── DrilldownNavigator (click to details)
    └── AlertGenerator (threshold breaches)
```

## 6.3 Database Design

```sql
CREATE TABLE program_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  pi_id UUID REFERENCES program_increments(id),
  
  -- Overall score
  health_score INTEGER NOT NULL CHECK (health_score BETWEEN 0 AND 100),
  health_status TEXT NOT NULL CHECK (health_status IN ('excellent', 'good', 'at_risk', 'critical')),
  
  -- Dimension scores
  dimensions JSONB NOT NULL,
  -- {
  --   quality: { score: 75, weight: 0.25, trend: 'improving' },
  --   delivery: { score: 80, weight: 0.25, trend: 'stable' },
  --   risk: { score: 60, weight: 0.20, trend: 'declining' },
  --   dependencies: { score: 70, weight: 0.15, trend: 'stable' },
  --   capacity: { score: 85, weight: 0.15, trend: 'improving' }
  -- }
  
  -- Key drivers
  top_positive_drivers JSONB,
  top_negative_drivers JSONB,
  
  -- Recommendations
  ai_recommendations JSONB,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_workspace ON program_health_scores(workspace_id, calculated_at DESC);
```

## 6.4 Health Calculation

```typescript
function calculateProgramHealth(workspace: Workspace): HealthScore {
  const dimensions = {
    quality: {
      score: calculateQualityDimension(workspace),
      weight: 0.25,
    },
    delivery: {
      score: calculateDeliveryDimension(workspace),
      weight: 0.25,
    },
    risk: {
      score: calculateRiskDimension(workspace),
      weight: 0.20,
    },
    dependencies: {
      score: calculateDependencyDimension(workspace),
      weight: 0.15,
    },
    capacity: {
      score: calculateCapacityDimension(workspace),
      weight: 0.15,
    },
  };
  
  const overallScore = Object.values(dimensions).reduce(
    (sum, d) => sum + (d.score * d.weight), 0
  );
  
  return {
    score: Math.round(overallScore),
    status: getHealthStatus(overallScore),
    dimensions,
    topDrivers: identifyTopDrivers(dimensions),
  };
}

function getHealthStatus(score: number): HealthStatus {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'at_risk';
  return 'critical';
}
```

## 6.5 API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Current health score |
| `/api/health/history` | GET | Historical trend |
| `/api/health/dimensions/[dim]` | GET | Dimension drilldown |
| `/api/health/refresh` | POST | Recalculate |

## 6.6 Frontend Routes

- `/analytics/health` - Health dashboard
- Widget on main dashboard
- Health badge in header

---

# Feature 7: Scenario Simulation Engine

## 7.1 Product Definition

**Problem:** Teams can't evaluate the impact of decisions before making them. "What if we cut this feature?" requires spreadsheet modeling.

**Persona:** Product Manager, RTE, Delivery Lead

**Trigger Moment:**
- Scope negotiation
- Resource planning
- Risk mitigation planning
- PI planning

**Decision Enabled:** "If I make this change, what happens to our delivery timeline and risk profile?"

## 7.2 System Design

```
SCENARIO SIMULATION ENGINE
├── SCENARIO BUILDER
│   ├── ChangeSpecifier (what-if inputs)
│   ├── ConstraintValidator (feasibility check)
│   └── BaselineSnapshotter (current state)
├── SIMULATION ENGINE
│   ├── CapacitySimulator (team changes)
│   ├── ScopeSimulator (feature add/remove)
│   ├── TimelineSimulator (deadline changes)
│   └── DependencySimulator (blocking changes)
├── IMPACT ANALYZER
│   ├── DeliveryImpactCalculator
│   ├── RiskImpactCalculator
│   ├── CostImpactCalculator
│   └── QualityImpactCalculator
└── COMPARISON VIEW
    ├── BeforeAfterRenderer
    ├── DeltaHighlighter
    └── RecommendationGenerator
```

## 7.3 Database Design

```sql
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Baseline snapshot
  baseline JSONB NOT NULL,
  -- {
  --   snapshot_date: timestamp,
  --   health_score: number,
  --   sprint_count: number,
  --   total_points: number,
  --   risk_score: number
  -- }
  
  -- Changes to simulate
  changes JSONB NOT NULL,
  -- {
  --   type: 'remove_feature' | 'add_capacity' | 'delay_dependency' | ...,
  --   parameters: {...}
  -- }[]
  
  -- Simulation results
  results JSONB,
  -- {
  --   projected_health_score: number,
  --   delivery_impact: { delay_days: number, confidence: number },
  --   risk_impact: { delta: number, new_risks: string[] },
  --   affected_stories: string[],
  --   affected_teams: string[]
  -- }
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'simulated', 'applied', 'archived')),
  simulated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scenarios_workspace ON scenarios(workspace_id, created_at DESC);
```

## 7.4 Simulation Types

```typescript
type ScenarioChange = 
  | { type: 'remove_feature'; featureId: string }
  | { type: 'add_feature'; feature: FeatureInput; targetSprint: number }
  | { type: 'change_capacity'; teamId: string; delta: number; startSprint: number }
  | { type: 'delay_dependency'; dependencyId: string; delayDays: number }
  | { type: 'reassign_story'; storyId: string; fromTeam: string; toTeam: string }
  | { type: 'change_deadline'; piId: string; newEndDate: string }
  | { type: 'add_team_member'; teamId: string; capacity: number; startDate: string }
  | { type: 'remove_team_member'; teamId: string; memberId: string; endDate: string };
```

## 7.5 API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/scenarios` | GET/POST | List/create scenarios |
| `/api/scenarios/[id]` | GET/PATCH/DELETE | Manage scenario |
| `/api/scenarios/[id]/simulate` | POST | Run simulation |
| `/api/scenarios/[id]/apply` | POST | Apply to real data |
| `/api/scenarios/compare` | POST | Compare multiple |

## 7.6 Frontend Routes

- `/horizon/scenarios` - Scenario list
- `/horizon/scenarios/new` - Builder
- `/horizon/scenarios/[id]` - Results view

---

# Feature 8: Smart Notification System

## 8.1 Product Definition

**Problem:** Teams are either overwhelmed by notifications or miss critical updates. No intelligent filtering based on context and urgency.

**Persona:** All FORGE users

**Trigger Moment:**
- Meaningful events occur (not every change)
- User-defined triggers are met
- Thresholds are breached

**Decision Enabled:** "I'm notified about things that matter, when they matter, in the right channel"

## 8.2 System Design

```
SMART NOTIFICATION SYSTEM
├── EVENT BUS
│   ├── EventEmitter (publishes events)
│   ├── EventStore (audit trail)
│   └── EventRouter (directs to handlers)
├── RULES ENGINE
│   ├── RuleEvaluator (checks conditions)
│   ├── ThresholdMonitor (numeric triggers)
│   └── PatternDetector (complex patterns)
├── DELIVERY SYSTEM
│   ├── EmailDelivery (via Resend)
│   ├── SlackDelivery (future)
│   ├── InAppDelivery (notification center)
│   └── DigestBuilder (batches notifications)
├── PERSONALIZATION
│   ├── PreferenceManager (user settings)
│   ├── ImportanceScorer (AI-assisted)
│   └── QuietHoursEnforcer
└── TEMPLATES
    ├── TemplateRegistry
    └── TemplateRenderer
```

## 8.3 Database Design

```sql
CREATE TABLE notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  source_type TEXT NOT NULL, -- 'quality_gate', 'signal', 'horizon', 'jira', 'system'
  source_id TEXT,
  importance TEXT DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  created_by UUID REFERENCES profiles(id),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Trigger conditions
  event_types TEXT[] NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "field": "score",
  --   "operator": "less_than",
  --   "value": 50
  -- }
  
  -- Actions
  channels TEXT[] NOT NULL, -- ['email', 'slack', 'in_app']
  recipients JSONB NOT NULL, -- { type: 'user'|'role'|'team', ids: string[] }
  template_id UUID,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  event_id UUID REFERENCES notification_events(id),
  rule_id UUID REFERENCES notification_rules(id),
  
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Digest preferences
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  digest_time TIME DEFAULT '09:00',
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Event type preferences (override defaults)
  event_preferences JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, workspace_id)
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, status) WHERE status != 'read';
CREATE INDEX idx_events_workspace ON notification_events(workspace_id, created_at DESC);
```

## 8.4 Event Types

```typescript
type NotificationEvent =
  | { type: 'quality.score_dropped'; storyId: string; oldScore: number; newScore: number }
  | { type: 'quality.gate_failed'; storyId: string; gateName: string; score: number }
  | { type: 'delivery.sprint_at_risk'; sprintId: number; riskScore: number }
  | { type: 'delivery.story_blocked'; storyId: string; blockedBy: string }
  | { type: 'decision.outcome_due'; decisionId: string; daysSinceCreation: number }
  | { type: 'health.score_changed'; oldScore: number; newScore: number; delta: number }
  | { type: 'jira.sync_failed'; reason: string }
  | { type: 'team.member_invited'; email: string; role: string }
  | { type: 'signal.update_sent'; updateId: string; recipientCount: number };
```

## 8.5 API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notifications` | GET | List user notifications |
| `/api/notifications/[id]/read` | POST | Mark as read |
| `/api/notifications/read-all` | POST | Mark all read |
| `/api/notifications/preferences` | GET/PATCH | User preferences |
| `/api/notifications/rules` | GET/POST | Manage rules |
| `/api/notifications/rules/[id]` | PATCH/DELETE | Update/delete rule |

## 8.6 Frontend Routes

- Notification bell in header (all pages)
- `/settings/notifications` - Preferences
- `/settings/notifications/rules` - Custom rules

---

# System-Level Insights

## What Creates the Biggest Competitive Moat?

**Decision Intelligence Layer** - This is the moat.

Why:
1. **Data lock-in**: Every decision captured makes FORGE more valuable
2. **Network effects**: More decisions = better similar-decision matching
3. **Institutional memory**: Leaving FORGE means losing organizational knowledge
4. **AI advantage**: More data = better outcome predictions over time

No competitor has this. JIRA doesn't capture decisions. Notion doesn't connect them to outcomes.

## What's Hardest to Build but Most Valuable?

**Predictive Delivery Intelligence** - Hardest but transformative.

Why it's hard:
- Requires significant historical data to be accurate
- Prediction models need constant tuning
- False positives destroy trust quickly
- Cold start problem for new workspaces

Why it's valuable:
- Prevents failures before they happen
- Quantifies risk for executives
- Differentiates from every competitor
- Creates "magic" moments when predictions are right

## Build Priority (Strict Order)

| Priority | Feature | Rationale |
|----------|---------|-----------|
| **1** | Deep JIRA Bi-Directional Sync | Foundation - enables all other features to write back |
| **2** | Smart Notification System | Infrastructure - needed for all alert-worthy events |
| **3** | Program Health Score | Quick win - single number executives love |
| **4** | Decision Intelligence Layer | Moat builder - start capturing data immediately |
| **5** | Continuous Quality Enforcement | Extends existing Quality Gate into JIRA |
| **6** | Predictive Delivery Intelligence | Requires historical data from #4 and #5 |
| **7** | Team Intelligence Profiles | Sensitive - needs careful rollout |
| **8** | Scenario Simulation Engine | Power feature - needs all others working first |

---

## Implementation Timeline Estimate

| Phase | Features | Duration |
|-------|----------|----------|
| Phase 1 | JIRA Sync + Notifications | 3-4 weeks |
| Phase 2 | Health Score + Decisions | 4-5 weeks |
| Phase 3 | Quality Enforcement + Predictions | 4-5 weeks |
| Phase 4 | Team Profiles + Scenarios | 5-6 weeks |

**Total: 16-20 weeks** for full Decision Intelligence System

---

*End of Architecture Specification*
