import { create } from "zustand";

interface QualityGateState {
  // Selected sprint
  selectedSprintId: string | null;
  setSelectedSprintId: (id: string | null) => void;

  // Selected story for detail view
  selectedStoryId: string | null;
  setSelectedStoryId: (id: string | null) => void;

  // Filters
  scoreFilter: "all" | "excellent" | "good" | "fair" | "poor";
  setScoreFilter: (filter: "all" | "excellent" | "good" | "fair" | "poor") => void;

  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // View options
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;

  // Scoring state
  isScoring: boolean;
  scoringProgress: number;
  setIsScoring: (isScoring: boolean) => void;
  setScoringProgress: (progress: number) => void;

  // Reset filters
  resetFilters: () => void;
}

export const useQualityGateStore = create<QualityGateState>((set) => ({
  // Sprint
  selectedSprintId: null,
  setSelectedSprintId: (id) => set({ selectedSprintId: id }),

  // Story
  selectedStoryId: null,
  setSelectedStoryId: (id) => set({ selectedStoryId: id }),

  // Filters
  scoreFilter: "all",
  setScoreFilter: (filter) => set({ scoreFilter: filter }),

  statusFilter: null,
  setStatusFilter: (status) => set({ statusFilter: status }),

  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  // View
  viewMode: "grid",
  setViewMode: (mode) => set({ viewMode: mode }),

  // Scoring
  isScoring: false,
  scoringProgress: 0,
  setIsScoring: (isScoring) => set({ isScoring }),
  setScoringProgress: (progress) => set({ scoringProgress: progress }),

  // Reset
  resetFilters: () =>
    set({
      scoreFilter: "all",
      statusFilter: null,
      searchQuery: "",
    }),
}));
