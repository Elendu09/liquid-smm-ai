import { useState } from "react";
import { Users, UserPlus, Shield, Mail, MoreHorizontal, Check, X, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "pending" | "inactive";
  lastActive?: Date;
  joinedAt: Date;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@company.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    role: "admin",
    status: "active",
    lastActive: new Date(),
    joinedAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    name: "Sarah Smith",
    email: "sarah@company.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    role: "editor",
    status: "active",
    lastActive: new Date(Date.now() - 1000 * 60 * 30),
    joinedAt: new Date("2024-02-15"),
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@company.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    role: "editor",
    status: "active",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
    joinedAt: new Date("2024-03-01"),
  },
  {
    id: "4",
    name: "Emily Chen",
    email: "emily@company.com",
    role: "viewer",
    status: "pending",
    joinedAt: new Date(),
  },
];

const activityLog = [
  { user: "Sarah Smith", action: "Scheduled 5 posts for Instagram", time: "10 minutes ago" },
  { user: "John Doe", action: "Updated engagement bot settings", time: "1 hour ago" },
  { user: "Mike Johnson", action: "Added new hashtag set", time: "2 hours ago" },
  { user: "Sarah Smith", action: "Generated AI captions", time: "3 hours ago" },
  { user: "John Doe", action: "Connected YouTube account", time: "Yesterday" },
];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("editor");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const getRoleBadge = (role: TeamMember["role"]) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">Admin</Badge>;
      case "editor":
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Editor</Badge>;
      case "viewer":
        return <Badge variant="secondary">Viewer</Badge>;
    }
  };

  const getStatusIndicator = (status: TeamMember["status"]) => {
    switch (status) {
      case "active":
        return <span className="h-2 w-2 rounded-full bg-green-500" />;
      case "pending":
        return <span className="h-2 w-2 rounded-full bg-yellow-500" />;
      case "inactive":
        return <span className="h-2 w-2 rounded-full bg-gray-400" />;
    }
  };

  const handleInvite = () => {
    if (!inviteEmail) return;
    const newMember: TeamMember = {
      id: String(members.length + 1),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole as TeamMember["role"],
      status: "pending",
      joinedAt: new Date(),
    };
    setMembers([...members, newMember]);
    setInviteEmail("");
    setInviteDialogOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Team Collaboration
          </h1>
          <p className="text-muted-foreground mt-1">Manage your team members and permissions</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your workspace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                    <SelectItem value="editor">Editor - Create & edit content</SelectItem>
                    <SelectItem value="viewer">Viewer - View only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleInvite}>
                <Mail className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{members.length}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{members.filter((m) => m.status === "active").length}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{members.filter((m) => m.status === "pending").length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{members.filter((m) => m.role === "admin").length}</div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Members List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage access and permissions for your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-background">
                          {getStatusIndicator(member.status)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.name}</span>
                          {getRoleBadge(member.role)}
                        </div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Change Role</DropdownMenuItem>
                        <DropdownMenuItem>View Activity</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500">Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLog.map((activity, index) => (
                <div key={index} className="flex gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p>
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-muted-foreground">{activity.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Matrix */}
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
                ].map((row, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 px-4">{row.name}</td>
                    <td className="text-center py-3 px-4">
                      {row.admin ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                    </td>
                    <td className="text-center py-3 px-4">
                      {row.editor ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                    </td>
                    <td className="text-center py-3 px-4">
                      {row.viewer ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
