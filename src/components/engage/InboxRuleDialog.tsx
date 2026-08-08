import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Filter,
  FormInput,
  Info,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { platforms } from "@/config/platforms";
import { INTENT_LABEL, type Intent, type Sentiment } from "@/hooks/useInboxAnalysis";
import {
  emptyRule,
  DEFAULT_TONES,
  DEFAULT_CATEGORIES,
  type InboxRule,
  type InboxPriority,
} from "@/hooks/useInboxAutomation";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { InboxFlowEditor } from "@/components/engage/InboxFlowEditor";
import { useSavedReplies } from "@/hooks/useSavedReplies";

const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];
const INTENTS = Object.keys(INTENT_LABEL) as Intent[];
const STATUSES = ["new", "replied", "snoozed", "resolved"] as const;
const PRIORITIES: InboxPriority[] = ["low", "normal", "high", "urgent"];

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
  const { replies } = useSavedReplies();
  const [rule, setRule] = useState<InboxRule>(() => initial ? { ...initial } : emptyRule());
  const [keywordText, setKeywordText] = useState("");
  const [mode, setMode] = useState<"flow" | "form">("flow");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = initial ? { ...initial } : emptyRule();
    setRule(base);
    setKeywordText(base.match.keywords.join(", "));
    setMode("flow");
    setShowAdvanced(false);
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
    const hasAction = a.setStatus || a.assignTo || a.label || a.hide || a.aiDraftReply || a.sendWelcomeDM || a.sendAwayDM || a.sendMenuDM || a.sendSavedReply || a.notify;
    if (!hasAction) {
      toast.error("Pick at least one action");
      return;
    }
    onSubmit({ ...rule, name: rule.name.trim(), match: { ...rule.match, keywords } });
    onOpenChange(false);
  };

  const tabs: Array<{ id: "flow" | "form"; icon: React.ComponentType<{ className?: string }>; label: string; description: string }> = [
    { id: "flow", icon: Sparkles, label: "Visual flow", description: "Drag-and-drop blocks (n8n style)" },
    { id: "form", icon: FormInput, label: "Classic form", description: "Plain match + actions" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(96vw,72rem)] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Filter className="h-4 w-4 text-primary" /> {initial?.id ? "Edit inbox rule" : "New inbox automation rule"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                Cover the four core engagement areas — DMs (welcome, away, menu), comment keywords, inbox triage and saved replies — in one rule.
              </DialogDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMode(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                      mode === tab.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={mode === tab.id}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-8rem)]">
          <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
            {/* Name + meta */}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="ir-name" className="text-xs">Rule name</Label>
                <Input
                  id="ir-name"
                  value={rule.name}
                  onChange={(e) => setRule((r) => ({ ...r, name: e.target.value }))}
                  placeholder="e.g. Angry customers → escalate to Sam"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={rule.category} onValueChange={(v) => setRule((r) => ({ ...r, category: v as InboxRule["category"] }))}>
                  <SelectTrigger className="w-[10rem]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ir-desc" className="text-xs">Short description <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="ir-desc"
                value={rule.description ?? ""}
                onChange={(e) => setRule((r) => ({ ...r, description: e.target.value }))}
                placeholder="e.g. Routes angry customer DMs to the support lead with an empathetic AI draft."
              />
            </div>

            {mode === "flow" ? (
              <InboxFlowEditor
                rule={rule}
                onChange={(next) => setRule((r) => ({ ...r, match: next.match, actions: next.actions, flow: next.flow }))}
              />
            ) : (
              <ClassicForm
                rule={rule}
                keywordText={keywordText}
                setKeywordText={setKeywordText}
                setMatch={setMatch}
                setActions={setActions}
                toggle={toggle}
                members={members}
                replies={replies}
              />
            )}

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left"
                onClick={() => setShowAdvanced((s) => !s)}
              >
                <span className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                    <Info className="h-3 w-3" />
                  </span>
                  <span className="text-[11px] font-semibold">Advanced</span>
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
              </button>
              {showAdvanced && (
                <div className="mt-3 space-y-3 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-border/60 p-2.5">
                    <div>
                      <Label className="text-[11px]">Run in priority order</Label>
                      <p className="text-[9px] text-muted-foreground">Earlier rules are matched first.</p>
                    </div>
                    <Badge variant="outline" className="text-[9px]">#{rule.runs ?? 0} runs</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 p-2.5">
                    <div>
                      <Label htmlFor="ir-enabled" className="text-[11px] mb-0">Enable this rule</Label>
                      <p className="text-[9px] text-muted-foreground">Turn off to pause without deleting.</p>
                    </div>
                    <Switch id="ir-enabled" checked={rule.enabled} onCheckedChange={(v) => setRule((r) => ({ ...r, enabled: v }))} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col-reverse gap-2 border-t border-border/60 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Auto-saves to your workspace
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={submit}>{initial?.id ? "Save rule" : "Create rule"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------- classic form fallback for power users --------- */

function ClassicForm({
  rule,
  keywordText,
  setKeywordText,
  setMatch,
  setActions,
  toggle,
  members,
  replies,
}: {
  rule: InboxRule;
  keywordText: string;
  setKeywordText: (v: string) => void;
  setMatch: (patch: Partial<InboxRule["match"]>) => void;
  setActions: (patch: Partial<InboxRule["actions"]>) => void;
  toggle: <T,>(list: T[], value: T) => T[];
  members: Array<{ id: string; name: string }>;
  replies: Array<{ id: string; name: string; body: string }>;
}) {
  return (
    <div className="space-y-4">
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

      <div className="rounded-xl border border-border/60 p-4 space-y-4">
        <Badge variant="secondary" className="text-[10px]">THEN</Badge>

        {/* DMs welcome / away / menu / saved reply */}
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow
            title="Send welcome DM"
            description="Auto-reply to new DMs with a friendly welcome."
            checked={rule.actions.sendWelcomeDM}
            onChange={(v) => setActions({ sendWelcomeDM: v })}
          >
            <TextareaBlock
              value={rule.actions.welcomeTemplate}
              onChange={(v) => setActions({ welcomeTemplate: v })}
              placeholder="Hey {{author}} 👋 thanks for reaching out!"
            />
          </ToggleRow>
          <ToggleRow
            title="Send away DM"
            description="Reply out-of-office for late-night messages."
            checked={rule.actions.sendAwayDM}
            onChange={(v) => setActions({ sendAwayDM: v })}
          >
            <TextareaBlock
              value={rule.actions.awayTemplate}
              onChange={(v) => setActions({ awayTemplate: v })}
              placeholder="Thanks for the message — we're away right now."
            />
          </ToggleRow>
        </div>

        <ToggleRow
          title="Send menu DM (chatbot)"
          description="Reply with a numbered menu so users can self-serve."
          checked={rule.actions.sendMenuDM}
          onChange={(v) => setActions({ sendMenuDM: v })}
        >
          <TextareaBlock
            value={rule.actions.menuChoices}
            onChange={(v) => setActions({ menuChoices: v })}
            placeholder={"1) Pricing\n2) Demo\n3) Support"}
          />
        </ToggleRow>

        <ToggleRow
          title="Send saved reply"
          description="Use a pre-built snippet or library entry."
          checked={rule.actions.sendSavedReply}
          onChange={(v) => setActions({ sendSavedReply: v })}
        >
          <div className="space-y-2">
            <Select value={rule.actions.savedReplyId ?? ""} onValueChange={(v) => setActions({ savedReplyId: v || null })}>
              <SelectTrigger><SelectValue placeholder="Pick from library (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {replies.map((r) => <SelectItem key={r.id} value={r.id}>{r.name || r.body.slice(0, 40)}</SelectItem>)}
              </SelectContent>
            </Select>
            <TextareaBlock
              value={rule.actions.savedReplyBody}
              onChange={(v) => setActions({ savedReplyBody: v })}
              placeholder="Or write a one-off snippet here."
            />
          </div>
        </ToggleRow>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Move to">
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
          </Field>
          <Field label="Assign to">
            <Select value={rule.actions.assignTo ?? "none"} onValueChange={(v) => setActions({ assignTo: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Nobody" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nobody</SelectItem>
                {members.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Apply label">
            <Input
              value={rule.actions.label ?? ""}
              onChange={(e) => setActions({ label: e.target.value || null })}
              placeholder="angry-customer"
            />
          </Field>
          <Field label="Priority">
            <Select value={rule.actions.priority} onValueChange={(v) => setActions({ priority: v as InboxPriority })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <ToggleRow
          title="Hide as spam"
          description="Hide from the main board and mark resolved."
          checked={rule.actions.hide}
          onChange={(v) => setActions({ hide: v })}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow
            title="Draft an AI reply"
            description="Queues a suggested reply for human approval."
            checked={rule.actions.aiDraftReply}
            onChange={(v) => setActions({ aiDraftReply: v })}
          >
            <Field label="Reply tone">
              <Select value={rule.actions.aiTone} onValueChange={(v) => setActions({ aiTone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </ToggleRow>
          <ToggleRow
            title="Notify a channel"
            description="Ping a channel about this conversation."
            checked={rule.actions.notify}
            onChange={(v) => setActions({ notify: v })}
          >
            <Field label="Channel">
              <Input
                value={rule.actions.notifyChannel}
                onChange={(e) => setActions({ notifyChannel: e.target.value })}
                placeholder="#engage"
              />
            </Field>
          </ToggleRow>
        </div>

        <ToggleRow
          title="Use AI classification"
          description="Slower but more accurate than keyword matching."
          checked={rule.actions.aiClassify}
          onChange={(v) => setActions({ aiClassify: v })}
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px]">{label}</Label>
      {children}
    </div>
  );
}

function TextareaBlock({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="resize-none text-xs"
    />
  );
}

function ToggleRow({ title, description, checked, onChange, children }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Label className="text-[11px] mb-0">{title}</Label>
          <p className="text-[9px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
      {checked && children && <div className="mt-2.5">{children}</div>}
    </div>
  );
}
