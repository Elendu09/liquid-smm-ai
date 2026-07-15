import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

/**
 * The caption library lives in the user's browser (smmpilot:library:captions).
 * The MCP handler runs on the edge and cannot read that store, so this tool
 * returns a placeholder with clear guidance. When a shared server-side library
 * is added, swap in the real query.
 */
export default defineTool({
  name: "list_captions",
  title: "List caption library",
  description:
    "List saved captions from the user's caption library. Captions are stored in the user's browser today, so this returns a descriptive placeholder. Use `create_caption_draft` to add new drafts that appear next time the user opens the app.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const payload = {
      captions: [],
      note:
        "Captions live in the user's browser (smmpilot:library:captions). Ask them to open /dashboard/library/captions to see all captions.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
