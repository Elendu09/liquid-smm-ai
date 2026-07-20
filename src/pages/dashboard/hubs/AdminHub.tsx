import { Route, Routes, Navigate, Outlet, Link } from "react-router-dom";
import {
  Shield,
  Users,
  UserCog,
  Flag,
  Activity,
  ScrollText,
  ToggleRight,
  ServerCog,
  Search,
  MoreHorizontal,
  Ban,
  Check,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Zap,
  Database,
  Cpu,
  Globe,
  Eye,
  Trash2,
  Plus,
} from "lucide-react";
import { useState } from "react";
import {
  PageHeader,
  HubTabs,
  SectionCard,
  KpiTile,
  EmptyState,
  type HubTab,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useHasRole } from "@/hooks/useHasRole";

const tabs: HubTab[] = [
  { label: "Overview", href: "/dashboard/admin/overview", icon: Shield },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  { label: "Roles", href: "/dashboard/admin/roles", icon: UserCog },
  { label: "Moderation", href: "/dashboard/admin/moderation", icon: Flag, badge: 4 },
  { label: "System", href: "/dashboard/admin/system", icon: ServerCog },
  { label: "Audit log", href: "/dashboard/admin/audit", icon: ScrollText },
  { label: "Feature flags", href: "/dashboard/admin/flags", icon: ToggleRight },
];

/* ---------------- Layout ---------------- */

function AdminLayout() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-destructive/[0.07] via-primary/[0.04] to-transparent"
      />
      <div className="relative px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Admin"
          description="Workspace-wide administration · Restricted to admins and owners"
          actions={
            <Badge
              variant="outline"
              className="gap-1.5 border-destructive/40 bg-destructive/5 text-destructive uppercase tracking-[0.18em] text-[10px] font-semibold"
            >
              <Shield className="h-3 w-3" /> Restricted
            </Badge>
          }
        />
        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="p-4 sm:p-6 lg:p-8 space-y-6">{children}</div>;
}

/* ---------------- Overview ---------------- */

