import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

/**
 * NOTE: scheduled posts currently live in the user's browser localStorage
 * (`smmpilot:scheduled-posts`). This handler runs in a Deno edge function and
 * cannot read that store. Until a shared backend queue is wired, this tool
 * returns a stable placeholder so external assistants receive a clear,
 * non-error response describing where to look.
 */
export default defineTool({
  name: "list_scheduled_posts",
  title: "List scheduled posts",
  description:
    "List the user's scheduled cross-platform posts. Scheduled posts live in the user's browser storage today, so this returns a descriptive placeholder rather than fabricated data.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const payload = {
      posts: [],
      note:
        "Scheduled posts are stored locally in the user's browser (smmpilot:scheduled-posts). Ask the user to open /dashboard/publish/queue to see them, or use queue_cross_platform_post to add a new one.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
