import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light" | "system";

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

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

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

      // Theme
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),

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
        theme: state.theme,
        currentWorkspaceId: state.currentWorkspaceId,
      }),
    }
  )
);
