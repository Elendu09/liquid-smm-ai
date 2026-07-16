import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter", "facebook", "linkedin"];

const NICHE_OPTIONS = [
  "Fitness & wellness",
  "SaaS & tech",
  "Fashion & beauty",
  "Food & drink",
  "Travel",
  "Finance",
  "Education",
  "Gaming",
  "Music",
  "Art & design",
] as const;

const FOLLOWER_BUCKETS = [
  { id: "any", label: "Any size" },
  { id: "1k", label: "< 1k" },
  { id: "10k", label: "1k – 10k" },
  { id: "100k", label: "10k – 100k" },
  { id: "1m", label: "100k+" },
] as const;

const ENGAGEMENT_BUCKETS = [
  { id: "any", label: "Any" },
  { id: "low", label: "Low (< 2%)" },
  { id: "mid", label: "Mid (2 – 5%)" },
  { id: "high", label: "High (5%+)" },
] as const;

export interface NewSegmentInput {
  title: string;
  description: string;
  niche?: string;
  platforms: string[];
  followerBucket: (typeof FOLLOWER_BUCKETS)[number]["id"];
  engagementBucket: (typeof ENGAGEMENT_BUCKETS)[number]["id"];
  keywords: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (v: NewSegmentInput) => void;
}

export function NewSegmentDialog({ open, onOpenChange, onCreate }: Props) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [niche, setNiche] = useState<string | undefined>();
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [followerBucket, setFollowerBucket] = useState<NewSegmentInput["followerBucket"]>("any");
  const [engagementBucket, setEngagementBucket] = useState<NewSegmentInput["engagementBucket"]>("any");
  const [keywords, setKeywords] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(1); setTitle(""); setDescription(""); setNiche(undefined);
    setPlatforms([]); setFollowerBucket("any"); setEngagementBucket("any"); setKeywords("");
  }, [open]);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const submit = () => {
    onCreate({
      title: title.trim() || "New segment",
      description: description.trim(),
      niche,
      platforms,
      followerBucket,
      engagementBucket,
      keywords: keywords.split(/\s+/).filter(Boolean),
    });
    onOpenChange(false);
  };

  const canNext = step === 1 ? title.trim().length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> New segment · step {step} / 3
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Name your segment so it's easy to find later."}
            {step === 2 && "Pick niche and platforms."}
            {step === 3 && "Filter by follower size, engagement, and keywords."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <Label className="text-xs">Segment name</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Micro fitness creators" autoFocus />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Who is this segment for?" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label className="text-xs">Niche</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {NICHE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNiche(niche === n ? undefined : n)}
                      aria-pressed={niche === n}
                      className={cn(
                        "px-2.5 h-8 rounded-md border text-xs",
                        niche === n
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Platforms</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {PLATFORMS.map((p) => {
                    const active = platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        aria-pressed={active}
                        className={cn(
                          "px-2.5 h-9 rounded-md border flex items-center gap-1.5 text-xs capitalize",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <PlatformIcon platform={p} size="xs" />
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <Label className="text-xs">Follower range</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {FOLLOWER_BUCKETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setFollowerBucket(b.id)}
                      aria-pressed={followerBucket === b.id}
                      className={cn(
                        "px-2.5 h-8 rounded-md border text-xs",
                        followerBucket === b.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Engagement</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ENGAGEMENT_BUCKETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setEngagementBucket(b.id)}
                      aria-pressed={engagementBucket === b.id}
                      className={cn(
                        "px-2.5 h-8 rounded-md border text-xs",
                        engagementBucket === b.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Keywords</Label>
                <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="fitness wellness workout" />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {step > 1 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step < 3 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button onClick={submit}>Create segment</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
