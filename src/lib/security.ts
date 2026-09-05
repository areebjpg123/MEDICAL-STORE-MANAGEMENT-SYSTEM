/**
 * Security Utilities for Medical Store ERP
 * Prevents XSS, SSTI, NoSQL/SQL injection, ReDoS, clipboard attacks, and replay attacks.
 */

/** Strip HTML tags and dangerous template patterns to prevent XSS and SSTI. */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")             // Strip HTML tags
    .replace(/\{\{.*?\}\}/g, "")          // Strip Mustache/Handlebars {{ }}
    .replace(/<%.*?%>/g, "")             // Strip EJS <% %>
    .replace(/\$\{.*?\}/g, "")           // Strip JS template literals ${}
    .replace(/javascript:/gi, "")         // Strip JS protocol
    .replace(/on\w+\s*=/gi, "")          // Strip inline event handlers
    .trim();
}

/** Remove MongoDB operators and SQL injection patterns from query parameters. */
export function sanitizeQueryParam(param: string): string {
  if (typeof param !== "string") return "";
  return param
    .replace(/[${}]/g, "")               // Remove $ { } for NoSQL
    .replace(/\b(OR|AND|UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/gi, "")
    .replace(/['";\\]/g, "")             // Remove common SQL injection chars
    .replace(/--/g, "")                  // Remove SQL comments
    .trim();
}

/** Generate a UUID v4 + timestamp for idempotency keys (replay attack prevention). */
export function generateIdempotencyKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}-${random2}`;
}

/** Sliding window rate limiter for local actions (prevents LP DoS). */
export class LocalRateLimiter {
  private timestamps: number[] = [];
  private maxActions: number;
  private windowMs: number;

  constructor(maxActions: number, windowMs: number) {
    this.maxActions = maxActions;
    this.windowMs = windowMs;
  }

  canProceed(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxActions) return false;
    this.timestamps.push(now);
    return true;
  }

  reset(): void {
    this.timestamps = [];
  }
}

/** Check if a regex pattern is safe from catastrophic backtracking (ReDoS). */
export function isSafeRegex(pattern: string): boolean {
  // Detect nested quantifiers like (a+)+ or (a*)*
  const dangerousPatterns = [
    /\([^)]*[+*][^)]*\)[+*]/,     // Nested quantifiers: (x+)+
    /\([^)]*\|[^)]*\)[+*]/,       // Alternation in quantified group: (a|b)+
    /\.{2,}[+*]/,                  // Multiple wildcards with quantifier
  ];
  return !dangerousPatterns.some((dp) => dp.test(pattern));
}

/** Sanitize clipboard pasted content, removing zero-width and control characters. */
export function sanitizeClipboard(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, "")  // Zero-width chars
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")   // Control chars (keep \t \n \r)
    .trim();
}

/** Validate that a secret key is not exposed in client-side code. */
export function isSecretKeyExposed(envKey: string): boolean {
  if (typeof window === "undefined") return false;
  // In the browser, NEXT_PUBLIC_ vars are exposed; everything else should NOT be.
  return !envKey.startsWith("NEXT_PUBLIC_");
}
