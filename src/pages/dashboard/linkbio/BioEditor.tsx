import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Palette,
  Type,
  Sliders,
  Image as ImageIcon,
  Link2,
  User,
  Share2,
  Sparkles,
  Wand2,
  BarChart3,
  Globe,
  Cog,
  Save,
  Eye,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import BioPreview from "./BioPreview";
import { bioStore, useBioConfig, useSyncLegacyTheme } from "./state/bioConfig";
import { linkBioThemes } from "@/pages/dashboard/views/linkbio/themePresets";
import { linkBioTemplates, APPLIED_TEMPLATE_KEY } from "@/pages/dashboard/views/linkbio/templatePresets";
import { THEME_STORAGE_KEY } from "@/pages/dashboard/views/linkbio/themePresets";

const railItems = [
  { id: "design", label: "Design", icon: Wand2 },
  { id: "theme", label: "Themes", icon: Palette },
  { id: "content", label: "Content", icon: Link2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "socials", label: "Socials", icon: Share2 },
  { id: "seo", label: "SEO", icon: Globe },
];

const buttonStyles: Array<{ id: "solid" | "outline" | "pill" | "glass" | "brutal"; label: string }> = [
  { id: "solid", label: "Solid" },
  { id: "outline", label: "Outline" },
  { id: "pill", label: "Pill" },
  { id: "glass", label: "Glass" },
  { id: "brutal", label: "Brutal" },
];

const radii: Array<{ id: "sm" | "md" | "xl" | "full"; label: string }> = [
  { id: "sm", label: "Square" },
  { id: "md", label: "Soft" },
  { id: "xl", label: "Rounded" },
  { id: "full", label: "Pill" },
];

const socialOptions = ["instagram", "facebook", "linkedin", "youtube", "twitter", "github", "twitch"];

