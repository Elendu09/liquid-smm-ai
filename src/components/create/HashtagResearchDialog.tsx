import { useState } from "react";
import { toast } from "sonner";
import { Hash, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiCreate, type ResearchedHashtag } from "@/hooks/useAiCreate";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { cn } from "@/lib/utils";

const VOLUME_TONE: Record<ResearchedHashtag["volume"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30",
  high: "bg-brand-green/15 text-brand-green border-brand-green/30",
  viral: "bg-brand-pink/15 text-brand-pink border-brand-pink/30",
};

const DIFF_TONE: Record<ResearchedHashtag["difficulty"], string> = {
  easy: "bg-brand-green/10 text-brand-green",
  medium: "bg-brand-orange/10 text-brand-orange",
  hard: "bg-destructive/10 text-destructive",
};

export function HashtagResearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ResearchedHashtag[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const run = async () => {
    if (!topic.trim()) return;
    setBusy(true);
    const res = await aiCreate.hashtags({ topic, platform });
    setBusy(false);
    if (res?.tags) {
      setResults(res.tags);
      setPicked(new Set(res.tags.map((t) => t.tag)));
    }
  };

  const toggle = (tag: string) =>
    setPicked((s) => {
      const n = new Set(s);
      n.has(tag) ? n.delete(tag) : n.add(tag);
      return n;
    });

  const save = () => {
    const items = results
      .filter((r) => picked.has(r.tag))
      .map((r) => ({
        id: crypto.randomUUID(),
        title: `#${r.tag}`,
        subtitle: `${r.volume} volume · ${r.difficulty} competition`,
        status: r.volume === "viral" ? "trending" : "saved",
        createdAt: new Date().toISOString(),
      }));
    if (items.length === 0) {
      toast.error("Pick at least one hashtag");
      return;
    }
    pushLocalCollection("create", "hashtags", items);
    toast.success(`Saved ${items.length} hashtag${items.length > 1 ? "s" : ""}`);
    onOpenChange(false);
    setResults([]);
    setTopic("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Research hashtags
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr,140px] gap-2">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Seed keyword…" />
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["instagram", "tiktok", "twitter", "linkedin", "youtube"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={run} disabled={busy || !topic.trim()} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Hash className="h-4 w-4 mr-2" />}
            Research
          </Button>

          {results.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t max-h-80 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.tag}
                  onClick={() => toggle(r.tag)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left",
                    picked.has(r.tag) ? "border-primary bg-primary/[0.04]" : "border-border/60 hover:bg-muted/40",
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                      picked.has(r.tag) ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {picked.has(r.tag) && <Check className="h-3 w-3" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-mono flex-1 truncate">#{r.tag}</span>
                  <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", VOLUME_TONE[r.volume])}>
                    {r.volume}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", DIFF_TONE[r.difficulty])}>
                    {r.difficulty}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={results.length === 0}>
            Save {picked.size > 0 ? `(${picked.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
