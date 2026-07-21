import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, RotateCcw, Save, Bell, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";

const EVENTS = [
  { id: "new_follower", label: "New follower", description: "Someone starts following one of your accounts" },
  { id: "follower_spike", label: "Follower spike", description: "Unusually fast follower growth in 24h" },
  { id: "post_viral", label: "Post went viral", description: "A post is outperforming your baseline" },
  { id: "engagement_drop", label: "Engagement drop", description: "Engagement fell below your 7-day baseline" },
  { id: "best_time_hit", label: "Best-time-to-post hit", description: "Your peak audience window opened with nothing queued" },
  { id: "post_published", label: "Post published", description: "A scheduled post goes live" },
  { id: "post_failed", label: "Post failed", description: "A scheduled post could not be delivered" },
  { id: "bot_action", label: "Bot action", description: "The engagement bot takes an action on your behalf" },
  { id: "comment_reply", label: "Comment / reply", description: "New comment or reply on your content" },
  { id: "dm_received", label: "DM received", description: "New direct message in your inbox" },
  { id: "weekly_report", label: "Weekly report", description: "Weekly performance summary is ready" },
  { id: "milestone", label: "Milestone reached", description: "Follower / engagement milestone hit" },
  { id: "competitor_overtake", label: "Competitor overtake", description: "A tracked competitor is outpacing your growth" },
  { id: "rss_new_item", label: "RSS new item", description: "A tracked RSS feed published something new" },
  { id: "billing_threshold", label: "Billing threshold", description: "Approaching or exceeding a plan quota" },
  { id: "account_health", label: "Account health", description: "Sync issue, auth expired, or platform warning" },
] as const;

const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter", "facebook", "linkedin"] as const;

type EventId = (typeof EVENTS)[number]["id"];
type PlatformId = (typeof PLATFORMS)[number];
type Channel = "inapp" | "email";

type PlatformPrefs = Partial<Record<PlatformId, Partial<Record<Channel, boolean>>>>;
interface EventPref {
  inapp: boolean;
  email: boolean;
  platforms: PlatformPrefs;
}
type Prefs = Record<EventId, EventPref>;

const STORAGE_KEY = "smmpilot:settings:notification-prefs";

const defaults: Prefs = EVENTS.reduce((acc, ev) => {
  acc[ev.id] = {
    inapp: true,
    email: ev.id === "weekly_report" || ev.id === "post_failed" || ev.id === "account_health",
    platforms: {},
  };
  return acc;
}, {} as Prefs);

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Prefs) };
  } catch {
    return defaults;
  }
}

