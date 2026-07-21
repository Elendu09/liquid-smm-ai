import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { BioPage } from "@/pages/dashboard/linkbio/renderer/BioPage";
import type { BioConfig } from "@/pages/dashboard/linkbio/state/bioConfig";
import { Loader2 } from "lucide-react";

type Row = {
  slug: string;
  handle: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme_id: string | null;
  overrides: any;
  links: any;
  socials: any;
  blocks: any;
  published: boolean;
};

export default function PublicBio() {
  const { slug } = useParams<{ slug: string }>();
  const [row, setRow] = useState<Row | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    if (!slug) return;
    const cleaned = slug.replace(/^@/, "");
    (async () => {
      const { data, error } = await supabase
        .from("linkbio_pages")
        .select("slug,handle,headline,bio,avatar_url,theme_id,overrides,links,socials,blocks,published")
        .or(`slug.eq.${cleaned},handle.eq.${cleaned},handle.eq.@${cleaned}`)
        .eq("published", true)
        .maybeSingle();
      if (error || !data) {
        setState("notfound");
        return;
      }
      setRow(data as Row);
      setState("ready");
    })();
  }, [slug]);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (state === "notfound" || !row) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300 px-6 text-center">
        <h1 className="text-2xl font-serif mb-2">Page not found</h1>
        <p className="text-sm text-slate-500 max-w-sm">
          This link-in-bio page doesn't exist or hasn't been published yet.
        </p>
      </div>
    );
  }

  const config: BioConfig = {
    version: 1,
    handle: row.handle ?? `@${row.slug}`,
    headline: row.headline ?? "",
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? undefined,
    slug: row.slug,
    themeId: row.theme_id ?? "midnight-glass",
    overrides: (row.overrides ?? {}) as BioConfig["overrides"],
    links: Array.isArray(row.links) ? row.links : [],
    socials: Array.isArray(row.socials) ? row.socials : [],
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
  };

  const title = `${config.handle} · SMMSAAS`;
  const desc = config.bio || config.headline || "Link in bio";

  useEffect(() => {
    document.title = title;
    const ensure = (selector: string, create: () => HTMLElement) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      return el;
    };
    const setMeta = (name: string, attr: "name" | "property", content: string) => {
      const el = ensure(`meta[${attr}="${name}"]`, () => {
        const m = document.createElement("meta");
        m.setAttribute(attr, name);
        return m;
      });
      el.setAttribute("content", content);
    };
    setMeta("description", "name", desc.slice(0, 155));
    setMeta("og:title", "property", title);
    setMeta("og:description", "property", desc.slice(0, 155));
    setMeta("og:type", "property", "profile");
    if (config.avatarUrl) setMeta("og:image", "property", config.avatarUrl);
    setMeta("twitter:card", "name", "summary");
  }, [title, desc, config.avatarUrl]);

  return (
    <div className="min-h-screen w-full">
      <BioPage config={config} />
    </div>
  );
}

