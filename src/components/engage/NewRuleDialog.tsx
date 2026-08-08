import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export interface RuleDraft {
  id?: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

const TRIGGERS = [
  "New follower",
  "Comment contains keyword",
  "Story mention",
  "DM contains keyword",
  "Hashtag match",
  "Post like",
];

const ACTIONS = [
  "Send welcome DM",
  "Reply to comment",
  "Like recent posts",
  "Follow back",
  "Add to segment",
  "Notify me",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: RuleDraft | null;
  onSubmit: (draft: RuleDraft) => void;
}

export function NewRuleDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState(TRIGGERS[0]);
  const [keyword, setKeyword] = useState("");
  const [action, setAction] = useState(ACTIONS[0]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    // strip keyword hint out of trigger for editing
    const t = initial?.trigger ?? TRIGGERS[0];
    const m = t.match(/^(.*?) "(.+)"$/);
    if (m) {
      setTrigger(TRIGGERS.find((x) => x.toLowerCase().startsWith(m[1].toLowerCase())) ?? m[1]);
      setKeyword(m[2]);
    } else {
      setTrigger(TRIGGERS.includes(t) ? t : TRIGGERS[0]);
      setKeyword("");
    }
    setAction(initial?.action && ACTIONS.includes(initial.action) ? initial.action : ACTIONS[0]);
    setEnabled(initial?.enabled ?? true);
  }, [open, initial]);

  const needsKeyword = trigger.toLowerCase().includes("keyword") || trigger.toLowerCase().includes("hashtag");

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (needsKeyword && !keyword.trim()) {
      toast.error("Keyword is required for this trigger");
      return;
    }
    const finalTrigger = needsKeyword ? `${trigger} "${keyword.trim()}"` : trigger;
    onSubmit({ id: initial?.id, name: name.trim(), trigger: finalTrigger, action, enabled });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit rule" : "New automation rule"}</DialogTitle>
          <DialogDescription>Define a trigger and a response. You can test it before enabling.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="rule-name">Name</Label>
            <Input id="rule-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome new followers" />
          </div>
          <div>
            <Label>When</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {needsKeyword && (
            <div>
              <Label htmlFor="rule-kw">Keyword</Label>
              <Input id="rule-kw" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. price" />
            </div>
          )}
          <div>
            <Label>Then</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="rule-enabled" className="mb-0">Enable immediately</Label>
            <Switch id="rule-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{initial?.id ? "Save" : "Create rule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
