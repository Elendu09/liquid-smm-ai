import { Link } from "react-router-dom";
import { Wand2, Sparkles, Hash, Rocket, ArrowRight, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOnboarding } from "@/hooks/useOnboarding";

/** Dashboard home panel that turns the onboarding profile + AI blueprint into
 *  a personalized workspace view — and links straight to the setup pages. */
export function PersonalizedSetupPanel() {
  const { state, blueprint } = useOnboarding();
  const p = state.profile;
  const hasProfile = !!(p.name || p.niches?.length || p.goals?.length || p.role);
  if (!state.completed || !hasProfile) return null;

  const contentMix = blueprint?.contentMix ?? [];
  const hashtags = blueprint?.starterHashtags ?? [];
  const automations = blueprint?.suggestedAutomations ?? [];

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.04]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wand2 className="h-4 w-4 text-primary" />
          Your workspace, set up for you
        </CardTitle>
        <CardDescription className="text-xs">
          Built from your onboarding — {blueprint?.focus ?? "ready to go"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Identity */}
        <div className="flex flex-wrap gap-1.5">
          {p.role && <Badge variant="secondary" className="capitalize">{p.role}</Badge>}
          {p.tone && <Badge variant="outline" className="capitalize">{p.tone} tone</Badge>}
          {(p.connectedPlatformIds ?? []).slice(0, 8).map((id) => (
            <Badge key={id} variant="outline" className="text-[10px] capitalize">{id}</Badge>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Content mix */}
          {contentMix.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Recommended content mix</div>
              <div className="space-y-1.5">
                {contentMix.map((c) => (
                  <div key={c.pillar} className="flex items-center gap-2 text-xs">
                    <span className="w-28 truncate">{c.pillar}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, c.share)}%` }} />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{c.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Starter hashtags */}
          {hashtags.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <Hash className="h-3 w-3" /> Starter hashtags
              </div>
              <div className="flex flex-wrap gap-1">
                {hashtags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full border border-border/60 text-[11px] text-muted-foreground">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suggested automations */}
        {automations.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Rocket className="h-3 w-3" /> Suggested automations
            </div>
            <div className="space-y-1.5">
              {automations.map((a) => (
                <div key={a} className="flex items-center gap-2 text-xs rounded-lg border border-border/50 bg-background/40 px-3 py-2">
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span className="flex-1">{a}</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">
                    <BadgeCheck className="h-2.5 w-2.5 mr-1" /> Suggested
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Set-up shortcuts */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link to="/dashboard/publish/rss"><Button size="sm" variant="outline" className="gap-1"><Rocket className="h-3.5 w-3.5" /> RSS automation</Button></Link>
          <Link to="/dashboard/audience/competitors"><Button size="sm" variant="outline" className="gap-1"><Sparkles className="h-3.5 w-3.5" /> Track competitors</Button></Link>
          <Link to="/dashboard/create/studio"><Button size="sm" className="gap-1 ml-auto">Open AI Studio <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
        </div>
      </CardContent>
    </Card>
  );
}
