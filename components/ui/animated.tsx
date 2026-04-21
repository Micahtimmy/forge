"use client";

import { useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInFromRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const slideInFromLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedList({ children, className, delay = 0 }: AnimatedListProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      transition={{ delayChildren: delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <motion.div
      variants={staggerItem}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function AnimatedCard({
  children,
  className,
  onClick,
  interactive = true,
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -2, transition: { duration: 0.15 } } : undefined}
      whileTap={interactive && onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "bg-surface-01 border border-border rounded-lg transition-colors",
        interactive && "hover:border-border-strong hover:bg-surface-02",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function AnimatedButton({
  children,
  className,
  onClick,
  disabled,
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
}

interface AnimatedPresenceWrapperProps {
  children: React.ReactNode;
  show: boolean;
  className?: string;
}

export function AnimatedPresenceWrapper({
  children,
  show,
  className,
}: AnimatedPresenceWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeIn}
          transition={{ duration: 0.15 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  formatFn?: (n: number) => string;
}

export function AnimatedNumber({
  value,
  className,
  duration = 0.5,
  formatFn = (n) => Math.round(n).toString(),
}: AnimatedNumberProps) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {formatFn(value)}
      </motion.span>
    </motion.span>
  );
}

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  size = "md",
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const heights = { sm: "h-1", md: "h-2", lg: "h-3" };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={cn("bg-surface-03 rounded-full overflow-hidden", heights[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full bg-iris", barClassName)}
        />
      </div>
    </div>
  );
}

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 1,
  className,
  suffix = "",
  prefix = "",
}: AnimatedCounterProps) {
  return (
    <motion.span className={className}>
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Counter from={from} to={to} duration={duration} />
      </motion.span>
      {suffix}
    </motion.span>
  );
}

function Counter({ from, to, duration }: { from: number; to: number; duration: number }) {
  const nodeRef = useRef<HTMLSpanElement | null>(null);

  return (
    <motion.span
      ref={nodeRef}
      initial={{ "--num": from } as Record<string, number>}
      animate={{ "--num": to } as Record<string, number>}
      transition={{ duration, ease: "easeOut" }}
      style={{ counterSet: `num var(--num)` }}
      onUpdate={(latest) => {
        if (nodeRef.current) {
          nodeRef.current.textContent = Math.round(latest["--num"] as number).toString();
        }
      }}
    >
      {from}
    </motion.span>
  );
}

interface PulseAnimationProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

export function PulseAnimation({ children, className, active = true }: PulseAnimationProps) {
  if (!active) return <div className={className}>{children}</div>;

  return (
    <motion.div
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Shimmer({ className, width, height }: ShimmerProps) {
  return (
    <motion.div
      animate={{
        backgroundPosition: ["200% 0", "-200% 0"],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      }}
      className={cn("skeleton rounded", className)}
      style={{ width, height }}
    />
  );
}

interface SuccessCheckmarkProps {
  size?: number;
  className?: string;
}

export function SuccessCheckmark({ size = 24, className }: SuccessCheckmarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
    </motion.svg>
  );
}
