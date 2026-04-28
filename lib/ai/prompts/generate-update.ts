/**
 * AI Prompt for Stakeholder Update Generation
 * Version: 1.1.0
 *
 * Generates audience-aware stakeholder updates based on sprint context.
 */

import { sanitizeForPrompt, sanitizeStringArray } from "../sanitize";

export const PROMPT_VERSION = "1.1.0";

export const GENERATE_UPDATE_SYSTEM = `You are a senior program manager expert at writing stakeholder communications. You craft clear, concise, audience-appropriate updates that communicate sprint progress effectively.

## Audience Guidelines

**Executive Leadership**
- Focus on business outcomes and strategic progress
- Lead with impact and value delivered
- Use metrics sparingly but meaningfully
- Avoid technical jargon
- Keep it under 150 words
- Tone: Professional, confident

**Engineering Team**
- Include technical details and ticket references
- List specific blockers and their status
- Mention architectural decisions
- Can be more detailed (200-300 words)
- Tone: Direct, collaborative

**Client / Customer**
- Focus on features they'll see
- Include timelines and delivery dates
- Emphasize quality and reliability
- Avoid internal process details
- Keep it under 200 words
- Tone: Reassuring, professional

**Board / Investors**
- Strategic overview only
- Key metrics and trends
- Risk assessment with mitigations
- Competitive context if relevant
- Keep it under 100 words
- Tone: Formal, data-driven

## Tone Scale

1. Formal: "We are pleased to report..."
2. Professional: "This sprint delivered..."
3. Balanced: "We shipped some great work this sprint..."
4. Friendly: "Great news from the team this week!"
5. Casual: "Hey all, quick update..."

## Output Format

Write the update as plain text with appropriate formatting:
- Use headers (##) for sections if needed
- Use bullet points for lists
- Bold key metrics with **metric**
- Include a clear summary at the top

Do not include XML tags in your response. Just write the update content directly.`;

export interface UpdateContext {
  sprintName: string;
  sprintGoal?: string;
  completedStories?: Array<{
    key: string;
    title: string;
    points?: number;
  }>;
  inProgressStories?: Array<{
    key: string;
    title: string;
    progress?: number;
  }>;
  blockers?: Array<{
    description: string;
    impact: string;
    resolution?: string;
  }>;
  velocityTarget?: number;
  velocityActual?: number;
  highlights?: string[];
  risks?: string[];
  decisions?: string[];
  additionalContext?: string;
}

export function buildUpdatePrompt(
  context: UpdateContext,
  audience: "executive" | "team" | "client" | "board",
  tone: 1 | 2 | 3 | 4 | 5
): string {
  const toneDesc = {
    1: "very formal",
    2: "professional",
    3: "balanced",
    4: "friendly",
    5: "casual",
  };

  // Sanitize all user-provided content
  const safeSprintName = sanitizeForPrompt(context.sprintName, { maxLength: 200 });
  const safeSprintGoal = context.sprintGoal
    ? sanitizeForPrompt(context.sprintGoal, { maxLength: 500 })
    : null;

  const safeCompletedStories = context.completedStories?.map((s) => ({
    key: sanitizeForPrompt(s.key, { maxLength: 50 }),
    title: sanitizeForPrompt(s.title, { maxLength: 200 }),
    points: s.points,
  })) || [];

  const safeInProgressStories = context.inProgressStories?.map((s) => ({
    key: sanitizeForPrompt(s.key, { maxLength: 50 }),
    title: sanitizeForPrompt(s.title, { maxLength: 200 }),
    progress: s.progress,
  })) || [];

  const safeBlockers = context.blockers?.map((b) => ({
    description: sanitizeForPrompt(b.description, { maxLength: 500 }),
    impact: sanitizeForPrompt(b.impact, { maxLength: 200 }),
    resolution: b.resolution ? sanitizeForPrompt(b.resolution, { maxLength: 200 }) : undefined,
  })) || [];

  const safeHighlights = sanitizeStringArray(context.highlights, { maxItems: 20, maxItemLength: 300 });
  const safeRisks = sanitizeStringArray(context.risks, { maxItems: 20, maxItemLength: 300 });
  const safeDecisions = sanitizeStringArray(context.decisions, { maxItems: 20, maxItemLength: 300 });
  const safeAdditionalContext = context.additionalContext
    ? sanitizeForPrompt(context.additionalContext, { maxLength: 2000 })
    : null;

  let prompt = `## Context for Update

**Sprint:** ${safeSprintName}
${safeSprintGoal ? `**Sprint Goal:** ${safeSprintGoal}` : ""}

**Audience:** ${audience}
**Tone:** ${toneDesc[tone]}

### Completed Work
${
  safeCompletedStories.length
    ? safeCompletedStories
        .map((s) => `- ${s.key}: ${s.title}${s.points ? ` (${s.points} pts)` : ""}`)
        .join("\n")
    : "No stories completed yet"
}

### In Progress
${
  safeInProgressStories.length
    ? safeInProgressStories
        .map((s) => `- ${s.key}: ${s.title}${s.progress ? ` (${s.progress}% done)` : ""}`)
        .join("\n")
    : "No stories currently in progress"
}

### Blockers
${
  safeBlockers.length
    ? safeBlockers
        .map(
          (b) =>
            `- ${b.description}\n  Impact: ${b.impact}${b.resolution ? `\n  Resolution: ${b.resolution}` : ""}`
        )
        .join("\n")
    : "No current blockers"
}`;

  if (context.velocityTarget || context.velocityActual) {
    prompt += `

### Velocity
Target: ${context.velocityTarget ?? "N/A"} | Actual: ${context.velocityActual ?? "N/A"}`;
  }

  if (safeHighlights.length) {
    prompt += `

### Highlights
${safeHighlights.map((h) => `- ${h}`).join("\n")}`;
  }

  if (safeRisks.length) {
    prompt += `

### Risks
${safeRisks.map((r) => `- ${r}`).join("\n")}`;
  }

  if (safeDecisions.length) {
    prompt += `

### Key Decisions
${safeDecisions.map((d) => `- ${d}`).join("\n")}`;
  }

  if (safeAdditionalContext) {
    prompt += `

### Additional Context
${safeAdditionalContext}`;
  }

  prompt += `

---

Please write the stakeholder update for the ${audience} audience with a ${toneDesc[tone]} tone. Write the content directly without any XML tags or formatting instructions.`;

  return prompt;
}
