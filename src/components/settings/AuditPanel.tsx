import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Shield,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Filter,
  Save,
  Star,
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRunHistory, type RunRecord } from "@/hooks/useRunHistory";
import { useLocalCollection, pushLocalCollection } from "@/hooks/useLocalCollection";
import { cn } from "@/lib/utils";

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  resource?: string;
  ip?: string;
  refId?: string;
  category: "member" | "billing" | "security" | "connection" | "settings";
  createdAt: string;
}

interface SavedFilter {
  id: string;
  name: string;
  query: string;
  category: "all" | AuditEntry["category"];
  actor: string;
  ip: string;
  resource: string;
  refId: string;
}

const seedAudit: AuditEntry[] = [
  {
    id: "a1",
    actor: "John Doe",
    action: "Enabled two-factor authentication",
    category: "security",
    ip: "192.168.1.24",
    resource: "auth.user",
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: "a2",
    actor: "Sarah Smith",
    action: "Invited member",
    target: "emily@company.com",
    category: "member",
    ip: "10.0.4.55",
    resource: "team.invite",
    createdAt: new Date(Date.now() - 8 * 3_600_000).toISOString(),
  },
  {
    id: "a3",
    actor: "John Doe",
    action: "Updated payment method",
    category: "billing",
    ip: "192.168.1.24",
    resource: "billing.payment_method",
    refId: "pm_4242",
    createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
  },
];

const CATEGORY_STYLES: Record<AuditEntry["category"], string> = {
  member: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  billing: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  security: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  connection: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  settings: "bg-muted text-muted-foreground border-border",
};

function runToAudit(r: RunRecord): AuditEntry {
  return {
    id: r.id,
    actor: "System",
    action: `${r.toolKey} · ${r.action}`,
    target: r.accountHandle ? `@${r.accountHandle}` : undefined,
    resource: `run.${r.toolKey}`,
    refId: r.id,
    category: "settings",
    createdAt: r.createdAt,
  };
}

const EMPTY_FILTER: Omit<SavedFilter, "id" | "name"> = {
  query: "",
  category: "all",
  actor: "",
  ip: "",
  resource: "",
  refId: "",
};

