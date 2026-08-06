import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { edgeSupabase, requireAuth, tableResult } from "../helpers";

export default defineTool({
  name: "get_credits",
  title: "Get AI credit balance",
  description:
    "Return the signed-in user's AI credit balance (remaining, monthly allowance, used this month, purchased) plus their recent credit ledger events. Use this before recommending any credit-consuming action.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input: unknown, ctx: ToolContext) => {
    const auth = requireAuth(ctx);
    if (!auth.ok) return auth;
    const userId = ctx.getUserId();
    const db = edgeSupabase(ctx);

    const [{ data: bal }, { data: events }] = await Promise.all([
      db.from("credit_balances").select("included, purchased, used, cap, renews_at").eq("user_id", userId).maybeSingle(),
      db.from("credit_events").select("kind, delta, label, meta, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(15),
    ]);

    const included = Number(bal?.included ?? 0);
    const purchased = Number(bal?.purchased ?? 0);
    const used = Number(bal?.used ?? 0);
    const payload = {
      remaining: Math.max(0, included + purchased - used),
      monthlyAllowance: Number(bal?.cap ?? included) || included,
      usedThisMonth: used,
      purchased,
      renewsAt: bal?.renews_at ?? null,
      recentEvents: events ?? [],
    };
    return tableResult(payload, `${payload.remaining} credits remaining`);
  },
});
