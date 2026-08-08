import { Link } from "react-router-dom";
import { Plug, Workflow, MessageSquareText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  onConnect?: () => void;
  onBuildFlow?: () => void;
  onSavedReplies?: () => void;
}

export function RefinedInboxEmptyState({ onConnect, onBuildFlow, onSavedReplies }: Props) {
  const cards = [
    {
      icon: Plug,
      title: "Connect a channel",
      description: "Link Instagram, TikTok, X or LinkedIn to start receiving messages in one place.",
      cta: "Connect channel",
      href: "/dashboard/settings/connected",
      onClick: onConnect,
    },
    {
      icon: Workflow,
      title: "Build an inbox flow",
      description: "Auto-triage DMs and comments — route by keyword, sentiment or platform.",
      cta: "Build flow",
      href: "/dashboard/engage",
      onClick: onBuildFlow,
    },
    {
      icon: MessageSquareText,
      title: "Create saved replies",
      description: "Save snippets you reuse: welcome notes, FAQs, and escalation replies.",
      cta: "Saved replies",
      href: "/dashboard/engage",
      onClick: onSavedReplies,
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-sm font-semibold">Your inbox is ready — let's set it up</p>
        <p className="text-xs text-muted-foreground mt-1">Pick one of the three starters below. You can do all of them — each unlocks a new piece of the inbox.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title} className="p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <c.icon className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm leading-none">{c.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">{c.description}</p>
            {c.onClick ? (
              <Button size="sm" variant="outline" className="w-full" onClick={c.onClick}>
                {c.cta}
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link to={c.href}>{c.cta}</Link>
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
