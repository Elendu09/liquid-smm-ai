// 16 professionally distinct Link-in-Bio themes.
// Each theme uses a unique `layout` variant so its preview looks
// completely different from every other theme — not just recolored.

export type ThemeLayout =
  | "glass-list"
  | "row-divider"
  | "magazine"
  | "terminal"
  | "brutal"
  | "card-stack"
  | "bento"
  | "reels"
  | "chrome"
  | "vaporwave"
  | "polaroid"
  | "luxe"
  | "tiles"
  | "crt"
  | "botanical"
  | "widgets";

export type ThemePhase = 1 | 2 | 3 | 4;

export interface LinkBioTheme {
  id: string;
  name: string;
  tagline: string;
  bg: string;
  accent: string;
  buttonClass: string;
  textClass: string;
  subTextClass: string;
  fontClass: string;
  radius: "sm" | "md" | "xl" | "full";
  buttonStyle: "solid" | "outline" | "pill" | "glass" | "brutal";
  layout: ThemeLayout;
  phase?: ThemePhase; // retained for back-compat; no longer surfaced in UI
}

export const phaseMeta: Record<ThemePhase, { title: string; blurb: string }> = {
  1: { title: "Foundations", blurb: "Core versatile looks." },
  2: { title: "Editorial", blurb: "Print & luxury inspired." },
  3: { title: "Immersive", blurb: "Motion, glass and depth." },
  4: { title: "Playful", blurb: "Bold and character-driven." },
};

