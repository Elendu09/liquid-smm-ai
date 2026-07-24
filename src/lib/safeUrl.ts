/**
 * Validate that a user-supplied URL uses a safe scheme (http, https, mailto, tel).
 * Rejects javascript:, data:, vbscript:, file:, and other dangerous schemes to
 * prevent stored XSS via <a href> in user-generated content (link-in-bio, etc).
 * Returns undefined for unsafe URLs so the anchor renders inert.
 */
export function safeUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;
  // Allow protocol-relative and relative URLs.
  if (trimmed.startsWith("//") || trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?")) {
    return trimmed;
  }
  // If it has a scheme, only allow the safelist.
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme === "http" || scheme === "https" || scheme === "mailto" || scheme === "tel") {
      return trimmed;
    }
    return undefined;
  }
  // No scheme, no leading slash → treat as https URL.
  return `https://${trimmed}`;
}
