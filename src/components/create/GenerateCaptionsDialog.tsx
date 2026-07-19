import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { aiCreate, type GeneratedCaption } from "@/hooks/useAiCreate";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { useBrandVoices, serializeVoice } from "@/hooks/useBrandVoices";
import { cn } from "@/lib/utils";

const TONES = ["playful", "professional", "bold", "minimal", "witty", "inspiring"];

export function GenerateCaptionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { active } = useBrandVoices();
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("playful");
  const [platform, setPlatform] = useState("instagram");
  const [count, setCount] = useState(3);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<GeneratedCaption[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [useVoice, setUseVoice] = useState(true);

  const run = async () => {
    if (!topic.trim()) return;
    setBusy(true);
    const voice = useVoice ? serializeVoice(active) : "";
    const effectiveTone = useVoice && active ? active.tone : tone;
    const res = await aiCreate.captions({
      topic: voice ? `${topic}\n\nBRAND VOICE:\n${voice}` : topic,
      tone: effectiveTone,
      platform,
      count,
    });
    setBusy(false);
    if (res?.captions) {
      setResults(res.captions);
      setPicked(new Set(res.captions.map((_, i) => i)));
    }
  };

  const save = () => {
    const items = results
      .filter((_, i) => picked.has(i))
      .map((c) => ({
        id: crypto.randomUUID(),
        title: c.title,
        subtitle: c.body.slice(0, 140),
        status: "idea",
        createdAt: new Date().toISOString(),
        body: c.body,
        hashtags: c.hashtags,
      }));
    if (items.length === 0) {
      toast.error("Pick at least one caption");
      return;
    }
    pushLocalCollection("create", "captions", items);
    toast.success(`Saved ${items.length} caption${items.length > 1 ? "s" : ""}`);
    onOpenChange(false);
    setResults([]);
    setTopic("");
  };

  const togglePick = (i: number) =>
    setPicked((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Generate captions
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {active && (
            <label className="flex items-center justify-between gap-2 text-[11px] bg-muted/40 rounded-md px-2 py-1.5 cursor-pointer">
              <span className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="h-3 w-3 text-primary shrink-0" />
                <span className="text-muted-foreground shrink-0">Voice:</span>
                <span className="font-medium truncate">{active.name}</span>
                <span className="text-muted-foreground truncate">· {active.tone}</span>
              </span>
              <input
                type="checkbox"
                checked={useVoice}
                onChange={(e) => setUseVoice(e.target.checked)}
                className="h-3.5 w-3.5"
              />
            </label>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Topic</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. new product launch" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tone</label>
              <div className="flex flex-wrap gap-1">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                      tone === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 hover:bg-muted text-muted-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Count</label>
              <Input
                type="number"
                min={1}
                max={6}
                value={count}
                onChange={(e) => setCount(Math.min(6, Math.max(1, +e.target.value)))}
              />
            </div>
          </div>
          <Button onClick={run} disabled={busy || !topic.trim()} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {busy ? "Generating…" : "Generate"}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              {results.map((c, i) => (
                <button
                  key={i}
                  onClick={() => togglePick(i)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors",
                    picked.has(i)
                      ? "border-primary bg-primary/[0.04]"
                      : "border-border/60 hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0",
                        picked.has(i) ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {picked.has(i) && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{c.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{c.body}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.hashtags.slice(0, 6).map((h) => (
                          <Badge key={h} variant="secondary" className="text-[10px] h-4 px-1.5">
                            #{h}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={results.length === 0}>
            Save {picked.size > 0 ? `(${picked.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
