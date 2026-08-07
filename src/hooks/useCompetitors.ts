import { createRemoteCollection } from "./_remoteCollection";

export interface CompetitorSnapshot {
  at: string;
  followers: number;
}

/** Live stats pulled from a public per-network API (when the network has one). */
export interface CompetitorLiveStats {
  followers: number;
  posts: number;
  source: string;
  fetchedAt: string;
}

export interface Competitor {
  id: string;
  handle: string;
  platform: string;
  displayName?: string;
  notes?: string;
  status: "tracking" | "priority" | "archived";
  followers?: number;
  /** Historical follower snapshots for growth-over-time charts. */
  followersHistory?: CompetitorSnapshot[];
  /** Real per-network stats, when available. */
  liveStats?: CompetitorLiveStats;
  /** Raw JSON blob persisted to the `data` column; written on update only. */
  data?: {
    status: Competitor["status"];
    followers?: number;
    followersHistory?: CompetitorSnapshot[];
    liveStats?: CompetitorLiveStats;
  };
  createdAt: string;
}

interface Row {
  id: string;
  user_id: string;
  handle: string;
  platform: string;
  display_name: string | null;
  notes: string | null;
  data: { status?: string; followers?: number; followersHistory?: CompetitorSnapshot[]; liveStats?: CompetitorLiveStats } | null;
  created_at: string;
}

interface CompetitorData {
  status: Competitor["status"];
  followers?: number;
  followersHistory?: CompetitorSnapshot[];
  liveStats?: CompetitorLiveStats;
}

const collection = createRemoteCollection<Competitor, Row>({
  table: "competitors",
  localKey: "collection:audience:competitors",
  orderBy: { column: "created_at", ascending: false },
  fromRow: (r) => ({
    id: r.id,
    handle: r.handle,
    platform: r.platform,
    displayName: r.display_name ?? undefined,
    notes: r.notes ?? undefined,
    status: (r.data?.status as Competitor["status"]) ?? "tracking",
    followers: r.data?.followers,
    followersHistory: r.data?.followersHistory ?? [],
    liveStats: r.data?.liveStats,
    createdAt: r.created_at,
  }),
  toInsertRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    handle: item.handle,
    platform: item.platform,
    display_name: item.displayName ?? null,
    notes: item.notes ?? null,
    data: {
      status: item.status,
      followers: item.followers,
      followersHistory: item.followersHistory ?? [],
      liveStats: item.liveStats,
    } satisfies CompetitorData,
  }),
  toUpdateRow: (patch) => {
    const row: Record<string, unknown> = {};
    if (patch.handle !== undefined) row.handle = patch.handle;
    if (patch.platform !== undefined) row.platform = patch.platform;
    if (patch.displayName !== undefined) row.display_name = patch.displayName ?? null;
    if (patch.notes !== undefined) row.notes = patch.notes ?? null;
    // `data` is passed through whole so status/followers/history never clobber
    // each other across partial updates.
    if (patch.data !== undefined) row.data = patch.data;
    return row;
  },
});

export function useCompetitors() {
  /** Merge partial updates into the full `data` blob so nothing is lost. */
  const update = async (id: string, patch: Partial<Competitor>) => {
    const current = collection.read().find((c) => c.id === id);
    const data: CompetitorData = {
      status: patch.status ?? current?.status ?? "tracking",
      followers: patch.followers !== undefined ? patch.followers : current?.followers,
      followersHistory: patch.followersHistory ?? current?.followersHistory ?? [],
      liveStats: patch.liveStats !== undefined ? patch.liveStats : current?.liveStats,
    };
    await collection.update(id, { ...patch, data });
  };

  /** Record a follower snapshot now (appends to the growth history). */
  const recordSnapshot = async (id: string, followers: number) => {
    const current = collection.read().find((c) => c.id === id);
    if (!current) return;
    const history = [...(current.followersHistory ?? []), { at: new Date().toISOString(), followers }];
    await update(id, { followers, followersHistory: history });
  };

  return {
    items: collection.useItems(),
    add: collection.add,
    update,
    remove: collection.remove,
    recordSnapshot,
    read: collection.read,
  };
}
