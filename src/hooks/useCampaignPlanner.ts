import { useCallback, useState } from "react";
import { toast } from "sonner";
import { fnBearer } from "@/lib/fnAuth";

const URL_ = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/campaign-plan`;
const APIKEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface PlannedPost {
  day: number;
  platform: string;
  hook: string;
  caption: string;
  hashtags: string[];
  format: string;
}

export interface CampaignPlan {
  themes: string[];
  posts: PlannedPost[];
}

export interface PlanInput {
  name: string;
  objective?: string;
  brief?: string;
  audience?: string;
  tone?: string;
  platforms?: string[];
  days?: number;
  postsPerWeek?: number;
}

/** Calls the metered `campaign-plan` edge function. */
export function useCampaignPlanner() {
  const [loading, setLoading] = useState(false);

  const plan = useCallback(async (input: PlanInput): Promise<CampaignPlan | null> => {
    setLoading(true);
    try {
      const res = await fetch(URL_, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: APIKEY,
          Authorization: `Bearer ${await fnBearer()}`,
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const text = await res.text();
        toast.error(
          res.status === 402
            ? "Not enough credits for a campaign plan."
            : res.status === 429
              ? "Rate limited — try again shortly."
              : `Planning failed (${res.status}). ${text.slice(0, 120)}`,
        );
        return null;
      }
      const data = (await res.json()) as CampaignPlan & {
        _credits?: { spent: number; remaining: number };
      };
      if (data._credits) {
        toast.success(
          `Plan ready — ${data._credits.spent} credits used, ${data._credits.remaining} left.`,
        );
      }
      return { themes: data.themes ?? [], posts: data.posts ?? [] };
    } catch (e) {
      toast.error(`Planning failed: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { plan, loading };
}
