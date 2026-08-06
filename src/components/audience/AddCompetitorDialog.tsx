import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  "Instagram", "TikTok", "YouTube", "Twitter", "LinkedIn", "Facebook",
  "GitHub", "Threads", "Pinterest", "Reddit", "Snapchat",
];

export interface NewCompetitorInput {
  username: string;
  platform: string;
  notes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (v: NewCompetitorInput) => void;
}

export function AddCompetitorDialog({ open, onOpenChange, onAdd }: Props) {
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) { setUsername(""); setPlatform("Instagram"); setNotes(""); }
  }, [open]);

  const submit = () => {
    if (!username.trim()) return;
    // GitHub/Reddit handles are bare; social handles carry the @ prefix.
    const needsAt = !["GitHub", "Reddit", "Pinterest"].includes(platform);
    const uname = needsAt && !username.startsWith("@") ? `@${username}` : username.trim();
    onAdd({ username: uname, platform, notes: notes.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Add competitor
          </DialogTitle>
          <DialogDescription>Track a new account's followers, engagement, and cadence.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="@competitor"
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
                    "px-2.5 h-9 rounded-md border flex items-center gap-1.5 text-xs",
                    platform === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:bg-muted",
                  )}
                >
                  <PlatformIcon platform={p.toLowerCase()} size="xs" />
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Why track this competitor?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!username.trim()}>
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Track
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
