import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, GitCompare, FileText, Film, Image as ImageIcon, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssetVersions, AssetVersion } from "@/hooks/useAssetVersions";

interface Asset {
  id: string;
  title: string;
  subtitle?: string;
  type: "image" | "video" | "doc";
  url: string;
  tags: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  asset: Asset | null;
  onRestore?: (patch: Partial<Asset>) => void;
}

const ICONS = { image: ImageIcon, video: Film, doc: FileText } as const;

export function AssetVersionsDialog({ open, onOpenChange, asset, onRestore }: Props) {
  const { versions, snapshot } = useAssetVersions(asset?.id);
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [compare, setCompare] = useState(false);

  const sorted = useMemo(() => [...versions].reverse(), [versions]);
  const current = useMemo(
    () => (selected != null ? versions.find((v) => v.version === selected) : sorted[0]) ?? null,
    [selected, versions, sorted],
  );
  const previous = useMemo(() => {
    if (!current) return null;
    const idx = versions.findIndex((v) => v.version === current.version);
    return idx > 0 ? versions[idx - 1] : null;
  }, [current, versions]);

  const restore = () => {
    if (!current || !asset) return;
    // Snapshot the CURRENT asset state before overwriting, so history remains undoable
    snapshot({
      title: asset.title,
      subtitle: asset.subtitle,
      tags: asset.tags,
      url: asset.url,
      type: asset.type,
      note: note || `Before restore → v${current.version}`,
      reason: "restore",
    });
    onRestore?.({
      title: current.title,
      subtitle: current.subtitle,
      tags: current.tags,
      url: current.url,
      type: current.type,
    });
    toast.success(`Restored to v${current.version}`);
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-4 h-4" /> Version history
          </DialogTitle>
          <DialogDescription>
            {asset?.title ?? "Asset"} · {versions.length} version{versions.length === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>

        {versions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No versions saved yet. Renaming, retagging, or replacing this asset will start the history.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
            <ScrollArea className="h-[380px] pr-2">
              <ol className="relative border-l border-border/60 ml-2 space-y-2 pl-4">
                {sorted.map((v) => {
                  const active = current?.version === v.version;
                  return (
                    <li key={v.version} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                          active ? "bg-primary" : "bg-muted-foreground/40",
                        )}
                      />
                      <button
                        onClick={() => setSelected(v.version)}
                        className={cn(
                          "w-full text-left rounded-lg border px-2.5 py-1.5 transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border/60 hover:bg-muted/50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">v{v.version}</span>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {v.reason}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {new Date(v.createdAt).toLocaleString()}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </ScrollArea>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {compare && previous ? "Compare v" + previous.version + " → v" + current?.version : "Details"}
                </div>
                {previous && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => setCompare((v) => !v)}
                  >
                    <GitCompare className="w-3.5 h-3.5 mr-1.5" />
                    {compare ? "Hide compare" : "Compare"}
                  </Button>
                )}
              </div>

              <div className={cn("grid gap-3", compare && previous ? "grid-cols-2" : "grid-cols-1")}>
                {compare && previous && <VersionCard v={previous} label={`v${previous.version}`} />}
                {current && <VersionCard v={current} label={`v${current.version}`} highlight />}
              </div>

              {current && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Change note (optional)
                    </label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Why are you restoring this version?"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                      Close
                    </Button>
                    <Button onClick={restore} disabled={sorted[0]?.version === current.version}>
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      Restore this version
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VersionCard({
  v,
  label,
  highlight,
}: {
  v: AssetVersion;
  label: string;
  highlight?: boolean;
}) {
  const Icon = ICONS[v.type] ?? FileText;
  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden bg-card",
        highlight ? "border-primary/60" : "border-border/60",
      )}
    >
      <div className="aspect-video bg-muted flex items-center justify-center">
        {v.type === "image" && v.url ? (
          <img src={v.url} alt={v.title} className="w-full h-full object-cover" />
        ) : v.type === "video" && v.url ? (
          <video src={v.url} className="w-full h-full object-cover" muted />
        ) : (
          <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.25} />
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(v.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="text-sm font-medium truncate">{v.title}</div>
        {v.subtitle && (
          <div className="text-[11px] text-muted-foreground truncate">{v.subtitle}</div>
        )}
        {v.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {v.tags.slice(0, 6).map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {v.note && (
          <div className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/40 mt-1.5">
            "{v.note}"
          </div>
        )}
      </div>
    </div>
  );
}
