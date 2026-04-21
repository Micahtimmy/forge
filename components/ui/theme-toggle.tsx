"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "icon" | "button" | "menu";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useAppStore();

  if (variant === "icon") {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className={cn(
          "relative p-2 rounded-md transition-colors",
          "text-text-secondary hover:text-text-primary",
          "hover:bg-surface-03",
          className
        )}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <motion.div
          initial={false}
          animate={{ rotate: theme === "dark" ? 0 : 180 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {theme === "dark" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </motion.div>
      </motion.button>
    );
  }

  if (variant === "button") {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={toggleTheme}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
          "text-text-secondary hover:text-text-primary",
          "bg-surface-02 hover:bg-surface-03 border border-border",
          className
        )}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? (
          <>
            <Moon className="w-4 h-4" />
            <span className="text-sm">Dark</span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4" />
            <span className="text-sm">Light</span>
          </>
        )}
      </motion.button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs text-text-tertiary mb-1">Theme</span>
      <div className="flex items-center gap-1 p-1 bg-surface-02 rounded-lg border border-border">
        {(["light", "dark", "system"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all",
              theme === t
                ? "bg-surface-04 text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            {t === "light" && <Sun className="w-3.5 h-3.5" />}
            {t === "dark" && <Moon className="w-3.5 h-3.5" />}
            {t === "system" && <Monitor className="w-3.5 h-3.5" />}
            <span className="capitalize">{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
