/**
 * AI Input Sanitization Utilities
 * Prevents prompt injection attacks by sanitizing user-controlled content
 * before interpolation into AI prompts.
 */

/**
 * Patterns that could be used for prompt injection attacks
 */
const INJECTION_PATTERNS = [
  // Direct instruction override attempts
  /\b(ignore|disregard|forget|override|bypass)\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions?|rules?|guidelines?|prompts?)/gi,
  // System prompt manipulation
  /\b(system|assistant|user)\s*:/gi,
  // Role playing attacks
  /\b(you\s+are\s+now|act\s+as|pretend\s+(to\s+be|you('re)?))/gi,
  // Output manipulation
  /\b(output|return|respond\s+with|generate)\s+only/gi,
];

/**
 * XML/HTML tag patterns that could interfere with structured output parsing
 */
const STRUCTURED_OUTPUT_TAGS = [
  // Common XML tags used in our AI outputs
  /<\/?analysis>/gi,
  /<\/?total_score>/gi,
  /<\/?dimensions?>/gi,
  /<\/?completeness>/gi,
  /<\/?clarity>/gi,
  /<\/?estimability>/gi,
  /<\/?traceability>/gi,
  /<\/?testability>/gi,
  /<\/?reasoning>/gi,
  /<\/?suggestions?>/gi,
  /<\/?suggestion>/gi,
  /<\/?current>/gi,
  /<\/?improved>/gi,
  /<\/?pi_objectives>/gi,
  /<\/?team>/gi,
  /<\/?objective>/gi,
  /<\/?risk_analysis>/gi,
  /<\/?risks?>/gi,
  /<\/?story>/gi,
  /<\/?criterion>/gi,
  /<\/?summary>/gi,
];

/**
 * Sanitizes user-provided text for safe inclusion in AI prompts.
 *
 * @param text - The user-provided text to sanitize
 * @param options - Sanitization options
 * @returns Sanitized text safe for prompt interpolation
 */
export function sanitizeForPrompt(
  text: string | null | undefined,
  options: {
    maxLength?: number;
    placeholder?: string;
    preserveNewlines?: boolean;
  } = {}
): string {
  const {
    maxLength = 10000,
    placeholder = "[Not provided]",
    preserveNewlines = true,
  } = options;

  if (!text || text.trim().length === 0) {
    return placeholder;
  }

  let sanitized = text;

  // 1. Remove XML/HTML-like tags that could interfere with output parsing
  for (const pattern of STRUCTURED_OUTPUT_TAGS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // 2. Remove generic XML/HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // 3. Filter out prompt injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[filtered]");
  }

  // 4. Remove markdown code blocks that might contain injection attempts
  sanitized = sanitized.replace(/```[\s\S]*?```/g, "[code block]");

  // 5. Remove triple backticks without closing (partial code blocks)
  sanitized = sanitized.replace(/```[\s\S]*/g, "[code block]");

  // 6. Normalize whitespace
  if (preserveNewlines) {
    // Keep single newlines but normalize multiple to double
    sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
  } else {
    sanitized = sanitized.replace(/\s+/g, " ");
  }

  // 7. Trim and enforce length limit
  sanitized = sanitized.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + "... [truncated]";
  }

  // 8. Return placeholder if sanitization removed all content
  if (sanitized.length === 0 || sanitized === "[filtered]") {
    return placeholder;
  }

  return sanitized;
}

/**
 * Sanitizes an array of strings (e.g., labels, tags)
 */
export function sanitizeStringArray(
  items: string[] | null | undefined,
  options: {
    maxItems?: number;
    maxItemLength?: number;
  } = {}
): string[] {
  const { maxItems = 50, maxItemLength = 100 } = options;

  if (!items || items.length === 0) {
    return [];
  }

  return items
    .slice(0, maxItems)
    .map((item) => sanitizeForPrompt(item, {
      maxLength: maxItemLength,
      placeholder: "",
      preserveNewlines: false,
    }))
    .filter((item) => item.length > 0 && item !== "[filtered]");
}

/**
 * Sanitizes a number, ensuring it's within expected bounds
 */
export function sanitizeNumber(
  value: number | null | undefined,
  options: {
    min?: number;
    max?: number;
    defaultValue?: number;
  } = {}
): number | null {
  const { min = 0, max = 1000, defaultValue = null } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue;
  }

  if (value < min || value > max) {
    return defaultValue;
  }

  return value;
}

/**
 * Creates a safe string representation of story data for prompts
 */
export function sanitizeStoryForPrompt(story: {
  key: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  storyPoints: number | null;
  epicKey: string | null;
  labels: string[] | null;
}): {
  key: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  storyPoints: string;
  epicKey: string;
  labels: string;
} {
  return {
    key: sanitizeForPrompt(story.key, { maxLength: 50, placeholder: "N/A" }),
    title: sanitizeForPrompt(story.title, { maxLength: 500, placeholder: "[No title]" }),
    description: sanitizeForPrompt(story.description, {
      maxLength: 5000,
      placeholder: "[No description provided]"
    }),
    acceptanceCriteria: sanitizeForPrompt(story.acceptanceCriteria, {
      maxLength: 5000,
      placeholder: "[No acceptance criteria provided]"
    }),
    storyPoints: story.storyPoints !== null ? String(story.storyPoints) : "Not estimated",
    epicKey: sanitizeForPrompt(story.epicKey, { maxLength: 50, placeholder: "Not linked" }),
    labels: sanitizeStringArray(story.labels).join(", ") || "None",
  };
}
