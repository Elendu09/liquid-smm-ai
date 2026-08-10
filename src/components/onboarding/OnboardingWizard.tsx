import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

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
  X,
  Check,
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

// Buffer-style connect order + subtype hints (Step 2).
const CONNECT_ORDER = [
  "instagram", "threads", "linkedin", "facebook", "bluesky",
  "youtube", "tiktok", "pinterest", "twitter", "google-business",
  "snapchat", "reddit", "telegram", "discord", "whatsapp",
];
const CONNECT_HINTS: Record<string, string> = {
  instagram: "Business, Creator, or Personal",
  facebook: "Page or Group",
  linkedin: "Page or Profile",
  youtube: "Channel",
  tiktok: "Profile",
  threads: "Profile",
  bluesky: "Profile",
  mastodon: "Profile",
  pinterest: "Profile",
  twitter: "Profile",
  "google-business": "Location",
  snapchat: "Profile",
  reddit: "Profile",
  telegram: "Channel or Group",
  discord: "Server",
  whatsapp: "Business number",
};


const AUTONOMY: { value: Autonomy; label: string; desc: string }[] = [
  { value: "manual", label: "Manual", desc: "I approve every action." },
  { value: "suggest", label: "Suggest", desc: "AI drafts; I approve before publish." },
  { value: "auto-approval", label: "Auto with approval", desc: "AI queues; I review batch in Activity." },
];

