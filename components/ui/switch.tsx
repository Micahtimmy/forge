"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  size?: "sm" | "md";
}

export function Switch({ className, size = "md", ...props }: SwitchProps) {
  const sizes = {
    sm: "h-4 w-7",
    md: "h-5 w-9",
  };

  const thumbSizes = {
    sm: "h-3 w-3 data-[state=checked]:translate-x-3",
    md: "h-4 w-4 data-[state=checked]:translate-x-4",
  };

  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-iris data-[state=unchecked]:bg-surface-03",
        sizes[size],
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform",
          "data-[state=unchecked]:translate-x-0.5",
          thumbSizes[size]
        )}
      />
    </SwitchPrimitive.Root>
  );
}
