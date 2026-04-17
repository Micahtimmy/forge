export { cn } from "./cn";

/**
 * Format a number as currency (NGN by default)
 */
export function formatCurrency(
  amount: number,
  currency: string = "NGN",
  locale: string = "en-NG"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format a number as Kobo to Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Format a date for display
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  return new Intl.DateTimeFormat("en-NG", options).format(new Date(date));
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
}

/**
 * Get score tier based on score value
 */
export function getScoreTier(
  score: number
): "excellent" | "good" | "fair" | "poor" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

/**
 * Get color class for score tier
 */
export function getScoreColor(score: number): string {
  const tier = getScoreTier(score);
  const colors = {
    excellent: "text-jade",
    good: "text-iris",
    fair: "text-amber",
    poor: "text-coral",
  };
  return colors[tier];
}

/**
 * Get background color class for score tier
 */
export function getScoreBgColor(score: number): string {
  const tier = getScoreTier(score);
  const colors = {
    excellent: "bg-jade-dim",
    good: "bg-iris-dim",
    fair: "bg-amber-dim",
    poor: "bg-coral-dim",
  };
  return colors[tier];
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
