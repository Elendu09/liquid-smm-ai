import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Tag } from "lucide-react";
import { CompanyLayout } from "./CompanyLayout";
import { Seo } from "@/components/shared/Seo";
import { blogPosts, blogTags } from "@/data/blogPosts";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export default function Blog() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogPosts.filter((p) => {
      if (activeTag && !p.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeTag]);

  const [featured, ...rest] = visible;

  return (
    <>
      <Seo
        title="Blog"
        description="Playbooks, product notes and lessons from teams publishing across every channel — from the SMMSAAS team."
        canonical="/blog"
        keywords={["social media", "publishing", "ai", "analytics", "engagement", "blog"]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "SMMSAAS Blog",
          url: "https://smmsaas.com/blog",
          blogPost: blogPosts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `https://smmsaas.com/blog/${p.slug}`,
            datePublished: p.date,
            author: { "@type": "Person", name: p.author.name },
            image: p.hero.src,
            articleSection: p.category,
            keywords: p.tags.join(", "),
          })),
        }}
      />
      <CompanyLayout
        eyebrow="Blog"
        title="Notes on social, AI and shipping"
        subtitle="Playbooks, product notes and lessons from teams publishing across every channel."
      >
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, tags, categories…"
              className="pl-8"
              aria-label="Search blog posts"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                activeTag === null
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40",
              )}
            >
              <Tag className="h-3 w-3" /> All
            </button>
            {blogTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  activeTag === tag
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
            <p className="text-sm font-medium">No posts match those filters yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Try clearing the search or picking a different tag.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {featured && (
              <Link
                to={`/blog/${featured.slug}`}
                className="group block overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <article className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
                  <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[18rem]">
                    <img
                      src={featured.hero.src}
                      alt={featured.hero.alt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
                    />
                    <Badge variant="secondary" className="absolute left-3 top-3 bg-background/80 text-foreground">
                      {featured.category}
                    </Badge>
                  </div>
                  <div className="flex flex-col justify-between p-6 lg:p-8">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        <span>{formatDate(featured.date)}</span>
                        <span>·</span>
                        <span>{featured.readMinutes} min read</span>
                        <span>·</span>
                        <span>{featured.author.name}</span>
                      </div>
                      <h2 className="mt-3 font-['Instrument_Serif'] text-3xl leading-tight sm:text-4xl">
                        {featured.title}
                      </h2>
                      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
                        {featured.excerpt}
                      </p>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                      Read article
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </article>
              </Link>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-primary/40"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={p.hero.src}
                      alt={p.hero.alt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <Badge variant="secondary" className="absolute left-3 top-3 bg-background/80 text-foreground">
                      {p.category}
                    </Badge>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      <span>{formatDate(p.date)}</span>
                      <span>·</span>
                      <span>{p.readMinutes} min</span>
                    </div>
                    <h3 className="font-['Instrument_Serif'] text-xl leading-snug">{p.title}</h3>
                    <p className="line-clamp-3 text-xs text-muted-foreground">{p.excerpt}</p>
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full border border-border/60 px-2 py-0.5 text-[9px] text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CompanyLayout>
    </>
  );
}
