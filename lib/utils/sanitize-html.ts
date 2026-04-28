/**
 * HTML Sanitization Utility for AI-Generated Content
 *
 * Sanitizes AI-generated content before rendering to prevent XSS attacks.
 * Uses a whitelist approach - only allows specific safe elements and attributes.
 */

// Allowed HTML elements (text formatting only)
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "code",
  "pre",
]);

// Allowed attributes (very restrictive)
const ALLOWED_ATTRS = new Set(["class"]);

// Dangerous patterns to remove entirely
const DANGEROUS_PATTERNS = [
  // Script injection
  /<script[\s\S]*?<\/script>/gi,
  /<script[^>]*>/gi,
  // Event handlers
  /\son\w+\s*=/gi,
  // JavaScript URLs
  /javascript:/gi,
  // Data URLs (can contain scripts)
  /data:/gi,
  // VBScript
  /vbscript:/gi,
  // Expression (IE)
  /expression\s*\(/gi,
];

/**
 * Sanitize HTML content from AI responses
 * Removes dangerous elements and attributes while preserving safe formatting.
 *
 * @param html - Raw HTML string from AI
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeAIHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  let sanitized = html;

  // First pass: remove obviously dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Second pass: remove disallowed tags but keep content
  // Match any HTML tag
  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tagName) => {
    const tag = tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      // Remove the tag but keep whatever content follows (for closing tags this is empty)
      return "";
    }

    // For allowed tags, strip unsafe attributes
    if (match.startsWith("</")) {
      // Closing tag - just return it
      return `</${tag}>`;
    }

    // Opening tag - filter attributes
    const attrMatch = match.match(/^<[a-z][a-z0-9]*\s+(.+?)>/i);
    if (attrMatch) {
      const attrs = attrMatch[1];
      const safeAttrs: string[] = [];

      // Parse attributes carefully
      const attrRegex = /([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/gi;
      let attrMatch2;
      while ((attrMatch2 = attrRegex.exec(attrs)) !== null) {
        const attrName = attrMatch2[1].toLowerCase();
        const attrValue = attrMatch2[2] || attrMatch2[3] || attrMatch2[4] || "";

        if (ALLOWED_ATTRS.has(attrName)) {
          // Additional check: class values should only be alphanumeric + dashes
          if (attrName === "class" && /^[a-zA-Z0-9\s-_]+$/.test(attrValue)) {
            safeAttrs.push(`${attrName}="${attrValue}"`);
          }
        }
      }

      if (safeAttrs.length > 0) {
        return `<${tag} ${safeAttrs.join(" ")}>`;
      }
    }

    // Return clean tag without attributes
    return `<${tag}>`;
  });

  // Third pass: remove any remaining dangerous sequences
  sanitized = sanitized
    .replace(/<!--[\s\S]*?-->/g, "") // HTML comments
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, ""); // CDATA

  return sanitized.trim();
}

/**
 * Convert plain text to safe HTML
 * Escapes HTML entities and converts newlines to <br> tags.
 * Use this when AI content should be treated as plain text.
 *
 * @param text - Plain text string
 * @returns HTML-safe string
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

/**
 * Strip all HTML tags, leaving only text content
 * Use this when you need pure text from AI HTML output.
 *
 * @param html - HTML string
 * @returns Plain text string
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
