export interface GlossaryTerm {
  term: string;
  short: string;
  full: string;
  example?: string;
  learnMoreUrl?: string;
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  qualityScore: {
    term: "Quality Score",
    short: "AI rating (0-100) of how well a story is written before development.",
    full: `Quality Score measures how ready a user story is for development. It evaluates 5 dimensions:

• **Completeness** — Has description, acceptance criteria, and epic links
• **Clarity** — Uses specific language, not vague verbs like "handle"
• **Estimability** — Scope is clear enough for the team to estimate
• **Traceability** — Connected to epics, has labels, fits the roadmap
• **Testability** — Acceptance criteria are verifiable, not subjective

A high score means fewer questions during development. A low score means the story needs refinement before sprint.`,
    example: "Score 85+ = Ready for sprint. Score <50 = Needs PM attention.",
  },

  sprintHealth: {
    term: "Sprint Health",
    short: "Overall readiness of all stories in a sprint, based on quality scores.",
    full: `Sprint Health is the average quality score of all stories in a sprint. It predicts how smoothly development will go.

• **85%+** — Excellent. Stories are clear, team can focus on building.
• **70-84%** — Good. Minor clarifications may be needed.
• **50-69%** — Fair. Expect questions and scope discussions.
• **<50%** — Poor. High risk of delays and rework.

Check sprint health before sprint planning to catch issues early.`,
    example: "A sprint with 24 stories averaging 78% health is in good shape.",
  },

  velocity: {
    term: "Velocity",
    short: "Story points completed per sprint. Measures team throughput.",
    full: `Velocity is the number of story points a team completes in a sprint. It helps predict future capacity.

• Calculated from **completed** stories only, not committed
• Averages over 3-5 sprints give more reliable forecasts
• Should remain relatively stable for mature teams
• Varies naturally — don't optimize for velocity alone

Use velocity for planning, not performance evaluation.`,
    example: "Team averages 28 points/sprint. Plan next sprint with 26-30 points.",
  },

  burndown: {
    term: "Burndown",
    short: "Chart showing remaining work vs. time in a sprint.",
    full: `A burndown chart tracks remaining story points over the sprint duration.

• **Ideal line** — Straight line from total points to zero
• **Actual line** — Real progress, updated as stories complete
• **Above ideal** — Behind schedule
• **Below ideal** — Ahead of schedule

Flat sections indicate blocked work or unstarted stories. Steep drops mean large stories completed.`,
    example: "Sprint starts with 30 points. By day 5, ideal is 15 points remaining.",
  },

  piObjective: {
    term: "PI Objective",
    short: "A measurable goal for the Program Increment (8-12 weeks).",
    full: `PI Objectives are commitments made during PI Planning. They describe what an Agile Release Train (ART) will deliver.

• **Committed** — Team is confident they can deliver
• **Uncommitted** — Stretch goals, lower confidence
• **Business value** — Rated 1-10 by stakeholders

Track confidence weekly. Declining confidence signals risks that need attention.`,
    example: "Objective: 'Launch contactless payments' — Confidence: 85%",
  },

  piConfidence: {
    term: "PI Confidence",
    short: "Team's belief (%) that a PI Objective will be achieved.",
    full: `Confidence is a weekly self-assessment by the team on each PI Objective.

• **90%+** — On track, no concerns
• **70-89%** — Minor risks, manageable
• **50-69%** — Significant risks, needs attention
• **<50%** — At risk, escalate immediately

Declining confidence over consecutive weeks is a red flag. Address blockers before confidence drops below 70%.`,
    example: "Week 1: 80% → Week 3: 65% — Investigate what changed.",
  },

  dependency: {
    term: "Dependency",
    short: "When one team's work requires another team to deliver something first.",
    full: `Dependencies are connections between teams where one team's story requires another team's work.

• **Resolved** — Dependency delivered, no longer blocking
• **Open** — Acknowledged, being worked on
• **At Risk** — May not be delivered on time

Minimize dependencies where possible. Track them visually during PI Planning. Unresolved dependencies are the #1 cause of PI objective failures.`,
    example: "Mobile team depends on API team for new endpoint by Sprint 3.",
  },

  art: {
    term: "ART (Agile Release Train)",
    short: "A group of 5-12 teams working together on a shared mission.",
    full: `An Agile Release Train is a long-lived team of agile teams that plans, commits, and executes together.

• Contains 50-125 people typically
• Aligned to a value stream or product
• Plans together in PI Planning every 8-12 weeks
• Has an RTE (Release Train Engineer) as servant leader

ARTs enable large organizations to stay agile while coordinating complex work.`,
    example: "Verve Card Issuance ART has 3 squads: Card Management, BIN, Tokenization.",
  },

  rte: {
    term: "RTE (Release Train Engineer)",
    short: "Servant leader who facilitates ART processes and execution.",
    full: `The Release Train Engineer is like a Scrum Master for the entire ART.

Responsibilities:
• Facilitate PI Planning and other ART events
• Track and remove cross-team impediments
• Monitor PI progress and risks
• Coach teams on agile practices
• Escalate issues to leadership

RTEs don't manage people — they enable teams to deliver.`,
    example: "RTE notices two teams have conflicting dependencies, facilitates resolution.",
  },

  wip: {
    term: "WIP (Work in Progress)",
    short: "Number of items being worked on simultaneously. Lower is better.",
    full: `Work in Progress limits help teams focus and finish work faster.

• High WIP = Context switching, slower delivery
• Low WIP = Focus, faster flow, earlier feedback
• WIP limits are set per column in Kanban boards

When WIP limit is reached, team must finish something before starting new work. This surfaces bottlenecks quickly.`,
    example: "Column 'In Progress' has WIP limit of 3. Team has 3 items — can't pull more.",
  },

