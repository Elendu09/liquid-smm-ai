import { Link } from "react-router-dom";
import { CheckCircle2, Circle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAccounts } from "@/contexts/AccountContext";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useOnboarding } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

interface Props {
  onReopen: () => void;
}

const CAPTIONS_KEY = "smmpilot:captions";

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

  const items = [
    {
      id: "profile",
      label: "Complete your profile",
      done: !!state.profile.role && !!state.profile.name,
      action: <Button variant="ghost" size="sm" onClick={onReopen}>Resume</Button>,
    },
    {
      id: "connect",
      label: "Connect an account",
      done: totalAccounts > 0,
      action: (
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/settings/connected">Connect</Link>
        </Button>
      ),
    },
    {
      id: "caption",
      label: "Save your first caption",
      done: hasCaptions(),
      action: (
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/library/captions">Open</Link>
        </Button>
      ),
    },
    {
      id: "schedule",
      label: "Schedule your first post",
      done: posts.length > 0,
      action: (
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/publish/queue">Schedule</Link>
        </Button>
      ),
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const pct = (doneCount / items.length) * 100;
  const allDone = doneCount === items.length;

  return (
    <Card className="p-4 sm:p-5 border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Get started</h3>
            <p className="text-xs text-muted-foreground">
              {allDone ? "Nice work — all set." : `${doneCount} of ${items.length} complete`}
            </p>
          </div>
        </div>
        {allDone && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={complete}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Progress value={pct} className="h-1.5 mb-3" />
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-muted/40"
          >
            <div className="flex items-center gap-2 min-w-0">
              {it.done ? (
                <CheckCircle2 className="h-4 w-4 text-brand-green flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={cn("text-sm truncate", it.done && "text-muted-foreground line-through")}>
                {it.label}
              </span>
            </div>
            {!it.done && it.action}
          </li>
        ))}
      </ul>
    </Card>
  );
}
