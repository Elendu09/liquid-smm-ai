import { useState } from "react";
import { Palette, RotateCcw, Eye, Droplets, Move } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

          {/* Advanced Brand & Asset Tools — Dynamic Watermarker */}
          <div className="rounded-xl border border-border/60 p-3 space-y-4 bg-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5"><Droplets className="h-4 w-4 text-primary" /> Dynamic Watermarker</p>
                <p className="text-[11px] text-muted-foreground mt-1">Overlays brand logos onto uploaded videos & images automatically. Preview shows small overlay in chosen corner.</p>
              </div>
              <Switch checked={!!(local as any).watermarkEnabled} onCheckedChange={(v) => update("watermarkEnabled" as any, v as any)} />
            </div>
            {(local as any).watermarkEnabled && (
              <div className="space-y-4">
                <MediaField
                  value={(local as any).watermarkLogoUrl || local.logoUrl}
                  onChange={(url) => update("watermarkLogoUrl" as any, (url ?? "") as any)}
                  label="Watermark logo (falls back to brand logo)"
                />
                <div className="grid gap-2">
                  <Label className="text-xs flex items-center gap-1"><Move className="h-3 w-3" /> Position</Label>
                  <Select value={(local as any).watermarkPosition || "bottom-right"} onValueChange={(v) => update("watermarkPosition" as any, v as any)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top left</SelectItem>
                      <SelectItem value="top-center">Top center</SelectItem>
                      <SelectItem value="top-right">Top right</SelectItem>
                      <SelectItem value="bottom-left">Bottom left</SelectItem>
                      <SelectItem value="bottom-right">Bottom right</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-3 gap-2">
                    {(["top-left","top-right","bottom-left","bottom-right","center","top-center"] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => update("watermarkPosition" as any, pos as any)}
                        className={`h-16 rounded-lg border-2 relative overflow-hidden bg-muted/30 text-[10px] font-medium capitalize ${((local as any).watermarkPosition===pos ? "border-primary bg-primary/5 text-primary" : "border-border/60 hover:border-primary/30")}`}
                      >
                        <div className={`absolute h-5 w-8 rounded bg-primary/80 flex items-center justify-center text-[7px] text-primary-foreground font-bold
                          ${pos==="top-left" ? "top-1 left-1" : ""}
                          ${pos==="top-right" ? "top-1 right-1" : ""}
                          ${pos==="top-center" ? "top-1 left-1/2 -translate-x-1/2" : ""}
                          ${pos==="bottom-left" ? "bottom-1 left-1" : ""}
                          ${pos==="bottom-right" ? "bottom-1 right-1" : ""}
                          ${pos==="center" ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : ""}
                        `}>LOGO</div>
                        {pos.replace("-"," ")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Opacity — {Math.round(((local as any).watermarkOpacity ?? 0.7)*100)}%</Label>
                  <Slider value={[Math.round(((local as any).watermarkOpacity ?? 0.7)*100)]} min={10} max={100} step={5} onValueChange={([v])=> update("watermarkOpacity" as any, (v/100) as any)} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Size — {((local as any).watermarkSize ?? 18)}% width</Label>
                  <Slider value={[(local as any).watermarkSize ?? 18]} min={8} max={30} step={1} onValueChange={([v])=> update("watermarkSize" as any, v as any)} />
                  <p className="text-[10px] text-muted-foreground">Small overlay as requested — upper/lower corners show tiny badge.</p>
                </div>
                <div className="rounded-lg border border-dashed border-border/60 p-2.5">
                  <p className="text-xs font-medium mb-2">Preview — watermark overlay</p>
                  <div className="relative rounded-lg overflow-hidden bg-muted h-40 border border-border/60">
                    <img src="https://images.unsplash.com/photo-1611162616805-e7e1dd64fe4e?w=600&h=400&fit=crop" alt="" className="w-full h-full object-cover" />
                    <div
                      className="absolute bg-white/90 backdrop-blur rounded-md border border-black/10 shadow-sm flex items-center gap-1 px-1.5 py-1"
                      style={{
                        opacity: (local as any).watermarkOpacity ?? 0.7,
                        width: `${(local as any).watermarkSize ?? 18}%`,
                        ...(((local as any).watermarkPosition==="top-left") ? { top: 8, left: 8 } as any : {}),
                        ...(((local as any).watermarkPosition==="top-right") ? { top: 8, right: 8 } as any : {}),
                        ...(((local as any).watermarkPosition==="top-center") ? { top: 8, left: "50%", transform: "translateX(-50%)" } as any : {}),
                        ...(((local as any).watermarkPosition==="bottom-left") ? { bottom: 8, left: 8 } as any : {}),
                        ...(((local as any).watermarkPosition==="bottom-right") ? { bottom: 8, right: 8 } as any : {}),
                        ...(((local as any).watermarkPosition==="center") ? { top: "50%", left: "50%", transform: "translate(-50%,-50%)" } as any : {}),
                      } as any}
                    >
                      {((local as any).watermarkLogoUrl || local.logoUrl) ? (
                        <img src={(local as any).watermarkLogoUrl || local.logoUrl} alt="" className="h-4 w-4 object-contain" />
                      ) : (
                        <div className="h-4 w-4 rounded bg-primary" />
                      )}
                      <span className="text-[8px] font-bold truncate">{local.brandName || "BRAND"}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Apply automatically to all new uploads — videos + images.</p>
                </div>
              </div>
            )}
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
