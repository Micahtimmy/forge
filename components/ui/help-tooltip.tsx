'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  delayDuration?: number;
}

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function HelpTooltip({
  content,
  side = 'top',
  align = 'center',
  className,
  iconClassName,
  size = 'sm',
  delayDuration = 200,
}: HelpTooltipProps) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root delayDuration={delayDuration}>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full',
              'text-text-tertiary hover:text-text-secondary',
              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-iris/50',
              className
            )}
          >
            <HelpCircle className={cn(sizeMap[size], iconClassName)} />
            <span className="sr-only">Help</span>
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              'z-50 max-w-xs rounded-lg px-3 py-2 text-sm',
              'bg-surface-03 text-text-primary',
              'shadow-lg',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2',
              'data-[side=top]:slide-in-from-bottom-2'
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-surface-03" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// Inline variant for use within text
interface HelpInlineProps extends HelpTooltipProps {
  label: string;
}

export function HelpInline({ label, ...tooltipProps }: HelpInlineProps) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <HelpTooltip {...tooltipProps} />
    </span>
  );
}
