import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Info, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { explainError, severityTone, severityLabel, type ErrorSeverity } from "@/lib/errorCodes";

interface ErrorExplainerProps {
  /** Raw error string returned by a publish or sync call. */
  error: string | null | undefined;
  /** Optional context shown before the explanation. */
  context?: string;
  /** Allow the user to dismiss. */
  onDismiss?: () => void;
  /** Show a compact card instead of a full banner. */
  compact?: boolean;
  className?: string;
}

/**
 * ErrorExplainer
 *
 * Renders a clear, friendly explanation of an error returned by a social
 * platform or our own backend. Falls back to a kind generic message when we
 * don't recognise the code, but always preserves the raw text so support
 * can debug.
 */
export function ErrorExplainer({ error, context, onDismiss, compact, className }: ErrorExplainerProps) {
  const explanation = explainError(error);

  if (!explanation && !error) return null;

  const Icon = explanation ? SEVERITY_ICON[explanation.severity] : AlertCircle;
  const tone = explanation ? severityTone(explanation.severity) : "text-rose-500";
  const headline = explanation?.headline ?? "Something went wrong";
  const cause = explanation?.cause ?? "The platform didn't tell us anything specific. We've recorded the raw error so support can investigate.";
  const fix = explanation?.fix;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border bg-card/95",
        explanation?.severity === "critical" && "border-rose-500/30",
        explanation?.severity === "warning" && "border-amber-500/30",
        explanation?.severity === "info" && "border-cyan-500/30",
        !explanation && "border-rose-500/30",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 grid place-items-center rounded-lg", TONE_BG[explanation?.severity ?? "critical"], compact ? "h-7 w-7" : "h-8 w-8")}>
          <Icon className={cn(tone, compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={cn("font-semibold leading-tight", compact ? "text-xs" : "text-sm")}>{headline}</p>
            {explanation && (
              <span className={cn("text-[9px] font-semibold uppercase tracking-wider", tone)}>
                {severityLabel(explanation.severity)}
              </span>
            )}
          </div>
          {context && <p className="mt-0.5 text-[10px] text-muted-foreground">{context}</p>}
          <p className={cn("mt-1 leading-relaxed text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>
            {cause}
          </p>
          {fix && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.04] p-2.5">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p className={cn("leading-relaxed text-foreground/90", compact ? "text-[10px]" : "text-[11px]")}>
                <span className="font-semibold">What to do · </span>
                {fix}
              </p>
            </div>
          )}
          {error && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[10px] font-medium text-muted-foreground hover:text-foreground">
                Show raw error
              </summary>
              <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-muted/50 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {error}
              </pre>
            </details>
          )}
        </div>
        {onDismiss && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss} aria-label="Dismiss error">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

const SEVERITY_ICON: Record<ErrorSeverity, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertCircle,
  critical: AlertCircle,
};

const TONE_BG: Record<ErrorSeverity, string> = {
  info: "bg-cyan-500/10",
  warning: "bg-amber-500/10",
  critical: "bg-rose-500/10",
};
