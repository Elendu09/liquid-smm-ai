import { useState } from "react";
import { Mail, Clock } from "lucide-react";
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
import { pushLocalCollection } from "@/hooks/useLocalCollection";

interface ScheduleReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName?: string;
}

const CADENCES = [
  { value: "daily", label: "Every day at 9:00 AM" },
  { value: "weekly-mon", label: "Every Monday at 9:00 AM" },
  { value: "weekly-fri", label: "Every Friday at 5:00 PM" },
  { value: "monthly", label: "1st of every month at 9:00 AM" },
];

export function ScheduleReportDialog({
  open,
  onOpenChange,
  templateName,
}: ScheduleReportDialogProps) {
  const [name, setName] = useState(templateName ?? "");
  const [cadence, setCadence] = useState("weekly-mon");
  const [email, setEmail] = useState("");

  const submit = () => {
    if (!name.trim() || !email.trim()) return;
    pushLocalCollection("reports", "scheduled", [
      {
        id: `sch-${Date.now()}`,
        name,
        cadence: CADENCES.find((c) => c.value === cadence)?.label ?? cadence,
        email,
        active: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    toast({ title: "Schedule created", description: `${name} will be sent to ${email}.` });
    onOpenChange(false);
    setName("");
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule report
          </DialogTitle>
          <DialogDescription>Automatically generate and email this report.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Report name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cadence</Label>
            <Select value={cadence} onValueChange={setCadence}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CADENCES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Delivery email</Label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || !email.trim()}>
            <Mail className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
