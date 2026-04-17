/**
 * Resilience utilities for handling failures gracefully.
 * Provides retry logic, timeouts, and graceful degradation patterns.
 */

export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
};

/**
 * Executes an async function with automatic retry on failure.
 * Uses exponential backoff with jitter.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100,
        maxDelayMs
      );

      onRetry?.(attempt, error);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Executes a function with a timeout.
 * Throws if the function doesn't complete within the specified time.
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage = "Operation timed out"
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Executes a function and returns a fallback value on error.
 * Useful for non-critical operations that shouldn't crash the app.
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  options: { logError?: boolean; errorHandler?: (error: unknown) => void } = {}
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (options.logError !== false) {
      console.error("Operation failed, using fallback:", error);
    }
    options.errorHandler?.(error);
    return fallback;
  }
}

/**
 * Combines retry with timeout for robust async operations.
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { timeoutMs: number }
): Promise<T> {
  return withRetry(
    () => withTimeout(fn, options.timeoutMs),
    options
  );
}

/**
 * Circuit breaker state for protecting against cascading failures.
 */
type CircuitState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private options: {
      failureThreshold: number;
      resetTimeMs: number;
      halfOpenSuccessThreshold?: number;
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      // Check if we should transition to half-open
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeMs) {
        this.state = "half-open";
        this.successCount = 0;
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();

      // Success
      if (this.state === "half-open") {
        this.successCount++;
        if (this.successCount >= (this.options.halfOpenSuccessThreshold || 1)) {
          this.reset();
        }
      } else {
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.options.failureThreshold) {
        this.state = "open";
      }

      throw error;
    }
  }

  reset(): void {
    this.state = "closed";
    this.failures = 0;
    this.successCount = 0;
  }

  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Checks if an error is retryable (network error, 5xx, etc.).
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return true;
    }
  }

  // Check for Response objects with retryable status codes
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    // Retry on server errors and rate limits
    return status >= 500 || status === 429;
  }

  return false;
}
