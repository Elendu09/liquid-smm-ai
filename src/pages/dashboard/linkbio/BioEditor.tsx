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
  Smartphone,
  GripVertical,
  Layers,
  Zap,
  Type as TypeIcon,
  Image as ImageIcon2,
  Video,
  Code2,
  Minus,
  Timer,
  Quote,
  RotateCcw,
  Circle,
  Square,
  Squircle,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Eye as EyeIcon,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession } from "@/hooks/useGuest";
import BioPreview from "./BioPreview";
import { bioStore, useBioConfig, useSyncLegacyTheme } from "./state/bioConfig";
import type { BioConfig, FontPairId } from "./state/bioConfig";
import { linkBioThemes, THEME_STORAGE_KEY } from "@/pages/dashboard/views/linkbio/themePresets";
import { linkBioTemplates, APPLIED_TEMPLATE_KEY } from "@/pages/dashboard/views/linkbio/templatePresets";


const railItems = [
  { id: "design", label: "Design", icon: Wand2 },
  { id: "theme", label: "Themes", icon: Palette },
  { id: "content", label: "Content", icon: Link2 },
  { id: "blocks", label: "Blocks", icon: Layers },
  { id: "motion", label: "Motion", icon: Zap },
  { id: "profile", label: "Profile", icon: User },
  { id: "socials", label: "Socials", icon: Share2 },
  { id: "seo", label: "SEO", icon: Globe },
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
            <div className="hidden md:flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold truncate">
                {rail === "design" && "Design Editor"}
                {rail === "theme" && "Theme Library"}
                {rail === "content" && "Links"}
                {rail === "blocks" && "Content Blocks"}
                {rail === "motion" && "Motion & Animations"}
                {rail === "profile" && "Profile"}
                {rail === "socials" && "Social Icons"}
                {rail === "seo" && "SEO & Sharing"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => bioStore.undo()} disabled={!bioStore.canUndo()} title="Undo">
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => bioStore.redo()} disabled={!bioStore.canRedo()} title="Redo">
                <Redo2 className="w-3.5 h-3.5" />
              </Button>
              {/* Mobile preview trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 lg:hidden">
                    <Smartphone className="w-3.5 h-3.5" /> Preview
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-[92vw] sm:w-[420px] [&>button.absolute]:left-3 [&>button.absolute]:right-auto">
                  <BioPreview />
                </SheetContent>
              </Sheet>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 hidden lg:inline-flex" onClick={() => window.open(`/bio/${cfg.slug}`, "_blank")}>
                <Eye className="w-3.5 h-3.5" /> Visit
              </Button>
              <Button size="sm" className="h-8 gap-1.5" onClick={async () => {
                if (isGuestSession()) {
                  toast.info("Sign in to publish your bio page");
                  return;
                }
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  toast.error("Sign in required");
                  return;
                }
                const slug = (cfg.slug || cfg.handle || "").toString().trim().replace(/^@/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-");
                if (!slug) {
                  toast.error("Choose a slug in Profile first");
                  return;
                }
                const { error } = await supabase.from("linkbio_pages").upsert({
                  user_id: user.id,
                  slug,
                  handle: cfg.handle ?? null,
                  headline: cfg.headline ?? null,
                  bio: cfg.bio ?? null,
                  avatar_url: cfg.avatarUrl ?? null,
                  theme_id: cfg.themeId ?? null,
                  overrides: cfg.overrides as any,
                  links: cfg.links as any,
                  socials: cfg.socials as any,
                  blocks: cfg.blocks as any,
                  published: true,
                }, { onConflict: "slug" });
                if (error) {
                  toast.error(error.message);
                  return;
                }
                toast.success("Published", { description: `${window.location.origin}/bio/${slug}` });
              }}>
                <Save className="w-3.5 h-3.5" /> Publish
              </Button>
            </div>
          </div>

          {/* Panels */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {rail === "design" && <DesignPanel />}
            {rail === "theme" && <ThemesPanel />}
            {rail === "content" && <LinksPanel />}
            {rail === "blocks" && <BlocksPanel />}
            {rail === "motion" && <MotionPanel />}
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

/* ------------------------------ Design Presets ------------------------------ */

type DesignPreset = {
  id: string;
  name: string;
  tagline: string;
  themeId: string;
  overrides: Partial<BioConfig["overrides"]>;
  swatch: { bg: string; accent: string; text: string; radius: number };
};

const designPresets: DesignPreset[] = [
  {
    id: "sleek-glass",
    name: "Sleek Glass",
    tagline: "Frosted, airy, aurora",
    themeId: "aurora-glass",
    swatch: { bg: "linear-gradient(135deg,#4ade80,#a78bfa,#22d3ee)", accent: "#a78bfa", text: "#ffffff", radius: 22 },
    overrides: { accent: "#a78bfa", textColor: "#ffffff", buttonStyle: "glass", radius: "xl", radiusPx: 22, fontPair: "space-dm", shadowDepth: "soft", alignment: "center", hover: "glow" },
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    tagline: "Ultra clean B&W",
    themeId: "midnight-minimal",
    swatch: { bg: "#0a0a0a", accent: "#e5e5e5", text: "#f5f5f5", radius: 4 },
    overrides: { bgType: "solid", bgSolid: "#0a0a0a", accent: "#e5e5e5", textColor: "#f5f5f5", buttonStyle: "outline", radius: "sm", radiusPx: 4, fontPair: "inter-inter", shadowDepth: "none", alignment: "left", hover: "scale" },
  },
  {
    id: "editorial-serif",
    name: "Editorial Serif",
    tagline: "Print magazine, cream paper",
    themeId: "editorial-magazine",
    swatch: { bg: "#f5f0e6", accent: "#111", text: "#111", radius: 2 },
    overrides: { bgType: "solid", bgSolid: "#f5f0e6", accent: "#111111", textColor: "#111111", buttonStyle: "outline", radius: "sm", radiusPx: 2, fontPair: "playfair-inter", shadowDepth: "none", alignment: "center" },
  },
  {
    id: "neon-arcade",
    name: "Neon Arcade",
    tagline: "Vaporwave, glow, pixels",
    themeId: "vaporwave-sun",
    swatch: { bg: "linear-gradient(180deg,#c026d3,#7c3aed,#06b6d4)", accent: "#f0abfc", text: "#ffffff", radius: 8 },
    overrides: { accent: "#f0abfc", textColor: "#ffffff", buttonStyle: "glass", radius: "md", radiusPx: 8, fontPair: "jetbrains-work", shadowDepth: "medium", hover: "glow", bgNoise: true },
  },
  {
    id: "kraft-paper",
    name: "Kraft Paper",
    tagline: "Botanical, tactile",
    themeId: "kraft-botanical",
    swatch: { bg: "#f2ede0", accent: "#4d7c0f", text: "#052e16", radius: 10 },
    overrides: { bgType: "solid", bgSolid: "#f2ede0", accent: "#4d7c0f", textColor: "#052e16", buttonStyle: "outline", radius: "md", radiusPx: 10, fontPair: "cormorant-karla", shadowDepth: "soft", bgNoise: true },
  },
  {
    id: "luxe-noir",
    name: "Luxe Noir",
    tagline: "Black + gilded gold",
    themeId: "luxe-gold-noir",
    swatch: { bg: "#0a0a0a", accent: "#d4af37", text: "#f8f2d9", radius: 2 },
    overrides: { bgType: "solid", bgSolid: "#0a0a0a", accent: "#d4af37", textColor: "#f8f2d9", buttonStyle: "outline", radius: "sm", radiusPx: 2, fontPair: "cormorant-karla", shadowDepth: "none", alignment: "center" },
  },
  {
    id: "pastel-bento",
    name: "Pastel Bento",
    tagline: "Playful tiles, candy",
    themeId: "pastel-tiles",
    swatch: { bg: "linear-gradient(135deg,#fecaca,#bfdbfe,#fde68a)", accent: "#f472b6", text: "#0f172a", radius: 20 },
    overrides: { bgType: "mesh", bgMeshStops: ["#fecaca", "#bfdbfe", "#fde68a", "#c7d2fe"], accent: "#f472b6", textColor: "#0f172a", buttonStyle: "solid", radius: "xl", radiusPx: 20, fontPair: "syne-jakarta", shadowDepth: "soft", hover: "lift" },
  },
  {
    id: "vapor-chrome",
    name: "Vapor Chrome",
    tagline: "Y2K iridescent chrome",
    themeId: "chrome-y2k",
    swatch: { bg: "linear-gradient(135deg,#fbcfe8,#a5f3fc,#c7d2fe,#fde68a)", accent: "#a78bfa", text: "#0f172a", radius: 999 },
    overrides: { accent: "#a78bfa", textColor: "#0f172a", buttonStyle: "glass", radius: "full", radiusPx: 999, fontPair: "space-dm", shadowDepth: "hard", hover: "scale" },
  },
];

const paletteSwatches = [
  "#6366f1", "#a78bfa", "#ec4899", "#f472b6",
  "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];

const buttonStyleOptions: Array<{ id: "solid" | "outline" | "pill" | "glass" | "brutal" | "shadow"; label: string }> = [
  { id: "solid", label: "Solid" },
  { id: "outline", label: "Outline" },
  { id: "pill", label: "Pill" },
  { id: "glass", label: "Glass" },
  { id: "brutal", label: "Brutal" },
  { id: "shadow", label: "Shadow" },
];

const shadowDepths: Array<{ id: "none" | "soft" | "medium" | "hard"; label: string }> = [
  { id: "none", label: "None" },
  { id: "soft", label: "Soft" },
  { id: "medium", label: "Med" },
  { id: "hard", label: "Hard" },
];

const fontPairs: Array<{ id: FontPairId; name: string; sample: string; headingFont: string; bodyFont: string }> = [
  { id: "inter-inter", name: "Inter · Inter", sample: "Aa", headingFont: "Inter, sans-serif", bodyFont: "Inter, sans-serif" },
  { id: "playfair-inter", name: "Playfair · Inter", sample: "Aa", headingFont: `"Playfair Display", serif`, bodyFont: "Inter, sans-serif" },
  { id: "space-dm", name: "Space · DM Sans", sample: "Aa", headingFont: `"Space Grotesk", sans-serif`, bodyFont: `"DM Sans", sans-serif` },
  { id: "syne-jakarta", name: "Syne · Jakarta", sample: "Aa", headingFont: `Syne, sans-serif`, bodyFont: `"Plus Jakarta Sans", sans-serif` },
  { id: "instrument-work", name: "Instrument · Work", sample: "Aa", headingFont: `"Instrument Serif", serif`, bodyFont: `"Work Sans", sans-serif` },
  { id: "cormorant-karla", name: "Cormorant · Karla", sample: "Aa", headingFont: `"Cormorant Garamond", serif`, bodyFont: `Karla, sans-serif` },
  { id: "jetbrains-work", name: "JetBrains · Work", sample: "Aa", headingFont: `"JetBrains Mono", monospace`, bodyFont: `"Work Sans", sans-serif` },
  { id: "bebas-barlow", name: "Bebas · Barlow", sample: "Aa", headingFont: `"Bebas Neue", sans-serif`, bodyFont: `Barlow, sans-serif` },
];

const fontScales: Array<{ id: "s" | "m" | "l" | "xl"; label: string }> = [
  { id: "s", label: "S" }, { id: "m", label: "M" }, { id: "l", label: "L" }, { id: "xl", label: "XL" },
];

const spacings: Array<{ id: "tight" | "cozy" | "roomy" | "airy"; label: string }> = [
  { id: "tight", label: "Tight" }, { id: "cozy", label: "Cozy" }, { id: "roomy", label: "Roomy" }, { id: "airy", label: "Airy" },
];

const maxWidths: Array<{ id: "narrow" | "regular" | "wide"; label: string }> = [
  { id: "narrow", label: "Narrow" }, { id: "regular", label: "Regular" }, { id: "wide", label: "Wide" },
];

/* Contrast helper (WCAG) */
function relLum(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length !== 6) return 0;
  const rgb = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function contrastRatio(a: string, b: string): number {
  const l1 = relLum(a); const l2 = relLum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ------------------------------ Design Panel ------------------------------ */

function DesignPanel() {
  const cfg = useBioConfig();
  const o = cfg.overrides;
  const accent = o.accent ?? "#6366f1";
  const text = o.textColor ?? "#ffffff";
  const bgSample = o.bgType === "solid" && o.bgSolid ? o.bgSolid : "#0f172a";
  const ratio = contrastRatio(text, bgSample);
  const contrastLabel = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "Fail";
  const contrastTone = ratio >= 4.5 ? "text-emerald-500 border-emerald-500/40 bg-emerald-500/10" : "text-rose-500 border-rose-500/40 bg-rose-500/10";

  return (
    <Accordion type="multiple" defaultValue={["presets", "colors", "type", "buttons", "bg", "layout"]} className="space-y-2 max-w-2xl">
      {/* -------- Presets -------- */}
      <AccordionItem value="presets" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Design Presets</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-muted-foreground">One-click recipes — writes all style overrides.</p>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px]" onClick={() => { bioStore.resetOverrides(); toast.success("Overrides reset"); }}>
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {designPresets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  bioStore.applyDesignPreset({ themeId: p.themeId, overrides: p.overrides });
                  toast.success(`Preset "${p.name}" applied`);
                }}
                className="group text-left rounded-lg border border-border/50 hover:border-primary/60 hover:shadow-md transition-all overflow-hidden bg-card"
              >
                <div className="h-16 relative flex items-center justify-center" style={{ background: p.swatch.bg }}>
                  <div
                    className="px-2.5 py-1 text-[10px] font-semibold shadow-sm"
                    style={{ background: p.swatch.accent, color: p.swatch.text, borderRadius: p.swatch.radius }}
                  >
                    Sample
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-[11px] font-semibold truncate">{p.name}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{p.tagline}</div>
                </div>
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* -------- Colors -------- */}
      <AccordionItem value="colors" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Colors</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Palette</Label>
            <div className="mt-1.5 grid grid-cols-12 gap-1">
              {paletteSwatches.map((c) => (
                <button
                  key={c}
                  onClick={() => bioStore.patchOverrides({ accent: c })}
                  className={cn("h-6 rounded border transition-transform hover:scale-110", accent === c ? "border-foreground ring-1 ring-primary" : "border-border/40")}
                  style={{ background: c }}
                  aria-label={`Set accent ${c}`}
                />
              ))}
            </div>
          </div>
          <ColorField label="Accent" value={o.accent ?? "#6366f1"} onChange={(v) => bioStore.patchOverrides({ accent: v })} onClear={() => bioStore.patchOverrides({ accent: undefined })} />
          <ColorField label="Text" value={o.textColor ?? "#ffffff"} onChange={(v) => bioStore.patchOverrides({ textColor: v })} onClear={() => bioStore.patchOverrides({ textColor: undefined })} />
          <ColorField label="Button background" value={o.buttonBg ?? ""} placeholder="Theme default" onChange={(v) => bioStore.patchOverrides({ buttonBg: v || undefined })} onClear={() => bioStore.patchOverrides({ buttonBg: undefined })} />
          <ColorField label="Button text" value={o.buttonText ?? ""} placeholder="Theme default" onChange={(v) => bioStore.patchOverrides({ buttonText: v || undefined })} onClear={() => bioStore.patchOverrides({ buttonText: undefined })} />
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Text on background:</span>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", contrastTone)}>{contrastLabel} · {ratio.toFixed(2)}</span>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* -------- Typography -------- */}
      <AccordionItem value="type" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><Type className="w-4 h-4 text-primary" /> Typography</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Font pair</Label>
            <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {fontPairs.map((f) => {
                const active = o.fontPair === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => bioStore.patchOverrides({ fontPair: f.id })}
                    className={cn(
                      "rounded-lg border p-2 text-center transition-colors",
                      active ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted",
                    )}
                  >
                    <div className="text-2xl leading-none" style={{ fontFamily: f.headingFont }}>{f.sample}</div>
                    <div className="text-[9px] mt-1 truncate" style={{ fontFamily: f.bodyFont }}>{f.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Font size scale</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {fontScales.map((s) => (
                <button
                  key={s.id}
                  onClick={() => bioStore.patchOverrides({ fontScale: s.id })}
                  className={cn(
                    "px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors",
                    (o.fontScale ?? "m") === s.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* -------- Buttons -------- */}
      <AccordionItem value="buttons" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-primary" /> Buttons</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Style</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {buttonStyleOptions.map((b) => (
                <button
                  key={b.id}
                  onClick={() => bioStore.patchOverrides({ buttonStyle: b.id })}
                  className={cn(
                    "rounded-md border p-1.5 transition-colors",
                    (o.buttonStyle ?? "") === b.id ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted",
                  )}
                >
                  <LiveButtonPreview variant={b.id} accent={accent} label={b.label} radius={o.radiusPx ?? 12} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Corner radius</Label>
              <span className="text-[10px] text-muted-foreground font-mono">{o.radiusPx ?? 12}px</span>
            </div>
            <Slider className="mt-2" min={0} max={32} step={1} value={[o.radiusPx ?? 12]} onValueChange={([v]) => bioStore.patchOverrides({ radiusPx: v })} />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Shadow depth</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {shadowDepths.map((s) => (
                <button
                  key={s.id}
                  onClick={() => bioStore.patchOverrides({ shadowDepth: s.id })}
                  className={cn(
                    "px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors",
                    (o.shadowDepth ?? "none") === s.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* -------- Background -------- */}
      <AccordionItem value="bg" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> Background</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div className="grid grid-cols-5 gap-1.5">
            {(["theme", "solid", "gradient", "mesh", "image"] as const).map((t) => (
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
          {o.bgType === "mesh" && (
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => {
                const stops = o.bgMeshStops ?? ["#a78bfa", "#22d3ee", "#f472b6", "#fde047"];
                return (
                  <ColorField
                    key={i}
                    label={`Stop ${i + 1}`}
                    value={stops[i]}
                    onChange={(v) => {
                      const next = [...stops] as [string, string, string, string];
                      next[i] = v;
                      bioStore.patchOverrides({ bgMeshStops: next });
                    }}
                  />
                );
              })}
            </div>
          )}
          {o.bgType === "image" && (
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Image URL</Label>
              <Input value={o.bgImage ?? ""} placeholder="https://…" onChange={(e) => bioStore.patchOverrides({ bgImage: e.target.value })} className="h-9 mt-1 text-xs" />
            </div>
          )}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Blur</Label>
              <span className="text-[10px] text-muted-foreground font-mono">{o.bgBlur ?? 0}px</span>
            </div>
            <Slider className="mt-2" min={0} max={40} step={1} value={[o.bgBlur ?? 0]} onValueChange={([v]) => bioStore.patchOverrides({ bgBlur: v })} />
          </div>
          <label className="flex items-center justify-between text-xs">
            <span>Noise / grain overlay</span>
            <Switch checked={!!o.bgNoise} onCheckedChange={(v) => bioStore.patchOverrides({ bgNoise: v })} />
          </label>
        </AccordionContent>
      </AccordionItem>

      {/* -------- Spacing & Layout -------- */}
      <AccordionItem value="layout" className="border rounded-lg px-4 bg-card/50">
        <AccordionTrigger className="text-sm font-semibold">
          <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-primary" /> Spacing & layout</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Alignment</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {([
                { id: "center" as const, Icon: AlignCenter },
                { id: "left" as const, Icon: AlignLeft },
                { id: "justified" as const, Icon: AlignJustify },
              ]).map(({ id, Icon }) => (
                <button
                  key={id}
                  onClick={() => bioStore.patchOverrides({ alignment: id })}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 rounded-md border text-[10px] capitalize transition-colors",
                    (o.alignment ?? "center") === id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {id}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Avatar size</Label>
              <span className="text-[10px] text-muted-foreground font-mono">{o.avatarSizePx ?? 84}px</span>
            </div>
            <Slider className="mt-2" min={48} max={140} step={2} value={[o.avatarSizePx ?? 84]} onValueChange={([v]) => bioStore.patchOverrides({ avatarSizePx: v })} />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Avatar shape</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {([
                { id: "circle" as const, Icon: Circle },
                { id: "squircle" as const, Icon: Squircle },
                { id: "square" as const, Icon: Square },
              ]).map(({ id, Icon }) => (
                <button
                  key={id}
                  onClick={() => bioStore.patchOverrides({ avatarShape: id })}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 rounded-md border text-[10px] capitalize transition-colors",
                    (o.avatarShape ?? "circle") === id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {id}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Avatar border</Label>
              <span className="text-[10px] text-muted-foreground font-mono">{o.avatarBorder ?? 2}px</span>
            </div>
            <Slider className="mt-2" min={0} max={8} step={1} value={[o.avatarBorder ?? 2]} onValueChange={([v]) => bioStore.patchOverrides({ avatarBorder: v })} />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Section spacing</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {spacings.map((s) => (
                <button
                  key={s.id}
                  onClick={() => bioStore.patchOverrides({ sectionSpacing: s.id })}
                  className={cn(
                    "px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors",
                    (o.sectionSpacing ?? "cozy") === s.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Max width</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {maxWidths.map((m) => (
                <button
                  key={m.id}
                  onClick={() => bioStore.patchOverrides({ maxWidth: m.id })}
                  className={cn(
                    "px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors",
                    (o.maxWidth ?? "regular") === m.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-border/50 space-y-2">
            <label className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5"><EyeIcon className="w-3.5 h-3.5" /> Show socials</span>
              <Switch checked={o.showSocials !== false} onCheckedChange={(v) => bioStore.patchOverrides({ showSocials: v })} />
            </label>
            <label className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5" /> Powered-by footer</span>
              <Switch checked={!!o.footerText} onCheckedChange={(v) => bioStore.patchOverrides({ footerText: v ? "Powered by SMM SaaS" : undefined })} />
            </label>
            {o.footerText !== undefined && (
              <Input value={o.footerText} onChange={(e) => bioStore.patchOverrides({ footerText: e.target.value })} className="h-8 text-xs" placeholder="Footer text" />
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/* Live preview chip for a button variant */
function LiveButtonPreview({ variant, accent, label, radius }: { variant: string; accent: string; label: string; radius: number }) {
  const base = "px-2 py-1 text-[10px] font-semibold w-full text-center";
  const style: React.CSSProperties = { borderRadius: radius };
  switch (variant) {
    case "solid":
      return <div className={base} style={{ ...style, background: accent, color: "#fff" }}>{label}</div>;
    case "outline":
      return <div className={base} style={{ ...style, border: `1.5px solid ${accent}`, color: accent }}>{label}</div>;
    case "pill":
      return <div className={base} style={{ borderRadius: 999, background: accent, color: "#fff" }}>{label}</div>;
    case "glass":
      return <div className={base} style={{ ...style, background: `${accent}33`, border: `1px solid ${accent}66`, color: accent, backdropFilter: "blur(6px)" }}>{label}</div>;
    case "brutal":
      return <div className={base} style={{ ...style, background: "#fff", color: "#000", border: "2px solid #000", boxShadow: "3px 3px 0 #000" }}>{label}</div>;
    case "shadow":
      return <div className={base} style={{ ...style, background: accent, color: "#fff", boxShadow: `0 6px 14px -4px ${accent}99` }}>{label}</div>;
    default:
      return <div className={base}>{label}</div>;
  }
}

function ThemesPanel() {
  const cfg = useBioConfig();
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        {linkBioThemes.length} professional themes — each one renders a completely different layout.
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
                "text-left rounded-xl overflow-hidden border transition-all group",
                active ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-border",
              )}
            >
              <div className={cn("h-36 relative overflow-hidden", t.bg)}>
                <ThemeMiniPreview theme={t} />
                <span className="absolute top-1.5 right-1.5 text-[9px] uppercase tracking-widest bg-black/40 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {t.layout.replace(/-/g, " ")}
                </span>
              </div>
              <div className="p-2.5">
                <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                  {t.name}
                  {active && <span className="text-[9px] text-primary">● active</span>}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{t.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Distinct mini-preview per theme layout so the picker itself hints at each design. */
function ThemeMiniPreview({ theme }: { theme: (typeof linkBioThemes)[number] }) {
  const dot = theme.accent;
  const bar = (w: string, extra = "") => (
    <div className={cn("h-1.5 rounded-full", extra)} style={{ width: w, background: `${dot}` }} />
  );
  const ghost = (w: string) => <div className="h-1.5 rounded-full bg-white/40" style={{ width: w }} />;
  const box = (extra = "") => <div className={cn("h-4 rounded bg-white/25 border border-white/30", extra)} />;

  switch (theme.layout) {
    case "magazine":
      return (
        <div className="absolute inset-0 p-3 text-neutral-900 font-serif">
          <div className="text-[7px] tracking-[0.3em] text-center opacity-70">ISSUE №26</div>
          <div className="text-center italic text-lg leading-none mt-1">Vogue</div>
          <div className="mt-2 border-t border-black/60" />
          <div className="mt-2 space-y-1">
            <div className="h-1 bg-black/60 w-full" />
            <div className="h-1 bg-black/40 w-4/5" />
            <div className="h-1 bg-black/40 w-3/5" />
          </div>
        </div>
      );
    case "terminal":
      return (
        <div className="absolute inset-0 p-2 font-mono text-[8px] text-green-300">
          <div>&gt; whoami</div>
          <div>@creator</div>
          <div className="mt-1">&gt; ls ./links</div>
          <div>[01] shop.link</div>
          <div>[02] classes.link</div>
          <div>&gt; <span className="inline-block w-1 h-2 bg-green-400 animate-pulse align-middle" /></div>
        </div>
      );
    case "brutal":
      return (
        <div className="absolute inset-0 p-2.5 space-y-1.5">
          <div className="bg-white border-2 border-black shadow-[3px_3px_0_0_#000] px-2 py-1 text-[9px] font-black uppercase">Handle</div>
          <div className="bg-white border-2 border-black shadow-[3px_3px_0_0_#000] px-2 py-1 text-[8px] font-bold uppercase">→ Link one</div>
          <div className="bg-white border-2 border-black shadow-[3px_3px_0_0_#000] px-2 py-1 text-[8px] font-bold uppercase">→ Link two</div>
        </div>
      );
    case "card-stack":
      return (
        <div className="absolute inset-0 p-2 space-y-1.5">
          <div className="h-10 rounded-md" style={{ background: `linear-gradient(135deg, ${dot}, #334155)` }} />
          <div className="h-10 rounded-md" style={{ background: `linear-gradient(135deg, #0f172a, ${dot})` }} />
        </div>
      );
    case "bento":
      return (
        <div className="absolute inset-0 p-2 grid grid-cols-2 gap-1.5">
          <div className="col-span-2 rounded-md" style={{ background: `linear-gradient(135deg, ${dot}, #0ea5e9)` }} />
          <div className="rounded-md bg-white shadow-sm" />
          <div className="rounded-md bg-slate-900" />
        </div>
      );
    case "reels":
      return (
        <div className="absolute inset-0 p-2">
          <div className="flex gap-1.5 mb-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full p-[1.5px]" style={{ background: `conic-gradient(from 0deg, ${dot}, #f472b6, ${dot})` }}>
                <div className="w-full h-full rounded-full bg-white" />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="h-3 rounded-full bg-white border border-rose-200" />
            <div className="h-3 rounded-full bg-white border border-rose-200" />
          </div>
        </div>
      );
    case "chrome":
      return (
        <div className="absolute inset-0 p-2.5 space-y-1.5">
          <div className="h-3 rounded-full border-2 border-white" style={{ background: "linear-gradient(180deg,#fff,#cbd5e1)" }} />
          <div className="h-3 rounded-full border-2 border-white" style={{ background: "linear-gradient(180deg,#fff,#cbd5e1)" }} />
          <div className="h-3 rounded-full border-2 border-white" style={{ background: "linear-gradient(180deg,#fff,#cbd5e1)" }} />
        </div>
      );
    case "vaporwave":
      return (
        <div className="absolute inset-0">
          <div className="absolute inset-x-4 top-3 h-10 rounded-full blur-md opacity-80" style={{ background: "radial-gradient(circle,#fde047,#f97316 60%,transparent)" }} />
          <div className="absolute inset-x-0 bottom-0 h-14" style={{ backgroundImage: "linear-gradient(#f0abfc44 1px,transparent 1px),linear-gradient(90deg,#f0abfc44 1px,transparent 1px)", backgroundSize: "10px 10px", transform: "perspective(80px) rotateX(55deg)", transformOrigin: "top" }} />
        </div>
      );
    case "polaroid":
      return (
        <div className="absolute inset-0 p-2 flex flex-wrap gap-2 items-center justify-center">
          {[-8, 5, -3].map((r, i) => (
            <div key={i} className="bg-white p-1 pb-2 shadow-md" style={{ transform: `rotate(${r}deg)` }}>
              <div className="w-10 h-8" style={{ background: `linear-gradient(135deg, ${dot}, #94a3b8)` }} />
            </div>
          ))}
        </div>
      );
    case "luxe":
      return (
        <div className="absolute inset-0 p-3 text-center">
          <div className="text-[9px] tracking-[0.3em] font-serif uppercase" style={{ color: dot }}>Maison</div>
          <div className="my-1.5 h-px mx-auto w-16" style={{ background: dot }} />
          <div className="space-y-1.5 mt-2">
            <div className="h-1 mx-4" style={{ background: `${dot}66` }} />
            <div className="h-1 mx-4" style={{ background: `${dot}66` }} />
            <div className="h-1 mx-4" style={{ background: `${dot}66` }} />
          </div>
        </div>
      );
    case "tiles":
      return (
        <div className="absolute inset-0 p-2 grid grid-cols-2 gap-1.5">
          {["#fca5a5", "#fcd34d", "#86efac", "#93c5fd"].map((c, i) => (
            <div key={i} className="rounded-lg" style={{ background: c }} />
          ))}
        </div>
      );
    case "crt":
      return (
        <div className="absolute inset-0 p-2">
          <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: "repeating-linear-gradient(0deg,rgba(0,0,0,0.4) 0 1px,transparent 1px 3px)" }} />
          <div className="relative border-2 rounded p-1.5 font-mono text-[8px] uppercase" style={{ borderColor: dot, color: dot, boxShadow: `2px 2px 0 ${dot}` }}>
            ▮ signal ok<br />ch.01 — main
          </div>
        </div>
      );
    case "botanical":
      return (
        <div className="absolute inset-0 p-3 text-center font-serif">
          <div className="text-[9px] italic" style={{ color: dot }}>botanica</div>
          <div className="flex items-center justify-center gap-1 my-1">
            <span className="h-px w-6" style={{ background: dot }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
            <span className="h-px w-6" style={{ background: dot }} />
          </div>
          <div className="space-y-1">
            <div className="h-2 rounded bg-white/50" />
            <div className="h-2 rounded bg-white/50" />
          </div>
        </div>
      );
    case "widgets":
      return (
        <div className="absolute inset-0 p-2 grid grid-cols-2 gap-1.5">
          <div className="col-span-2 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm" />
          <div className="rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm" />
          <div className="rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm" />
        </div>
      );
    case "row-divider":
      return (
        <div className="absolute inset-0 p-3 flex flex-col justify-center gap-1.5">
          {ghost("70%")}
          <div className="h-px bg-white/20 my-1" />
          {ghost("55%")}
          <div className="h-px bg-white/20 my-1" />
          {ghost("65%")}
        </div>
      );
    case "glass-list":
    default:
      return (
        <div className="absolute inset-0 p-3 flex flex-col items-center justify-center gap-1.5">
          <div className="w-8 h-8 rounded-full shadow-lg" style={{ background: dot }} />
          {box("w-4/5")}
          {box("w-4/5")}
          {box("w-4/5")}
        </div>
      );
  }
}


function LinksPanel() {
  const cfg = useBioConfig();
  const [dragId, setDragId] = useState<string | null>(null);
  return (
    <div className="space-y-3 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Drag to reorder, toggle visibility, or feature a link.</p>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => bioStore.addLink()}>
          <Plus className="w-3.5 h-3.5" /> Add link
        </Button>
      </div>
      <div className="space-y-2">
        {cfg.links.map((l, i) => (
          <div
            key={l.id}
            draggable
            onDragStart={() => setDragId(l.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId && dragId !== l.id) bioStore.reorderLinks(dragId, l.id);
              setDragId(null);
            }}
            className={cn(
              "p-3 rounded-lg border bg-card/50 space-y-2 transition-all",
              dragId === l.id ? "border-primary/70 opacity-60" : "border-border/50",
            )}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
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
              className="h-8 text-xs ml-6"
              placeholder="https://"
            />
            <div className="flex items-center justify-between ml-6">
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
  onClear,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onClear?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
        {onClear && value && (
          <button onClick={onClear} className="text-[10px] text-muted-foreground hover:text-foreground">clear</button>
        )}
      </div>
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

/* ------------------------------ Blocks Panel ------------------------------ */

const blockTypes: Array<{ id: "header" | "text" | "image" | "video" | "embed" | "divider" | "countdown" | "quote"; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "header", label: "Header", icon: TypeIcon },
  { id: "text", label: "Text", icon: TypeIcon },
  { id: "quote", label: "Quote", icon: Quote },
  { id: "image", label: "Image", icon: ImageIcon2 },
  { id: "video", label: "Video", icon: Video },
  { id: "embed", label: "Embed", icon: Code2 },
  { id: "countdown", label: "Countdown", icon: Timer },
  { id: "divider", label: "Divider", icon: Minus },
];

function BlocksPanel() {
  const cfg = useBioConfig();
  const blocks = cfg.blocks ?? [];
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Add block</p>
        <div className="grid grid-cols-4 gap-1.5">
          {blockTypes.map((b) => (
            <button
              key={b.id}
              onClick={() => bioStore.addBlock(b.id)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition"
            >
              <b.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-medium">{b.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {blocks.length === 0 && (
          <div className="p-6 rounded-lg border border-dashed border-border/60 bg-muted/20 text-center text-xs text-muted-foreground">
            No content blocks yet. Add one above to enrich your bio page.
          </div>
        )}
        {blocks.map((b, i) => (
          <div key={b.id} className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{b.type}</span>
              <div className="flex-1" />
              <Switch checked={b.enabled} onCheckedChange={(v) => bioStore.updateBlock(b.id, { enabled: v })} />
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => bioStore.moveBlock(b.id, -1)}><ArrowUp className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === blocks.length - 1} onClick={() => bioStore.moveBlock(b.id, 1)}><ArrowDown className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => bioStore.removeBlock(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
            {(b.type === "header" || b.type === "text" || b.type === "quote") && (
              <Textarea value={b.text ?? ""} onChange={(e) => bioStore.updateBlock(b.id, { text: e.target.value })} className="text-xs" rows={2} placeholder="Text…" />
            )}
            {(b.type === "image" || b.type === "video" || b.type === "embed") && (
              <Input value={b.src ?? ""} onChange={(e) => bioStore.updateBlock(b.id, { src: e.target.value })} className="h-8 text-xs" placeholder={b.type === "video" ? "https://youtube.com/watch?v=…" : "https://…"} />
            )}
            {b.type === "countdown" && (
              <div className="grid grid-cols-2 gap-2">
                <Input value={b.text ?? ""} onChange={(e) => bioStore.updateBlock(b.id, { text: e.target.value })} className="h-8 text-xs" placeholder="Label" />
                <Input type="datetime-local" value={b.target ? b.target.slice(0, 16) : ""} onChange={(e) => bioStore.updateBlock(b.id, { target: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="h-8 text-xs" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Motion Panel ------------------------------ */

const entrances: Array<{ id: "none" | "fade" | "slide" | "scale"; label: string; blurb: string }> = [
  { id: "none", label: "None", blurb: "Instant" },
  { id: "fade", label: "Fade", blurb: "Soft rise" },
  { id: "scale", label: "Scale", blurb: "Pop in" },
  { id: "slide", label: "Slide", blurb: "From right" },
];

const hovers: Array<{ id: "none" | "scale" | "lift" | "glow"; label: string }> = [
  { id: "none", label: "None" },
  { id: "scale", label: "Scale" },
  { id: "lift", label: "Lift" },
  { id: "glow", label: "Glow" },
];

function MotionPanel() {
  const cfg = useBioConfig();
  const o = cfg.overrides;
  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Entrance animation</Label>
        <div className="grid grid-cols-4 gap-1.5 mt-1.5">
          {entrances.map((e) => (
            <button
              key={e.id}
              onClick={() => bioStore.patchOverrides({ entrance: e.id })}
              className={cn(
                "px-2 py-2 rounded-md text-[11px] font-medium border transition-colors text-left",
                (o.entrance ?? "fade") === e.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
              )}
            >
              <div className="font-semibold">{e.label}</div>
              <div className="text-[9px] opacity-70">{e.blurb}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Link hover effect</Label>
        <div className="grid grid-cols-4 gap-1.5 mt-1.5">
          {hovers.map((h) => (
            <button
              key={h.id}
              onClick={() => bioStore.patchOverrides({ hover: h.id })}
              className={cn(
                "px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors",
                (o.hover ?? "scale") === h.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted",
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Stagger between items ({o.stagger ?? 60}ms)</Label>
        <input
          type="range"
          min={0}
          max={200}
          step={10}
          value={o.stagger ?? 60}
          onChange={(e) => bioStore.patchOverrides({ stagger: Number(e.target.value) })}
          className="w-full mt-2 accent-primary"
        />
      </div>
      <div className="p-3 rounded-lg border border-dashed border-border/60 bg-muted/30 text-[11px] text-muted-foreground">
        Motion applies to the profile section, blocks, and link buttons. Preview updates live.
      </div>
    </div>
  );
}
