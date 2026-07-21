import { useEffect, useState } from "react";
import { Mail, Clock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useReportSchedules, CADENCE_LABEL, type Cadence } from "@/hooks/useReportSchedules";
import { guardWrite } from "@/hooks/useGuest";

interface ScheduleReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName?: string;
  templateId?: string;
}

function nextRunFor(cadence: Cadence): string {
  const now = new Date();
  const d = new Date(now);
  if (cadence === "daily") {
    d.setDate(d.getDate() + (d.getHours() >= 9 ? 1 : 0));
    d.setHours(9, 0, 0, 0);
  } else if (cadence === "weekly-mon") {
    const diff = (8 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(9, 0, 0, 0);
  } else if (cadence === "weekly-fri") {
    const diff = (12 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(17, 0, 0, 0);
  } else {
    d.setMonth(d.getMonth() + 1, 1);
    d.setHours(9, 0, 0, 0);
  }
  return d.toISOString();
}

export function ScheduleReportDialog({
  open,
  onOpenChange,
  templateName,
  templateId,
}: ScheduleReportDialogProps) {
  const { add } = useReportSchedules();
  const [name, setName] = useState(templateName ?? "");
  const [cadence, setCadence] = useState<Cadence>("weekly-mon");
  const [emailInput, setEmailInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [format, setFormat] = useState<"pdf" | "csv" | "text">("pdf");
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => { if (open) setName(templateName ?? ""); }, [open, templateName]);

  const addRecipient = () => {
    const v = emailInput.trim();
    if (!v || recipients.includes(v)) return;
    setRecipients((r) => [...r, v]);
    setEmailInput("");
  };

  const submit = () => {
    if (!guardWrite("schedule reports")) return;
    if (!name.trim() || recipients.length === 0) return;
    const now = new Date().toISOString();
    void add({
      id: `sch-${Date.now()}`,
      name: name.trim(),
      templateId: templateId ?? null,
      cadence,
      cadenceLabel: CADENCE_LABEL[cadence],
      timezone: tz,
      recipients,
      format,
      sections: [],
      active: true,
      nextRunAt: nextRunFor(cadence),
      lastRunAt: null,
      sharePublic: false,
      createdAt: now,
    });
    toast({ title: "Schedule created", description: `${name} will run ${CADENCE_LABEL[cadence].toLowerCase()}.` });
    onOpenChange(false);
    setName(""); setRecipients([]); setEmailInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule report
          </DialogTitle>
          <DialogDescription>Automatically generate and deliver this report on cadence.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Report name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cadence</Label>
              <Select value={cadence} onValueChange={(v) => setCadence(v as Cadence)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CADENCE_LABEL) as Cadence[]).map((c) => (
                    <SelectItem key={c} value={c}>{CADENCE_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="you@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRecipient(); } }}
              />
              <Button variant="outline" type="button" onClick={addRecipient}>Add</Button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recipients.map((r) => (
                  <span key={r} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r}
                    <button
                      type="button"
                      onClick={() => setRecipients((rs) => rs.filter((x) => x !== r))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">Timezone: {tz}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || recipients.length === 0}>
            <Mail className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
