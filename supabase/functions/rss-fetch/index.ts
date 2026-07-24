import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function stripCdata(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}
function pick(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? stripCdata(m[1]) : null;
}
function pickAttr(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}
function parseFeed(xml: string) {
  const itemRe = /<(item|entry)[\s\S]*?<\/\1>/gi;
  const items: {
    guid: string;
    title: string;
    link: string;
    summary: string;
    imageUrl?: string;
    publishedAt?: string;
  }[] = [];
  for (const m of xml.matchAll(itemRe)) {
    const block = m[0];
    const title = pick(block, "title") ?? "";
    let link = pick(block, "link") ?? pickAttr(block, "link", "href") ?? "";
    link = link.trim();
    const guid = pick(block, "guid") ?? pick(block, "id") ?? (link || title);
    const summary =
      pick(block, "description") ?? pick(block, "summary") ?? pick(block, "content") ?? "";
    const pub = pick(block, "pubDate") ?? pick(block, "published") ?? pick(block, "updated");
    const image =
      pickAttr(block, "media:content", "url") ??
      pickAttr(block, "media:thumbnail", "url") ??
      pickAttr(block, "enclosure", "url") ??
      undefined;
    if (!guid) continue;
    items.push({
      guid,
      title,
      link,
      summary: summary.replace(/<[^>]+>/g, "").slice(0, 500),
      imageUrl: image,
      publishedAt: pub ? new Date(pub).toISOString() : undefined,
    });
  }
  const feedTitle = pick(xml, "title") ?? null;
  return { title: feedTitle, items };
}

function toThumbnailUrl(src: string | undefined | null): string | null {
  if (!src) return null;
  const clean = src.trim();
  if (!/^https?:\/\//i.test(clean)) return null;
  const noProto = clean.replace(/^https?:\/\//i, "");
  return `https://wsrv.nl/?url=${encodeURIComponent(noProto)}&w=1200&h=675&fit=cover&a=attention&output=jpg&q=82&il`;
}

/**
 * SSRF guard: only allow http(s) URLs that resolve to public, routable IPs.
 * Blocks localhost, RFC1918, link-local (169.254.0.0/16 incl. cloud metadata),
 * loopback, CGNAT (100.64/10), unique-local IPv6 (fc00::/7), and IPv6 loopback.
 */
function isPrivateIp(ip: string): boolean {
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    // IPv4-mapped IPv6 like ::ffff:169.254.169.254
    const m = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
    if (m) return isPrivateIp(m[1]);
    return false;
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error("invalid_url"); }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("scheme_not_allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  // Reject bare IPs in private ranges outright.
  if (/^[\d.]+$/.test(host) || host.includes(":")) {
    if (isPrivateIp(host)) throw new Error("private_address_blocked");
  }
  // Reject obvious localhost aliases without needing DNS.
  const lower = host.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".internal") || lower.endsWith(".local")) {
    throw new Error("private_address_blocked");
  }
  try {
    const a = await Deno.resolveDns(host, "A").catch(() => [] as string[]);
    const aaaa = await Deno.resolveDns(host, "AAAA").catch(() => [] as string[]);
    const all = [...a, ...aaaa];
    if (all.length === 0) throw new Error("dns_unresolved");
    if (all.some((ip) => isPrivateIp(ip))) throw new Error("private_address_blocked");
  } catch (e) {
    if (e instanceof Error && (e.message === "private_address_blocked" || e.message === "dns_unresolved")) throw e;
    // If DNS lookup isn't permitted in this runtime, fail closed.
    throw new Error("dns_check_failed");
  }
  return u;
}

async function safeFetch(rawUrl: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const u = await assertPublicUrl(rawUrl);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 8000);
  try {
    return await fetch(u.toString(), { ...init, signal: ctrl.signal, redirect: "manual" });
  } finally {
    clearTimeout(t);
  }
}