export function NotificationPreferencesMatrix() {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [dirty, setDirty] = useState(false);
  const [openId, setOpenId] = useState<EventId | null>(null);

  useEffect(() => {
    if (!dirty) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs, dirty]);

  const summary = useMemo(() => {
    let inapp = 0;
    let email = 0;
    for (const ev of EVENTS) {
      if (prefs[ev.id].inapp) inapp++;
      if (prefs[ev.id].email) email++;
    }
    return { inapp, email };
  }, [prefs]);

  const toggle = (id: EventId, ch: Channel) => {
    setPrefs((p) => ({ ...p, [id]: { ...p[id], [ch]: !p[id][ch] } }));
    setDirty(true);
  };

  const togglePlatform = (id: EventId, platform: PlatformId, ch: Channel) => {
    setPrefs((p) => {
      const current = p[id].platforms[platform] ?? {};
      const parent = p[id][ch];
      // Override toggles: if currently overridden false, next click clears (inherits). If unset, sets to opposite of parent.
      const currentVal = current[ch];
      let nextVal: boolean | undefined;
      if (currentVal === undefined) nextVal = !parent;
      else nextVal = undefined;
      const nextPlat: Partial<Record<Channel, boolean>> = { ...current };
      if (nextVal === undefined) delete nextPlat[ch];
      else nextPlat[ch] = nextVal;
      const nextPlatforms = { ...p[id].platforms, [platform]: nextPlat };
      if (Object.keys(nextPlat).length === 0) delete nextPlatforms[platform];
      return { ...p, [id]: { ...p[id], platforms: nextPlatforms } };
    });
    setDirty(true);
  };

  const reset = () => {
    setPrefs(defaults);
    setDirty(true);
    toast.success("Reset to defaults");
  };

  const save = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setDirty(false);
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Could not save preferences");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose which events trigger in-app alerts and emails. Expand a row to override per platform.
            </CardDescription>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5" /> {summary.inapp} in-app
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {summary.email} email
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Column header — hidden on mobile */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_80px_28px] items-center gap-4 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/60">
          <span>Event</span>
          <span className="text-center">In-app</span>
          <span className="text-center">Email</span>
          <span />
        </div>

        {EVENTS.map((ev) => {
          const p = prefs[ev.id];
          const isOpen = openId === ev.id;
          const overrideCount = Object.keys(p.platforms).length;
          return (
            <Collapsible
              key={ev.id}
              open={isOpen}
              onOpenChange={(o) => setOpenId(o ? ev.id : null)}
              className="rounded-lg border border-border/60 bg-card/50"
            >
              <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_80px_80px_28px] items-center gap-3 sm:gap-4 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{ev.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ev.description}</p>
                  {overrideCount > 0 && (
                    <p className="text-[10px] text-primary mt-1">
                      {overrideCount} platform override{overrideCount === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
                {/* Mobile-only inline toggles */}
                <div className="flex sm:hidden items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(ev.id, "inapp")}
                    aria-label={`In-app for ${ev.label}`}
                    aria-pressed={p.inapp}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 h-8 rounded-md border text-xs",
                      p.inapp ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground",
                    )}
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(ev.id, "email")}
                    aria-label={`Email for ${ev.label}`}
                    aria-pressed={p.email}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 h-8 rounded-md border text-xs",
                      p.email ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground",
                    )}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </button>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Toggle per-platform overrides for ${ev.label}`}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted"
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </CollapsibleTrigger>
                </div>
                {/* Desktop switches */}
                <div className="hidden sm:flex justify-center">
                  <Switch
                    checked={p.inapp}
                    onCheckedChange={() => toggle(ev.id, "inapp")}
                    aria-label={`In-app for ${ev.label}`}
                  />
                </div>
                <div className="hidden sm:flex justify-center">
                  <Switch
                    checked={p.email}
                    onCheckedChange={() => toggle(ev.id, "email")}
                    aria-label={`Email for ${ev.label}`}
                  />
                </div>
                <CollapsibleTrigger asChild className="hidden sm:flex">
                  <button
                    type="button"
                    aria-label={`Toggle per-platform overrides for ${ev.label}`}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted"
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="border-t border-border/60 p-3 space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Per-platform overrides (leave blank to inherit)
                  </p>
                  <div className="space-y-1.5">
                    {PLATFORMS.map((pl) => {
                      const over = p.platforms[pl] ?? {};
                      const inappVal = over.inapp ?? p.inapp;
                      const emailVal = over.email ?? p.email;
                      const inappOverridden = over.inapp !== undefined;
                      const emailOverridden = over.email !== undefined;
                      return (
                        <div key={pl} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/40">
                          <div className="flex items-center gap-2 min-w-0">
                            <PlatformIcon platform={pl} size="xs" showBackground />
                            <span className="text-sm capitalize">{pl}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => togglePlatform(ev.id, pl, "inapp")}
                              aria-label={`Override in-app for ${pl} on ${ev.label}`}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 h-8 rounded-md border text-xs transition-colors",
                                inappVal
                                  ? "border-primary/50 bg-primary/10 text-primary"
                                  : "border-border/60 text-muted-foreground",
                                inappOverridden && "ring-1 ring-primary/40",
                              )}
                            >
                              <Bell className="h-3 w-3" />
                              {inappOverridden ? (inappVal ? "on" : "off") : "inherit"}
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePlatform(ev.id, pl, "email")}
                              aria-label={`Override email for ${pl} on ${ev.label}`}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 h-8 rounded-md border text-xs transition-colors",
                                emailVal
                                  ? "border-primary/50 bg-primary/10 text-primary"
                                  : "border-border/60 text-muted-foreground",
                                emailOverridden && "ring-1 ring-primary/40",
                              )}
                            >
                              <Mail className="h-3 w-3" />
                              {emailOverridden ? (emailVal ? "on" : "off") : "inherit"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="ghost" onClick={reset} aria-label="Reset notification preferences to defaults">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to defaults
        </Button>
        <Button onClick={save} disabled={!dirty} aria-label="Save notification preferences">
          <Save className="h-4 w-4 mr-2" />
          Save preferences
        </Button>
      </CardFooter>
    </Card>
  );
}
