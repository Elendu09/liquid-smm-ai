import { useState } from "react";
import { Palette, RotateCcw, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MediaField } from "@/components/publish/MediaField";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { toast } from "sonner";

const PRESETS: { label: string; hsl: string }[] = [
  { label: "Ocean",  hsl: "217 91% 60%" },
  { label: "Iris",   hsl: "262 83% 58%" },
  { label: "Rose",   hsl: "346 77% 60%" },
  { label: "Forest", hsl: "142 71% 45%" },
  { label: "Amber",  hsl: "38 92% 50%" },
  { label: "Slate",  hsl: "215 20% 40%" },
];

export function WhiteLabelPanel() {
  const { config, save, reset } = useWhiteLabel();
  const [local, setLocal] = useState(config);
  const dirty = JSON.stringify(local) !== JSON.stringify(config);

  const update = <K extends keyof typeof local>(k: K, v: (typeof local)[K]) =>
    setLocal((c) => ({ ...c, [k]: v }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> White-label
          </CardTitle>
          <CardDescription>
            Rebrand the workspace for agency clients. Applies to logo, colors, page title, and support surfaces.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="brandName">Brand name</Label>
            <Input
              id="brandName"
              value={local.brandName}
              onChange={(e) => update("brandName", e.target.value)}
              placeholder="Acme Social"
            />
            <p className="text-[11px] text-muted-foreground">Shown in the browser tab and login screen.</p>
          </div>

          <div className="grid gap-2">
            <MediaField
              value={local.logoUrl}
              onChange={(url) => update("logoUrl", url ?? "")}
              label="Logo"
            />
          </div>

          <div className="space-y-2">
            <Label>Accent color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => update("accentHsl", p.hsl)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all ${
                    local.accentHsl === p.hsl ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-border"
                  }`}
                >
                  <span className="h-3.5 w-3.5 rounded-full" style={{ background: `hsl(${p.hsl})` }} />
                  {p.label}
                </button>
              ))}
            </div>
            <Input
              value={local.accentHsl}
              onChange={(e) => update("accentHsl", e.target.value)}
              placeholder="Custom HSL, e.g. 217 91% 60%"
              className="h-9 font-mono text-xs"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tagline">Login tagline</Label>
            <Input
              id="tagline"
              value={local.customLoginTagline}
              onChange={(e) => update("customLoginTagline", e.target.value)}
              placeholder="The all-in-one social OS for your team"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="support">Support email</Label>
            <Input
              id="support"
              type="email"
              value={local.supportEmail}
              onChange={(e) => update("supportEmail", e.target.value)}
              placeholder="hello@yourbrand.com"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">Hide "Powered by" badge</p>
              <p className="text-[11px] text-muted-foreground">Removes the vendor badge from public share pages.</p>
            </div>
            <Switch checked={local.hideBadge} onCheckedChange={(v) => update("hideBadge", v)} />
          </div>

          <div className="rounded-xl border border-border/60 p-3 space-y-3 bg-primary/[0.04]">
            <p className="text-sm font-semibold">Email branding (white-label)</p>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Support email</label>
              <input value={local.supportEmail} onChange={(e) => update("supportEmail", e.target.value)} placeholder="support@yourbrand.com" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
              <p className="text-[11px] text-muted-foreground">Sender for magic-links and reports. Live sync.</p>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Login tagline</label>
              <input value={local.customLoginTagline} onChange={(e) => update("customLoginTagline", e.target.value)} placeholder="Your team's social OS" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-2.5 text-xs">
              <p className="font-medium">Preview email</p>
              <p className="text-muted-foreground mt-1">From: {local.brandName || "Your brand"} &lt;{local.supportEmail || "support@yourbrand.com"}&gt;</p>
              <p className="mt-1">Subject: Your campaign needs approval</p>
              <p className="text-muted-foreground">→ Magic-link via your domain</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border/60">
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                setLocal({
                  brandName: "",
                  logoUrl: "",
                  accentHsl: "",
                  hideBadge: false,
                  customLoginTagline: "",
                  supportEmail: "",
                });
                toast.success("White-label reset to defaults");
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
            </Button>
            <Button
              disabled={!dirty}
              onClick={() => {
                save(local);
                toast.success("Branding saved");
              }}
            >
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit sticky top-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-primary" /> Live preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-xl border border-border/60 overflow-hidden bg-background"
            style={local.accentHsl ? ({ "--primary": local.accentHsl } as React.CSSProperties) : undefined}
          >
            <div className="p-3 border-b border-border/60 flex items-center gap-2">
              {local.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={local.logoUrl} alt="" className="h-6 w-6 rounded object-contain" />
              ) : (
                <div className="h-6 w-6 rounded" style={{ background: "hsl(var(--primary))" }} />
              )}
              <span className="text-sm font-semibold truncate">
                {local.brandName || "Your brand"}
              </span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {local.customLoginTagline || "The all-in-one social OS for your team"}
              </p>
              <Button size="sm" className="w-full">Sign in</Button>
              <div className="flex gap-1.5">
                <span className="h-1.5 flex-1 rounded-full" style={{ background: "hsl(var(--primary))" }} />
                <span className="h-1.5 flex-1 rounded-full bg-muted" />
                <span className="h-1.5 flex-1 rounded-full bg-muted" />
              </div>
              {!local.hideBadge && (
                <p className="text-[10px] text-muted-foreground text-center">Powered by SMMPilot</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
