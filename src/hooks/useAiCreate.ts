import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-create`;
const APIKEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function post<T>(payload: Record<string, unknown>): Promise<T | null> {
  try {
    // ai-create requires a real user JWT — the anon key has no `sub` claim.
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      toast.error("Sign in to use AI features.");
      return null;
    }
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: APIKEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      const msg =
        res.status === 429
          ? "Rate limit — try again in a moment."
          : res.status === 402
            ? "AI credits exhausted. Add credits in Settings → Plans."
            : `AI failed (${res.status}). ${text.slice(0, 120)}`;
      toast.error(msg);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    toast.error(`AI failed: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

export interface GeneratedCaption {
  title: string;
  body: string;
  hashtags: string[];
}

export interface ResearchedHashtag {
  tag: string;
  volume: "low" | "medium" | "high" | "viral";
  difficulty: "easy" | "medium" | "hard";
}

export interface AiBrief {
  caption: string;
  hashtags: string[];
  hooks: string[];
  cta: string;
}

export const aiCreate = {
  captions: (p: { topic: string; tone?: string; platform?: string; count?: number }) =>
    post<{ captions: GeneratedCaption[] }>({ op: "captions", ...p }),
  hashtags: (p: { topic: string; platform?: string }) =>
    post<{ topic: string; tags: ResearchedHashtag[] }>({ op: "hashtags", ...p }),
  translate: (p: { text: string; targetLanguage: string }) =>
    post<{ translated: string; language: string }>({ op: "translate", ...p }),
  reply: (p: { message: string; author?: string; platform?: string; tone?: string; count?: number }) =>
    post<{ suggestions: string[] }>({ op: "reply", ...p }),
  brief: (p: { topic: string; goal?: string; audience?: string; platform?: string; tone?: string; imageUrl?: string }) =>
    post<AiBrief>({ op: "brief", ...p }),
  rewrite: (p: { text: string; platform?: string; tone?: string }) =>
    post<{ rewritten: string; title: string }>({ op: "rewrite", ...p }),
};
