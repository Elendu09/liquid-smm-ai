import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { UserMinus, Shield, Star, Clock, TrendingUp, Ghost } from "lucide-react";
import { toast } from "sonner";

export interface FollowerDetail {
  id: number;
  username: string;
  avatar: string;
  followers?: string;
  engagement?: string;
  quality?: "high" | "medium" | "low";
  lastActive?: string;
  posts?: number;
  unfollowedAt?: string;
  wasFollowing?: boolean;
  kind: "top" | "ghost" | "unfollower";
}

interface Props {
  follower: FollowerDetail | null;
  onClose: () => void;
  onRemove?: (id: number) => void;
}

export function FollowerDetailsDrawer({ follower, onClose, onRemove }: Props) {
  return (
    <Sheet open={!!follower} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {follower && (
          <>
            <SheetHeader>
              <SheetTitle>{follower.username}</SheetTitle>
              <SheetDescription>
                {follower.kind === "top" && "Top follower · sampled last 30 days"}
                {follower.kind === "ghost" && "Ghost follower · inactive"}
                {follower.kind === "unfollower" && "Recently unfollowed"}
              </SheetDescription>
            </SheetHeader>

            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-green to-brand-cyan flex items-center justify-center text-white text-lg font-bold">
                  {follower.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{follower.username}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {follower.quality && (
                      <Badge className={
                        follower.quality === "high"
                          ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                          : follower.quality === "medium"
                            ? "bg-brand-orange/10 text-brand-orange border-brand-orange/30"
                            : "bg-destructive/10 text-destructive border-destructive/30"
                      }>
                        <Star className="h-3 w-3 mr-1" /> {follower.quality}
                      </Badge>
                    )}
                    {follower.kind === "ghost" && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                        <Ghost className="h-3 w-3 mr-1" /> Ghost
                      </Badge>
                    )}
                    {follower.wasFollowing && (
                      <Badge variant="secondary">Mutual lost</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {follower.followers && (
                  <Metric icon={Star} label="Followers" value={follower.followers} />
                )}
                {follower.engagement && (
                  <Metric icon={TrendingUp} label="Engagement" value={follower.engagement} />
                )}
                {typeof follower.posts === "number" && (
                  <Metric icon={Star} label="Posts" value={String(follower.posts)} />
                )}
                {follower.lastActive && (
                  <Metric icon={Clock} label="Last active" value={follower.lastActive} />
                )}
                {follower.unfollowedAt && (
                  <Metric icon={UserMinus} label="Unfollowed" value={follower.unfollowedAt} />
                )}
              </div>

              <div className="rounded-md border border-border/60 p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Authenticity score
                </p>
                <Progress
                  value={follower.kind === "ghost" ? 18 : follower.quality === "high" ? 92 : follower.quality === "medium" ? 68 : 45}
                  className="h-2"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => { toast.success(`Opened ${follower.username} in new tab`); }}
                >
                  Open profile
                </Button>
                {onRemove && (follower.kind === "ghost" || follower.kind === "unfollower") && (
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => { onRemove(follower.id); onClose(); }}
                  >
                    <UserMinus className="h-4 w-4 mr-1" /> Remove follower
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 p-2.5 bg-muted/30">
      <Icon className="h-3.5 w-3.5 text-primary mb-1" />
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
