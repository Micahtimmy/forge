/**
 * Framer Motion animation variants for FORGE
 * Based on DESIGN_SYSTEM.md motion specifications
 */

import { Variants } from "framer-motion";

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

// Slide up animation
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

// Slide down animation
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

// Scale in animation
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

// Stagger container for list animations
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

// Individual item in staggered list
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

// Spring expand animation
export const springExpand: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

// Sidebar animation
export const sidebarVariants: Variants = {
  collapsed: {
    width: 56,
    transition: { type: "spring", stiffness: 400, damping: 40 },
  },
  expanded: {
    width: 220,
    transition: { type: "spring", stiffness: 400, damping: 40 },
  },
};

// Modal/overlay animation
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

// Modal content animation
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

// Toast animation
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 20, x: 0 },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// Page transition animation
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

// Score ring spring config
export const scoreRingSpring = {
  type: "spring" as const,
  stiffness: 80,
  damping: 20,
};

// Pulse animation for sync indicator
export const pulseVariants: Variants = {
  idle: {
    scale: 1,
    opacity: 1,
  },
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
