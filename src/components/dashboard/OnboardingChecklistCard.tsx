import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAccounts } from "@/contexts/AccountContext";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useOnboarding } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

interface Props {
  onReopen: () => void;
}

const CAPTIONS_KEY = "smmpilot:captions";
export const ONBOARDING_FLAGS = {
  inboxFlow: "smmpilot:onboarding:inbox-flow",
  approvals: "smmpilot:onboarding:approvals",
  timezone: "smmpilot:onboarding:timezone",
} as const;

function hasFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(key) === "1"; } catch { return false; }
}

export function markOnboardingFlag(key: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, "1"); window.dispatchEvent(new Event("smmpilot:onboarding-flag")); } catch { /* ignore */ }
}

function hasCaptions(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(CAPTIONS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed ?? {}).length > 0;
  } catch {
    return false;
  }
}

export function OnboardingChecklistCard({ onReopen }: Props) {
  const { totalAccounts } = useAccounts();
  const { posts } = useScheduledPosts();
  const { state, complete } = useOnboarding();
  const [open, setOpen] = useState(false);
  const [flagTick, setFlagTick] = useState(0);
  void flagTick;
  useEffect(() => {
    const h = () => setFlagTick((t) => t + 1);
    window.addEventListener("smmpilot:onboarding-flag", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("smmpilot:onboarding-flag", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const items = [
    {
      id: "profile",
      label: "Complete your profile",
      hint: "Tell us your role and brand voice so AI can tailor suggestions.",
      done: !!state.profile.role && !!state.profile.name,
      action: <Button variant="secondary" size="sm" onClick={onReopen}>Resume tour</Button>,
    },
    {
      id: "connect",
      label: "Connect an account",
      hint: "Link at least one social account to publish and pull analytics.",
      done: totalAccounts > 0,
      action: (
        <Button asChild variant="secondary" size="sm">
          <Link to="/dashboard/settings/connected">Connect</Link>
        </Button>
      ),
    },
    {
      id: "caption",
      label: "Save your first caption",
      hint: "Generate or write a caption and save it to your library.",
      done: hasCaptions(),
      action: (
        <Button asChild variant="secondary" size="sm">
          <Link to="/dashboard/library/captions">Open captions</Link>
        </Button>
      ),
    },
    {
      id: "schedule",
      label: "Schedule your first post",
      hint: "Queue a post so the Scheduler starts learning your cadence.",
      done: posts.length > 0,
      action: (
        <Button asChild variant="secondary" size="sm">
          <Link to="/dashboard/publish/queue">Schedule</Link>
        </Button>
      ),
    },
    {
      id: "inbox-flow",
      label: "Create your first inbox flow",
      hint: "Build a rule to auto-triage comments & DMs.",
      done: hasFlag(ONBOARDING_FLAGS.inboxFlow),
      action: (
        <Button asChild variant="secondary" size="sm">
          <Link to="/dashboard/engage">Build flow</Link>
        </Button>
      ),
    },
    {
      id: "approvals",
      label: "Set up an approval policy",
      hint: "Require manager or client sign-off before publishing.",
      done: hasFlag(ONBOARDING_FLAGS.approvals),
      action: (
        <Button asChild variant="secondary" size="sm">
          <Link to="/dashboard/settings/approvals">Set up</Link>
        </Button>
      ),
    },
    {
      id: "timezone",
      label: "Set your reporting timezone",
      hint: "Pick the timezone for your connected accounts so charts show the right hours.",
      done: hasFlag(ONBOARDING_FLAGS.timezone),
      action: (
        <Button asChild variant="secondary" size="sm">
          <Link to="/dashboard/settings/account">Set timezone</Link>
        </Button>
      ),
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const pct = (doneCount / items.length) * 100;
  const allDone = doneCount === items.length;

  // Auto-dismiss forever when all tasks are done.
  useEffect(() => {
    if (allDone && !state.completed) complete();
  }, [allDone, state.completed, complete]);

  // Hide entirely once fully complete.
  if (allDone) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full text-left p-4 sm:p-5 flex items-center gap-3 hover:bg-muted/30 transition-colors"
            aria-expanded={open}
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Get started</h3>
                <span className="text-[11px] text-muted-foreground">
                  {doneCount}/{items.length}
                </span>
              </div>
              <Progress value={pct} className="h-1.5 mt-2" />
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="px-2 sm:px-3 pb-3 space-y-1">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/40"
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  {it.done ? (
                    <CheckCircle2 className="h-4 w-4 text-brand-green flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        it.done && "text-muted-foreground line-through",
                      )}
                    >
                      {it.label}
                    </div>
                    {!it.done && (
                      <div className="text-xs text-muted-foreground mt-0.5">{it.hint}</div>
                    )}
                  </div>
                </div>
                {!it.done && <div className="flex-shrink-0">{it.action}</div>}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
