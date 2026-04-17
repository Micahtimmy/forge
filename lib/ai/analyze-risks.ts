import { getModel, GENERATION_CONFIGS } from "./client";
import {
  RISK_ANALYSIS_SYSTEM,
  RISK_ANALYSIS_USER_PROMPT,
} from "./prompts/analyze-risks";

export interface RiskAnalysisContext {
  piName: string;
  startDate: string;
  endDate: string;
  teams: Array<{
    name: string;
    capacity: number;
    committedPoints: number;
    objectives: Array<{
      title: string;
      businessValue: number;
      commitment: "committed" | "uncommitted";
    }>;
  }>;
  dependencies: Array<{
    id: string;
    fromTeam: string;
    toTeam: string;
    fromStory: string;
    toStory: string;
    status: string;
    description?: string;
  }>;
  previousPIMetrics?: {
    velocityAccuracy: number;
    objectivesAchieved: number;
    totalObjectives: number;
  };
}

export interface Risk {
  id: string;
  title: string;
  category: "dependency" | "capacity" | "technical" | "external" | "scope";
  severity: "critical" | "high" | "medium" | "low";
  probability: number;
  impact: number;
  description: string;
  affectedTeams: string[];
  affectedObjectives: Array<{ team: string; title: string }>;
  roamStatus: "resolved" | "owned" | "accepted" | "mitigated";
  owner: string;
  mitigationActions: Array<{ priority: number; action: string }>;
  triggers: string;
  contingency: string;
}

export interface Recommendation {
  priority: number;
  action: string;
  rationale: string;
  owner: string;
}

export interface RiskSummary {
  totalRisks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  overallRiskLevel: "low" | "medium" | "high" | "critical";
}

export interface RiskAnalysisResult {
  summary: RiskSummary;
  risks: Risk[];
  recommendations: Recommendation[];
  rawResponse: string;
}

/**
 * Parse the XML response from Gemini into structured risk analysis
 */
function parseRiskAnalysisXML(xmlString: string): Omit<RiskAnalysisResult, "rawResponse"> {
  // Parse summary
  const summary: RiskSummary = {
    totalRisks: parseInt(extractTag(xmlString, "total_risks") || "0", 10),
    criticalCount: parseInt(extractTag(xmlString, "critical_count") || "0", 10),
    highCount: parseInt(extractTag(xmlString, "high_count") || "0", 10),
    mediumCount: parseInt(extractTag(xmlString, "medium_count") || "0", 10),
    lowCount: parseInt(extractTag(xmlString, "low_count") || "0", 10),
    overallRiskLevel: (extractTag(xmlString, "overall_risk_level") || "medium") as RiskSummary["overallRiskLevel"],
  };

  // Parse risks
  const risks: Risk[] = [];
  const riskRegex = /<risk id="([^"]+)">([\s\S]*?)<\/risk>/g;
  let riskMatch;

  while ((riskMatch = riskRegex.exec(xmlString)) !== null) {
    const riskId = riskMatch[1];
    const riskContent = riskMatch[2];

    // Parse affected teams
    const teamRegex = /<team>([^<]+)<\/team>/g;
    const affectedTeams: string[] = [];
    let teamMatch;
    while ((teamMatch = teamRegex.exec(riskContent)) !== null) {
      affectedTeams.push(teamMatch[1].trim());
    }

    // Parse affected objectives
    const objRegex = /<objective team="([^"]+)">([^<]+)<\/objective>/g;
    const affectedObjectives: Array<{ team: string; title: string }> = [];
    let objMatch;
    while ((objMatch = objRegex.exec(riskContent)) !== null) {
      affectedObjectives.push({ team: objMatch[1], title: objMatch[2].trim() });
    }

    // Parse mitigation actions
    const actionRegex = /<action priority="([^"]+)">([^<]+)<\/action>/g;
    const mitigationActions: Array<{ priority: number; action: string }> = [];
    let actionMatch;
    while ((actionMatch = actionRegex.exec(riskContent)) !== null) {
      mitigationActions.push({
        priority: parseInt(actionMatch[1], 10),
        action: actionMatch[2].trim(),
      });
    }

    risks.push({
      id: riskId,
      title: extractTag(riskContent, "title") || "",
      category: (extractTag(riskContent, "category") || "scope") as Risk["category"],
      severity: (extractTag(riskContent, "severity") || "medium") as Risk["severity"],
      probability: parseInt(extractTag(riskContent, "probability") || "5", 10),
      impact: parseInt(extractTag(riskContent, "impact") || "5", 10),
      description: extractTag(riskContent, "description") || "",
      affectedTeams,
      affectedObjectives,
      roamStatus: (extractTag(riskContent, "roam_status") || "owned") as Risk["roamStatus"],
      owner: extractTag(riskContent, "owner") || "",
      mitigationActions,
      triggers: extractTag(riskContent, "triggers") || "",
      contingency: extractTag(riskContent, "contingency") || "",
    });
  }

  // Parse recommendations
  const recommendations: Recommendation[] = [];
  const recRegex = /<recommendation priority="([^"]+)">([\s\S]*?)<\/recommendation>/g;
  let recMatch;

  while ((recMatch = recRegex.exec(xmlString)) !== null) {
    const priority = parseInt(recMatch[1], 10);
    const recContent = recMatch[2];

    recommendations.push({
      priority,
      action: extractTag(recContent, "action") || "",
      rationale: extractTag(recContent, "rationale") || "",
      owner: extractTag(recContent, "owner") || "",
    });
  }

  // Sort recommendations by priority
  recommendations.sort((a, b) => a.priority - b.priority);

  return {
    summary,
    risks,
    recommendations,
  };
}

function extractTag(content: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Analyze risks for a Program Increment using Gemini AI
 */
export async function analyzeRisks(
  context: RiskAnalysisContext
): Promise<RiskAnalysisResult> {
  const model = getModel();

  const userPrompt = RISK_ANALYSIS_USER_PROMPT(context);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: RISK_ANALYSIS_SYSTEM + "\n\n" + userPrompt }],
      },
    ],
    generationConfig: GENERATION_CONFIGS.analysis,
  });

  const response = result.response;
  const rawResponse = response.text();

  // Parse the XML response
  const parsed = parseRiskAnalysisXML(rawResponse);

  return {
    ...parsed,
    rawResponse,
  };
}

/**
 * Stream risk analysis for real-time updates
 */
export async function* streamRiskAnalysis(
  context: RiskAnalysisContext
): AsyncGenerator<string, RiskAnalysisResult, unknown> {
  const model = getModel();

  const userPrompt = RISK_ANALYSIS_USER_PROMPT(context);

  const result = await model.generateContentStream({
    contents: [
      {
        role: "user",
        parts: [{ text: RISK_ANALYSIS_SYSTEM + "\n\n" + userPrompt }],
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
  const parsed = parseRiskAnalysisXML(fullResponse);

  return {
    ...parsed,
    rawResponse: fullResponse,
  };
}
