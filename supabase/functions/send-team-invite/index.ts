// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

/**
 * Sends a team invite email. If RESEND_API_KEY is configured we deliver via
 * Resend; otherwise we log the invite link so the inviter can copy it from the
 * UI. Always returns the fully-qualified invite URL so the client can display /
 * copy it — email delivery is a best-effort layer on top.
 */

const BodySchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  role: z.enum(["admin", "editor", "viewer"]),
  inviter_name: z.string().max(120).optional(),
  app_url: z.string().url().optional(),
});

/** Only allow links pointing at our own app origins. */
const ALLOWED_HOST_SUFFIXES = ["lovable.app", "lovableproject.com", "lovable.dev"];
function resolveAppUrl(candidate: string | undefined, origin: string | null): string | null {
  for (const value of [candidate, origin]) {
    if (!value) continue;
    let u: URL;
    try { u = new URL(value); } catch { continue; }
    if (u.protocol !== "https:" && u.hostname !== "localhost") continue;
    if (
      u.hostname === "localhost" ||
      ALLOWED_HOST_SUFFIXES.some((s) => u.hostname === s || u.hostname.endsWith(`.${s}`))
    ) {
      return u.origin;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // JWT-verify the caller
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userData, error: userErr } = await supa.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { email, token, role, inviter_name, app_url } = parsed.data;

    // The caller must own a matching pending invite row — otherwise this endpoint
    // could be used to send arbitrary branded invite emails.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data: inviteRow } = await admin
      .from("team_members")
      .select("id")
      .eq("owner_id", userData.user.id)
      .eq("invite_token", token)
      .eq("status", "pending")
      .ilike("email", email)
      .eq("role", role)
      .maybeSingle();
    if (!inviteRow) return json({ error: "invite_not_found" }, 403);

    const origin = resolveAppUrl(app_url, req.headers.get("Origin"));
    if (!origin) return json({ error: "invalid_app_url" }, 400);

    const invite_url = `${origin}/invite/${token}`;
    const from_name = escapeHtml(inviter_name || userData.user.email || "Your teammate");




    const resendKey = Deno.env.get("RESEND_API_KEY");
    let delivered = false;
    if (resendKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "SMMSAAS <invites@smmsaas.com>",
          to: [email],
          subject: `${from_name} invited you to their SMMSAAS workspace`,
          html: `
            <div style="font-family:system-ui;padding:24px;color:#0f172a">
              <h2>You're invited to collaborate</h2>
              <p>${from_name} added you to their SMMSAAS workspace as <b>${role}</b>.</p>
              <p><a href="${invite_url}" style="background:#3b82f6;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Accept invite</a></p>
              <p style="color:#64748b;font-size:12px">Or paste this link: ${invite_url}</p>
            </div>`,
        }),
      });
      delivered = emailRes.ok;
      if (!delivered) console.error("resend error", await emailRes.text());
    } else {
      console.log(`[team-invite] no RESEND_API_KEY — invite link for ${email}: ${invite_url}`);
    }

    return json({ ok: true, invite_url, delivered });
  } catch (e: any) {
    console.error("send-team-invite error", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
