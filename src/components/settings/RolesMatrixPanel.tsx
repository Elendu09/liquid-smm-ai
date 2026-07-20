import { useMemo, useState } from "react";
import { Check, Minus, Shield, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Role = "owner" | "admin" | "editor" | "approver" | "analyst" | "viewer";
type Perm = "granted" | "denied" | "conditional";

const ROLES: { id: Role; label: string; description: string; tone: string }[] = [
  { id: "owner", label: "Owner", description: "Full billing + workspace control", tone: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
  { id: "admin", label: "Admin", description: "Manage members, integrations, brand", tone: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  { id: "editor", label: "Editor", description: "Create, edit, schedule content", tone: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  { id: "approver", label: "Approver", description: "Approve or reject scheduled posts", tone: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  { id: "analyst", label: "Analyst", description: "View analytics, export reports", tone: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30" },
  { id: "viewer", label: "Viewer", description: "Read-only access", tone: "bg-muted text-muted-foreground border-border" },
];

const CAPS: { group: string; items: { id: string; label: string; matrix: Record<Role, Perm> }[] }[] = [
  {
    group: "Content",
    items: [
      { id: "create.post",   label: "Create posts",         matrix: { owner: "granted", admin: "granted", editor: "granted",     approver: "denied",      analyst: "denied",  viewer: "denied" } },
      { id: "schedule.post", label: "Schedule posts",       matrix: { owner: "granted", admin: "granted", editor: "granted",     approver: "denied",      analyst: "denied",  viewer: "denied" } },
      { id: "approve.post",  label: "Approve / reject",     matrix: { owner: "granted", admin: "granted", editor: "conditional", approver: "granted",     analyst: "denied",  viewer: "denied" } },
      { id: "publish.now",   label: "Publish immediately",  matrix: { owner: "granted", admin: "granted", editor: "conditional", approver: "granted",     analyst: "denied",  viewer: "denied" } },
      { id: "delete.post",   label: "Delete posts",         matrix: { owner: "granted", admin: "granted", editor: "conditional", approver: "denied",      analyst: "denied",  viewer: "denied" } },
    ],
  },
  {
    group: "Engage",
    items: [
      { id: "engage.reply",   label: "Reply to DMs & comments", matrix: { owner: "granted", admin: "granted", editor: "granted",     approver: "denied", analyst: "denied",     viewer: "denied" } },
      { id: "engage.rules",   label: "Manage automation rules", matrix: { owner: "granted", admin: "granted", editor: "conditional", approver: "denied", analyst: "denied",     viewer: "denied" } },
      { id: "engage.export",  label: "Export inbox",            matrix: { owner: "granted", admin: "granted", editor: "denied",      approver: "denied", analyst: "granted",    viewer: "denied" } },
    ],
  },
  {
    group: "Analytics",
    items: [
      { id: "analytics.view",   label: "View analytics",         matrix: { owner: "granted", admin: "granted", editor: "granted", approver: "granted", analyst: "granted", viewer: "granted" } },
      { id: "analytics.export", label: "Export & schedule reports", matrix: { owner: "granted", admin: "granted", editor: "denied",  approver: "denied",  analyst: "granted", viewer: "denied"  } },
    ],
  },
  {
    group: "Workspace",
    items: [
      { id: "team.manage",    label: "Manage team members",       matrix: { owner: "granted", admin: "granted", editor: "denied", approver: "denied", analyst: "denied", viewer: "denied" } },
      { id: "billing.manage", label: "Manage billing",            matrix: { owner: "granted", admin: "denied",  editor: "denied", approver: "denied", analyst: "denied", viewer: "denied" } },
      { id: "integrations",   label: "Connect / disconnect apps", matrix: { owner: "granted", admin: "granted", editor: "denied", approver: "denied", analyst: "denied", viewer: "denied" } },
      { id: "brand.edit",     label: "Edit brand / white-label",  matrix: { owner: "granted", admin: "granted", editor: "denied", approver: "denied", analyst: "denied", viewer: "denied" } },
    ],
  },
];

function PermCell({ p }: { p: Perm }) {
  if (p === "granted") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500" title="Granted">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (p === "conditional") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-bold" title="Conditional (requires approval)">
        ~
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground/60" title="Denied">
      <Minus className="h-3.5 w-3.5" />
    </span>
  );
}

/**
 * Read-only permissions matrix. Roles + rules are canonical (source of truth
 * lives here). Individual member role assignments happen on the Team page.
 */
export function RolesMatrixPanel() {
  const [focus, setFocus] = useState<Role | null>(null);

  const stats = useMemo(() => {
    const total = CAPS.reduce((n, g) => n + g.items.length, 0);
    return ROLES.map((r) => {
      let g = 0, c = 0;
      CAPS.forEach((grp) => grp.items.forEach((i) => {
        if (i.matrix[r.id] === "granted") g++;
        else if (i.matrix[r.id] === "conditional") c++;
      }));
      return { role: r, granted: g, conditional: c, total };
    });
  }, []);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ roles: ROLES, capabilities: CAPS }, null, 2));
      toast.success("Roles schema copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Roles & Permissions
            </CardTitle>
            <CardDescription>
              What each role can do across the workspace. Assign roles on the Team tab.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={copyJson}>Copy schema</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {stats.map(({ role, granted, conditional, total }) => (
              <button
                key={role.id}
                onClick={() => setFocus((f) => (f === role.id ? null : role.id))}
                className={cn(
                  "text-left rounded-xl border p-3 transition-all",
                  focus === role.id ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-border",
                )}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <Badge variant="outline" className={cn("border text-[10px]", role.tone)}>{role.label}</Badge>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {granted}/{total}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{role.description}</p>
                {conditional > 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">{conditional} conditional</p>
                )}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border/60 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sticky left-0 bg-muted/40 z-10">
                    Capability
                  </th>
                  {ROLES.map((r) => (
                    <th
                      key={r.id}
                      className={cn(
                        "px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-center",
                        focus === r.id && "bg-primary/10 text-primary",
                      )}
                    >
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPS.map((grp) => (
                  <>
                    <tr key={grp.group} className="bg-muted/20">
                      <td colSpan={ROLES.length + 1} className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {grp.group}
                      </td>
                    </tr>
                    {grp.items.map((cap) => (
                      <tr key={cap.id} className="border-t border-border/60">
                        <td className="px-3 py-2 text-xs font-medium sticky left-0 bg-background z-10">{cap.label}</td>
                        {ROLES.map((r) => (
                          <td
                            key={r.id}
                            className={cn(
                              "px-2 py-2 text-center",
                              focus === r.id && "bg-primary/5",
                            )}
                          >
                            <div className="inline-flex justify-center">
                              <PermCell p={cap.matrix[r.id]} />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-muted-foreground rounded-lg bg-muted/40 border border-border/60 p-3">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>
              <span className="font-medium text-foreground">Conditional (~)</span> means the role can perform the action only when
              approval workflow allows it, or on content they created themselves. Enforcement happens server-side via
              <code className="mx-1 px-1 rounded bg-background border border-border/60">has_role()</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
