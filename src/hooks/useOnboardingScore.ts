import { useMemo } from "react";
import { useOnboarding } from "./useOnboarding";
import { useAccounts } from "@/contexts/AccountContext";
import { useScheduledPosts } from "./useScheduledPosts";
import { useBrandVoices } from "./useBrandVoices";

export interface OnboardingScoreItem {
  id: string;
  label: string;
  points: number;
  done: boolean;
  href?: string;
}

/**
 * Buffer-style 0–100 setup score. Aggregates concrete signals that a workspace
 * is production-ready: profile, connected channels, scheduled cadence, brand
 * voice, and completion of the guided wizard.
 */
export function useOnboardingScore() {
  const { state } = useOnboarding();
  const { accounts, totalAccounts } = useAccounts();
  const { posts } = useScheduledPosts();
  const { voices } = useBrandVoices();

  const items = useMemo<OnboardingScoreItem[]>(() => {
    const profile = state.profile;
    return [
      { id: "profile", label: "Complete your profile", points: 15, done: !!profile.name && !!profile.role, href: "/dashboard/settings" },
      { id: "connect", label: "Connect at least one channel", points: 20, done: totalAccounts >= 1, href: "/dashboard/settings/accounts" },
      { id: "connect3", label: "Connect 3+ channels", points: 10, done: totalAccounts >= 3, href: "/dashboard/settings/accounts" },
      { id: "healthy", label: "All channels healthy", points: 10, done: totalAccounts > 0 && accounts.every((a) => a.status === "active"), href: "/dashboard/settings/accounts" },
      { id: "voice", label: "Define brand voice", points: 10, done: voices.length > 0, href: "/dashboard/create/voices" },
      { id: "schedule", label: "Schedule your first post", points: 15, done: posts.length >= 1, href: "/dashboard/publish/calendar" },
      { id: "cadence", label: "5+ posts in queue", points: 10, done: posts.length >= 5, href: "/dashboard/publish/queue" },
      { id: "tour", label: "Finish the guided tour", points: 10, done: state.completed },
    ];
  }, [state, totalAccounts, accounts, posts.length, voices.length]);

  const total = items.reduce((s, i) => s + i.points, 0);
  const earned = items.reduce((s, i) => s + (i.done ? i.points : 0), 0);
  const score = Math.round((earned / total) * 100);
  const nextUp = items.find((i) => !i.done);

  return { items, score, earned, total, nextUp };
}