  cycleTime: {
    term: "Cycle Time",
    short: "Time from when work starts to when it's done.",
    full: `Cycle Time measures how long items spend in active development.

• Starts when work begins (moved to 'In Progress')
• Ends when work is done (moved to 'Done')
• Does not include wait time before starting

Shorter cycle time = faster feedback and delivery. Track trends over time, not individual items.`,
    example: "Average cycle time: 3.2 days. Items taking >5 days need attention.",
  },

  leadTime: {
    term: "Lead Time",
    short: "Time from request to delivery. Includes wait time.",
    full: `Lead Time is the total time from when a request is made to when it's delivered.

Lead Time = Wait Time + Cycle Time

• Includes time in backlog before work starts
• More meaningful to customers than cycle time
• Reducing wait time often has bigger impact than speeding up work

Track lead time to understand end-to-end delivery performance.`,
    example: "Lead time: 8 days (5 days waiting, 3 days working).",
  },

  storyPoints: {
    term: "Story Points",
    short: "Relative measure of effort, complexity, and uncertainty.",
    full: `Story points estimate the size of work relative to other stories.

• Not hours or days — relative sizing
• Fibonacci sequence common: 1, 2, 3, 5, 8, 13
• Team calibrates together (Planning Poker)
• Includes complexity and uncertainty, not just effort

Don't compare points across teams. Use for planning within a team only.`,
    example: "Small bug fix: 1 point. New feature with unknowns: 8 points.",
  },

  acceptanceCriteria: {
    term: "Acceptance Criteria",
    short: "Specific conditions a story must meet to be considered done.",
    full: `Acceptance Criteria define when a story is complete. They should be:

• **Specific** — Not vague ("user is happy")
• **Testable** — Can verify pass/fail
• **Independent** — Each criterion stands alone
• **Written as Given/When/Then** — Clear scenarios

Good AC prevents scope creep and ensures everyone agrees on "done."`,
    example: "Given user on checkout, when they tap Pay, then confirmation shows within 3 seconds.",
  },

  kanban: {
    term: "Kanban",
    short: "Flow-based work method with continuous delivery, no sprints.",
    full: `Kanban focuses on continuous flow rather than time-boxed sprints.

Key practices:
• Visualize work on a board
• Limit Work in Progress (WIP)
• Manage flow, not people
• Make policies explicit
• Improve collaboratively

Best for teams with unpredictable work (support, ops) or continuous deployment.`,
    example: "Support team uses Kanban — issues flow through without sprint boundaries.",
  },

  scrum: {
    term: "Scrum",
    short: "Time-boxed sprints (1-4 weeks) with defined roles and ceremonies.",
    full: `Scrum is an agile framework with fixed-length iterations called sprints.

Key elements:
• **Sprint** — 1-4 week time box
• **Roles** — Product Owner, Scrum Master, Developers
• **Events** — Planning, Daily Standup, Review, Retrospective
• **Artifacts** — Product Backlog, Sprint Backlog, Increment

Best for teams building new features with predictable cadence.`,
    example: "Team runs 2-week sprints, planning Monday, demo Friday of week 2.",
  },

  decisionLog: {
    term: "Decision Log",
    short: "Record of important decisions made during a sprint or PI.",
    full: `A Decision Log captures the context and reasoning behind significant choices made during development.

Key elements:
• **Title** — Clear statement of what was decided
• **Reasoning** — Why this decision was made
• **Affected Tickets** — Stories or tasks impacted
• **Tags** — Categories (scope-change, technical, timeline, etc.)

Why log decisions?
• Prevents re-litigating settled discussions
• Provides context for future team members
• Creates accountability and traceability
• Links decisions to stakeholder updates

Best used for scope changes, technical trade-offs, and timeline adjustments.`,
    example: "Descoped Verve card support from MVP — vendor integration delayed 3 weeks.",
  },

  stakeholderUpdate: {
    term: "Stakeholder Update",
    short: "Tailored communication about progress for different audiences.",
    full: `Stakeholder Updates are crafted messages that communicate progress differently based on audience.

Audience types:
• **Executive** — High-level outcomes, risks, decisions needed
• **Team** — Technical details, blockers, dependencies
• **Client** — Deliverables, timelines, visible progress
• **Board** — Strategic metrics, investment outcomes

FORGE generates drafts for each audience from the same sprint data, ensuring consistent facts with appropriate framing.`,
    example: "Same sprint generates 4 different updates: exec sees risks, team sees tech blockers.",
  },

  storyWriter: {
    term: "Story Writer",
    short: "AI tool that transforms brief ideas into well-structured user stories.",
    full: `Story Writer uses AI to expand brief descriptions into complete user stories.

What it generates:
• **Title** — Clear, actionable story name
• **Description** — Context, scope, user value
• **Acceptance Criteria** — Testable Given/When/Then scenarios
• **Story Points** — Estimated effort
• **Labels** — Suggested categorization

Input: "user can pay with Verve card"
Output: Full story with AC like "Given valid Verve card details, when user submits payment, then transaction is authorized within 3 seconds"`,
    example: "Brief 'add dark mode' becomes story with 4 acceptance criteria and UI notes.",
  },
};

export function getGlossaryTerm(key: string): GlossaryTerm | undefined {
  return GLOSSARY[key];
}

export function getAllTerms(): GlossaryTerm[] {
  return Object.values(GLOSSARY);
}
