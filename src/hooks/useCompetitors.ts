import { createRemoteCollection } from "./_remoteCollection";

export interface Competitor {
  id: string;
  handle: string;
  platform: string;
  displayName?: string;
  notes?: string;
  status: "tracking" | "priority" | "archived";
  followers?: number;
  createdAt: string;
}

interface Row {
  id: string;
  user_id: string;
  handle: string;
  platform: string;
  display_name: string | null;
  notes: string | null;
  data: { status?: string; followers?: number } | null;
  created_at: string;
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
    createdAt: r.created_at,
  }),
  toInsertRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    handle: item.handle,
    platform: item.platform,
    display_name: item.displayName ?? null,
    notes: item.notes ?? null,
    data: { status: item.status, followers: item.followers },
  }),
  toUpdateRow: (patch) => {
    const row: Record<string, unknown> = {};
    if (patch.handle !== undefined) row.handle = patch.handle;
    if (patch.platform !== undefined) row.platform = patch.platform;
    if (patch.displayName !== undefined) row.display_name = patch.displayName ?? null;
    if (patch.notes !== undefined) row.notes = patch.notes ?? null;
    if (patch.status !== undefined || patch.followers !== undefined) {
      row.data = { status: patch.status, followers: patch.followers };
    }
    return row;
  },
});

export function useCompetitors() {
  return {
    items: collection.useItems(),
    add: collection.add,
    update: collection.update,
    remove: collection.remove,
  };
}
