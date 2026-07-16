import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Sparkles, Zap, X, TrendingUp, GitMerge } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import type { Segment } from "@/pages/dashboard/views/SegmentsBoard";

/** Deterministic hash → seeded PRNG so sample rows are stable per segment. */
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HANDLES = [
  "jordan.creates", "leo.builds", "maya.mint", "kai.stories", "nova.reels",
  "ari.threads", "sky.blog", "zoe.pixel", "ren.frames", "iris.notes",
  "quinn.trends", "rio.craft", "sage.viral", "eli.mood", "vera.grid",
  "hana.pins", "milo.beats", "cleo.brand",
];

function pick<T>(arr: readonly T[], rng: () => number) {
  return arr[Math.floor(rng() * arr.length)];
}

function estimatedCount(seed: number, s: Segment): number {
  const rng = mulberry(seed);
  let base = 8_000 + Math.floor(rng() * 12_000);
  if (s.followerBucket === "1k") base *= 6;
  else if (s.followerBucket === "10k") base *= 3;
  else if (s.followerBucket === "100k") base = Math.round(base * 1.2);
  else if (s.followerBucket === "1m") base = Math.round(base * 0.4);
  if (s.engagementBucket === "high") base = Math.round(base * 0.35);
  else if (s.engagementBucket === "mid") base = Math.round(base * 0.75);
  base *= Math.max(1, s.platforms.length);
  if (s.keywords.length > 0) base = Math.round(base * (0.5 + 0.2 * Math.min(3, s.keywords.length)));
  return base;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const FOLLOWER_LABELS: Record<string, string> = {
  any: "Any size", "1k": "< 1k", "10k": "1k – 10k", "100k": "10k – 100k", "1m": "100k+",
};
const ENGAGEMENT_LABELS: Record<string, string> = {
  any: "Any engagement", low: "< 2%", mid: "2 – 5%", high: "5%+",
};

interface Props {
  segment: Segment | null;
  onClose: () => void;
}

export function SegmentPreviewSheet({ segment, onClose }: Props) {
  const navigate = useNavigate();
  const { items: allSegments } = useLocalCollection<Segment>("audience", "segments");

  const preview = useMemo(() => {
    if (!segment) return null;
    const seed = hashSeed(segment.id);
    const rng = mulberry(seed);
    const platforms = segment.platforms.length > 0 ? segment.platforms : ["instagram"];
    const total = estimatedCount(seed, segment);
    const samples = Array.from({ length: 8 }).map((_, i) => {
      const platform = pick(platforms, rng);
      const handleBase = pick(HANDLES, rng);
      const followerBase =
        segment.followerBucket === "1k"
          ? 200 + Math.floor(rng() * 800)
          : segment.followerBucket === "10k"
            ? 1000 + Math.floor(rng() * 9_000)
            : segment.followerBucket === "100k"
              ? 10_000 + Math.floor(rng() * 90_000)
              : segment.followerBucket === "1m"
                ? 100_000 + Math.floor(rng() * 400_000)
                : 500 + Math.floor(rng() * 50_000);
      const engagement =
        segment.engagementBucket === "high"
          ? 5 + rng() * 4
          : segment.engagementBucket === "mid"
            ? 2 + rng() * 3
            : segment.engagementBucket === "low"
              ? rng() * 2
              : rng() * 8;
      return {
        id: `${platform}:${handleBase}:${i}`,
        handle: `@${handleBase}${i > 5 ? i : ""}`,
        platform,
        followers: followerBase,
        engagement: Number(engagement.toFixed(1)),
      };
    });
    return { total, samples };
  }, [segment]);

  const platformCount = segment?.platforms.length ?? 0;
  const keywordCount = segment?.keywords.length ?? 0;

  return (
    <Sheet open={!!segment} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {segment && preview && (
          <>
            <SheetHeader>
              <SheetTitle>Preview: {segment.title}</SheetTitle>
              <SheetDescription>
                Estimated match count and a stable sample of accounts before you run automation.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 py-5">
              {/* Estimate */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Estimated matches
                </div>
                <p className="text-4xl font-bold text-primary mt-1">~{fmt(preview.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on platform × follower band × engagement × keyword criteria.
                </p>
              </div>

              {/* Criteria chips with counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <CriteriaTile label="Platforms" count={platformCount} sub={segment.platforms.join(", ") || "any"} />
                <CriteriaTile label="Followers" count={1} sub={FOLLOWER_LABELS[segment.followerBucket] ?? "Any"} />
                <CriteriaTile label="Engagement" count={1} sub={ENGAGEMENT_LABELS[segment.engagementBucket] ?? "Any"} />
                <CriteriaTile label="Keywords" count={keywordCount} sub={segment.keywords.join(", ") || "none"} />
              </div>

              {/* Platforms */}
              {segment.platforms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">Targeting</span>
                  {segment.platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="gap-1 capitalize">
                      <PlatformIcon platform={p} size="xs" />
                      {p}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Sample accounts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Sample accounts
                  </p>
                  <span className="text-[11px] text-muted-foreground">8 of ~{fmt(preview.total)}</span>
                </div>
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium px-3 py-2">Account</th>
                        <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Platform</th>
                        <th className="text-right font-medium px-3 py-2">Followers</th>
                        <th className="text-right font-medium px-3 py-2">Eng.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.samples.map((row) => (
                        <tr key={row.id} className="border-t border-border/60 hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{row.handle}</td>
                          <td className="px-3 py-2 hidden sm:table-cell">
                            <span className="inline-flex items-center gap-1 capitalize text-muted-foreground">
                              <PlatformIcon platform={row.platform} size="xs" />
                              {row.platform}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(row.followers)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-primary">{row.engagement}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Sample is deterministic per segment — the same segment always shows the same preview until
                  criteria change.
                </p>
              </div>
            </div>

            <SheetFooter className="gap-2 sm:gap-2">
              <Button variant="ghost" onClick={onClose} aria-label="Close preview">
                <X className="h-4 w-4 mr-1" /> Close
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  navigate(`/dashboard/engage/bot?segmentId=${encodeURIComponent(segment.id)}`);
                }}
                aria-label="Run automation with this segment"
              >
                <Zap className="h-4 w-4 mr-1.5" /> Run automation
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CriteriaTile({ label, count, sub }: { label: string; count: number; sub: string }) {
  return (
    <div className="p-2.5 rounded-lg border border-border/60 bg-card/40">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-primary">{count}</span>
      </div>
      <p className="text-xs mt-0.5 truncate" title={sub}>
        {sub}
      </p>
    </div>
  );
}
