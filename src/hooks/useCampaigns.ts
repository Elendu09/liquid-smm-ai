import { useCallback } from "react";
import { createRemoteCollection } from "./_remoteCollection";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  brief: string;
  audience: string;
  tone: string;
  color: string;
  status: CampaignStatus;
  platformIds: string[];
  startDate: string | null;
  endDate: string | null;
  goalPosts: number;
  goalReach: number;
  goalEngagement: number;
  archived: boolean;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface Row {
  id: string;
  user_id: string;
  name: string;
  objective: string;
  brief: string;
  audience: string;
  tone: string;
  color: string;
  status: string;
  platform_ids: string[];
  start_date: string | null;
  end_date: string | null;
  goal_posts: number;
  goal_reach: number;
  goal_engagement: number;
  archived: boolean;
  meta: unknown;
  created_at: string;
  updated_at: string;
}

const collection = createRemoteCollection<Campaign, Row>({
  table: "campaigns",
  localKey: "smmpilot:campaigns",
  orderBy: { column: "created_at", ascending: false },
  fromRow: (r) => ({
    id: r.id,
    name: r.name,
    objective: r.objective ?? "awareness",
    brief: r.brief ?? "",
    audience: r.audience ?? "",
    tone: r.tone ?? "",
    color: r.color ?? "#6366f1",
    status: (r.status as CampaignStatus) ?? "draft",
    platformIds: r.platform_ids ?? [],
    startDate: r.start_date,
    endDate: r.end_date,
    goalPosts: Number(r.goal_posts ?? 0),
    goalReach: Number(r.goal_reach ?? 0),
    goalEngagement: Number(r.goal_engagement ?? 0),
    archived: !!r.archived,
    meta: (r.meta as Record<string, unknown>) ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
  toInsertRow: (c, user_id) => ({
    id: c.id,
    user_id,
    name: c.name,
    objective: c.objective,
    brief: c.brief,
    audience: c.audience,
    tone: c.tone,
    color: c.color,
    status: c.status,
    platform_ids: c.platformIds,
    start_date: c.startDate,
    end_date: c.endDate,
    goal_posts: c.goalPosts,
    goal_reach: c.goalReach,
    goal_engagement: c.goalEngagement,
    archived: c.archived,
    meta: c.meta,
  }),
  toUpdateRow: (p) => {
    const row: Record<string, unknown> = {};
    if (p.name !== undefined) row.name = p.name;
    if (p.objective !== undefined) row.objective = p.objective;
    if (p.brief !== undefined) row.brief = p.brief;
    if (p.audience !== undefined) row.audience = p.audience;
    if (p.tone !== undefined) row.tone = p.tone;
    if (p.color !== undefined) row.color = p.color;
    if (p.status !== undefined) row.status = p.status;
    if (p.platformIds !== undefined) row.platform_ids = p.platformIds;
    if (p.startDate !== undefined) row.start_date = p.startDate;
    if (p.endDate !== undefined) row.end_date = p.endDate;
    if (p.goalPosts !== undefined) row.goal_posts = p.goalPosts;
    if (p.goalReach !== undefined) row.goal_reach = p.goalReach;
    if (p.goalEngagement !== undefined) row.goal_engagement = p.goalEngagement;
    if (p.archived !== undefined) row.archived = p.archived;
    if (p.meta !== undefined) row.meta = p.meta;
    return row;
  },
});

export function useCampaigns() {
  const items = collection.useItems();

  const create = useCallback(async (input: Partial<Campaign> & { name: string }) => {
    const now = new Date().toISOString();
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      name: input.name,
      objective: input.objective ?? "awareness",
      brief: input.brief ?? "",
      audience: input.audience ?? "",
      tone: input.tone ?? "confident, helpful",
      color: input.color ?? "#6366f1",
      status: input.status ?? "draft",
      platformIds: input.platformIds ?? [],
      startDate: input.startDate ?? now.slice(0, 10),
      endDate: input.endDate ?? null,
      goalPosts: input.goalPosts ?? 0,
      goalReach: input.goalReach ?? 0,
      goalEngagement: input.goalEngagement ?? 0,
      archived: false,
      meta: input.meta ?? {},
      createdAt: now,
      updatedAt: now,
    };
    await collection.add(campaign);
    return campaign;
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<Campaign>) => collection.update(id, patch),
    [],
  );
  const remove = useCallback((id: string) => collection.remove(id), []);

  return { campaigns: items.filter((c) => !c.archived), all: items, create, update, remove };
}