export function AuditPanel() {
  const { items, setItems, remove } = useLocalCollection<AuditEntry>("settings", "audit", seedAudit);
  const { rows } = useRunHistory();
  const { items: saved, add: addSaved, remove: removeSaved } = useLocalCollection<SavedFilter>(
    "settings",
    "audit-filters",
    [],
  );

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [state, setState] = useState<Omit<SavedFilter, "id" | "name">>(EMPTY_FILTER);
  const [saveName, setSaveName] = useState("");

  const combined = useMemo(() => {
    const runEntries = rows.slice(0, 50).map(runToAudit);
    return [...items, ...runEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [items, rows]);

  const filtered = useMemo(() => {
    const q = state.query.toLowerCase().trim();
    const actor = state.actor.toLowerCase().trim();
    const ip = state.ip.toLowerCase().trim();
    const resource = state.resource.toLowerCase().trim();
    const refId = state.refId.toLowerCase().trim();
    return combined.filter((e) => {
      if (state.category !== "all" && e.category !== state.category) return false;
      if (actor && !e.actor.toLowerCase().includes(actor)) return false;
      if (ip && !(e.ip ?? "").toLowerCase().includes(ip)) return false;
      if (resource && !(e.resource ?? "").toLowerCase().includes(resource)) return false;
      if (refId && !(e.refId ?? "").toLowerCase().includes(refId)) return false;
      if (!q) return true;
      return `${e.actor} ${e.action} ${e.target ?? ""} ${e.resource ?? ""} ${e.ip ?? ""} ${e.refId ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [combined, state]);

  const activeCount =
    (state.query ? 1 : 0) +
    (state.category !== "all" ? 1 : 0) +
    (state.actor ? 1 : 0) +
    (state.ip ? 1 : 0) +
    (state.resource ? 1 : 0) +
    (state.refId ? 1 : 0);

  const clearAll = () => setState(EMPTY_FILTER);

  const applySaved = (f: SavedFilter) => {
    setState({
      query: f.query,
      category: f.category,
      actor: f.actor,
      ip: f.ip,
      resource: f.resource,
      refId: f.refId,
    });
    toast.success(`Applied “${f.name}”`);
  };

  const saveCurrent = () => {
    if (!saveName.trim()) {
      toast.error("Name your filter first");
      return;
    }
    addSaved({ id: crypto.randomUUID(), name: saveName.trim(), ...state });
    setSaveName("");
    toast.success("Filter saved");
  };

  const exportCsv = () => {
    const header = ["time", "actor", "ip", "action", "target", "resource", "ref_id", "category"];
    const lines = [header.join(",")];
    filtered.forEach((e) => {
      lines.push(
        [e.createdAt, e.actor, e.ip ?? "", e.action, e.target ?? "", e.resource ?? "", e.refId ?? "", e.category]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} entries`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Audit log
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every workspace change and automation event, in order.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setItems([]);
              toast.success("Audit log cleared");
            }}
            disabled={items.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search everything — actor, action, IP, resource, id…"
                value={state.query}
                onChange={(e) => setState((s) => ({ ...s, query: e.target.value }))}
              />
            </div>
            <Select
              value={state.category}
              onValueChange={(v) => setState((s) => ({ ...s, category: v as SavedFilter["category"] }))}
            >
              <SelectTrigger className="md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="connection">Connection</SelectItem>
                <SelectItem value="settings">Settings & runs</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={advancedOpen ? "default" : "outline"}
              onClick={() => setAdvancedOpen((v) => !v)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced
              {activeCount > 0 && (
                <Badge className="ml-2 h-4 min-w-4 px-1 text-[10px]">{activeCount}</Badge>
              )}
              <ChevronDown className={cn("h-3.5 w-3.5 ml-1 transition-transform", advancedOpen && "rotate-180")} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Star className="h-4 w-4 mr-2" />
                  Saved
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Saved filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {saved.length === 0 && (
                  <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                    No saved filters yet. Configure filters, name them below, then Save.
                  </div>
                )}
                {saved.map((f) => (
                  <DropdownMenuItem
                    key={f.id}
                    className="flex items-center justify-between gap-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      applySaved(f);
                    }}
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSaved(f.id);
                        toast.success("Filter removed");
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {advancedOpen && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  placeholder="Actor (name / email)"
                  value={state.actor}
                  onChange={(e) => setState((s) => ({ ...s, actor: e.target.value }))}
                />
                <Input
                  placeholder="IP address"
                  value={state.ip}
                  onChange={(e) => setState((s) => ({ ...s, ip: e.target.value }))}
                />
                <Input
                  placeholder="Resource (e.g. team.invite)"
                  value={state.resource}
                  onChange={(e) => setState((s) => ({ ...s, resource: e.target.value }))}
                />
                <Input
                  placeholder="Report / task / ref id"
                  value={state.refId}
                  onChange={(e) => setState((s) => ({ ...s, refId: e.target.value }))}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Input
                  placeholder="Name this filter to save"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearAll} disabled={activeCount === 0}>
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Clear
                  </Button>
                  <Button size="sm" onClick={saveCurrent} disabled={!saveName.trim()}>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save filter
                  </Button>
                </div>
              </div>
            </div>
          )}

          <CardDescription>
            {filtered.length} of {combined.length} entries
            {activeCount > 0 && <> · {activeCount} active filter{activeCount === 1 ? "" : "s"}</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource / ref</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[52px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                      No matching audit entries.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((e) => {
                  const managed = items.some((i) => i.id === e.id);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{e.actor}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {e.ip ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {e.action}
                        {e.target && (
                          <span className="block text-[11px] text-muted-foreground">→ {e.target}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="font-mono">{e.resource ?? "—"}</div>
                        {e.refId && <div className="text-[10px] opacity-70">{e.refId}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize", CATEGORY_STYLES[e.category])}>
                          {e.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {managed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              remove(e.id);
                              toast.success("Entry removed");
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legend</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Successful workspace change
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-amber-500" />
            Pending / awaiting action
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Failed or reverted action
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function logAudit(entry: Omit<AuditEntry, "id" | "createdAt">) {
  pushLocalCollection<AuditEntry>("settings", "audit", [
    { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...entry },
  ]);
}
