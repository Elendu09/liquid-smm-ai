import { useState } from "react";
import { FileBarChart, Calendar, TrendingUp, Users, BarChart3, Check, Mail, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { pushLocalCollection } from "@/hooks/useLocalCollection";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sections: string[];
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: "weekly",
    name: "Weekly Summary",
    description: "Overview of performance across all platforms",
    icon: Calendar,
    color: "from-blue-500 to-cyan-500",
    sections: ["Follower Growth", "Engagement Rate", "Top Posts", "Reach & Impressions"],
  },
  {
    id: "monthly",
    name: "Monthly Growth",
    description: "Detailed monthly analytics and trends",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
    sections: ["Growth Metrics", "Audience Demographics", "Content Performance", "Competitor Comparison"],
  },
  {
    id: "engagement",
    name: "Engagement Analysis",
    description: "Deep dive into engagement metrics",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    sections: ["Comment Analysis", "Like Patterns", "Share Metrics", "Save Rate"],
  },
  {
    id: "content",
    name: "Content Performance",
    description: "Analyze your best performing content",
    icon: BarChart3,
    color: "from-orange-500 to-red-500",
    sections: ["Top Content", "Content Types", "Posting Times", "Hashtag Performance"],
  },
];

interface NewReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplateId?: string;
}

export function NewReportDialog({ open, onOpenChange, initialTemplateId }: NewReportDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [templateId, setTemplateId] = useState<string>(initialTemplateId ?? "");
  const [name, setName] = useState("");
  const [range, setRange] = useState("last7");
  const [format, setFormat] = useState<"pdf" | "csv" | "excel">("pdf");
  const [sections, setSections] = useState<string[]>([]);
  const [schedule, setSchedule] = useState(false);
  const [whitelabel, setWhitelabel] = useState(false);
  const [email, setEmail] = useState("");

  const template = TEMPLATES.find((t) => t.id === templateId);

  const reset = () => {
    setStep(1);
    setTemplateId(initialTemplateId ?? "");
    setName("");
    setRange("last7");
    setFormat("pdf");
    setSections([]);
    setSchedule(false);
    setWhitelabel(false);
    setEmail("");
  };

  const handleTemplatePick = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id)!;
    setTemplateId(id);
    setSections(t.sections);
    setName(`${t.name} · ${new Date().toLocaleDateString()}`);
  };

  const toggleSection = (s: string) => {
    setSections((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const generate = () => {
    if (!template) return;
    const periodLabel =
      range === "last7"
        ? "Last 7 days"
        : range === "last30"
        ? "Last 30 days"
        : range === "last90"
        ? "Last 90 days"
        : "Custom range";
    pushLocalCollection("reports", "generated", [
      {
        id: `rpt-${Date.now()}`,
        name: name || `${template.name} · ${new Date().toLocaleDateString()}`,
        template: template.name,
        period: periodLabel,
        format,
        size: `${(1 + Math.random() * 5).toFixed(1)} MB`,
        sections,
        whitelabel,
        createdAt: new Date().toISOString(),
      },
    ]);
    if (schedule && email) {
      pushLocalCollection("reports", "scheduled", [
        {
          id: `sch-${Date.now()}`,
          name: template.name,
          cadence: "Every Monday at 9:00 AM",
          email,
          active: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    toast({ title: "Report generated", description: `${template.name} is ready to download.` });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Select a template to get started" : "Customize your report"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2 py-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplatePick(t.id)}
                className={cn(
                  "text-left p-4 rounded-lg border transition-all",
                  templateId === t.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50",
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                      t.color,
                    )}
                  >
                    <t.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{t.name}</h4>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.sections.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && template && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Report name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7">Last 7 days</SelectItem>
                    <SelectItem value="last30">Last 30 days</SelectItem>
                    <SelectItem value="last90">Last 90 days</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                    <SelectItem value="excel">Excel Workbook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sections</Label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border">
                {template.sections.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={sections.includes(s)}
                      onCheckedChange={() => toggleSection(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Schedule delivery</p>
                  <p className="text-xs text-muted-foreground">Send this report weekly by email</p>
                </div>
              </div>
              <Switch checked={schedule} onCheckedChange={setSchedule} />
            </div>

            {schedule && (
              <div className="space-y-2">
                <Label>Delivery email</Label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">White-label</p>
                  <p className="text-xs text-muted-foreground">Remove branding for client reports</p>
                </div>
              </div>
              <Switch checked={whitelabel} onCheckedChange={setWhitelabel} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 2 && (
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
          )}
          {step === 1 ? (
            <Button disabled={!templateId} onClick={() => setStep(2)}>
              Continue
            </Button>
          ) : (
            <Button onClick={generate} disabled={sections.length === 0}>
              <FileBarChart className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
