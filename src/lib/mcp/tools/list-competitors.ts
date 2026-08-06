import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { edgeSupabase, requireAuth, tableResult } from "../helpers";

export default defineTool({
  name: "list_competitors",
  title: "List tracked competitors",
  description:
    "List the signed-in user's tracked competitors across all platforms (Instagram, TikTok, YouTube, X, LinkedIn, Threads, Reddit, Bluesky and more). Returns handle, platform, display name, status and follower count.",
  inputSchema: {
    platform: z.string().optional().describe("Optional platform filter (e.g. instagram, github)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input: { platform?: string }, ctx: ToolContext) => {
    const auth = requireAuth(ctx);
    if (!auth.ok) return auth;
    const db = edgeSupabase(ctx);
    let q = db.from("competitors").select("id, handle, platform, display_name, notes, data, created_at").eq("user_id", ctx.getUserId());
    if (input.platform) q = q.eq("platform", input.platform.toLowerCase());
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return tableResult(data ?? [], `${(data ?? []).length} tracked competitor(s)`);
  },
});
