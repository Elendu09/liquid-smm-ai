import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Shield,
  MoreHorizontal,
  Check,
  X,
  Clock,
  Activity,
  Mail,
  Trash2,
  Copy,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChangeRoleDialog } from "@/components/settings/ChangeRoleDialog";
import { InviteMemberDialog } from "@/components/settings/InviteMemberDialog";
import { logAudit } from "@/components/settings/AuditPanel";
import { useTeamMembers, type MemberRole, type TeamMember } from "@/hooks/useTeamMembers";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useGuest, guardWrite } from "@/hooks/useGuest";

const DEMO_MEMBERS: TeamMember[] = [
  {
    id: "demo-owner",
    name: "You (Demo)",
    email: "demo@smmpilot.app",
    role: "admin",
    status: "active",
    joinedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    lastActiveAt: new Date().toISOString(),
    avatarUrl: null,
  },
  {
    id: "demo-admin",
    name: "Nadia Chen",
    email: "nadia@studio.co",
    role: "admin",
    status: "active",
    joinedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    lastActiveAt: new Date(Date.now() - 1800_000).toISOString(),
    avatarUrl: null,
  },
  {
    id: "demo-editor",
    name: "Marcus Reed",
    email: "marcus@studio.co",
    role: "editor",
    status: "active",
    joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastActiveAt: new Date(Date.now() - 7200_000).toISOString(),
    avatarUrl: null,
  },
  {
    id: "demo-viewer",
    name: "Priya Sharma",
    email: "priya@brand.io",
    role: "viewer",
    status: "pending",
    joinedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    inviteExpiresAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    avatarUrl: null,
  },
];

const ROLE_BADGE: Record<MemberRole, string> = {
  admin: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  editor: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  viewer: "bg-muted text-muted-foreground",
};

function statusDot(status: TeamMember["status"]) {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "pending":
      return "bg-yellow-500";
    case "inactive":
      return "bg-gray-400";
  }
}

function lastActiveLabel(iso?: string) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

