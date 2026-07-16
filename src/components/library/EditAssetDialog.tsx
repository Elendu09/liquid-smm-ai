import { useEffect, useState, DragEvent } from "react";
import { toast } from "sonner";
import { Pencil, RefreshCw, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface EditableAsset {
  id: string;
  title: string;
  subtitle?: string;
  type: "image" | "video" | "doc";
  url: string;
  tags: string[];
}

const TYPES = ["image", "video", "doc"] as const;

export function EditAssetDialog({
  open,
  onOpenChange,
  asset,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  asset: EditableAsset | null;
  onSave: (id: string, patch: Partial<EditableAsset>) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("image");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!asset) return;
    setTitle(asset.title);
    setUrl(asset.url);
    setTags((asset.tags ?? []).join(", "));
    setType(asset.type);
    setFile(null);
  }, [asset]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("video/")) setType("video");
    else if (f.type.startsWith("image/")) setType("image");
    else setType("doc");
    setUrl(URL.createObjectURL(f));
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const save = () => {
    if (!asset) return;
    if (!title.trim() || !url.trim()) {
      toast.error("Title and file/URL are required");
      return;
    }
    onSave(asset.id, {
      title: title.trim(),
      url,
      type,
      subtitle: file ? `${(file.size / 1024).toFixed(0)} KB · ${type}` : asset.subtitle,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    toast.success(file ? "Asset replaced" : "Asset updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" strokeWidth={1.75} /> Edit asset
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label
            className="block cursor-pointer"
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
          >
            <div className={cn(
              "border-2 border-dashed rounded-xl p-5 text-center transition-colors",
              drag ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/40",
            )}>
              <RefreshCw className="h-5 w-5 mx-auto text-muted-foreground mb-1.5" strokeWidth={1.5} />
              <p className="text-sm font-medium">
                {file ? `Replacing with ${file.name}` : drag ? "Drop to replace" : "Drop a new file to replace"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Optional — keep as-is to only edit metadata</p>
            </div>
            <input
              type="file"
              hidden
              accept="image/*,video/*,application/pdf"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <LinkIcon className="h-3 w-3" /> URL
            </label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>

          <div className="grid grid-cols-[1fr,120px] gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            rows={2}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
