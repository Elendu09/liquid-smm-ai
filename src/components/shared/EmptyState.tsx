import { Link } from "react-router-dom";
import {
  LucideIcon,
  Inbox,
  Plug,
  Plus,
  UploadCloud,
  UserPlus,
  Settings,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyVariant =
  | "connect-account"
  | "create-first"
  | "upload-asset"
  | "invite-team"
  | "finish-setup"
  | "upgrade-plan";

const VARIANTS: Record<
  EmptyVariant,
  { icon: LucideIcon; title: string; description: string; ctaLabel: string; ctaHref: string }
> = {
  "connect-account": {
    icon: Plug,
    title: "Connect a social account",
    description: "We start collecting data the moment an account is connected.",
    ctaLabel: "Connect account",
    ctaHref: "/dashboard/settings/connected",
  },
  "create-first": {
    icon: Plus,
    title: "Nothing here yet",
    description: "Create your first item to get started.",
    ctaLabel: "Create",
    ctaHref: "/dashboard/create",
  },
  "upload-asset": {
    icon: UploadCloud,
    title: "Your library is empty",
    description: "Upload media, captions, or presets to reuse across posts.",
    ctaLabel: "Upload asset",
    ctaHref: "/dashboard/library/assets",
  },
  "invite-team": {
    icon: UserPlus,
    title: "Invite your team",
    description: "Collaborate with editors, approvers, and viewers.",
    ctaLabel: "Invite member",
    ctaHref: "/dashboard/team",
  },
  "finish-setup": {
    icon: Settings,
    title: "Finish setup",
    description: "Complete a few quick steps to unlock this section.",
    ctaLabel: "Continue setup",
    ctaHref: "/dashboard/settings",
  },
  "upgrade-plan": {
    icon: Sparkles,
    title: "Upgrade to unlock",
    description: "This feature is available on Pro and above.",
    ctaLabel: "See plans",
    ctaHref: "/dashboard/settings/billing",
  },
};

interface EmptyStateProps {
  variant?: EmptyVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Shared empty state for signed-in users when a card has no real data yet.
 * Never used in guest/demo mode.
 * Pass a `variant` for a preset, or override any field individually.
 */
export function EmptyState({
  variant,
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
  className,
  compact,
}: EmptyStateProps) {
  const preset = variant ? VARIANTS[variant] : null;
  const Icon = icon ?? preset?.icon ?? Inbox;
  const t = title ?? preset?.title ?? "Nothing here yet";
  const d = description ?? preset?.description;
  const cl = ctaLabel ?? preset?.ctaLabel;
  const ch = ctaHref ?? preset?.ctaHref;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20",
        compact ? "py-6 px-4" : "py-10 px-6",
        className,
      )}
    >
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{t}</p>
      {d && <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{d}</p>}
      {cl && (ch || onCta) && (
        ch && !onCta ? (
          <Button asChild size="sm" variant="outline" className="mt-1">
            <Link to={ch}>{cl}</Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="mt-1" onClick={onCta}>
            {cl}
          </Button>
        )
      )}
    </div>
  );
}
