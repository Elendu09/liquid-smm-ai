import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Target, Plus, Trash2, Star, Archive, Search, ExternalLink, TrendingUp, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useCompetitors, type Competitor, type CompetitorSnapshot } from "@/hooks/useCompetitors";
import { AddCompetitorDialog } from "@/components/audience/AddCompetitorDialog";
import { GitHubResearchDialog } from "@/components/audience/GitHubResearchDialog";
import { emitAppNotification } from "@/lib/notifications/emit";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

const FILTER_PLATFORMS = ["all", "instagram", "tiktok", "youtube", "twitter", "linkedin", "facebook", "github", "threads", "pinterest", "reddit"];

function profileUrl(c: Competitor): string | null {
  const h = c.handle.replace(/^@/, "");
  switch (c.platform.toLowerCase()) {
    case "instagram": return `https://instagram.com/${h}`;
    case "twitter": return `https://x.com/${h}`;
    case "youtube": return `https://youtube.com/@${h}`;
    case "tiktok": return `https://tiktok.com/@${h}`;
    case "linkedin": return `https://linkedin.com/company/${h}`;
    case "facebook": return `https://facebook.com/${h}`;
    case "github": return `https://github.com/${h}`;
    case "threads": return `https://threads.net/@${h}`;
    case "pinterest": return `https://pinterest.com/${h}`;
    case "reddit": return `https://reddit.com/u/${h}`;
    default: return null;
  }
}

