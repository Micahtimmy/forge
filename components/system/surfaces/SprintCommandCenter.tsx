'use client';

/**
 * SprintCommandCenter V2
 * Unified command surface for sprint operations
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  pageVariants,
  listContainerVariants,
  listItemVariants,
  sprintHealthVariants,
  cardVariants,
  TIMING,
} from '@/lib/motion/variants';
import { FORGE_TOKENS, getScoreColor } from '@/lib/design-system/tokens';
import { cn } from '@/lib/utils';

interface SprintMetrics {
  totalStories: number;
  completedStories: number;
  inProgressStories: number;
  blockedStories: number;
  totalPoints: number;
  completedPoints: number;
  averageScore: number;
  atRiskCount: number;
  daysRemaining: number;
  velocity: number;
  predictedCompletion: number;
}

interface SprintAlert {
  id: string;
  type: 'risk' | 'warning' | 'info';
  title: string;
  description: string;
  storyKeys?: string[];
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface SprintCommandCenterProps {
  sprintId: number;
  sprintName: string;
  metrics: SprintMetrics;
  alerts: SprintAlert[];
  healthStatus: 'healthy' | 'atRisk' | 'critical';
  onScoreAll?: () => void;
  onSyncJira?: () => void;
  onViewBurndown?: () => void;
  onViewStories?: () => void;
  isScoring?: boolean;
  isSyncing?: boolean;
  className?: string;
}

export function SprintCommandCenter({
  sprintId,
  sprintName,
  metrics,
  alerts,
  healthStatus,
  onScoreAll,
  onSyncJira,
  onViewBurndown,
  onViewStories,
  isScoring = false,
  isSyncing = false,
  className,
}: SprintCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'actions'>('overview');

  const completionPercentage = useMemo(() => {
    return metrics.totalPoints > 0
      ? Math.round((metrics.completedPoints / metrics.totalPoints) * 100)
      : 0;
  }, [metrics]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className={cn(
        'rounded-xl border bg-surface-01 overflow-hidden',
        className
      )}
    >
      {/* Header with health indicator */}
      <motion.div
        variants={sprintHealthVariants}
        animate={healthStatus}
        className="relative px-6 py-4 border-b border-border-subtle"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{sprintName}</h2>
            <p className="text-sm text-text-secondary">
              {metrics.daysRemaining} days remaining
            </p>
          </div>
          <HealthBadge status={healthStatus} />
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-tertiary">Progress</span>
            <span className="text-xs font-mono text-text-secondary">
              {metrics.completedPoints}/{metrics.totalPoints} pts ({completionPercentage}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-03 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: getScoreColor(completionPercentage) }}
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Tab navigation */}
      <div className="flex border-b border-border-subtle">
        {(['overview', 'alerts', 'actions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'text-iris border-b-2 border-iris bg-iris/5'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-02'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'alerts' && alerts.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-coral/20 text-coral">
                {alerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              variants={listContainerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <MetricCard
                label="Stories"
                value={`${metrics.completedStories}/${metrics.totalStories}`}
                sublabel={`${metrics.inProgressStories} in progress`}
              />
              <MetricCard
                label="Avg. Score"
                value={metrics.averageScore}
                color={getScoreColor(metrics.averageScore)}
                sublabel="quality"
              />
              <MetricCard
                label="At Risk"
                value={metrics.atRiskCount}
                color={metrics.atRiskCount > 0 ? FORGE_TOKENS.colors.risk.high : FORGE_TOKENS.colors.risk.low}
                sublabel="stories"
              />
              <MetricCard
                label="Velocity"
                value={metrics.velocity}
                sublabel="pts/sprint"
              />
              <MetricCard
                label="Blocked"
                value={metrics.blockedStories}
                color={metrics.blockedStories > 0 ? FORGE_TOKENS.colors.risk.critical : undefined}
                sublabel="stories"
              />
              <MetricCard
                label="Predicted"
                value={`${metrics.predictedCompletion}%`}
                color={getScoreColor(metrics.predictedCompletion)}
                sublabel="completion"
              />
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              variants={listContainerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-3"
            >
              {alerts.length === 0 ? (
                <EmptyState message="No active alerts" />
              ) : (
                alerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'actions' && (
            <motion.div
              key="actions"
              variants={listContainerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <ActionButton
                icon={<ScoreIcon />}
                label="Score All Stories"
                description="Run AI quality analysis"
                onClick={onScoreAll}
                loading={isScoring}
                variant="primary"
              />
              <ActionButton
                icon={<SyncIcon />}
                label="Sync with JIRA"
                description="Pull latest updates"
                onClick={onSyncJira}
                loading={isSyncing}
              />
              <ActionButton
                icon={<ChartIcon />}
                label="View Burndown"
                description="Sprint progress chart"
                onClick={onViewBurndown}
              />
              <ActionButton
                icon={<ListIcon />}
                label="View Stories"
                description="Full story list"
                onClick={onViewStories}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Sub-components

function HealthBadge({ status }: { status: 'healthy' | 'atRisk' | 'critical' }) {
  const configs = {
    healthy: {
      label: 'On Track',
      bg: 'bg-jade/10',
      text: 'text-jade',
      border: 'border-jade/20',
    },
    atRisk: {
      label: 'At Risk',
      bg: 'bg-amber/10',
      text: 'text-amber',
      border: 'border-amber/20',
    },
    critical: {
      label: 'Critical',
      bg: 'bg-coral/10',
      text: 'text-coral',
      border: 'border-coral/20',
    },
  };

  const config = configs[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'px-3 py-1.5 rounded-full border text-sm font-medium',
        config.bg,
        config.text,
        config.border
      )}
    >
      {config.label}
    </motion.div>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
}) {
  return (
    <motion.div
      variants={listItemVariants}
      className="p-4 rounded-lg bg-surface-02 border border-border-subtle"
    >
      <p className="text-xs text-text-tertiary uppercase tracking-wide">{label}</p>
      <p
        className="mt-1 text-2xl font-semibold font-mono"
        style={{ color: color || FORGE_TOKENS.colors.text.primary }}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-text-tertiary mt-0.5">{sublabel}</p>
      )}
    </motion.div>
  );
}

function AlertCard({ alert }: { alert: SprintAlert }) {
  const configs = {
    risk: {
      bg: 'bg-coral/5',
      border: 'border-coral/20',
      icon: <AlertCircleIcon className="text-coral" />,
    },
    warning: {
      bg: 'bg-amber/5',
      border: 'border-amber/20',
      icon: <AlertTriangleIcon className="text-amber" />,
    },
    info: {
      bg: 'bg-iris/5',
      border: 'border-iris/20',
      icon: <InfoIcon className="text-iris" />,
    },
  };

  const config = configs[alert.type];

  return (
    <motion.div
      variants={listItemVariants}
      className={cn('p-4 rounded-lg border', config.bg, config.border)}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{alert.title}</p>
          <p className="mt-1 text-sm text-text-secondary">{alert.description}</p>
          {alert.storyKeys && alert.storyKeys.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {alert.storyKeys.map((key) => (
                <span
                  key={key}
                  className="px-1.5 py-0.5 rounded text-xs font-mono bg-surface-03 text-text-secondary"
                >
                  {key}
                </span>
              ))}
            </div>
          )}
          {alert.action && (
            <button
              onClick={alert.action.onClick}
              className="mt-2 text-sm font-medium text-iris hover:text-iris-light transition-colors"
            >
              {alert.action.label}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({
  icon,
  label,
  description,
  onClick,
  loading = false,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick?: () => void;
  loading?: boolean;
  variant?: 'default' | 'primary';
}) {
  return (
    <motion.button
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border text-left transition-colors',
        variant === 'primary'
          ? 'bg-iris/10 border-iris/20 hover:bg-iris/15'
          : 'bg-surface-02 border-border-subtle hover:bg-surface-03',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 p-2 rounded-lg',
          variant === 'primary' ? 'bg-iris/20' : 'bg-surface-03'
        )}
      >
        {loading ? <LoadingSpinner /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
    </motion.button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      variants={listItemVariants}
      className="py-12 text-center"
    >
      <p className="text-text-tertiary">{message}</p>
    </motion.div>
  );
}

// Icons

function LoadingSpinner() {
  return (
    <svg className="w-5 h-5 animate-spin text-iris" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ScoreIcon() {
  return (
    <svg className="w-5 h-5 text-iris" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export { HealthBadge, MetricCard, AlertCard, ActionButton };
