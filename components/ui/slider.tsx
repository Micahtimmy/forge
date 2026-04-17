"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends React.ComponentProps<typeof SliderPrimitive.Root> {
  showValue?: boolean;
}

export function Slider({ className, showValue, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-03">
        <SliderPrimitive.Range className="absolute h-full bg-iris" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block h-4 w-4 rounded-full border border-iris bg-canvas",
          "ring-offset-canvas transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "hover:bg-surface-02 cursor-grab active:cursor-grabbing"
        )}
      />
    </SliderPrimitive.Root>
  );
}

// Slider with labels
export interface LabeledSliderProps extends SliderProps {
  label?: string;
  minLabel?: string;
  maxLabel?: string;
}

export function LabeledSlider({
  label,
  minLabel,
  maxLabel,
  value,
  ...props
}: LabeledSliderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">{label}</span>
          {value !== undefined && (
            <span className="text-sm font-mono text-text-secondary">
              {Array.isArray(value) ? value[0] : value}
            </span>
          )}
        </div>
      )}
      <Slider value={value} {...props} />
      {(minLabel || maxLabel) && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-tertiary">{minLabel}</span>
          <span className="text-xs text-text-tertiary">{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
