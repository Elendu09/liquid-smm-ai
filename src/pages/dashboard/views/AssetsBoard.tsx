import { useMemo, useState, DragEvent } from "react";
import { toast } from "sonner";
import {
  Upload, Trash2, Copy, Send, FileText, Film, FolderOpen, Image as ImageIcon,
  Search, Pencil, X, CheckSquare, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { UploadAssetDialog } from "@/components/library/UploadAssetDialog";
import { EditAssetDialog } from "@/components/library/EditAssetDialog";
import { AssetVersionsDialog } from "@/components/library/AssetVersionsDialog";
import { assetVersionsApi, getVersionCount } from "@/hooks/useAssetVersions";
import { EmptyState } from "@/components/shared/EmptyState";
import { PanelSection } from "@/components/shared/PanelSection";
import { MediaThumb } from "@/components/shared/MediaThumb";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  type: "image" | "video" | "doc";
  url: string;
  tags: string[];
  createdAt: string;
}

const seed: Asset[] = [
  { id: "a1", title: "Brand logo pack", subtitle: "SVG · 12 files", status: "active", type: "image", url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400", tags: ["brand", "logo"], createdAt: new Date().toISOString() },
  { id: "a2", title: "Q3 hero video", subtitle: "1080p · MP4 · 0:45", status: "active", type: "video", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", tags: ["campaign", "q3"], createdAt: new Date().toISOString() },
  { id: "a3", title: "Social media templates", subtitle: "Canva · 24 files", status: "active", type: "image", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400", tags: ["templates", "social"], createdAt: new Date().toISOString() },
  { id: "a4", title: "Campaign brief — Spring", subtitle: "PDF · 2.4 MB", status: "review", type: "doc", url: "", tags: ["brief", "spring"], createdAt: new Date().toISOString() },
  { id: "a5", title: "Product demo reel", subtitle: "4K · MP4 · 0:45", status: "active", type: "video", url: "https://images.unsplash.com/photo-1536243287037-7c2f5091c6de?w=600", tags: ["product", "reel"], createdAt: new Date().toISOString() },
  { id: "a6", title: "UGC collage", subtitle: "JPG · 8 images", status: "active", type: "image", url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400", tags: ["ugc", "community"], createdAt: new Date().toISOString() },
];

const ICONS = { image: ImageIcon, video: Film, doc: FileText } as const;

export default function AssetsBoard() {
  const { items, remove, update, setItems } = useLocalCollection<Asset>("library", "assets", seed);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [upload, setUpload] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [confirmDel, setConfirmDel] = useState<Asset | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDel, setBulkDel] = useState(false);
  const [pageDrag, setPageDrag] = useState(false);
  const [versionsFor, setVersionsFor] = useState<Asset | null>(null);
  const nav = useNavigate();

  const tags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((a) => a.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((a) => {
        if (activeTag && !a.tags?.includes(activeTag)) return false;
        if (!search) return true;
        return (a.title + " " + (a.subtitle ?? "") + " " + a.tags.join(" "))
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [items, search, activeTag],
  );

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const selectAllVisible = () => {
    const all = filtered.every((a) => selected.has(a.id));
    setSelected(all ? new Set() : new Set(filtered.map((a) => a.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const selectedAssets = useMemo(
    () => items.filter((a) => selected.has(a.id)),
    [items, selected],
  );

  const copyUrl = async (a: Asset) => {
    if (!a.url) return toast.error("No URL for this asset");
    await navigator.clipboard.writeText(a.url);
    toast.success("URL copied");
  };

  const bulkCopyUrls = async () => {
    const urls = selectedAssets.map((a) => a.url).filter(Boolean);
    if (urls.length === 0) return toast.error("No URLs on selected assets");
    await navigator.clipboard.writeText(urls.join("\n"));
    toast.success(`Copied ${urls.length} URL${urls.length > 1 ? "s" : ""}`);
  };

  const sendToStudio = (a: Asset) => {
    nav(`/dashboard/create/studio?assetUrl=${encodeURIComponent(a.url)}`);
    toast.success("Opened in Studio");
  };

  const bulkSendToStudio = () => {
    const urls = selectedAssets.map((a) => a.url).filter(Boolean);
    if (urls.length === 0) return toast.error("No URLs on selected assets");
    nav(`/dashboard/create/studio?assetUrls=${encodeURIComponent(urls.join(","))}`);
    toast.success(`Sent ${urls.length} to Studio`);
    clearSelection();
  };

  const bulkDelete = () => {
    const ids = new Set(selected);
    setItems((prev) => prev.filter((a) => !ids.has(a.id)));
    toast.success(`Deleted ${ids.size} asset${ids.size > 1 ? "s" : ""}`);
    clearSelection();
    setBulkDel(false);
  };

  // Page-level drag & drop
  const onPageDragOver = (e: DragEvent) => {
    if (Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      setPageDrag(true);
    }
  };
  const onPageDragLeave = (e: DragEvent) => {
    if (e.currentTarget === e.target) setPageDrag(false);
  };
  const onPageDrop = (e: DragEvent) => {
    e.preventDefault();
    setPageDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setDroppedFile(f);
    setUpload(true);
  };

  const allVisibleSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  return (
    <div
      className="px-4 sm:px-6 lg:px-8 pb-8 relative"
      onDragOver={onPageDragOver}
      onDragLeave={onPageDragLeave}
      onDrop={onPageDrop}
    >
      {pageDrag && (
        <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm border-4 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl bg-background/90 border border-primary px-6 py-4 shadow-xl">
            <Upload className="h-8 w-8 mx-auto text-primary mb-2" strokeWidth={1.5} />
            <p className="text-sm font-semibold">Drop to upload asset</p>
          </div>
        </div>
      )}

      <PanelSection
        icon={FolderOpen}
        title="Asset library"
        description="Everything you've uploaded across the app — imported images are saved here automatically."
        accent="from-primary via-primary/50 to-primary/10"
        action={
          <Button size="sm" onClick={() => { setDroppedFile(null); setUpload(true); }}>
            <Upload className="h-4 w-4 sm:mr-1.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        }
      >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-40 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="pl-8 h-9"
          />
        </div>
        {filtered.length > 0 && (
          <Button variant="outline" size="sm" onClick={selectAllVisible}>
            <CheckSquare className="h-4 w-4 sm:mr-1.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">{allVisibleSelected ? "Deselect" : "Select all"}</span>
          </Button>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
              !activeTag
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 hover:bg-muted text-muted-foreground",
            )}
          >
            all
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t)}
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                activeTag === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 hover:bg-muted text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          variant="upload-asset"
          onCta={() => { setDroppedFile(null); setUpload(true); }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((a) => {
            const Icon = ICONS[a.type] ?? FileText;
            const isSelected = selected.has(a.id);
            return (
              <div
                key={a.id}
                className={cn(
                  "group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-[var(--shadow-premium)] hover:border-primary/20 hover:-translate-y-0.5 relative",
                  isSelected ? "border-primary ring-2 ring-primary/40" : "border-border/50",
                )}
              >
                <div
                  className={cn(
                    "absolute top-2 left-2 z-10 rounded-md bg-background/90 backdrop-blur border border-border/60 p-0.5 transition-opacity",
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggle(a.id)}
                    aria-label={`Select ${a.title}`}
                  />
                </div>
                <button
                  onClick={() => toggle(a.id)}
                  aria-label="Toggle select"
                  className="relative block aspect-[4/3] w-full bg-muted overflow-hidden"
                >
                  {a.url ? (
                    <MediaThumb
                      url={a.url}
                      alt={a.title}
                      onPlay={(u) => window.open(u, "_blank", "noopener")}
                      className="h-full w-full"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center">
                      <Icon className="h-10 w-10 text-muted-foreground" strokeWidth={1.25} />
                    </span>
                  )}
                </button>
                <div className="p-3">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-semibold tracking-tight truncate flex-1 leading-none">{a.title}</p>
                    {getVersionCount(a.id) > 0 && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        v{getVersionCount(a.id)}
                      </span>
                    )}
                  </div>
                  {a.subtitle && (
                    <p className="text-[11px] text-muted-foreground truncate mt-1 leading-relaxed">{a.subtitle}</p>
                  )}
                  <div className="flex items-center gap-0.5 mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Copy URL" onClick={() => copyUrl(a)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit" onClick={() => setEditing(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Version history" onClick={() => setVersionsFor(a)}>
                      <History className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary" aria-label="Send to studio" onClick={() => sendToStudio(a)}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive hover:text-destructive" aria-label="Delete" onClick={() => setConfirmDel(a)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100%-1rem)]">
          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/95 backdrop-blur-xl shadow-lg pl-3 pr-1.5 py-1.5">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {selected.size}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">selected</span>
            <div className="w-px h-5 bg-border mx-1" />
            <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={bulkCopyUrls}>
              <Copy className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Copy URLs</span>
            </Button>
            <Button size="sm" variant="ghost" className="h-8 rounded-full text-primary hover:text-primary" onClick={bulkSendToStudio}>
              <Send className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Studio</span>
            </Button>
            <Button size="sm" variant="ghost" className="h-8 rounded-full text-destructive hover:text-destructive" onClick={() => setBulkDel(true)}>
              <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={clearSelection} aria-label="Clear selection">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
      </PanelSection>

      <UploadAssetDialog
        open={upload}
        onOpenChange={(o) => { setUpload(o); if (!o) setDroppedFile(null); }}
        initialFile={droppedFile}
      />

      <EditAssetDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        asset={editing}
        onSave={(id, patch) => {
          const prev = items.find((a) => a.id === id);
          if (prev) {
            const p = patch as Partial<Asset>;
            const titleChanged = p.title !== undefined && p.title !== prev.title;
            const tagsChanged =
              p.tags !== undefined && JSON.stringify(p.tags) !== JSON.stringify(prev.tags);
            const urlChanged = p.url !== undefined && p.url !== prev.url;
            if (titleChanged || tagsChanged || urlChanged) {
              // Snapshot the *previous* state so history is non-destructive.
              assetVersionsApi.push(id, {
                title: prev.title,
                subtitle: prev.subtitle,
                tags: prev.tags,
                url: prev.url,
                type: prev.type,
                reason: urlChanged ? "replace" : titleChanged ? "rename" : "tags",
              });
            }
          }
          update(id, patch as Partial<Asset>);
        }}
      />

      <AssetVersionsDialog
        open={!!versionsFor}
        onOpenChange={(o) => !o && setVersionsFor(null)}
        asset={versionsFor}
        onRestore={(patch) => versionsFor && update(versionsFor.id, patch as Partial<Asset>)}
      />

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{confirmDel?.title}&rdquo; will be removed from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDel) { remove(confirmDel.id); toast.success("Deleted"); }
                setConfirmDel(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDel} onOpenChange={setBulkDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} asset{selected.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected assets from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete}>Delete all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
