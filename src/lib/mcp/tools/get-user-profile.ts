import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

/**
 * Returns the identity + basic profile of the signed-in user derived
 * from their verified access token. Extend this handler to hit a real
 * `profiles` table once one is added.
 */
export default defineTool({
  name: "get_user_profile",
  title: "Get user profile",
  description:
    "Return the signed-in SMM app user's profile (id, email, client, claims). Agents should call this first so their suggestions can be tailored to the user.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const claims = (ctx.getClaims?.() ?? {}) as Record<string, unknown>;
    const profile = {
      userId: ctx.getUserId(),
      email: ctx.getUserEmail(),
      clientId: ctx.getClientId(),
      displayName: (claims.name as string | undefined) ?? ctx.getUserEmail() ?? null,
      role: (claims.role as string | undefined) ?? "authenticated",
      locale: (claims.locale as string | undefined) ?? null,
      timezone: (claims.timezone as string | undefined) ?? null,
      note:
        "Extended profile fields live in the user's browser today. Ask them to open /dashboard/settings for full profile.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
      structuredContent: profile,
    };
  },
});
