import { useEffect, useMemo, useState } from "react";
import { Download, Trash2, Clock, Search, X, CalendarIcon } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useRunHistory, RunRecord } from "@/hooks/useRunHistory";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusColor = {
  success: "bg-green-500/10 text-green-600 border-green-500/30",
  failed: "bg-red-500/10 text-red-600 border-red-500/30",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
} as const;

const PAGE_SIZE = 25;
const PREFS_KEY = "smmpilot:run-history-prefs";

type DateRange = "all" | "today" | "7d" | "30d" | "custom";

interface Prefs {
  query: string;
  toolFilter: string;
  platformFilter: string;
  accountFilter: string;
  statusFilter: string;
  dateRange: DateRange;
  customFrom?: string;
  customTo?: string;
}

const defaultPrefs: Prefs = {
  query: "",
  toolFilter: "all",
  platformFilter: "all",
  accountFilter: "all",
  statusFilter: "all",
  dateRange: "all",
};

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultPrefs;
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export default function RunHistory() {
  const { rows, clear, remove } = useRunHistory();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [detail, setDetail] = useState<RunRecord | null>(null);
  const [page, setPage] = useState(1);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(
    prefs.customFrom ? new Date(prefs.customFrom) : undefined,
  );
  const [customTo, setCustomTo] = useState<Date | undefined>(
    prefs.customTo ? new Date(prefs.customTo) : undefined,
  );

  const update = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      savePrefs(next);
      return next;
    });
    setPage(1);
  };

  // Derived unique filter options
  const tools = useMemo(
    () => Array.from(new Set(rows.map((r) => r.toolKey))).sort(),
    [rows],
  );
  const platforms = useMemo(
    () => Array.from(new Set(rows.map((r) => r.platform).filter(Boolean) as string[])).sort(),
    [rows],
  );
  const accountHandles = useMemo(
    () => Array.from(new Set(rows.map((r) => r.accountHandle).filter(Boolean) as string[])).sort(),
    [rows],
  );

  const dateBounds = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    switch (prefs.dateRange) {
      case "today":
        return { from: startOfDay, to: Infinity };
      case "7d":
        return { from: now.getTime() - 7 * 24 * 60 * 60 * 1000, to: Infinity };
      case "30d":
        return { from: now.getTime() - 30 * 24 * 60 * 60 * 1000, to: Infinity };
      case "custom":
        return {
          from: customFrom ? customFrom.getTime() : -Infinity,
          to: customTo ? customTo.getTime() + 24 * 60 * 60 * 1000 : Infinity,
        };
      default:
        return { from: -Infinity, to: Infinity };
    }
  }, [prefs.dateRange, customFrom, customTo]);

  const filtered = useMemo(() => {
    const q = prefs.query.toLowerCase();
    return rows.filter((r) => {
      if (prefs.toolFilter !== "all" && r.toolKey !== prefs.toolFilter) return false;
      if (prefs.platformFilter !== "all" && r.platform !== prefs.platformFilter) return false;
      if (prefs.accountFilter !== "all" && r.accountHandle !== prefs.accountFilter) return false;
      if (prefs.statusFilter !== "all" && r.status !== prefs.statusFilter) return false;
      const t = new Date(r.createdAt).getTime();
      if (t < dateBounds.from || t > dateBounds.to) return false;
      if (q) {
        const hay = `${r.action} ${r.toolKey} ${r.accountHandle ?? ""} ${r.error ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, prefs, dateBounds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const hasActiveFilters =
    prefs.query ||
    prefs.toolFilter !== "all" ||
    prefs.platformFilter !== "all" ||
    prefs.accountFilter !== "all" ||
    prefs.statusFilter !== "all" ||
    prefs.dateRange !== "all";

  const clearFilters = () => {
    setPrefs(defaultPrefs);
    setCustomFrom(undefined);
    setCustomTo(undefined);
    savePrefs(defaultPrefs);
    setPage(1);
  };

  const exportCsv = () => {
    const header = ["time", "tool", "action", "platform", "handle", "status", "duration_ms", "preset", "error"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      const preset = (r.input as { presetName?: string })?.presetName ?? "";
      lines.push(
        [
          r.createdAt,
          r.toolKey,
          r.action,
          r.platform ?? "",
          r.accountHandle ?? "",
          r.status,
          r.durationMs ?? "",
          preset,
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

      <Card className="p-4 space-y-3 sticky top-2 z-10 backdrop-blur-md bg-card/95">
        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto_auto_auto_auto]">
          <div className="relative min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search action, tool, handle, error…"
              value={prefs.query}
              onChange={(e) => update("query", e.target.value)}
              aria-label="Search runs"
            />
          </div>
          <Select value={prefs.toolFilter} onValueChange={(v) => update("toolFilter", v)}>
            <SelectTrigger className="min-w-[140px]" aria-label="Filter by tool">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tools</SelectItem>
              {tools.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={prefs.platformFilter} onValueChange={(v) => update("platformFilter", v)}>
            <SelectTrigger className="min-w-[130px]" aria-label="Filter by platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={prefs.accountFilter} onValueChange={(v) => update("accountFilter", v)}>
            <SelectTrigger className="min-w-[130px]" aria-label="Filter by account">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accountHandles.map((h) => (
                <SelectItem key={h} value={h}>@{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={prefs.statusFilter} onValueChange={(v) => update("statusFilter", v)}>
            <SelectTrigger className="min-w-[120px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={prefs.dateRange}
            onValueChange={(v) => update("dateRange", v as DateRange)}
          >
            <SelectTrigger className="min-w-[120px]" aria-label="Filter by date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {prefs.dateRange === "custom" && (
            <div className="flex gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {customFrom ? format(customFrom, "MMM d") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customFrom}
                    onSelect={(d) => {
                      setCustomFrom(d);
                      update("customFrom", d?.toISOString());
                    }}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {customTo ? format(customTo, "MMM d") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customTo}
                    onSelect={(d) => {
                      setCustomTo(d);
                      update("customTo", d?.toISOString());
                    }}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "run" : "runs"}
            {hasActiveFilters && ` (of ${rows.length})`}
          </p>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7">
              <X className="mr-1 h-3 w-3" /> Clear filters
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Preset</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {rows.length === 0
                      ? "No activity yet. Use any automation tool to see runs logged here."
                      : "No runs match your filters. Try clearing them."}
                  </TableCell>
                </TableRow>
              )}
              {paged.map((r) => {
                const presetName = (r.input as { presetName?: string })?.presetName;
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetail(r)}>
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
                    <TableCell className="text-xs text-muted-foreground">
                      {presetName ?? "—"}
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
                );
              })}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border text-sm">
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
