import { useMemo, useState } from "react";
import { Image as ImageIcon, Search, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import type { LibraryAsset } from "@/hooks/useImageAttachments";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the chosen asset's URL. */
  onSelect: (url: string) => void;
}

/** Pick an image you previously imported — everything uploaded anywhere is
 *  auto-saved to Library → Assets, so this list always reflects your own
 *  uploads (plus seeded demo assets for guests). */
export function LibraryImagePicker({ open, onOpenChange, onSelect }: Props) {
  const { items } = useLocalCollection<LibraryAsset>("library", "assets", []);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const images = useMemo(
    () =>
      items.filter((a) => a.type === "image" && a.url).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return images;
    return images.filter((a) => (a.title + " " + (a.subtitle ?? "") + " " + a.tags.join(" ")).toLowerCase().includes(q));
  }, [images, query]);

  const confirm = () => {
    if (!selected) return;
    const asset = items.find((a) => a.id === selected);
    if (asset?.url) onSelect(asset.url);
    onOpenChange(false);
    setSelected(null);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setSelected(null); setQuery(""); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Use from library
          </DialogTitle>
          <DialogDescription>
            Your imported images — everything you upload across the app is saved here automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your images…"
            className="h-9 pl-9"
            aria-label="Search library images"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-6">
            <EmptyState
              icon={ImageIcon}
              title={query ? "No matches" : "Library is empty"}
              description={
                query
                  ? "Try a different search term."
                  : "Upload an image in any editor and it will show up here for reuse."
              }
            />
          </div>
        ) : (
          <div className="grid max-h-[45vh] grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3">
            {filtered.map((a) => {
              const active = selected === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelected(active ? null : a.id)}
                  onDoubleClick={confirm}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border text-left transition-all",
                    active
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/60 hover:border-primary/40",
                  )}
                >
                  <img
                    src={a.url}
                    alt={a.title}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-[11px] font-medium text-white">
                    {a.title}
                  </span>
                  {active && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <p className="mr-auto text-[11px] text-muted-foreground">
            {filtered.length} image{filtered.length === 1 ? "" : "s"} in library
          </p>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={confirm}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
          >
            Use image
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
