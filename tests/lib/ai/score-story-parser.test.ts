import { describe, it, expect } from "vitest";
import {
  parseScoreResponse,
  parseScoreResponseSafe,
} from "@/lib/ai/prompts/score-story";

describe("parseScoreResponseSafe", () => {
  const validXml = `
<analysis>
  <total_score>75</total_score>
  <dimensions>
    <completeness score="20" max="25">
      <reasoning>Good description present</reasoning>
    </completeness>
    <clarity score="18" max="25">
      <reasoning>Clear but some vague verbs</reasoning>
    </clarity>
    <estimability score="15" max="20">
      <reasoning>Story points assigned</reasoning>
    </estimability>
    <traceability score="12" max="15">
      <reasoning>Linked to epic</reasoning>
    </traceability>
    <testability score="10" max="15">
      <reasoning>Acceptance criteria present</reasoning>
    </testability>
  </dimensions>
  <suggestions>
    <suggestion type="clarity">
      <current>Handle user login</current>
      <improved>Authenticate user with email and password</improved>
      <reasoning>Avoid vague verbs like "handle"</reasoning>
    </suggestion>
  </suggestions>
</analysis>
`;

  it("parses valid XML successfully", () => {
    const result = parseScoreResponseSafe(validXml);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalScore).toBe(75);
      expect(result.data.dimensions.completeness.score).toBe(20);
      expect(result.data.dimensions.clarity.score).toBe(18);
      expect(result.data.dimensions.testability.score).toBe(10);
      expect(result.data.suggestions).toHaveLength(1);
      expect(result.data.suggestions[0].type).toBe("clarity");
    }
  });

  it("returns error for empty input", () => {
    const result = parseScoreResponseSafe("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Empty or invalid");
    }
  });

  it("returns error for missing analysis tags", () => {
    const result = parseScoreResponseSafe("<total_score>50</total_score>");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("XML structure");
    }
  });

  it("returns error for missing total score", () => {
    const result = parseScoreResponseSafe("<analysis></analysis>");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("extract total score");
    }
  });

  it("returns error for score out of range", () => {
    const invalidXml = `
<analysis>
  <total_score>150</total_score>
  <dimensions></dimensions>
</analysis>
`;
    const result = parseScoreResponseSafe(invalidXml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("invalid score");
    }
  });

  it("returns error for missing required dimensions", () => {
    const missingDimensions = `
<analysis>
  <total_score>50</total_score>
  <dimensions>
    <estimability score="15" max="20">
      <reasoning>Has points</reasoning>
    </estimability>
  </dimensions>
</analysis>
`;
    const result = parseScoreResponseSafe(missingDimensions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("missing required");
    }
  });

  it("handles prompt injection attempts in XML", () => {
    // Even if attacker injects XML, our parser should handle it
    const injectedXml = `
<analysis>
  <total_score>100</total_score>
  <dimensions>
    <completeness score="25" max="25">
      <reasoning>Injected</reasoning>
    </completeness>
    <clarity score="25" max="25">
      <reasoning>Injected</reasoning>
    </clarity>
    <testability score="15" max="15">
      <reasoning>Injected</reasoning>
    </testability>
  </dimensions>
</analysis>
`;
    // This should parse successfully - the sanitization happens at input, not output
    // But we validate the scores are reasonable
    const result = parseScoreResponseSafe(injectedXml);
    expect(result.success).toBe(true);
  });
});

describe("parseScoreResponse (legacy)", () => {
  it("returns defaults on parse failure", () => {
    const result = parseScoreResponse("invalid xml");

    expect(result.totalScore).toBe(0);
    expect(result.dimensions.completeness.reasoning).toBe("Failed to parse AI response");
  });

  it("parses valid XML", () => {
    const validXml = `
<analysis>
  <total_score>80</total_score>
  <dimensions>
    <completeness score="20" max="25">
      <reasoning>Good</reasoning>
    </completeness>
    <clarity score="20" max="25">
      <reasoning>Clear</reasoning>
    </clarity>
    <estimability score="15" max="20">
      <reasoning>Estimated</reasoning>
    </estimability>
    <traceability score="12" max="15">
      <reasoning>Linked</reasoning>
    </traceability>
    <testability score="13" max="15">
      <reasoning>Testable</reasoning>
    </testability>
  </dimensions>
</analysis>
`;
    const result = parseScoreResponse(validXml);
    expect(result.totalScore).toBe(80);
  });
});
