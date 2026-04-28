/**
 * Story Writer AI Prompts
 * Generates well-formed user stories from brief descriptions
 */

import { sanitizeForPrompt } from "../sanitize";

export const PROMPT_VERSION = "1.1.0";

export const GENERATE_STORY_SYSTEM = `You are a senior product manager and agile expert. Your task is to transform brief feature descriptions into well-structured user stories that follow best practices.

A high-quality user story should have:
1. **Clear Title** - Action-oriented, describes the feature
2. **User Story Format** - "As a [user], I want [feature], so that [benefit]"
3. **Detailed Description** - Context, constraints, and scope
4. **Acceptance Criteria** - Specific, testable conditions using Given/When/Then format
5. **Story Points Estimate** - Based on complexity (1, 2, 3, 5, 8, 13)
6. **Suggested Labels** - Relevant categorization tags

Output format (XML):
<story>
  <title>Clear, action-oriented title</title>
  <description>
    As a [user type], I want [feature/capability], so that [benefit/value].

    ## Context
    Additional context about the feature...

    ## Scope
    What's in scope and out of scope...
  </description>
  <acceptance_criteria>
    <criterion>Given [context], when [action], then [expected result]</criterion>
    <criterion>Given [context], when [action], then [expected result]</criterion>
    <criterion>Given [context], when [action], then [expected result]</criterion>
  </acceptance_criteria>
  <story_points>5</story_points>
  <labels>
    <label>feature-area</label>
    <label>priority</label>
  </labels>
  <notes>Any additional implementation notes or considerations</notes>
</story>

Focus on:
- Making acceptance criteria specific and testable
- Ensuring the story is small enough to complete in one sprint
- Including edge cases and error scenarios
- Suggesting realistic story point estimates`;

export interface StoryWriterInput {
  briefDescription: string;
  projectContext?: string;
  epicName?: string;
  targetAudience?: string;
}

export function buildGenerateStoryPrompt(input: StoryWriterInput): string {
  // Sanitize all user-provided content to prevent prompt injection
  const safeBriefDescription = sanitizeForPrompt(input.briefDescription, {
    maxLength: 2000,
    placeholder: "[No description provided]",
  });
  const safeProjectContext = input.projectContext
    ? sanitizeForPrompt(input.projectContext, { maxLength: 1000 })
    : null;
  const safeEpicName = input.epicName
    ? sanitizeForPrompt(input.epicName, { maxLength: 200 })
    : null;
  const safeTargetAudience = input.targetAudience
    ? sanitizeForPrompt(input.targetAudience, { maxLength: 200 })
    : null;

  let prompt = `Generate a well-structured user story from this brief description:

"${safeBriefDescription}"`;

  if (safeProjectContext) {
    prompt += `\n\nProject Context: ${safeProjectContext}`;
  }

  if (safeEpicName) {
    prompt += `\n\nEpic: ${safeEpicName}`;
  }

  if (safeTargetAudience) {
    prompt += `\n\nTarget User: ${safeTargetAudience}`;
  }

  prompt += `\n\nGenerate a complete, well-formed user story with all required elements.`;

  return prompt;
}

export interface GeneratedStory {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  labels: string[];
  notes: string;
}

export function parseGeneratedStory(xml: string): GeneratedStory {
  const getTagContent = (tag: string): string => {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
  };

  const getAllTagContents = (tag: string): string[] => {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi");
    const matches = xml.matchAll(regex);
    return Array.from(matches).map((m) => m[1].trim());
  };

  const storyPointsStr = getTagContent("story_points");
  const storyPoints = parseInt(storyPointsStr, 10) || 5;

  return {
    title: getTagContent("title"),
    description: getTagContent("description"),
    acceptanceCriteria: getAllTagContents("criterion"),
    storyPoints: [1, 2, 3, 5, 8, 13].includes(storyPoints) ? storyPoints : 5,
    labels: getAllTagContents("label"),
    notes: getTagContent("notes"),
  };
}
