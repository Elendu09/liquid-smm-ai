import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, ArrowUp, ArrowDown, Minus } from "lucide-react";

export interface CompareStats {
  username: string;
  followers: number;
  engagement: number;
  avgLikes: number;
  avgComments: number;
  postingFreq: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  you: CompareStats;
  competitor: CompareStats | null;
}

function delta(you: number, them: number): { pct: number; dir: "up" | "down" | "flat" } {
  if (them === 0) return { pct: 0, dir: "flat" };
  const pct = ((you - them) / them) * 100;
  const dir = pct > 1 ? "up" : pct < -1 ? "down" : "flat";
  return { pct: Math.abs(pct), dir };
}

function DeltaBadge({ d }: { d: ReturnType<typeof delta> }) {
  const Icon = d.dir === "up" ? ArrowUp : d.dir === "down" ? ArrowDown : Minus;
  const tone = d.dir === "up" ? "text-brand-green border-brand-green/30 bg-brand-green/10"
    : d.dir === "down" ? "text-destructive border-destructive/30 bg-destructive/10"
    : "text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={`text-[10px] ${tone}`}>
      <Icon className="h-3 w-3 mr-0.5" /> {d.pct.toFixed(1)}%
    </Badge>
  );
}

export function CompareCompetitorDialog({ open, onOpenChange, you, competitor }: Props) {
  if (!competitor) return null;
  const max = (k: keyof CompareStats) => Math.max(Number(you[k]) || 0, Number(competitor[k]) || 0);
  const rows: { label: string; key: keyof CompareStats; format: (v: number) => string }[] = [
    { label: "Followers", key: "followers", format: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`) },
    { label: "Engagement", key: "engagement", format: (v) => `${v}%` },
    { label: "Avg likes", key: "avgLikes", format: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`) },
    { label: "Avg comments", key: "avgComments", format: (v) => `${v}` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> You vs {competitor.username}
          </DialogTitle>
          <DialogDescription>Side-by-side snapshot across the core metrics.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {rows.map((r) => {
            const youVal = Number(you[r.key]);
            const themVal = Number(competitor[r.key]);
            const m = max(r.key) || 1;
            const d = delta(youVal, themVal);
            return (
              <div key={r.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{r.label}</span>
                  <DeltaBadge d={d} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 text-[11px] text-muted-foreground">You</span>
                  <Progress value={(youVal / m) * 100} className="flex-1 h-2" />
                  <span className="w-16 text-[11px] text-right font-medium">{r.format(youVal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 text-[11px] text-muted-foreground truncate">{competitor.username}</span>
                  <Progress value={(themVal / m) * 100} className="flex-1 h-2" />
                  <span className="w-16 text-[11px] text-right font-medium">{r.format(themVal)}</span>
                </div>
              </div>
            );
          })}

          <div className="rounded-md border border-border/60 p-3 bg-muted/30 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">You post</p>
              <p className="text-sm font-semibold">{you.postingFreq}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">{competitor.username} posts</p>
              <p className="text-sm font-semibold">{competitor.postingFreq}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