export default function TeamPage() {
  const { user } = useAuthUser();
  const { members, invite, update, remove } = useTeamMembers();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<TeamMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | MemberRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TeamMember["status"]>("all");
  const seatLimit = 10;
  const seatPct = Math.min(100, (members.length / seatLimit) * 100);

  const visibleMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (q && !(m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [members, search, roleFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.status === "active").length,
      pending: members.filter((m) => m.status === "pending").length,
      admins: members.filter((m) => m.role === "admin").length,
    }),
    [members],
  );

  const activityLog = useMemo(() => {
    return members
      .filter((m) => m.status !== "pending")
      .slice(0, 6)
      .map((m) => ({
        user: m.name,
        action:
          m.role === "admin"
            ? "Reviewed workspace settings"
            : m.role === "editor"
            ? "Scheduled content across platforms"
            : "Viewed analytics dashboard",
        time: lastActiveLabel(m.lastActiveAt ?? undefined),
      }));
  }, [members]);

  const handleInvite = async (input: {
    email: string;
    role: MemberRole;
    expiresInDays: number;
    note?: string;
  }) => {
    if (!user) return toast.error("Sign in to invite teammates");
    await invite(input);
    logAudit({ actor: "You", action: `Invited ${input.role}`, target: input.email, category: "member" });
  };

  const handleRoleChange = async (id: string, role: MemberRole) => {
    const m = members.find((x) => x.id === id);
    await update(id, { role });
    if (m) logAudit({ actor: "You", action: `Changed role to ${role}`, target: m.email, category: "member" });
    toast.success("Role updated");
  };

  const handleRemove = async (m: TeamMember) => {
    await remove(m.id);
    logAudit({ actor: "You", action: "Removed member", target: m.email, category: "member" });
    toast.success(`${m.name} removed`);
  };

  const handleResend = async (m: TeamMember) => {
    await update(m.id, {
      inviteExpiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      inviteToken: crypto.randomUUID(),
    });
    logAudit({ actor: "You", action: "Resent invite", target: m.email, category: "member" });
    toast.success(`Invite resent to ${m.email}`);
  };

  const handleActivate = async (m: TeamMember) => {
    await update(m.id, { status: "active", lastActiveAt: new Date().toISOString() });
    logAudit({ actor: "You", action: "Marked invite accepted", target: m.email, category: "member" });
    toast.success(`${m.name} is now active`);
  };

  const copyLink = async (m: TeamMember) => {
    if (!m.inviteToken) {
      toast.error("Invite token missing — resend the invite to generate a new one");
      return;
    }
    const link = `${window.location.origin}/invite/${m.inviteToken}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied");
    } catch {
      toast.error("Copy failed");
    }
  };


  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/[0.09] via-accent/[0.05] to-transparent"
      />
      <div className="relative p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex items-start gap-4">
              <div className="hidden sm:flex h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/60 items-center justify-center shadow-lg shadow-primary/25 ring-1 ring-primary/20">
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/40 text-primary">
                    Workspace
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">{stats.total} seats</Badge>
                </div>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                  Team Collaboration
                </h1>
                <p className="text-muted-foreground mt-1 text-sm max-w-xl">
                  Invite teammates, tune permissions, and keep a real-time pulse on who's shipping what across your workspace.
                </p>
              </div>
            </div>
            <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20" onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: Users, tone: "from-primary/15 to-primary/5 text-primary" },
            { label: "Active", value: stats.active, icon: Check, tone: "from-green-500/15 to-green-500/5 text-green-500" },
            { label: "Pending", value: stats.pending, icon: Clock, tone: "from-yellow-500/15 to-yellow-500/5 text-yellow-500" },
            { label: "Admins", value: stats.admins, icon: Shield, tone: "from-purple-500/15 to-purple-500/5 text-purple-500" },
          ].map((s) => (
            <Card key={s.label} className="overflow-hidden border-border/60 hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${s.tone} flex items-center justify-center ring-1 ring-border/40`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-2xl font-bold leading-none">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage access and permissions for your team</CardDescription>
                </div>
                <div className="text-right min-w-[140px]">
                  <div className="text-xs text-muted-foreground mb-1">
                    Seats <span className="font-semibold text-foreground">{members.length}</span> / {seatLimit}
                  </div>
                  <Progress value={seatPct} className="h-1.5" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name or email…"
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                  <SelectTrigger className="w-full sm:w-[130px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="w-full sm:w-[140px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {visibleMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <Avatar className="h-11 w-11 ring-1 ring-border/60">
                          <AvatarImage src={m.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                            {m.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${statusDot(m.status)}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{m.name}</span>
                          <Badge className={`capitalize ${ROLE_BADGE[m.role]}`}>{m.role}</Badge>
                          {m.status === "pending" && (
                            <Badge variant="outline" className="border-yellow-500/40 text-yellow-500 text-[10px]">
                              Invite pending
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-primary/90 truncate">
                          {m.email}
                        </div>
                        {(m.status === "active" || (m.status === "pending" && m.inviteExpiresAt)) && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {m.status === "active"
                              ? `Active ${lastActiveLabel(m.lastActiveAt)}`
                              : `Expires ${new Date(m.inviteExpiresAt!).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0" aria-label={`Actions for ${m.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => setRoleTarget(m)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Change role
                        </DropdownMenuItem>
                        {m.status === "pending" ? (
                          <>
                            <DropdownMenuItem onClick={() => handleResend(m)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Resend invite
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyLink(m)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy invite link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActivate(m)}>
                              <Check className="mr-2 h-4 w-4" />
                              Mark accepted
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              update(m.id, {
                                status: m.status === "active" ? "inactive" : "active",
                                lastActiveAt: new Date().toISOString(),
                              })
                            }
                          >
                            <Activity className="mr-2 h-4 w-4" />
                            {m.status === "active" ? "Deactivate" : "Reactivate"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setRemoveTarget(m)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                {visibleMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {members.length === 0
                      ? "No members yet. Invite someone to collaborate."
                      : "No members match your filters."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLog.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
              {activityLog.map((a, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p>
                      <span className="font-medium">{a.user}</span>{" "}
                      <span className="text-muted-foreground">{a.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>Overview of what each role can access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Permission</th>
                  <th className="text-center py-3 px-4 font-medium">Admin</th>
                  <th className="text-center py-3 px-4 font-medium">Editor</th>
                  <th className="text-center py-3 px-4 font-medium">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "View dashboard & analytics", admin: true, editor: true, viewer: true },
                  { name: "Create & schedule posts", admin: true, editor: true, viewer: false },
                  { name: "Manage comments & DMs", admin: true, editor: true, viewer: false },
                  { name: "Edit automation settings", admin: true, editor: false, viewer: false },
                  { name: "Connect/disconnect accounts", admin: true, editor: false, viewer: false },
                  { name: "Invite & manage team", admin: true, editor: false, viewer: false },
                  { name: "Billing & subscription", admin: true, editor: false, viewer: false },
                ].map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 px-4">{row.name}</td>
                    {(["admin", "editor", "viewer"] as const).map((role) => (
                      <td key={role} className="text-center py-3 px-4">
                        {row[role] ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvite={handleInvite} />

      <ChangeRoleDialog
        open={!!roleTarget}
        onOpenChange={(o) => !o && setRoleTarget(null)}
        memberName={roleTarget?.name}
        currentRole={roleTarget?.role}
        onSave={(role) => {
          if (roleTarget) handleRoleChange(roleTarget.id, role);
        }}
      />

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will immediately lose workspace access. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget) handleRemove(removeTarget);
                setRemoveTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </div>
    </div>
  );
}
