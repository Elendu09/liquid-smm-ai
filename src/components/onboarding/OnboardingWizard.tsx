import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Rocket,
  Target,
  Palette,
  CalendarClock,
  Bot,
  CircleCheck,
  ArrowLeft,
  ArrowRight,
  X,
  Plug,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useOnboarding, type OnboardingProfile } from "@/hooks/useOnboarding";
import { useAccounts } from "@/contexts/AccountContext";
import { platforms } from "@/config/platforms";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { ConnectAccountDialog } from "@/components/accounts/ConnectAccountDialog";
import { cn } from "@/lib/utils";

const NICHES = [
  "Fashion", "Fitness", "SaaS", "Food", "Travel", "Beauty",
  "Gaming", "Finance", "Education", "B2B", "Local business", "Lifestyle",
];
const GOALS = [
  { id: "growth", label: "Grow followers", icon: "📈" },
  { id: "sales", label: "Drive sales", icon: "💰" },
  { id: "community", label: "Build community", icon: "🤝" },
  { id: "time", label: "Save time", icon: "⏱️" },
];
const TIMES = ["Early morning", "Morning", "Noon", "Afternoon", "Evening", "Late night"];

const STEPS = [
  { id: 0, title: "Welcome", icon: Sparkles },
  { id: 1, title: "Connect accounts", icon: Plug },
  { id: 2, title: "Your niche", icon: Target },
  { id: 3, title: "Goals", icon: Rocket },
  { id: 4, title: "Brand voice", icon: Palette },
  { id: 5, title: "Cadence", icon: CalendarClock },
  { id: 6, title: "AI autonomy", icon: Bot },
  { id: 7, title: "You're set", icon: CircleCheck },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingWizard({ open, onOpenChange }: Props) {
  const { state, updateProfile, setStep, complete } = useOnboarding();
  const { totalAccounts } = useAccounts();
  const [connectOpen, setConnectOpen] = useState(false);
  const step = state.step;
  const profile = state.profile;
  const StepIcon = STEPS[step].icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  const toggle = (key: keyof OnboardingProfile, value: string) => {
    const arr = (profile[key] as string[]) ?? [];
    updateProfile({
      [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    } as Partial<OnboardingProfile>);
  };

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());
  const back = () => step > 0 && setStep(step - 1);
  const skip = () => {
    complete();
    onOpenChange(false);
    toast.success("You can revisit the tour any time from Settings.");
  };
  const finish = () => {
    complete();
    onOpenChange(false);
    toast.success("You're all set — start building your first post ✨");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-border bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <StepIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Step {step + 1} of {STEPS.length}
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold">{STEPS[step].title}</h2>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={skip} aria-label="Skip onboarding">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 max-h-[55vh] overflow-y-auto space-y-4">
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Welcome! Let's get your workspace tailored to you in under a minute.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your name</label>
                  <Input
                    placeholder="e.g. Alex"
                    value={profile.name}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">I'm a…</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["creator", "agency", "brand", "ecom"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => updateProfile({ role: r })}
                        className={cn(
                          "p-3 rounded-xl border text-sm text-left transition-all",
                          profile.role === r
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <div className="font-semibold capitalize">{r === "ecom" ? "E-commerce" : r}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {r === "creator" && "Solo content, personal brand"}
                          {r === "agency" && "Managing client accounts"}
                          {r === "brand" && "Business or product marketing"}
                          {r === "ecom" && "Selling online, driving traffic"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect the platforms you post on. You can skip and add them later.
                </p>
                <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
                  <span className="text-sm">
                    <strong>{totalAccounts}</strong> account{totalAccounts === 1 ? "" : "s"} connected
                  </span>
                  <Button size="sm" onClick={() => setConnectOpen(true)}>
                    <Plug className="mr-1.5 h-3.5 w-3.5" /> Connect
                  </Button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {platforms.slice(0, 12).map((p) => (
                    <div
                      key={p.id}
                      className="aspect-square rounded-lg border border-border bg-card flex items-center justify-center opacity-70"
                      title={p.name}
                    >
                      <PlatformIcon platform={p.id} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Pick the niches that match your content.</p>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((n) => (
                    <Badge
                      key={n}
                      variant={profile.niches.includes(n) ? "default" : "outline"}
                      className="cursor-pointer py-1.5 px-3"
                      onClick={() => toggle("niches", n)}
                    >
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">What outcomes matter most?</p>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => toggle("goals", g.id)}
                      className={cn(
                        "p-3 rounded-xl border text-sm text-left transition-all",
                        profile.goals.includes(g.id)
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="text-2xl mb-1">{g.icon}</div>
                      <div className="font-semibold">{g.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {(["playful", "professional", "bold", "minimal"] as const).map((t) => (
                      <Badge
                        key={t}
                        variant={profile.tone === t ? "default" : "outline"}
                        className="cursor-pointer py-1.5 px-3 capitalize"
                        onClick={() => updateProfile({ tone: t })}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Describe your brand</label>
                  <Textarea
                    rows={3}
                    placeholder="e.g. Sustainable athleisure for city commuters"
                    value={profile.brandDescription}
                    onChange={(e) => updateProfile({ brandDescription: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Posts per week</label>
                    <span className="text-lg font-bold">{profile.cadencePerWeek}</span>
                  </div>
                  <Slider
                    min={1}
                    max={21}
                    step={1}
                    value={[profile.cadencePerWeek]}
                    onValueChange={([v]) => updateProfile({ cadencePerWeek: v })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferred times</label>
                  <div className="flex flex-wrap gap-2">
                    {TIMES.map((t) => (
                      <Badge
                        key={t}
                        variant={profile.preferredTimes.includes(t) ? "default" : "outline"}
                        className="cursor-pointer py-1.5 px-3"
                        onClick={() => toggle("preferredTimes", t)}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">How autonomous should the AI be?</p>
                {([
                  { id: "manual", title: "Manual", desc: "I do everything, AI only helps when asked." },
                  { id: "suggest", title: "Suggest", desc: "AI proposes drafts; I approve before publishing." },
                  { id: "auto", title: "Auto with approval", desc: "AI queues actions automatically, I approve in the inbox." },
                ] as const).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => updateProfile({ autonomy: o.id })}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left transition-all",
                      profile.autonomy === o.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="font-semibold text-sm">{o.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{o.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CircleCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">You're set{profile.name ? `, ${profile.name}` : ""}!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your workspace is tailored to <strong>{profile.tone || "your"}</strong> tone
                    {profile.niches.length ? `, ${profile.niches.slice(0, 2).join(" & ")}` : ""}, and
                    ~{profile.cadencePerWeek} posts/week.
                  </p>
                </div>
                <div className="text-left p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Next up</p>
                  <ul className="text-sm space-y-1.5">
                    <li>• Try the AI command bar on your dashboard.</li>
                    <li>• Draft your first caption in the Create hub.</li>
                    <li>• Schedule a post to see it in the queue.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-border flex items-center justify-between gap-2 bg-muted/20">
            <Button variant="ghost" size="sm" onClick={back} disabled={step === 0}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={skip}>
                Skip
              </Button>
              <Button size="sm" onClick={next}>
                {step === STEPS.length - 1 ? "Finish" : "Next"}
                {step !== STEPS.length - 1 && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </>
  );
}
