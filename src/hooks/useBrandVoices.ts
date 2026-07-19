import { useCallback } from "react";
import { useLocalCollection } from "./useLocalCollection";

/**
 * Brand voice profiles power every Create AI dialog. A voice is a
 * lightweight persona (tone, do/don't lists, sample lines, emoji use,
 * average caption length) that is serialised into the AI prompt so
 * generations stay on-brand across sessions and accounts.
 */
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
}

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

/** Compact serialisation used by prompts and edge fn payloads. */
export function serializeVoice(v: BrandVoice | null | undefined): string {
  if (!v) return "";
  const parts = [
    `Tone: ${v.tone}`,
    `Audience: ${v.audience}`,
    `Emoji use: ${v.emojis}`,
    `Length: ${v.length}`,
  ];
  if (v.dos.length) parts.push(`Do: ${v.dos.join("; ")}`);
  if (v.donts.length) parts.push(`Don't: ${v.donts.join("; ")}`);
  if (v.samples.length)
    parts.push(`Reference samples:\n${v.samples.map((s) => `- ${s}`).join("\n")}`);
  return parts.join("\n");
}
