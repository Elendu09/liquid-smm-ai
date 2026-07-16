import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { Sparkles, Loader2, Users, Ghost, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnalysisResult {
  username: string;
  platform: string;
  totalFollowers: string;
  qualityScore: number;
  ghostPercent: number;
  weeklyGrowth: string;
  avgEngagement: string;
  activePercent: number;
  peakHour: string;
}

const PLATFORMS = ["instagram", "tiktok", "twitter", "youtube", "facebook", "linkedin"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApply: (result: AnalysisResult) => void;
}

export function AnalyzeAccountDialog({ open, onOpenChange, onApply }: Props) {
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [phase, setPhase] = useState<"input" | "running" | "done">("input");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (open) {
      setPhase("input");
      setProgress(0);
      setResult(null);
      setUsername("");
    }
  }, [open]);

  const run = () => {
    if (!username.trim()) return;
    setPhase("running");
    setProgress(0);
    const stages = [15, 38, 62, 84, 100];
    let i = 0;
    const tick = setInterval(() => {
      setProgress(stages[i]);
      i += 1;
      if (i >= stages.length) {
        clearInterval(tick);
        const seed = username.length + platform.length;
        const total = 5_000 + ((seed * 977) % 250_000);
        const quality = 55 + (seed * 7) % 40;
        const ghost = 2 + (seed * 3) % 12;
        const growth = (0.5 + (seed % 40) / 10).toFixed(1);
        const engagement = (2 + (seed % 60) / 10).toFixed(1);
        const active = 60 + (seed * 5) % 35;
        const hours = ["9AM", "12PM", "6PM", "8PM", "9PM", "10PM"];
        const r: AnalysisResult = {
          username: username.startsWith("@") ? username : `@${username}`,
          platform,
          totalFollowers: total >= 1000 ? `${(total / 1000).toFixed(1)}K` : `${total}`,
          qualityScore: quality,
          ghostPercent: ghost,
          weeklyGrowth: `+${growth}%`,
          avgEngagement: `${engagement}%`,
          activePercent: active,
          peakHour: hours[seed % hours.length],
        };
        setResult(r);
        setPhase("done");
      }
    }, 380);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Analyze account
          </DialogTitle>
          <DialogDescription>Run a follower quality scan on any public account.</DialogDescription>
        </DialogHeader>

        {phase === "input" && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder="@yourhandle"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs">Platform</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    aria-pressed={platform === p}
                    className={cn(
                      "px-2.5 h-9 rounded-md border flex items-center gap-1.5 text-xs capitalize",
                      platform === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <PlatformIcon platform={p} size="xs" />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === "running" && (
          <div className="py-8 space-y-4 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
            <div>
              <p className="text-sm font-medium">Analyzing {username}</p>
              <p className="text-xs text-muted-foreground">Sampling followers, engagement, and activity…</p>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {phase === "done" && result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-brand-cyan/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{result.username}</p>
                <Badge variant="outline" className="text-[10px] capitalize">{result.platform}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Followers" value={result.totalFollowers} icon={Users} tone="text-primary" />
              <Stat label="Quality" value={`${result.qualityScore}/100`} icon={Star} tone="text-brand-green" />
              <Stat label="Ghost" value={`${result.ghostPercent}%`} icon={Ghost} tone="text-destructive" />
              <Stat label="Growth /wk" value={result.weeklyGrowth} icon={TrendingUp} tone="text-brand-green" />
              <Stat label="Engagement" value={result.avgEngagement} icon={TrendingUp} tone="text-brand-purple" />
              <Stat label="Peak hour" value={result.peakHour} icon={TrendingUp} tone="text-brand-cyan" />
            </div>
          </div>
        )}

        <DialogFooter>
          {phase === "input" && (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={run} disabled={!username.trim()}>
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Analyze
              </Button>
            </>
          )}
          {phase === "running" && (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}
          {phase === "done" && result && (
            <>
              <Button variant="ghost" onClick={() => setPhase("input")}>Analyze another</Button>
              <Button onClick={() => { onApply(result); onOpenChange(false); }}>Apply to dashboard</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Users; tone: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
      <Icon className={`h-3.5 w-3.5 mb-1 ${tone}`} />
      <p className={`text-sm font-bold ${tone}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
