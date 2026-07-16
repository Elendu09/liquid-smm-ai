import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import { logAudit } from "./AuditPanel";

export interface PaymentMethodRecord {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
  isDefault: boolean;
  createdAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (pm: PaymentMethodRecord) => void;
  initial?: PaymentMethodRecord | null;
}

const detectBrand = (num: string) => {
  const n = num.replace(/\s+/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6/.test(n)) return "Discover";
  return "Card";
};

export function PaymentMethodDialog({
  open,
  onOpenChange,
  onSaved,
  initial,
}: Props) {
  const [holder, setHolder] = useState(initial?.holder ?? "");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState(
    initial ? `${String(initial.expMonth).padStart(2, "0")}/${String(initial.expYear).slice(-2)}` : "",
  );
  const [cvc, setCvc] = useState("");
  const [makeDefault, setMakeDefault] = useState(initial?.isDefault ?? true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const digits = number.replace(/\s+/g, "");
    if (!initial && digits.length < 12) {
      toast.error("Enter a valid card number");
      return;
    }
    const [m, y] = exp.split("/").map((s) => s.trim());
    if (!m || !y) {
      toast.error("Enter expiry as MM/YY");
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    const pm: PaymentMethodRecord = {
      id: initial?.id ?? crypto.randomUUID(),
      brand: initial?.brand ?? detectBrand(digits),
      last4: initial?.last4 ?? digits.slice(-4),
      expMonth: Number(m),
      expYear: 2000 + Number(y),
      holder: holder.trim() || "Cardholder",
      isDefault: makeDefault,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSaved?.(pm);
    logAudit({
      actor: "You",
      action: initial ? "Updated payment method" : "Added payment method",
      target: `${pm.brand} •••• ${pm.last4}`,
      category: "billing",
    });
    setBusy(false);
    toast.success(initial ? "Payment method updated" : "Payment method added");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {initial ? "Update payment method" : "Add payment method"}
          </DialogTitle>
          <DialogDescription>
            Cards are processed securely. We never store CVCs.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="holder">Cardholder name</Label>
            <Input id="holder" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Jane Doe" />
          </div>
          {!initial && (
            <div className="space-y-2">
              <Label htmlFor="num">Card number</Label>
              <Input
                id="num"
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^\d ]/g, ""))}
                placeholder="4242 4242 4242 4242"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="exp">Expiry (MM/YY)</Label>
              <Input id="exp" value={exp} onChange={(e) => setExp(e.target.value)} placeholder="12/27" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                inputMode="numeric"
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                placeholder="123"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Set as default</p>
              <p className="text-xs text-muted-foreground">Use this card for future charges.</p>
            </div>
            <Switch checked={makeDefault} onCheckedChange={setMakeDefault} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {initial ? "Save changes" : "Add card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
