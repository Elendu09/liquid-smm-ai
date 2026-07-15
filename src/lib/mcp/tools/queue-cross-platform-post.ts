import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

const SUPPORTED_PLATFORMS = [
  "instagram", "facebook", "tiktok", "youtube", "twitter", "linkedin",
  "pinterest", "snapchat", "threads", "reddit", "discord", "telegram",
  "whatsapp", "twitch",
];

export default defineTool({
  name: "queue_cross_platform_post",
  title: "Queue cross-platform post",
  description:
    "Draft a scheduled cross-platform post plan for the signed-in user. Returns a validated post record ready to be added to the queue on the user's next app open.",
  inputSchema: {
    caption: z.string().min(1).max(4000).describe("Post caption text."),
    platformIds: z
      .array(z.string())
      .min(1)
      .describe("Platforms to publish to. Must come from the app's supported set."),
    scheduledAt: z.string().describe("ISO 8601 timestamp to publish at."),
    hashtags: z.array(z.string()).optional().describe("Hashtags without leading #."),
    mediaUrl: z.string().url().optional().describe("Optional media URL."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  needsApproval: true,
  handler: (input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const unknownPlatforms = input.platformIds.filter((p) => !SUPPORTED_PLATFORMS.includes(p));
    if (unknownPlatforms.length > 0) {
      return {
        content: [
          {
            type: "text",
            text: `Unsupported platforms: ${unknownPlatforms.join(", ")}. Supported: ${SUPPORTED_PLATFORMS.join(", ")}.`,
          },
        ],
        isError: true,
      };
    }
    const when = new Date(input.scheduledAt);
    if (Number.isNaN(when.getTime())) {
      return { content: [{ type: "text", text: "scheduledAt must be a valid ISO 8601 timestamp." }], isError: true };
    }

    const record = {
      id: crypto.randomUUID(),
      caption: input.caption,
      platformIds: input.platformIds,
      scheduledAt: when.toISOString(),
      hashtags: input.hashtags ?? [],
      mediaUrl: input.mediaUrl,
      createdAt: new Date().toISOString(),
      source: "mcp:queue_cross_platform_post",
      userId: ctx.getUserId(),
    };

    return {
      content: [
        {
          type: "text",
          text: `Queued cross-platform post for ${input.platformIds.join(", ")} at ${when.toISOString()}.`,
        },
      ],
      structuredContent: { post: record },
    };
  },
});
