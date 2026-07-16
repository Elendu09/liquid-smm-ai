import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, RotateCcw } from "lucide-react";
import {
  useNotificationPreferences,
  DEFAULT_RULES,
  type NotificationPreferences,
  type NotificationRule,
} from "@/hooks/useNotificationPreferences";
import { useLocalCollection } from "@/hooks/useLocalCollection";

// Legacy local prefs kept for components that still consume useNotificationPrefs()
export interface NotificationPrefs {
  id: "notif-prefs";
  engagement: boolean;
  milestone: boolean;
  alert: boolean;
  reminder: boolean;
  system: boolean;
  desktop: boolean;
  sound: boolean;
  quietHours: boolean;
}
const LEGACY_DEFAULTS: NotificationPrefs = {
  id: "notif-prefs",
  engagement: true,
  milestone: true,
  alert: true,
  reminder: true,
  system: false,
  desktop: false,
  sound: false,
  quietHours: false,
};

const CATEGORIES = [
  { key: "engagement", label: "Engagement", desc: "Viral posts, comment/reply spikes, high engagement." },
  { key: "milestone", label: "Milestones", desc: "Follower, view, and like thresholds." },
  { key: "alert", label: "Alerts", desc: "Re-auth, publish failures, quota, follower drops." },
  { key: "reminder", label: "Reminders", desc: "Scheduled posts, aging drafts, optimal windows." },
  { key: "system", label: "System", desc: "AI jobs, integrations, billing, team." },
] as const;

