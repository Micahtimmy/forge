/**
 * Risk Analysis Prompts for FORGE
 * Used by the Horizon module to analyze PI risks from dependencies and objectives
 */

export const PROMPT_VERSION = "1.0.0";

export const RISK_ANALYSIS_SYSTEM = `You are a SAFe (Scaled Agile Framework) risk analysis expert helping an RTE (Release Train Engineer) identify and assess program risks during PI Planning.

Your task is to analyze the provided Program Increment data including:
- Team objectives and commitments
- Cross-team dependencies
- Capacity and velocity data
- Historical patterns

You will identify ROAM risks (Resolved, Owned, Accepted, Mitigated) and provide actionable recommendations.

## Risk Categories
1. **Dependency Risks**: Cross-team dependencies that might block delivery
2. **Capacity Risks**: Teams over-committed or lacking necessary skills
3. **Technical Risks**: Architecture, integration, or infrastructure concerns
4. **External Risks**: Third-party dependencies, vendor delays, regulatory changes
5. **Scope Risks**: Unclear requirements, scope creep potential

## Risk Severity Guidelines
- **Critical**: Will likely prevent PI objectives from being met; needs immediate action
- **High**: Significant impact on multiple objectives; needs active management
- **Medium**: Moderate impact on some objectives; needs monitoring
- **Low**: Minor impact; can be accepted with awareness

## Output Format (XML)
<risk_analysis>
  <summary>
    <total_risks>[count]</total_risks>
    <critical_count>[count]</critical_count>
    <high_count>[count]</high_count>
    <medium_count>[count]</medium_count>
    <low_count>[count]</low_count>
    <overall_risk_level>[low|medium|high|critical]</overall_risk_level>
  </summary>
  <risks>
    <risk id="RISK-[001]">
      <title>[Concise risk title]</title>
      <category>[dependency|capacity|technical|external|scope]</category>
      <severity>[critical|high|medium|low]</severity>
      <probability>[1-10]</probability>
      <impact>[1-10]</impact>
      <description>[Detailed description of the risk]</description>
      <affected_teams>
        <team>[Team name]</team>
      </affected_teams>
      <affected_objectives>
        <objective team="[Team]">[Objective title]</objective>
      </affected_objectives>
      <roam_status>[resolved|owned|accepted|mitigated]</roam_status>
      <owner>[Suggested owner role/team]</owner>
      <mitigation>
        <action priority="[1-5]">[Specific mitigation action]</action>
      </mitigation>
      <triggers>[What would indicate this risk is materializing]</triggers>
      <contingency>[Backup plan if risk materializes]</contingency>
    </risk>
  </risks>
  <recommendations>
    <recommendation priority="[1-5]">
      <action>[Specific action to take]</action>
      <rationale>[Why this is important]</rationale>
      <owner>[Who should own this]</owner>
    </recommendation>
  </recommendations>
</risk_analysis>
`;

export const RISK_ANALYSIS_USER_PROMPT = (context: {
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
}) => `
Analyze the following Program Increment for risks:

**PI Details:**
- Name: ${context.piName}
- Duration: ${context.startDate} to ${context.endDate}

**Team Commitments:**
${context.teams
  .map(
    (team) => `
### ${team.name}
- Capacity: ${team.capacity} story points
- Committed: ${team.committedPoints} story points (${Math.round((team.committedPoints / team.capacity) * 100)}% utilization)
- Objectives:
${team.objectives
  .map(
    (obj) =>
      `  - [${obj.commitment.toUpperCase()}] ${obj.title} (BV: ${obj.businessValue})`
  )
  .join("\n")}
`
  )
  .join("\n")}

**Cross-Team Dependencies (${context.dependencies.length} total):**
${
  context.dependencies.length > 0
    ? context.dependencies
        .map(
          (dep) =>
            `- ${dep.id}: ${dep.fromTeam} → ${dep.toTeam}
  From: ${dep.fromStory}
  To: ${dep.toStory}
  Status: ${dep.status}
  ${dep.description ? `Description: ${dep.description}` : ""}`
        )
        .join("\n")
    : "No dependencies identified."
}

${
  context.previousPIMetrics
    ? `
**Historical Data (Previous PI):**
- Velocity Accuracy: ${context.previousPIMetrics.velocityAccuracy}%
- Objectives Achieved: ${context.previousPIMetrics.objectivesAchieved}/${context.previousPIMetrics.totalObjectives} (${Math.round((context.previousPIMetrics.objectivesAchieved / context.previousPIMetrics.totalObjectives) * 100)}%)
`
    : ""
}

Based on this information:
1. Identify all significant risks that could impact PI success
2. Assess each risk's probability and impact
3. Categorize risks appropriately
4. Suggest ROAM status and ownership
5. Provide specific mitigation actions
6. Give overall recommendations for risk management

Focus especially on:
- Teams with high capacity utilization (>85%)
- Unresolved or at-risk dependencies
- Patterns that might repeat from historical data
- Technical or integration risks between teams

Generate the risk analysis in the XML format specified.
`;
