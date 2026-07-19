import { useCallback } from "react";
import { useLocalCollection } from "./useLocalCollection";

/**
 * Brand voice profiles power every Create AI dialog. A voice is a
 * lightweight persona (tone, do/don't lists, sample lines, emoji use,
 * average caption length) that is serialised into the AI prompt so
 * generations stay on-brand across sessions and accounts.
 *
 * Per-platform overrides let the same voice adapt its style to each
 * channel — e.g. shorter + punchier on X, hook-heavy on TikTok,
 * hashtag-rich on Instagram, thought-leadership on LinkedIn.
 */
export type PlatformKey =
  | "instagram"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "linkedin";

export interface PlatformOverride {
  tone?: string;
  length?: "short" | "medium" | "long";
  emojis?: "none" | "minimal" | "expressive";
  extraDos?: string[];
  extraDonts?: string[];
  notes?: string;
}

export interface BrandVoice {
  id: string;
  name: string;
  tone: string; // e.g. "playful + confident"
  audience: string; // "gen-z SaaS founders"
  emojis: "none" | "minimal" | "expressive";
  length: "short" | "medium" | "long";
  dos: string[];
  donts: string[];
  samples: string[]; // few-shot examples
  createdAt: string;
  isDefault?: boolean;
  platformOverrides?: Partial<Record<PlatformKey, PlatformOverride>>;
}

export const PLATFORM_KEYS: PlatformKey[] = [
  "instagram",
  "tiktok",
  "twitter",
  "facebook",
  "linkedin",
];

export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

export const DEFAULT_VOICES: BrandVoice[] = [
  {
    id: "voice-default",
    name: "Balanced",
    tone: "friendly, clear, confident",
    audience: "general audience",
    emojis: "minimal",
    length: "medium",
    dos: ["Lead with the hook", "Use plain language"],
    donts: ["Avoid corporate jargon", "No hard sell"],
    samples: [],
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
];

const KEY = "brand-voices";
const ACTIVE = "smmpilot:brand-voice-active";

export function useBrandVoices() {
  const col = useLocalCollection<BrandVoice>("create", KEY, DEFAULT_VOICES);

  const setActive = useCallback((id: string) => {
    try { localStorage.setItem(ACTIVE, id); } catch { /* noop */ }
  }, []);

  const activeId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE) : null;
  const active =
    col.items.find((v) => v.id === activeId) ??
    col.items.find((v) => v.isDefault) ??
    col.items[0];

  return { ...col, active, activeId: active?.id ?? null, setActive };
}

/** Resolve the effective voice fields for a given platform. */
export function resolveVoiceForPlatform(
  v: BrandVoice | null | undefined,
  platform?: string,
): BrandVoice | null | undefined {
  if (!v || !platform) return v;
  const key = platform.toLowerCase() as PlatformKey;
  const o = v.platformOverrides?.[key];
  if (!o) return v;
  return {
    ...v,
    tone: o.tone?.trim() ? o.tone : v.tone,
    length: o.length ?? v.length,
    emojis: o.emojis ?? v.emojis,
    dos: [...v.dos, ...(o.extraDos ?? [])],
    donts: [...v.donts, ...(o.extraDonts ?? [])],
  };
}

/** Compact serialisation used by prompts and edge fn payloads. */
export function serializeVoice(
  v: BrandVoice | null | undefined,
  platform?: string,
): string {
  if (!v) return "";
  const resolved = resolveVoiceForPlatform(v, platform)!;
  const parts = [
    `Tone: ${resolved.tone}`,
    `Audience: ${resolved.audience}`,
    `Emoji use: ${resolved.emojis}`,
    `Length: ${resolved.length}`,
  ];
  if (resolved.dos.length) parts.push(`Do: ${resolved.dos.join("; ")}`);
  if (resolved.donts.length) parts.push(`Don't: ${resolved.donts.join("; ")}`);
  const note = platform
    ? v.platformOverrides?.[platform.toLowerCase() as PlatformKey]?.notes
    : undefined;
  if (note) parts.push(`Platform note (${platform}): ${note}`);
  if (resolved.samples.length)
    parts.push(`Reference samples:\n${resolved.samples.map((s) => `- ${s}`).join("\n")}`);
  return parts.join("\n");
}
