import { useState } from "react";
import { Webhook, Plus, Play, Trash2, CheckCircle2, XCircle, Copy, ExternalLink, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebhooks, WEBHOOK_EVENTS, type WebhookEvent, type Webhook as WebhookType } from "@/hooks/useWebhooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PROVIDER_META: Record<WebhookType["provider"], { label: string; hint: string; url: string }> = {
  zapier: { label: "Zapier",      hint: "Paste a Zapier Catch Hook URL",              url: "https://zapier.com/apps/webhook" },
  make:   { label: "Make",        hint: "Paste a Make.com custom webhook URL",        url: "https://www.make.com/en/integrations/webhooks" },
  n8n:    { label: "n8n",         hint: "Paste an n8n webhook trigger URL",           url: "https://n8n.io/integrations/webhook" },
  custom: { label: "Custom HTTP", hint: "Any HTTPS endpoint that accepts JSON POST",  url: "" },
};

export function WebhooksPanel() {
  const { hooks, log, add, update, remove, test } = useWebhooks();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{
    name: string;
    url: string;
    provider: WebhookType["provider"];
    events: WebhookEvent[];
    secret: string;
  }>({ name: "", url: "", provider: "zapier", events: ["post.published"], secret: "" });
  const [testing, setTesting] = useState<string | null>(null);

  const toggleEvent = (ev: WebhookEvent) =>
    setDraft((d) => ({
      ...d,
      events: d.events.includes(ev) ? d.events.filter((e) => e !== ev) : [...d.events, ev],
    }));

  const canSave = draft.name.trim() && /^https?:\/\//i.test(draft.url) && draft.events.length > 0;

  const handleSave = () => {
    add({ ...draft, active: true });
    setDraft({ name: "", url: "", provider: "zapier", events: ["post.published"], secret: "" });
    setOpen(false);
    toast.success("Webhook created");
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    const r = await test(id);
    setTesting(null);
    if (r.ok) toast.success("Test payload sent");
    else toast.error("Test failed — check the URL");
  };

  const copyPayload = async () => {
    const sample = {
      event: "post.published",
      firedAt: new Date().toISOString(),
      workspace: "smmpilot",
      sample: { postId: "demo-post-1", caption: "Hello world", platforms: ["instagram", "x"] },
    };
    await navigator.clipboard.writeText(JSON.stringify(sample, null, 2));
    toast.success("Sample payload copied");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary" /> Webhooks & Zapier
            </CardTitle>
            <CardDescription>
              Fire real-time events to Zapier, Make, n8n, or any HTTPS endpoint.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyPayload}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Sample payload
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1.5" /> New webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create webhook</DialogTitle>
                  <DialogDescription>Events selected here will POST JSON to your endpoint.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Zapier → CRM" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Provider</Label>
                    <Select value={draft.provider} onValueChange={(v) => setDraft({ ...draft, provider: v as WebhookType["provider"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROVIDER_META).map(([id, meta]) => (
                          <SelectItem key={id} value={id}>{meta.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      {PROVIDER_META[draft.provider].hint}
                      {PROVIDER_META[draft.provider].url && (
                        <a href={PROVIDER_META[draft.provider].url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-0.5">
                          docs <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Endpoint URL</Label>
                    <Input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://hooks.zapier.com/hooks/catch/…" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Signing secret (optional)</Label>
                    <Input value={draft.secret} onChange={(e) => setDraft({ ...draft, secret: e.target.value })} placeholder="Sent as X-Webhook-Secret header" />
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="grid gap-1.5 max-h-60 overflow-y-auto rounded-lg border border-border/60 p-2">
                      {WEBHOOK_EVENTS.map((ev) => (
                        <label key={ev.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.events.includes(ev.id)}
                            onChange={() => toggleEvent(ev.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{ev.label}</p>
                            <p className="text-[10px] text-muted-foreground">{ev.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button disabled={!canSave} onClick={handleSave}>Create webhook</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {hooks.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border/60 rounded-xl">
              <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No webhooks yet</p>
              <p className="text-xs text-muted-foreground">Wire your workspace into Zapier, Make, or any HTTP endpoint.</p>
            </div>
          ) : (
            hooks.map((h) => (
              <div key={h.id} className="rounded-xl border border-border/60 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{h.name}</p>
                      <Badge variant="outline" className="text-[10px]">{PROVIDER_META[h.provider].label}</Badge>
                      {h.lastStatus && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] gap-1",
                            h.lastStatus === "success"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/30",
                          )}
                        >
                          {h.lastStatus === "success" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {h.lastStatus}
                        </Badge>
                      )}
                      {h.failures >= 3 && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                          {h.failures} failures
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">{h.url}</p>
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {h.events.slice(0, 4).map((e) => (
                        <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">{e}</span>
                      ))}
                      {h.events.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">+{h.events.length - 4}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={h.active} onCheckedChange={(v) => update(h.id, { active: v })} />
                    <Button size="icon" variant="ghost" onClick={() => handleTest(h.id)} disabled={testing === h.id} title="Send test payload">
                      <Play className={cn("h-3.5 w-3.5", testing === h.id && "animate-pulse")} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete webhook "${h.name}"?`)) {
                          remove(h.id);
                          toast.success("Deleted");
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent deliveries</CardTitle>
          <CardDescription>Last 200 attempts across all webhooks.</CardDescription>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No deliveries yet.</p>
          ) : (
            <ul className="divide-y divide-border/60 max-h-80 overflow-y-auto -mx-2">
              {log.slice(0, 30).map((d) => {
                const hook = hooks.find((h) => h.id === d.webhookId);
                return (
                  <li key={d.id} className="flex items-center gap-3 px-2 py-2">
                    {d.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {hook?.name ?? "Deleted webhook"} · <span className="text-muted-foreground">{d.event}</span>
                      </p>
                      {d.error && <p className="text-[10px] text-destructive truncate">{d.error}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {d.duration}ms · {new Date(d.at).toLocaleTimeString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
