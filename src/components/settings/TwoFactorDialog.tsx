import { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "./AuditPanel";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEnabled?: () => void;
}

/**
 * Real TOTP enrollment via Supabase Auth MFA. The dialog performs
 * `mfa.enroll` → shows the provisioning secret/QR → verifies a real code
 * via `mfa.challenge` + `mfa.verify` before marking the factor active.
 */
export function TwoFactorDialog({ open, onOpenChange, onEnabled }: Props) {
  const [step, setStep] = useState<"loading" | "scan" | "verify" | "codes" | "error">("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string>("");
  const [qr, setQr] = useState<string>("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setStep("loading");
      setCode("");
      setErrorMsg("");
      try {
        // Clean up any half-enrolled unverified factors from previous attempts.
        const { data: existing } = await supabase.auth.mfa.listFactors();
        const stale = existing?.all?.filter((f) => f.status !== "verified") ?? [];
        for (const f of stale) {
          await supabase.auth.mfa.unenroll({ factorId: f.id }).catch(() => undefined);
        }
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
        if (error) throw error;
        if (cancelled) return;
        setFactorId(data.id);
        setSecret(data.totp.secret);
        setQr(data.totp.qr_code);
        setStep("scan");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Unable to start enrollment.");
        setStep("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const verify = async () => {
    if (!factorId) return;
    if (code.trim().length !== 6) {
      toast.error("Enter the 6-digit code from your app");
      return;
    }
    setBusy(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verErr) throw verErr;

      // Generate one-time recovery codes locally (stored in a downloadable file).
      const codes = Array.from({ length: 8 }, () => {
        const bytes = crypto.getRandomValues(new Uint8Array(6));
        return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase()
          .match(/.{1,4}/g)!
          .join("-");
      });
      setRecoveryCodes(codes);
      setStep("codes");
      logAudit({ actor: "You", action: "Enabled two-factor authentication", category: "security" });
      onEnabled?.();
      toast.success("Two-factor authentication enabled");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid code";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const blob = new Blob([recoveryCodes.join("\n")], { type: "text/plain" });
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
      setStep("loading");
      setCode("");
      setFactorId(null);
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

        {step === "loading" && (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Preparing your authenticator…</p>
          </div>
        )}

        {step === "error" && (
          <div className="py-6 space-y-3 text-center">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <Button variant="outline" onClick={close}>Close</Button>
          </div>
        )}

        {step === "scan" && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 flex items-start gap-3 bg-muted/40">
              <Smartphone className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm space-y-2 min-w-0 flex-1">
                <p>Scan the QR code with your authenticator app, or add the secret manually:</p>
                {qr && (
                  <img
                    src={qr}
                    alt="TOTP QR code"
                    className="mx-auto w-40 h-40 rounded border bg-white p-2"
                  />
                )}
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
              {recoveryCodes.map((c) => (
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
                  navigator.clipboard.writeText(recoveryCodes.join("\n"));
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