const STEP_META = [
  { icon: Sparkles, title: "Welcome", short: "Welcome" },
  { icon: Users, title: "Connect accounts", short: "Connect" },
  { icon: Target, title: "Niches", short: "Niches" },
  { icon: Rocket, title: "Goals", short: "Goals" },
  { icon: Palette, title: "Brand voice", short: "Voice" },
  { icon: Clock, title: "Cadence", short: "Cadence" },
  { icon: Bot, title: "AI autonomy", short: "AI" },
  { icon: CheckCircle2, title: "Finish", short: "Finish" },
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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  const totalSteps = STEP_META.length;

  const commit = (patch: Partial<OnboardingProfile>) => {
    const nextDraft = { ...draft, ...patch };
    setDraft(nextDraft);
    updateProfile(patch);
  };

  const toggle = (key: keyof OnboardingProfile, value: string) => {
    const arr = (draft[key] as string[]) ?? [];
    const nextArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    commit({ [key]: nextArr } as Partial<OnboardingProfile>);
  };

  const stepValid = (i: number, d = draft): boolean => {
    switch (i) {
      case 0: return d.name.trim().length > 0 && !!d.role;
      case 1: return d.connectedPlatformIds.length > 0;
      case 2: return d.niches.length > 0;
      case 3: return d.goals.length > 0;
      case 4: return !!d.tone;
      case 5: return d.postsPerWeek >= 1 && d.preferredTimes.length > 0;
      case 6: return !!d.autonomy;
      case 7: return true;
      default: return true;
    }
  };
  const stepHint = (i: number): string => {
    switch (i) {
      case 0: return "Enter your name and pick a role to continue.";
      case 1: return "Select at least one platform (or skip the tour).";
      case 2: return "Pick at least one niche.";
      case 3: return "Choose at least one goal.";
      case 4: return "Pick a brand tone.";
      case 5: return "Choose at least one preferred posting time.";
      case 6: return "Pick an autonomy level.";
      default: return "";
    }
  };

  const canProceed = stepValid(step);
  const goNext = () => { if (canProceed) setStep((s) => Math.min(s + 1, totalSteps - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const finish = () => {
    complete();
    onOpenChange(false);
  };



  if (!open) return null;

  const bodies: React.ReactNode[] = [
    // 0 — Welcome
    <div key="0" className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="ob-name">Your name</Label>
        <Input id="ob-name" value={draft.name} onChange={(e) => commit({ name: e.target.value })} placeholder="e.g. Alex" />
        {draft.name && (
          <p className="text-[11px] text-muted-foreground">Prefilled from your account — edit anytime.</p>
        )}
      </div>
      <div className="space-y-3">
        <Label>You are…</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => commit({ role: r.value })}
              className={cn(
                "text-left rounded-xl border p-4 hover:border-primary transition-colors",
                draft.role === r.value ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <div className="text-sm font-semibold">{r.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    // 1 — Connect (Buffer-style channel picker)
    <div key="1" className="space-y-4">
      <div className="max-h-[520px] overflow-y-auto pr-1 -mr-1 [mask-image:linear-gradient(180deg,#000_0,#000_calc(100%-32px),transparent)]">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CONNECT_ORDER.map((pid) => {
            const p = platforms.find((x) => x.id === pid);
            if (!p) return null;
            const active = draft.connectedPlatformIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle("connectedPlatformIds", p.id)}
                aria-pressed={active}
                className={cn(
                  "group relative flex flex-col items-center justify-start gap-2.5 rounded-2xl border bg-card/70 backdrop-blur p-4 sm:p-5 text-center transition-all",
                  "hover:border-primary/60 hover:bg-card hover:shadow-md",
                  active
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-border/70",
                )}
              >
                {active && (
                  <span
                    className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                    aria-hidden
                  >
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <PlatformIcon platform={p.id} size="lg" showBackground />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {CONNECT_HINTS[p.id] ?? "Profile"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{draft.connectedPlatformIds.length} selected</span>
        <span>You can add real accounts later from Settings → Connected.</span>
      </div>
    </div>,

    // 2 — Niches
    <div key="2" className="flex flex-wrap gap-2">
      {NICHES.map((n) => {
        const active = draft.niches.includes(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => toggle("niches", n)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm transition-colors",
              active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
            )}
          >
            {n}
          </button>
        );
      })}
    </div>,
    // 3 — Goals
    <div key="3" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {GOALS.map((g) => {
        const active = draft.goals.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle("goals", g.id)}
            className={cn(
              "text-left rounded-xl border p-4 transition-colors",
              active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            )}
          >
            <div className="text-sm font-semibold">{g.label}</div>
          </button>
        );
      })}
    </div>,
    // 4 — Tone
    <div key="4" className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {TONES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => commit({ tone: t.value })}
            className={cn(
              "rounded-xl border p-3 text-sm font-medium transition-colors",
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
          rows={4}
        />
      </div>
    </div>,
    // 5 — Cadence
    <div key="5" className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Posts per week</Label>
          <span className="text-2xl font-semibold">{draft.postsPerWeek}</span>
        </div>
        <Slider min={1} max={30} step={1} value={[draft.postsPerWeek]} onValueChange={(v) => commit({ postsPerWeek: v[0] })} />
      </div>
      <div className="space-y-3">
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
                  "rounded-full border px-3.5 py-2 text-sm transition-colors",
                  active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    // 6 — Autonomy
    <div key="6" className="space-y-2.5">
      {AUTONOMY.map((a) => (
        <button
          key={a.value}
          type="button"
          onClick={() => commit({ autonomy: a.value })}
          className={cn(
            "w-full text-left rounded-xl border p-4 transition-colors",
            draft.autonomy === a.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          )}
        >
          <div className="text-sm font-semibold">{a.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{a.desc}</div>
        </button>
      ))}
    </div>,
    // 7 — Finish
    <div key="7" className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="text-sm font-medium mb-2">Your setup</div>
        <div className="flex flex-wrap gap-1.5">
          {draft.role && <Badge variant="secondary">{draft.role}</Badge>}
          {draft.tone && <Badge variant="secondary">{draft.tone} tone</Badge>}
          <Badge variant="secondary">{draft.postsPerWeek}/week</Badge>
          <Badge variant="secondary">{draft.autonomy}</Badge>
          {draft.niches.slice(0, 5).map((n) => (
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
    </div>,
  ];

  const current = STEP_META[step];
  const Icon = current.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour"
      className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-200"
    >
      {/* Top bar — identical chrome on mobile, tablet & desktop:
          the dot/pill progress style everywhere (no per-mode variants) */}
      <header
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col items-center">
            {/* Dot / pill progress — same sizes on every screen */}
            <div
              className="flex items-center gap-1.5 max-w-full"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-valuenow={step + 1}
              aria-label={`Step ${step + 1} of ${totalSteps}`}
            >
              {STEP_META.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}: ${s.title}`}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "touch-skip h-1.5 rounded-full transition-all duration-300 ease-out",
                      active
                        ? "w-7 bg-primary"
                        : done
                          ? "w-1.5 bg-primary/70 hover:bg-primary"
                          : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40",
                    )}
                  />
                );
              })}
            </div>
            <div className="mt-1.5 text-[11px] text-muted-foreground truncate max-w-full">
              Step {step + 1} of {totalSteps} · {current.title}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="h-9 w-9 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Body — one identical centered column on mobile, tablet & desktop.
          Step navigation lives in the dot progress in the header everywhere. */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-5 sm:py-6">
          {/* Content */}
          <section className="min-w-0 mx-auto w-full max-w-2xl">
            {/* Step heading — compact dot-era chrome, same size on all screens */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight truncate">{current.title}</h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5 sm:mb-8">
              {step === 0 && "Let's tailor the app to how you work. Takes about a minute."}
              {step === 1 && "Pick the platforms you'll use — connect the details later."}
              {step === 2 && "Helps AI tailor captions, hashtags, and ideas to your audience."}
              {step === 3 && "We'll surface KPIs and tools that move these needles."}
              {step === 4 && "Seeds default tone in Caption Generator and AI Studio."}
              {step === 5 && "Sets Scheduler defaults. You can override anytime."}
              {step === 6 && "How much freedom should the AI assistant get?"}
              {step === 7 && "Complete these to unlock the full experience."}
            </p>
            <div className="max-w-2xl">{bodies[step]}</div>
          </section>
        </div>
        {/* Bottom spacer so content isn't hidden behind sticky footer on mobile */}
        <div className="h-4 sm:h-6" aria-hidden />
      </div>

      {/* Footer nav */}
      <footer
        className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="flex-shrink-0">
                Skip
              </Button>
            )}
            {!canProceed && step < totalSteps - 1 && (
              <span className="text-[11px] text-muted-foreground truncate">{stepHint(step)}</span>
            )}
          </div>
          <div className="flex gap-2 justify-end flex-shrink-0">
            <Button variant="outline" size="sm" onClick={back} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            {step < totalSteps - 1 ? (
              <Button size="sm" onClick={goNext} disabled={!canProceed}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={finish}>
                Finish <CheckCircle2 className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

