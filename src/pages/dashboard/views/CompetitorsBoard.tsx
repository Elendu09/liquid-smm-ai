import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Target, Plus, Trash2, Star, Archive, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useCompetitors, type Competitor } from "@/hooks/useCompetitors";
import { AddCompetitorDialog } from "@/components/audience/AddCompetitorDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CompetitorsBoard() {
  const { items, add, update, remove } = useCompetitors();
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-24">
      <div className="flex flex-wrap items-center gap-2 py-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search competitors…" className="w-full sm:w-64" />
        <div className="flex items-center gap-1">
          {["all", "instagram", "tiktok", "youtube", "twitter", "linkedin", "facebook"].map((p) => (
            <button key={p} onClick={() => setPlatform(p)} className={`h-8 px-2.5 rounded-md text-xs border ${platform === p ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted"}`}>
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Track competitor
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          <Target className="h-6 w-6 mx-auto mb-2 opacity-70" />
          No competitors yet. Track one to benchmark cadence, followers and engagement.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((c) => {
            const checked = sel.isSelected(c.id);
            return (
              <div key={c.id} className={`rounded-xl border p-3 bg-card/60 backdrop-blur-md transition ${checked ? "border-primary/60 ring-1 ring-primary/40" : "border-border/60"}`}>
                <div className="flex items-start gap-2">
                  <Checkbox checked={checked} onCheckedChange={() => sel.toggle(c.id)} aria-label={`Select ${c.handle}`} className="mt-1" />
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <PlatformIcon platform={c.platform.toLowerCase()} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.handle}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.displayName ?? c.platform}
                      {typeof c.followers === "number" && ` · ${c.followers.toLocaleString()} followers`}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <Badge variant={c.status === "priority" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                        {c.status}
                      </Badge>
                      {c.notes && <span className="text-[11px] text-muted-foreground line-clamp-1">{c.notes}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-1">
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
        onAdd={async (v) => {
          await add({
            id: crypto.randomUUID(),
            handle: v.username,
            platform: v.platform,
            notes: v.notes,
            status: "tracking",
            createdAt: new Date().toISOString(),
          });
          toast.success(`Now tracking ${v.username}`);
        }}
      />

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
