"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles = {
  primary:
    "bg-iris text-white border-iris hover:bg-iris-light focus-visible:ring-iris",
  secondary:
    "bg-surface-03 text-text-primary border-border hover:border-border-strong hover:bg-surface-04",
  ghost:
    "bg-transparent text-text-secondary border-transparent hover:bg-surface-03 hover:text-text-primary",
  danger:
    "bg-coral-dim text-coral border-coral-border hover:bg-coral hover:text-white",
};

const sizeStyles = {
  xs: "px-2.5 py-1 text-[11px] gap-1",
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-3.5 py-[7px] text-[13px] gap-1.5",
  lg: "px-5 py-2.5 text-[15px] gap-2",
  xl: "px-6 py-3 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-md border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "select-none whitespace-nowrap",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={isDisabled}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
