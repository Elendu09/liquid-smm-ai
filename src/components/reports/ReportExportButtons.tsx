import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadCsv, openPrintablePdf, payloadFromReportData, type ReportPayload } from "@/lib/reportExport";
import type { ReportData } from "@/lib/reportAnalytics";

/**
 * ReportExportButtons
 *
 * Fix 5.2 — exports that don't scramble. The CSV uses a stable
 * columnar shape; the PDF captures the same data in a printable HTML
 * document. Used by NewReportDialog and ReportPreviewDialog.
 */
export function ReportExportButtons({
  data,
  name,
  period,
  platform,
  timezone,
  className,
}: {
  data: ReportData | null | undefined;
  name: string;
  period: string;
  platform?: string;
  timezone?: string;
  className?: string;
}) {
  const exportCsv = () => {
    if (!data) {
      toast.error("No data yet — wait for the report to finish.");
      return;
    }
    const payload = payloadFromReportData(data, { name, period, platform, timezone });
    downloadCsv(payload, `${slugify(name)}.csv`);
    toast.success("CSV downloaded", { description: "Open in Sheets, Notion, or your BI tool." });
  };

  const exportPdf = () => {
    if (!data) {
      toast.error("No data yet — wait for the report to finish.");
      return;
    }
    const payload: ReportPayload = payloadFromReportData(data, { name, period, platform, timezone });
    openPrintablePdf(payload);
    toast("Opening the print dialog", { description: "Choose \"Save as PDF\" to download." });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <Button size="sm" variant="outline" onClick={exportCsv}>
        <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> CSV
      </Button>
      <Button size="sm" variant="outline" onClick={exportPdf}>
        <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
      </Button>
      <span className="hidden text-[10px] text-muted-foreground sm:inline">
        Exports use the same column shape as the dashboard.
      </span>
    </div>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
