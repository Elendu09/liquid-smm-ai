import { useMemo } from "react";
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
import { Bell, RotateCcw } from "lucide-react";
import { useLocalCollection } from "@/hooks/useLocalCollection";

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

const DEFAULTS: NotificationPrefs = {
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

const CATEGORIES: Array<{
  key: keyof Omit<NotificationPrefs, "id">;
  label: string;
  description: string;
}> = [
  { key: "engagement", label: "Engagement", description: "Viral posts, high-reply threads, spikes." },
  { key: "milestone", label: "Milestones", description: "Follower counts and platform badges." },
  { key: "alert", label: "Alerts", description: "Account health, sync failures, quota warnings." },
  { key: "reminder", label: "Reminders", description: "Scheduled posts about to publish." },
  { key: "system", label: "System", description: "Product updates and new features." },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NotificationSettingsDialog({ open, onOpenChange }: Props) {
  const { items, setItems } = useLocalCollection<NotificationPrefs>(
    "activity",
    "notif-prefs",
    [DEFAULTS],
  );
  const prefs = useMemo(() => items[0] ?? DEFAULTS, [items]);
  const patch = (p: Partial<NotificationPrefs>) => setItems([{ ...prefs, ...p }]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Notification settings
          </DialogTitle>
          <DialogDescription>
            Choose which alerts appear in your activity feed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {CATEGORIES.map((c) => (
              <div
                key={c.key}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
                <Switch
                  checked={prefs[c.key] as boolean}
                  onCheckedChange={(v) => patch({ [c.key]: v } as Partial<NotificationPrefs>)}
                />
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            {[
              { key: "desktop", label: "Desktop notifications", desc: "Show system notifications." },
              { key: "sound", label: "Play sound", desc: "Chime on new important alerts." },
              { key: "quietHours", label: "Quiet hours (10pm–7am)", desc: "Batch non-critical alerts." },
            ].map((o) => (
              <div key={o.key} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{o.label}</p>
                  <p className="text-xs text-muted-foreground">{o.desc}</p>
                </div>
                <Switch
                  checked={prefs[o.key as keyof NotificationPrefs] as boolean}
                  onCheckedChange={(v) =>
                    patch({ [o.key]: v } as Partial<NotificationPrefs>)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => {
              setItems([DEFAULTS]);
              toast.success("Notification settings reset");
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          <Button
            onClick={() => {
              toast.success("Notification settings saved");
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useNotificationPrefs() {
  const { items } = useLocalCollection<NotificationPrefs>("activity", "notif-prefs", [DEFAULTS]);
  return items[0] ?? DEFAULTS;
}
