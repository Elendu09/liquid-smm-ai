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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import BioPreview from "./BioPreview";
import { bioStore, useBioConfig, useSyncLegacyTheme } from "./state/bioConfig";
import { linkBioThemes, THEME_STORAGE_KEY } from "@/pages/dashboard/views/linkbio/themePresets";
import { linkBioTemplates, APPLIED_TEMPLATE_KEY } from "@/pages/dashboard/views/linkbio/templatePresets";


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
                <SheetContent side="right" className="p-0 w-[92vw] sm:w-[420px]">
                  <BioPreview />
                </SheetContent>
              </Sheet>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 hidden lg:inline-flex" onClick={() => window.open(`https://bio.smmsaas.com/${cfg.slug}`, "_blank")}>
                <Eye className="w-3.5 h-3.5" /> Visit
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
