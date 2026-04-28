import { describe, it, expect } from "vitest";
import {
  PROMPT_VERSION,
  SCORE_STORY_SYSTEM,
  buildScoreStoryPrompt,
  parseScoreResponse,
} from "@/lib/ai/prompts/score-story";

describe("Score Story Prompt", () => {
  describe("Constants", () => {
    it("has a version number", () => {
      expect(PROMPT_VERSION).toBe("1.1.0");
    });

    it("has a system prompt", () => {
      expect(SCORE_STORY_SYSTEM).toContain("agile coach");
      expect(SCORE_STORY_SYSTEM).toContain("Completeness");
      expect(SCORE_STORY_SYSTEM).toContain("Clarity");
      expect(SCORE_STORY_SYSTEM).toContain("Estimability");
      expect(SCORE_STORY_SYSTEM).toContain("Traceability");
      expect(SCORE_STORY_SYSTEM).toContain("Testability");
    });

    it("includes max scores in system prompt", () => {
      expect(SCORE_STORY_SYSTEM).toContain("max 25 points");
      expect(SCORE_STORY_SYSTEM).toContain("max 20 points");
      expect(SCORE_STORY_SYSTEM).toContain("max 15 points");
    });

    it("includes XML output format", () => {
      expect(SCORE_STORY_SYSTEM).toContain("<analysis>");
      expect(SCORE_STORY_SYSTEM).toContain("<total_score>");
      expect(SCORE_STORY_SYSTEM).toContain("<dimensions>");
      expect(SCORE_STORY_SYSTEM).toContain("<suggestions>");
    });
  });

  describe("buildScoreStoryPrompt", () => {
    it("builds prompt with all fields", () => {
      const story = {
        key: "PROJ-123",
        title: "Implement user login",
        description: "As a user, I want to log in so I can access my account",
        acceptanceCriteria: "User can log in with email and password",
        storyPoints: 5,
        epicKey: "AUTH-1",
        labels: ["auth", "security"],
      };

      const prompt = buildScoreStoryPrompt(story);

      expect(prompt).toContain("PROJ-123");
      expect(prompt).toContain("Implement user login");
      expect(prompt).toContain("As a user, I want to log in");
      expect(prompt).toContain("User can log in with email and password");
      expect(prompt).toContain("Story Points:** 5");
      expect(prompt).toContain("AUTH-1");
      expect(prompt).toContain("auth, security");
    });

    it("handles missing description", () => {
      const story = {
        key: "PROJ-124",
        title: "Some story",
        description: null,
        acceptanceCriteria: "Some criteria",
        storyPoints: 3,
        epicKey: null,
        labels: null,
      };

      const prompt = buildScoreStoryPrompt(story);

      expect(prompt).toContain("[No description provided]");
    });

    it("handles missing acceptance criteria", () => {
      const story = {
        key: "PROJ-125",
        title: "Another story",
        description: "Some description",
        acceptanceCriteria: null,
        storyPoints: 2,
        epicKey: "EPIC-1",
        labels: ["feature"],
      };

      const prompt = buildScoreStoryPrompt(story);

      expect(prompt).toContain("[No acceptance criteria provided]");
    });

    it("handles missing story points", () => {
      const story = {
        key: "PROJ-126",
        title: "Unestimated story",
        description: "Description",
        acceptanceCriteria: "Criteria",
        storyPoints: null,
        epicKey: null,
        labels: null,
      };

      const prompt = buildScoreStoryPrompt(story);

      expect(prompt).toContain("Not estimated");
    });

    it("handles missing epic", () => {
      const story = {
        key: "PROJ-127",
        title: "Orphan story",
        description: "Description",
        acceptanceCriteria: "Criteria",
        storyPoints: 5,
        epicKey: null,
        labels: ["tag"],
      };

      const prompt = buildScoreStoryPrompt(story);

      expect(prompt).toContain("Epic:** Not linked");
    });

    it("handles missing labels", () => {
      const story = {
        key: "PROJ-128",
        title: "Unlabeled story",
        description: "Description",
        acceptanceCriteria: "Criteria",
        storyPoints: 3,
        epicKey: "EPIC-2",
        labels: null,
      };

      const prompt = buildScoreStoryPrompt(story);

      expect(prompt).toContain("Labels:** None");
    });

    it("handles empty labels array", () => {
      const story = {
        key: "PROJ-129",
        title: "Empty labels story",
        description: "Description",
        acceptanceCriteria: "Criteria",
        storyPoints: 3,
        epicKey: "EPIC-2",
        labels: [],
      };

      const prompt = buildScoreStoryPrompt(story);

      expect(prompt).toContain("Labels:** None");
    });
  });

  describe("parseScoreResponse", () => {
    it("parses a complete XML response", () => {
      const xml = `
<analysis>
  <total_score>72</total_score>
  <dimensions>
    <completeness score="20" max="25">
      <reasoning>Description present but missing acceptance criteria</reasoning>
    </completeness>
    <clarity score="18" max="25">
      <reasoning>Clear title and description</reasoning>
    </clarity>
    <estimability score="15" max="20">
      <reasoning>Story points assigned</reasoning>
    </estimability>
    <traceability score="10" max="15">
      <reasoning>Linked to epic</reasoning>
    </traceability>
    <testability score="9" max="15">
      <reasoning>Some testable criteria</reasoning>
    </testability>
  </dimensions>
  <suggestions>
    <suggestion type="acceptance_criteria">
      <current>Missing</current>
      <improved>Given user is on login page, when they enter valid credentials, then they are redirected to dashboard</improved>
      <reasoning>Adding specific acceptance criteria improves testability</reasoning>
    </suggestion>
  </suggestions>
</analysis>`;

      const result = parseScoreResponse(xml);

      expect(result.totalScore).toBe(72);

      expect(result.dimensions.completeness.score).toBe(20);
      expect(result.dimensions.completeness.max).toBe(25);
      expect(result.dimensions.completeness.reasoning).toContain("acceptance criteria");

      expect(result.dimensions.clarity.score).toBe(18);
      expect(result.dimensions.estimability.score).toBe(15);
      expect(result.dimensions.traceability.score).toBe(10);
      expect(result.dimensions.testability.score).toBe(9);

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].type).toBe("acceptance_criteria");
      expect(result.suggestions[0].current).toBe("Missing");
      expect(result.suggestions[0].improved).toContain("Given user is on login page");
    });

    it("parses response with multiple suggestions", () => {
      const xml = `
<analysis>
  <total_score>45</total_score>
  <dimensions>
    <completeness score="10" max="25">
      <reasoning>Missing items</reasoning>
    </completeness>
    <clarity score="10" max="25">
      <reasoning>Vague</reasoning>
    </clarity>
    <estimability score="10" max="20">
      <reasoning>Not estimated</reasoning>
    </estimability>
    <traceability score="8" max="15">
      <reasoning>No epic</reasoning>
    </traceability>
    <testability score="7" max="15">
      <reasoning>Not testable</reasoning>
    </testability>
  </dimensions>
  <suggestions>
    <suggestion type="description">
      <current>Handle payments</current>
      <improved>As a customer, I want to pay with credit card so that I can complete my purchase</improved>
    </suggestion>
    <suggestion type="acceptance_criteria">
      <current>Missing</current>
      <improved>Given a valid card, when I click pay, then I see a confirmation</improved>
    </suggestion>
  </suggestions>
</analysis>`;

      const result = parseScoreResponse(xml);

      expect(result.totalScore).toBe(45);
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].type).toBe("description");
      expect(result.suggestions[1].type).toBe("acceptance_criteria");
    });

    it("handles response with no suggestions", () => {
      const xml = `
<analysis>
  <total_score>85</total_score>
  <dimensions>
    <completeness score="23" max="25">
      <reasoning>Complete</reasoning>
    </completeness>
    <clarity score="22" max="25">
      <reasoning>Clear</reasoning>
    </clarity>
    <estimability score="18" max="20">
      <reasoning>Well estimated</reasoning>
    </estimability>
    <traceability score="12" max="15">
      <reasoning>Good links</reasoning>
    </traceability>
    <testability score="10" max="15">
      <reasoning>Testable</reasoning>
    </testability>
  </dimensions>
  <suggestions>
  </suggestions>
</analysis>`;

      const result = parseScoreResponse(xml);

      expect(result.totalScore).toBe(85);
      expect(result.suggestions).toHaveLength(0);
    });

    it("handles malformed XML gracefully", () => {
      const xml = "This is not valid XML";

      const result = parseScoreResponse(xml);

      expect(result.totalScore).toBe(0);
      expect(result.dimensions.completeness.score).toBe(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it("handles partial XML - returns defaults when required dimensions missing", () => {
      // parseScoreResponseSafe requires completeness, clarity, and testability
      // Partial XML missing these returns parse failure, and legacy parseScoreResponse returns defaults
      const xml = `
<analysis>
  <total_score>50</total_score>
  <dimensions>
    <completeness score="15" max="25">
      <reasoning>Partial</reasoning>
    </completeness>
  </dimensions>
</analysis>`;

      const result = parseScoreResponse(xml);

      // Legacy function returns defaults on parse failure
      expect(result.totalScore).toBe(0);
      expect(result.dimensions.completeness.reasoning).toBe("Failed to parse AI response");
    });
  });
});
