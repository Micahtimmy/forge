"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  status?: "online" | "away" | "busy" | "offline";
}

const sizeStyles = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-12 w-12 text-base",
};

const statusColors = {
  online: "bg-jade",
  away: "bg-amber",
  busy: "bg-coral",
  offline: "bg-text-tertiary",
};

const statusSizes = {
  xs: "h-1.5 w-1.5",
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
  xl: "h-3 w-3",
};

export function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  className,
  status,
}: AvatarProps) {
  // Generate fallback from alt or provided fallback
  const initials =
    fallback ||
    alt
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="relative inline-block">
      <AvatarPrimitive.Root
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-surface-03",
          sizeStyles[size],
          className
        )}
      >
        <AvatarPrimitive.Image
          src={src || undefined}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
        />
        <AvatarPrimitive.Fallback
          className="flex h-full w-full items-center justify-center bg-surface-03 text-text-secondary font-medium"
          delayMs={600}
        >
          {initials || "?"}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-canvas",
            statusColors[status],
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}

// Avatar group for showing multiple avatars
export function AvatarGroup({
  avatars,
  max = 4,
  size = "md",
  className,
}: {
  avatars: Array<{ src?: string | null; alt?: string }>;
  max?: number;
  size?: AvatarProps["size"];
  className?: string;
}) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visible.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-canvas"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-surface-03 text-text-secondary font-medium ring-2 ring-canvas",
            sizeStyles[size || "md"]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
