"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

interface AIIndicatorProps {
  variant?: "badge" | "dot" | "inline";
  className?: string;
  pulse?: boolean;
}

export function AIIndicator({
  variant = "badge",
  className,
  pulse = false,
}: AIIndicatorProps) {
  if (variant === "dot") {
    return (
      <Tooltip content="Powered by Gemini AI">
        <motion.div
          className={cn(
            "w-2 h-2 rounded-full bg-iris",
            pulse && "animate-pulse",
            className
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      </Tooltip>
    );
  }

  if (variant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs text-iris",
          className
        )}
      >
        <Sparkles className="w-3 h-3" />
        AI
      </span>
    );
  }

  return (
    <Tooltip content="Powered by Gemini AI">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
          "bg-iris-dim border border-iris/20 text-iris",
          "text-[10px] font-medium",
          className
        )}
      >
        <Sparkles className={cn("w-3 h-3", pulse && "animate-pulse")} />
        Gemini
      </motion.div>
    </Tooltip>
  );
}

interface AIProcessingProps {
  text?: string;
  className?: string;
}

export function AIProcessing({ text = "AI is analyzing...", className }: AIProcessingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-2 text-sm text-iris",
        className
      )}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="w-4 h-4" />
      </motion.div>
      <span>{text}</span>
    </motion.div>
  );
}

export function AIPoweredBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs text-text-tertiary",
        className
      )}
    >
      <Sparkles className="w-3 h-3 text-iris" />
      <span>Powered by Gemini AI</span>
    </div>
  );
}
