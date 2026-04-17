"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  indeterminate?: boolean;
}

export function Checkbox({
  className,
  indeterminate,
  ...props
}: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer h-4 w-4 shrink-0 rounded border border-border bg-surface-02",
        "ring-offset-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-iris data-[state=checked]:border-iris data-[state=checked]:text-white",
        "data-[state=indeterminate]:bg-iris data-[state=indeterminate]:border-iris data-[state=indeterminate]:text-white",
        className
      )}
      checked={indeterminate ? "indeterminate" : props.checked}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {indeterminate ? (
          <Minus className="h-3 w-3" />
        ) : (
          <Check className="h-3 w-3" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

// Checkbox with label
export interface CheckboxWithLabelProps extends CheckboxProps {
  label: string;
  description?: string;
}

export function CheckboxWithLabel({
  label,
  description,
  id,
  ...props
}: CheckboxWithLabelProps) {
  const checkboxId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex items-start gap-3">
      <Checkbox id={checkboxId} {...props} />
      <div className="grid gap-1 leading-none">
        <label
          htmlFor={checkboxId}
          className="text-sm font-medium text-text-primary cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
        {description && (
          <p className="text-sm text-text-secondary">{description}</p>
        )}
      </div>
    </div>
  );
}
