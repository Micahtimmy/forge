import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Sidebar
  sidebarExpanded: boolean;
  sidebarPinned: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleSidebarPin: () => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Current workspace
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;

  // JIRA sync status
  jiraSyncStatus: "idle" | "syncing" | "error";
  lastSyncedAt: string | null;
  setJiraSyncStatus: (status: "idle" | "syncing" | "error") => void;
  setLastSyncedAt: (timestamp: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar defaults
      sidebarExpanded: true,
      sidebarPinned: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
      toggleSidebarPin: () =>
        set((state) => ({ sidebarPinned: !state.sidebarPinned })),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      // Workspace
      currentWorkspaceId: null,
      setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),

      // JIRA sync
      jiraSyncStatus: "idle",
      lastSyncedAt: null,
      setJiraSyncStatus: (status) => set({ jiraSyncStatus: status }),
      setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
    }),
    {
      name: "forge-app-store",
      partialize: (state) => ({
        sidebarExpanded: state.sidebarExpanded,
        sidebarPinned: state.sidebarPinned,
        currentWorkspaceId: state.currentWorkspaceId,
      }),
    }
  )
);
