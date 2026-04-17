import { describe, it, expect, beforeEach } from "vitest";
import { useQualityGateStore } from "@/stores/quality-gate-store";

describe("Quality Gate Store", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useQualityGateStore.setState({
      selectedSprintId: null,
      selectedStoryId: null,
      scoreFilter: "all",
      statusFilter: null,
      searchQuery: "",
      viewMode: "grid",
      isScoring: false,
      scoringProgress: 0,
    });
  });

  describe("Sprint Selection", () => {
    it("initializes with null sprint", () => {
      const state = useQualityGateStore.getState();
      expect(state.selectedSprintId).toBeNull();
    });

    it("sets selected sprint", () => {
      useQualityGateStore.getState().setSelectedSprintId("sprint-1");
      expect(useQualityGateStore.getState().selectedSprintId).toBe("sprint-1");
    });

    it("clears selected sprint", () => {
      useQualityGateStore.getState().setSelectedSprintId("sprint-1");
      useQualityGateStore.getState().setSelectedSprintId(null);
      expect(useQualityGateStore.getState().selectedSprintId).toBeNull();
    });
  });

  describe("Story Selection", () => {
    it("initializes with null story", () => {
      const state = useQualityGateStore.getState();
      expect(state.selectedStoryId).toBeNull();
    });

    it("sets selected story", () => {
      useQualityGateStore.getState().setSelectedStoryId("story-123");
      expect(useQualityGateStore.getState().selectedStoryId).toBe("story-123");
    });
  });

  describe("Score Filter", () => {
    it("initializes with 'all' filter", () => {
      expect(useQualityGateStore.getState().scoreFilter).toBe("all");
    });

    it("sets score filter to excellent", () => {
      useQualityGateStore.getState().setScoreFilter("excellent");
      expect(useQualityGateStore.getState().scoreFilter).toBe("excellent");
    });

    it("sets score filter to good", () => {
      useQualityGateStore.getState().setScoreFilter("good");
      expect(useQualityGateStore.getState().scoreFilter).toBe("good");
    });

    it("sets score filter to fair", () => {
      useQualityGateStore.getState().setScoreFilter("fair");
      expect(useQualityGateStore.getState().scoreFilter).toBe("fair");
    });

    it("sets score filter to poor", () => {
      useQualityGateStore.getState().setScoreFilter("poor");
      expect(useQualityGateStore.getState().scoreFilter).toBe("poor");
    });
  });

  describe("Status Filter", () => {
    it("initializes with null status filter", () => {
      expect(useQualityGateStore.getState().statusFilter).toBeNull();
    });

    it("sets status filter", () => {
      useQualityGateStore.getState().setStatusFilter("In Progress");
      expect(useQualityGateStore.getState().statusFilter).toBe("In Progress");
    });
  });

  describe("Search Query", () => {
    it("initializes with empty search query", () => {
      expect(useQualityGateStore.getState().searchQuery).toBe("");
    });

    it("sets search query", () => {
      useQualityGateStore.getState().setSearchQuery("authentication");
      expect(useQualityGateStore.getState().searchQuery).toBe("authentication");
    });
  });

  describe("View Mode", () => {
    it("initializes with grid view", () => {
      expect(useQualityGateStore.getState().viewMode).toBe("grid");
    });

    it("switches to list view", () => {
      useQualityGateStore.getState().setViewMode("list");
      expect(useQualityGateStore.getState().viewMode).toBe("list");
    });

    it("switches back to grid view", () => {
      useQualityGateStore.getState().setViewMode("list");
      useQualityGateStore.getState().setViewMode("grid");
      expect(useQualityGateStore.getState().viewMode).toBe("grid");
    });
  });

  describe("Scoring State", () => {
    it("initializes with scoring disabled", () => {
      expect(useQualityGateStore.getState().isScoring).toBe(false);
      expect(useQualityGateStore.getState().scoringProgress).toBe(0);
    });

    it("sets scoring state", () => {
      useQualityGateStore.getState().setIsScoring(true);
      expect(useQualityGateStore.getState().isScoring).toBe(true);
    });

    it("updates scoring progress", () => {
      useQualityGateStore.getState().setScoringProgress(50);
      expect(useQualityGateStore.getState().scoringProgress).toBe(50);
    });

    it("can track progress through scoring workflow", () => {
      const { setIsScoring, setScoringProgress } =
        useQualityGateStore.getState();

      // Start scoring
      setIsScoring(true);
      setScoringProgress(0);

      expect(useQualityGateStore.getState().isScoring).toBe(true);
      expect(useQualityGateStore.getState().scoringProgress).toBe(0);

      // Update progress
      setScoringProgress(25);
      expect(useQualityGateStore.getState().scoringProgress).toBe(25);

      setScoringProgress(75);
      expect(useQualityGateStore.getState().scoringProgress).toBe(75);

      // Complete scoring
      setScoringProgress(100);
      setIsScoring(false);

      expect(useQualityGateStore.getState().isScoring).toBe(false);
      expect(useQualityGateStore.getState().scoringProgress).toBe(100);
    });
  });

  describe("Reset Filters", () => {
    it("resets all filters to defaults", () => {
      // Set some filters
      useQualityGateStore.getState().setScoreFilter("poor");
      useQualityGateStore.getState().setStatusFilter("Done");
      useQualityGateStore.getState().setSearchQuery("test query");

      // Verify they're set
      expect(useQualityGateStore.getState().scoreFilter).toBe("poor");
      expect(useQualityGateStore.getState().statusFilter).toBe("Done");
      expect(useQualityGateStore.getState().searchQuery).toBe("test query");

      // Reset
      useQualityGateStore.getState().resetFilters();

      // Verify reset
      expect(useQualityGateStore.getState().scoreFilter).toBe("all");
      expect(useQualityGateStore.getState().statusFilter).toBeNull();
      expect(useQualityGateStore.getState().searchQuery).toBe("");
    });

    it("does not reset sprint or story selection", () => {
      useQualityGateStore.getState().setSelectedSprintId("sprint-1");
      useQualityGateStore.getState().setSelectedStoryId("story-1");
      useQualityGateStore.getState().setScoreFilter("excellent");

      useQualityGateStore.getState().resetFilters();

      // Sprint and story should remain
      expect(useQualityGateStore.getState().selectedSprintId).toBe("sprint-1");
      expect(useQualityGateStore.getState().selectedStoryId).toBe("story-1");
      // Filter should be reset
      expect(useQualityGateStore.getState().scoreFilter).toBe("all");
    });

    it("does not reset view mode", () => {
      useQualityGateStore.getState().setViewMode("list");
      useQualityGateStore.getState().resetFilters();
      expect(useQualityGateStore.getState().viewMode).toBe("list");
    });
  });
});
