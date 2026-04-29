/**
 * FORGE Motion System
 * Enterprise-grade animation variants for Decision Intelligence UI
 */

import type { Variants, Transition } from 'framer-motion';

// =============================================================================
// BASE TIMING CURVES
// =============================================================================

export const TIMING = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  default: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  slow: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  spring: { type: 'spring', stiffness: 400, damping: 25 },
  springBouncy: { type: 'spring', stiffness: 300, damping: 20 },
  springGentle: { type: 'spring', stiffness: 200, damping: 30 },
} as const;

// Transition presets for direct use
export const transitions = {
  fast: TIMING.fast as Transition,
  default: TIMING.default as Transition,
  slow: TIMING.slow as Transition,
  spring: TIMING.spring as Transition,
  springBouncy: TIMING.springBouncy as Transition,
  springGentle: TIMING.springGentle as Transition,
};

// =============================================================================
// BASIC VARIANTS (backwards compatible)
// =============================================================================

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

// Slide up animation
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// Slide down animation
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// Scale in animation
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.18, ease: 'easeOut' },
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
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// Spring expand animation
export const springExpand: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

// Sidebar animation
export const sidebarVariants: Variants = {
  collapsed: {
    width: 56,
    transition: { type: 'spring', stiffness: 400, damping: 40 },
  },
  expanded: {
    width: 220,
    transition: { type: 'spring', stiffness: 400, damping: 40 },
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
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

// Toast animation
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 20, x: 0 },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// Page transition animation
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

// Score ring spring config
export const scoreRingSpring = {
  type: 'spring' as const,
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
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// V2 ENTERPRISE VARIANTS
// =============================================================================

// Page transition variants (enhanced)
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.15,
    },
  },
};

// Fade variants (simple opacity)
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide variants
export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const slideDownVariants: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const slideLeftVariants: Variants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
};

export const slideRightVariants: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
};

// Scale variants
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

// List/stagger variants (enhanced)
export const listContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: TIMING.default,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: TIMING.fast,
  },
};

// Card hover variants
export const cardVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: TIMING.default,
  },
  hover: {
    y: -2,
    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.3)',
    transition: TIMING.fast,
  },
  tap: {
    scale: 0.98,
    transition: TIMING.fast,
  },
};

// Intelligence card (AI-powered components)
export const intelligenceCardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...TIMING.springGentle,
      opacity: { duration: 0.2 },
    },
  },
  hover: {
    y: -4,
    boxShadow: '0 0 24px rgba(99, 102, 241, 0.15)',
    transition: TIMING.fast,
  },
  loading: {
    opacity: 0.7,
    transition: {
      duration: 0.8,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

// Score ring animation (enhanced)
export const scoreRingVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: (score: number) => ({
    pathLength: score / 100,
    opacity: 1,
    transition: {
      pathLength: {
        type: 'spring',
        stiffness: 50,
        damping: 20,
        delay: 0.2,
      },
      opacity: { duration: 0.2 },
    },
  }),
};

export const scoreNumberVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.3,
      ...TIMING.spring,
    },
  },
};

// Panel slide variants
export const panelSlideVariants: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: TIMING.springGentle,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

export const panelSlideLeftVariants: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: TIMING.springGentle },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.2 } },
};

// Modal variants (enhanced)
export const modalOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15, delay: 0.05 } },
};

export const modalContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: TIMING.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: 0.15 },
  },
};

// Dropdown/popover variants
export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -4,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: TIMING.fast,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: { duration: 0.1 },
  },
};

// Tooltip variants
export const tooltipVariants: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15 } },
  exit: { opacity: 0, scale: 0.95, y: 2, transition: { duration: 0.1 } },
};

