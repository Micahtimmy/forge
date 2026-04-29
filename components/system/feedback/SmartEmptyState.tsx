'use client';

/**
 * SmartEmptyState V2
 * Context-aware empty states with actionable guidance
 */

import { motion } from 'framer-motion';
import { scaleVariants, fadeVariants, TIMING } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

export type EmptyStateContext =
  | 'quality-gate'
  | 'signal'
  | 'horizon'
  | 'analytics'
  | 'stories'
  | 'sprints'
  | 'risks'
  | 'dependencies'
  | 'teams'
  | 'rubrics'
  | 'search'
  | 'generic';

interface EmptyStateConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  tips?: string[];
}

const EMPTY_STATE_CONFIGS: Record<EmptyStateContext, EmptyStateConfig> = {
  'quality-gate': {
    icon: <QualityGateIcon />,
    title: 'No stories to score yet',
    description: 'Connect JIRA and sync your sprint to start analyzing story quality.',
    action: {
      label: 'Connect JIRA',
      href: '/settings/jira',
    },
    secondaryAction: {
      label: 'Learn about Quality Gate',
      href: '/docs/quality-gate',
    },
    tips: [
      'Quality Gate analyzes your stories using AI',
      'Each story is scored on completeness, clarity, and testability',
      'Use suggestions to improve story quality before sprint planning',
    ],
  },

  signal: {
    icon: <SignalIcon />,
    title: 'No signal updates yet',
    description: 'Create your first stakeholder update using AI-generated content.',
    action: {
      label: 'Create Update',
      href: '/signal/new',
    },
    tips: [
      'Signal automatically pulls context from your sprint',
      'AI generates audience-appropriate messaging',
      'Customize tone and detail level for each recipient group',
    ],
  },

  horizon: {
    icon: <HorizonIcon />,
    title: 'No Program Increments',
    description: 'Create a PI to start planning features, dependencies, and risks.',
    action: {
      label: 'Create PI',
      href: '/horizon?action=create',
    },
    tips: [
      'Horizon provides a visual canvas for PI planning',
      'Map features across sprints and teams',
      'AI can detect cross-team dependency risks',
    ],
  },

  analytics: {
    icon: <AnalyticsIcon />,
    title: 'Not enough data yet',
    description: 'Complete at least one sprint to start seeing analytics.',
    action: {
      label: 'View Quality Gate',
      href: '/quality-gate',
    },
    tips: [
      'Analytics require historical sprint data',
      'Quality trends show improvement over time',
      'Velocity predictions become more accurate with more data',
    ],
  },

  stories: {
    icon: <StoriesIcon />,
    title: 'No stories found',
    description: 'Sync from JIRA or adjust your filters to see stories.',
    action: {
      label: 'Sync JIRA',
      href: '/settings/jira',
    },
    secondaryAction: {
      label: 'Clear Filters',
    },
  },

  sprints: {
    icon: <SprintsIcon />,
    title: 'No sprints found',
    description: 'Sync your JIRA project to import sprint data.',
    action: {
      label: 'Sync JIRA',
      href: '/settings/jira',
    },
  },

  risks: {
    icon: <RisksIcon />,
    title: 'No risks identified',
    description: 'Run AI risk analysis to identify potential issues.',
    action: {
      label: 'Analyze Risks',
    },
    tips: [
      'AI analyzes dependencies and capacity to identify risks',
      'Historical data improves risk prediction accuracy',
      'Review risks regularly during PI execution',
    ],
  },

  dependencies: {
    icon: <DependenciesIcon />,
    title: 'No dependencies mapped',
    description: 'Connect features to show cross-team dependencies.',
    action: {
      label: 'Add Dependency',
    },
    tips: [
      'Drag between features to create dependencies',
      'AI can detect potential dependencies automatically',
      'Color coding shows dependency health status',
    ],
  },

  teams: {
    icon: <TeamsIcon />,
    title: 'No teams configured',
    description: 'Add your Agile teams to enable capacity planning.',
    action: {
      label: 'Add Team',
    },
  },

  rubrics: {
    icon: <RubricsIcon />,
    title: 'No custom rubrics',
    description: 'Create a rubric to customize how stories are scored.',
    action: {
      label: 'Create Rubric',
      href: '/quality-gate/rubrics?action=create',
    },
    tips: [
      'Rubrics define your teams quality standards',
      'Customize dimension weights based on priorities',
      'Multiple rubrics can target different project types',
    ],
  },

  search: {
    icon: <SearchIcon />,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters.',
    secondaryAction: {
      label: 'Clear Search',
    },
  },

  generic: {
    icon: <GenericIcon />,
    title: 'Nothing here yet',
    description: 'This section is empty.',
  },
};

interface SmartEmptyStateProps {
  context: EmptyStateContext;
  customTitle?: string;
  customDescription?: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  showTips?: boolean;
  className?: string;
}

export function SmartEmptyState({
  context,
  customTitle,
  customDescription,
  onAction,
  onSecondaryAction,
  showTips = true,
  className,
}: SmartEmptyStateProps) {
  const config = EMPTY_STATE_CONFIGS[context];

  const title = customTitle || config.title;
  const description = customDescription || config.description;

  return (
    <motion.div
      variants={scaleVariants}
      initial="initial"
      animate="animate"
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* Icon */}
      <motion.div
        variants={fadeVariants}
        className="w-16 h-16 mb-6 rounded-2xl bg-surface-02 flex items-center justify-center text-text-tertiary"
      >
        {config.icon}
      </motion.div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-text-secondary max-w-md mb-6">
        {description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {config.action && (
          <motion.a
            href={config.action.href}
            onClick={onAction || config.action.onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm',
              'bg-iris text-white hover:bg-iris-light',
              'transition-colors duration-150'
            )}
          >
            {config.action.label}
          </motion.a>
        )}

        {config.secondaryAction && (
          <motion.button
            onClick={onSecondaryAction || config.secondaryAction.onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm',
              'bg-surface-02 text-text-secondary hover:text-text-primary',
              'hover:bg-surface-03 transition-colors duration-150'
            )}
          >
            {config.secondaryAction.label}
          </motion.button>
        )}
      </div>

      {/* Tips */}
      {showTips && config.tips && config.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...TIMING.default }}
          className="mt-8 p-4 rounded-lg bg-surface-01 border border-border-subtle max-w-md"
        >
          <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">
            Tips
          </h4>
          <ul className="space-y-2">
            {config.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-iris mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}

// Icons

function QualityGateIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function HorizonIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 3v18" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

function StoriesIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

function SprintsIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function RisksIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function DependenciesIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function TeamsIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function RubricsIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function GenericIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export { EMPTY_STATE_CONFIGS };
export type { EmptyStateConfig };
