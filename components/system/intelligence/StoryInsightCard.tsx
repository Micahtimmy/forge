'use client';

/**
 * StoryInsightCard V2
 * AI-powered story insight component with intelligence indicators
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  intelligenceCardVariants,
  aiProcessingVariants,
  aiDotVariants,
  TIMING,
} from '@/lib/motion/variants';
import { FORGE_TOKENS, getScoreColor, getScoreTier } from '@/lib/design-system/tokens';
import { cn } from '@/lib/utils';

interface StoryInsight {
  storyId: string;
  storyKey: string;
  summary: string;
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  slipProbability: number;
  dimensions: {
    name: string;
    score: number;
    maxScore: number;
    reasoning?: string;
  }[];
  suggestions: {
    type: 'improvement' | 'warning' | 'critical';
    message: string;
    action?: string;
  }[];
  predictedBy: 'gemini' | 'heuristic';
  confidence: number;
  updatedAt: string;
}

interface StoryInsightCardProps {
  insight: StoryInsight;
  isLoading?: boolean;
  isStale?: boolean;
  onRescore?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function StoryInsightCard({
  insight,
  isLoading = false,
  isStale = false,
  onRescore,
  onViewDetails,
  className,
}: StoryInsightCardProps) {
  const scoreColor = getScoreColor(insight.score);
  const scoreTier = getScoreTier(insight.score);

  return (
    <motion.div
      variants={intelligenceCardVariants}
      initial="initial"
      animate={isLoading ? 'loading' : 'animate'}
      whileHover="hover"
      className={cn(
        'relative rounded-lg border bg-surface-01 p-4',
        'transition-colors duration-150',
        isStale && 'border-amber-500/30',
        className
      )}
      style={{
        borderColor: isStale ? undefined : `${scoreColor}20`,
      }}
    >
      {/* Stale indicator */}
      {isStale && (
        <div className="absolute -top-2 left-4 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
          Stale
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-text-secondary">
              {insight.storyKey}
            </span>
            <AIBadge model={insight.predictedBy} confidence={insight.confidence} />
          </div>
          <p className="mt-1 text-sm text-text-primary line-clamp-2">
            {insight.summary}
          </p>
        </div>

        {/* Score Ring */}
        <div className="flex-shrink-0 ml-4">
          <ScoreRing score={insight.score} size="md" />
        </div>
      </div>

      {/* Risk & Slip indicators */}
      <div className="flex items-center gap-3 mb-3">
        <RiskBadge level={insight.riskLevel} />
        <SlipIndicator probability={insight.slipProbability} />
      </div>

      {/* Dimension bars */}
      <div className="space-y-2 mb-4">
        {insight.dimensions.slice(0, 3).map((dim) => (
          <DimensionBar
            key={dim.name}
            name={dim.name}
            score={dim.score}
            maxScore={dim.maxScore}
          />
        ))}
      </div>

      {/* Top suggestion */}
      {insight.suggestions.length > 0 && (
        <div className="mb-4">
          <SuggestionItem suggestion={insight.suggestions[0]} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border-subtle">
        {onRescore && (
          <motion.button
            onClick={onRescore}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex-1 px-3 py-1.5 rounded text-sm font-medium',
              'bg-iris/10 text-iris hover:bg-iris/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-150'
            )}
          >
            {isLoading ? <AIProcessing /> : 'Re-score'}
          </motion.button>
        )}
        {onViewDetails && (
          <motion.button
            onClick={onViewDetails}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex-1 px-3 py-1.5 rounded text-sm font-medium',
              'bg-surface-02 text-text-secondary hover:text-text-primary',
              'hover:bg-surface-03 transition-colors duration-150'
            )}
          >
            View Details
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// Sub-components

function ScoreRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = getScoreColor(score);
  const sizes = {
    sm: { width: 40, stroke: 3, fontSize: 'text-xs' },
    md: { width: 56, stroke: 4, fontSize: 'text-sm' },
    lg: { width: 80, stroke: 5, fontSize: 'text-xl' },
  };
  const { width, stroke, fontSize } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative" style={{ width, height: width }}>
      <svg width={width} height={width} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-surface-03"
        />
        {/* Progress ring */}
        <motion.circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ type: 'spring', stiffness: 50, damping: 20, delay: 0.2 }}
        />
      </svg>
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, ...TIMING.spring }}
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          'font-mono font-semibold text-text-primary',
          fontSize
        )}
      >
        {score}
      </motion.span>
    </div>
  );
}

function AIBadge({ model, confidence }: { model: 'gemini' | 'heuristic'; confidence: number }) {
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-iris/10 text-iris">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
      <span className="text-xs font-medium">
        {model === 'gemini' ? 'AI' : 'Rule'} {Math.round(confidence * 100)}%
      </span>
    </div>
  );
}

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const colors = {
    low: 'bg-jade/10 text-jade border-jade/20',
    medium: 'bg-amber/10 text-amber border-amber/20',
    high: 'bg-coral/10 text-coral border-coral/20',
    critical: 'bg-coral/20 text-coral border-coral/40',
  };

  return (
    <div className={cn('px-2 py-0.5 rounded border text-xs font-medium uppercase', colors[level])}>
      {level} risk
    </div>
  );
}

function SlipIndicator({ probability }: { probability: number }) {
  const color =
    probability >= 70 ? FORGE_TOKENS.colors.risk.critical :
    probability >= 50 ? FORGE_TOKENS.colors.risk.high :
    probability >= 30 ? FORGE_TOKENS.colors.risk.medium :
    FORGE_TOKENS.colors.risk.low;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-text-secondary">
        {probability}% slip
      </span>
    </div>
  );
}

function DimensionBar({ name, score, maxScore }: { name: string; score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100;
  const color = getScoreColor((score / maxScore) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary capitalize">{name}</span>
        <span className="text-text-tertiary font-mono">
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-03 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function SuggestionItem({ suggestion }: { suggestion: StoryInsight['suggestions'][0] }) {
  const icons = {
    improvement: (
      <svg className="w-4 h-4 text-iris" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M2 12h20" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    critical: (
      <svg className="w-4 h-4 text-coral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const bgColors = {
    improvement: 'bg-iris/5 border-iris/10',
    warning: 'bg-amber/5 border-amber/10',
    critical: 'bg-coral/5 border-coral/10',
  };

  return (
    <div className={cn('flex gap-2 p-2 rounded border', bgColors[suggestion.type])}>
      {icons[suggestion.type]}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary line-clamp-2">
          {suggestion.message}
        </p>
        {suggestion.action && (
          <p className="mt-1 text-xs text-iris font-medium">
            {suggestion.action}
          </p>
        )}
      </div>
    </div>
  );
}

function AIProcessing() {
  return (
    <motion.div
      variants={aiProcessingVariants}
      initial="initial"
      animate="processing"
      className="flex items-center justify-center gap-1"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          variants={aiDotVariants}
          className="w-1.5 h-1.5 rounded-full bg-iris"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </motion.div>
  );
}

export { ScoreRing, AIBadge, RiskBadge, SlipIndicator, DimensionBar };
