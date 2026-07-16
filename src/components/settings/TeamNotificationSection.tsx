import { useMemo } from "react";
import { toast } from "sonner";
import { Bell, Info, Mail, UserMinus, UserPlus, ShieldAlert, Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocalCollection } from "@/hooks/useLocalCollection";

interface TeamNotifPref {
  id: "team-notif";
  invites: { inapp: boolean; email: boolean };
  role_changes: { inapp: boolean; email: boolean };
  removals: { inapp: boolean; email: boolean };
  memberOptOut: boolean;
  digest: "immediate" | "daily" | "weekly";
}

const DEFAULTS: TeamNotifPref = {
  id: "team-notif",
  invites: { inapp: true, email: true },
  role_changes: { inapp: true, email: true },
  removals: { inapp: true, email: true },
  memberOptOut: false,
  digest: "immediate",
};

const ROWS: Array<{
  key: "invites" | "role_changes" | "removals";
  icon: typeof UserPlus;
  label: string;
  description: string;
}> = [
  { key: "invites", icon: UserPlus, label: "Invites", description: "When someone invites a new teammate." },
  { key: "role_changes", icon: ShieldAlert, label: "Role changes", description: "When a member's role is updated." },
  { key: "removals", icon: UserMinus, label: "Removals", description: "When a member is removed or deactivated." },
];

export function TeamNotificationSection() {
  const { items, setItems } = useLocalCollection<TeamNotifPref>(
    "settings",
    "team-notifications",
    [DEFAULTS],
  );
  const prefs = useMemo(() => items[0] ?? DEFAULTS, [items]);

  const patch = (p: Partial<TeamNotifPref>) => setItems([{ ...prefs, ...p }]);
  const patchRow = (key: "invites" | "role_changes" | "removals", ch: "inapp" | "email", v: boolean) =>
    patch({ [key]: { ...prefs[key], [ch]: v } } as Partial<TeamNotifPref>);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Team activity notifications
            </CardTitle>
            <CardDescription>
              Configure what triggers email + in-app alerts for team events.
              Individual members can opt out below.
            </CardDescription>
          </div>
          <Badge variant="outline" className="self-start">
            {prefs.memberOptOut ? "Members can opt out" : "Members receive by default"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="hidden sm:grid grid-cols-[1fr_80px_80px] items-center gap-4 px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/60">
          <span>Event</span>
          <span className="text-center">In-app</span>
          <span className="text-center">Email</span>
        </div>
        {ROWS.map(({ key, icon: Icon, label, description }) => (
          <div
            key={key}
            className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_80px_80px] items-center gap-3 sm:gap-4 rounded-lg border border-border/60 bg-card/60 p-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex sm:hidden items-center gap-2">
              <button
                type="button"
                aria-label={`In-app ${label}`}
                onClick={() => patchRow(key, "inapp", !prefs[key].inapp)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs ${
                  prefs[key].inapp
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground"
                }`}
              >
                <Bell className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Email ${label}`}
                onClick={() => patchRow(key, "email", !prefs[key].email)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs ${
                  prefs[key].email
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="hidden sm:flex justify-center">
              <Switch
                checked={prefs[key].inapp}
                onCheckedChange={(v) => patchRow(key, "inapp", v)}
                aria-label={`In-app ${label}`}
              />
            </div>
            <div className="hidden sm:flex justify-center">
              <Switch
                checked={prefs[key].email}
                onCheckedChange={(v) => patchRow(key, "email", v)}
                aria-label={`Email ${label}`}
              />
            </div>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-dashed p-3">
          <div className="flex items-start gap-2 min-w-0">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Let members opt out</p>
              <p className="text-xs text-muted-foreground">
                Team members can silence these notifications from their own settings.
              </p>
            </div>
          </div>
          <Switch
            checked={prefs.memberOptOut}
            onCheckedChange={(v) => patch({ memberOptOut: v })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground mr-1">Digest cadence:</span>
          {(["immediate", "daily", "weekly"] as const).map((d) => (
            <Button
              key={d}
              type="button"
              size="sm"
              variant={prefs.digest === d ? "default" : "outline"}
              onClick={() => patch({ digest: d })}
              className="capitalize"
            >
              {d}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setItems([DEFAULTS]);
                toast.success("Team notifications reset");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            <Button size="sm" onClick={() => toast.success("Team notification preferences saved")}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
