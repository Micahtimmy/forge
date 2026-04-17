/**
 * AI Prompt for Stakeholder Update Generation
 * Version: 1.0.0
 *
 * Generates audience-aware stakeholder updates based on sprint context.
 */

export const PROMPT_VERSION = "1.0.0";

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

  let prompt = `## Context for Update

**Sprint:** ${context.sprintName}
${context.sprintGoal ? `**Sprint Goal:** ${context.sprintGoal}` : ""}

**Audience:** ${audience}
**Tone:** ${toneDesc[tone]}

### Completed Work
${
  context.completedStories?.length
    ? context.completedStories
        .map((s) => `- ${s.key}: ${s.title}${s.points ? ` (${s.points} pts)` : ""}`)
        .join("\n")
    : "No stories completed yet"
}

### In Progress
${
  context.inProgressStories?.length
    ? context.inProgressStories
        .map((s) => `- ${s.key}: ${s.title}${s.progress ? ` (${s.progress}% done)` : ""}`)
        .join("\n")
    : "No stories currently in progress"
}

### Blockers
${
  context.blockers?.length
    ? context.blockers
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

  if (context.highlights?.length) {
    prompt += `

### Highlights
${context.highlights.map((h) => `- ${h}`).join("\n")}`;
  }

  if (context.risks?.length) {
    prompt += `

### Risks
${context.risks.map((r) => `- ${r}`).join("\n")}`;
  }

  if (context.decisions?.length) {
    prompt += `

### Key Decisions
${context.decisions.map((d) => `- ${d}`).join("\n")}`;
  }

  if (context.additionalContext) {
    prompt += `

### Additional Context
${context.additionalContext}`;
  }

  prompt += `

---

Please write the stakeholder update for the ${audience} audience with a ${toneDesc[tone]} tone. Write the content directly without any XML tags or formatting instructions.`;

  return prompt;
}
