export interface LinkBioTheme {
  id: string;
  name: string;
  tagline: string;
  bg: string; // tailwind bg for preview canvas
  accent: string; // hex
  buttonClass: string;
  textClass: string;
  subTextClass: string;
  fontClass: string;
  radius: "sm" | "md" | "xl" | "full";
  buttonStyle: "solid" | "outline" | "pill" | "glass" | "brutal";
}

export const linkBioThemes: LinkBioTheme[] = [
  {
    id: "midnight-glass",
    name: "Midnight Glass",
    tagline: "Deep navy with frosted glass buttons",
    bg: "bg-gradient-to-b from-slate-900 via-slate-950 to-black",
    accent: "#6366f1",
    buttonClass: "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white",
    textClass: "text-white",
    subTextClass: "text-slate-300",
    fontClass: "font-sans",
    radius: "xl",
    buttonStyle: "glass",
  },
  {
    id: "sunset-gradient",
    name: "Sunset Gradient",
    tagline: "Warm orange to magenta blend",
    bg: "bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600",
    accent: "#ec4899",
    buttonClass: "bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white",
    textClass: "text-white",
    subTextClass: "text-white/90",
    fontClass: "font-sans",
    radius: "full",
    buttonStyle: "pill",
  },
  {
    id: "paper-minimal",
    name: "Paper Minimal",
    tagline: "Editorial cream with black ink",
    bg: "bg-[#f5f3ee]",
    accent: "#0d0d0d",
    buttonClass: "bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-900 shadow-sm",
    textClass: "text-neutral-900",
    subTextClass: "text-neutral-600",
    fontClass: "font-serif",
    radius: "sm",
    buttonStyle: "outline",
  },
  {
    id: "neon-retro",
    name: "Neon Retro",
    tagline: "Cyberpunk glow, arcade energy",
    bg: "bg-[radial-gradient(ellipse_at_top,_#1e1b4b,_#000)]",
    accent: "#22d3ee",
    buttonClass: "bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/40 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.35)]",
    textClass: "text-white",
    subTextClass: "text-cyan-200/80",
    fontClass: "font-mono",
    radius: "md",
    buttonStyle: "solid",
  },
  {
    id: "pastel-cloud",
    name: "Pastel Cloud",
    tagline: "Soft sky with peach highlights",
    bg: "bg-gradient-to-b from-sky-100 via-rose-50 to-orange-100",
    accent: "#f9a8a8",
    buttonClass: "bg-white/70 hover:bg-white border border-rose-200 text-rose-900 backdrop-blur-sm",
    textClass: "text-rose-950",
    subTextClass: "text-rose-700",
    fontClass: "font-sans",
    radius: "full",
    buttonStyle: "pill",
  },
  {
    id: "terracotta",
    name: "Terracotta",
    tagline: "Warm clay and sage tones",
    bg: "bg-gradient-to-b from-orange-200 via-orange-300 to-amber-400",
    accent: "#c4654a",
    buttonClass: "bg-white/80 hover:bg-white border border-orange-300 text-orange-950",
    textClass: "text-orange-950",
    subTextClass: "text-orange-800",
    fontClass: "font-serif",
    radius: "md",
    buttonStyle: "solid",
  },
  {
    id: "mono-noir",
    name: "Mono Noir",
    tagline: "Pure black with gold accents",
    bg: "bg-black",
    accent: "#c9a84c",
    buttonClass: "bg-neutral-900 hover:bg-neutral-800 border border-yellow-500/40 text-yellow-100",
    textClass: "text-white",
    subTextClass: "text-neutral-400",
    fontClass: "font-serif",
    radius: "sm",
    buttonStyle: "outline",
  },
  {
    id: "ocean-deep",
    name: "Ocean Deep",
    tagline: "Calm teals and deep navy",
    bg: "bg-gradient-to-b from-cyan-500 via-blue-600 to-indigo-800",
    accent: "#0ea5e9",
    buttonClass: "bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white",
    textClass: "text-white",
    subTextClass: "text-cyan-50",
    fontClass: "font-sans",
    radius: "xl",
    buttonStyle: "glass",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    tagline: "Hot pink over inky black",
    bg: "bg-gradient-to-br from-fuchsia-600 via-black to-purple-900",
    accent: "#e879f9",
    buttonClass: "bg-black/60 hover:bg-black/80 border-2 border-fuchsia-400/70 text-fuchsia-100 shadow-[0_0_16px_rgba(232,121,249,0.4)]",
    textClass: "text-fuchsia-50",
    subTextClass: "text-fuchsia-200/80",
    fontClass: "font-mono",
    radius: "sm",
    buttonStyle: "brutal",
  },
  {
    id: "y2k-chrome",
    name: "Y2K Chrome",
    tagline: "Iridescent pastels, chrome shine",
    bg: "bg-gradient-to-br from-violet-300 via-sky-200 to-cyan-200",
    accent: "#a78bfa",
    buttonClass: "bg-white/60 hover:bg-white/80 border border-white text-slate-900 backdrop-blur-md shadow-lg",
    textClass: "text-slate-900",
    subTextClass: "text-slate-700",
    fontClass: "font-sans",
    radius: "full",
    buttonStyle: "glass",
  },
  {
    id: "forest-cottage",
    name: "Forest Cottage",
    tagline: "Mossy greens and warm cream",
    bg: "bg-gradient-to-b from-emerald-800 via-emerald-900 to-green-950",
    accent: "#a0c49d",
    buttonClass: "bg-emerald-100/10 hover:bg-emerald-100/20 border border-emerald-200/30 text-emerald-50",
    textClass: "text-emerald-50",
    subTextClass: "text-emerald-200/80",
    fontClass: "font-serif",
    radius: "md",
    buttonStyle: "outline",
  },
  {
    id: "editorial-serif",
    name: "Editorial Serif",
    tagline: "Magazine-inspired, serif elegance",
    bg: "bg-gradient-to-b from-neutral-100 to-neutral-200",
    accent: "#1f2937",
    buttonClass: "bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900",
    textClass: "text-neutral-900",
    subTextClass: "text-neutral-600",
    fontClass: "font-serif",
    radius: "sm",
    buttonStyle: "solid",
  },
];

export const THEME_STORAGE_KEY = "smmpilot:linkbio:active-theme";

export function loadActiveThemeId(): string {
  if (typeof window === "undefined") return linkBioThemes[0].id;
  return localStorage.getItem(THEME_STORAGE_KEY) || linkBioThemes[0].id;
}
