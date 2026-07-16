import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EyeOff, Flag, Ban, Plus, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModerationAction = "hide" | "flag" | "block";

export interface ModerationRule {
  id: string;
  keyword: string;
  action: ModerationAction;
  enabled: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rules: ModerationRule[];
  onSave: (rules: ModerationRule[]) => void;
}

const ACTION_META: Record<ModerationAction, { label: string; icon: typeof EyeOff; color: string }> = {
  hide: { label: "Hide", icon: EyeOff, color: "text-muted-foreground" },
  flag: { label: "Flag", icon: Flag, color: "text-brand-orange" },
  block: { label: "Block", icon: Ban, color: "text-destructive" },
};

export function ModerationDialog({ open, onOpenChange, rules, onSave }: Props) {
  const [draft, setDraft] = useState<ModerationRule[]>(rules);
  const [keyword, setKeyword] = useState("");
  const [action, setAction] = useState<ModerationAction>("hide");

  useEffect(() => { if (open) setDraft(rules); }, [open, rules]);

  const add = () => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return;
    if (draft.some((r) => r.keyword === kw)) return;
    setDraft((prev) => [...prev, { id: crypto.randomUUID(), keyword: kw, action, enabled: true }]);
    setKeyword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> Moderation rules
          </DialogTitle>
          <DialogDescription>
            Auto-hide, flag, or block comments matching keywords before you reply.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">Keyword or phrase</Label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
                placeholder="spam, scam, http://…"
              />
            </div>
            <div className="flex gap-1">
              {(Object.keys(ACTION_META) as ModerationAction[]).map((a) => {
                const M = ACTION_META[a];
                const Icon = M.icon;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAction(a)}
                    aria-pressed={action === a}
                    className={cn(
                      "h-9 w-9 rounded-md border flex items-center justify-center",
                      action === a ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted",
                    )}
                    aria-label={M.label}
                  >
                    <Icon className={cn("h-4 w-4", action === a ? "text-primary" : M.color)} />
                  </button>
                );
              })}
              <Button size="sm" onClick={add} disabled={!keyword.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {draft.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                No rules yet. Add one above.
              </p>
            )}
            {draft.map((r) => {
              const M = ACTION_META[r.action];
              const Icon = M.icon;
              return (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded-md border border-border/60 bg-muted/30">
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", M.color)} />
                  <span className="text-sm flex-1 truncate">{r.keyword}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{r.action}</Badge>
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(v) => setDraft((prev) => prev.map((x) => x.id === r.id ? { ...x, enabled: v } : x))}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDraft((prev) => prev.filter((x) => x.id !== r.id))}
                    aria-label="Remove rule"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(draft); onOpenChange(false); }}>Save rules</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
