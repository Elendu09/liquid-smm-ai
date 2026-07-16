import { useCallback, useEffect, useRef, useState, DragEvent } from "react";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, Pause, Play, X, CheckCircle2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { cn } from "@/lib/utils";

const TYPES = ["image", "video", "doc"] as const;
const CHUNK_SIZE = 256 * 1024; // 256 KB chunks — simulates resumable transfer
type UploadState = "idle" | "uploading" | "paused" | "done" | "error";

export function UploadAssetDialog({
  open, onOpenChange, initialFile,
}: { open: boolean; onOpenChange: (o: boolean) => void; initialFile?: File | null }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("image");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);

  // Resumable upload state
  const [uploaded, setUploaded] = useState(0); // bytes
  const [state, setState] = useState<UploadState>("idle");
  const stateRef = useRef<UploadState>("idle");
  const cursorRef = useRef(0);

  useEffect(() => { stateRef.current = state; }, [state]);

  const resetUpload = () => {
    cursorRef.current = 0;
    setUploaded(0);
    setState("idle");
  };

  const runUpload = useCallback(async (f: File) => {
    setState("uploading");
    stateRef.current = "uploading";
    while (cursorRef.current < f.size) {
      const s: string = stateRef.current;
      if (s === "paused" || s === "idle") return;
      f.slice(cursorRef.current, cursorRef.current + CHUNK_SIZE);
      await new Promise((r) => setTimeout(r, 120));
      const s2: string = stateRef.current;
      if (s2 !== "uploading") return;
      cursorRef.current = Math.min(f.size, cursorRef.current + CHUNK_SIZE);
      setUploaded(cursorRef.current);
    }
    setState("done");
    stateRef.current = "done";
    setUrl(URL.createObjectURL(f));
  }, []);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    setFile(f);
    setTitle((prev) => prev || f.name.replace(/\.[^.]+$/, ""));
    if (f.type.startsWith("video/")) setType("video");
    else if (f.type.startsWith("image/")) setType("image");
    else setType("doc");
    resetUpload();
    runUpload(f);
  }, [runUpload]);

  useEffect(() => {
    if (open && initialFile) handleFile(initialFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFile]);

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const pause = () => setState("paused");
  const resume = () => { if (file) runUpload(file); };
  const cancel = () => { setState("idle"); setFile(null); resetUpload(); setUrl(""); };
  const retry = () => { if (file) { resetUpload(); runUpload(file); } };

  const save = () => {
    if (!title.trim() || !url.trim()) { toast.error("Title and file/URL are required"); return; }
    if (file && state !== "done") { toast.error("Wait for upload to finish"); return; }
    pushLocalCollection("library", "assets", [{
      id: crypto.randomUUID(),
      title: title.trim(),
      subtitle: file ? `${(file.size / 1024).toFixed(0)} KB · ${type}` : `${type} · linked`,
      status: "active",
      type, url,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    }]);
    toast.success("Asset added");
    onOpenChange(false);
    setTitle(""); setUrl(""); setTags(""); setFile(null); resetUpload();
  };

  const pct = file ? Math.round((uploaded / file.size) * 100) : 0;
  const fmtKB = (b: number) => `${(b / 1024).toFixed(0)} KB`;

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
              <p className="text-[11px] text-muted-foreground mt-1">Resumable · image, video, or document</p>
            </div>
            <input type="file" hidden accept="image/*,video/*,application/pdf"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
          </label>

          {file && (
            <div className="rounded-lg border border-border/60 p-3 space-y-2 bg-muted/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate flex-1">{file.name}</span>
                <span className="text-muted-foreground tabular-nums ml-2">
                  {fmtKB(uploaded)} / {fmtKB(file.size)} · {pct}%
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "text-[11px] font-medium inline-flex items-center gap-1",
                  state === "done" && "text-primary",
                  state === "paused" && "text-amber-500",
                  state === "error" && "text-destructive",
                )}>
                  {state === "uploading" && "Uploading…"}
                  {state === "paused" && "Paused"}
                  {state === "done" && (<><CheckCircle2 className="h-3 w-3" /> Ready</>)}
                  {state === "error" && "Failed"}
                  {state === "idle" && "Waiting"}
                </span>
                <div className="flex gap-1">
                  {state === "uploading" && (
                    <Button size="sm" variant="outline" className="h-7" onClick={pause}>
                      <Pause className="h-3 w-3 mr-1" /> Pause
                    </Button>
                  )}
                  {state === "paused" && (
                    <Button size="sm" variant="outline" className="h-7" onClick={resume}>
                      <Play className="h-3 w-3 mr-1" /> Resume
                    </Button>
                  )}
                  {state === "error" && (
                    <Button size="sm" variant="outline" className="h-7" onClick={retry}>
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7" onClick={cancel}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

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
          <Textarea value={tags} onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)" rows={2} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!!file && state !== "done"}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
