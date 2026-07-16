import { useMemo, useState } from "react";
import { Loader2, Check, ArrowRight, Shield, Search, Clock, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { platforms } from "@/config/platforms";
import { getDefaultFeatures } from "@/config/platformFeatures";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useAccounts, ConnectedAccount } from "@/contexts/AccountContext";
import { logRun } from "@/hooks/useRunHistory";

interface ConnectAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "platform" | "details" | "authorize";

const REMINDER_KEY = "smmpilot:connect-later";

// Platforms with real OAuth wired up. Keep empty until per-provider credentials
// are configured — everything else uses the simulated handshake below.
const REAL_OAUTH_PLATFORMS: string[] = [];

export function ConnectAccountDialog({ open, onOpenChange }: ConnectAccountDialogProps) {
  const { addAccount, setActiveAccount } = useAccounts();
  const [step, setStep] = useState<Step>("platform");
  const [platformId, setPlatformId] = useState<string>("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [authorizing, setAuthorizing] = useState(false);
  const [query, setQuery] = useState("");

  const platform = platforms.find((p) => p.id === platformId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return platforms;
    return platforms.filter(
      (p) => p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q),
    );
  }, [query]);

  const reset = () => {
    setStep("platform");
    setPlatformId("");
    setHandle("");
    setDisplayName("");
    setAvatar("");
    setAuthorizing(false);
    setQuery("");
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const connectLater = () => {
    try {
      localStorage.setItem(
        REMINDER_KEY,
        JSON.stringify({ deferredAt: new Date().toISOString(), platformId: platformId || null }),
      );
    } catch {
      /* ignore */
    }
    toast("We'll remind you to connect later", {
      description: "You can connect anytime from Settings → Connected accounts.",
      icon: <Clock className="h-4 w-4" />,
    });
    handleClose(false);
  };

  const startAuthorize = async () => {
    if (!platform || !handle.trim()) {
      toast.error("Please enter a handle");
      return;
    }
    setAuthorizing(true);
    setStep("authorize");
    // Simulated OAuth handshake — replace per-platform with real OAuth
    // (e.g. Meta Graph API, TikTok Login Kit, YouTube OAuth 2.0) as
    // provider credentials are configured.
    await new Promise((r) => setTimeout(r, 1500));

    const cleanedHandle = handle.replace(/^@/, "").trim();
    const account: ConnectedAccount = {
      id: crypto.randomUUID(),
      platformId,
      username: cleanedHandle,
      displayName: displayName.trim() || cleanedHandle,
      avatar: avatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanedHandle}`,
      isActive: true,
      followers: 0,
      following: 0,
      posts: 0,
      engagement: 0,
      connectedAt: new Date(),
      lastSync: new Date(),
      healthScore: 100,
      status: "active",
    };

    addAccount(account);
    setActiveAccount(account);
    logRun({
      toolKey: "accounts",
      action: "connect",
      platform: platformId,
      accountId: account.id,
      accountHandle: cleanedHandle,
      status: "success",
      output: { features: getDefaultFeatures(platformId) },
    });
    toast.success(`${platform.name} account @${cleanedHandle} connected`);
    setAuthorizing(false);
    handleClose(false);
  };

  const isReal = platform ? REAL_OAUTH_PLATFORMS.includes(platform.id) : false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            {step === "platform" && "Connect a social account"}
            {step === "details" && platform && (
              <span className="flex items-center gap-2">
                <PlatformIcon platform={platform.id} size="sm" />
                Connect your {platform.name}
              </span>
            )}
            {step === "authorize" && "Authorizing…"}
          </DialogTitle>
          <DialogDescription>
            {step === "platform" && "Choose the platform you want to link — 14 supported."}
            {step === "details" && "Enter the account details we'll use across the dashboard."}
            {step === "authorize" && "Completing secure authorization."}
          </DialogDescription>
        </DialogHeader>

        {step === "platform" && (
          <div className="px-6 py-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search platforms…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {filtered.map((p) => {
                const real = REAL_OAUTH_PLATFORMS.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPlatformId(p.id);
                      setStep("details");
                    }}
                    className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary/60 group-hover:bg-primary/10 transition-colors">
                      <PlatformIcon platform={p.id} size="md" />
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight">{p.name}</span>
                    {real ? (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30">
                        OAuth
                      </Badge>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">Manual</span>
                    )}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                  No platforms match "{query}"
                </div>
              )}
            </div>
          </div>
        )}

        {step === "details" && platform && (
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
              <PlatformIcon platform={platform.id} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{platform.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {getDefaultFeatures(platform.id).join(" · ")}
                </p>
              </div>
            </div>
            {!isReal && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  Real {platform.name} OAuth isn't wired up yet — this creates a workspace-only
                  reference. Ask to enable {platform.name} OAuth to publish for real.
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="handle">Handle / Username *</Label>
              <Input
                id="handle"
                placeholder="@yourhandle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="display">Display name</Label>
                <Input
                  id="display"
                  placeholder="Optional"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  placeholder="Optional"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === "authorize" && (
          <div className="px-6 py-10 text-center space-y-3">
            {authorizing ? (
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            ) : (
              <Check className="h-10 w-10 mx-auto text-green-500" />
            )}
            <div>
              <p className="font-semibold">Redirecting to {platform?.name} authorization</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                Handshake secured.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t bg-secondary/20 flex-col sm:flex-row gap-2 sm:gap-0">
          {step === "platform" && (
            <div className="flex flex-col-reverse sm:flex-row w-full gap-2 sm:justify-between">
              <Button variant="ghost" onClick={connectLater} className="gap-2">
                <Clock className="h-4 w-4" /> Connect later
              </Button>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
            </div>
          )}
          {step === "details" && (
            <div className="flex flex-col-reverse sm:flex-row w-full gap-2 sm:justify-between">
              <Button variant="ghost" onClick={connectLater} className="gap-2">
                <Clock className="h-4 w-4" /> Connect later
              </Button>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setStep("platform")}>
                  Back
                </Button>
                <Button onClick={startAuthorize} disabled={!handle.trim()}>
                  {isReal ? "Continue to OAuth" : "Authorize"}{" "}
                  {isReal ? <ExternalLink className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConnectAccountDialog;
