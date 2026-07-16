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
import { Download, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface ReportPreviewData {
  id: string;
  name: string;
  template: string;
  period: string;
  format: string;
  size: string;
  sections?: string[];
}

interface ReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportPreviewData | null;
}

export function ReportPreviewDialog({ open, onOpenChange, report }: ReportPreviewDialogProps) {
  if (!report) return null;

  const download = () => {
    const blob = new Blob(
      [
        `Report: ${report.name}\nTemplate: ${report.template}\nPeriod: ${report.period}\n\nSections:\n${(report.sections ?? []).map((s) => `- ${s}`).join("\n")}`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, "_")}.${report.format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download started", description: report.name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {report.name}
          </DialogTitle>
          <DialogDescription>
            {report.template} · {report.period} · {report.size}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{report.template}</h2>
              <p className="text-sm text-muted-foreground">{report.period}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(report.sections ?? []).map((s) => (
                <div key={s} className="p-3 rounded border bg-card">
                  <p className="text-xs text-muted-foreground">{s}</p>
                  <p className="text-lg font-semibold mt-1">
                    {(Math.random() * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
              {!report.sections?.length && (
                <p className="col-span-2 text-sm text-muted-foreground text-center py-8">
                  No sections in this report.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="uppercase">
              {report.format}
            </Badge>
            <Badge variant="secondary">{(report.sections ?? []).length} sections</Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={download}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
