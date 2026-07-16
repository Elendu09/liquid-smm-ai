import { useEffect, useState, useCallback, DragEvent } from "react";
import { toast } from "sonner";
import { Upload, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { cn } from "@/lib/utils";

const TYPES = ["image", "video", "doc"] as const;

export function UploadAssetDialog({
  open,
  onOpenChange,
  initialFile,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialFile?: File | null;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("image");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    setFile(f);
    setTitle((prev) => prev || f.name.replace(/\.[^.]+$/, ""));
    if (f.type.startsWith("video/")) setType("video");
    else if (f.type.startsWith("image/")) setType("image");
    else setType("doc");
    setUrl(URL.createObjectURL(f));
  }, []);

  useEffect(() => {
    if (open && initialFile) handleFile(initialFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFile]);

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const save = () => {
    if (!title.trim() || !url.trim()) {
      toast.error("Title and file/URL are required");
      return;
    }
    pushLocalCollection("library", "assets", [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        subtitle: file ? `${(file.size / 1024).toFixed(0)} KB · ${type}` : `${type} · linked`,
        status: "active",
        type,
        url,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
      },
    ]);
    toast.success("Asset added");
    onOpenChange(false);
    setTitle("");
    setUrl("");
    setTags("");
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" strokeWidth={1.75} /> Add asset
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
              "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
              drag ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/40",
            )}>
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium">{file ? file.name : drag ? "Drop file to upload" : "Drop or choose a file"}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Image, video, or document</p>
            </div>
            <input
              type="file"
              hidden
              accept="image/*,video/*,application/pdf"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <LinkIcon className="h-3 w-3" /> Paste URL
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
          <Button onClick={save}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
