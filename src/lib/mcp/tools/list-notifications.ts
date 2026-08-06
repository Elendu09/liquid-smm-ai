import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { edgeSupabase, requireAuth, tableResult } from "../helpers";

export default defineTool({
  name: "list_notifications",
  title: "List notifications",
  description:
    "List the signed-in user's recent in-app notifications (engagement, milestones, alerts, reminders, system) with severity and read state. Use this to check for alerts, sync failures or milestone updates.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Number of notifications to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input: { limit?: number }, ctx: ToolContext) => {
    const auth = requireAuth(ctx);
    if (!auth.ok) return auth;
    const limit = Math.min(50, Math.max(1, Number(input.limit ?? 10) || 10));
    const db = edgeSupabase(ctx);
    const { data, error } = await db
      .from("notifications")
      .select("id, type, severity, title, message, action_url, read_at, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    const unread = (data ?? []).filter((n) => !n.read_at).length;
    return tableResult(data ?? [], `${(data ?? []).length} notification(s), ${unread} unread`);
  },
});
