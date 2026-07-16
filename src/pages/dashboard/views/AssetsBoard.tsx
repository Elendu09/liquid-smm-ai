import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Copy, Send, FileText, Film, Image as ImageIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useNavigate } from "react-router-dom";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { UploadAssetDialog } from "@/components/library/UploadAssetDialog";
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
  {
    id: "a1",
    title: "Brand logo pack",
    subtitle: "SVG · 12 files",
    status: "active",
    type: "image",
    url: "",
    tags: ["brand", "logo"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "a2",
    title: "Q3 hero video",
    subtitle: "1080p · MP4",
    status: "active",
    type: "video",
    url: "",
    tags: ["campaign", "q3"],
    createdAt: new Date().toISOString(),
  },
];

const ICONS = { image: ImageIcon, video: Film, doc: FileText } as const;

export default function AssetsBoard() {
  const { items, remove } = useLocalCollection<Asset>("library", "assets", seed);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [upload, setUpload] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Asset | null>(null);
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

  const copyUrl = async (a: Asset) => {
    if (!a.url) {
      toast.error("No URL for this asset");
      return;
    }
    await navigator.clipboard.writeText(a.url);
    toast.success("URL copied");
  };

  const sendToStudio = (a: Asset) => {
    nav(`/dashboard/create/studio?assetUrl=${encodeURIComponent(a.url)}`);
    toast.success("Opened in Studio");
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
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
        <Button size="sm" onClick={() => setUpload(true)} className="ml-auto">
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
          <p className="text-xs text-muted-foreground mt-1">Upload files or paste URLs to build your library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((a) => {
            const Icon = ICONS[a.type] ?? FileText;
            return (
              <div
                key={a.id}
                className="group rounded-xl border border-border/60 bg-card overflow-hidden hover:shadow-md hover:border-border transition-all"
              >
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  {a.type === "image" && a.url ? (
                    <img src={a.url} alt={a.title} className="w-full h-full object-cover" />
                  ) : a.type === "video" && a.url ? (
                    <video src={a.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <Icon className="h-10 w-10 text-muted-foreground" strokeWidth={1.25} />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold truncate">{a.title}</p>
                  {a.subtitle && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{a.subtitle}</p>
                  )}
                  <div className="flex items-center gap-0.5 mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Copy URL"
                      onClick={() => copyUrl(a)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary hover:text-primary"
                      aria-label="Send to studio"
                      onClick={() => sendToStudio(a)}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                      aria-label="Delete"
                      onClick={() => setConfirmDel(a)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UploadAssetDialog open={upload} onOpenChange={setUpload} />

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
                if (confirmDel) {
                  remove(confirmDel.id);
                  toast.success("Deleted");
                }
                setConfirmDel(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
