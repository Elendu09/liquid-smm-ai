/**
 * RSS content helpers. Feed summaries often arrive as raw HTML (and sometimes
 * broken/partial markup), which renders as "code" if shown verbatim. These
 * helpers turn that into clean, readable text and clamp it to a sane length.
 */

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
};

/** Strip HTML/XML tags and decode the most common entities. */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return String(input)
    // drop scripts/styles entirely
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    // remove comments and CDATA
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    // strip all remaining tags
    .replace(/<[^>]*>/g, " ")
    // decode named + numeric entities
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, ent: string) => {
      if (ent[0] === "#") {
        const code = ent[1] === "x" || ent[1] === "X"
          ? parseInt(ent.slice(2), 16)
          : parseInt(ent.slice(1), 10);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : m;
      }
      return ENTITY_MAP[ent.toLowerCase()] ?? m;
    })
    .replace(/&/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Clean text for display: strip HTML, collapse whitespace, clamp length. */
export function cleanRssText(input: string | null | undefined, maxLen = 220): string {
  const text = stripHtml(input);
  if (!text) return "";
  return text.length > maxLen ? `${text.slice(0, maxLen).trimEnd()}…` : text;
}

/** Shorten a raw title, keeping it clean. */
export function cleanTitle(input: string | null | undefined, maxLen = 120): string {
  return cleanRssText(input, maxLen);
}
