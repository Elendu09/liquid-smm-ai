import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Minimal RSS/Atom parser (no external deps).
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
    const guid = pick(block, "guid") ?? pick(block, "id") ?? link || title;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  const admin = createClient(supabaseUrl, serviceKey);
  const asUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
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

  const { data: feeds, error } = await admin
    .from("rss_feeds")
    .select("*")
    .eq("owner_id", userId)
    .eq("active", true)
    .maybeSingle_ ? [] : [];
  // simple fetch by id or all
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
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "SMMSAAS-RSS/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const parsed = parseFeed(xml);

      let imported = 0;
      for (const item of parsed.items.slice(0, 20)) {
        const kws: string[] = feed.filter_keywords ?? [];
        if (
          kws.length &&
          !kws.some((k) =>
            (item.title + " " + item.summary).toLowerCase().includes(k.toLowerCase()),
          )
        ) {
          continue;
        }
        // insert item (unique on feed_id+guid)
        const { data: existing } = await admin
          .from("rss_items")
          .select("id, imported")
          .eq("feed_id", feed.id)
          .eq("guid", item.guid)
          .maybeSingle();
        if (existing) continue;

        let scheduledPostId: string | null = null;
        if (feed.auto_publish) {
          const caption =
            (feed.caption_template as string | null)
              ?.replaceAll("{title}", item.title)
              .replaceAll("{link}", item.link)
              .replaceAll("{summary}", item.summary) ??
            `${item.title}\n\n${item.link}`;
          const platforms = (feed.target_platforms as string[]) ?? [];
          const accounts = (feed.target_account_ids as string[]) ?? [];
          const { data: post } = await admin
            .from("scheduled_posts")
            .insert({
              user_id: userId,
              caption,
              media_urls: item.imageUrl ? [item.imageUrl] : [],
              link_url: item.link,
              status: "draft",
              platforms,
              account_ids: accounts,
              source: "rss",
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
          image_url: item.imageUrl,
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
