import { useMemo, useState } from "react";
import {
  FileBarChart,
  Download,
  Calendar,
  Clock,
  Mail,
  Plus,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  MoreHorizontal,
  Check,
  Trash2,
  History,
  AlertCircle,
  Search,
  Send,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { NewReportDialog } from "@/components/reports/NewReportDialog";
import { ScheduleReportDialog } from "@/components/reports/ScheduleReportDialog";
import {
  ReportPreviewDialog,
  type ReportPreviewData,
} from "@/components/reports/ReportPreviewDialog";
import { toast } from "@/hooks/use-toast";
import { useRunHistory } from "@/hooks/useRunHistory";
import { useAccounts } from "@/contexts/AccountContext";
import { buildReportData } from "@/lib/reportAnalytics";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sections: string[];
}

interface GeneratedReport extends ReportPreviewData {
  createdAt: string;
  whitelabel?: boolean;
}

interface ScheduledReport {
  id: string;
  name: string;
  cadence: string;
  email: string;
  active: boolean;
  createdAt: string;
}

const reportTemplates: ReportTemplate[] = [
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

const seedReports: GeneratedReport[] = [
  {
    id: "seed-1",
    name: "Weekly Summary · Dec 2024",
    template: "Weekly Summary",
    period: "Dec 1-7, 2024",
    format: "pdf",
    size: "2.4 MB",
    sections: ["Follower Growth", "Engagement Rate", "Top Posts", "Reach & Impressions"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    name: "Monthly Growth · November",
    template: "Monthly Growth",
    period: "November 2024",
    format: "pdf",
    size: "4.8 MB",
    sections: ["Growth Metrics", "Audience Demographics", "Content Performance"],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

const seedSchedules: ScheduledReport[] = [
  {
    id: "seed-sch-1",
    name: "Weekly Summary",
    cadence: "Every Monday at 9:00 AM",
    email: "john@company.com",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export default function ReportsPage() {
  const { accounts } = useAccounts();
  const { rows: runRows } = useRunHistory();
  const {
    items: reports,
    add: addReport,
    remove: removeReport,
  } = useLocalCollection<GeneratedReport>("reports", "generated", seedReports);
  const {
    items: schedules,
    add: addSchedule,
    update: updateSchedule,
    remove: removeSchedule,
  } = useLocalCollection<ScheduledReport>("reports", "scheduled", seedSchedules);

  const [newOpen, setNewOpen] = useState(false);
  const [newTemplateId, setNewTemplateId] = useState<string | undefined>();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTemplateName, setScheduleTemplateName] = useState<string | undefined>();
  const [previewReport, setPreviewReport] = useState<GeneratedReport | null>(null);
  const [toDelete, setToDelete] = useState<GeneratedReport | null>(null);
  const [reportSearch, setReportSearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "active" | "paused">("all");

  const openTemplate = (id: string) => {
    setNewTemplateId(id);
    setNewOpen(true);
  };

  const openPreview = (report: GeneratedReport) => {
    if (!report.data) {
      const filled = { ...report, data: buildReportData(accounts, report.sections ?? [], "last30") };
      setPreviewReport(filled);
    } else {
      setPreviewReport(report);
    }
  };

  const templateRuns = (templateId: string) =>
    runRows.filter((r) => r.toolKey === "reports" && r.action === `generate:${templateId}`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileBarChart className="h-8 w-8 text-primary" />
            Reports Center
          </h1>
          <p className="text-muted-foreground mt-1">Generate and schedule custom reports</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setScheduleTemplateName(undefined);
              setScheduleOpen(true);
            }}
          >
            <Clock className="mr-2 h-4 w-4" />
            Schedule
          </Button>
          <Button
            onClick={() => {
              setNewTemplateId(undefined);
              setNewOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Report Templates</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reportTemplates.map((template) => {
            const runs = templateRuns(template.id);
            const last = runs[0];
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl bg-gradient-to-br mb-4 flex items-center justify-center",
                      template.color,
                    )}
                  >
                    <template.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

                  <div className="mb-3 rounded-md border bg-muted/30 p-2 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <History className="h-3 w-3" />
                        Runs
                      </span>
                      <span className="font-medium">{runs.length}</span>
                    </div>
                    {last ? (
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            last.status === "success"
                              ? "text-emerald-500"
                              : "text-destructive",
                          )}
                        >
                          {last.status === "success" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {last.status}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(last.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Not generated yet</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openTemplate(template.id)}
                    >
                      Use Template
                    </Button>
                    {last && last.status === "success" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const match = reports.find((r) => r.template === template.name);
                          if (match) openPreview(match);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>View and download your generated reports</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Search reports…"
                className="pl-8 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const filtered = reports.filter((r) => {
              const q = reportSearch.trim().toLowerCase();
              if (!q) return true;
              return `${r.name} ${r.template} ${r.period}`.toLowerCase().includes(q);
            });
            if (reports.length === 0) {
              return (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No reports yet. Create your first report to get started.
                </p>
              );
            }
            if (filtered.length === 0) {
              return (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No reports match "{reportSearch}".
                </p>
              );
            }
            return (
            <div className="space-y-3">
              {filtered.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{report.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {report.template}
                        </Badge>
                        <span>·</span>
                        <span>{report.period}</span>
                        <span>·</span>
                        <span>{report.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="uppercase">
                      {report.format}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => openPreview(report)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPreview(report)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setScheduleTemplateName(report.template);
                            setScheduleOpen(true);
                          }}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Email Report
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setToDelete(report)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>Automatically generate and deliver reports</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No scheduled reports. Set one up to get regular updates.
            </p>
          ) : (
            <div className="space-y-3">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                        s.active ? "bg-green-500/10" : "bg-muted",
                      )}
                    >
                      <Check
                        className={cn(
                          "h-5 w-5",
                          s.active ? "text-green-500" : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {s.cadence} · {s.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      className={cn(
                        s.active
                          ? "bg-green-500/10 text-green-500"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {s.active ? "Active" : "Paused"}
                    </Badge>
                    <Switch
                      checked={s.active}
                      onCheckedChange={(v) => updateSchedule(s.id, { active: v })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        removeSchedule(s.id);
                        toast({ title: "Schedule removed" });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NewReportDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        initialTemplateId={newTemplateId}
      />
      <ScheduleReportDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        templateName={scheduleTemplateName}
      />
      <ReportPreviewDialog
        open={!!previewReport}
        onOpenChange={(o) => !o && setPreviewReport(null)}
        report={previewReport}
      />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) {
                  removeReport(toDelete.id);
                  toast({ title: "Report deleted" });
                }
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
