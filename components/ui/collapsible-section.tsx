'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpTooltip } from './help-tooltip';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  helpContent?: React.ReactNode;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode; // Action button/link on the right side
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  onToggle?: (isOpen: boolean) => void;
  storageKey?: string; // Persist state to localStorage
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  helpContent,
  badge,
  headerAction,
  className,
  headerClassName,
  contentClassName,
  onToggle,
  storageKey,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`collapsible-${storageKey}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultOpen;
  });

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);

    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`collapsible-${storageKey}`, String(newState));
    }
  };

  return (
    <div className={cn('rounded-lg border border-border bg-surface-01', className)}>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center justify-between gap-3 px-4 py-3',
          'text-left transition-colors',
          'hover:bg-surface-02',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-iris/50',
          isOpen && 'border-b border-border',
          headerClassName
        )}
      >
        <div className="flex items-center gap-2">
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          </motion.div>
          <span className="font-medium text-text-primary">{title}</span>
          {helpContent && <HelpTooltip content={helpContent} />}
          {badge && <span className="ml-2">{badge}</span>}
        </div>
        <div className="flex items-center gap-3">
          {headerAction && (
            <span onClick={(e) => e.stopPropagation()}>{headerAction}</span>
          )}
          <span className="text-xs text-text-tertiary">
            {isOpen ? 'Collapse' : 'Expand'}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={cn('p-4', contentClassName)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simpler variant without card styling
interface CollapsibleInlineProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleInline({
  title,
  children,
  defaultOpen = true,
  className,
}: CollapsibleInlineProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        {title}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
