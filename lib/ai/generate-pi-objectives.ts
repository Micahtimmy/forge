import { getModel, GENERATION_CONFIGS } from "./client";
import {
  PI_OBJECTIVES_SYSTEM,
  PI_OBJECTIVES_USER_PROMPT,
} from "./prompts/pi-objectives";

export interface PIContext {
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
}

export interface PIObjective {
  title: string;
  description: string;
  businessValue: number;
  commitmentLevel: "committed" | "uncommitted";
  successCriteria: string[];
  relatedFeatures: Array<{ key: string; title: string }>;
  dependencies: Array<{
    type: "providing" | "receiving";
    team: string;
    description: string;
  }>;
  risks: Array<{ severity: "low" | "medium" | "high"; description: string }>;
}

export interface TeamObjectives {
  teamName: string;
  objectives: PIObjective[];
}

export interface PIObjectivesResult {
  teams: TeamObjectives[];
  rawResponse: string;
}

/**
 * Parse the XML response from Gemini into structured objectives
 */
function parseObjectivesXML(xmlString: string): TeamObjectives[] {
  const teams: TeamObjectives[] = [];

  // Extract team blocks
  const teamRegex = /<team name="([^"]+)">([\s\S]*?)<\/team>/g;
  let teamMatch;

  while ((teamMatch = teamRegex.exec(xmlString)) !== null) {
    const teamName = teamMatch[1];
    const teamContent = teamMatch[2];
    const objectives: PIObjective[] = [];

    // Extract objectives within each team
    const objectiveRegex = /<objective>([\s\S]*?)<\/objective>/g;
    let objMatch;

    while ((objMatch = objectiveRegex.exec(teamContent)) !== null) {
      const objContent = objMatch[1];

      // Parse individual fields
      const title = extractTag(objContent, "title") || "";
      const description = extractTag(objContent, "description") || "";
      const businessValue = parseInt(extractTag(objContent, "business_value") || "5", 10);
      const commitmentLevel = (extractTag(objContent, "commitment_level") || "committed") as
        | "committed"
        | "uncommitted";

      // Parse success criteria
      const criteriaRegex = /<criterion>([^<]+)<\/criterion>/g;
      const successCriteria: string[] = [];
      let criterionMatch;
      while ((criterionMatch = criteriaRegex.exec(objContent)) !== null) {
        successCriteria.push(criterionMatch[1].trim());
      }

      // Parse related features
      const featureRegex = /<feature key="([^"]+)">([^<]+)<\/feature>/g;
      const relatedFeatures: Array<{ key: string; title: string }> = [];
      let featureMatch;
      while ((featureMatch = featureRegex.exec(objContent)) !== null) {
        relatedFeatures.push({ key: featureMatch[1], title: featureMatch[2].trim() });
      }

      // Parse dependencies
      const depRegex = /<dependency type="([^"]+)" team="([^"]+)">([^<]+)<\/dependency>/g;
      const dependencies: Array<{
        type: "providing" | "receiving";
        team: string;
        description: string;
      }> = [];
      let depMatch;
      while ((depMatch = depRegex.exec(objContent)) !== null) {
        dependencies.push({
          type: depMatch[1] as "providing" | "receiving",
          team: depMatch[2],
          description: depMatch[3].trim(),
        });
      }

      // Parse risks
      const riskRegex = /<risk severity="([^"]+)">([^<]+)<\/risk>/g;
      const risks: Array<{ severity: "low" | "medium" | "high"; description: string }> = [];
      let riskMatch;
      while ((riskMatch = riskRegex.exec(objContent)) !== null) {
        risks.push({
          severity: riskMatch[1] as "low" | "medium" | "high",
          description: riskMatch[2].trim(),
        });
      }

      objectives.push({
        title,
        description,
        businessValue,
        commitmentLevel,
        successCriteria,
        relatedFeatures,
        dependencies,
        risks,
      });
    }

    teams.push({ teamName, objectives });
  }

  return teams;
}

function extractTag(content: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Generate PI objectives using Gemini AI
 */
export async function generatePIObjectives(
  context: PIContext
): Promise<PIObjectivesResult> {
  const model = getModel();

  const userPrompt = PI_OBJECTIVES_USER_PROMPT(context);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: PI_OBJECTIVES_SYSTEM + "\n\n" + userPrompt }],
      },
    ],
    generationConfig: GENERATION_CONFIGS.analysis,
  });

  const response = result.response;
  const rawResponse = response.text();

  // Parse the XML response
  const teams = parseObjectivesXML(rawResponse);

  return {
    teams,
    rawResponse,
  };
}

/**
 * Stream PI objectives generation for real-time updates
 */
export async function* streamPIObjectives(
  context: PIContext
): AsyncGenerator<string, PIObjectivesResult, unknown> {
  const model = getModel();

  const userPrompt = PI_OBJECTIVES_USER_PROMPT(context);

  const result = await model.generateContentStream({
    contents: [
      {
        role: "user",
        parts: [{ text: PI_OBJECTIVES_SYSTEM + "\n\n" + userPrompt }],
      },
    ],
    generationConfig: GENERATION_CONFIGS.analysis,
  });

  let fullResponse = "";

  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullResponse += text;
    yield text;
  }

  // Parse the complete response
  const teams = parseObjectivesXML(fullResponse);

  return {
    teams,
    rawResponse: fullResponse,
  };
}
