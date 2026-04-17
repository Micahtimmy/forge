"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/app-store";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  group: string;
  onSelect: () => void;
  keywords?: string[];
}

export function useCommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();

  const open = useCallback(() => setCommandPaletteOpen(true), [setCommandPaletteOpen]);
  const close = useCallback(() => setCommandPaletteOpen(false), [setCommandPaletteOpen]);
  const toggle = useCallback(
    () => setCommandPaletteOpen(!commandPaletteOpen),
    [commandPaletteOpen, setCommandPaletteOpen]
  );

  // Define navigation commands
  const navigationCommands: CommandItem[] = useMemo(
    () => [
      {
        id: "nav-dashboard",
        label: "Go to Dashboard",
        description: "View program overview",
        group: "Navigation",
        onSelect: () => {
          router.push("/");
          close();
        },
        keywords: ["home", "overview"],
      },
      {
        id: "nav-quality-gate",
        label: "Go to Quality Gate",
        description: "View story quality scores",
        group: "Navigation",
        onSelect: () => {
          router.push("/quality-gate");
          close();
        },
        keywords: ["stories", "scoring", "backlog"],
      },
      {
        id: "nav-signal",
        label: "Go to Signal",
        description: "View stakeholder updates",
        group: "Navigation",
        onSelect: () => {
          router.push("/signal");
          close();
        },
        keywords: ["updates", "communication", "stakeholders"],
      },
      {
        id: "nav-horizon",
        label: "Go to Horizon",
        description: "View PI planning",
        group: "Navigation",
        onSelect: () => {
          router.push("/horizon");
          close();
        },
        keywords: ["planning", "pi", "increment", "safe"],
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        description: "Manage workspace settings",
        group: "Navigation",
        onSelect: () => {
          router.push("/settings");
          close();
        },
        keywords: ["config", "preferences"],
      },
      {
        id: "nav-jira-settings",
        label: "JIRA Settings",
        description: "Manage JIRA connection",
        group: "Navigation",
        onSelect: () => {
          router.push("/settings/jira");
          close();
        },
        keywords: ["atlassian", "sync", "integration"],
      },
    ],
    [router, close]
  );

  // Define action commands
  const actionCommands: CommandItem[] = useMemo(
    () => [
      {
        id: "action-new-update",
        label: "Create Update",
        description: "Draft a new stakeholder update",
        group: "Actions",
        shortcut: ["n", "u"],
        onSelect: () => {
          router.push("/signal/new");
          close();
        },
        keywords: ["draft", "communication"],
      },
      {
        id: "action-score-sprint",
        label: "Score Sprint",
        description: "Run AI scoring on current sprint",
        group: "Actions",
        shortcut: ["s", "s"],
        onSelect: () => {
          // This would trigger the scoring action
          router.push("/quality-gate");
          close();
        },
        keywords: ["analyze", "ai", "quality"],
      },
      {
        id: "action-sync-jira",
        label: "Sync JIRA",
        description: "Pull latest stories from JIRA",
        group: "Actions",
        shortcut: ["j", "s"],
        onSelect: () => {
          // This would trigger the sync action
          router.push("/settings/jira");
          close();
        },
        keywords: ["refresh", "pull", "import"],
      },
      {
        id: "action-new-pi",
        label: "Create PI",
        description: "Start a new Program Increment",
        group: "Actions",
        onSelect: () => {
          router.push("/horizon");
          close();
        },
        keywords: ["planning", "increment"],
      },
    ],
    [router, close]
  );

  const allCommands = useMemo(
    () => [...navigationCommands, ...actionCommands],
    [navigationCommands, actionCommands]
  );

  // Filter commands by search query
  const filterCommands = useCallback(
    (query: string) => {
      if (!query) return allCommands;

      const lowerQuery = query.toLowerCase();
      return allCommands.filter((cmd) => {
        const searchText = [
          cmd.label,
          cmd.description,
          ...(cmd.keywords || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchText.includes(lowerQuery);
      });
    },
    [allCommands]
  );

  // Group commands by their group property
  const groupCommands = useCallback((commands: CommandItem[]) => {
    const groups: Record<string, CommandItem[]> = {};
    for (const cmd of commands) {
      if (!groups[cmd.group]) {
        groups[cmd.group] = [];
      }
      groups[cmd.group].push(cmd);
    }
    return groups;
  }, []);

  return {
    isOpen: commandPaletteOpen,
    open,
    close,
    toggle,
    allCommands,
    navigationCommands,
    actionCommands,
    filterCommands,
    groupCommands,
  };
}
