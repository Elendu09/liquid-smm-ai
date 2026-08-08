import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical, CheckCircle2, ShieldCheck, UserCheck, Mail } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useApprovalPolicies, type ApprovalPolicy, type ApprovalRole, type ApprovalStage, type ApprovalChannel } from "@/hooks/useApprovalPolicies";
import { useBrands } from "@/contexts/BrandContext";
import { platforms } from "@/config/platforms";

/**
 * ApprovalPolicyDialog
 *
 * Fix 4.2 — replace the single "needs approval" toggle with a chain of
 * configurable stages. Each stage has a role, optional @mentions that must
 * be in the draft, an expiry, and a notification channel.
 *
 * Visual: a vertical list of stages with a "+ Add stage" at the bottom.
 * Drag handle on each stage for reordering (we use up/down buttons for
 * accessibility — drag is wired but not required).
 */

const ROLES: { value: ApprovalRole; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { value: "owner", label: "Owner", icon: ShieldCheck, description: "Workspace owner. Can do anything." },
  { value: "admin", label: "Admin", icon: ShieldCheck, description: "Brand / workspace admin." },
  { value: "editor", label: "Editor", icon: UserCheck, description: "Can write, edit and propose drafts." },
  { value: "viewer", label: "Viewer", icon: UserCheck, description: "Read-only — rare for approval." },
  { value: "external", label: "External client", icon: Mail, description: "Magic-link approval, no account required." },
];

const EMPTY_STAGE: ApprovalStage = {
  id: "",
  label: "",
  requiredRole: "editor",
  mustMention: [],
  autoExpireHours: 48,
  notifyChannel: "",
};

const EMPTY_POLICY: Omit<ApprovalPolicy, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  description: "",
  brandId: null,
  channel: "any",
  tags: [],
  stages: [EMPTY_STAGE, EMPTY_STAGE],
  enabled: true,
};

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // eslint-disable-next-line no-restricted-syntax -- synth-ok: fallback id
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ApprovalPolicy | null;
  onSubmit?: (policy: ApprovalPolicy) => void;
}

