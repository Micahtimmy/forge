/**
 * AI Prompt for Story Scoring
 * Version: 1.1.0
 *
 * This prompt instructs the AI to analyze JIRA user stories against
 * a configurable rubric and return structured scores with suggestions.
 */

import { sanitizeStoryForPrompt } from "../sanitize";

export const PROMPT_VERSION = "1.1.0";

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
  // Sanitize all user-provided content to prevent prompt injection
  const safe = sanitizeStoryForPrompt(story);

  return `## Story to Analyze

**Key:** ${safe.key}
**Title:** ${safe.title}

**Description:**
${safe.description}

**Acceptance Criteria:**
${safe.acceptanceCriteria}

**Story Points:** ${safe.storyPoints}
**Epic:** ${safe.epicKey}
**Labels:** ${safe.labels}

Please analyze this story and provide your scoring assessment in the XML format specified.`;
}

export type ScoreParseResult =
  | {
      success: true;
      data: {
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
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Legacy function signature for backward compatibility
 * @deprecated Use parseScoreResponseSafe instead
 */
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
  const result = parseScoreResponseSafe(xml);
  if (result.success) {
    return result.data;
  }
  // Return defaults for backward compatibility, but log the error
  console.error("[AI Parser] Score parsing failed:", result.error);
  return {
    totalScore: 0,
    dimensions: {
      completeness: { score: 0, max: 25, reasoning: "Failed to parse AI response" },
      clarity: { score: 0, max: 25, reasoning: "Failed to parse AI response" },
      estimability: { score: 0, max: 20, reasoning: "Failed to parse AI response" },
      traceability: { score: 0, max: 15, reasoning: "Failed to parse AI response" },
      testability: { score: 0, max: 15, reasoning: "Failed to parse AI response" },
    },
    suggestions: [],
  };
}

/**
 * Safely parse AI score response with explicit error handling
 */
export function parseScoreResponseSafe(xml: string): ScoreParseResult {
  // Validate basic XML structure
  if (!xml || typeof xml !== "string") {
    return { success: false, error: "Empty or invalid response from AI" };
  }

  if (!xml.includes("<analysis>") || !xml.includes("</analysis>")) {
    return { success: false, error: "AI response missing expected XML structure" };
  }

  // Extract total score
  const totalScoreMatch = xml.match(/<total_score>(\d+)<\/total_score>/);
  if (!totalScoreMatch) {
    return { success: false, error: "Could not extract total score from AI response" };
  }

  const totalScore = parseInt(totalScoreMatch[1], 10);

  // Validate score is in range
  if (totalScore < 0 || totalScore > 100) {
    return { success: false, error: `AI returned invalid score: ${totalScore}` };
  }

  // Extract dimensions
  const extractDimension = (name: string): { score: number; max: number; reasoning: string } | null => {
    const pattern = new RegExp(
      `<${name}\\s+score="(\\d+)"\\s+max="(\\d+)"[^>]*>\\s*<reasoning>([\\s\\S]*?)<\\/reasoning>\\s*<\\/${name}>`,
      "i"
    );
    const match = xml.match(pattern);
    if (match) {
      const score = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      // Validate dimension score doesn't exceed max
      if (score > max) {
        return null;
      }
      return {
        score,
        max,
        reasoning: match[3].trim(),
      };
    }
    return null;
  };

  const completeness = extractDimension("completeness");
  const clarity = extractDimension("clarity");
  const estimability = extractDimension("estimability");
  const traceability = extractDimension("traceability");
  const testability = extractDimension("testability");

  // Require at least the main dimensions to be present
  if (!completeness || !clarity || !testability) {
    return { success: false, error: "AI response missing required scoring dimensions" };
  }

  const dimensions = {
    completeness,
    clarity,
    estimability: estimability || { score: 0, max: 20, reasoning: "Not evaluated" },
    traceability: traceability || { score: 0, max: 15, reasoning: "Not evaluated" },
    testability,
  };

  // Validate that dimensions sum reasonably close to total (allow some rounding)
  const dimensionSum = Object.values(dimensions).reduce((sum, d) => sum + d.score, 0);
  if (Math.abs(dimensionSum - totalScore) > 5) {
    // Log warning but don't fail - AI might round differently
    console.warn(`[AI Parser] Dimension sum (${dimensionSum}) differs from total (${totalScore})`);
  }

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

  return {
    success: true,
    data: { totalScore, dimensions, suggestions },
  };
}
