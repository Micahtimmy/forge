"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, type = "text", ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full bg-surface-02 border border-border rounded-md text-text-primary",
            "text-sm py-2 px-3 outline-none transition-all duration-150",
            "placeholder:text-text-tertiary",
            "focus:border-iris focus:ring-[3px] focus:ring-iris-dim",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-coral focus:border-coral focus:ring-coral-dim",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Textarea variant
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full bg-surface-02 border border-border rounded-md text-text-primary",
          "text-sm py-2 px-3 outline-none transition-all duration-150",
          "placeholder:text-text-tertiary resize-none",
          "focus:border-iris focus:ring-[3px] focus:ring-iris-dim",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-coral focus:border-coral focus:ring-coral-dim",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

// Label component
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn("block text-sm font-medium text-text-primary mb-1.5", className)}
      {...props}
    >
      {children}
      {required && <span className="text-coral ml-0.5">*</span>}
    </label>
  );
}
