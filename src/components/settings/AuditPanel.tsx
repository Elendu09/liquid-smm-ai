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
import { Search, Shield, Download, Trash2, AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { useRunHistory, type RunRecord } from "@/hooks/useRunHistory";
import { useLocalCollection, pushLocalCollection } from "@/hooks/useLocalCollection";
import { cn } from "@/lib/utils";

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  category: "member" | "billing" | "security" | "connection" | "settings";
  createdAt: string;
}

const seedAudit: AuditEntry[] = [
  {
    id: "a1",
    actor: "John Doe",
    action: "Enabled two-factor authentication",
    category: "security",
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: "a2",
    actor: "Sarah Smith",
    action: "Invited member",
    target: "emily@company.com",
    category: "member",
    createdAt: new Date(Date.now() - 8 * 3_600_000).toISOString(),
  },
  {
    id: "a3",
    actor: "John Doe",
    action: "Updated payment method",
    category: "billing",
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
    category: "settings",
    createdAt: r.createdAt,
  };
}

export function AuditPanel() {
  const { items, setItems, remove } = useLocalCollection<AuditEntry>("settings", "audit", seedAudit);
  const { rows } = useRunHistory();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | AuditEntry["category"]>("all");

  const combined = useMemo(() => {
    const runEntries = rows.slice(0, 50).map(runToAudit);
    return [...items, ...runEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [items, rows]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return combined.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (!q) return true;
      return `${e.actor} ${e.action} ${e.target ?? ""}`.toLowerCase().includes(q);
    });
  }, [combined, query, category]);

  const exportCsv = () => {
    const header = ["time", "actor", "action", "target", "category"];
    const lines = [header.join(",")];
    filtered.forEach((e) => {
      lines.push(
        [e.createdAt, e.actor, e.action, e.target ?? "", e.category]
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
                placeholder="Search actor, action, target…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger className="md:w-52">
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
          </div>
          <CardDescription>
            {filtered.length} of {combined.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[52px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
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
                      <TableCell className="text-sm">{e.action}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.target ?? "—"}</TableCell>
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

