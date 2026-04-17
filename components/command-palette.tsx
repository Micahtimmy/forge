"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  ShieldCheck,
  Send,
  Map,
  Settings2,
  FileText,
  Plus,
  RefreshCw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { overlayVariants, modalVariants } from "@/lib/motion/variants";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  group: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [search, setSearch] = useState("");

  // Reset search when closing
  useEffect(() => {
    if (!commandPaletteOpen) {
      setSearch("");
    }
  }, [commandPaletteOpen]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-dashboard",
        label: "Go to Dashboard",
        icon: <LayoutDashboard className="w-4 h-4" />,
        shortcut: "G D",
        onSelect: () => {
          router.push("/");
          setCommandPaletteOpen(false);
        },
        group: "Navigate",
      },
      {
        id: "nav-quality-gate",
        label: "Go to Quality Gate",
        icon: <ShieldCheck className="w-4 h-4" />,
        shortcut: "G Q",
        onSelect: () => {
          router.push("/quality-gate");
          setCommandPaletteOpen(false);
        },
        group: "Navigate",
      },
      {
        id: "nav-signal",
        label: "Go to Signal",
        icon: <Send className="w-4 h-4" />,
        shortcut: "G S",
        onSelect: () => {
          router.push("/signal");
          setCommandPaletteOpen(false);
        },
        group: "Navigate",
      },
      {
        id: "nav-horizon",
        label: "Go to Horizon",
        icon: <Map className="w-4 h-4" />,
        shortcut: "G H",
        onSelect: () => {
          router.push("/horizon");
          setCommandPaletteOpen(false);
        },
        group: "Navigate",
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        icon: <Settings2 className="w-4 h-4" />,
        shortcut: "G ,",
        onSelect: () => {
          router.push("/settings");
          setCommandPaletteOpen(false);
        },
        group: "Navigate",
      },

      // Actions
      {
        id: "action-new-update",
        label: "Create New Update",
        icon: <Plus className="w-4 h-4" />,
        shortcut: "N",
        onSelect: () => {
          router.push("/signal/new");
          setCommandPaletteOpen(false);
        },
        group: "Actions",
      },
      {
        id: "action-sync-jira",
        label: "Sync JIRA",
        icon: <RefreshCw className="w-4 h-4" />,
        onSelect: () => {
          // Trigger JIRA sync
          setCommandPaletteOpen(false);
        },
        group: "Actions",
      },
      {
        id: "action-score-sprint",
        label: "Score Current Sprint",
        icon: <Zap className="w-4 h-4" />,
        onSelect: () => {
          router.push("/quality-gate");
          setCommandPaletteOpen(false);
        },
        group: "Actions",
      },
    ],
    [router, setCommandPaletteOpen]
  );

  // Group commands
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    commands.forEach((cmd) => {
      if (!groups[cmd.group]) {
        groups[cmd.group] = [];
      }
      groups[cmd.group].push(cmd);
    });
    return groups;
  }, [commands]);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Command Palette */}
          <motion.div
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-[560px] -translate-x-1/2"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Command
              className={cn(
                "bg-surface-02 border border-border-strong rounded-xl shadow-modal overflow-hidden"
              )}
              loop
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 border-b border-border">
                <Search className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search stories, actions, navigate..."
                  className={cn(
                    "flex-1 h-12 bg-transparent text-[15px] text-text-primary",
                    "placeholder:text-text-tertiary outline-none"
                  )}
                  autoFocus
                />
                <kbd className="text-xs bg-surface-03 text-text-tertiary px-1.5 py-0.5 rounded font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-[320px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-text-tertiary">
                  No results found.
                </Command.Empty>

                {Object.entries(groupedCommands).map(([group, items]) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="mb-2"
                  >
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
                      {group}
                    </div>
                    {items.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.label}
                        onSelect={item.onSelect}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer",
                          "text-text-primary text-sm",
                          "data-[selected=true]:bg-surface-03",
                          "aria-selected:bg-iris-dim aria-selected:border-l-2 aria-selected:border-iris"
                        )}
                      >
                        <span className="text-text-secondary">{item.icon}</span>
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="text-xs bg-surface-03 text-text-tertiary px-1.5 py-0.5 rounded font-mono">
                            {item.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
