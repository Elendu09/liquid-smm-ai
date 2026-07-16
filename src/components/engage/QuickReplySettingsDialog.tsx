import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export interface QuickReplySettings {
  template: string;
  maxLength: number;
  handle: string;
  includeHandle: boolean;
  includeEmoji: boolean;
  signOff: string;
}

export const DEFAULT_QR_SETTINGS: QuickReplySettings = {
  template: "Hey {{user}}! 🙌 Thanks for the comment on {{platform}} — DM us and we'll help you out!",
  maxLength: 220,
  handle: "@yourbrand",
  includeHandle: false,
  includeEmoji: true,
  signOff: "",
};

const VARS = ["{{user}}", "{{platform}}", "{{handle}}", "{{sentiment}}"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: QuickReplySettings;
  onSave: (v: QuickReplySettings) => void;
}

export function QuickReplySettingsDialog({ open, onOpenChange, value, onSave }: Props) {
  const [s, setS] = useState<QuickReplySettings>(value);

  useEffect(() => { if (open) setS(value); }, [open, value]);

  const preview = renderQuickReply(s, {
    user: "@fitness_enthusiast",
    platform: "Instagram",
    sentiment: "positive",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick AI reply settings
          </DialogTitle>
          <DialogDescription>Template, length cap, and variables used for one-tap replies.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Reply template</Label>
            <Textarea
              value={s.template}
              onChange={(e) => setS({ ...s, template: e.target.value })}
              rows={3}
              className="font-mono text-xs"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {VARS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setS((p) => ({ ...p, template: p.template + " " + v }))}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 hover:bg-muted font-mono"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Max length: {s.maxLength} chars</Label>
            <Slider
              value={[s.maxLength]}
              min={40}
              max={500}
              step={10}
              onValueChange={([v]) => setS({ ...s, maxLength: v })}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Your handle</Label>
              <Input value={s.handle} onChange={(e) => setS({ ...s, handle: e.target.value })} placeholder="@yourbrand" />
            </div>
            <div>
              <Label className="text-xs">Sign-off (optional)</Label>
              <Input value={s.signOff} onChange={(e) => setS({ ...s, signOff: e.target.value })} placeholder="— Team" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border/60 p-2.5">
            <div>
              <p className="text-xs font-medium">Always include my handle</p>
              <p className="text-[10px] text-muted-foreground">Appends {s.handle || "@yourbrand"} to every quick reply.</p>
            </div>
            <Switch checked={s.includeHandle} onCheckedChange={(v) => setS({ ...s, includeHandle: v })} />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border/60 p-2.5">
            <div>
              <p className="text-xs font-medium">Emoji allowed</p>
              <p className="text-[10px] text-muted-foreground">Strip emoji when off.</p>
            </div>
            <Switch checked={s.includeEmoji} onCheckedChange={(v) => setS({ ...s, includeEmoji: v })} />
          </div>

          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="secondary" className="text-[10px]">Preview</Badge>
              <span className="text-[10px] text-muted-foreground">{preview.length} / {s.maxLength}</span>
            </div>
            <p className="text-xs whitespace-pre-wrap">{preview}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setS(DEFAULT_QR_SETTINGS)}>Reset</Button>
          <Button onClick={() => { onSave(s); onOpenChange(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function renderQuickReply(
  s: QuickReplySettings,
  ctx: { user: string; platform: string; sentiment: string },
): string {
  let out = s.template
    .replaceAll("{{user}}", ctx.user)
    .replaceAll("{{platform}}", ctx.platform)
    .replaceAll("{{handle}}", s.handle || "")
    .replaceAll("{{sentiment}}", ctx.sentiment);

  if (!s.includeEmoji) {
    // strip most emoji ranges
    out = out.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s+/g, " ").trim();
  }
  if (s.signOff) out = `${out} ${s.signOff}`;
  if (s.includeHandle && s.handle && !out.includes(s.handle)) out = `${out} — ${s.handle}`;
  if (out.length > s.maxLength) out = out.slice(0, s.maxLength - 1).trimEnd() + "…";
  return out;
}
