import { createRemoteCollection } from "./_remoteCollection";

export type SegmentStatus = "active" | "testing" | "paused";

export interface AudienceSegment {
  id: string;
  title: string;
  description: string;
  status: SegmentStatus;
  niche?: string;
  platforms: string[];
  followerBucket: string;
  engagementBucket: string;
  keywords: string[];
  createdAt: string;
}

interface Row {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  niche: string | null;
  platforms: string[] | null;
  follower_bucket: string;
  engagement_bucket: string;
  keywords: string[] | null;
  created_at: string;
}

const seed: AudienceSegment[] = [
  {
    id: "s1",
    title: "Micro fitness creators",
    description: "US-based creators, 1–10k, high engagement, wellness niche",
    status: "active",
    niche: "Fitness & wellness",
    platforms: ["instagram", "tiktok"],
    followerBucket: "10k",
    engagementBucket: "high",
    keywords: ["fitness", "wellness", "workout"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s2",
    title: "SaaS founders",
    description: "LinkedIn + X, mid-tier, product & startup keywords",
    status: "testing",
    niche: "SaaS & tech",
    platforms: ["linkedin", "twitter"],
    followerBucket: "100k",
    engagementBucket: "mid",
    keywords: ["saas", "founder", "startup"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s3",
    title: "E-commerce shoppers",
    description: "Facebook + Instagram, deal hunters, beauty & fashion",
    status: "active",
    niche: "E-commerce",
    platforms: ["facebook", "instagram"],
    followerBucket: "50k",
    engagementBucket: "high",
    keywords: ["shop", "beauty", "fashion"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s4",
    title: "Local foodies",
    description: "YouTube + TikTok, recipe & restaurant niche, local geo",
    status: "paused",
    niche: "Food & dining",
    platforms: ["youtube", "tiktok"],
    followerBucket: "10k",
    engagementBucket: "mid",
    keywords: ["food", "recipe", "restaurant"],
    createdAt: new Date().toISOString(),
  },
];

const collection = createRemoteCollection<AudienceSegment, Row>({
  table: "audience_segments",
  localKey: "collection:audience:segments",
  seed,
  orderBy: { column: "created_at", ascending: false },
  fromRow: (r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    status: (r.status as SegmentStatus) ?? "testing",
    niche: r.niche ?? undefined,
    platforms: r.platforms ?? [],
    followerBucket: r.follower_bucket,
    engagementBucket: r.engagement_bucket,
    keywords: r.keywords ?? [],
    createdAt: r.created_at,
  }),
  toInsertRow: (item, userId) => ({
    id: item.id,
    user_id: userId,
    title: item.title,
    description: item.description,
    status: item.status,
    niche: item.niche ?? null,
    platforms: item.platforms,
    follower_bucket: item.followerBucket,
    engagement_bucket: item.engagementBucket,
    keywords: item.keywords,
    created_at: item.createdAt,
  }),
  toUpdateRow: (patch) => {
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.niche !== undefined) row.niche = patch.niche ?? null;
    if (patch.platforms !== undefined) row.platforms = patch.platforms;
    if (patch.followerBucket !== undefined) row.follower_bucket = patch.followerBucket;
    if (patch.engagementBucket !== undefined) row.engagement_bucket = patch.engagementBucket;
    if (patch.keywords !== undefined) row.keywords = patch.keywords;
    return row;
  },
});

export function useAudienceSegments() {
  const items = collection.useItems();
  return {
    items,
    add: collection.add,
    update: collection.update,
    remove: collection.remove,
    setItems: collection.replace,
  };
}