export default function BioEditor() {
  useSyncLegacyTheme();
  const cfg = useBioConfig();
  const [rail, setRail] = useState("design");
  const navigate = useNavigate();

  return (
    <div className="h-[calc(100vh-64px)] flex bg-background overflow-hidden">
      {/* Left rail */}
      <aside className="w-16 md:w-52 shrink-0 border-r border-border/50 bg-card/40 flex flex-col">
        <div className="p-3 border-b border-border/50 hidden md:block">
          <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Bio Editor</p>
          <p className="text-xs font-semibold truncate mt-0.5">bio.smmsaas.com/{cfg.slug}</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {railItems.map((r) => {
            const active = rail === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRail(r.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors",
                  active ? "bg-primary/15 text-primary ring-1 ring-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
                title={r.label}
              >
                <r.icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{r.label}</span>
              </button>
            );
          })}
          <div className="my-2 border-t border-border/50" />
          <button
            onClick={() => navigate("/dashboard/link-in-bio/analytics")}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Analytics</span>
          </button>
          <button
            onClick={() => navigate("/dashboard/settings")}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <Cog className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Settings</span>
          </button>
        </nav>
      </aside>

      {/* Center + Right */}
      <div className="flex-1 flex min-w-0">
        {/* Center panel */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border/50">
          {/* Top toolbar */}
          <div className="h-14 shrink-0 border-b border-border/50 bg-card/60 backdrop-blur-sm px-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold truncate">
                {rail === "design" && "Design Editor"}
                {rail === "theme" && "Theme Library"}
                {rail === "content" && "Links & Blocks"}
                {rail === "profile" && "Profile"}
                {rail === "socials" && "Social Icons"}
                {rail === "seo" && "SEO & Sharing"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Undo (coming)">
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Redo (coming)">
                <Redo2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => window.open(`https://bio.smmsaas.com/${cfg.slug}`, "_blank")}>
                <Eye className="w-3.5 h-3.5" /> Preview
              </Button>
              <Button size="sm" className="h-8 gap-1.5" onClick={() => toast.success("Bio saved")}>
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          </div>

          {/* Panels */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {rail === "design" && <DesignPanel />}
            {rail === "theme" && <ThemesPanel />}
            {rail === "content" && <LinksPanel />}
            {rail === "profile" && <ProfilePanel />}
            {rail === "socials" && <SocialsPanel />}
            {rail === "seo" && <SeoPanel />}
          </div>
        </div>

        {/* Right preview */}
        <div className="hidden lg:flex w-[520px] xl:w-[600px] shrink-0">
          <BioPreview />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Panels ------------------------------ */

function DesignPanel() {
  const cfg = useBioConfig();
  const o = cfg.overrides;
  return (
    <Accordion type="multiple" defaultValue={["presets", "colors", "type", "buttons", "bg", "layout"]} className="space-y-2 max-w-2xl">
      <AccordionItem value="presets" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Design Presets</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {linkBioTemplates.slice(0, 6).map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  bioStore.update((c) => ({
                    ...c,
                    themeId: tpl.themeId,
                    handle: tpl.handle,
                    headline: tpl.headline,
                    links: tpl.links.map((l, i) => ({ id: `l${Date.now()}${i}`, title: l.title, url: l.url, highlight: l.highlight, enabled: true })),
                  }));
                  localStorage.setItem(APPLIED_TEMPLATE_KEY, tpl.id);
                  toast.success(`Preset "${tpl.name}" applied`);
                }}
                className="text-left p-2.5 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <div className="text-xs font-semibold truncate">{tpl.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{tpl.category}</div>
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="colors" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Colors</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <ColorField label="Accent" value={o.accent ?? "#6366f1"} onChange={(v) => bioStore.patchOverrides({ accent: v })} />
          <ColorField label="Text" value={o.textColor ?? "#ffffff"} onChange={(v) => bioStore.patchOverrides({ textColor: v })} />
          <ColorField label="Button background" value={o.buttonBg ?? ""} placeholder="Theme default" onChange={(v) => bioStore.patchOverrides({ buttonBg: v || undefined })} />
          <ColorField label="Button text" value={o.buttonText ?? ""} placeholder="Theme default" onChange={(v) => bioStore.patchOverrides({ buttonText: v || undefined })} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="type" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><Type className="w-4 h-4 text-primary" /> Typography</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <FontChooser label="Heading" value={o.fontHeading ?? "sans"} onChange={(v) => bioStore.patchOverrides({ fontHeading: v })} />
          <FontChooser label="Body" value={o.fontBody ?? "sans"} onChange={(v) => bioStore.patchOverrides({ fontBody: v })} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="buttons" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-primary" /> Button style</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div className="grid grid-cols-5 gap-1.5">
            {buttonStyles.map((b) => (
              <button
                key={b.id}
                onClick={() => bioStore.patchOverrides({ buttonStyle: b.id })}
                className={cn(
                  "px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors",
                  (o.buttonStyle ?? "") === b.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Corner radius</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {radii.map((r) => (
                <button
                  key={r.id}
                  onClick={() => bioStore.patchOverrides({ radius: r.id })}
                  className={cn(
                    "px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors",
                    (o.radius ?? "") === r.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="bg" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> Background</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {(["theme", "solid", "gradient"] as const).map((t) => (
              <button
                key={t}
                onClick={() => bioStore.patchOverrides({ bgType: t })}
                className={cn(
                  "px-2 py-1.5 rounded-md text-[11px] font-medium border capitalize transition-colors",
                  (o.bgType ?? "theme") === t ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {o.bgType === "solid" && (
            <ColorField label="Background color" value={o.bgSolid ?? "#0f172a"} onChange={(v) => bioStore.patchOverrides({ bgSolid: v })} />
          )}
          {o.bgType === "gradient" && (
            <div className="grid grid-cols-2 gap-2">
              <ColorField label="From" value={o.bgGradientFrom ?? "#6366f1"} onChange={(v) => bioStore.patchOverrides({ bgGradientFrom: v })} />
              <ColorField label="To" value={o.bgGradientTo ?? "#0f172a"} onChange={(v) => bioStore.patchOverrides({ bgGradientTo: v })} />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="layout" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-primary" /> Spacing & layout</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Alignment</Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              {(["center", "left"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => bioStore.patchOverrides({ alignment: a })}
                  className={cn(
                    "px-2 py-1.5 rounded-md text-[11px] font-medium border capitalize transition-colors",
                    (o.alignment ?? "center") === a ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Avatar size</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {(["sm", "md", "lg"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => bioStore.patchOverrides({ avatarSize: s })}
                  className={cn(
                    "px-2 py-1.5 rounded-md text-[11px] font-medium border uppercase transition-colors",
                    (o.avatarSize ?? "md") === s ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ThemesPanel() {
  const cfg = useBioConfig();
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        Phase 1 — Foundations · {linkBioThemes.length} themes. Editorial, Motion & Niche phases coming next.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {linkBioThemes.map((t) => {
          const active = t.id === cfg.themeId;
          return (
            <button
              key={t.id}
              onClick={() => {
                bioStore.set({ themeId: t.id });
                localStorage.setItem(THEME_STORAGE_KEY, t.id);
                toast.success(`Theme "${t.name}" applied`);
              }}
              className={cn(
                "text-left rounded-xl overflow-hidden border transition-all",
                active ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-border",
              )}
            >
              <div className={cn("h-32 flex items-center justify-center", t.bg)}>
                <div className="w-10 h-10 rounded-full" style={{ background: t.accent }} />
              </div>
              <div className="p-2.5">
                <div className="text-xs font-semibold truncate">{t.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{t.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LinksPanel() {
  const cfg = useBioConfig();
  return (
    <div className="space-y-3 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Reorder, toggle visibility, feature a link as highlighted.</p>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => bioStore.addLink()}>
          <Plus className="w-3.5 h-3.5" /> Add link
        </Button>
      </div>
      <div className="space-y-2">
        {cfg.links.map((l, i) => (
          <div key={l.id} className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={l.title}
                onChange={(e) => bioStore.updateLink(l.id, { title: e.target.value })}
                className="h-8 text-xs"
                placeholder="Link title"
              />
              <Switch checked={l.enabled} onCheckedChange={(v) => bioStore.updateLink(l.id, { enabled: v })} />
            </div>
            <Input
              value={l.url}
              onChange={(e) => bioStore.updateLink(l.id, { url: e.target.value })}
              className="h-8 text-xs"
              placeholder="https://"
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => bioStore.updateLink(l.id, { highlight: !l.highlight })}
                className={cn(
                  "flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border",
                  l.highlight ? "border-amber-500/60 bg-amber-500/10 text-amber-600" : "border-border/60 text-muted-foreground hover:bg-muted",
                )}
              >
                <Star className={cn("w-3 h-3", l.highlight && "fill-current")} /> Featured
              </button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => bioStore.moveLink(l.id, -1)}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === cfg.links.length - 1} onClick={() => bioStore.moveLink(l.id, 1)}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => bioStore.removeLink(l.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePanel() {
  const cfg = useBioConfig();
  return (
    <div className="space-y-3 max-w-lg">
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Handle</Label>
        <Input value={cfg.handle} onChange={(e) => bioStore.set({ handle: e.target.value })} className="h-9 mt-1" />
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Headline</Label>
        <Input value={cfg.headline} onChange={(e) => bioStore.set({ headline: e.target.value })} className="h-9 mt-1" />
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Bio</Label>
        <Textarea value={cfg.bio ?? ""} onChange={(e) => bioStore.set({ bio: e.target.value })} className="mt-1 text-sm" rows={3} />
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Avatar image URL</Label>
        <Input value={cfg.avatarUrl ?? ""} placeholder="https://…" onChange={(e) => bioStore.set({ avatarUrl: e.target.value })} className="h-9 mt-1" />
      </div>
    </div>
  );
}

function SocialsPanel() {
  const cfg = useBioConfig();
  return (
    <div className="space-y-3 max-w-lg">
      <p className="text-xs text-muted-foreground">Add social icons that appear at the bottom of your bio.</p>
      {socialOptions.map((p) => {
        const existing = cfg.socials.find((s) => s.platform === p);
        return (
          <div key={p} className="flex items-center gap-2">
            <span className="w-20 text-xs font-medium capitalize">{p}</span>
            <Input
              value={existing?.url ?? ""}
              placeholder={`https://${p}.com/…`}
              onChange={(e) => {
                const url = e.target.value;
                bioStore.update((c) => {
                  const others = c.socials.filter((s) => s.platform !== p);
                  return { ...c, socials: url ? [...others, { platform: p, url }] : others };
                });
              }}
              className="h-8 text-xs"
            />
          </div>
        );
      })}
    </div>
  );
}

function SeoPanel() {
  const cfg = useBioConfig();
  return (
    <div className="space-y-3 max-w-lg">
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Custom slug</Label>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">bio.smmsaas.com/</span>
          <Input value={cfg.slug} onChange={(e) => bioStore.set({ slug: e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase() })} className="h-9 flex-1" />
        </div>
      </div>
      <div className="p-3 rounded-lg border border-dashed border-border/60 bg-muted/30 text-[11px] text-muted-foreground">
        OG image generator, custom domains, redirect rules, and A/B testing are coming in Phase 3.
      </div>
    </div>
  );
}

/* ------------------------------ Small fields ------------------------------ */

function ColorField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 rounded border border-border/60 bg-transparent cursor-pointer"
          aria-label={`${label} color`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 text-xs font-mono" />
      </div>
    </div>
  );
}

function FontChooser({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "sans" | "serif" | "mono";
  onChange: (v: "sans" | "serif" | "mono") => void;
}) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-3 gap-1.5 mt-1.5">
        {(["sans", "serif", "mono"] as const).map((f) => (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={cn(
              "px-2 py-1.5 rounded-md text-[11px] font-medium border capitalize transition-colors",
              value === f ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
              f === "serif" && "font-serif",
              f === "mono" && "font-mono",
            )}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}
