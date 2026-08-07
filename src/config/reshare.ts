import { allPlatformIds, getPlatformById, platforms } from "@/config/platforms";

/**
 * Capability and transformation metadata for the Reshare Engine.
 *
 * Reshare is deliberately modeled as a delivery operation rather than a
 * blind copy. Every destination can receive a native payload, a transformed
 * caption, and a media treatment that is safe for that network. The UI uses
 * this matrix to explain why a destination is ready, needs adaptation, or is
 * unavailable.
 */
export type ReshareMediaKind = "text" | "image" | "video" | "carousel" | "link";
export type ReshareMode = "instant" | "scheduled" | "approval" | "n8n";
export type ReshareTransform = "native" | "adapt" | "shorten" | "thread" | "visual";

export interface ReshareCapability {
  platformId: string;
  publish: boolean;
  media: ReshareMediaKind[];
  formats: string[];
  maxCaption: number;
  canSchedule: boolean;
  canReceiveWebhooks: boolean;
  supportsAltText: boolean;
  supportsLinks: boolean;
  supportsThreads: boolean;
  caveat?: string;
}

export interface ReshareDestination {
  platformId: string;
  enabled: boolean;
  transform: ReshareTransform;
  accountId?: string;
  captionOverride?: string;
  delayMinutes?: number;
}

export interface ReshareFlow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  sourcePlatform: string;
  sourceAccountId?: string;
  destinations: ReshareDestination[];
  mode: ReshareMode;
  schedule: string;
  timezone: string;
  includeMedia: boolean;
  includeCaption: boolean;
  includeLink: boolean;
  requireApproval: boolean;
  n8nWorkflowId?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  metrics: {
    runs: number;
    delivered: number;
    queued: number;
    failed: number;
    savedMinutes: number;
  };
  createdAt: string;
  updatedAt: string;
}

const BASE_CAPABILITY: Omit<ReshareCapability, "platformId"> = {
  publish: true,
  media: ["text", "image", "video"],
  formats: ["native"],
  maxCaption: 1000,
  canSchedule: true,
  canReceiveWebhooks: true,
  supportsAltText: false,
  supportsLinks: true,
  supportsThreads: false,
};

/** Every platform currently represented by the product has an explicit entry. */
export const RESHARE_CAPABILITIES: Record<string, ReshareCapability> = {
  instagram: {
    ...BASE_CAPABILITY,
    platformId: "instagram",
    media: ["image", "video", "carousel"],
    formats: ["feed", "reel", "story", "carousel"],
    maxCaption: 2200,
    supportsAltText: true,
    supportsLinks: false,
    caveat: "Links are kept in the caption only as plain text.",
  },
  tiktok: {
    ...BASE_CAPABILITY,
    platformId: "tiktok",
    media: ["video", "image"],
    formats: ["video", "photo mode", "story"],
    maxCaption: 2200,
    supportsAltText: false,
    supportsLinks: false,
    caveat: "Video is required for a native TikTok post; image sources use Photo Mode.",
  },
  youtube: {
    ...BASE_CAPABILITY,
    platformId: "youtube",
    media: ["video", "image", "text"],
    formats: ["video", "short", "community"],
    maxCaption: 5000,
    supportsAltText: true,
    supportsThreads: false,
    caveat: "A video source is routed to Shorts when it is under 60 seconds.",
  },
  twitter: {
    ...BASE_CAPABILITY,
    platformId: "twitter",
    media: ["text", "image", "video", "link"],
    formats: ["post", "thread", "quote"],
    maxCaption: 280,
    supportsAltText: true,
    supportsThreads: true,
    caveat: "Long captions are shortened or split into a thread.",
  },
  facebook: {
    ...BASE_CAPABILITY,
    platformId: "facebook",
    media: ["text", "image", "video", "carousel", "link"],
    formats: ["page post", "reel", "story", "event"],
    maxCaption: 63206,
    supportsAltText: true,
    caveat: "Destination account must be a Page or approved Business account.",
  },
  linkedin: {
    ...BASE_CAPABILITY,
    platformId: "linkedin",
    media: ["text", "image", "video", "carousel", "link"],
    formats: ["post", "article", "document"],
    maxCaption: 3000,
    supportsAltText: true,
    caveat: "Personal profiles and company pages use separate connected accounts.",
  },
  threads: {
    ...BASE_CAPABILITY,
    platformId: "threads",
    media: ["text", "image", "video", "link"],
    formats: ["post", "reply", "quote"],
    maxCaption: 500,
    supportsAltText: true,
    supportsThreads: true,
    caveat: "The original post URL is converted to a plain-text reference.",
  },
  pinterest: {
    ...BASE_CAPABILITY,
    platformId: "pinterest",
    media: ["image", "video", "link"],
    formats: ["pin", "idea pin", "product pin"],
    maxCaption: 500,
    supportsAltText: true,
    caveat: "A destination board is required before publishing.",
  },
  snapchat: {
    ...BASE_CAPABILITY,
    platformId: "snapchat",
    media: ["image", "video"],
    formats: ["story", "spotlight"],
    maxCaption: 80,
    supportsLinks: false,
    caveat: "Text-only sources cannot be published to Snapchat.",
  },
  reddit: {
    ...BASE_CAPABILITY,
    platformId: "reddit",
    media: ["text", "image", "video", "link"],
    formats: ["post", "crosspost", "comment"],
    maxCaption: 40000,
    supportsLinks: true,
    caveat: "A subreddit is selected from the connected Reddit account.",
  },
  telegram: {
    ...BASE_CAPABILITY,
    platformId: "telegram",
    media: ["text", "image", "video", "carousel", "link"],
    formats: ["channel post", "group post", "album"],
    maxCaption: 4096,
    supportsAltText: false,
    caveat: "The bot must be an administrator of the destination channel.",
  },
  discord: {
    ...BASE_CAPABILITY,
    platformId: "discord",
    media: ["text", "image", "video", "link"],
    formats: ["message", "announcement", "embed"],
    maxCaption: 2000,
    supportsAltText: true,
    caveat: "A channel webhook is required for a Discord destination.",
  },
  whatsapp: {
    ...BASE_CAPABILITY,
    platformId: "whatsapp",
    media: ["text", "image", "video", "link"],
    formats: ["status", "broadcast", "template"],
    maxCaption: 700,
    canSchedule: false,
    supportsLinks: true,
    caveat: "Outbound broadcasts use an approved WhatsApp Business template.",
  },
  bluesky: {
    ...BASE_CAPABILITY,
    platformId: "bluesky",
    media: ["text", "image", "video", "link"],
    formats: ["post", "reply", "quote"],
    maxCaption: 300,
    supportsAltText: true,
    supportsThreads: true,
    caveat: "Long copy is split into a thread when enabled.",
  },
  "google-business": {
    ...BASE_CAPABILITY,
    platformId: "google-business",
    media: ["text", "image", "video", "link"],
    formats: ["update", "offer", "event"],
    maxCaption: 1500,
    supportsAltText: true,
    caveat: "Google Business destinations publish as Updates, Offers, or Events.",
  },
};

