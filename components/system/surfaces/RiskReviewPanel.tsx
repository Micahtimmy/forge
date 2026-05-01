'use client';

/**
 * RiskReviewPanel V2
 * Consolidated risk review surface with ML predictions
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  panelSlideVariants,
  listContainerVariants,
  listItemVariants,
  riskIndicatorVariants,
  TIMING,
} from '@/lib/motion/variants';
import { FORGE_TOKENS, getRiskColor, getProbabilityColor } from '@/lib/design-system/tokens';
import { cn } from '@/lib/utils';

interface RiskItem {
  id: string;
  type: 'story_slip' | 'sprint_failure' | 'dependency_blocked' | 'capacity_overload' | 'quality_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  title: string;
  description: string;
  impactedItems: {
    type: 'story' | 'sprint' | 'team' | 'feature';
    id: string;
    name: string;
  }[];
  mitigations: string[];
  predictedBy: 'ml' | 'rule' | 'manual';
  confidence: number;
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

interface RiskReviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  risks: RiskItem[];
  onAcknowledge?: (riskId: string) => void;
  onResolve?: (riskId: string) => void;
  onViewDetails?: (risk: RiskItem) => void;
  className?: string;
}

export function RiskReviewPanel({
  isOpen,
  onClose,
  risks,
  onAcknowledge,
  onResolve,
  onViewDetails,
  className,
}: RiskReviewPanelProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('active');
  const [sortBy, setSortBy] = useState<'severity' | 'probability' | 'date'>('severity');

  const filteredRisks = useMemo(() => {
    let result = [...risks];

    // Filter
    switch (filter) {
      case 'active':
        result = result.filter(r => !r.acknowledgedAt && !r.resolvedAt);
        break;
      case 'acknowledged':
        result = result.filter(r => r.acknowledgedAt && !r.resolvedAt);
        break;
      case 'resolved':
        result = result.filter(r => !!r.resolvedAt);
        break;
    }

    // Sort
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    result.sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          return severityOrder[a.severity] - severityOrder[b.severity];
        case 'probability':
          return b.probability - a.probability;
        case 'date':
          return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [risks, filter, sortBy]);

  const riskSummary = useMemo(() => ({
    critical: risks.filter(r => r.severity === 'critical' && !r.resolvedAt).length,
    high: risks.filter(r => r.severity === 'high' && !r.resolvedAt).length,
    medium: risks.filter(r => r.severity === 'medium' && !r.resolvedAt).length,
    low: risks.filter(r => r.severity === 'low' && !r.resolvedAt).length,
    total: risks.filter(r => !r.resolvedAt).length,
  }), [risks]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            variants={panelSlideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'fixed right-0 top-0 bottom-0 w-full max-w-lg',
              'bg-canvas border-l border-border-subtle',
              'z-50 flex flex-col',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Risk Review</h2>
                <p className="text-sm text-text-secondary">
                  {riskSummary.total} active {riskSummary.total === 1 ? 'risk' : 'risks'}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close risk review panel"
                className="p-2 rounded-lg hover:bg-surface-02 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Summary badges */}
            <div className="px-6 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                {riskSummary.critical > 0 && (
                  <SeverityBadge severity="critical" count={riskSummary.critical} />
                )}
                {riskSummary.high > 0 && (
                  <SeverityBadge severity="high" count={riskSummary.high} />
                )}
                {riskSummary.medium > 0 && (
                  <SeverityBadge severity="medium" count={riskSummary.medium} />
                )}
                {riskSummary.low > 0 && (
                  <SeverityBadge severity="low" count={riskSummary.low} />
                )}
                {riskSummary.total === 0 && (
                  <span className="text-sm text-jade">All clear</span>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-1">
                {(['all', 'active', 'acknowledged', 'resolved'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                      filter === f
                        ? 'bg-iris/10 text-iris'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-02'
                    )}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2 py-1 rounded bg-surface-02 border border-border-subtle text-sm text-text-secondary"
              >
                <option value="severity">Severity</option>
                <option value="probability">Probability</option>
                <option value="date">Date</option>
              </select>
            </div>

            {/* Risk list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <motion.div
                variants={listContainerVariants}
                initial="initial"
                animate="animate"
                className="space-y-3"
              >
                {filteredRisks.length === 0 ? (
                  <EmptyState filter={filter} />
                ) : (
                  filteredRisks.map((risk) => (
                    <RiskCard
                      key={risk.id}
                      risk={risk}
                      onAcknowledge={() => onAcknowledge?.(risk.id)}
                      onResolve={() => onResolve?.(risk.id)}
                      onViewDetails={() => onViewDetails?.(risk)}
                    />
                  ))
                )}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Sub-components

function SeverityBadge({ severity, count }: { severity: RiskItem['severity']; count: number }) {
  const colors = {
    critical: 'bg-coral/20 text-coral border-coral/30',
    high: 'bg-coral/10 text-coral-light border-coral/20',
    medium: 'bg-amber/10 text-amber border-amber/20',
    low: 'bg-jade/10 text-jade border-jade/20',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded border text-xs font-medium', colors[severity])}>
      {count} {severity}
    </span>
  );
}

function RiskCard({
  risk,
  onAcknowledge,
  onResolve,
  onViewDetails,
}: {
  risk: RiskItem;
  onAcknowledge?: () => void;
  onResolve?: () => void;
  onViewDetails?: () => void;
}) {
  const isResolved = !!risk.resolvedAt;
  const isAcknowledged = !!risk.acknowledgedAt;

  const typeIcons: Record<RiskItem['type'], React.ReactNode> = {
    story_slip: <StoryIcon />,
    sprint_failure: <SprintIcon />,
    dependency_blocked: <DependencyIcon />,
    capacity_overload: <CapacityIcon />,
    quality_degradation: <QualityIcon />,
  };

  return (
    <motion.div
      variants={listItemVariants}
      className={cn(
        'p-4 rounded-lg border bg-surface-01',
        isResolved && 'opacity-60',
        !isResolved && risk.severity === 'critical' && 'border-coral/30',
        !isResolved && risk.severity === 'high' && 'border-coral/20',
        !isResolved && risk.severity === 'medium' && 'border-amber/20',
        !isResolved && risk.severity === 'low' && 'border-border-subtle'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Risk indicator */}
        <motion.div
          variants={riskIndicatorVariants}
          animate={isResolved ? 'low' : risk.severity}
          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: isResolved ? FORGE_TOKENS.colors.risk.low : getRiskColor(risk.severity) }}
        />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary">{typeIcons[risk.type]}</span>
              <h3 className="text-sm font-medium text-text-primary">{risk.title}</h3>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="px-1.5 py-0.5 rounded text-xs font-mono"
                style={{
                  backgroundColor: `${getProbabilityColor(risk.probability)}20`,
                  color: getProbabilityColor(risk.probability),
                }}
              >
                {risk.probability}%
              </span>
              <PredictionBadge model={risk.predictedBy} confidence={risk.confidence} />
            </div>
          </div>

          {/* Description */}
          <p className="mt-1 text-sm text-text-secondary line-clamp-2">
            {risk.description}
          </p>

          {/* Impacted items */}
          {risk.impactedItems.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {risk.impactedItems.slice(0, 3).map((item) => (
                <span
                  key={item.id}
                  className="px-1.5 py-0.5 rounded text-xs bg-surface-03 text-text-secondary"
                >
                  {item.name}
                </span>
              ))}
              {risk.impactedItems.length > 3 && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-surface-03 text-text-tertiary">
                  +{risk.impactedItems.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          {!isResolved && (
            <div className="mt-3 flex items-center gap-2">
              {!isAcknowledged && onAcknowledge && (
                <button
                  onClick={onAcknowledge}
                  className="px-2 py-1 rounded text-xs font-medium bg-surface-02 text-text-secondary hover:bg-surface-03 hover:text-text-primary transition-colors"
                >
                  Acknowledge
                </button>
              )}
              {onResolve && (
                <button
                  onClick={onResolve}
                  className="px-2 py-1 rounded text-xs font-medium bg-jade/10 text-jade hover:bg-jade/20 transition-colors"
                >
                  Mark Resolved
                </button>
              )}
              {onViewDetails && (
                <button
                  onClick={onViewDetails}
                  className="px-2 py-1 rounded text-xs font-medium text-iris hover:bg-iris/10 transition-colors"
                >
                  Details
                </button>
              )}
            </div>
          )}

          {/* Status indicators */}
          {(isAcknowledged || isResolved) && (
            <div className="mt-2 flex items-center gap-2 text-xs text-text-tertiary">
              {isResolved && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-jade" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Resolved
                </span>
              )}
              {isAcknowledged && !isResolved && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Acknowledged
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PredictionBadge({ model, confidence }: { model: RiskItem['predictedBy']; confidence: number }) {
  const labels = { ml: 'ML', rule: 'Rule', manual: 'Manual' };
  const colors = {
    ml: 'bg-iris/10 text-iris',
    rule: 'bg-surface-03 text-text-secondary',
    manual: 'bg-surface-03 text-text-secondary',
  };

  return (
    <span className={cn('px-1 py-0.5 rounded text-xs font-medium', colors[model])}>
      {labels[model]} {Math.round(confidence * 100)}%
    </span>
  );
}

function EmptyState({ filter }: { filter: string }) {
  const messages = {
    all: 'No risks detected',
    active: 'No active risks',
    acknowledged: 'No acknowledged risks',
    resolved: 'No resolved risks',
  };

  return (
    <motion.div
      variants={listItemVariants}
      className="py-12 text-center"
    >
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-jade/10 flex items-center justify-center">
        <svg className="w-6 h-6 text-jade" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="text-text-secondary">{messages[filter as keyof typeof messages] || messages.all}</p>
    </motion.div>
  );
}

// Icons

function StoryIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SprintIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function DependencyIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CapacityIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function QualityIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export { SeverityBadge, RiskCard, PredictionBadge };
