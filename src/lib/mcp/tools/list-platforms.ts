import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

const PLATFORMS = [
  "instagram", "facebook", "tiktok", "youtube", "twitter", "linkedin",
  "pinterest", "snapchat", "threads", "reddit", "discord", "telegram",
  "whatsapp", "twitch",
];

export default defineTool({
  name: "list_platforms",
  title: "List supported platforms",
  description: "Return the list of social platforms this SMM app supports.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    return {
      content: [{ type: "text", text: PLATFORMS.join(", ") }],
      structuredContent: { platforms: PLATFORMS },
    };
  },
});
