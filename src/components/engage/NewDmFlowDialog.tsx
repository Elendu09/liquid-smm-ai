import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Bot, User as UserIcon, PlayCircle, Send } from "lucide-react";
import { toast } from "sonner";

export interface DmFlow {
  id: number;
  name: string;
  trigger: string;
  greeting: string;
  qualifier: string;
  cta: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (flow: Omit<DmFlow, "id">) => void;
}

const TRIGGERS = [
  { value: "new_follow", label: "New follower" },
  { value: "story_reply", label: "Story reply" },
  { value: "keyword:pricing", label: "Keyword: pricing" },
  { value: "keyword:demo", label: "Keyword: demo" },
  { value: "mention", label: "Mention" },
];

interface Bubble { role: "user" | "bot"; text: string; }

export function NewDmFlowDialog({ open, onOpenChange, onCreate }: Props) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("new_follow");
  const [greeting, setGreeting] = useState("Hey! 👋 Thanks for connecting — what brings you here?");
  const [qualifier, setQualifier] = useState("Are you exploring for personal use or for a team?");
  const [cta, setCta] = useState("Cool! Here's a link to book a quick chat: example.com/demo");
  const [sandbox, setSandbox] = useState<Bubble[] | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    setName("");
    setTrigger("new_follow");
    setSandbox(null);
    setStep(0);
  }, [open]);

  const startSandbox = () => {
    setSandbox([{ role: "bot", text: greeting }]);
    setStep(1);
  };

  const nextTurn = () => {
    if (!sandbox) return;
    if (step === 1) {
      setSandbox([...sandbox, { role: "user", text: "For my team, we're 8 people." }, { role: "bot", text: qualifier }]);
      setStep(2);
    } else if (step === 2) {
      setSandbox([...sandbox, { role: "user", text: "Sounds good, what's next?" }, { role: "bot", text: cta }]);
      setStep(3);
    }
  };

  const submit = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    onCreate({ name: name.trim(), trigger, greeting, qualifier, cta });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New DM flow</DialogTitle>
          <DialogDescription>
            A short 3-step conversation: greet → qualify → CTA. Test it in the sandbox before going live.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <Label htmlFor="flow-name">Flow name</Label>
              <Input id="flow-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pricing Qualifier" />
            </div>
            <div>
              <Label>Trigger</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="flow-greet">1. Greeting</Label>
              <Textarea id="flow-greet" value={greeting} onChange={(e) => setGreeting(e.target.value)} className="min-h-[60px]" />
            </div>
            <div>
              <Label htmlFor="flow-q">2. Qualifier question</Label>
              <Textarea id="flow-q" value={qualifier} onChange={(e) => setQualifier(e.target.value)} className="min-h-[60px]" />
            </div>
            <div>
              <Label htmlFor="flow-cta">3. CTA</Label>
              <Textarea id="flow-cta" value={cta} onChange={(e) => setCta(e.target.value)} className="min-h-[60px]" />
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium flex items-center gap-1"><Bot className="h-4 w-4" /> Sandbox</div>
              <Badge variant="secondary" className="text-[10px]">test-in-sandbox</Badge>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-64 pr-1">
              {!sandbox && (
                <div className="text-xs text-muted-foreground text-center py-8">
                  Hit <span className="font-medium text-foreground">Start test</span> to preview the conversation.
                </div>
              )}
              {sandbox?.map((b, i) => (
                <div key={i} className={`flex gap-2 ${b.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${b.role === "bot" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {b.role === "bot" ? <Bot className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                  </div>
                  <div className={`text-xs rounded-lg p-2 max-w-[85%] ${b.role === "bot" ? "bg-primary/10" : "bg-secondary"}`}>
                    {b.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 mt-2 border-t border-border/60 flex justify-end gap-2">
              {!sandbox ? (
                <Button size="sm" variant="outline" onClick={startSandbox}>
                  <PlayCircle className="h-3.5 w-3.5 mr-1" /> Start test
                </Button>
              ) : step < 3 ? (
                <Button size="sm" variant="outline" onClick={nextTurn}>
                  <Send className="h-3.5 w-3.5 mr-1" /> Simulate next turn
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => { setSandbox(null); setStep(0); }}>Reset</Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create flow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
