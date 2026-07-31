import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-engage`;

async function post<T>(payload: Record<string, unknown>, quiet = false): Promise<T | null> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (!quiet) {
        const msg =
          res.status === 401
            ? "Sign in to use AI engagement."
            : res.status === 503
              ? "AI is temporarily unavailable — try again shortly."
              : `AI failed (${res.status}).`;
        toast.error(msg);
      }
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    if (!quiet) toast.error(`AI failed: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

export interface PostAnalysis {
  topic: string;
  summary: string;
  language: string;
  sentiment: "positive" | "neutral" | "negative";
  spam: boolean;
  sensitive: boolean;
  relevance: number;
  shouldEngage: boolean;
  suggestedActions: string[];
  reason: string;
}

export interface CommentAnalysis {
  sentiment: "positive" | "neutral" | "negative";
  intent: "question" | "compliment" | "complaint" | "lead" | "collab" | "support" | "spam" | "other";
  language: string;
  urgency: "low" | "medium" | "high";
  spam: boolean;
  summary: string;
  suggestedAction: "reply" | "assign" | "ignore" | "escalate";
}

export interface DraftResult {
  options: string[];
  platform: string;
  maxLength: number;
}

export const aiEngage = {
  /** Read someone else's post and decide whether/how to engage. */
  analyzePost: (p: {
    text: string;
    author?: string;
    platform?: string;
    keywords?: string[];
    negativeKeywords?: string[];
  }) => post<PostAnalysis>({ op: "analyze-post", ...p }),

  /** Understand an inbound comment or DM. */
  analyzeComment: (p: { text: string; author?: string; platform?: string }, quiet = false) =>
    post<CommentAnalysis>({ op: "analyze-comment", ...p }, quiet),

  /** Write human-sounding comments on someone else's post. */
  draftComment: (p: {
    text: string;
    author?: string;
    platform?: string;
    tone?: string;
    brandVoice?: string;
    language?: string;
    count?: number;
  }) => post<DraftResult>({ op: "draft-comment", ...p }),

  /** Write replies to an inbound comment or DM. */
  draftReply: (p: {
    text: string;
    author?: string;
    platform?: string;
    tone?: string;
    brandVoice?: string;
    language?: string;
    count?: number;
  }, quiet = false) => post<DraftResult>({ op: "draft-reply", ...p }, quiet),
};
