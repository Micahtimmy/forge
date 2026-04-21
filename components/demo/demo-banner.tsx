"use client";

import { motion } from "framer-motion";
import { Info, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DemoBannerProps {
  className?: string;
}

export function DemoBanner({ className }: DemoBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-amber-dim border-b border-amber-border px-4 py-2",
        className
      )}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 text-amber" />
          <span className="text-amber font-medium">Demo Mode</span>
          <span className="text-text-secondary">
            Exploring with sample data. Changes will not be saved.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-surface-03 text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-dim text-amber rounded-full">
      <Info className="w-3 h-3" />
      Demo
    </span>
  );
}
