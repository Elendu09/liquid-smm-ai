import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Gift,
  Copy,
  Check,
  Users,
  Sparkles,
  Link2,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle,
  TrendingUp,
  PartyPopper,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useReferrals } from "@/hooks/useReferrals";
import { useAuthUser } from "@/hooks/useAuthUser";
import { formatDistanceToNow } from "date-fns";

const REWARD = 500;

export default function Referrals() {
  const { user, isGuest } = useAuthUser();
  const { code, link, referrals, totalEarned, paidReferrals, loading, ensureCode } = useReferrals();
  const [copied, setCopied] = useState(false);

  // Ensure a share code exists the moment a real user opens this page.
  useEffect(() => {
    if (user && !isGuest && !code) void ensureCode();
  }, [user, isGuest, code, ensureCode]);

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const shareUrl = encodeURIComponent(link ?? "");
  const shareText = encodeURIComponent(
    `Get 500 free AI credits when you upgrade to a paid plan on SMMSAAS — via my referral.`,
  );
  const shares = [
    { label: "X", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}` },
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${shareText}%20${shareUrl}` },
    { label: "Email", icon: Mail, href: `mailto:?subject=${shareText}&body=${shareUrl}` },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-emerald-500/[0.06] p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="hidden sm:flex h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 items-center justify-center shadow-lg shadow-primary/25">
              <Gift className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/40 text-primary">
                Referral program
              </Badge>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight font-['Instrument_Serif']">
                Invite friends, earn <span className="italic text-primary">{REWARD} credits</span>
              </h1>
              <p className="text-muted-foreground mt-1 text-sm max-w-xl">
                When someone you refer signs up and upgrades to a paid plan, you get {REWARD} AI
                credits — permanently added to your balance. No cap on how many people you can bring in.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Credits earned", value: totalEarned.toLocaleString(), icon: Sparkles },
              { label: "Paid referrals", value: String(paidReferrals), icon: Users },
              { label: "Reward", value: `${REWARD}`, icon: Gift },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-center">
                <s.icon className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="text-xl font-bold leading-none">{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share link */}
      {!isGuest && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Your referral link
            </CardTitle>
            <CardDescription className="text-xs">
              Share it anywhere — every paid signup credits your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && !link ? (
              <p className="text-sm text-muted-foreground">Generating your link…</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input readOnly value={link ?? ""} className="font-mono text-xs flex-1" onFocus={(e) => e.target.select()} />
                  <Button onClick={copyLink} className="shrink-0">
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {shares.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <s.icon className="h-3.5 w-3.5" /> {s.label}
                      </Button>
                    </a>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { n: 1, title: "Share your link", body: "Send your unique link to creators, founders, and social teams." },
          { n: 2, title: "They sign up & upgrade", body: "Your friend creates an account and picks a paid plan." },
          { n: 3, title: "You earn 500 credits", body: `The moment they upgrade, ${REWARD} credits land in your balance.` },
        ].map((s) => (
          <div key={s.n} className="rounded-xl border p-4 bg-gradient-to-br from-card to-muted/20">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-2">
              {s.n}
            </div>
            <div className="font-semibold text-sm">{s.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.body}</div>
          </div>
        ))}
      </div>

      {/* Earnings */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Referral earnings
          </CardTitle>
          <CardDescription className="text-xs">
            Every paid signup from your link, with the credits you were awarded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isGuest && referrals.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground space-y-2">
              <PartyPopper className="h-6 w-6 mx-auto opacity-70" />
              <p>No referrals yet. Share your link above and watch this fill up.</p>
            </div>
          ) : isGuest ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Sign up to start earning referral credits.</p>
              <Button asChild>
                <a href="/signup">
                  Create free account <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/50 bg-background/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium capitalize">{r.plan} plan</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(r.rewardedAt))} ago
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-green-500/10 text-green-600 border-0 gap-1">
                      <BadgeCheck className="h-3 w-3" /> Paid
                    </Badge>
                    <span className="text-sm font-semibold text-emerald-600">+{r.creditsAwarded}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
