import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Target, Plus, Copy, Zap, Trash2, X, Eye } from "lucide-react";
import { SegmentPreviewSheet } from "@/components/dashboard/segments/SegmentPreviewSheet";
import { RunAutomationDialog } from "@/components/engage/RunAutomationDialog";
import { NewSegmentDialog } from "@/components/audience/NewSegmentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  KanbanBoard,
  ListView,
  type KanbanColumnDef,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useAudienceSegments, type AudienceSegment } from "@/hooks/useAudienceSegments";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { cn } from "@/lib/utils";

type SegmentStatus = "active" | "testing" | "paused";

const FOLLOWER_BUCKETS = [
  { id: "any", label: "Any size" },
  { id: "1k", label: "< 1k" },
  { id: "10k", label: "1k – 10k" },
  { id: "100k", label: "10k – 100k" },
  { id: "1m", label: "100k+" },
] as const;

const ENGAGEMENT_BUCKETS = [
  { id: "any", label: "Any" },
  { id: "low", label: "Low (< 2%)" },
  { id: "mid", label: "Mid (2 – 5%)" },
  { id: "high", label: "High (5%+)" },
] as const;

const PLATFORM_OPTIONS = ["instagram", "tiktok", "youtube", "twitter", "facebook", "linkedin"];

const NICHE_OPTIONS = [
  "Fitness & wellness",
  "SaaS & tech",
  "Fashion & beauty",
  "Food & drink",
  "Travel",
  "Finance",
  "Education",
  "Gaming",
  "Music",
  "Art & design",
] as const;

export interface Segment {
  id: string;
  title: string;
  description: string;
  status: SegmentStatus;
  niche?: string;
  platforms: string[];
  followerBucket: string;
  engagementBucket: string;
  keywords: string[];
  createdAt: string;
}

const columns: KanbanColumnDef<SegmentStatus>[] = [
  { id: "active", label: "Active" },
  { id: "testing", label: "Testing" },
  { id: "paused", label: "Paused" },
];

