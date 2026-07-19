import { useCallback, useSyncExternalStore } from "react";
import { useLocalCollection } from "./useLocalCollection";

/**
 * Brand voice profiles power every Create AI dialog. A voice is a rich
 * persona serialised into the AI prompt so generations stay on-brand
 * across sessions, platforms, and teammates.
 *
 * All fields beyond the core identity are optional so older stored
 * voices continue to load without migration.
 */
export interface PlatformOverride {
  platform: string; // instagram | tiktok | twitter | linkedin | facebook | youtube
  length?: "short" | "medium" | "long";
  emojis?: "none" | "minimal" | "expressive";
  extraGuidance?: string;
}

export interface BrandVoice {
  id: string;
  name: string;
  tone: string;
  audience: string;
  emojis: "none" | "minimal" | "expressive";
  length: "short" | "medium" | "long";
  dos: string[];
  donts: string[];
  samples: string[];
  createdAt: string;
  updatedAt?: string;
  isDefault?: boolean;

  // Enhanced (all optional — backward compatible)
  description?: string;
  archetype?: string; // Hero, Sage, Rebel, Creator, Everyman…
  formality?: number; // 0 casual → 100 formal
  energy?: number; // 0 calm → 100 hype
  reading?: "grade-5" | "grade-8" | "grade-12" | "expert";
  keywords?: string[]; // signature words to prefer
  banned?: string[]; // words to avoid
  signaturePhrases?: string[]; // openers / recurring lines
  ctaLibrary?: string[]; // preferred call-to-actions
  hashtagStyle?: "none" | "few" | "many" | "niche";
  perspective?: "first-person" | "brand-we" | "second-person";
  overrides?: PlatformOverride[];
  color?: string; // hex accent for the card
  emoji?: string; // avatar emoji
  usageCount?: number;
}

/** Curated starter voices — shown as a preset gallery on empty state. */
export const VOICE_PRESETS: Omit<BrandVoice, "id" | "createdAt">[] = [
  {
    name: "Balanced",
    tone: "friendly, clear, confident",
    audience: "general audience",
    emojis: "minimal",
    length: "medium",
    dos: ["Lead with the hook", "Use plain language", "One idea per sentence"],
    donts: ["Corporate jargon", "Hard sell", "Filler adverbs"],
    samples: [],
    isDefault: true,
    archetype: "Everyman",
    formality: 45,
    energy: 55,
    reading: "grade-8",
    perspective: "brand-we",
    hashtagStyle: "few",
    emoji: "⚖️",
    color: "#3b82f6",
  },
  {
    name: "Founder Mode",
    tone: "direct, opinionated, occasionally sarcastic",
    audience: "startup operators + builders",
    emojis: "minimal",
    length: "medium",
    dos: ["Take a stance", "Share the number", "Name the villain"],
    donts: ["Hedge language", "Meaningless buzzwords"],
    samples: [
      "We shipped 3 features nobody asked for. Killed all of them. Here's why.",
    ],
    archetype: "Rebel",
    formality: 30,
    energy: 75,
    reading: "grade-8",
    perspective: "first-person",
    hashtagStyle: "few",
    signaturePhrases: ["Hot take:", "Unpopular but true:"],
    emoji: "🚀",
    color: "#ef4444",
  },
  {
    name: "Editorial",
    tone: "measured, considered, quietly authoritative",
    audience: "curious professionals",
    emojis: "none",
    length: "long",
    dos: ["Show the craft", "Anchor in a moment", "Let the subject breathe"],
    donts: ["Clickbait", "Excessive punctuation"],
    samples: [],
    archetype: "Sage",
    formality: 70,
    energy: 35,
    reading: "grade-12",
    perspective: "brand-we",
    hashtagStyle: "niche",
    emoji: "📰",
    color: "#64748b",
  },
  {
    name: "Playful Creator",
    tone: "warm, curious, low-key funny",
    audience: "everyday scrollers",
    emojis: "expressive",
    length: "short",
    dos: ["Sound like a friend", "Ask real questions", "Keep it human"],
    donts: ["Cringe slang", "Fake urgency"],
    samples: [],
    archetype: "Creator",
    formality: 20,
    energy: 80,
    reading: "grade-5",
    perspective: "first-person",
    hashtagStyle: "many",
    emoji: "✨",
    color: "#a855f7",
  },
  {
    name: "Enterprise B2B",
    tone: "precise, credible, outcome-oriented",
    audience: "IT and revenue leaders",
    emojis: "none",
    length: "medium",
    dos: ["Cite the outcome", "Use specific verbs", "Anchor to ROI"],
    donts: ["Hype", "Emojis in headlines"],
    samples: [],
    archetype: "Sage",
    formality: 85,
    energy: 40,
    reading: "expert",
    perspective: "brand-we",
    hashtagStyle: "few",
    ctaLibrary: ["Book a demo", "Read the case study", "Talk to sales"],
    emoji: "🏛️",
    color: "#0ea5e9",
  },
  {
    name: "Bold Retail",
    tone: "punchy, celebratory, high-energy",
    audience: "shoppers scrolling for a deal",
    emojis: "expressive",
    length: "short",
    dos: ["Lead with the offer", "Use numbers", "Call the action"],
    donts: ["Long intros", "Vague promises"],
    samples: [],
    archetype: "Hero",
    formality: 25,
    energy: 90,
    reading: "grade-5",
    perspective: "second-person",
    hashtagStyle: "many",
    ctaLibrary: ["Shop now", "Tap the link", "Grab yours"],
    emoji: "🛍️",
    color: "#f59e0b",
  },
];

