import type { ConnectedAccount } from "@/contexts/AccountContext";
import type { Competitor } from "@/hooks/useCompetitors";

export interface BenchmarkEntity {
  id: string;
  label: string;
  platform: string;
  followers: number;
  engagement: number;
  postsPerWeek: number;
  isYou: boolean;
}

export interface BenchmarkRow extends BenchmarkEntity {
  rank: number;
  shareOfVoice: number;
  followerGap: number;
  engagementGap: number;
  score: number;
}

export interface BenchmarkSummary {
  rows: BenchmarkRow[];
  you: BenchmarkRow | null;
  leader: BenchmarkRow | null;
  medianEngagement: number;
  medianFollowers: number;
  totalFollowers: number;
  yourRank: number;
  competitorCount: number;
}

/** Deterministic pseudo-random in [0,1) so demo estimates stay stable per handle. */
function seeded(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function competitorToEntity(c: Competitor, referenceFollowers: number): BenchmarkEntity {
  const r = seeded(c.handle + c.platform);
  const followers =
    c.followers && c.followers > 0
      ? c.followers
      : Math.round((referenceFollowers || 8000) * (0.45 + r * 1.6));
  return {
    id: c.id,
    label: c.displayName || `@${c.handle.replace(/^@/, "")}`,
    platform: c.platform,
    followers,
    engagement: Number((1.4 + seeded(c.handle + "e") * 6).toFixed(2)),
    postsPerWeek: Math.max(1, Math.round(2 + seeded(c.handle + "p") * 12)),
    isYou: false,
  };
}

export function accountToEntity(a: ConnectedAccount): BenchmarkEntity {
  return {
    id: a.id,
    label: a.displayName || a.username,
    platform: a.platformId,
    followers: a.followers,
    engagement: Number((a.engagement || 0).toFixed(2)),
    postsPerWeek: Math.max(1, Math.round((a.posts || 0) / 52) || 3),
    isYou: true,
  };
}

/**
 * Blend of reach (followers) and quality (engagement) normalised against the
 * strongest entity in the set — this is what drives the leaderboard ranking.
 */
function scoreOf(e: BenchmarkEntity, maxFollowers: number, maxEngagement: number) {
  const reach = maxFollowers ? e.followers / maxFollowers : 0;
  const quality = maxEngagement ? e.engagement / maxEngagement : 0;
  return Math.round((reach * 0.55 + quality * 0.45) * 100);
}

export function buildBenchmarks(
  accounts: ConnectedAccount[],
  competitors: Competitor[],
  platform: string | "all",
): BenchmarkSummary {
  const scopedAccounts = accounts.filter(
    (a) => platform === "all" || a.platformId === platform,
  );
  const referenceFollowers =
    scopedAccounts.reduce((s, a) => s + a.followers, 0) / (scopedAccounts.length || 1);

  const you = scopedAccounts.map(accountToEntity);
  const them = competitors
    .filter((c) => c.status !== "archived")
    .filter((c) => platform === "all" || c.platform === platform)
    .map((c) => competitorToEntity(c, referenceFollowers));

  const entities = [...you, ...them];
  const totalFollowers = entities.reduce((s, e) => s + e.followers, 0);
  const maxFollowers = Math.max(1, ...entities.map((e) => e.followers));
  const maxEngagement = Math.max(0.1, ...entities.map((e) => e.engagement));
  const medianEngagement = median(entities.map((e) => e.engagement));
  const medianFollowers = median(entities.map((e) => e.followers));

  const rows: BenchmarkRow[] = entities
    .map((e) => ({
      ...e,
      rank: 0,
      shareOfVoice: totalFollowers ? (e.followers / totalFollowers) * 100 : 0,
      followerGap: medianFollowers ? ((e.followers - medianFollowers) / medianFollowers) * 100 : 0,
      engagementGap: medianEngagement ? ((e.engagement - medianEngagement) / medianEngagement) * 100 : 0,
      score: scoreOf(e, maxFollowers, maxEngagement),
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const yourBest = rows.find((r) => r.isYou) ?? null;

  return {
    rows,
    you: yourBest,
    leader: rows[0] ?? null,
    medianEngagement,
    medianFollowers,
    totalFollowers,
    yourRank: yourBest?.rank ?? 0,
    competitorCount: them.length,
  };
}
