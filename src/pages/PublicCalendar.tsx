import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/shared/PlatformIcon";

interface ShareConfig {
  token: string;
  showDrafts: boolean;
  showAnalytics: boolean;
  createdAt: string;
}

interface PublicPost {
  id: string;
  caption: string;
  scheduledAt: string;
  platformIds: string[];
  approvalStatus?: string;
  status?: string;
  mediaUrl?: string;
}

function readShare(): ShareConfig | null {
  try { return JSON.parse(localStorage.getItem("smmpilot:calendar-share") || "null"); } catch { return null; }
}
function readPosts(): PublicPost[] {
  try { return JSON.parse(localStorage.getItem("smmpilot:scheduled-posts") || "[]"); } catch { return []; }
}

/**
 * Public read-only calendar view. Renders when the URL token matches the
 * share config stored locally by PublicCalendarShareDialog. When accessed
 * from a different device/browser the config is absent — we show a clear
 * "link inactive" state instead of a 404 so users understand what happened.
 */
export default function PublicCalendar() {
  const { token = "" } = useParams();
  const share = readShare();
  const allPosts = readPosts();

  const authorized = share && share.token === token;

  const grouped = useMemo(() => {
    if (!authorized) return [] as { day: string; items: PublicPost[] }[];
    const visible = allPosts.filter((p) => {
      if (!share!.showDrafts && p.approvalStatus === "draft") return false;
      return true;
    });
    const byDay = new Map<string, PublicPost[]>();
    visible.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    for (const p of visible) {
      const d = new Date(p.scheduledAt);
      const key = d.toDateString();
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(p);
    }
    return Array.from(byDay.entries()).map(([day, items]) => ({ day, items }));
  }, [authorized, allPosts, share]);

  if (!authorized) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold">Link inactive</h1>
          <p className="text-sm text-muted-foreground">
            This calendar share link is invalid, expired, or was rotated. Ask the workspace owner for a new link.
          </p>
          <Button asChild variant="outline" className="rounded-full"><Link to="/">Back to homepage</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">Content calendar</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3 w-3" /> Read-only public view
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Shared</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">No scheduled posts to show.</div>
        ) : (
          grouped.map(({ day, items }) => (
            <section key={day} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sticky top-[73px] bg-background/80 backdrop-blur py-1.5">
                {new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </div>
              <ul className="space-y-2">
                {items.map((p) => (
                  <li key={p.id} className="rounded-xl border border-border/60 bg-card/60 p-3 sm:p-4 flex gap-3">
                    <div className="text-xs tabular-nums text-muted-foreground w-14 shrink-0 pt-0.5">
                      {new Date(p.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm line-clamp-3">{p.caption || "Untitled post"}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.platformIds?.map((id) => (
                          <PlatformIcon key={id} platformId={id} className="w-3.5 h-3.5" />
                        ))}
                        {p.status && (
                          <Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>

      <footer className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center text-[11px] text-muted-foreground">
        Powered by your SMM workspace · view-only
      </footer>
    </div>
  );
}
