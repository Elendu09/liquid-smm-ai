import { useState } from "react";
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
  Check
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sections: string[];
}

interface GeneratedReport {
  id: string;
  name: string;
  template: string;
  createdAt: Date;
  period: string;
  format: "pdf" | "csv" | "excel";
  size: string;
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

const generatedReports: GeneratedReport[] = [
  { id: "1", name: "Weekly Summary - Dec 2024", template: "Weekly Summary", createdAt: new Date(), period: "Dec 1-7, 2024", format: "pdf", size: "2.4 MB" },
  { id: "2", name: "Monthly Growth - November", template: "Monthly Growth", createdAt: new Date(Date.now() - 86400000 * 7), period: "November 2024", format: "pdf", size: "4.8 MB" },
  { id: "3", name: "Content Performance Q4", template: "Content Performance", createdAt: new Date(Date.now() - 86400000 * 14), period: "Q4 2024", format: "excel", size: "1.2 MB" },
  { id: "4", name: "Engagement Analysis - Nov", template: "Engagement Analysis", createdAt: new Date(Date.now() - 86400000 * 21), period: "November 2024", format: "pdf", size: "3.1 MB" },
];

export default function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [whitelabel, setWhitelabel] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileBarChart className="h-8 w-8 text-primary" />
            Reports Center
          </h1>
          <p className="text-muted-foreground mt-1">Generate and schedule custom reports</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>Select a template and customize your report</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                {reportTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      selectedTemplate === template.id ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                    )}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center", template.color)}>
                        <template.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.sections.slice(0, 3).map((section) => (
                        <Badge key={section} variant="secondary" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                      {template.sections.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{template.sections.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Select defaultValue="last7">
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
                    <Select defaultValue="pdf">
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

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Schedule delivery</p>
                      <p className="text-xs text-muted-foreground">Receive reports automatically via email</p>
                    </div>
                  </div>
                  <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
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

              <Button className="w-full" disabled={!selectedTemplate}>
                <FileBarChart className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Report Templates</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reportTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className={cn("h-12 w-12 rounded-xl bg-gradient-to-br mb-4 flex items-center justify-center", template.color)}>
                  <template.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>View and download your generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generatedReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">{report.template}</Badge>
                      <span>•</span>
                      <span>{report.period}</span>
                      <span>•</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase">{report.format}</Badge>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Email Report
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>Automatically generate and deliver reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">Every Monday at 9:00 AM • john@company.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/10 text-green-500">Active</Badge>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
