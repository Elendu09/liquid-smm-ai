import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/contexts/AccountContext";
import { cn } from "@/lib/utils";
import { markOnboardingFlag, ONBOARDING_FLAGS } from "@/components/dashboard/OnboardingChecklistCard";

/**
 * TimezoneSelector
 *
 * Fix 5.4 — per-account timezone. The user can set a reporting timezone
 * for each connected account so charts count hours in the audience's
 * local time, not the server's. We default to the browser timezone
 * for new accounts.
 */
const COMMON_TZS = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "America/Chicago",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Paris",
  "Africa/Lagos",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function TimezoneSelector({
  accountId,
  className,
}: {
  accountId: string;
  className?: string;
}) {
  const { accounts, updateAccount } = useAccounts();
  const account = accounts.find((a) => a.id === accountId);
  const fallback = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const [tz, setTz] = useState<string>(account?.timezone || fallback);

  useEffect(() => {
    setTz(account?.timezone || fallback);
  }, [account?.id, account?.timezone, fallback]);

  const onChange = (next: string) => {
    setTz(next);
    void updateAccount(accountId, { timezone: next });
    try { markOnboardingFlag(ONBOARDING_FLAGS.timezone); } catch (_e) { void _e; }
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
        <Globe2 className="h-3 w-3" />
      </span>
      <Select value={tz} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-[10rem] text-[11px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COMMON_TZS.map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * TimezoneLabel
 *
 * Small chip that shows the timezone of the active account. Used as an
 * axis-label helper on every analytics chart.
 */
export function TimezoneLabel({ accountId, fallback, className }: { accountId?: string | null; fallback?: string; className?: string }) {
  const { accounts } = useAccounts();
  const account = accountId ? accounts.find((a) => a.id === accountId) : null;
  const tz = account?.timezone || fallback || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/95 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground", className)}>
      <Globe2 className="h-2.5 w-2.5" /> {tz}
    </span>
  );
}

/**
 * Format a Date in a chosen IANA timezone. Default: uses the account's
 * timezone if available, else the browser timezone.
 */
export function formatInTimezone(d: Date | string, tz?: string | null): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const zone = tz || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch { return date.toLocaleTimeString(); }
}

/** Format a full date+time in the chosen IANA timezone, e.g. "Mon 14:00 GMT+1". */
export function formatDateTimeInTimezone(d: Date | string, tz?: string | null): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const zone = tz || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: zone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  } catch { return date.toLocaleString(); }
}
