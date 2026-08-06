import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { edgeSupabase, requireAuth, tableResult } from "../helpers";

export default defineTool({
  name: "list_rss_feeds",
  title: "List RSS feeds",
  description:
    "List the signed-in user's RSS automation feeds with their URL, poll interval, last fetch status, item counts, target platforms and errors. Use this before proposing any RSS-related action.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input: unknown, ctx: ToolContext) => {
    const auth = requireAuth(ctx);
    if (!auth.ok) return auth;
    const db = edgeSupabase(ctx);
    const { data, error } = await db
      .from("rss_feeds")
      .select("id, url, title, target_platforms, filter_keywords, exclude_keywords, auto_publish, poll_interval_minutes, last_fetched_at, last_status, last_error, active")
      .eq("owner_id", ctx.getUserId())
      .order("created_at", { ascending: false });
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return tableResult(data ?? [], `${(data ?? []).length} RSS feed(s)`);
  },
});
