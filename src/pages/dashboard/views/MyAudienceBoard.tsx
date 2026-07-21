import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Users, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlatformIcon } from "@/components/shared/PlatformIcon";

interface AccountRow {
  id: string;
  platform_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  engagement: number | null;
  health_score: number | null;
  last_sync: string | null;
}

interface SnapshotDelta {
  account_id: string;
  delta: number | null;
  captured_at: string;
}

export default function MyAudienceBoard() {
  const { user, isGuest } = useAuthUser();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [deltas, setDeltas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAll = async () => {
    if (!user || isGuest) { setAccounts([]); setLoading(false); return; }
    setLoading(true);
    const [accRes, snapRes] = await Promise.all([
      supabase.from("social_accounts").select("*").order("followers", { ascending: false }),
      supabase.from("follower_snapshots").select("account_id, delta, captured_at").order("captured_at", { ascending: false }).limit(200),
    ]);
    const accs = ((accRes.data as AccountRow[] | null) ?? []);
    const snapshots = ((snapRes.data as SnapshotDelta[] | null) ?? []);
    const latestDelta: Record<string, number> = {};
    for (const s of snapshots) {
      if (!(s.account_id in latestDelta) && typeof s.delta === "number") latestDelta[s.account_id] = s.delta;
    }
    setAccounts(accs);
    setDeltas(latestDelta);
    setLoading(false);
  };

  useEffect(() => {
    void fetchAll();
    if (!user || isGuest) return;
    const ch = supabase.channel(`my-audience:${user.id}:${crypto.randomUUID()}`)
      .on("postgres_changes" as never, { event: "*", schema: "public", table: "social_accounts", filter: `user_id=eq.${user.id}` }, () => void fetchAll())
      .on("postgres_changes" as never, { event: "INSERT", schema: "public", table: "follower_snapshots", filter: `user_id=eq.${user.id}` }, () => void fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isGuest]);

  const filtered = useMemo(
    () => accounts.filter((a) => !search || (a.username + " " + (a.display_name ?? "")).toLowerCase().includes(search.toLowerCase())),
    [accounts, search],
  );

  const totalFollowers = accounts.reduce((s, a) => s + (a.followers ?? 0), 0);
  const totalDelta = Object.values(deltas).reduce((s, d) => s + d, 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-24 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-xl border border-border/60 bg-card/60 p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total followers</p>
          <p className="text-lg font-bold">{totalFollowers.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Net change (24h)</p>
          <p className={`text-lg font-bold flex items-center gap-1 ${totalDelta >= 0 ? "text-primary" : "text-destructive"}`}>
            {totalDelta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {totalDelta >= 0 ? "+" : ""}{totalDelta.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Accounts</p>
          <p className="text-lg font-bold">{accounts.length}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg engagement</p>
          <p className="text-lg font-bold">
            {accounts.length ? (accounts.reduce((s, a) => s + Number(a.engagement ?? 0), 0) / accounts.length).toFixed(2) : "0.00"}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts…" className="w-full sm:w-64" />
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {!user || isGuest ? (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          <Users className="h-6 w-6 mx-auto mb-2 opacity-70" />
          Sign in and connect an account to see your real audience.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          <Users className="h-6 w-6 mx-auto mb-2 opacity-70" />
          {loading ? "Loading your audience…" : "No connected accounts match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((a) => {
            const d = deltas[a.id] ?? 0;
            return (
              <div key={a.id} className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-md p-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <PlatformIcon platform={a.platform_id} size="sm" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{a.display_name || a.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{a.username} · {a.platform_id}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{(a.followers ?? 0).toLocaleString()}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 text-center gap-1">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Δ 24h</p>
                    <p className={`text-xs font-semibold ${d >= 0 ? "text-primary" : "text-destructive"}`}>{d >= 0 ? "+" : ""}{d}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Posts</p>
                    <p className="text-xs font-semibold">{a.posts ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Eng.</p>
                    <p className="text-xs font-semibold">{Number(a.engagement ?? 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
