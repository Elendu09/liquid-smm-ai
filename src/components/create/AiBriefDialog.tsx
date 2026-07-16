import { useState } from "react";
import { toast } from "sonner";
import { Wand2, Loader2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiCreate, type AiBrief } from "@/hooks/useAiCreate";
import { pushLocalCollection } from "@/hooks/useLocalCollection";

export function AiBriefDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("grow followers");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("playful");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiBrief | null>(null);

  const run = async () => {
    if (!topic.trim()) return;
    setBusy(true);
    const res = await aiCreate.brief({ topic, goal, audience, platform, tone });
    setBusy(false);
    if (res) setResult(res);
  };

  const copyAll = async () => {
    if (!result) return;
    const text = `${result.caption}\n\n${result.hashtags.map((h) => `#${h}`).join(" ")}\n\nCTA: ${result.cta}`;
    await navigator.clipboard.writeText(text);
    toast.success("Post kit copied");
  };

  const saveToLibrary = () => {
    if (!result) return;
    pushLocalCollection("create", "ai", [
      {
        id: crypto.randomUUID(),
        title: topic || "AI brief",
        subtitle: result.caption.slice(0, 120),
        status: "generated",
        createdAt: new Date().toISOString(),
      },
    ]);
    pushLocalCollection("create", "captions", [
      {
        id: crypto.randomUUID(),
        title: `Brief: ${topic}`,
        subtitle: result.caption.slice(0, 140),
        status: "polished",
        createdAt: new Date().toISOString(),
        body: result.caption,
        hashtags: result.hashtags,
      },
    ]);
    toast.success("Saved to AI Studio + Captions");
    onOpenChange(false);
    setResult(null);
    setTopic("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" strokeWidth={1.75} /> AI post brief
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (required)" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger><SelectValue placeholder="Goal" /></SelectTrigger>
              <SelectContent>
                {["grow followers", "drive sales", "build community", "educate"].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["instagram", "tiktok", "twitter", "linkedin", "youtube"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Audience (e.g. B2B founders)" />
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["playful", "professional", "bold", "minimal", "witty"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={run} disabled={busy || !topic.trim()} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
            Generate brief
          </Button>

          {result && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Caption</p>
                <Textarea readOnly value={result.caption} rows={4} className="text-sm" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Hooks</p>
                <ul className="space-y-1">
                  {result.hooks.map((h, i) => (
                    <li key={i} className="text-sm rounded-md bg-muted/50 px-2 py-1.5">{h}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Hashtags</p>
                <div className="flex flex-wrap gap-1">
                  {result.hashtags.map((h) => (
                    <Badge key={h} variant="secondary" className="text-[10px]">#{h}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">CTA</p>
                <p className="text-sm rounded-md bg-primary/5 border border-primary/20 px-2 py-1.5 text-primary font-medium">
                  {result.cta}
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={copyAll} disabled={!result}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button onClick={saveToLibrary} disabled={!result}>Save to library</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
