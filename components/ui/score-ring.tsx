"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ScoreRingProps {
  score: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
  delay?: number;
}

const sizeConfig = {
  xs: { outer: 24, stroke: 3, fontSize: "9px" },
  sm: { outer: 32, stroke: 3, fontSize: "11px" },
  md: { outer: 48, stroke: 4, fontSize: "15px" },
  lg: { outer: 80, stroke: 5, fontSize: "24px" },
  xl: { outer: 120, stroke: 6, fontSize: "36px" },
};

function getScoreColor(score: number): string {
  if (score >= 85) return "var(--color-jade)";
  if (score >= 70) return "var(--color-iris)";
  if (score >= 50) return "var(--color-amber)";
  return "var(--color-coral)";
}

function getScoreGlow(score: number): string {
  if (score >= 85) return "var(--shadow-jade)";
  if (score >= 70) return "var(--shadow-iris)";
  if (score >= 50) return "none";
  return "var(--shadow-coral)";
}

export function ScoreRing({
  score,
  size = "md",
  showLabel = true,
  className,
  delay = 0,
}: ScoreRingProps) {
  const config = sizeConfig[size];
  const radius = (config.outer - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.outer / 2;

  const progress = useMotionValue(0);
  const strokeDashoffset = useTransform(
    progress,
    [0, 100],
    [circumference, 0]
  );
  const displayScore = useTransform(progress, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(progress, score, {
      type: "spring",
      stiffness: 80,
      damping: 20,
      delay: delay / 1000,
    });
    return controls.stop;
  }, [score, progress, delay]);

  const color = getScoreColor(score);
  const glow = getScoreGlow(score);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: config.outer, height: config.outer }}
    >
      <svg
        width={config.outer}
        height={config.outer}
        viewBox={`0 0 ${config.outer} ${config.outer}`}
        className="transform -rotate-90"
        style={{ filter: glow !== "none" ? `drop-shadow(${glow})` : undefined }}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={config.stroke}
        />
        {/* Progress ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
        />
      </svg>
      {showLabel && (
        <motion.span
          className="absolute font-mono font-semibold"
          style={{
            fontSize: config.fontSize,
            color,
          }}
        >
          {displayScore}
        </motion.span>
      )}
    </div>
  );
}

// Static version for SSR/lists
export function ScoreRingStatic({
  score,
  size = "md",
  showLabel = true,
  className,
}: Omit<ScoreRingProps, "delay">) {
  const config = sizeConfig[size];
  const radius = (config.outer - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.outer / 2;
  const offset = circumference - (score / 100) * circumference;

  const color = getScoreColor(score);
  const glow = getScoreGlow(score);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: config.outer, height: config.outer }}
    >
      <svg
        width={config.outer}
        height={config.outer}
        viewBox={`0 0 ${config.outer} ${config.outer}`}
        className="transform -rotate-90"
        style={{ filter: glow !== "none" ? `drop-shadow(${glow})` : undefined }}
        aria-label={`Score: ${score} out of 100`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={config.stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute font-mono font-semibold"
          style={{
            fontSize: config.fontSize,
            color,
          }}
        >
          {score}
        </span>
      )}
    </div>
  );
}
