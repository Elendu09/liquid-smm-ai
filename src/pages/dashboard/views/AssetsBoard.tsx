import { useMemo, useState, DragEvent } from "react";
import { toast } from "sonner";
import {
  Upload, Trash2, Copy, Send, FileText, Film, Image as ImageIcon,
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
  { id: "a1", title: "Brand logo pack", subtitle: "SVG · 12 files", status: "active", type: "image", url: "", tags: ["brand", "logo"], createdAt: new Date().toISOString() },
  { id: "a2", title: "Q3 hero video", subtitle: "1080p · MP4", status: "active", type: "video", url: "", tags: ["campaign", "q3"], createdAt: new Date().toISOString() },
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
      n.has(id) ? n.delete(id) : n.add(id);
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

      <div className="flex flex-wrap items-center gap-2 mb-4">
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
        <Button size="sm" onClick={() => { setDroppedFile(null); setUpload(true); }} className="ml-auto">
          <Upload className="h-4 w-4 sm:mr-1.5" strokeWidth={1.75} />
          <span className="hidden sm:inline">Upload</span>
        </Button>
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
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" strokeWidth={1.5} />
          <p className="text-sm font-medium">No assets yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag & drop files anywhere, upload, or paste URLs to build your library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((a) => {
            const Icon = ICONS[a.type] ?? FileText;
            const isSelected = selected.has(a.id);
            return (
              <div
                key={a.id}
                className={cn(
                  "group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all relative",
                  isSelected ? "border-primary ring-2 ring-primary/40" : "border-border/60 hover:border-border",
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
                  className="aspect-square bg-muted flex items-center justify-center relative w-full"
                >
                  {a.type === "image" && a.url ? (
                    <img src={a.url} alt={a.title} className="w-full h-full object-cover" />
                  ) : a.type === "video" && a.url ? (
                    <video src={a.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <Icon className="h-10 w-10 text-muted-foreground" strokeWidth={1.25} />
                  )}
                </button>
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold truncate flex-1">{a.title}</p>
                    {getVersionCount(a.id) > 0 && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        v{getVersionCount(a.id)}
                      </span>
                    )}
                  </div>
                  {a.subtitle && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{a.subtitle}</p>
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

      <UploadAssetDialog
        open={upload}
        onOpenChange={(o) => { setUpload(o); if (!o) setDroppedFile(null); }}
        initialFile={droppedFile}
      />

      <EditAssetDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        asset={editing}
        onSave={(id, patch) => update(id, patch as Partial<Asset>)}
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
