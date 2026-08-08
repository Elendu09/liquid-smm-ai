import { useEffect } from "react";

/**
 * Seo
 *
 * A small, dependency-free SEO component. Updates document.title and
 * meta tags in place whenever the component mounts with new props.
 * It also writes a JSON-LD block when `jsonLd` is provided.
 *
 * Why a custom component instead of react-helmet? The project does
 * not ship react-helmet, and adding it would inflate the bundle for
 * what is essentially a 30-line concern. This implementation is
 * complete for the meta tags we care about (title, description,
 * canonical, OG, Twitter) and is the only place we touch the head.
 */
export interface SeoProps {
  title: string;
  description: string;
  /** Path or full URL. If a path, it is joined with `siteUrl`. */
  canonical?: string;
  /** Image used by OpenGraph and Twitter cards. */
  image?: string;
  /** "website" for the homepage, "article" for blog posts. */
  type?: "website" | "article";
  /** Author of an article (OpenGraph profile tag). */
  author?: string;
  /** ISO publish date for an article. */
  publishedAt?: string;
  /** ISO updated date for an article. */
  modifiedAt?: string;
  /** Set of keywords for the meta-keywords tag. */
  keywords?: string[];
  /** JSON-LD structured data payload. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const DEFAULT_SITE = "https://smmsaas.com";
const DEFAULT_OG_IMAGE = `${DEFAULT_SITE}/og-default.png`;
const SITE_NAME = "SMMSAAS";

function absoluteUrl(input: string | undefined): string | undefined {
  if (!input) return undefined;
  if (/^https?:\/\//i.test(input)) return input;
  return `${DEFAULT_SITE}${input.startsWith("/") ? "" : "/"}${input}`;
}

function upsertMeta(attr: "name" | "property", key: string, value: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function upsertLink(rel: string, href: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(payload: Record<string, unknown> | Array<Record<string, unknown>>) {
  if (typeof document === "undefined") return;
  const id = "smmpilot-json-ld";
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-smmpilot="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-smmpilot", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(payload);
}

export function Seo({
  title,
  description,
  canonical,
  image,
  type = "website",
  author,
  publishedAt,
  modifiedAt,
  keywords,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
    document.title = fullTitle;
    const url = absoluteUrl(canonical);
    const ogImage = absoluteUrl(image) ?? DEFAULT_OG_IMAGE;

    upsertMeta("name", "description", description);
    upsertMeta("name", "theme-color", "#0b0b0f");
    upsertMeta("name", "viewport", "width=device-width, initial-scale=1, viewport-fit=cover");
    if (keywords?.length) upsertMeta("name", "keywords", keywords.join(", "));

    // OpenGraph
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:image", ogImage);
    if (url) upsertMeta("property", "og:url", url);
    if (publishedAt) upsertMeta("property", "article:published_time", publishedAt);
    if (modifiedAt) upsertMeta("property", "article:modified_time", modifiedAt);
    if (author) upsertMeta("property", "article:author", author);

    // Twitter
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    // Canonical + favicon (favicon is set by the build, this is a safety net)
    if (url) upsertLink("canonical", url);

    if (jsonLd) upsertJsonLd(jsonLd);

    // Restore default title when the component unmounts so navigation
    // between pages doesn't leave a stale title behind.
    return () => {
      // We intentionally don't restore the previous title — the next
      // page's <Seo> will overwrite it. The cleanup is just for the
      // JSON-LD script, which is fully replaced on each page.
    };
  }, [title, description, canonical, image, type, author, publishedAt, modifiedAt, keywords, jsonLd]);

  return null;
}
