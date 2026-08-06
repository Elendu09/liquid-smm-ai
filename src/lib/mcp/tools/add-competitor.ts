import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { edgeSupabase, requireAuth, tableResult } from "../helpers";

export default defineTool({
  name: "add_competitor",
  title: "Track a competitor",
  description:
    "Start tracking a competitor for the signed-in user. Pass the platform (instagram, tiktok, youtube, twitter, linkedin, facebook, threads, pinterest, reddit, bluesky) and their handle/username. Write tools require user approval inside the app.",
  inputSchema: {
    platform: z.string().describe("Platform the competitor is on (e.g. instagram, github)."),
    handle: z.string().describe("The competitor's handle or username on that platform."),
    displayName: z.string().optional().describe("Optional display name."),
    notes: z.string().optional().describe("Optional note about this competitor."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input: { platform: string; handle: string; displayName?: string; notes?: string }, ctx: ToolContext) => {
    const auth = requireAuth(ctx);
    if (!auth.ok) return auth;
    const db = edgeSupabase(ctx);
    const row = {
      user_id: ctx.getUserId(),
      platform: input.platform.toLowerCase(),
      handle: input.handle.trim(),
      display_name: input.displayName?.trim() || null,
      notes: input.notes?.trim() || null,
      data: { status: "tracking" },
    };
    const { data, error } = await db.from("competitors").insert(row).select("id, handle, platform").maybeSingle();
    if (error) {
      if (String(error.code ?? "").startsWith("23")) {
        return { content: [{ type: "text", text: "This competitor is already being tracked." }], isError: false };
      }
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return tableResult(data ?? {}, `Now tracking ${input.handle} on ${input.platform}.`);
  },
});