// Toast/notification variants (enhanced)
export const notificationVariants: Variants = {
  initial: { opacity: 0, y: -16, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: TIMING.spring,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

// Risk indicator variants
export const riskIndicatorVariants: Variants = {
  low: {
    scale: 1,
    backgroundColor: 'var(--color-jade)',
  },
  medium: {
    scale: 1.05,
    backgroundColor: 'var(--color-amber)',
    transition: {
      scale: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: 'reverse',
      },
    },
  },
  high: {
    scale: [1, 1.1, 1],
    backgroundColor: 'var(--color-coral)',
    transition: {
      scale: {
        duration: 0.8,
        repeat: Infinity,
      },
    },
  },
  critical: {
    scale: [1, 1.15, 1],
    backgroundColor: 'var(--color-coral-dark)',
    boxShadow: [
      '0 0 0 0 rgba(239, 68, 68, 0.4)',
      '0 0 0 8px rgba(239, 68, 68, 0)',
    ],
    transition: {
      duration: 0.6,
      repeat: Infinity,
    },
  },
};

// Progress bar variants
export const progressBarVariants: Variants = {
  initial: { scaleX: 0, originX: 0 },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  }),
};

// Skeleton loading variants
export const skeletonVariants: Variants = {
  initial: { opacity: 0.4 },
  animate: {
    opacity: [0.4, 0.7, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Tab indicator variants
export const tabIndicatorVariants: Variants = {
  initial: { opacity: 0, scaleX: 0 },
  animate: {
    opacity: 1,
    scaleX: 1,
    transition: TIMING.spring,
  },
};

// Accordion/collapse variants
export const collapseVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: TIMING.springGentle,
      opacity: { duration: 0.2, delay: 0.05 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.1 },
    },
  },
};

// Command palette variants
export const commandPaletteVariants: Variants = {
  initial: { opacity: 0, scale: 0.98, y: -8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: TIMING.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -4,
    transition: { duration: 0.1 },
  },
};

// Canvas node variants (for React Flow)
export const canvasNodeVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: TIMING.spring,
  },
  selected: {
    boxShadow: '0 0 0 2px var(--color-iris)',
    transition: TIMING.fast,
  },
  dragging: {
    scale: 1.02,
    boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.4)',
    transition: TIMING.fast,
  },
};

// Dependency edge variants
export const edgeVariants: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: 'easeOut' },
      opacity: { duration: 0.2 },
    },
  },
  atRisk: {
    stroke: 'var(--color-amber)',
    strokeDasharray: '8 4',
    transition: { duration: 0.3 },
  },
  blocked: {
    stroke: 'var(--color-coral)',
    strokeDasharray: '4 4',
    transition: { duration: 0.3 },
  },
};

// Sprint health indicator
export const sprintHealthVariants: Variants = {
  healthy: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'var(--color-jade)',
  },
  atRisk: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'var(--color-amber)',
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
  critical: {
    backgroundColor: [
      'rgba(239, 68, 68, 0.15)',
      'rgba(239, 68, 68, 0.25)',
    ],
    borderColor: 'var(--color-coral)',
    transition: {
      duration: 0.8,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

// Button variants
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
  disabled: { opacity: 0.5, scale: 1 },
};

// AI processing indicator
export const aiProcessingVariants: Variants = {
  initial: { opacity: 0 },
  processing: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const aiDotVariants: Variants = {
  initial: { y: 0, opacity: 0.3 },
  processing: {
    y: [-4, 0, -4],
    opacity: [0.3, 1, 0.3],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Helper: create stagger container with custom timing
export function createStaggerVariants(
  staggerChildren = 0.04,
  delayChildren = 0.02
): Variants {
  return {
    initial: {},
    animate: {
      transition: { staggerChildren, delayChildren },
    },
    exit: {
      transition: { staggerChildren: staggerChildren / 2, staggerDirection: -1 },
    },
  };
}

// Helper: create slide variants with custom offset
export function createSlideVariants(
  direction: 'up' | 'down' | 'left' | 'right',
  offset = 16
): Variants {
  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const sign = direction === 'down' || direction === 'right' ? -1 : 1;

  return {
    initial: { opacity: 0, [axis]: offset * sign },
    animate: { opacity: 1, [axis]: 0 },
    exit: { opacity: 0, [axis]: (offset / 2) * -sign },
  };
}

export type ForgeVariants = typeof pageVariants;
