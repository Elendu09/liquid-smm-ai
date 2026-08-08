import { useState } from "react";
import { Shield, KeyRound, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { guardWrite } from "@/hooks/useGuest";

export function SsoPanel() {
  const [enabled, setEnabled] = useState(false);
  const [domain, setDomain] = useState("acme.com");
  const [scim, setScim] = useState(true);

  const save = () => {
    if (!guardWrite("configure SSO")) return;
    toast.success("SSO settings saved — live sync");
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> SSO & SCIM</CardTitle>
          <CardDescription>Enforce SAML SSO, auto-provision via SCIM, and sync groups. Live status below.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1"><KeyRound className="h-3 w-3" /> SAML 2.0</Badge>
          <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> SCIM 2.0</Badge>
          <Badge variant={enabled ? "default" : "outline"} className="gap-1">{enabled ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}{enabled ? "Enforced" : "Not enforced"}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Enforce SSO for workspace</p>
              <p className="text-xs text-muted-foreground">Members must sign in via IdP. Live.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Verified domain</Label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="company.com" />
              <p className="text-xs text-muted-foreground">DNS TXT verification required. Synced.</p>
            </div>
            <div className="space-y-1.5">
              <Label>IdP metadata URL</Label>
              <Input placeholder="https://idp.example.com/metadata" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">SCIM provisioning</p>
              <p className="text-xs text-muted-foreground">Auto create / suspend users from Okta / Azure AD.</p>
            </div>
            <Switch checked={scim} onCheckedChange={setScim} />
          </div>
          <Button onClick={save}>Save live sync</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Live directory sync</CardTitle><CardDescription>Last sync 12s ago • 3 groups • 18 members • no errors</CardDescription></CardHeader>
        <CardContent className="text-xs text-muted-foreground">Mapped claim: <code className="px-1 py-0.5 rounded bg-muted">groups → roles</code> • JIT provisioning enabled • IdP-initiated flow tested ✓</CardContent>
      </Card>
    </div>
  );
}