export const RESHARE_PLATFORM_IDS = allPlatformIds.filter((id) => Boolean(RESHARE_CAPABILITIES[id]));

export const RESHARE_MODES: Array<{ id: ReshareMode; label: string; description: string }> = [
  { id: "instant", label: "Instant", description: "Send to ready destinations as soon as the source lands." },
  { id: "scheduled", label: "Staggered", description: "Add a delay between each destination to create a natural cadence." },
  { id: "approval", label: "Approval gate", description: "Generate adapted drafts and wait for a teammate to approve." },
  { id: "n8n", label: "n8n workflow", description: "Hand the event to n8n for branching, enrichment, and delivery." },
];

export function capabilityFor(platformId: string): ReshareCapability {
  return RESHARE_CAPABILITIES[platformId] ?? {
    ...BASE_CAPABILITY,
    platformId,
    media: ["text"],
    formats: ["native"],
    canReceiveWebhooks: false,
    caveat: "Connect this channel to unlock delivery.",
  };
}

export function platformName(platformId: string): string {
  return getPlatformById(platformId)?.name ?? platformId;
}

export function platformShortName(platformId: string): string {
  return getPlatformById(platformId)?.shortName ?? platformId.slice(0, 2).toUpperCase();
}

export function destinationReadiness(sourcePlatform: string, destinationPlatform: string): "ready" | "adapt" | "blocked" {
  if (sourcePlatform === destinationPlatform) return "ready";
  const source = capabilityFor(sourcePlatform);
  const destination = capabilityFor(destinationPlatform);
  if (!destination.publish || !destination.canReceiveWebhooks) return "blocked";
  if (source.media.every((kind) => destination.media.includes(kind))) return "ready";
  return "adapt";
}

export function defaultTransform(sourcePlatform: string, destinationPlatform: string): ReshareTransform {
  const readiness = destinationReadiness(sourcePlatform, destinationPlatform);
  if (readiness === "ready") return "native";
  const destination = capabilityFor(destinationPlatform);
  if (destination.supportsThreads && destination.maxCaption < 500) return "thread";
  if (destination.media.includes("video")) return "visual";
  return "adapt";
}

export function enabledDestinations(flow: ReshareFlow): ReshareDestination[] {
  return flow.destinations.filter((destination) => destination.enabled);
}

export function estimateDeliveryCount(flow: ReshareFlow): number {
  return Math.max(0, enabledDestinations(flow).length * Math.max(1, flow.metrics.runs));
}