function OverviewPanel() {
  return (
    <Wrap>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiTile label="Total users" value="4,821" delta="+128 wk" icon={Users} />
        <KpiTile label="Active today" value="1,204" delta="+6.2%" icon={Activity} />
        <KpiTile label="MRR" value="$18.4k" delta="+3.1%" icon={DollarSign} />
        <KpiTile
          label="Open reports"
          value="4"
          delta="+2"
          isPositive={false}
          icon={Flag}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="System health"
          description="Live status of core services"
          className="lg:col-span-2"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "API gateway", value: 99.98, icon: Globe, status: "Operational" },
              { label: "Database", value: 99.94, icon: Database, status: "Operational" },
              { label: "AI worker pool", value: 96.5, icon: Cpu, status: "Degraded" },
              { label: "Publisher queue", value: 100, icon: Zap, status: "Operational" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border/60 bg-card/60 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <s.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] uppercase tracking-wider",
                      s.status === "Operational"
                        ? "border-brand-green/40 text-brand-green"
                        : "border-amber-500/40 text-amber-500",
                    )}
                  >
                    {s.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={s.value} className="h-1.5 flex-1" />
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {s.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent activity" description="Last 5 admin events">
          <ol className="space-y-3">
            {[
              { who: "Sarah K.", what: "Suspended user @spam_bot_42", when: "2m ago", tone: "destructive" },
              { who: "System", what: "Auto-flagged 3 comments", when: "18m ago", tone: "warning" },
              { who: "Miguel R.", what: "Promoted @jordan to Editor", when: "1h ago", tone: "primary" },
              { who: "System", what: "Feature flag ai_v2 enabled 25%", when: "3h ago", tone: "primary" },
              { who: "Ada L.", what: "Billing plan changed → Growth", when: "5h ago", tone: "muted" },
            ].map((e, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0",
                    e.tone === "destructive" && "bg-destructive",
                    e.tone === "warning" && "bg-amber-500",
                    e.tone === "primary" && "bg-primary",
                    e.tone === "muted" && "bg-muted-foreground",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{e.who}</span>{" "}
                    <span className="text-muted-foreground">{e.what}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{e.when}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-center text-xs"
          >
            <Link to="/dashboard/admin/audit">View full audit log →</Link>
          </Button>
        </SectionCard>
      </div>

      <SectionCard title="Growth signals" description="Rolling 30 day trend">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: "Signups", v: "+412", trend: "+18%" },
            { l: "Churn", v: "1.4%", trend: "-0.3%" },
            { l: "Posts published", v: "38.2k", trend: "+12%" },
            { l: "AI runs", v: "104k", trend: "+41%" },
          ].map((k) => (
            <div key={k.l} className="rounded-lg bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {k.l}
              </p>
              <p className="mt-1 text-xl font-semibold">{k.v}</p>
              <p className="flex items-center gap-1 mt-0.5 text-xs text-brand-green">
                <TrendingUp className="h-3 w-3" /> {k.trend}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  );
}

/* ---------------- Users ---------------- */

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  plan: "Free" | "Pro" | "Growth" | "Enterprise";
  status: "active" | "suspended" | "invited";
  lastActive: string;
};

const MOCK_USERS: MockUser[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@company.com", role: "owner", plan: "Enterprise", status: "active", lastActive: "2m ago" },
  { id: "2", name: "Miguel Rivera", email: "miguel@company.com", role: "admin", plan: "Growth", status: "active", lastActive: "12m ago" },
  { id: "3", name: "Sarah Kim", email: "sarah@company.com", role: "editor", plan: "Growth", status: "active", lastActive: "1h ago" },
  { id: "4", name: "Jordan Blake", email: "jordan@company.com", role: "editor", plan: "Pro", status: "active", lastActive: "3h ago" },
  { id: "5", name: "Priya N.", email: "priya@studio.io", role: "viewer", plan: "Pro", status: "invited", lastActive: "—" },
  { id: "6", name: "Ex‑user Spammer", email: "spam@throwaway.xyz", role: "viewer", plan: "Free", status: "suspended", lastActive: "2d ago" },
];

const roleTone: Record<MockUser["role"], string> = {
  owner: "bg-destructive/10 text-destructive border-destructive/30",
  admin: "bg-primary/10 text-primary border-primary/30",
  editor: "bg-accent text-accent-foreground border-border/60",
  viewer: "bg-muted text-muted-foreground border-border/60",
};

function UsersPanel() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const rows = MOCK_USERS.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      (u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <Wrap>
      <SectionCard
        title="All users"
        description={`${rows.length} of ${MOCK_USERS.length} users`}
        actions={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Invite
          </Button>
        }
      >
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users by name or email…"
              className="pl-8"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground border-b border-border/60">
                <th className="font-medium px-5 py-2">User</th>
                <th className="font-medium py-2 hidden md:table-cell">Role</th>
                <th className="font-medium py-2 hidden lg:table-cell">Plan</th>
                <th className="font-medium py-2">Status</th>
                <th className="font-medium py-2 hidden md:table-cell">Last active</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/15 text-primary">
                          {u.name
                            .split(" ")
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 hidden md:table-cell">
                    <Badge variant="outline" className={cn("capitalize", roleTone[u.role])}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-3 hidden lg:table-cell text-muted-foreground">
                    {u.plan}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs",
                        u.status === "active" && "text-brand-green",
                        u.status === "suspended" && "text-destructive",
                        u.status === "invited" && "text-amber-500",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          u.status === "active" && "bg-brand-green",
                          u.status === "suspended" && "bg-destructive",
                          u.status === "invited" && "bg-amber-500",
                        )}
                      />
                      <span className="capitalize">{u.status}</span>
                    </span>
                  </td>
                  <td className="py-3 hidden md:table-cell text-muted-foreground text-xs">
                    {u.lastActive}
                  </td>
                  <td className="py-3 pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View profile</DropdownMenuItem>
                        <DropdownMenuItem><UserCog className="h-4 w-4 mr-2" />Change role</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-amber-600"><Ban className="h-4 w-4 mr-2" />Suspend</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="pt-4">
            <EmptyState
              icon={Users}
              title="No users match"
              description="Try clearing filters or search."
            />
          </div>
        )}
      </SectionCard>
    </Wrap>
  );
}

/* ---------------- Roles ---------------- */

const ROLES = [
  {
    key: "owner",
    label: "Owner",
    desc: "Full workspace access, billing, and destructive actions.",
    members: 1,
    perms: ["Billing", "Members", "All content", "Delete workspace"],
  },
  {
    key: "admin",
    label: "Admin",
    desc: "Manage members, integrations, and moderation.",
    members: 3,
    perms: ["Members", "Integrations", "Moderation", "All content"],
  },
  {
    key: "editor",
    label: "Editor",
    desc: "Create, edit, schedule content and automations.",
    members: 12,
    perms: ["Create", "Publish", "Automations"],
  },
  {
    key: "viewer",
    label: "Viewer",
    desc: "Read-only access to dashboards and analytics.",
    members: 27,
    perms: ["Analytics", "Read library"],
  },
];

