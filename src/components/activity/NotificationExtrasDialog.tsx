import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Webhook, BarChart3, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Hook {
  id: string;
  label: string | null;
  url: string;
  secret: string | null;
  event_types: string[];
  active: boolean;
  last_fired_at: string | null;
  last_status: number | null;
  failure_count: number;
}

interface EventRow {
  id: string;
  event: string;
  notif_type: string | null;
  notif_severity: string | null;
  rule_key: string | null;
  created_at: string;
}

export function NotificationExtrasDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newSecret, setNewSecret] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: hs } = await supabase
        .from("notification_webhooks")
        .select("*")
        .order("created_at", { ascending: false });
      setHooks((hs ?? []) as Hook[]);

      const { data: ev } = await supabase
        .from("notification_events")
        .select("id, event, notif_type, notif_severity, rule_key, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setEvents((ev ?? []) as EventRow[]);
    })();
  }, [open]);

  const addHook = async () => {
    if (!newUrl.startsWith("http")) return toast.error("Enter a valid URL");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return toast.error("Sign in required");
    const { data, error } = await supabase
      .from("notification_webhooks")
      .insert({
        user_id: auth.user.id,
        url: newUrl,
        label: newLabel || null,
        secret: newSecret || null,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setHooks((prev) => [data as Hook, ...prev]);
    setNewUrl("");
    setNewLabel("");
    setNewSecret("");
    toast.success("Webhook added");
  };

  const toggleHook = async (h: Hook) => {
    const active = !h.active;
    setHooks((prev) => prev.map((x) => (x.id === h.id ? { ...x, active } : x)));
    await supabase.from("notification_webhooks").update({ active }).eq("id", h.id);
  };

  const deleteHook = async (id: string) => {
    setHooks((prev) => prev.filter((x) => x.id !== id));
    await supabase.from("notification_webhooks").delete().eq("id", id);
  };

  // Analytics rollups
  const totals = events.reduce(
    (acc, e) => {
      acc.total++;
      acc[e.event] = (acc[e.event] ?? 0) + 1;
      return acc;
    },
    { total: 0 } as Record<string, number>,
  );
  const engageRate = totals.delivered
    ? Math.round(((totals.clicked ?? 0) + (totals.read ?? 0)) * 100 / totals.delivered)
    : 0;
  const dismissRate = totals.delivered
    ? Math.round((totals.dismissed ?? 0) * 100 / totals.delivered)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Webhooks & analytics</DialogTitle>
          <DialogDescription>
            Fan out notifications to any HTTPS endpoint and monitor how alerts perform.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="webhooks">
          <TabsList>
            <TabsTrigger value="webhooks">
              <Webhook className="h-4 w-4 mr-1.5" /> Webhooks
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-1.5" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="webhooks" className="space-y-4 pt-2">
            <div className="rounded-lg border p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Slack #alerts" />
                </div>
                <div>
                  <Label className="text-xs">Secret (HMAC)</Label>
                  <Input value={newSecret} onChange={(e) => setNewSecret(e.target.value)} placeholder="optional" />
                </div>
              </div>
              <div>
                <Label className="text-xs">URL</Label>
                <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://…" />
              </div>
              <Button size="sm" onClick={addHook}>
                <Plus className="h-4 w-4 mr-1.5" /> Add webhook
              </Button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {hooks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No webhooks yet.</p>
              )}
              {hooks.map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-lg border p-2 pl-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{h.label || h.url}</p>
                      {h.last_status !== null && (
                        <Badge
                          variant="outline"
                          className={
                            h.last_status >= 200 && h.last_status < 300
                              ? "text-green-500"
                              : "text-destructive"
                          }
                        >
                          {h.last_status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {h.url}
                      {h.last_fired_at &&
                        ` · fired ${formatDistanceToNow(new Date(h.last_fired_at), { addSuffix: true })}`}
                    </p>
                  </div>
                  <Switch checked={h.active} onCheckedChange={() => toggleHook(h)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteHook(h.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 pt-2">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Delivered", v: totals.delivered ?? 0 },
                { label: "Read", v: totals.read ?? 0 },
                { label: "Engage %", v: engageRate },
                { label: "Dismiss %", v: dismissRate },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold">{s.v}</p>
                </div>
              ))}
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No events yet.</p>
              )}
              {events.slice(0, 50).map((e) => (
                <div key={e.id} className="flex items-center justify-between p-2 text-xs">
                  <span>
                    <Badge variant="outline" className="mr-2">
                      {e.event}
                    </Badge>
                    {e.notif_type ?? "—"}
                    {e.rule_key ? ` · ${e.rule_key}` : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-tuning runs weekly and adjusts thresholds when a rule is consistently
              ignored or engaged with.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
