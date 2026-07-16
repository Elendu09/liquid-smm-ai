import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { platforms } from "@/config/platforms";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useOnboarding, type OnboardingProfile, type Autonomy } from "@/hooks/useOnboarding";
import {
  Sparkles,
  Rocket,
  Target,
  Palette,
  Clock,
  Bot,
  CheckCircle2,
  Users,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const ROLES: { value: OnboardingProfile["role"]; label: string; desc: string }[] = [
  { value: "creator", label: "Creator", desc: "Personal brand / influencer" },
  { value: "agency", label: "Agency", desc: "Multiple client accounts" },
  { value: "brand", label: "Brand", desc: "Company social presence" },
  { value: "ecom", label: "Ecommerce", desc: "Product / shop marketing" },
];

const NICHES = [
  "Fashion", "Fitness", "SaaS", "Food", "Travel", "Beauty",
  "Gaming", "Finance", "Education", "B2B", "Local business",
];

const GOALS = [
  { id: "grow", label: "Grow followers" },
  { id: "sales", label: "Drive sales" },
  { id: "community", label: "Build community" },
  { id: "time", label: "Save time" },
];

const TONES: { value: OnboardingProfile["tone"]; label: string }[] = [
  { value: "playful", label: "Playful" },
  { value: "professional", label: "Professional" },
  { value: "bold", label: "Bold" },
  { value: "minimal", label: "Minimal" },
];

const TIMES = ["Early morning", "Morning", "Midday", "Afternoon", "Evening", "Late night"];

const AUTONOMY: { value: Autonomy; label: string; desc: string }[] = [
  { value: "manual", label: "Manual", desc: "I approve every action." },
  { value: "suggest", label: "Suggest", desc: "AI drafts; I approve before publish." },
  { value: "auto-approval", label: "Auto with approval", desc: "AI queues; I review batch in Activity." },
];

export function OnboardingWizard({ open, onOpenChange }: Props) {
  const { state, updateProfile, complete } = useOnboarding();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingProfile>(state.profile);

  useEffect(() => {
    if (open) {
      setDraft(state.profile);
      setStep(0);
    }
  }, [open]);

  const totalSteps = 8;
  const progress = ((step + 1) / totalSteps) * 100;

  const commit = (patch: Partial<OnboardingProfile>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    updateProfile(patch);
  };

  const toggle = (key: keyof OnboardingProfile, value: string) => {
    const arr = (draft[key] as string[]) ?? [];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    commit({ [key]: next } as Partial<OnboardingProfile>);
  };

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const finish = () => {
    complete();
    onOpenChange(false);
  };

  const steps = [
    // 0 — Welcome
    {
      icon: Sparkles,
      title: "Welcome to SMM Pilot",
      description: "Let's tailor the app to how you work. Takes about a minute.",
      body: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ob-name">Your name</Label>
            <Input id="ob-name" value={draft.name} onChange={(e) => commit({ name: e.target.value })} placeholder="e.g. Alex" />
          </div>
          <div className="space-y-2">
            <Label>You are…</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => commit({ role: r.value })}
                  className={cn(
                    "text-left rounded-lg border p-3 hover:border-primary transition-colors",
                    draft.role === r.value ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // 1 — Connect accounts
    {
      icon: Users,
      title: "Connect your accounts",
      description: "Pick the platforms you'll use — connect the details later.",
      body: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => {
              const active = draft.connectedPlatformIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle("connectedPlatformIds", p.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                  )}
                >
                  <PlatformIcon platform={p.id} size="xs" />
                  {p.shortName}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            You can skip and connect real accounts anytime from Settings → Connected.
          </p>
        </div>
      ),
    },
    // 2 — Niche
    {
      icon: Target,
      title: "What niches?",
      description: "Helps AI tailor captions, hashtags, and ideas to your audience.",
      body: (
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => {
            const active = draft.niches.includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggle("niches", n)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      ),
    },
    // 3 — Goals
    {
      icon: Rocket,
      title: "Your goals",
      description: "We'll surface KPIs and tools that move these needles.",
      body: (
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => {
            const active = draft.goals.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle("goals", g.id)}
                className={cn(
                  "text-left rounded-lg border p-3 transition-colors",
                  active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
              >
                <div className="text-sm font-medium">{g.label}</div>
              </button>
            );
          })}
        </div>
      ),
    },
    // 4 — Tone
    {
      icon: Palette,
      title: "Brand voice",
      description: "Seeds default tone in Caption Generator and AI Studio.",
      body: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => commit({ tone: t.value })}
                className={cn(
                  "rounded-lg border p-3 text-sm font-medium transition-colors",
                  draft.tone === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-brand">Describe your brand (optional)</Label>
            <Textarea
              id="ob-brand"
              value={draft.brandDescription}
              onChange={(e) => commit({ brandDescription: e.target.value })}
              placeholder="e.g. Sustainable athleisure for busy parents, warm and encouraging."
              rows={3}
            />
          </div>
        </div>
      ),
    },
    // 5 — Cadence
    {
      icon: Clock,
      title: "Posting cadence",
      description: "Sets Scheduler defaults. You can override anytime.",
      body: (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Posts per week</Label>
              <span className="text-lg font-semibold">{draft.postsPerWeek}</span>
            </div>
            <Slider
              min={1}
              max={30}
              step={1}
              value={[draft.postsPerWeek]}
              onValueChange={(v) => commit({ postsPerWeek: v[0] })}
            />
          </div>
          <div className="space-y-2">
            <Label>Preferred posting times</Label>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((t) => {
                const active = draft.preferredTimes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggle("preferredTimes", t)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },
    // 6 — AI autonomy
    {
      icon: Bot,
      title: "AI autonomy",
      description: "How much freedom should the AI assistant get?",
      body: (
        <div className="space-y-2">
          {AUTONOMY.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => commit({ autonomy: a.value })}
              className={cn(
                "w-full text-left rounded-lg border p-3 transition-colors",
                draft.autonomy === a.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              )}
            >
              <div className="text-sm font-medium">{a.label}</div>
              <div className="text-xs text-muted-foreground">{a.desc}</div>
            </button>
          ))}
        </div>
      ),
    },
    // 7 — Finish
    {
      icon: CheckCircle2,
      title: "You're all set",
      description: "Complete these to unlock the full experience.",
      body: (
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <div className="text-sm font-medium mb-1">Your setup</div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {draft.role && <Badge variant="secondary">{draft.role}</Badge>}
              {draft.tone && <Badge variant="secondary">{draft.tone} tone</Badge>}
              <Badge variant="secondary">{draft.postsPerWeek}/week</Badge>
              <Badge variant="secondary">{draft.autonomy}</Badge>
              {draft.niches.slice(0, 3).map((n) => (
                <Badge key={n} variant="outline">{n}</Badge>
              ))}
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <Link to="/dashboard/settings/connected" className="hover:underline" onClick={() => onOpenChange(false)}>
                Connect your first account
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <Link to="/dashboard/library/captions" className="hover:underline" onClick={() => onOpenChange(false)}>
                Save your first caption
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <Link to="/dashboard/publish/queue" className="hover:underline" onClick={() => onOpenChange(false)}>
                Schedule your first post
              </Link>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Step {step + 1} of {totalSteps}</span>
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
          <Progress value={progress} className="h-1 mt-2" />
        </DialogHeader>
        <div className="py-2">{current.body}</div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Skip for now
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={back}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            {step < totalSteps - 1 ? (
              <Button size="sm" onClick={next}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={finish}>
                Finish <CheckCircle2 className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