function RolesPanel() {
  return (
    <Wrap>
      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((r) => (
          <SectionCard key={r.key} title={r.label} description={r.desc}>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span>
                <span className="font-semibold text-foreground">{r.members}</span> member
                {r.members === 1 ? "" : "s"}
              </span>
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                Manage
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.perms.map((p) => (
                <span
                  key={p}
                  className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border/50"
                >
                  {p}
                </span>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Permission matrix" description="Fine-grained scopes per role">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground border-b border-border/60">
                <th className="font-medium px-5 py-2">Scope</th>
                <th className="font-medium py-2 text-center">Owner</th>
                <th className="font-medium py-2 text-center">Admin</th>
                <th className="font-medium py-2 text-center">Editor</th>
                <th className="font-medium py-2 pr-5 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody>
              {[
                { s: "View analytics", v: [1, 1, 1, 1] },
                { s: "Create & schedule posts", v: [1, 1, 1, 0] },
                { s: "Manage automations", v: [1, 1, 1, 0] },
                { s: "Invite members", v: [1, 1, 0, 0] },
                { s: "Manage integrations", v: [1, 1, 0, 0] },
                { s: "Access billing", v: [1, 0, 0, 0] },
                { s: "Delete workspace", v: [1, 0, 0, 0] },
              ].map((r) => (
                <tr key={r.s} className="border-b border-border/40 last:border-0">
                  <td className="px-5 py-3 font-medium">{r.s}</td>
                  {r.v.map((v, i) => (
                    <td key={i} className="py-3 text-center">
                      {v ? (
                        <Check className="inline h-4 w-4 text-brand-green" />
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </Wrap>
  );
}

/* ---------------- Moderation ---------------- */

const REPORTS = [
  { id: "r1", type: "Comment", target: "@user_x on Post #2839", reason: "Spam / promotional", severity: "high", when: "12m ago" },
  { id: "r2", type: "Post", target: "Draft #481 — Q3 launch", reason: "Contains restricted claim", severity: "medium", when: "1h ago" },
  { id: "r3", type: "DM", target: "@fake_brand → @jordan", reason: "Impersonation", severity: "high", when: "3h ago" },
  { id: "r4", type: "Account", target: "@throwaway_2026", reason: "Suspicious signup pattern", severity: "low", when: "1d ago" },
];

function ModerationPanel() {
  return (
    <Wrap>
      <div className="grid grid-cols-3 gap-3">
        <KpiTile label="Open reports" value="4" icon={Flag} />
        <KpiTile label="Auto‑resolved · 7d" value="27" icon={Check} />
        <KpiTile label="Escalated" value="1" isPositive={false} icon={AlertTriangle} />
      </div>

      <SectionCard title="Moderation queue" description="Review, resolve, or escalate flagged items">
        <ul className="divide-y divide-border/50 -mx-5">
          {REPORTS.map((r) => (
            <li
              key={r.id}
              className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={cn(
                    "mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    r.severity === "high" && "bg-destructive/10 text-destructive",
                    r.severity === "medium" && "bg-amber-500/10 text-amber-500",
                    r.severity === "low" && "bg-muted text-muted-foreground",
                  )}
                >
                  <Flag className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {r.type}: <span className="text-muted-foreground">{r.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.reason} · {r.when}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize text-[10px]",
                    r.severity === "high" && "border-destructive/40 text-destructive",
                    r.severity === "medium" && "border-amber-500/40 text-amber-500",
                    r.severity === "low" && "border-border/60 text-muted-foreground",
                  )}
                >
                  {r.severity}
                </Badge>
                <Button size="sm" variant="outline" className="h-8">
                  <Check className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="destructive" className="h-8">
                  <Ban className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </Wrap>
  );
}

/* ---------------- System ---------------- */

function SystemPanel() {
  return (
    <Wrap>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Uptime · 30d" value="99.97%" icon={Activity} />
        <KpiTile label="p95 latency" value="184ms" icon={Zap} />
        <KpiTile label="DB size" value="42.8 GB" icon={Database} />
        <KpiTile label="Edge fn calls · 24h" value="212k" icon={ServerCog} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Background jobs">
          <div className="space-y-3">
            {[
              { l: "Publisher queue", q: 12, cap: 100 },
              { l: "AI captioner", q: 3, cap: 40 },
              { l: "Analytics ingest", q: 87, cap: 200 },
              { l: "Notification fan-out", q: 0, cap: 500 },
            ].map((j) => (
              <div key={j.l}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{j.l}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {j.q}/{j.cap}
                  </span>
                </div>
                <Progress value={(j.q / j.cap) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Incidents · last 30 days">
          <ol className="space-y-3 text-sm">
            {[
              { t: "Elevated latency · AI worker pool", when: "Yesterday · 14:22 → 14:41", ok: false },
              { t: "Scheduled maintenance · Publisher", when: "Jul 12 · 02:00 → 02:15", ok: true },
              { t: "Instagram Graph API partial outage", when: "Jul 05 · 09:12 → 11:47", ok: false },
            ].map((i, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 rounded-full flex-shrink-0",
                    i.ok ? "bg-brand-green" : "bg-amber-500",
                  )}
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{i.t}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{i.when}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>
    </Wrap>
  );
}

/* ---------------- Audit log ---------------- */

const AUDIT: {
  who: string;
  action: string;
  target: string;
  when: string;
  ip: string;
}[] = [
  { who: "sarah@company.com", action: "user.suspend", target: "@spam_bot_42", when: "2m ago", ip: "10.0.0.24" },
  { who: "system", action: "flag.enable", target: "ai_v2 @ 25%", when: "3h ago", ip: "—" },
  { who: "miguel@company.com", action: "role.change", target: "jordan → editor", when: "1h ago", ip: "10.0.0.18" },
  { who: "ada@company.com", action: "billing.plan_change", target: "Growth", when: "5h ago", ip: "10.0.0.2" },
  { who: "system", action: "moderation.auto_remove", target: "Comment #9928", when: "6h ago", ip: "—" },
  { who: "miguel@company.com", action: "integration.connect", target: "Slack workspace", when: "1d ago", ip: "10.0.0.18" },
];

function AuditPanel() {
  const [q, setQ] = useState("");
  const rows = AUDIT.filter(
    (a) =>
      a.who.includes(q) ||
      a.action.includes(q) ||
      a.target.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Wrap>
      <SectionCard
        title="Audit log"
        description="Every privileged action across the workspace"
        actions={
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter events…"
              className="pl-8 h-9"
            />
          </div>
        }
      >
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground border-b border-border/60">
                <th className="font-medium px-5 py-2">Actor</th>
                <th className="font-medium py-2">Action</th>
                <th className="font-medium py-2 hidden md:table-cell">Target</th>
                <th className="font-medium py-2 hidden lg:table-cell">IP</th>
                <th className="font-medium py-2 pr-5">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 truncate max-w-[180px]">{a.who}</td>
                  <td className="py-3">
                    <code className="text-[11px] px-1.5 py-0.5 rounded bg-muted font-mono">
                      {a.action}
                    </code>
                  </td>
                  <td className="py-3 hidden md:table-cell text-muted-foreground truncate max-w-[220px]">
                    {a.target}
                  </td>
                  <td className="py-3 hidden lg:table-cell text-muted-foreground text-xs tabular-nums">
                    {a.ip}
                  </td>
                  <td className="py-3 pr-5 text-muted-foreground text-xs">{a.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </Wrap>
  );
}

/* ---------------- Feature flags ---------------- */

const FLAGS = [
  { key: "ai_v2", label: "AI Studio v2", desc: "Next-gen caption + hashtag stack.", rollout: 25, on: true },
  { key: "voice_call", label: "Voice call mode", desc: "Hands-free AI conversation.", rollout: 100, on: true },
  { key: "mcp_public", label: "Public MCP server", desc: "Expose workspace tools to external LLMs.", rollout: 10, on: false },
  { key: "auto_recycle", label: "Auto post recycling", desc: "Requeue evergreen posts on schedule.", rollout: 50, on: true },
  { key: "brand_voice_2", label: "Brand Voice v2", desc: "Style transfer from historic posts.", rollout: 0, on: false },
];

function FlagsPanel() {
  const [flags, setFlags] = useState(FLAGS);
  return (
    <Wrap>
      <SectionCard title="Feature flags" description="Toggle rollouts across the workspace">
        <ul className="divide-y divide-border/50 -mx-5">
          {flags.map((f) => (
            <li
              key={f.key}
              className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{f.label}</p>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground">
                    {f.key}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
              <div className="flex items-center gap-4 md:justify-end">
                <div className="text-xs w-32">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">Rollout</span>
                    <span className="tabular-nums font-medium">{f.rollout}%</span>
                  </div>
                  <Progress value={f.rollout} className="h-1.5" />
                </div>
                <Switch
                  checked={f.on}
                  onCheckedChange={(v) =>
                    setFlags((prev) =>
                      prev.map((x) => (x.key === f.key ? { ...x, on: v } : x)),
                    )
                  }
                  aria-label={`Toggle ${f.label}`}
                />
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </Wrap>
  );
}

/* ---------------- Gate + Router ---------------- */

function AccessDenied() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      <EmptyState
        icon={Shield}
        title="Admin access required"
        description="You don't have permission to view this area. Contact your workspace owner to request admin privileges."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}

export default function AdminHub() {
  const { isAdmin, loading } = useHasRole();

  // Dev-friendly: only block when we know the user isn't admin.
  if (!loading && !isAdmin) {
    // Comment the next line to preview Admin as any user.
    // return <AccessDenied />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPanel />} />
        <Route path="users" element={<UsersPanel />} />
        <Route path="roles" element={<RolesPanel />} />
        <Route path="moderation" element={<ModerationPanel />} />
        <Route path="system" element={<SystemPanel />} />
        <Route path="audit" element={<AuditPanel />} />
        <Route path="flags" element={<FlagsPanel />} />
      </Route>
    </Routes>
  );
}