export const DEFAULT_VOICES: BrandVoice[] = [
  {
    ...VOICE_PRESETS[0],
    id: "voice-default",
    createdAt: new Date().toISOString(),
  } as BrandVoice,
];

const KEY = "brand-voices";
const ACTIVE = "smmpilot:brand-voice-active";

/* ---------- Reactive active voice (cross-mount) ---------- */
const activeListeners = new Set<() => void>();
function notifyActive() { activeListeners.forEach((l) => l()); }
function readActive(): string | null {
  try { return typeof window === "undefined" ? null : localStorage.getItem(ACTIVE); }
  catch { return null; }
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === ACTIVE) notifyActive();
  });
}

export function useBrandVoices() {
  const col = useLocalCollection<BrandVoice>("create", KEY, DEFAULT_VOICES);

  const activeId = useSyncExternalStore(
    (cb) => { activeListeners.add(cb); return () => activeListeners.delete(cb); },
    readActive,
    () => null,
  );

  const setActive = useCallback((id: string) => {
    try { localStorage.setItem(ACTIVE, id); } catch { /* noop */ }
    notifyActive();
    // Bump usage counter for analytics-lite
    col.update(id as BrandVoice["id"], {
      usageCount: ((col.items.find((v) => v.id === id)?.usageCount ?? 0) + 1),
    });
  }, [col]);

  const duplicate = useCallback((id: string) => {
    const src = col.items.find((v) => v.id === id);
    if (!src) return null;
    const copy: BrandVoice = {
      ...src,
      id: crypto.randomUUID(),
      name: `${src.name} (copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };
    col.add(copy);
    return copy;
  }, [col]);

  const importVoices = useCallback((raw: string) => {
    const data = JSON.parse(raw);
    const list: BrandVoice[] = Array.isArray(data) ? data : [data];
    let imported = 0;
    list.forEach((v) => {
      if (!v?.name || !v?.tone) return;
      col.add({
        ...v,
        id: crypto.randomUUID(),
        createdAt: v.createdAt || new Date().toISOString(),
        isDefault: false,
      });
      imported += 1;
    });
    return imported;
  }, [col]);

  const exportVoices = useCallback((ids?: string[]) => {
    const list = ids ? col.items.filter((v) => ids.includes(v.id)) : col.items;
    return JSON.stringify(list, null, 2);
  }, [col.items]);

  const active =
    col.items.find((v) => v.id === activeId) ??
    col.items.find((v) => v.isDefault) ??
    col.items[0];

  return {
    ...col,
    active,
    activeId: active?.id ?? null,
    setActive,
    duplicate,
    importVoices,
    exportVoices,
  };
}

/** Rich serialisation used inside AI prompts. */
export function serializeVoice(v: BrandVoice | null | undefined): string {
  if (!v) return "";
  const parts: string[] = [
    `Voice: ${v.name}`,
    `Tone: ${v.tone}`,
    `Audience: ${v.audience}`,
    `Emoji use: ${v.emojis}`,
    `Length: ${v.length}`,
  ];
  if (v.archetype) parts.push(`Archetype: ${v.archetype}`);
  if (typeof v.formality === "number") parts.push(`Formality: ${v.formality}/100`);
  if (typeof v.energy === "number") parts.push(`Energy: ${v.energy}/100`);
  if (v.reading) parts.push(`Reading level: ${v.reading}`);
  if (v.perspective) parts.push(`Perspective: ${v.perspective}`);
  if (v.hashtagStyle) parts.push(`Hashtag style: ${v.hashtagStyle}`);
  if (v.keywords?.length) parts.push(`Prefer words: ${v.keywords.join(", ")}`);
  if (v.banned?.length) parts.push(`Never use: ${v.banned.join(", ")}`);
  if (v.signaturePhrases?.length)
    parts.push(`Signature phrases: ${v.signaturePhrases.join(" | ")}`);
  if (v.ctaLibrary?.length) parts.push(`Preferred CTAs: ${v.ctaLibrary.join(" | ")}`);
  if (v.dos.length) parts.push(`Do: ${v.dos.join("; ")}`);
  if (v.donts.length) parts.push(`Don't: ${v.donts.join("; ")}`);
  if (v.samples.length)
    parts.push(`Reference samples:\n${v.samples.map((s) => `- ${s}`).join("\n")}`);
  return parts.join("\n");
}

/** Heuristic 0–100 completeness score for the strength meter. */
export function voiceStrength(v: BrandVoice): number {
  let s = 0;
  if (v.name) s += 5;
  if (v.tone) s += 10;
  if (v.audience) s += 8;
  if (v.description) s += 5;
  if (v.archetype) s += 5;
  if (typeof v.formality === "number") s += 4;
  if (typeof v.energy === "number") s += 4;
  s += Math.min(v.dos.length, 5) * 3;
  s += Math.min(v.donts.length, 5) * 3;
  s += Math.min(v.samples.length, 5) * 5;
  if (v.keywords?.length) s += 5;
  if (v.banned?.length) s += 3;
  if (v.signaturePhrases?.length) s += 5;
  if (v.ctaLibrary?.length) s += 5;
  return Math.min(100, s);
}