type CatKey = (typeof CATEGORIES)[number]["key"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NotificationSettingsDialog({ open, onOpenChange }: Props) {
  const { prefs, rules, savePreferences, saveRule, loading } = useNotificationPreferences();
  const [draft, setDraft] = useState<NotificationPreferences>(prefs);
  const [ruleDraft, setRuleDraft] = useState<NotificationRule[]>(rules);

  useEffect(() => setDraft(prefs), [prefs]);
  useEffect(() => setRuleDraft(rules), [rules]);

  // Keep the legacy local prefs in sync so consumers of useNotificationPrefs() still work
  const { setItems: setLegacy } = useLocalCollection<NotificationPrefs>(
    "activity",
    "notif-prefs",
    [LEGACY_DEFAULTS],
  );

  const patchChannel = (key: CatKey, patch: Partial<NonNullable<NotificationPreferences["channels"][CatKey]>>) => {
    setDraft((d) => ({
      ...d,
      channels: { ...d.channels, [key]: { ...(d.channels[key] ?? {}), ...patch } },
    }));
  };

  const patchQuiet = (patch: Partial<NotificationPreferences["quietHours"]>) => {
    setDraft((d) => ({ ...d, quietHours: { ...d.quietHours, ...patch } }));
  };

  const patchRule = (key: string, patch: Partial<NotificationRule>) => {
    setRuleDraft((prev) => prev.map((r) => (r.ruleKey === key ? { ...r, ...patch, params: { ...r.params, ...(patch.params ?? {}) } } : r)));
  };

  const handleSave = async () => {
    await savePreferences(draft);
    await Promise.all(ruleDraft.map((r) => saveRule(r)));
    setLegacy([
      {
        ...LEGACY_DEFAULTS,
        engagement: draft.channels.engagement?.inapp ?? true,
        milestone: draft.channels.milestone?.inapp ?? true,
        alert: draft.channels.alert?.inapp ?? true,
        reminder: draft.channels.reminder?.inapp ?? true,
        system: draft.channels.system?.inapp ?? false,
        quietHours: draft.quietHours.enabled,
      },
    ]);
    toast.success("Notification settings saved");
    onOpenChange(false);
  };

  const findRule = (k: string) => ruleDraft.find((r) => r.ruleKey === k);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Notification settings
          </DialogTitle>
          <DialogDescription>
            Choose what fires, where it arrives, and when to stay quiet.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="channels" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="rules">Thresholds</TabsTrigger>
            <TabsTrigger value="quiet">Quiet & Digest</TabsTrigger>
          </TabsList>

          {/* Channels */}
          <TabsContent value="channels" className="space-y-3 mt-4">
            <div className="grid grid-cols-[1fr,auto,auto,auto] gap-x-3 gap-y-2 items-center text-xs text-muted-foreground px-1">
              <span />
              <span className="text-center w-14">In-app</span>
              <span className="text-center w-14">Toast</span>
              <span className="text-center w-14">Email</span>
            </div>
            {CATEGORIES.map((c) => {
              const ch = draft.channels[c.key] ?? {};
              return (
                <div
                  key={c.key}
                  className="grid grid-cols-[1fr,auto,auto,auto] gap-x-3 items-center rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                  <div className="w-14 flex justify-center">
                    <Switch checked={ch.inapp ?? true} onCheckedChange={(v) => patchChannel(c.key, { inapp: v })} />
                  </div>
                  <div className="w-14 flex justify-center">
                    <Switch checked={ch.toast ?? false} onCheckedChange={(v) => patchChannel(c.key, { toast: v })} />
                  </div>
                  <div className="w-14 flex justify-center">
                    <Switch checked={ch.email ?? false} onCheckedChange={(v) => patchChannel(c.key, { email: v })} />
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Rule thresholds */}
          <TabsContent value="rules" className="space-y-4 mt-4">
            <RuleSlider
              rule={findRule("engagement.viral")}
              label="Viral threshold"
              desc="Fire when velocity exceeds baseline × multiplier"
              paramKey="multiplier"
              min={2} max={20} step={1} suffix="×"
              onChange={patchRule}
            />
            <RuleSlider
              rule={findRule("engagement.high")}
              label="High engagement"
              desc="Comments on a single post"
              paramKey="commentsThreshold"
              min={10} max={1000} step={10} suffix=" comments"
              onChange={patchRule}
            />
            <RuleSlider
              rule={findRule("health.followerDrop")}
              label="Follower drop"
              desc="Alert when followers drop by more than"
              paramKey="pct"
              min={1} max={30} step={1} suffix="%"
              onChange={patchRule}
            />
            <RuleSlider
              rule={findRule("health.quota")}
              label="API quota warning"
              desc="Warn when usage exceeds"
              paramKey="pct"
              min={50} max={100} step={5} suffix="%"
              onChange={patchRule}
            />
            <RuleSlider
              rule={findRule("reminder.draftAging")}
              label="Draft aging"
              desc="Remind about drafts older than"
              paramKey="days"
              min={1} max={30} step={1} suffix=" days"
              onChange={patchRule}
            />
          </TabsContent>

          {/* Quiet hours & digest */}
          <TabsContent value="quiet" className="space-y-4 mt-4">
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Quiet hours</p>
                  <p className="text-xs text-muted-foreground">
                    Non-critical notifications are suppressed during this window. Critical alerts always come through.
                  </p>
                </div>
                <Switch
                  checked={draft.quietHours.enabled}
                  onCheckedChange={(v) => patchQuiet({ enabled: v })}
                />
              </div>
              {draft.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">From (hour)</Label>
                    <Input
                      type="number" min={0} max={23}
                      value={draft.quietHours.startHour}
                      onChange={(e) => patchQuiet({ startHour: Math.max(0, Math.min(23, Number(e.target.value) || 0)) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">To (hour)</Label>
                    <Input
                      type="number" min={0} max={23}
                      value={draft.quietHours.endHour}
                      onChange={(e) => patchQuiet({ endHour: Math.max(0, Math.min(23, Number(e.target.value) || 0)) })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-sm font-medium">Digest mode</p>
              <p className="text-xs text-muted-foreground">
                Batch low-priority notifications into a single summary.
              </p>
              <div className="flex gap-2">
                {(["off", "daily", "weekly"] as const).map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={draft.digestMode === m ? "default" : "outline"}
                    onClick={() => setDraft((d) => ({ ...d, digestMode: m }))}
                  >
                    {m[0].toUpperCase() + m.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            disabled={loading}
            onClick={() => {
              setDraft(prefs);
              setRuleDraft(DEFAULT_RULES);
              toast.success("Notification settings reset to defaults");
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={loading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RuleSliderProps {
  rule?: NotificationRule;
  label: string;
  desc: string;
  paramKey: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (key: string, patch: Partial<NotificationRule>) => void;
}
function RuleSlider({ rule, label, desc, paramKey, min, max, step, suffix, onChange }: RuleSliderProps) {
  if (!rule) return null;
  const value = Number(rule.params[paramKey] ?? min);
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono tabular-nums">{value}{suffix}</span>
          <Switch checked={rule.enabled} onCheckedChange={(v) => onChange(rule.ruleKey, { enabled: v })} />
        </div>
      </div>
      <Slider
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => onChange(rule.ruleKey, { params: { [paramKey]: v } })}
        disabled={!rule.enabled}
      />
    </div>
  );
}

// Legacy hook kept so existing consumers keep working
export function useNotificationPrefs() {
  const { items } = useLocalCollection<NotificationPrefs>("activity", "notif-prefs", [LEGACY_DEFAULTS]);
  return items[0] ?? LEGACY_DEFAULTS;
}
