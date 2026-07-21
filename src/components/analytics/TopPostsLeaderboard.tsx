import { useMemo, useState } from "react";
import { Heart, MessageCircle, Share2, Eye, Trophy, Sparkles, Bookmark } from "lucide-react";
import { useAccounts } from "@/contexts/AccountContext";
import { useGuest } from "@/hooks/useGuest";
import { useTopPosts, type TopPostSort } from "@/hooks/useTopPosts";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { RANGE_DAYS, type RangeKey } from "@/hooks/useAnalyticsSeries";

const GUEST_TITLES = [
  "3 mistakes killing your reach",
  "Behind the scenes of a viral drop",
  "The 60-second content system",
  "How we grew 10k in 30 days",
  "Steal this hook formula",
  "AI tools we actually use daily",
];

export function TopPostsLeaderboard({ range = "30D" as RangeKey }: { range?: RangeKey }) {
  const { accounts } = useAccounts();
  const { isGuest } = useGuest();
  const [sort, setSort] = useState<TopPostSort>("engagement");
  const days = RANGE_DAYS[range] ?? 30;
  const { posts, loading } = useTopPosts({ days, sort, limit: 6 });

  const guestPosts = useMemo(() => {
    if (!isGuest) return [];
    return GUEST_TITLES.map((title, i) => {
      const acc = accounts[i % Math.max(accounts.length, 1)];
      const seed = (i + 1) * 7919;
      const likes = 400 + (seed % 4200);
      const comments = 20 + (seed % 380);
      const shares = 5 + (seed % 220);
      const saves = 10 + (seed % 320);
      const reach = 3_000 + (seed % 42_000);
      const er = ((likes + comments * 2 + shares * 3 + saves * 2) / Math.max(reach, 1)) * 100;
      return {
        id: `p-${i}`, postId: `p-${i}`, accountId: acc?.id ?? "",
        account: acc, caption: title,
        publishedAt: new Date().toISOString(),
        likes, comments, shares, saves, reach, impressions: reach * 2, engagement: er,
      };
    }).sort((a: any, b: any) => b[sort] - a[sort]);
  }, [accounts, isGuest, sort]);

  const list = isGuest ? guestPosts : posts;

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="text-base font-semibold">Top performing posts</h3>
          {isGuest && <Sparkles className="h-3 w-3 text-amber-500" />}
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted/60 text-xs">
          {(["engagement", "reach", "likes", "saves", "shares"] as TopPostSort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "px-2 py-1 rounded-md font-medium capitalize transition-colors",
                sort === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {loading && !isGuest ? (
        <div className="p-6 text-center text-xs text-muted-foreground">Loading top posts…</div>
      ) : list.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Trophy}
            title="No post metrics yet"
            description={accounts.length === 0
              ? "Connect an account and publish a few posts — top performers will appear here."
              : "Publish and give the collector a minute — top performers will surface automatically."}
            ctaHref={accounts.length === 0 ? "/dashboard/settings" : "/dashboard/publish/scheduler"}
            ctaLabel={accounts.length === 0 ? "Connect account" : "Schedule a post"}
            compact
          />
        </div>
      ) : (
        <ol className="divide-y divide-border/50">
          {list.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0",
                  i === 0
                    ? "bg-amber-500/20 text-amber-500"
                    : i === 1
                      ? "bg-slate-400/20 text-slate-300"
                      : i === 2
                        ? "bg-orange-600/20 text-orange-400"
                        : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              {p.account && <PlatformIcon platform={p.account.platformId} size="sm" showBackground />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.caption}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {p.account ? `@${p.account.username}` : "—"}
                  {p.publishedAt ? ` · ${new Date(p.publishedAt).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {p.likes.toLocaleString()}</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {p.comments}</span>
                <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {p.shares}</span>
                <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" /> {p.saves}</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {(p.reach / 1000).toFixed(1)}k</span>
              </div>
              <span className="text-sm font-semibold text-primary tabular-nums shrink-0 w-14 text-right">
                {p.engagement.toFixed(1)}%
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
