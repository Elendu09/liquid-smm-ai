import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Zap, Target, Bot, Sparkles, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { cn } from "@/lib/utils";
import type { Segment } from "@/pages/dashboard/views/SegmentsBoard";

type Tone = "friendly" | "professional" | "witty";

interface BotRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  runs: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Preselect a saved segment (e.g. from Segments board Zap button). */
  presetSegmentId?: string | null;
  /** When true, allow selecting multiple audiences to run automation across. */
  multi?: boolean;
}

const TONES: { id: Tone; label: string; blurb: string }[] = [
  { id: "friendly", label: "Friendly", blurb: "Warm, casual, emoji-forward" },
  { id: "professional", label: "Professional", blurb: "Concise, on-brand, neutral" },
  { id: "witty", label: "Witty", blurb: "Playful, cheeky one-liners" },
];

export function RunAutomationDialog({ open, onOpenChange, presetSegmentId, multi = false }: Props) {
  const navigate = useNavigate();
  const { items: segments } = useLocalCollection<Segment>("audience", "segments");
  const { items: rules } = useLocalCollection<BotRule>("engage", "bot-rules");

  const enabledRules = useMemo(() => rules.filter((r) => r.enabled), [rules]);

  const [segmentId, setSegmentId] = useState<string>("");
  const [segmentIds, setSegmentIds] = useState<string[]>([]);
  const [ruleId, setRuleId] = useState<string>("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSegmentId(presetSegmentId || segments[0]?.id || "");
    setSegmentIds(presetSegmentId ? [presetSegmentId] : segments.slice(0, 1).map((s) => s.id));
    setRuleId(enabledRules[0]?.id || rules[0]?.id || "");
    setTone("friendly");
    setLaunching(false);
  }, [open, presetSegmentId, segments, rules, enabledRules]);

  const segment = segments.find((s) => s.id === segmentId) || null;
  const rule = rules.find((r) => r.id === ruleId) || null;
  const chosenSegments = multi ? segments.filter((s) => segmentIds.includes(s.id)) : segment ? [segment] : [];

  const toggleSegment = (id: string) => {
    setSegmentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const launch = () => {
    if (chosenSegments.length === 0 || !rule) return;
    setLaunching(true);
    setTimeout(() => {
      if (multi && chosenSegments.length > 1) {
        toast.success(`Automation queued across ${chosenSegments.length} audiences`, {
          description: `${rule.name} · tone: ${tone}`,
        });
      } else {
        toast.success(`Automation queued: ${rule.name} → ${chosenSegments[0].title}`, {
          description: `Tone: ${tone}. Redirecting to bot rules…`,
        });
      }
      onOpenChange(false);
      const first = chosenSegments[0];
      navigate(`/dashboard/engage/bot?segmentId=${encodeURIComponent(first.id)}&ruleId=${encodeURIComponent(rule.id)}&tone=${tone}`);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Run automation
          </DialogTitle>
          <DialogDescription>
            One-click launch — pick a saved audience, a bot rule, and a reply tone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Segment */}
          <div>
            <Label className="flex items-center gap-1.5 text-xs">
              <Target className="h-3.5 w-3.5 text-primary" /> Audience segment
            </Label>
            {segments.length === 0 ? (
              <p className="text-xs text-muted-foreground border border-dashed border-border/60 rounded-md p-3 mt-1">
                No saved segments yet — create one in Audience → Segments.
              </p>
            ) : (
              <Select value={segmentId} onValueChange={setSegmentId}>
                <SelectTrigger><SelectValue placeholder="Choose a saved audience" /></SelectTrigger>
                <SelectContent>
                  {segments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                      {s.niche ? ` · ${s.niche}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {segment && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {segment.niche && <Badge variant="secondary" className="text-[10px]">{segment.niche}</Badge>}
                {segment.platforms.slice(0, 3).map((p) => (
                  <Badge key={p} variant="outline" className="text-[10px] capitalize">{p}</Badge>
                ))}
                {segment.keywords.slice(0, 2).map((k) => (
                  <Badge key={k} variant="outline" className="text-[10px]">{k}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Bot rule */}
          <div>
            <Label className="flex items-center gap-1.5 text-xs">
              <Bot className="h-3.5 w-3.5 text-primary" /> Bot rule
            </Label>
            {rules.length === 0 ? (
              <p className="text-xs text-muted-foreground border border-dashed border-border/60 rounded-md p-3 mt-1">
                No rules yet — create one in Engage → Bot rules.
              </p>
            ) : (
              <Select value={ruleId} onValueChange={setRuleId}>
                <SelectTrigger><SelectValue placeholder="Choose a rule" /></SelectTrigger>
                <SelectContent>
                  {rules.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} {!r.enabled && "(disabled)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {rule && (
              <p className="text-[11px] text-muted-foreground mt-1">
                When {rule.trigger} → {rule.action}
              </p>
            )}
          </div>

          {/* Tone */}
          <div>
            <Label className="flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Reply tone
            </Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  aria-pressed={tone === t.id}
                  className={cn(
                    "text-left p-2 rounded-md border text-xs transition",
                    tone === t.id
                      ? "border-primary bg-primary/10"
                      : "border-border/60 hover:bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t.label}</span>
                    {tone === t.id && <Check className="h-3 w-3 text-primary" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.blurb}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!segment || !rule || launching}
            onClick={launch}
          >
            <Zap className="h-3.5 w-3.5 mr-1" /> {launching ? "Launching…" : "Launch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
