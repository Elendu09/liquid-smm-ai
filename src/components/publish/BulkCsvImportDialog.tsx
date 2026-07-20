import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { cn } from "@/lib/utils";

const COLUMNS = ["caption", "scheduled_at", "platforms", "media_url", "first_comment", "hashtags"] as const;

const TEMPLATE =
  `caption,scheduled_at,platforms,media_url,first_comment,hashtags
"Kickoff post — new launch is live 🚀",2026-07-25T10:00,"instagram|twitter",https://picsum.photos/800,"First!","launch|new"
"Behind the scenes of build week",2026-07-26T14:30,tiktok,,"Watch till the end","bts|makers"
`;

interface ParsedRow {
  index: number;
  raw: string;
  caption: string;
  scheduledAt: string;
  platformIds: string[];
  mediaUrl?: string;
  firstComment?: string;
  hashtags?: string[];
  error?: string;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  return lines.slice(1).map<ParsedRow>((line, i) => {
    const cells = splitCsvLine(line);
    const get = (n: string) => (idx(n) >= 0 ? (cells[idx(n)] ?? "").trim() : "");

    const caption = get("caption");
    const scheduledRaw = get("scheduled_at");
    const platformsRaw = get("platforms");
    const mediaUrl = get("media_url") || undefined;
    const firstComment = get("first_comment") || undefined;
    const hashtagsRaw = get("hashtags");

    const platforms = platformsRaw
      .split(/[|;,]/)
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    const hashtags = hashtagsRaw
      ? hashtagsRaw.split(/[|;,]/).map((h) => h.trim().replace(/^#/, "")).filter(Boolean)
      : undefined;

    let scheduledAt = "";
    let error: string | undefined;
    if (!caption) error = "Missing caption";
    else if (!scheduledRaw) error = "Missing scheduled_at";
    else if (platforms.length === 0) error = "Missing platforms";
    else {
      const d = new Date(scheduledRaw);
      if (Number.isNaN(d.getTime())) error = "Invalid scheduled_at";
      else scheduledAt = d.toISOString();
    }

    return {
      index: i + 2, // human line number (header = 1)
      raw: line,
      caption,
      scheduledAt,
      platformIds: platforms,
      mediaUrl,
      firstComment,
      hashtags,
      error,
    };
  });
}

export function BulkCsvImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { add } = useScheduledPosts();
  const [text, setText] = useState("");

  const rows = useMemo(() => (text.trim() ? parseCsv(text) : []), [text]);
  const valid = rows.filter((r) => !r.error);
  const invalid = rows.filter((r) => r.error);

  const onFile = async (file: File) => {
    const t = await file.text();
    setText(t);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smmpilot-bulk-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAll = () => {
    if (valid.length === 0) { toast.error("No valid rows to import"); return; }
    for (const r of valid) {
      add({
        caption: r.caption,
        scheduledAt: r.scheduledAt,
        platformIds: r.platformIds,
        mediaUrl: r.mediaUrl,
        firstComment: r.firstComment,
        hashtags: r.hashtags,
      });
    }
    toast.success(`Imported ${valid.length} post${valid.length === 1 ? "" : "s"}`);
    setText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-w-[calc(100vw-2rem)] w-full max-h-[92vh] overflow-y-auto [&>button.absolute]:hidden">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" /> Bulk CSV import
              </DialogTitle>
              <DialogDescription>
                Upload or paste a CSV to schedule many posts at once. Columns: {COLUMNS.join(", ")}.
              </DialogDescription>
            </div>
            <DialogClose className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground hover:bg-muted hover:text-foreground transition shrink-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
              />
            </label>
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Template
          </Button>
          {rows.length > 0 && (
            <div className="flex items-center gap-2 ml-auto text-xs">
              <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {valid.length} valid</Badge>
              {invalid.length > 0 && <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3 text-rose-500" /> {invalid.length} invalid</Badge>}
            </div>
          )}
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Paste CSV here or use Upload above…"
          className="font-mono text-[11px]"
        />

        {rows.length > 0 && (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-muted/40 sticky top-0">
                  <tr className="text-left">
                    <th className="px-2 py-1.5 font-semibold w-8">#</th>
                    <th className="px-2 py-1.5 font-semibold">Caption</th>
                    <th className="px-2 py-1.5 font-semibold">Scheduled</th>
                    <th className="px-2 py-1.5 font-semibold">Platforms</th>
                    <th className="px-2 py-1.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.index} className={cn("border-t border-border/40", r.error && "bg-rose-500/5")}>
                      <td className="px-2 py-1.5 tabular-nums text-muted-foreground">{r.index}</td>
                      <td className="px-2 py-1.5 max-w-[240px] truncate">{r.caption || <span className="italic text-muted-foreground">(empty)</span>}</td>
                      <td className="px-2 py-1.5 tabular-nums text-muted-foreground">
                        {r.scheduledAt ? new Date(r.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground capitalize">{r.platformIds.join(", ") || "—"}</td>
                      <td className="px-2 py-1.5">
                        {r.error
                          ? <span className="inline-flex items-center gap-1 text-rose-500"><AlertCircle className="h-3 w-3" />{r.error}</span>
                          : <span className="inline-flex items-center gap-1 text-emerald-500"><CheckCircle2 className="h-3 w-3" />OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={importAll} disabled={valid.length === 0}>
            Import {valid.length > 0 ? `${valid.length} post${valid.length === 1 ? "" : "s"}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
