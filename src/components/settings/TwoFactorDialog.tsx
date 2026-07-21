import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Loader2, ShieldCheck, Smartphone } from "lucide-react";
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEnabled?: () => void;
}

const genSecret = () =>
  Array.from({ length: 16 }, () =>
    // eslint-disable-next-line no-restricted-syntax -- synth-ok: TOTP seed
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)],
  ).join("");

const genCodes = () =>
  Array.from({ length: 8 }, () =>
    Array.from({ length: 4 }, () =>
      // eslint-disable-next-line no-restricted-syntax -- synth-ok: recovery code
      Math.random().toString(36).slice(2, 6).toUpperCase(),
    ).join("-"),
  );

export function TwoFactorDialog({ open, onOpenChange, onEnabled }: Props) {
  const [step, setStep] = useState<"scan" | "verify" | "codes">("scan");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const secret = useMemo(() => genSecret(), [open]);
  const codes = useMemo(() => genCodes(), [open]);

  const verify = async () => {
    if (code.trim().length < 6) {
      toast.error("Enter the 6-digit code from your app");
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setBusy(false);
    setStep("codes");
    pushLocalCollection<{ id: string; codes: string[]; createdAt: string }>(
      "settings",
      "recovery-codes",
      [{ id: crypto.randomUUID(), codes, createdAt: new Date().toISOString() }],
    );
    logAudit({
      actor: "You",
      action: "Enabled two-factor authentication",
      category: "security",
    });
    onEnabled?.();
  };

  const download = () => {
    const blob = new Blob([codes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("scan");
      setCode("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Set up two-factor authentication
          </DialogTitle>
          <DialogDescription>
            Use an authenticator app like 1Password, Authy, or Google Authenticator.
          </DialogDescription>
        </DialogHeader>

        {step === "scan" && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 flex items-start gap-3 bg-muted/40">
              <Smartphone className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm space-y-2 min-w-0">
                <p>Add this secret to your authenticator app:</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs break-all bg-background border rounded px-2 py-1 flex-1">
                    {secret}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      toast.success("Copied");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setStep("verify")}>
              I've added it — continue
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-3">
            <Label htmlFor="totp">6-digit code</Label>
            <Input
              id="totp"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-widest"
            />
          </div>
        )}

        {step === "codes" && (
          <div className="space-y-3">
            <div className="rounded-lg border p-3 grid grid-cols-2 gap-2 font-mono text-xs bg-muted/40">
              {codes.map((c) => (
                <div key={c} className="text-center py-1">
                  {c}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Store these recovery codes somewhere safe. Each code can be used once
              if you lose access to your authenticator.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={download}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(codes.join("\n"));
                  toast.success("Copied");
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "verify" && (
            <>
              <Button variant="ghost" onClick={() => setStep("scan")}>
                Back
              </Button>
              <Button onClick={verify} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verify & enable
              </Button>
            </>
          )}
          {step === "codes" && <Button onClick={close}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