export default function CompetitorsBoard() {
  const { items, add, update, remove, recordSnapshot } = useCompetitors();
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [detail, setDetail] = useState<Competitor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);

  const filtered = useMemo(() => items.filter((c) => {
    if (platform !== "all" && c.platform.toLowerCase() !== platform) return false;
    if (search && !(c.handle + (c.displayName ?? "") + (c.notes ?? "")).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, platform, search]);

  const sel = useBulkSelection<string>(filtered.map((c) => c.id));

  const bulkDelete = async () => {
    const ids = sel.ids;
    for (const id of ids) await remove(id);
    toast.success(`Removed ${ids.length} competitor${ids.length === 1 ? "" : "s"}`);
    sel.clear();
    setConfirmDelete(null);
  };
  const bulkPromote = async (status: Competitor["status"]) => {
    for (const id of sel.ids) await update(id, { status });
    toast.success(`Moved ${sel.count} to ${status}`);
    sel.clear();
  };

  const track = async (v: { username: string; platform: string; notes?: string; displayName?: string }) => {
    await add({
      id: crypto.randomUUID(),
      handle: v.username,
      platform: v.platform,
      displayName: v.displayName,
      notes: v.notes,
      status: "tracking",
      followersHistory: [],
      createdAt: new Date().toISOString(),
    });
    toast.success(`Now tracking ${v.username}`);
    void emitAppNotification({
      type: "system",
      severity: "success",
      title: "Competitor added",
      message: `Now tracking ${v.username} on ${v.platform}.`,
      actionUrl: "/dashboard/audience/competitors",
      groupKey: `competitor:${v.platform}:${v.username.toLowerCase()}`,
    });
  };

  const recordNow = async () => {
    if (!detail) return;
    const guess = window.prompt("Follower count to log:", String(detail.followers ?? ""));
    if (guess === null) return;
    const n = Number(guess);
    if (Number.isNaN(n) || n < 0) { toast.error("Enter a valid follower count"); return; }
    await recordSnapshot(detail.id, n);
    toast.success("Snapshot recorded");
    setDetail((d) => (d ? { ...d, followers: n, followersHistory: [...(d.followersHistory ?? []), { at: new Date().toISOString(), followers: n }] } : d));
  };

  const snapshots = detail?.followersHistory ?? [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-24">
      <div className="flex flex-wrap items-center gap-2 py-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search competitors…" className="w-full sm:w-64" />
        <div className="flex items-center gap-1 flex-wrap">
          {FILTER_PLATFORMS.map((p) => (
            <button key={p} onClick={() => setPlatform(p)} className={`h-8 px-2.5 rounded-md text-xs border ${platform === p ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted"}`}>
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setResearchOpen(true)}>
            <Github className="h-4 w-4 mr-1" /> Research
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Track competitor
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          <Target className="h-6 w-6 mx-auto mb-2 opacity-70" />
          No competitors yet. Track one to benchmark cadence, followers and engagement — or research GitHub repos.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((c) => {
            const checked = sel.isSelected(c.id);
            const url = profileUrl(c);
            return (
              <div key={c.id} className={`rounded-xl border p-3 bg-card/60 backdrop-blur-md transition ${checked ? "border-primary/60 ring-1 ring-primary/40" : "border-border/60"}`}>
                <div className="flex items-start gap-2">
                  <Checkbox checked={checked} onCheckedChange={() => sel.toggle(c.id)} aria-label={`Select ${c.handle}`} className="mt-1" />
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <PlatformIcon platform={c.platform.toLowerCase()} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button type="button" onClick={() => setDetail(c)} className="text-left w-full group" title="View details">
                      <p className="text-sm font-semibold truncate group-hover:underline">{c.handle}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.displayName ?? c.platform}
                        {typeof c.followers === "number" && ` · ${c.followers.toLocaleString()} followers`}
                      </p>
                    </button>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <Badge variant={c.status === "priority" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                        {c.status}
                      </Badge>
                      {c.platform.toLowerCase() === "github" && <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border/50"><Github className="h-2.5 w-2.5 mr-1" />Repo</Badge>}
                      {c.notes && <span className="text-[11px] text-muted-foreground line-clamp-1">{c.notes}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetail(c)} aria-label="Details">
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update(c.id, { status: c.status === "priority" ? "tracking" : "priority" })} aria-label="Toggle priority">
                    <Star className={`h-3.5 w-3.5 ${c.status === "priority" ? "fill-current text-primary" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update(c.id, { status: "archived" })} aria-label="Archive">
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setConfirmDelete([c.id])} aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                    View profile <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <BulkActionBar
        count={sel.count}
        onClear={sel.clear}
        actions={[
          { id: "priority", label: "Mark priority", icon: Star, onClick: () => bulkPromote("priority") },
          { id: "archive", label: "Archive", icon: Archive, onClick: () => bulkPromote("archived") },
          { id: "delete", label: "Delete", icon: Trash2, variant: "destructive", onClick: () => setConfirmDelete(sel.ids) },
        ]}
      />

      <AddCompetitorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(v) => void track({ username: v.username, platform: v.platform, notes: v.notes })}
      />

      <GitHubResearchDialog
        open={researchOpen}
        onOpenChange={setResearchOpen}
        onAdd={(v) => { void track(v); setResearchOpen(false); }}
      />

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PlatformIcon platform={detail.platform.toLowerCase()} size="sm" />
                  <span className="truncate">{detail.handle}</span>
                  {profileUrl(detail) && (
                    <a href={profileUrl(detail)!} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {detail.displayName ?? detail.platform} · {detail.status}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {detail.notes && (
                  <p className="text-sm text-muted-foreground">{detail.notes}</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">
                    {typeof detail.followers === "number" ? detail.followers.toLocaleString() : "—"}
                  </div>
                  <span className="text-xs text-muted-foreground">followers</span>
                  <Button size="sm" variant="outline" className="ml-auto gap-1" onClick={recordNow}>
                    <TrendingUp className="h-3.5 w-3.5" /> Log snapshot
                  </Button>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Growth history ({snapshots.length})
                  </div>
                  {snapshots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No snapshots yet. Log one to start tracking growth over time.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {[...snapshots].reverse().slice(0, 12).map((s: CompetitorSnapshot, i) => (
                        <div key={s.at} className="flex items-center justify-between text-xs rounded-lg border border-border/50 bg-background/40 px-3 py-2">
                          <span className="text-muted-foreground">{formatDistanceToNow(new Date(s.at))} ago</span>
                          <span className="font-medium">{s.followers.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDetail(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDelete?.length ?? 0} competitor{(confirmDelete?.length ?? 0) === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>Historical data stays but they'll stop appearing in benchmarks.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const ids = confirmDelete ?? [];
                for (const id of ids) await remove(id);
                toast.success(`Removed ${ids.length}`);
                sel.clear();
                setConfirmDelete(null);
              }}
            >Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
