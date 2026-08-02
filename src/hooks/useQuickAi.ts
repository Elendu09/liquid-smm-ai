import { useCallback, useEffect, useRef, useState } from "react";
import { freeAiRun, type FreeAiProvider } from "@/services/freeAi";

export type QuickAiTask = "rephrase" | "shorten" | "expand" | "friendly" | "translate" | "ask";

const SYSTEM: Record<QuickAiTask, string> = {
  rephrase: "Rewrite the text so it reads naturally and keeps the same meaning. Reply with the rewritten text only.",
  shorten: "Rewrite the text so it is shorter and punchier. Reply with the rewritten text only.",
  expand: "Expand the text with a little more helpful detail. Reply with the rewritten text only.",
  friendly: "Rewrite the text in a warm, friendly, on-brand tone. Reply with the rewritten text only.",
  translate: "Translate the text. Reply with the translation only.",
  ask: "You are a concise, helpful assistant. Reply in plain text only — no markdown, no code fences.",
};

/**
 * Zero-login plain-text AI.
 *
 * Runs entirely in the browser against keyless public endpoints, so it works
 * with no API key, no OAuth and no setup — and it keeps working when the
 * metered server-side AI is rate limited or out of credits. Never costs credits.
 */
export function useQuickAi() {
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<FreeAiProvider | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => () => ctrl.current?.abort(), []);

  const run = useCallback(async (task: QuickAiTask, input: string, extra?: string) => {
    if (!input.trim()) return null;
    ctrl.current?.abort();
    const ac = new AbortController();
    ctrl.current = ac;
    setLoading(true);
    try {
      const user = extra ? `${extra}\n\n${input}` : input;
      const out = await freeAiRun(SYSTEM[task], user, ac.signal);
      setProvider(out?.provider ?? null);
      return out?.text ?? null;
    } finally {
      if (ctrl.current === ac) setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => ctrl.current?.abort(), []);

  return { run, cancel, loading, provider };
}
