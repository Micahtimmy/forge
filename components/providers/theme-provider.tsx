"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/app-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (newTheme: "dark" | "light") => {
      if (!isInitialMount.current) {
        root.classList.add("theme-transition");
        setTimeout(() => {
          root.classList.remove("theme-transition");
        }, 200);
      }
      root.setAttribute("data-theme", newTheme);
    };

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      applyTheme(systemTheme);

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(theme);
    }

    isInitialMount.current = false;
  }, [theme]);

  return <>{children}</>;
}
