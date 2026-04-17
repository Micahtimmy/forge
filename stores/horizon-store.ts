import { create } from "zustand";
import type { PIDependency, PIRisk } from "@/types/pi";

interface HorizonState {
  // Selected PI
  selectedPIId: string | null;
  setSelectedPIId: (id: string | null) => void;

  // Canvas state
  canvasZoom: number;
  setCanvasZoom: (zoom: number) => void;

  // Selected items
  selectedFeatureId: string | null;
  setSelectedFeatureId: (id: string | null) => void;

  selectedDependencyId: string | null;
  setSelectedDependencyId: (id: string | null) => void;

  // View mode
  viewMode: "canvas" | "capacity" | "dependencies" | "risks";
  setViewMode: (mode: "canvas" | "capacity" | "dependencies" | "risks") => void;

  // Dependency creation mode
  isDependencyMode: boolean;
  setIsDependencyMode: (isOn: boolean) => void;
  pendingDependencyFrom: string | null;
  setPendingDependencyFrom: (id: string | null) => void;

  // Risk panel
  isRiskPanelOpen: boolean;
  setIsRiskPanelOpen: (isOpen: boolean) => void;
  selectedRiskId: string | null;
  setSelectedRiskId: (id: string | null) => void;

  // Reset
  resetHorizonState: () => void;
}

export const useHorizonStore = create<HorizonState>((set) => ({
  // Selected PI
  selectedPIId: null,
  setSelectedPIId: (id) => set({ selectedPIId: id }),

  // Canvas
  canvasZoom: 1,
  setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),

  // Selected items
  selectedFeatureId: null,
  setSelectedFeatureId: (id) => set({ selectedFeatureId: id }),

  selectedDependencyId: null,
  setSelectedDependencyId: (id) => set({ selectedDependencyId: id }),

  // View mode
  viewMode: "canvas",
  setViewMode: (mode) => set({ viewMode: mode }),

  // Dependency mode
  isDependencyMode: false,
  setIsDependencyMode: (isOn) => set({ isDependencyMode: isOn }),
  pendingDependencyFrom: null,
  setPendingDependencyFrom: (id) => set({ pendingDependencyFrom: id }),

  // Risk panel
  isRiskPanelOpen: false,
  setIsRiskPanelOpen: (isOpen) => set({ isRiskPanelOpen: isOpen }),
  selectedRiskId: null,
  setSelectedRiskId: (id) => set({ selectedRiskId: id }),

  // Reset
  resetHorizonState: () =>
    set({
      selectedPIId: null,
      canvasZoom: 1,
      selectedFeatureId: null,
      selectedDependencyId: null,
      viewMode: "canvas",
      isDependencyMode: false,
      pendingDependencyFrom: null,
      isRiskPanelOpen: false,
      selectedRiskId: null,
    }),
}));
