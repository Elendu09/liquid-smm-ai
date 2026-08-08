import type { BioConfig } from "@/pages/dashboard/linkbio/state/bioConfig";

/**
 * Design presets change ONLY color/style properties (accent, buttons, text,
 * radius, fonts) — they never change the background or theme.
 * Themes control the full page look including background.
 */
export interface DesignPreset {
  id: string;
  name: string;
  tagline: string;
  /** Preview swatch colors */
  swatches: [string, string, string];
  overrides: Partial<BioConfig["overrides"]>;
}

export const designPresets: DesignPreset[] = [
  {
    id: "clean-slate",
    name: "Clean Slate",
    tagline: "Neutral, modern, versatile",
    swatches: ["#334155", "#f8fafc", "#0f172a"],
    overrides: {
      accent: "#334155",
      textColor: "#0f172a",
      buttonBg: "#0f172a",
      buttonText: "#f8fafc",
      radius: "xl",
      buttonStyle: "solid",
      fontPair: "inter-inter",
      fontScale: "m",
    },
  },
  {
    id: "ocean-calm",
    name: "Ocean Calm",
    tagline: "Cool blues, peaceful feel",
    swatches: ["#0ea5e9", "#e0f2fe", "#0369a1"],
    overrides: {
      accent: "#0ea5e9",
      textColor: "#0c4a6e",
      buttonBg: "#0ea5e9",
      buttonText: "#ffffff",
      radius: "full",
      buttonStyle: "pill",
      fontPair: "space-dm",
      fontScale: "m",
    },
  },
  {
    id: "sunset-warm",
    name: "Sunset Warm",
    tagline: "Warm oranges and pinks",
    swatches: ["#f97316", "#fef3c7", "#ea580c"],
    overrides: {
      accent: "#f97316",
      textColor: "#7c2d12",
      buttonBg: "#f97316",
      buttonText: "#ffffff",
      radius: "xl",
      buttonStyle: "solid",
      fontPair: "syne-jakarta",
      fontScale: "m",
    },
  },
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    tagline: "Luxurious dark + gold",
    swatches: ["#d4af37", "#1a1a2e", "#f5f0e6"],
    overrides: {
      accent: "#d4af37",
      textColor: "#f5f0e6",
      buttonBg: "transparent",
      buttonText: "#d4af37",
      radius: "sm",
      buttonStyle: "outline",
      fontPair: "playfair-inter",
      fontScale: "m",
    },
  },
  {
    id: "forest-green",
    name: "Forest Green",
    tagline: "Natural, earthy tones",
    swatches: ["#16a34a", "#f0fdf4", "#14532d"],
    overrides: {
      accent: "#16a34a",
      textColor: "#14532d",
      buttonBg: "#16a34a",
      buttonText: "#f0fdf4",
      radius: "md",
      buttonStyle: "solid",
      fontPair: "cormorant-karla",
      fontScale: "m",
    },
  },
  {
    id: "rose-blush",
    name: "Rose Blush",
    tagline: "Soft pinks, feminine",
    swatches: ["#ec4899", "#fdf2f8", "#be185d"],
    overrides: {
      accent: "#ec4899",
      textColor: "#831843",
      buttonBg: "#ec4899",
      buttonText: "#ffffff",
      radius: "full",
      buttonStyle: "pill",
      fontPair: "instrument-work",
      fontScale: "m",
    },
  },
  {
    id: "mono-noir",
    name: "Mono Noir",
    tagline: "Bold black & white",
    swatches: ["#000000", "#ffffff", "#737373"],
    overrides: {
      accent: "#000000",
      textColor: "#0a0a0a",
      buttonBg: "#000000",
      buttonText: "#ffffff",
      radius: "sm",
      buttonStyle: "solid",
      fontPair: "jetbrains-work",
      fontScale: "m",
    },
  },
  {
    id: "lavender-dream",
    name: "Lavender Dream",
    tagline: "Soft purples, dreamy",
    swatches: ["#a78bfa", "#f5f3ff", "#6d28d9"],
    overrides: {
      accent: "#a78bfa",
      textColor: "#4c1d95",
      buttonBg: "#a78bfa",
      buttonText: "#ffffff",
      radius: "xl",
      buttonStyle: "glass",
      fontPair: "space-dm",
      fontScale: "m",
    },
  },
  {
    id: "terracotta",
    name: "Terracotta",
    tagline: "Earthy, warm clay tones",
    swatches: ["#c2410c", "#fff7ed", "#9a3412"],
    overrides: {
      accent: "#c2410c",
      textColor: "#431407",
      buttonBg: "transparent",
      buttonText: "#c2410c",
      radius: "md",
      buttonStyle: "outline",
      fontPair: "cormorant-karla",
      fontScale: "m",
    },
  },
  {
    id: "cyber-neon",
    name: "Cyber Neon",
    tagline: "Electric green on dark",
    swatches: ["#22c55e", "#0a0a0a", "#86efac"],
    overrides: {
      accent: "#22c55e",
      textColor: "#86efac",
      buttonBg: "transparent",
      buttonText: "#22c55e",
      radius: "sm",
      buttonStyle: "outline",
      fontPair: "jetbrains-work",
      fontScale: "m",
    },
  },
  {
    id: "coral-pop",
    name: "Coral Pop",
    tagline: "Vibrant coral energy",
    swatches: ["#fb7185", "#fff1f2", "#e11d48"],
    overrides: {
      accent: "#fb7185",
      textColor: "#881337",
      buttonBg: "#fb7185",
      buttonText: "#ffffff",
      radius: "full",
      buttonStyle: "solid",
      fontPair: "bebas-barlow",
      fontScale: "l",
    },
  },
  {
    id: "arctic-ice",
    name: "Arctic Ice",
    tagline: "Cool, minimal, crisp",
    swatches: ["#67e8f9", "#ecfeff", "#0e7490"],
    overrides: {
      accent: "#06b6d4",
      textColor: "#164e63",
      buttonBg: "#06b6d4",
      buttonText: "#ecfeff",
      radius: "xl",
      buttonStyle: "solid",
      fontPair: "inter-inter",
      fontScale: "s",
    },
  },
];

export const DESIGN_PRESET_KEY = "smmpilot:linkbio:design-preset";
