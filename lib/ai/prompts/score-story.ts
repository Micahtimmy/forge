/**
 * AI Prompt for Story Scoring
 * Version: 1.0.0
 *
 * This prompt instructs the AI to analyze JIRA user stories against
 * a configurable rubric and return structured scores with suggestions.
 */

export const PROMPT_VERSION = "1.0.0";

export const SCORE_STORY_SYSTEM = `You are a senior agile coach and story quality expert with deep expertise in user story writing, acceptance criteria, and sprint planning.

Your task is to analyze JIRA user stories against a quality rubric and provide actionable scores and improvement suggestions.

## Scoring Dimensions

Evaluate each story across these five dimensions:

1. **Completeness** (max 25 points)
   - Title is present and descriptive (5 pts)
   - Description follows user story format or is clearly written (10 pts)
   - Acceptance criteria are present (10 pts)

2. **Clarity** (max 25 points)
   - No vague verbs (avoid: "handle", "manage", "process", "do", "deal with") (10 pts)
   - Clear subject and outcome (8 pts)
   - No ambiguous pronouns or references (7 pts)

3. **Estimability** (max 20 points)
   - Story points assigned (5 pts)
   - Scope is appropriate for a single sprint (8 pts)
   - No hidden complexity or dependencies mentioned without resolution (7 pts)

4. **Traceability** (max 15 points)
   - Linked to an Epic or Feature (8 pts)
   - Has relevant labels or components (7 pts)

5. **Testability** (max 15 points)
   - Acceptance criteria are verifiable, not subjective (10 pts)
   - Success criteria are measurable (5 pts)

## Output Format

Return your analysis in the following XML format:

<analysis>
  <total_score>[0-100]</total_score>
  <dimensions>
    <completeness score="[0-25]" max="25">
      <reasoning>[Specific explanation for this score]</reasoning>
    </completeness>
    <clarity score="[0-25]" max="25">
      <reasoning>[Specific explanation for this score]</reasoning>
    </clarity>
    <estimability score="[0-20]" max="20">
      <reasoning>[Specific explanation for this score]</reasoning>
    </estimability>
    <traceability score="[0-15]" max="15">
      <reasoning>[Specific explanation for this score]</reasoning>
    </traceability>
    <testability score="[0-15]" max="15">
      <reasoning>[Specific explanation for this score]</reasoning>
    </testability>
  </dimensions>
  <suggestions>
    [Only include suggestions if score < 70]
    <suggestion type="[acceptance_criteria|description|title|split]">
      <current>[Current text or "Missing"]</current>
      <improved>[Your improved version]</improved>
      <reasoning>[Why this improvement helps]</reasoning>
    </suggestion>
  </suggestions>
</analysis>

## Guidelines

- Be specific in your reasoning - reference actual text from the story
- Suggestions should be immediately usable by the team
- If acceptance criteria are missing entirely, that's a significant deduction
- A story with vague verbs like "handle user login" should score low on clarity
- Consider the INVEST criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- Be fair but rigorous - the goal is to improve sprint success rates`;

export function buildScoreStoryPrompt(story: {
  key: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  storyPoints: number | null;
  epicKey: string | null;
  labels: string[] | null;
}): string {
  return `## Story to Analyze

**Key:** ${story.key}
**Title:** ${story.title}

**Description:**
${story.description || "[No description provided]"}

**Acceptance Criteria:**
${story.acceptanceCriteria || "[No acceptance criteria provided]"}

**Story Points:** ${story.storyPoints ?? "Not estimated"}
**Epic:** ${story.epicKey || "Not linked"}
**Labels:** ${story.labels?.join(", ") || "None"}

Please analyze this story and provide your scoring assessment in the XML format specified.`;
}

export function parseScoreResponse(xml: string): {
  totalScore: number;
  dimensions: {
    completeness: { score: number; max: number; reasoning: string };
    clarity: { score: number; max: number; reasoning: string };
    estimability: { score: number; max: number; reasoning: string };
    traceability: { score: number; max: number; reasoning: string };
    testability: { score: number; max: number; reasoning: string };
  };
  suggestions: Array<{
    type: string;
    current: string;
    improved: string;
    reasoning?: string;
  }>;
} {
  // Extract total score
  const totalScoreMatch = xml.match(/<total_score>(\d+)<\/total_score>/);
  const totalScore = totalScoreMatch ? parseInt(totalScoreMatch[1], 10) : 0;

  // Extract dimensions
  const extractDimension = (name: string): { score: number; max: number; reasoning: string } => {
    const pattern = new RegExp(
      `<${name}\\s+score="(\\d+)"\\s+max="(\\d+)"[^>]*>\\s*<reasoning>([\\s\\S]*?)<\\/reasoning>\\s*<\\/${name}>`,
      "i"
    );
    const match = xml.match(pattern);
    if (match) {
      return {
        score: parseInt(match[1], 10),
        max: parseInt(match[2], 10),
        reasoning: match[3].trim(),
      };
    }
    return { score: 0, max: 0, reasoning: "" };
  };

  const dimensions = {
    completeness: extractDimension("completeness"),
    clarity: extractDimension("clarity"),
    estimability: extractDimension("estimability"),
    traceability: extractDimension("traceability"),
    testability: extractDimension("testability"),
  };

  // Extract suggestions
  const suggestions: Array<{
    type: string;
    current: string;
    improved: string;
    reasoning?: string;
  }> = [];

  const suggestionPattern = /<suggestion\s+type="([^"]+)">\s*<current>([^<]*)<\/current>\s*<improved>([^<]*)<\/improved>(?:\s*<reasoning>([^<]*)<\/reasoning>)?/g;
  let suggestionMatch;
  while ((suggestionMatch = suggestionPattern.exec(xml)) !== null) {
    suggestions.push({
      type: suggestionMatch[1],
      current: suggestionMatch[2].trim(),
      improved: suggestionMatch[3].trim(),
      reasoning: suggestionMatch[4]?.trim(),
    });
  }

  return { totalScore, dimensions, suggestions };
}
