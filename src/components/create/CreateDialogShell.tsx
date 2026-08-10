import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { X, RadioTower } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { limitFor } from "@/lib/charCount";
import { cn } from "@/lib/utils";

export interface CreateDialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional tile icon shown left of the title */
  icon?: LucideIcon;
  /** Accessible, plain-text title (displayed when `titleNode` is absent) */
  title: string;
  /** Optional rich title (e.g. an inline editable title input) */
  titleNode?: ReactNode;
  /** Small status chip rendered next to the title */
  badge?: ReactNode;
  /** Actions on the right of the header, before the close button */
  headerActions?: ReactNode;
  /** One-line subtitle under the title */
  description?: string;
  /** Footer content — typically the primary actions */
  footer?: ReactNode;
  /** Main dialog body (scrolls) */
  children: ReactNode;
  /** Extra classes for DialogContent (e.g. width overrides) */
  className?: string;
}

/**
 * Unified dialog chrome for the Create studio — shared by the
 * "New draft" and other creation dialogs so they all get the same
 * header (title above, X-only close), a scrollable body, and a
 * consistent sticky footer.
 */
export function CreateDialogShell({
  open,
  onOpenChange,
  icon: Icon,
  title,
  titleNode,
  badge,
  headerActions,
  description,
  footer,
  children,
  className,
}: CreateDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[92vh] w-[calc(100%-1rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl p-0 [&>button.absolute]:hidden sm:max-h-[90vh]",
          className,
        )}
      >
        <DialogHeader className="flex shrink-0 flex-row items-start justify-between gap-3 space-y-0 px-4 pt-4 pb-3 text-left sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {Icon && (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted/30">
                <Icon className="h-4.5 w-4.5 text-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base font-semibold tracking-tight sm:text-lg">
                {titleNode ?? title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-0.5 truncate text-xs">
                  {description}
                </DialogDescription>
              )}
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {headerActions}
            <DialogClose
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="shrink-0 border-t border-border/40" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center justify-end gap-2">{footer}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Shared status chip used in Create dialogs' headers. */
export function CreateDialogStatusChip({
  dotClass,
  label,
  className,
}: {
  /** Tailwind bg-* class for the status dot */
  dotClass: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "hidden items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:inline-flex",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
      {label}
    </span>
  );
}

function captionStatusText(caption: string): string {
  const words = caption.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return "Start writing your post.";
  if (words < 12) return "Looking good — keep going.";
  return "Nice — ready when you are.";
}

/**
 * Shared live-preview column used by the Create dialogs. The preview
 * always renders (even when empty, the card shows its own placeholder
 * state), and a hint bar under it shows writing status + word/char counts.
 *
 * Pass `platforms` + `activePlatform` + `onActivePlatformChange` to get a
 * per-network switcher (like the Schedule dialog) right above the preview,
 * so the post can be previewed on each selected social channel.
 */
export function CreateDialogPreview({
  caption,
  platform,
  platforms,
  activePlatform,
  onActivePlatformChange,
  children,
  generated,
  className,
}: {
  /** Current caption — drives the status hint and counters */
  caption: string;
  /** Platform used for the char limit when the switcher is off */
  platform?: string;
  /** Selected networks — shows the per-network switcher when >1 */
  platforms?: readonly string[];
  /** Currently previewed network (controlled by the parent) */
  activePlatform?: string;
  onActivePlatformChange?: (p: string) => void;
  /** Flash the "Generated by AI" treatment right after AI completes */
  generated?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const trimmed = caption.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const current = activePlatform ?? platforms?.[0] ?? platform ?? "instagram";
  const limit = limitFor(current);

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <RadioTower className="h-3 w-3" />
        <p className="text-[11px] font-semibold uppercase tracking-wider">Live preview</p>
        {/* Per-network switcher — like the Schedule dialog preview */}
        {platforms && platforms.length > 1 && (
          <div className="ml-1 flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="Preview network">
            {platforms.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={current === id}
                title={`Preview on ${id}`}
                onClick={() => onActivePlatformChange?.(id)}
                className={cn(
                  "rounded-lg border p-1.5 transition-colors",
                  current === id
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <PlatformIcon platform={id} size="xs" />
              </button>
            ))}
          </div>
        )}
        {generated && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            ✨ Generated by AI
          </span>
        )}
      </div>

      <div
        className={cn(
          "rounded-2xl transition-shadow duration-500",
          generated &&
            "shadow-[0_0_0_2px_hsl(var(--primary)/0.45),0_0_24px_-6px_hsl(var(--primary)/0.55)]",
        )}
      >
        {children}
      </div>

      {/* Writing hint bar */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-full border px-3 py-1.5 text-[11px]",
          trimmed
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        )}
      >
        <span className="truncate font-medium">{captionStatusText(caption)}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {`${words} word${words === 1 ? "" : "s"} · ${caption.length.toLocaleString()}\u2009/\u2009${limit.toLocaleString()} chars`}
        </span>
      </div>
    </div>
  );
}
