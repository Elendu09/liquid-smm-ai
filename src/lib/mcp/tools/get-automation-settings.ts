import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

/**
 * SMM automation settings live in the user's browser localStorage
 * (`smmpilot:settings:*`, engagement-bot rules, notification prefs, etc.).
 * The MCP handler runs on the edge and cannot read them, so this tool
 * returns the shape / defaults an agent should assume, plus guidance
 * on where the user can review them. When a shared server store is
 * added, swap in the real query.
 */
export default defineTool({
  name: "get_automation_settings",
  title: "Get automation settings",
  description:
    "Return the signed-in user's current SMM automation settings (engagement bot posture, notification channels, approval requirements, active platforms). Agents should call this before proposing actions so they respect the user's guardrails.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const settings = {
      userId: ctx.getUserId(),
      approval: {
        captionDraftsRequireApproval: true,
        scheduledPostsRequireApproval: true,
        note:
          "Write-capable MCP tools always propose items into the app's approval queue. The user reviews and approves in /dashboard/activity/mcp.",
      },
      engagementBot: {
        posture: "conservative",
        autoReply: false,
        autoFollowBack: false,
        dailyActionCap: 100,
      },
      notifications: {
        channels: ["inapp", "email"],
        digest: "weekly",
      },
      scheduling: {
        defaultLeadMinutes: 60,
        defaultIntervalMinutes: 15,
        timezone: "browser-local",
      },
      note:
        "Detailed per-event / per-platform preferences are stored in the user's browser (smmpilot:settings:*). Ask them to open /dashboard/settings for full settings.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(settings, null, 2) }],
      structuredContent: settings,
    };
  },
});
