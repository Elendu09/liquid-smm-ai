import { toast } from "sonner";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-create`;
const AUTH = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;

async function post<T>(payload: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: AUTH },
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
  brief: (p: { topic: string; goal?: string; audience?: string; platform?: string; tone?: string }) =>
    post<AiBrief>({ op: "brief", ...p }),
};
