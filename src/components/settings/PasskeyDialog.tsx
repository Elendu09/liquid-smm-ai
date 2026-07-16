import { useState } from "react";
import { toast } from "sonner";
import { Fingerprint, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { logAudit } from "./AuditPanel";

export interface Passkey {
  id: string;
  label: string;
  device: string;
  createdAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEnrolled?: (pk: Passkey) => void;
}

const detectDevice = () => {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "iOS device (Face ID / Touch ID)";
  if (/Android/.test(ua)) return "Android device (fingerprint)";
  if (/Mac/.test(ua)) return "macOS (Touch ID)";
  if (/Windows/.test(ua)) return "Windows (Windows Hello)";
  return "This browser";
};

export function PasskeyDialog({ open, onOpenChange, onEnrolled }: Props) {
  const [label, setLabel] = useState("My primary passkey");
  const [step, setStep] = useState<"intro" | "enrolling" | "done">("intro");

  const enroll = async () => {
    setStep("enrolling");
    // Simulated WebAuthn ceremony.
    await new Promise((r) => setTimeout(r, 1400));
    const pk: Passkey = {
      id: crypto.randomUUID(),
      label: label.trim() || "Passkey",
      device: detectDevice(),
      createdAt: new Date().toISOString(),
    };
    pushLocalCollection<Passkey>("settings", "passkeys", [pk]);
    logAudit({
      actor: "You",
      action: "Enrolled passkey",
      target: pk.label,
      category: "security",
    });
    setStep("done");
    onEnrolled?.(pk);
    toast.success("Passkey enrolled");
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(() => setStep("intro"), 200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            Add a passkey
          </DialogTitle>
          <DialogDescription>
            Passkeys let you sign in with Face ID, Touch ID, Windows Hello, or a
            security key — no password required.
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <KeyRound className="h-4 w-4" /> {detectDevice()}
              </div>
              <p className="text-xs text-muted-foreground">
                Your device's authenticator will be used to create the passkey.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pk-label">Name this passkey</Label>
              <Input
                id="pk-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Work laptop, iPhone…"
              />
            </div>
          </div>
        )}

        {step === "enrolling" && (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Confirm on your device to finish enrollment…</p>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <ShieldCheck className="h-10 w-10 text-emerald-500" />
            <p className="text-sm">Passkey ready. You can now sign in without a password.</p>
          </div>
        )}

        <DialogFooter>
          {step === "intro" && (
            <>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button onClick={enroll}>
                <Fingerprint className="h-4 w-4 mr-2" />
                Enroll passkey
              </Button>
            </>
          )}
          {step === "done" && <Button onClick={close}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
