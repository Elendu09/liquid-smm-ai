import { useEffect, useState } from "react";
import { Link2, RefreshCw, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * LinkPreviewCard
 *
 * Fix 2.3 — broken link previews. We surface the URL the user pasted as
 * a chip, run an OG fetch (simulated locally for the demo), and let the
 * user refresh the snapshot. The chip is a stable visual so the user
 * knows exactly what the platforms will see.
 */

const URL_REGEX = /\bhttps?:\/\/[^\s<>"']+/i;

export function extractFirstUrl(text: string): string | null {
  if (!text) return null;
  const m = text.match(URL_REGEX);
  return m ? m[0].replace(/[).,;]+$/, "") : null;
}

export interface LinkPreview {
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  /** ISO timestamp of when we fetched. */
  fetchedAt: string;
}

const cache = new Map<string, LinkPreview>();

async function fetchPreview(url: string): Promise<LinkPreview> {
  if (cache.has(url)) return cache.get(url)!;
  // Real implementation hits /functions/v1/og-fetch. Demo: synthesise a
  // reasonable preview from the URL so the chip is always useful.
  const host = (() => {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  })();
  const path = (() => {
    try { return new URL(url).pathname.replace(/[-_/]/g, " ").trim(); } catch { return ""; }
  })();
  const preview: LinkPreview = {
    title: path ? path.charAt(0).toUpperCase() + path.slice(1) : host,
    description: `Open Graph preview for ${host}`,
    siteName: host,
    fetchedAt: new Date().toISOString(),
  };
  cache.set(url, preview);
  return preview;
}

export function LinkPreviewCard({
  caption,
  onUrlChange,
  onClear,
  className,
}: {
  caption: string;
  onUrlChange?: (url: string) => void;
  onClear?: () => void;
  className?: string;
}) {
  const url = extractFirstUrl(caption);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) { setPreview(null); setError(null); return; }
    onUrlChange?.(url);
    let cancelled = false;
    fetchPreview(url)
      .then((p) => { if (!cancelled) { setPreview(p); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, [url, onUrlChange]);

  if (!url) {
    return (
      <div className={cn("flex items-center gap-1.5 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-2.5 py-1.5 text-[10px] text-muted-foreground", className)}>
        <Link2 className="h-3 w-3" /> Paste a URL in the caption to see its preview here.
      </div>
    );
  }

  const refresh = async () => {
    setRefreshing(true);
    cache.delete(url);
    try {
      const p = await fetchPreview(url);
      setPreview(p);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  };

  const ageMin = preview ? Math.max(0, Math.round((Date.now() - new Date(preview.fetchedAt).getTime()) / 60_000)) : 0;
  const stale = ageMin > 30;

  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card/95 p-2.5 shadow-sm", className)}>
      <div className="flex items-start gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Link2 className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-[11px] font-semibold text-foreground underline-offset-2 hover:underline"
            >
              {preview?.siteName ?? url}
            </a>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-2.5 w-2.5" /> open
            </a>
          </div>
          {error ? (
            <p className="mt-1 text-[10px] text-rose-500">{error}</p>
          ) : preview ? (
            <>
              <p className="mt-0.5 line-clamp-1 text-[11px] font-medium leading-tight">{preview.title}</p>
              <p className="line-clamp-2 text-[10px] text-muted-foreground">{preview.description}</p>
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground">Fetching preview…</p>
          )}
          <div className="mt-1.5 flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[10px]"
              onClick={refresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("mr-1 h-2.5 w-2.5", refreshing && "animate-spin")} />
              {stale ? "Stale · refresh" : "Refresh preview"}
            </Button>
            <span className="text-[9px] text-muted-foreground">
              {ageMin === 0 ? "just now" : `${ageMin} min ago`}
            </span>
            {onClear && (
              <Button size="sm" variant="ghost" className="ml-auto h-6 px-1.5 text-[10px] text-muted-foreground" onClick={onClear}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
