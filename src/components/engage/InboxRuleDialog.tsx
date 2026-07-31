import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { platforms } from "@/config/platforms";
import { INTENT_LABEL, type Intent, type Sentiment } from "@/hooks/useInboxAnalysis";
import { emptyRule, type InboxRule } from "@/hooks/useInboxAutomation";
import { useTeamMembers } from "@/hooks/useTeamMembers";

const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];
const INTENTS = Object.keys(INTENT_LABEL) as Intent[];
const STATUSES = ["new", "replied", "snoozed", "resolved"] as const;
const TONES = ["friendly", "professional", "witty", "empathetic", "concise"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs border transition-colors",
        active
          ? "bg-primary/15 border-primary/40 text-primary font-medium"
          : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: InboxRule | null;
  onSubmit: (rule: InboxRule) => void;
}

export function InboxRuleDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const { members } = useTeamMembers();
  const [rule, setRule] = useState<InboxRule>(emptyRule());
  const [keywordText, setKeywordText] = useState("");

  useEffect(() => {
    if (!open) return;
    const base = initial ? { ...initial } : emptyRule();
    setRule(base);
    setKeywordText(base.match.keywords.join(", "));
  }, [open, initial]);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const setMatch = (patch: Partial<InboxRule["match"]>) =>
    setRule((r) => ({ ...r, match: { ...r.match, ...patch } }));
  const setActions = (patch: Partial<InboxRule["actions"]>) =>
    setRule((r) => ({ ...r, actions: { ...r.actions, ...patch } }));

  const submit = () => {
    if (!rule.name.trim()) { toast.error("Give the rule a name"); return; }
    const keywords = keywordText.split(",").map((k) => k.trim()).filter(Boolean);
    const a = rule.actions;
    if (!a.setStatus && !a.assignTo && !a.aiDraftReply) {
      toast.error("Pick at least one action");
      return;
    }
    onSubmit({ ...rule, name: rule.name.trim(), match: { ...rule.match, keywords } });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit inbox rule" : "New inbox automation rule"}</DialogTitle>
          <DialogDescription>
            Route inbound messages by sentiment and intent, auto-assign a teammate, and optionally queue an AI draft reply for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label htmlFor="ir-name">Rule name</Label>
            <Input
              id="ir-name"
              value={rule.name}
              onChange={(e) => setRule((r) => ({ ...r, name: e.target.value }))}
              placeholder="e.g. Angry customers → escalate to Sam"
            />
          </div>

          {/* ---------------- WHEN ---------------- */}
          <div className="rounded-xl border border-border/60 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">WHEN</Badge>
              <span className="text-xs text-muted-foreground">Leave a row empty to match everything</span>
            </div>

            <div>
              <Label className="text-xs">Channel</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(["comment", "dm"] as const).map((k) => (
                  <Chip key={k} active={rule.match.kinds.includes(k)} onClick={() => setMatch({ kinds: toggle(rule.match.kinds, k) })}>
                    {k === "dm" ? "DMs" : "Comments"}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Platform</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {platforms.map((p) => (
                  <Chip key={p.id} active={rule.match.platforms.includes(p.id)} onClick={() => setMatch({ platforms: toggle(rule.match.platforms, p.id) })}>
                    {p.name}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Sentiment</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {SENTIMENTS.map((s) => (
                  <Chip key={s} active={rule.match.sentiments.includes(s)} onClick={() => setMatch({ sentiments: toggle(rule.match.sentiments, s) })}>
                    {s}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Intent</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {INTENTS.map((i) => (
                  <Chip key={i} active={rule.match.intents.includes(i)} onClick={() => setMatch({ intents: toggle(rule.match.intents, i) })}>
                    {INTENT_LABEL[i]}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="ir-kw" className="text-xs">Keywords (any of, comma separated)</Label>
              <Input id="ir-kw" value={keywordText} onChange={(e) => setKeywordText(e.target.value)} placeholder="refund, broken, cancel" />
            </div>
          </div>

          {/* ---------------- THEN ---------------- */}
          <div className="rounded-xl border border-border/60 p-4 space-y-4">
            <Badge variant="secondary" className="text-[10px]">THEN</Badge>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Move to</Label>
                <Select
                  value={rule.actions.setStatus ?? "none"}
                  onValueChange={(v) => setActions({ setStatus: v === "none" ? null : (v as InboxRule["actions"]["setStatus"]) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Don't change status</SelectItem>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Assign to</Label>
                <Select
                  value={rule.actions.assignTo ?? "none"}
                  onValueChange={(v) => setActions({ assignTo: v === "none" ? null : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Nobody" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nobody</SelectItem>
                    {members.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/50 p-3">
              <div className="min-w-0">
                <Label htmlFor="ir-ai" className="mb-0 text-sm">Draft an AI reply</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Queues a suggested reply on the message — a human still approves and sends it.
                </p>
              </div>
              <Switch id="ir-ai" checked={rule.actions.aiDraftReply} onCheckedChange={(v) => setActions({ aiDraftReply: v })} />
            </div>

            {rule.actions.aiDraftReply && (
              <div>
                <Label className="text-xs">Reply tone</Label>
                <Select value={rule.actions.aiTone} onValueChange={(v) => setActions({ aiTone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/50 p-3">
              <div className="min-w-0">
                <Label htmlFor="ir-cls" className="mb-0 text-sm">Use AI classification</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Slower but far more accurate than keyword matching — understands sarcasm and other languages.
                </p>
              </div>
              <Switch id="ir-cls" checked={rule.actions.aiClassify} onCheckedChange={(v) => setActions({ aiClassify: v })} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ir-enabled" className="mb-0">Enable this rule</Label>
            <Switch id="ir-enabled" checked={rule.enabled} onCheckedChange={(v) => setRule((r) => ({ ...r, enabled: v }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save rule" : "Create rule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
