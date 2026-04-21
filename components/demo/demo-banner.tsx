"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Info } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DemoBannerProps {
  className?: string;
}

export function DemoBanner({ className }: DemoBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "bg-iris text-white px-4 py-2",
            className
          )}
        >
          <div className="flex items-center justify-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Demo Mode</span>
            <span className="opacity-90">— Exploring with sample data.</span>
            <Link
              href="/signup"
              className="underline font-medium hover:opacity-80 transition-opacity ml-1"
            >
              Sign up
            </Link>
            <span className="opacity-90">to connect your JIRA workspace.</span>
            <button
              onClick={() => setDismissed(true)}
              className="ml-4 p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
