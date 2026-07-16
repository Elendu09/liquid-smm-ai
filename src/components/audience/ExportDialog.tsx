import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export interface ExportRow {
  [k: string]: string | number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filename: string;
  rows: ExportRow[];
}

export function ExportDialog({ open, onOpenChange, filename, rows }: Props) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [includeGhosts, setIncludeGhosts] = useState(true);
  const [includeUnfollowers, setIncludeUnfollowers] = useState(true);

  const download = () => {
    const filtered = rows.filter((r) => {
      if (!includeGhosts && r.type === "ghost") return false;
      if (!includeUnfollowers && r.type === "unfollower") return false;
      return true;
    });
    let blob: Blob;
    let ext: string;
    if (format === "json") {
      blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
      ext = "json";
    } else {
      const keys = Array.from(new Set(filtered.flatMap((r) => Object.keys(r))));
      const csv = [
        keys.join(","),
        ...filtered.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
      blob = new Blob([csv], { type: "text/csv" });
      ext = "csv";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${format.toUpperCase()} exported (${filtered.length} rows)`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" /> Export followers
          </DialogTitle>
          <DialogDescription>Choose a format and which segments to include.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Format</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                aria-pressed={format === "csv"}
                className={`p-3 rounded-md border text-left ${format === "csv" ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted"}`}
              >
                <FileSpreadsheet className="h-4 w-4 text-primary mb-1" />
                <p className="text-sm font-medium">CSV</p>
                <p className="text-[10px] text-muted-foreground">Sheets / Excel</p>
              </button>
              <button
                type="button"
                onClick={() => setFormat("json")}
                aria-pressed={format === "json"}
                className={`p-3 rounded-md border text-left ${format === "json" ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted"}`}
              >
                <FileJson className="h-4 w-4 text-primary mb-1" />
                <p className="text-sm font-medium">JSON</p>
                <p className="text-[10px] text-muted-foreground">Raw structured data</p>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Include</Label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeGhosts} onCheckedChange={(v) => setIncludeGhosts(!!v)} /> Ghost followers
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeUnfollowers} onCheckedChange={(v) => setIncludeUnfollowers(!!v)} /> Recent unfollowers
            </label>
          </div>

          <p className="text-[10px] text-muted-foreground">
            {rows.length} row{rows.length === 1 ? "" : "s"} available.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={download}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
