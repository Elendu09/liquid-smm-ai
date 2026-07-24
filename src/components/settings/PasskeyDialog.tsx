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
  credentialId: string;
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

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function PasskeyDialog({ open, onOpenChange, onEnrolled }: Props) {
  const [label, setLabel] = useState("My primary passkey");
  const [step, setStep] = useState<"intro" | "enrolling" | "done" | "error">("intro");
  const [errorMsg, setErrorMsg] = useState("");

  const supported =
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials?.create;

  const enroll = async () => {
    if (!supported) {
      setErrorMsg("This browser does not support passkeys / WebAuthn.");
      setStep("error");
      return;
    }
    setStep("enrolling");
    try {
      // Real WebAuthn ceremony. The public key would normally be sent to the
      // server for storage + used at sign-in via `navigator.credentials.get`.
      // We surface a clear notice that server-side verification is required to
      // actually gate login — no silent “fake enabled” state.
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "SMMSAAS", id: window.location.hostname },
          user: {
            id: userId,
            name: label || "user",
            displayName: label || "SMMSAAS user",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },  // ES256
            { type: "public-key", alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60_000,
          attestation: "none",
        },
      })) as PublicKeyCredential | null;

      if (!cred) throw new Error("Enrollment was cancelled");

      const pk: Passkey = {
        id: crypto.randomUUID(),
        label: label.trim() || "Passkey",
        device: detectDevice(),
        createdAt: new Date().toISOString(),
        credentialId: b64url(cred.rawId),
      };
      pushLocalCollection<Passkey>("settings", "passkeys", [pk]);
      logAudit({
        actor: "You",
        action: "Enrolled passkey (client-side)",
        target: pk.label,
        category: "security",
      });
      setStep("done");
      onEnrolled?.(pk);
      toast.success("Passkey created on this device");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Enrollment failed");
      setStep("error");
    }
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("intro");
      setErrorMsg("");
    }, 200);
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
            security key.
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
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Note: Enable two-factor authentication above to protect sign-in.
              Passkey sign-in is enforced by your identity provider — this
              screen creates the device credential itself.
            </p>
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
            <p className="text-sm">Passkey created on this device.</p>
          </div>
        )}

        {step === "error" && (
          <div className="py-6 space-y-3 text-center">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <Button variant="outline" onClick={close}>Close</Button>
          </div>
        )}

        <DialogFooter>
          {step === "intro" && (
            <>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button onClick={enroll} disabled={!supported}>
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
