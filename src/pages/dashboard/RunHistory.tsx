import { useMemo, useState } from "react";
import { Download, Trash2, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRunHistory, RunRecord } from "@/hooks/useRunHistory";
import { PlatformIcon } from "@/components/shared/PlatformIcon";

const statusColor = {
  success: "bg-green-500/10 text-green-600 border-green-500/30",
  failed: "bg-red-500/10 text-red-600 border-red-500/30",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
} as const;

export default function RunHistory() {
  const { rows, clear, remove } = useRunHistory();
  const [query, setQuery] = useState("");
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detail, setDetail] = useState<RunRecord | null>(null);

  const tools = useMemo(() => Array.from(new Set(rows.map((r) => r.toolKey))).sort(), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (toolFilter !== "all" && r.toolKey !== toolFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !r.action.toLowerCase().includes(q) &&
          !r.toolKey.toLowerCase().includes(q) &&
          !(r.accountHandle ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rows, query, toolFilter, statusFilter]);

  const exportCsv = () => {
    const header = ["time", "tool", "action", "platform", "handle", "status", "duration_ms", "error"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      lines.push(
        [
          r.createdAt,
          r.toolKey,
          r.action,
          r.platform ?? "",
          r.accountHandle ?? "",
          r.status,
          r.durationMs ?? "",
          (r.error ?? "").replace(/[\r\n,]+/g, " "),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} rows`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" /> Activity
          </h1>
          <p className="text-muted-foreground mt-1">
            Full history of every action across your automation tools.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              clear();
              toast.success("History cleared");
            }}
            disabled={!rows.length}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search action, tool, handle…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={toolFilter} onValueChange={setToolFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tools</SelectItem>
              {tools.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No activity yet. Use any automation tool to see runs logged here.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => setDetail(r)}
                >
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{r.toolKey}</TableCell>
                  <TableCell className="text-sm">{r.action}</TableCell>
                  <TableCell>
                    {r.platform ? (
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={r.platform} size="xs" />
                        <span className="text-xs">
                          {r.accountHandle ? `@${r.accountHandle}` : r.platform}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[r.status]}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {r.durationMs != null ? `${r.durationMs}ms` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Run detail</SheetTitle>
          </SheetHeader>
          {detail && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Tool:</span> {detail.toolKey}</div>
                <div><span className="text-muted-foreground">Action:</span> {detail.action}</div>
                <div><span className="text-muted-foreground">Status:</span> {detail.status}</div>
                <div><span className="text-muted-foreground">Duration:</span> {detail.durationMs ?? "—"}ms</div>
                <div><span className="text-muted-foreground">Platform:</span> {detail.platform ?? "—"}</div>
                <div><span className="text-muted-foreground">Handle:</span> {detail.accountHandle ? `@${detail.accountHandle}` : "—"}</div>
              </div>
              {detail.error && (
                <div>
                  <p className="text-xs font-semibold text-red-500 mb-1">Error</p>
                  <pre className="p-2 rounded bg-red-500/10 text-red-600 text-xs overflow-auto">{detail.error}</pre>
                </div>
              )}
              {detail.input && (
                <div>
                  <p className="text-xs font-semibold mb-1">Input</p>
                  <pre className="p-2 rounded bg-secondary text-xs overflow-auto">{JSON.stringify(detail.input, null, 2)}</pre>
                </div>
              )}
              {detail.output && (
                <div>
                  <p className="text-xs font-semibold mb-1">Output</p>
                  <pre className="p-2 rounded bg-secondary text-xs overflow-auto">{JSON.stringify(detail.output, null, 2)}</pre>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  remove(detail.id);
                  setDetail(null);
                  toast.success("Row removed");
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Remove this entry
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
