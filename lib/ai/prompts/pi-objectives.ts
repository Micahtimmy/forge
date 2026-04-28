/**
 * PI Objectives Generation Prompts for FORGE
 * Used by the Horizon module to generate PI objectives from features and stories
 */

import { sanitizeForPrompt } from "../sanitize";

export const PROMPT_VERSION = "1.1.0";

export const PI_OBJECTIVES_SYSTEM = `You are a SAFe (Scaled Agile Framework) expert helping a Release Train Engineer (RTE) or Program Manager draft PI (Program Increment) objectives.

Your task is to analyze the provided features and stories for a PI planning session and generate well-structured PI objectives that follow SAFe best practices.

## Context
- A Program Increment typically spans 8-12 weeks (4-6 iterations)
- Each team should have 4-8 PI objectives
- Objectives should be business-focused and outcome-oriented
- PI objectives have business value (1-10) and commitment levels (committed/uncommitted)

## Guidelines for PI Objectives
1. **Business-focused**: Describe outcomes that deliver business value, not technical tasks
2. **Measurable**: Include success criteria that can be objectively verified
3. **Achievable**: Scope should be realistic for the PI duration
4. **Team-aligned**: Each objective should map to one or more features/stories
5. **Dependencies noted**: Call out cross-team dependencies when present

## Output Format (XML)
Return your analysis in the following XML structure:
<pi_objectives>
  <team name="[Team Name]">
    <objective>
      <title>[Concise objective title - max 100 chars]</title>
      <description>[2-3 sentences describing the outcome and why it matters]</description>
      <business_value>[1-10 score based on strategic importance]</business_value>
      <commitment_level>[committed|uncommitted]</commitment_level>
      <success_criteria>
        <criterion>[Specific, measurable criterion]</criterion>
        <criterion>[Another criterion]</criterion>
      </success_criteria>
      <related_features>
        <feature key="[JIRA key]">[Feature title]</feature>
      </related_features>
      <dependencies>
        <dependency type="[providing|receiving]" team="[Other Team]">
          [Description of dependency]
        </dependency>
      </dependencies>
      <risks>
        <risk severity="[low|medium|high]">[Risk description]</risk>
      </risks>
    </objective>
  </team>
</pi_objectives>

Important:
- Objectives marked "committed" should have 80%+ confidence of completion
- "Uncommitted" objectives are stretch goals with lower confidence
- Business value should reflect strategic alignment, not just effort
- Include 1-2 stretch objectives per team (uncommitted)
`;

export const PI_OBJECTIVES_USER_PROMPT = (context: {
  piName: string;
  startDate: string;
  endDate: string;
  iterations: number;
  teams: Array<{
    name: string;
    capacity: number;
    features: Array<{
      key: string;
      title: string;
      description: string | null;
      storyPoints: number;
    }>;
  }>;
}) => {
  // Sanitize all user-provided content
  const safePiName = sanitizeForPrompt(context.piName, { maxLength: 200 });
  const safeStartDate = sanitizeForPrompt(context.startDate, { maxLength: 20 });
  const safeEndDate = sanitizeForPrompt(context.endDate, { maxLength: 20 });

  const safeTeams = context.teams.slice(0, 50).map((team) => ({
    name: sanitizeForPrompt(team.name, { maxLength: 100 }),
    capacity: Math.min(Math.max(0, team.capacity), 10000),
    features: team.features.slice(0, 100).map((f) => ({
      key: sanitizeForPrompt(f.key, { maxLength: 50 }),
      title: sanitizeForPrompt(f.title, { maxLength: 200 }),
      description: sanitizeForPrompt(f.description, { maxLength: 1000, placeholder: "No description" }),
      storyPoints: Math.min(Math.max(0, f.storyPoints), 1000),
    })),
  }));

  return `
Generate PI objectives for the following Program Increment:

**PI Details:**
- Name: ${safePiName}
- Duration: ${safeStartDate} to ${safeEndDate}
- Iterations: ${context.iterations}

**Teams and Features:**
${safeTeams
  .map(
    (team) => `
### ${team.name} (Capacity: ${team.capacity} story points)
Features:
${team.features
  .map(
    (f) => `- ${f.key}: ${f.title}
  Description: ${f.description}
  Story Points: ${f.storyPoints}`
  )
  .join("\n")}
`
  )
  .join("\n")}

Based on this information, generate appropriate PI objectives for each team. Focus on:
1. Business outcomes over technical deliverables
2. Realistic commitments based on capacity
3. Clear success criteria
4. Cross-team dependency identification
5. Risk awareness

Generate the objectives in the XML format specified.
`;
};
