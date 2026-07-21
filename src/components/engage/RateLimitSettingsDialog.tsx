import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Gauge, ShieldCheck } from "lucide-react";

export interface RateLimitSettings {
  enabled: boolean;
  /** Minimum seconds between two AI replies / engagements. */
  minDelaySec: number;
  /** Random jitter (± seconds) added to each delay to look human. */
  jitterSec: number;
  /** Hard cap of actions per rolling hour. */
  maxPerHour: number;
  /** Hard cap of actions per rolling day. */
  maxPerDay: number;
  /** Pause automation entirely between these hours (local time). */
  quietHoursEnabled: boolean;
  quietStart: number; // 0-23
  quietEnd: number;   // 0-23
}

export const DEFAULT_RATE_LIMIT: RateLimitSettings = {
  enabled: true,
  minDelaySec: 12,
  jitterSec: 6,
  maxPerHour: 40,
  maxPerDay: 300,
  quietHoursEnabled: false,
  quietStart: 23,
  quietEnd: 7,
};

export const RATE_LIMIT_KEY = "smmpilot:engage:rate-limit";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: RateLimitSettings;
  onSave: (v: RateLimitSettings) => void;
}

function riskLabel(s: RateLimitSettings): { label: string; tone: string } {
  if (!s.enabled) return { label: "Off · High risk", tone: "text-destructive" };
  const perMin = 60 / Math.max(1, s.minDelaySec);
  if (perMin > 8 || s.maxPerHour > 120) return { label: "Aggressive", tone: "text-destructive" };
  if (perMin > 3 || s.maxPerHour > 60) return { label: "Balanced", tone: "text-brand-orange" };
  return { label: "Safe", tone: "text-brand-green" };
}

export function RateLimitSettingsDialog({ open, onOpenChange, value, onSave }: Props) {
  const [s, setS] = useState<RateLimitSettings>(value);
  useEffect(() => { if (open) setS(value); }, [open, value]);

  const risk = riskLabel(s);
  const perMin = (60 / Math.max(1, s.minDelaySec)).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" /> Rate limits
          </DialogTitle>
          <DialogDescription>
            Throttle Quick AI replies and auto-engagement to avoid bursts and reduce platform detection risk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Enforce rate limits</p>
              <p className="text-[11px] text-muted-foreground">Turn off to run everything as fast as possible (not recommended).</p>
            </div>
            <Switch checked={s.enabled} onCheckedChange={(v) => setS({ ...s, enabled: v })} />
          </div>

          <div className={s.enabled ? "" : "opacity-50 pointer-events-none"}>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Minimum delay between actions: {s.minDelaySec}s (≈ {perMin}/min)</Label>
                <Slider min={2} max={120} step={1} value={[s.minDelaySec]} onValueChange={([v]) => setS({ ...s, minDelaySec: v })} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs">Random jitter: ± {s.jitterSec}s</Label>
                <Slider min={0} max={30} step={1} value={[s.jitterSec]} onValueChange={([v]) => setS({ ...s, jitterSec: v })} className="mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Max / hour: {s.maxPerHour}</Label>
                  <Slider min={5} max={300} step={5} value={[s.maxPerHour]} onValueChange={([v]) => setS({ ...s, maxPerHour: v })} className="mt-2" />
                </div>
                <div>
                  <Label className="text-xs">Max / day: {s.maxPerDay}</Label>
                  <Slider min={20} max={2000} step={10} value={[s.maxPerDay]} onValueChange={([v]) => setS({ ...s, maxPerDay: v })} className="mt-2" />
                </div>
              </div>

              <div className="rounded-md border border-border/60 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Quiet hours</p>
                    <p className="text-[11px] text-muted-foreground">Pause automation overnight (local time).</p>
                  </div>
                  <Switch checked={s.quietHoursEnabled} onCheckedChange={(v) => setS({ ...s, quietHoursEnabled: v })} />
                </div>
                {s.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Start: {s.quietStart}:00</Label>
                      <Slider min={0} max={23} step={1} value={[s.quietStart]} onValueChange={([v]) => setS({ ...s, quietStart: v })} className="mt-2" />
                    </div>
                    <div>
                      <Label className="text-xs">End: {s.quietEnd}:00</Label>
                      <Slider min={0} max={23} step={1} value={[s.quietEnd]} onValueChange={([v]) => setS({ ...s, quietEnd: v })} className="mt-2" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-muted/40 border border-border/60 p-2.5">
            <ShieldCheck className={`h-4 w-4 ${risk.tone}`} />
            <span className="text-xs">Risk profile:</span>
            <Badge variant="outline" className={`text-[10px] ${risk.tone}`}>{risk.label}</Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setS(DEFAULT_RATE_LIMIT)}>Reset</Button>
          <Button onClick={() => { onSave(s); onOpenChange(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Simple in-memory + localStorage sliding-window limiter shared across the UI. */
const HISTORY_KEY = "smmpilot:engage:rate-history";

function loadHistory(): number[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as number[]; } catch { return []; }
}
function saveHistory(h: number[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

export function checkRateLimit(s: RateLimitSettings): { allowed: boolean; reason?: string; waitMs?: number } {
  if (!s.enabled) return { allowed: true };
  const now = Date.now();
  const history = loadHistory().filter((t) => now - t < 24 * 3600_000);

  if (s.quietHoursEnabled) {
    const h = new Date().getHours();
    const inQuiet = s.quietStart <= s.quietEnd
      ? h >= s.quietStart && h < s.quietEnd
      : h >= s.quietStart || h < s.quietEnd;
    if (inQuiet) return { allowed: false, reason: "Quiet hours are active." };
  }

  const last = history[history.length - 1];
  if (last) {
    const gap = now - last;
    const required = (s.minDelaySec + Math.random() * s.jitterSec) * 1000; // synth-ok: rate-limit jitter
    if (gap < required) {
      return { allowed: false, reason: `Wait ${Math.ceil((required - gap) / 1000)}s (rate limit).`, waitMs: required - gap };
    }
  }
  const inHour = history.filter((t) => now - t < 3600_000).length;
  if (inHour >= s.maxPerHour) return { allowed: false, reason: `Hourly cap reached (${s.maxPerHour}).` };
  if (history.length >= s.maxPerDay) return { allowed: false, reason: `Daily cap reached (${s.maxPerDay}).` };

  return { allowed: true };
}

export function recordAction() {
  const now = Date.now();
  const h = loadHistory().filter((t) => now - t < 24 * 3600_000);
  h.push(now);
  saveHistory(h);
}

/** Compute per-action delay with jitter for scheduling batch runs. */
export function nextDelayMs(s: RateLimitSettings): number {
  if (!s.enabled) return 0;
  return (s.minDelaySec + Math.random() * s.jitterSec) * 1000; // synth-ok: rate-limit jitter
}