export const linkBioThemes: LinkBioTheme[] = [
  {
    id: "aurora-glass",
    name: "Aurora Glass",
    tagline: "Frosted glass buttons over an aurora gradient",
    bg: "bg-[conic-gradient(from_180deg_at_50%_50%,#4ade80,#a78bfa,#22d3ee,#4ade80)]",
    accent: "#a78bfa",
    buttonClass: "",
    textClass: "text-white",
    subTextClass: "text-white/80",
    fontClass: "font-sans",
    radius: "xl",
    buttonStyle: "glass",
    layout: "glass-list",
  },
  {
    id: "midnight-minimal",
    name: "Midnight Minimal",
    tagline: "Ultra-clean dark rows with hair-thin dividers",
    bg: "bg-slate-950",
    accent: "#60a5fa",
    buttonClass: "",
    textClass: "text-slate-100",
    subTextClass: "text-slate-400",
    fontClass: "font-sans",
    radius: "sm",
    buttonStyle: "outline",
    layout: "row-divider",
  },
  {
    id: "editorial-magazine",
    name: "Editorial Magazine",
    tagline: "Vogue-style cover with columned links",
    bg: "bg-[#f5f0e6]",
    accent: "#111",
    buttonClass: "",
    textClass: "text-neutral-900",
    subTextClass: "text-neutral-500",
    fontClass: "font-serif",
    radius: "sm",
    buttonStyle: "outline",
    layout: "magazine",
  },
  {
    id: "neon-terminal",
    name: "Neon Terminal",
    tagline: "Command-line vibes with a blinking cursor",
    bg: "bg-black",
    accent: "#22c55e",
    buttonClass: "",
    textClass: "text-green-300",
    subTextClass: "text-green-500/70",
    fontClass: "font-mono",
    radius: "sm",
    buttonStyle: "outline",
    layout: "terminal",
  },
  {
    id: "brutalist-zine",
    name: "Brutalist Zine",
    tagline: "Yellow, black offset shadows, all caps",
    bg: "bg-yellow-300",
    accent: "#000",
    buttonClass: "",
    textClass: "text-black",
    subTextClass: "text-neutral-800",
    fontClass: "font-mono",
    radius: "sm",
    buttonStyle: "brutal",
    layout: "brutal",
  },
  {
    id: "photo-card-stack",
    name: "Photo Card Stack",
    tagline: "Large image-forward link cards",
    bg: "bg-gradient-to-b from-neutral-100 to-neutral-200",
    accent: "#0f172a",
    buttonClass: "",
    textClass: "text-neutral-900",
    subTextClass: "text-neutral-500",
    fontClass: "font-sans",
    radius: "xl",
    buttonStyle: "solid",
    layout: "card-stack",
  },
  {
    id: "bento-grid",
    name: "Bento Grid",
    tagline: "Asymmetric tile grid, Apple-inspired",
    bg: "bg-gradient-to-br from-slate-100 via-white to-slate-200",
    accent: "#0ea5e9",
    buttonClass: "",
    textClass: "text-slate-900",
    subTextClass: "text-slate-500",
    fontClass: "font-sans",
    radius: "xl",
    buttonStyle: "solid",
    layout: "bento",
  },
  {
    id: "story-reels",
    name: "Story Reels",
    tagline: "Instagram-style story circles above your list",
    bg: "bg-gradient-to-b from-rose-100 via-pink-50 to-white",
    accent: "#ec4899",
    buttonClass: "",
    textClass: "text-neutral-900",
    subTextClass: "text-neutral-500",
    fontClass: "font-sans",
    radius: "full",
    buttonStyle: "pill",
    layout: "reels",
  },
  {
    id: "chrome-y2k",
    name: "Chrome Y2K",
    tagline: "Iridescent chrome with heavy borders",
    bg: "bg-[linear-gradient(135deg,#fbcfe8,#a5f3fc,#c7d2fe,#fde68a)]",
    accent: "#a78bfa",
    buttonClass: "",
    textClass: "text-slate-900",
    subTextClass: "text-slate-700",
    fontClass: "font-sans",
    radius: "full",
    buttonStyle: "glass",
    layout: "chrome",
  },
  {
    id: "vaporwave-sun",
    name: "Vaporwave Sun",
    tagline: "Retro sun, horizon grid, magenta glow",
    bg: "bg-gradient-to-b from-fuchsia-600 via-purple-700 to-cyan-500",
    accent: "#f0abfc",
    buttonClass: "",
    textClass: "text-white",
    subTextClass: "text-fuchsia-100",
    fontClass: "font-mono",
    radius: "md",
    buttonStyle: "glass",
    layout: "vaporwave",
  },
  {
    id: "polaroid-wall",
    name: "Polaroid Wall",
    tagline: "Tilted polaroid cards on kraft paper",
    bg: "bg-[#e9dfc7]",
    accent: "#3f3f3f",
    buttonClass: "",
    textClass: "text-neutral-900",
    subTextClass: "text-neutral-600",
    fontClass: "font-serif",
    radius: "sm",
    buttonStyle: "solid",
    layout: "polaroid",
  },
  {
    id: "luxe-gold-noir",
    name: "Luxe Gold Noir",
    tagline: "Deep black with gilded serif and hairline rules",
    bg: "bg-gradient-to-b from-neutral-950 to-black",
    accent: "#d4af37",
    buttonClass: "",
    textClass: "text-yellow-50",
    subTextClass: "text-yellow-200/70",
    fontClass: "font-serif",
    radius: "sm",
    buttonStyle: "outline",
    layout: "luxe",
  },
  {
    id: "pastel-tiles",
    name: "Pastel Tiles",
    tagline: "Two-column color-blocked pastel tiles",
    bg: "bg-gradient-to-b from-sky-50 to-rose-50",
    accent: "#f472b6",
    buttonClass: "",
    textClass: "text-slate-900",
    subTextClass: "text-slate-600",
    fontClass: "font-sans",
    radius: "xl",
    buttonStyle: "solid",
    layout: "tiles",
  },
  {
    id: "retro-crt",
    name: "Retro CRT",
    tagline: "Scanline overlay, chunky pixel buttons",
    bg: "bg-[#0b1a12]",
    accent: "#f59e0b",
    buttonClass: "",
    textClass: "text-amber-300",
    subTextClass: "text-amber-500/80",
    fontClass: "font-mono",
    radius: "sm",
    buttonStyle: "brutal",
    layout: "crt",
  },
  {
    id: "kraft-botanical",
    name: "Kraft Botanical",
    tagline: "Cream paper with leaf motifs and serif labels",
    bg: "bg-[#f2ede0]",
    accent: "#4d7c0f",
    buttonClass: "",
    textClass: "text-emerald-950",
    subTextClass: "text-emerald-800/80",
    fontClass: "font-serif",
    radius: "md",
    buttonStyle: "outline",
    layout: "botanical",
  },
  {
    id: "cosmic-widgets",
    name: "Cosmic Widgets",
    tagline: "Dark cosmos with iOS-style widget cards",
    bg: "bg-[radial-gradient(ellipse_at_top_right,#4c1d95,#0f172a_60%,#000)]",
    accent: "#818cf8",
    buttonClass: "",
    textClass: "text-indigo-50",
    subTextClass: "text-indigo-200/80",
    fontClass: "font-sans",
    radius: "xl",
    buttonStyle: "glass",
    layout: "widgets",
  },
];

// Back-compat helpers (no longer surfaced but still imported elsewhere)
for (const t of linkBioThemes) if (!t.phase) t.phase = 1;
export function themesByPhase(_phase: ThemePhase) {
  return linkBioThemes;
}

export const THEME_STORAGE_KEY = "smmpilot:linkbio:active-theme";

export function loadActiveThemeId(): string {
  if (typeof window === "undefined") return linkBioThemes[0].id;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && linkBioThemes.some((t) => t.id === stored)) return stored;
  return linkBioThemes[0].id;
}
