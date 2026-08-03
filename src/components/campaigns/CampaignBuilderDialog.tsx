import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Wand2, Loader2, CalendarPlus, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useAccounts } from "@/contexts/AccountContext";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useCampaignPlanner, type CampaignPlan } from "@/hooks/useCampaignPlanner";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { formatCost } from "@/config/aiCosts";
import { cn } from "@/lib/utils";

const OBJECTIVES = [
  { value: "awareness", label: "Brand awareness" },
  { value: "engagement", label: "Engagement" },
  { value: "traffic", label: "Traffic" },
  { value: "leads", label: "Leads" },
  { value: "sales", label: "Sales" },
  { value: "launch", label: "Product launch" },
];

export function CampaignBuilderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { accounts } = useAccounts();
  const { create, update } = useCampaigns();
  const { plan, loading } = useCampaignPlanner();
  const { add: addPost } = useScheduledPosts();

  const [name, setName] = useState("");
  const [objective, setObjective] = useState("awareness");
  const [brief, setBrief] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("confident, helpful");
  const [days, setDays] = useState(14);
  const [perWeek, setPerWeek] = useState(4);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [result, setResult] = useState<CampaignPlan | null>(null);

  const available = useMemo(() => {
    const ids = Array.from(new Set(accounts.map((a) => a.platformId)));
    return ids.length ? ids : ["instagram", "twitter", "linkedin", "facebook"];
  }, [accounts]);

  const chosen = platforms.length ? platforms : available.slice(0, 1);

  const reset = () => {
    setName("");
    setBrief("");
    setAudience("");
    setPlatforms([]);
    setResult(null);
  };

  const togglePlatform = (id: string) =>
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handlePlan = async () => {
    if (!name.trim()) {
      toast.error("Give the campaign a name first.");
      return;
    }
    const res = await plan({
      name: name.trim(),
      objective,
      brief,
      audience,
      tone,
      platforms: chosen,
      days,
      postsPerWeek: perWeek,
    });
    if (res) setResult(res);
  };

  const handleSave = async (schedule: boolean) => {
    if (!name.trim()) return;
    const start = new Date();
    const end = new Date(start.getTime() + days * 86400000);
    const campaign = await create({
      name: name.trim(),
      objective,
      brief,
      audience,
      tone,
      platformIds: chosen,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      goalPosts: result?.posts.length ?? 0,
      status: schedule ? "active" : "draft",
      meta: result ? { themes: result.themes, plan: result.posts } : {},
    });

    if (schedule && result?.posts.length) {
      for (const p of result.posts) {
        const when = new Date(start.getTime() + p.day * 86400000);
        when.setHours(10, 0, 0, 0);
        addPost({
          caption: `${p.hook}\n\n${p.caption}`.trim(),
          hashtags: p.hashtags,
          platformIds: [p.platform],
          scheduledAt: when.toISOString(),
          status: "queued",
        });
      }
      await update(campaign.id, { goalPosts: result.posts.length });
      toast.success(`${result.posts.length} posts queued for "${campaign.name}".`);
    } else {
      toast.success(`Campaign "${campaign.name}" saved.`);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90dvh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> New campaign
          </DialogTitle>
          <DialogDescription>
            Describe the campaign once — AI drafts the whole content plan. Planning costs{" "}
            {formatCost("campaign.plan")}.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Campaign name</Label>
                <Input
                  id="c-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Spring product launch"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Objective</Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OBJECTIVES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-brief">Brief</Label>
              <Textarea
                id="c-brief"
                rows={3}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="What are we promoting, what matters, what should people feel or do?"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-aud">Audience</Label>
                <Input
                  id="c-aud"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Small agency owners"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-tone">Tone</Label>
                <Input id="c-tone" value={tone} onChange={(e) => setTone(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-days">Duration (days)</Label>
                <Input
                  id="c-days"
                  type="number"
                  min={3}
                  max={90}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value) || 14)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-week">Posts per week</Label>
                <Input
                  id="c-week"
                  type="number"
                  min={1}
                  max={21}
                  value={perWeek}
                  onChange={(e) => setPerWeek(Number(e.target.value) || 4)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {available.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePlatform(id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      chosen.includes(id)
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border/60 text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <PlatformIcon platform={id} className="h-3.5 w-3.5" />
                    <span className="capitalize">{id}</span>
                  </button>
                ))}
              </div>
            </div>

            {result && (
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">Content pillars</span>
                  {result.themes.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  {result.posts.map((p, i) => (
                    <div key={i} className="rounded-lg border border-border/50 bg-background/60 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <PlatformIcon platform={p.platform} className="h-3.5 w-3.5" />
                        <span>Day {p.day}</span>
                        <span>·</span>
                        <span className="capitalize">{p.format}</span>
                      </div>
                      <p className="text-sm font-medium">{p.hook}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {p.caption}
                      </p>
                      {p.hashtags.length > 0 && (
                        <p className="mt-1.5 text-xs text-primary/80">
                          {p.hashtags.map((h) => `#${h}`).join(" ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handlePlan} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-1.5 h-4 w-4" />
            )}
            {result ? "Regenerate plan" : "Generate plan"}
          </Button>
          <Button variant="secondary" onClick={() => handleSave(false)} disabled={!name.trim()}>
            Save as draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={!name.trim() || !result}>
            <CalendarPlus className="mr-1.5 h-4 w-4" /> Launch &amp; queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