export function ApprovalPolicyDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const { add, update } = useApprovalPolicies();
  const { brands } = useBrands();
  const [draft, setDraft] = useState<Omit<ApprovalPolicy, "id" | "createdAt" | "updatedAt">>(EMPTY_POLICY);
  const [tagText, setTagText] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const { id, createdAt, updatedAt, ...rest } = initial;
      setDraft(rest);
      setTagText(initial.tags?.join(", ") ?? "");
    } else {
      setDraft(EMPTY_POLICY);
      setTagText("");
    }
  }, [open, initial]);

  const updateStage = (i: number, patch: Partial<ApprovalStage>) => {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s, idx) => idx === i ? { ...s, ...patch, id: s.id || uid() } : s),
    }));
  };

  const addStage = () => {
    setDraft((d) => ({ ...d, stages: [...d.stages, { ...EMPTY_STAGE, id: uid() }] }));
  };

  const removeStage = (i: number) => {
    setDraft((d) => ({ ...d, stages: d.stages.filter((_, idx) => idx !== i) }));
  };

  const moveStage = (i: number, dir: -1 | 1) => {
    setDraft((d) => {
      const stages = [...d.stages];
      const j = i + dir;
      if (j < 0 || j >= stages.length) return d;
      [stages[i], stages[j]] = [stages[j], stages[i]];
      return { ...d, stages };
    });
  };

  const submit = () => {
    if (!draft.name.trim()) return;
    const tags = tagText.split(",").map((t) => t.trim()).filter(Boolean);
    const cleanedStages = draft.stages.filter((s) => s.label.trim().length > 0).map((s) => ({ ...s, id: s.id || uid() }));
    if (cleanedStages.length < 1) return;
    const payload = { ...draft, name: draft.name.trim(), tags, stages: cleanedStages };
    if (initial) {
      const result: ApprovalPolicy = { ...initial, ...payload };
      update(initial.id, payload);
      onSubmit?.(result);
    } else {
      const created = add(payload);
      onSubmit?.(created);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(96vw,52rem)] overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {initial ? "Edit approval policy" : "New approval policy"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Build a chain of approval stages. Each stage can require a role, a mention, or an external client.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-10rem)] overflow-y-auto px-5 py-4 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ap-name" className="text-xs">Policy name</Label>
              <Input id="ap-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Brand campaigns" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Channel</Label>
              <Select value={draft.channel ?? "any"} onValueChange={(v) => setDraft((d) => ({ ...d, channel: v as ApprovalChannel }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any channel</SelectItem>
                  {platforms.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ap-desc" className="text-xs">Description</Label>
            <Textarea id="ap-desc" value={draft.description ?? ""} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={2} className="resize-none text-xs" placeholder="e.g. All paid campaigns need manager + client sign-off." />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Brand binding <span className="text-muted-foreground">(optional)</span></Label>
              <Select value={draft.brandId ?? "any"} onValueChange={(v) => setDraft((d) => ({ ...d, brandId: v === "any" ? null : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All brands</SelectItem>
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-tags" className="text-xs">Tags <span className="text-muted-foreground">(comma separated)</span></Label>
              <Input id="ap-tags" value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="client, paid, launch" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Stages</p>
              <Button size="sm" variant="outline" onClick={addStage}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add stage
              </Button>
            </div>
            <div className="space-y-2">
              {draft.stages.length === 0 && (
                <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-[11px] text-muted-foreground">
                  Add at least one stage. The first one is who drafts; the last is who has the final say.
                </p>
              )}
              {draft.stages.map((s, i) => {
                const role = ROLES.find((r) => r.value === s.requiredRole);
                const Icon = role?.icon ?? UserCheck;
                return (
                  <div key={i} className="rounded-2xl border border-border/60 bg-card p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button
                          type="button"
                          aria-label="Move stage up"
                          onClick={() => moveStage(i, -1)}
                          disabled={i === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        <button
                          type="button"
                          aria-label="Move stage down"
                          onClick={() => moveStage(i, 1)}
                          disabled={i === draft.stages.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary text-[11px] font-semibold">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Stage label</Label>
                            <Input
                              value={s.label}
                              onChange={(e) => updateStage(i, { label: e.target.value })}
                              placeholder="e.g. Manager reviews"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Required role</Label>
                            <Select value={s.requiredRole} onValueChange={(v) => updateStage(i, { requiredRole: v as ApprovalRole })}>
                              <SelectTrigger className="h-8 w-[10rem] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    <span className="flex items-center gap-1.5">
                                      <r.icon className="h-3 w-3" /> {r.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Must @mention <span className="text-muted-foreground">(comma separated)</span></Label>
                            <Input
                              value={s.mustMention?.join(", ") ?? ""}
                              onChange={(e) => updateStage(i, { mustMention: e.target.value.split(",").map((m) => m.trim()).filter(Boolean) })}
                              placeholder="@brand-safety, @legal"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Notify channel</Label>
                            <Input
                              value={s.notifyChannel ?? ""}
                              onChange={(e) => updateStage(i, { notifyChannel: e.target.value })}
                              placeholder="#content-review"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-[10px] mb-0">Expires in</Label>
                            <Input
                              type="number"
                              min={1}
                              max={720}
                              value={s.autoExpireHours ?? 48}
                              onChange={(e) => updateStage(i, { autoExpireHours: Math.max(1, Number(e.target.value)) })}
                              className="h-7 w-20 text-xs"
                            />
                            <span className="text-[10px] text-muted-foreground">hours</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeStage(i)} aria-label="Remove stage">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {draft.stages.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                <CheckCircle2 className="inline h-3 w-3 mr-0.5 text-emerald-500" />
                A draft is published only after every stage has approved, in order. If a stage expires, the draft bounces back to the previous stage with a notification.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 p-2.5">
            <div>
              <Label className="text-[11px] mb-0">Active</Label>
              <p className="text-[9px] text-muted-foreground">Pause without deleting — the chain still resolves to drafts that already started.</p>
            </div>
            <Switch checked={draft.enabled} onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))} />
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/30 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}>{initial ? "Save policy" : "Create policy"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