const seed: Segment[] = [
  {
    id: "s1",
    title: "Micro fitness creators",
    description: "US-based creators, 1–10k, high engagement, wellness niche",
    status: "active",
    niche: "Fitness & wellness",
    platforms: ["instagram", "tiktok"],
    followerBucket: "10k",
    engagementBucket: "high",
    keywords: ["fitness", "wellness", "workout"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s2",
    title: "SaaS founders",
    description: "LinkedIn + X, mid-tier, product & startup keywords",
    status: "testing",
    niche: "SaaS & tech",
    platforms: ["linkedin", "twitter"],
    followerBucket: "100k",
    engagementBucket: "mid",
    keywords: ["saas", "founder", "startup"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s3",
    title: "Retired Q3 audience",
    description: "Winter campaign leftovers",
    status: "paused",
    platforms: ["facebook"],
    followerBucket: "any",
    engagementBucket: "any",
    keywords: [],
    createdAt: new Date().toISOString(),
  },
];

function estimatedSize(s: Segment): string {
  let base = 12_000;
  if (s.followerBucket === "1k") base *= 8;
  else if (s.followerBucket === "10k") base *= 4;
  else if (s.followerBucket === "100k") base *= 1;
  else if (s.followerBucket === "1m") base = Math.round(base * 0.3);
  if (s.engagementBucket === "high") base = Math.round(base * 0.4);
  else if (s.engagementBucket === "mid") base = Math.round(base * 0.8);
  base *= Math.max(1, s.platforms.length);
  if (s.keywords.length > 0) base = Math.round(base * (0.5 + 0.2 * Math.min(3, s.keywords.length)));
  if (base >= 1_000_000) return `~${(base / 1_000_000).toFixed(1)}M`;
  if (base >= 1_000) return `~${Math.round(base / 100) / 10}k`;
  return `~${base}`;
}

export default function SegmentsBoard() {
  const [view, setView] = useViewMode("audience-segments", "kanban");
  const { items, add, update, remove } = useAudienceSegments();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Segment | null>(null);
  const [previewing, setPreviewing] = useState<Segment | null>(null);
  const [runSegmentId, setRunSegmentId] = useState<string | null>(null);
  const [runMulti, setRunMulti] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Segment | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(
    () =>
      items.filter((s) =>
        !search
          ? true
          : (s.title + s.description + s.keywords.join(" ")).toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const startNew = () => {
    const s: Segment = {
      id: crypto.randomUUID(),
      title: "New segment",
      description: "",
      status: "testing",
      platforms: [],
      followerBucket: "any",
      engagementBucket: "any",
      keywords: [],
      createdAt: new Date().toISOString(),
    };
    add(s);
    setEditing(s);
  };

  const duplicate = (s: Segment) => {
    add({ ...s, id: crypto.randomUUID(), title: `${s.title} (copy)`, createdAt: new Date().toISOString() });
    toast.success("Segment duplicated");
  };

  const sel = useBulkSelection<string>(filtered.map((s) => s.id));

  const bulkDuplicate = async () => {
    const ids = sel.ids;
    const map = new Map(items.map((x) => [x.id, x]));
    for (const id of ids) {
      const s = map.get(id);
      if (s) await add({ ...s, id: crypto.randomUUID(), title: `${s.title} (copy)`, createdAt: new Date().toISOString() } as AudienceSegment);
    }
    toast.success(`Duplicated ${ids.length} segment${ids.length === 1 ? "" : "s"}`);
    sel.clear();
  };

  const bulkDelete = async () => {
    const ids = sel.ids;
    for (const id of ids) await remove(id);
    toast.success(`Deleted ${ids.length} segment${ids.length === 1 ? "" : "s"}`);
    sel.clear();
    setBulkDeleteOpen(false);
  };

  const card = (s: Segment, dense = false) => {
    const size = estimatedSize(s);
    const fb = FOLLOWER_BUCKETS.find((f) => f.id === s.followerBucket)?.label ?? "Any";
    const eb = ENGAGEMENT_BUCKETS.find((f) => f.id === s.engagementBucket)?.label ?? "Any";
    const checked = sel.isSelected(s.id);
    return (
      <div className={cn(dense ? "p-3" : "p-3", checked && "bg-primary/5 ring-1 ring-primary/30 rounded-lg")}>
        <div className="flex items-start gap-2">
          <Checkbox checked={checked} onCheckedChange={() => sel.toggle(s.id)} aria-label={`Select ${s.title}`} className="mt-1" />
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold truncate">{s.title}</p>
              <span className="text-[11px] text-primary font-medium shrink-0">{size}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {s.description || "No description"}
            </p>
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {s.platforms.slice(0, 4).map((p) => (
                <PlatformIcon key={p} platform={p} size="xs" showBackground />
              ))}
              {s.niche && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
                  {s.niche}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {fb}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {eb}
              </Badge>
              {s.keywords.slice(0, 2).map((k) => (
                <Badge key={k} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  {k}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-1 mt-2 flex-wrap">
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Preview segment" onClick={() => setPreviewing(s)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Duplicate segment" onClick={() => duplicate(s)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Run automation with this segment" onClick={() => setRunSegmentId(s.id)}>
            <Zap className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(s)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            aria-label="Delete segment"
            onClick={() => setDeleteTarget(s)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <ToolbarBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search segments…"
        viewToggle={<ViewToggle value={view} onChange={setView} />}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setRunMulti(true); setRunSegmentId(items[0]?.id || "__multi__"); }} aria-label="Run automation across multiple audiences">
              <Zap className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Run automation</span>
            </Button>
            <Button size="sm" onClick={() => setNewOpen(true)} aria-label="New segment">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">New segment</span>
            </Button>
          </div>
        }
      />

      {view === "kanban" ? (
        <KanbanBoard
          columns={columns}
          items={filtered}
          getKey={(s) => s.id}
          getStatus={(s) => s.status}
          onMove={(item, _from, to) => {
            update(item.id, { status: to });
            toast.success(`Moved to ${to}`);
          }}
          renderItem={(s) => card(s)}
        />
      ) : (
        <ListView items={filtered} getKey={(s) => s.id} renderItem={(s) => card(s, true)} />
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {editing && (
            <>
              <SheetHeader>
                <SheetTitle>Edit segment</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                  <Input
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    aria-label="Segment name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                  <Textarea
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={3}
                    aria-label="Segment description"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Niche</label>
                  <div className="flex flex-wrap gap-1.5">
                    {NICHE_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setEditing({ ...editing, niche: editing.niche === n ? undefined : n })}
                        aria-pressed={editing.niche === n}
                        className={cn(
                          "px-2.5 h-8 rounded-md border text-xs",
                          editing.niche === n
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Platforms</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORM_OPTIONS.map((p) => {
                      const active = editing.platforms.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...editing,
                              platforms: active
                                ? editing.platforms.filter((x) => x !== p)
                                : [...editing.platforms, p],
                            })
                          }
                          aria-pressed={active}
                          className={cn(
                            "px-2.5 h-9 rounded-md border flex items-center gap-1.5 text-xs",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/60 text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <PlatformIcon platform={p} size="xs" />
                          <span className="capitalize">{p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Follower range</label>
                  <div className="flex flex-wrap gap-1.5">
                    {FOLLOWER_BUCKETS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setEditing({ ...editing, followerBucket: b.id })}
                        aria-pressed={editing.followerBucket === b.id}
                        className={cn(
                          "px-2.5 h-8 rounded-md border text-xs",
                          editing.followerBucket === b.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Engagement</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ENGAGEMENT_BUCKETS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setEditing({ ...editing, engagementBucket: b.id })}
                        aria-pressed={editing.engagementBucket === b.id}
                        className={cn(
                          "px-2.5 h-8 rounded-md border text-xs",
                          editing.engagementBucket === b.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Keywords / tags</label>
                  <Input
                    value={editing.keywords.join(" ")}
                    onChange={(e) =>
                      setEditing({ ...editing, keywords: e.target.value.split(/\s+/).filter(Boolean) })
                    }
                    placeholder="fitness wellness"
                    aria-label="Keywords"
                  />
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <p className="text-xs text-muted-foreground">Estimated reach</p>
                  <p className="text-2xl font-bold text-primary">{estimatedSize(editing)}</p>
                </div>
              </div>
              <SheetFooter className="gap-2 sm:gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)} aria-label="Cancel">
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button
                  onClick={() => {
                    update(editing.id, editing);
                    toast.success("Segment saved");
                    setEditing(null);
                  }}
                  aria-label="Save segment"
                >
                  Save
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <SegmentPreviewSheet segment={previewing} onClose={() => setPreviewing(null)} />

      <RunAutomationDialog
        open={!!runSegmentId}
        onOpenChange={(o) => { if (!o) { setRunSegmentId(null); setRunMulti(false); } }}
        presetSegmentId={runMulti ? null : runSegmentId}
        multi={runMulti}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete segment?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{deleteTarget?.title}</strong>. You can't undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  remove(deleteTarget.id);
                  toast.success("Segment deleted");
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewSegmentDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={(v) => {
          const s: Segment = {
            id: crypto.randomUUID(),
            title: v.title,
            description: v.description,
            status: "testing",
            niche: v.niche,
            platforms: v.platforms,
            followerBucket: v.followerBucket,
            engagementBucket: v.engagementBucket,
            keywords: v.keywords,
            createdAt: new Date().toISOString(),
          };
          add(s);
          toast.success("Segment created");
          setEditing(s);
        }}
      />

      <BulkActionBar
        count={sel.count}
        onClear={sel.clear}
        actions={[
          { id: "duplicate", label: "Duplicate", icon: Copy, onClick: bulkDuplicate },
          { id: "delete", label: "Delete", icon: Trash2, variant: "destructive", onClick: () => setBulkDeleteOpen(true) },
        ]}
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {sel.count} segment{sel.count === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone. Automations pointing to these segments will need to be updated.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={bulkDelete}>
              Delete {sel.count}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