export function createDefaultReshareFlow(sourcePlatform = "instagram"): ReshareFlow {
  const now = new Date().toISOString();
  const targets = RESHARE_PLATFORM_IDS.filter((id) => id !== sourcePlatform).slice(0, 4);
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}`;
  return {
    id,
    name: "Launch content everywhere",
    description: "Adapt every new source post for the connected channels.",
    enabled: true,
    sourcePlatform,
    destinations: targets.map((platformId) => ({
      platformId,
      enabled: true,
      transform: defaultTransform(sourcePlatform, platformId),
      delayMinutes: 0,
    })),
    mode: "approval",
    schedule: "Every new post",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    includeMedia: true,
    includeCaption: true,
    includeLink: true,
    requireApproval: true,
    nextRunAt: "On next source post",
    metrics: { runs: 24, delivered: 88, queued: 3, failed: 1, savedMinutes: 720 },
    createdAt: now,
    updatedAt: now,
  };
}

export function createN8nWebhookPayload(flow: ReshareFlow, event = "content.published") {
  return {
    event,
    source: {
      platform: flow.sourcePlatform,
      accountId: flow.sourceAccountId ?? null,
    },
    destinations: enabledDestinations(flow).map((destination) => ({
      platform: destination.platformId,
      transform: destination.transform,
      delayMinutes: destination.delayMinutes ?? 0,
      accountId: destination.accountId ?? null,
    })),
    content: {
      includeMedia: flow.includeMedia,
      includeCaption: flow.includeCaption,
      includeLink: flow.includeLink,
    },
    delivery: {
      mode: flow.mode,
      approvalRequired: flow.requireApproval,
      timezone: flow.timezone,
    },
    meta: {
      flowId: flow.id,
      flowName: flow.name,
      generatedAt: new Date().toISOString(),
    },
  };
}

export function createN8nWorkflowJson(flow: ReshareFlow, webhookUrl = "https://your-n8n.example.com/webhook/reshare") {
  const inputId = "reshare-input";
  const normalizeId = "reshare-normalize";
  const splitId = "reshare-split";
  const destinationIds = enabledDestinations(flow).map((destination) => `send-${destination.platformId}`);
  const nodes = [
    {
      parameters: { httpMethod: "POST", path: "smmsaas/reshare", responseMode: "onReceived" },
      id: inputId,
      name: "SMMSAAS · Reshare trigger",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [240, 300],
      webhookId: "smmsaas-reshare",
    },
    {
      parameters: { jsCode: "return [{ json: { ...$json, receivedAt: new Date().toISOString(), source: $json.source ?? {} } }];" },
      id: normalizeId,
      name: "Normalize source payload",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [500, 300],
    },
    {
      parameters: { fieldToSplitOut: "destinations", include: "allOtherFields" },
      id: splitId,
      name: "Split destinations",
      type: "n8n-nodes-base.splitOut",
      typeVersion: 1,
      position: [760, 300],
    },
    ...enabledDestinations(flow).map((destination, index) => ({
      parameters: {
        method: "POST",
        url: webhookUrl,
        sendBody: true,
        specifyBody: "json",
        jsonBody: JSON.stringify({
          destination: destination.platformId,
          transform: destination.transform,
          flowId: flow.id,
        }),
      },
      id: destinationIds[index],
      name: `Deliver · ${platformName(destination.platformId)}`,
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4,
      position: [1040, 180 + index * 120],
    })),
  ];
  const connections: Record<string, { main: Array<Array<{ node: string; type: string; index: number }>> }> = {
    [nodes[0].name]: { main: [[{ node: nodes[1].name, type: "main", index: 0 }]] },
    [nodes[1].name]: { main: [[{ node: nodes[2].name, type: "main", index: 0 }]] },
    [nodes[2].name]: { main: [destinationIds.map((id) => ({ node: nodes.find((n) => n.id === id)?.name ?? id, type: "main", index: 0 }))] },
  };
  return {
    name: `SMMSAAS · ${flow.name}`,
    nodes,
    connections,
    active: false,
    settings: { executionOrder: "v1" },
    tags: [{ name: "smmsaas" }, { name: "reshare" }],
    meta: { templateCredsSetupCompleted: true, source: "smmsaas" },
  };
}

export function flowHealth(flow: ReshareFlow): { label: string; tone: "good" | "warn" | "bad" } {
  if (!flow.enabled) return { label: "Paused", tone: "warn" };
  if (flow.metrics.failed > flow.metrics.delivered * 0.05) return { label: "Needs attention", tone: "bad" };
  if (flow.metrics.queued > 0) return { label: "Review queued", tone: "warn" };
  return { label: "Healthy", tone: "good" };
}

export function supportedMediaLabel(platformId: string): string {
  return capabilityFor(platformId).media.map((kind) => kind[0].toUpperCase() + kind.slice(1)).join(" · ");
}

export const reshareEventOptions = [
  { id: "content.published", label: "A source post is published" },
  { id: "content.approved", label: "A source post is approved" },
  { id: "content.updated", label: "A source post is updated" },
  { id: "rss.item.received", label: "An RSS item is received" },
] as const;

export function normalizeTargetList(sourcePlatform: string, destinationIds: string[]): ReshareDestination[] {
  return destinationIds
    .filter((platformId) => platformId !== sourcePlatform && Boolean(RESHARE_CAPABILITIES[platformId]))
    .map((platformId) => ({
      platformId,
      enabled: true,
      transform: defaultTransform(sourcePlatform, platformId),
      delayMinutes: 0,
    }));
}

export function platformIsAvailable(platformId: string): boolean {
  return platforms.some((platform) => platform.id === platformId) && Boolean(RESHARE_CAPABILITIES[platformId]);
}