async function scrapeOgImage(articleUrl: string): Promise<string | null> {
  try {
    const res = await safeFetch(articleUrl, {
      timeoutMs: 4000,
      headers: { "User-Agent": "SMMSAAS-RSS/1.0 (+thumbnail)" },
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 200_000);
    const m =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (!m) return null;
    let url = m[1];
    if (url.startsWith("//")) url = "https:" + url;
    else if (url.startsWith("/")) {
      try {
        const base = new URL(articleUrl);
        url = `${base.origin}${url}`;
      } catch { /* noop */ }
    }
    // Validate the resolved image URL is public too before returning it.
    try { await assertPublicUrl(url); } catch { return null; }
    return url;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  const admin = createClient(supabaseUrl, serviceKey);
  const asUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: u } = await asUser.auth.getUser();
  if (!u?.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = u.user.id;

  let body: { feed_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }

  const query = admin.from("rss_feeds").select("*").eq("owner_id", userId).eq("active", true);
  const { data: feedRows, error: fErr } = body.feed_id
    ? await query.eq("id", body.feed_id)
    : await query;
  if (fErr) {
    return new Response(JSON.stringify({ error: fErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Record<string, unknown>[] = [];
  for (const feed of feedRows ?? []) {
    try {
      const res = await safeFetch(feed.url, {
        headers: { "User-Agent": "SMMSAAS-RSS/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const parsed = parseFeed(xml);

      let imported = 0;
      for (const item of parsed.items.slice(0, 20)) {
        const hay = (item.title + " " + item.summary).toLowerCase();
        const kws: string[] = feed.filter_keywords ?? [];
        const excludes: string[] = feed.exclude_keywords ?? [];
        if (kws.length && !kws.some((k) => hay.includes(k.toLowerCase()))) continue;
        if (excludes.length && excludes.some((k) => k && hay.includes(k.toLowerCase()))) continue;

        const { data: existing } = await admin
          .from("rss_items")
          .select("id")
          .eq("feed_id", feed.id)
          .eq("guid", item.guid)
          .maybeSingle();
        if (existing) continue;

        let finalImage = item.imageUrl ?? null;
        if (finalImage) {
          try { await assertPublicUrl(finalImage); } catch { finalImage = null; }
        }
        if (!finalImage && item.link) {
          finalImage = await scrapeOgImage(item.link);
        }
        const thumbnailUrl = toThumbnailUrl(finalImage);

        let scheduledPostId: string | null = null;
        if (feed.auto_publish) {
          let caption =
            (feed.caption_template as string | null)
              ?.split("{title}").join(item.title)
              .split("{link}").join(item.link)
              .split("{summary}").join(item.summary) ??
            `${item.title}\n\n${item.link}`;

          if (feed.ai_rewrite) {
            try {
              const key = Deno.env.get("LOVABLE_API_KEY");
              if (key) {
                const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    model: "google/gemini-2.5-flash",
                    messages: [
                      { role: "system", content: "Rewrite the news headline as an engaging social post (max 220 chars). Keep 1-2 emojis, add a punchy hook. Return plain text only." },
                      { role: "user", content: `${item.title}\n\n${item.summary}\n\n${item.link}` },
                    ],
                  }),
                });
                const j = await r.json();
                const txt = j?.choices?.[0]?.message?.content?.trim();
                if (txt) caption = `${txt}\n\n${item.link}`;
              }
            } catch { /* fallback to template */ }
          }

          const platforms = (feed.target_platforms as string[]) ?? [];
          const { data: post } = await admin
            .from("scheduled_posts")
            .insert({
              user_id: userId,
              caption,
              media_url: thumbnailUrl ?? finalImage ?? null,
              status: "draft",
              platform_ids: platforms,
              scheduled_at: null,
            })
            .select("id")
            .single();
          scheduledPostId = post?.id ?? null;
        }

        await admin.from("rss_items").insert({
          feed_id: feed.id,
          owner_id: userId,
          guid: item.guid,
          title: item.title,
          link: item.link,
          summary: item.summary,
          image_url: finalImage,
          thumbnail_url: thumbnailUrl,
          published_at: item.publishedAt,
          imported: !!scheduledPostId,
          scheduled_post_id: scheduledPostId,
        });
        imported++;
      }

      await admin
        .from("rss_feeds")
        .update({
          last_fetched_at: new Date().toISOString(),
          last_status: "ok",
          last_error: null,
          last_item_count: parsed.items.length,
          title: feed.title ?? parsed.title,
        })
        .eq("id", feed.id);
      results.push({ feed_id: feed.id, imported, total: parsed.items.length });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await admin
        .from("rss_feeds")
        .update({
          last_fetched_at: new Date().toISOString(),
          last_status: "error",
          last_error: msg,
        })
        .eq("id", feed.id);
      results.push({ feed_id: feed.id, error: msg });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
