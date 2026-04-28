/**
 * Structured logger with PII redaction for production safety.
 * Replaces console.log throughout the codebase.
 *
 * Features:
 * - Automatic PII redaction (emails, tokens, IPs)
 * - Structured JSON output in production
 * - Request context tracking
 * - Log levels (debug, info, warn, error)
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const PII_PATTERNS = [
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL]" },
  // JWT tokens (three base64 segments separated by dots)
  { pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, replacement: "[JWT]" },
  // Bearer tokens
  { pattern: /Bearer\s+[a-zA-Z0-9._~+/=-]+/gi, replacement: "Bearer [TOKEN]" },
  // API keys (common patterns)
  { pattern: /(?:api[_-]?key|apikey|secret|token|password|auth)[=:]\s*["']?[a-zA-Z0-9._~+/=-]{16,}["']?/gi, replacement: "[REDACTED_CREDENTIAL]" },
  // IP addresses (IPv4)
  { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: "[IP]" },
  // Credit card numbers (basic pattern)
  { pattern: /\b(?:\d{4}[- ]?){3}\d{4}\b/g, replacement: "[CARD]" },
  // UUID-like patterns in sensitive contexts (keep for debugging but flag)
  { pattern: /(?:password|secret|token|key).*?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi, replacement: "[REDACTED_ID]" },
];

function redactPII(value: unknown): unknown {
  if (typeof value === "string") {
    let redacted = value;
    for (const { pattern, replacement } of PII_PATTERNS) {
      redacted = redacted.replace(pattern, replacement);
    }
    return redacted;
  }

  if (Array.isArray(value)) {
    return value.map(redactPII);
  }

  if (value && typeof value === "object") {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Redact sensitive field names entirely
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey.includes("apikey") ||
        lowerKey.includes("api_key") ||
        lowerKey.includes("authorization") ||
        lowerKey.includes("credential")
      ) {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = redactPII(val);
      }
    }
    return redacted;
  }

  return value;
}

function formatError(error: unknown): LogEntry["error"] | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactPII(error.message) as string,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  return {
    name: "UnknownError",
    message: redactPII(String(error)) as string,
  };
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message: redactPII(message) as string,
    context: context ? (redactPII(context) as LogContext) : undefined,
    error: formatError(error),
  };
}

function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ["debug", "info", "warn", "error"];
  const minLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug");
  return levels.indexOf(level) >= levels.indexOf(minLevel);
}

function output(entry: LogEntry): void {
  if (process.env.NODE_ENV === "production") {
    // Structured JSON for production (works with log aggregators)
    const consoleMethod = entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.log;
    consoleMethod(JSON.stringify(entry));
  } else {
    // Human-readable for development
    const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}:`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    const errorStr = entry.error ? `\n  Error: ${entry.error.message}${entry.error.stack ? `\n${entry.error.stack}` : ""}` : "";

    const consoleMethod = entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : entry.level === "debug" ? console.debug : console.log;
    consoleMethod(`${prefix} ${entry.message}${contextStr}${errorStr}`);
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog("debug")) {
      output(createLogEntry("debug", message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog("info")) {
      output(createLogEntry("info", message, context));
    }
  },

  warn(message: string, context?: LogContext, error?: unknown): void {
    if (shouldLog("warn")) {
      output(createLogEntry("warn", message, context, error));
    }
  },

  error(message: string, context?: LogContext, error?: unknown): void {
    if (shouldLog("error")) {
      output(createLogEntry("error", message, context, error));
    }
  },

  /**
   * Create a child logger with preset context
   */
  child(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext, error?: unknown) =>
        logger.warn(message, { ...baseContext, ...context }, error),
      error: (message: string, context?: LogContext, error?: unknown) =>
        logger.error(message, { ...baseContext, ...context }, error),
    };
  },
};

export type { LogContext, LogLevel };
