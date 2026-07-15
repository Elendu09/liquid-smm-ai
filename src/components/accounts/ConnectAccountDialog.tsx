import { useState } from "react";
import { Loader2, Check, ArrowRight, Shield } from "lucide-react";
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

export function ConnectAccountDialog({ open, onOpenChange }: ConnectAccountDialogProps) {
  const { addAccount, setActiveAccount } = useAccounts();
  const [step, setStep] = useState<Step>("platform");
  const [platformId, setPlatformId] = useState<string>("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [authorizing, setAuthorizing] = useState(false);

  const platform = platforms.find((p) => p.id === platformId);

  const reset = () => {
    setStep("platform");
    setPlatformId("");
    setHandle("");
    setDisplayName("");
    setAvatar("");
    setAuthorizing(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const startAuthorize = async () => {
    if (!platform || !handle.trim()) {
      toast.error("Please enter a handle");
      return;
    }
    setAuthorizing(true);
    setStep("authorize");
    // Simulated OAuth handshake
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "platform" && "Connect a social account"}
            {step === "details" && `Connect your ${platform?.name}`}
            {step === "authorize" && "Authorizing…"}
          </DialogTitle>
          <DialogDescription>
            {step === "platform" && "Pick the platform you want to link."}
            {step === "details" && "Enter the account details we'll use across the dashboard."}
            {step === "authorize" && "Completing secure authorization."}
          </DialogDescription>
        </DialogHeader>

        {step === "platform" && (
          <div className="grid grid-cols-3 gap-2 max-h-[360px] overflow-y-auto py-2">
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPlatformId(p.id);
                  setStep("details");
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/60 hover:bg-primary/5 transition"
              >
                <PlatformIcon platform={p.id} size="md" />
                <span className="text-xs font-medium text-center">{p.name}</span>
              </button>
            ))}
          </div>
        )}

        {step === "details" && platform && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
              <PlatformIcon platform={platform.id} size="md" />
              <div>
                <p className="font-semibold text-sm">{platform.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getDefaultFeatures(platform.id).join(" · ")}
                </p>
              </div>
            </div>
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
                placeholder="Optional — will use a placeholder if empty"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === "authorize" && (
          <div className="py-8 text-center space-y-3">
            {authorizing ? (
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            ) : (
              <Check className="h-10 w-10 mx-auto text-green-500" />
            )}
            <div>
              <p className="font-semibold">Redirecting to {platform?.name} authorization</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                Handshake secured. Real provider OAuth coming soon.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "platform" && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          )}
          {step === "details" && (
            <>
              <Button variant="outline" onClick={() => setStep("platform")}>
                Back
              </Button>
              <Button onClick={startAuthorize} disabled={!handle.trim()}>
                Authorize <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConnectAccountDialog;
