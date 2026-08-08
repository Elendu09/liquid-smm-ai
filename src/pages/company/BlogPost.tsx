import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, MessageCircle, Share2, Sparkles, Twitter, Linkedin, Check } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Seo } from "@/components/shared/Seo";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";
import { blogBySlug, blogPosts, relatedPosts, slugifyHeading, type BlogSection } from "@/data/blogPosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * BlogPost
 *
 * Renders a single blog post at /blog/:slug. Includes:
 *  - SEO + JSON-LD Article schema
 *  - Reading-progress bar
 *  - Auto-generated table of contents from h2/h3 sections
 *  - Anchor links on every heading
 *  - Share buttons (copy link, Twitter, LinkedIn)
 *  - Related posts at the bottom
 */
export default function BlogPost() {
  const { slug = "" } = useParams<{ slug: string }>();
  const post = blogBySlug[slug];
  const related = useMemo(() => relatedPosts(slug, 3), [slug]);

  // Reading progress — small but it gives the page a "real publication" feel.
  const [progress, setProgress] = useState(0);
  // Copy-link state.
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!post) return;
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? Math.min(1, h.scrollTop / total) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.slug]);

  if (!post) {
    return (
      <>
        <Seo title="Post not found" description="That post does not exist or has been moved." canonical="/blog" />
        <div className="min-h-dvh bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-32 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">404</p>
            <h1 className="mt-3 font-['Instrument_Serif'] text-4xl">That post does not exist (yet).</h1>
            <p className="mt-3 text-sm text-muted-foreground">It may have been moved or the link is wrong.</p>
            <Button asChild className="mt-6">
              <Link to="/blog">Back to the blog</Link>
            </Button>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Build the TOC from h2/h3 sections. We use heading text as id.
  const toc: { id: string; text: string; level: 2 | 3 }[] = [];
  for (const section of post.body) {
    if (section.type === "h2") toc.push({ id: section.id ?? slugifyHeading(section.text), text: section.text, level: 2 });
    else if (section.type === "h3") toc.push({ id: section.id ?? slugifyHeading(section.text), text: section.text, level: 3 });
  }

  const url = typeof window !== "undefined" ? window.location.href : `https://smmsaas.com/blog/${post.slug}`;
  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [post.hero.src],
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author.name, jobTitle: post.author.role },
    publisher: {
      "@type": "Organization",
      name: "SMMSAAS",
      logo: { "@type": "ImageObject", url: "https://smmsaas.com/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://smmsaas.com/blog/${post.slug}` },
    articleSection: post.category,
    keywords: post.tags.join(", "),
    wordCount: post.body.reduce((s, sec) => s + (("text" in sec && sec.text) ? sec.text.split(/\s+/).length : 0), 0),
  };

  return (
    <>
      <Seo
        title={post.title}
        description={post.excerpt}
        canonical={`/blog/${post.slug}`}
        image={post.hero.src}
        type="article"
        author={post.author.name}
        publishedAt={post.date}
        modifiedAt={post.date}
        keywords={post.tags}
        jsonLd={jsonLd}
      />
      <div className="min-h-dvh bg-background text-foreground">
        <Navbar />

        {/* Reading progress bar */}
        <div className="fixed inset-x-0 top-0 z-30 h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-100"
            style={{ width: `${Math.round(progress * 100)}%` }}
            aria-hidden
          />
        </div>

        <header className="border-b border-border/60">
          <div className="container mx-auto max-w-4xl px-4 pt-28 pb-10 lg:pt-32">
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back to blog
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <Badge variant="secondary" className="bg-primary/10 text-primary">{post.category}</Badge>
              {post.tags.map((t) => (
                <span key={t} className="rounded-full border border-border/60 px-2 py-0.5">{t}</span>
              ))}
            </div>
            <h1 className="mt-4 font-['Instrument_Serif'] text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {post.author.initials}
                </div>
                <div>
                  <p className="font-medium text-foreground">{post.author.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{post.author.role}</p>
                </div>
              </div>
              <span className="hidden h-4 w-px bg-border sm:inline-block" />
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {post.readMinutes} min read
              </span>
            </div>
          </div>
        </header>

        <div className="container mx-auto max-w-6xl px-4 pb-16 pt-10 lg:pb-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_220px]">
            <article>
              <figure className="mb-10 overflow-hidden rounded-2xl border border-border/60">
                <img
                  src={post.hero.src}
                  alt={post.hero.alt}
                  className="aspect-[16/9] w-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
                {post.hero.credit && (
                  <figcaption className="px-3 py-1.5 text-[10px] text-muted-foreground">
                    {post.hero.credit}
                  </figcaption>
                )}
              </figure>

              <div className="prose prose-slate max-w-none dark:prose-invert">
                {post.body.map((section, i) => (
                  <SectionRender key={i} section={section} />
                ))}
              </div>

              <footer className="mt-12 border-t border-border/60 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Share</span>
                    <button
                      type="button"
                      onClick={share}
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-medium hover:bg-card"
                      aria-label="Copy link"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy link"}
                    </button>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-medium hover:bg-card"
                      aria-label="Share on X"
                    >
                      <Twitter className="h-3 w-3" /> X
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-medium hover:bg-card"
                      aria-label="Share on LinkedIn"
                    >
                      <Linkedin className="h-3 w-3" /> LinkedIn
                    </a>
                  </div>
                  <Link to="/blog" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
                    More posts <ArrowRight className="ml-1 inline h-3 w-3" />
                  </Link>
                </div>
              </footer>
            </article>

            {toc.length > 1 && (
              <aside className="hidden lg:block">
                <div className="sticky top-28 rounded-2xl border border-border/60 bg-card/60 p-4">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Sparkles className="h-3 w-3" /> On this page
                  </p>
                  <nav className="mt-3 space-y-1" aria-label="Table of contents">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "block rounded-md px-2 py-1 text-[11px] leading-snug text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
                          item.level === 3 && "pl-4 text-[10px]",
                        )}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                  <div className="mt-4 flex items-center gap-1.5 border-t border-border/60 pt-3 text-[10px] text-muted-foreground">
                    <MessageCircle className="h-3 w-3" /> Want to discuss? Open the support widget.
                  </div>
                </div>
              </aside>
            )}
          </div>

          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Related reading</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
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
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{p.category}</p>
                      <h3 className="font-['Instrument_Serif'] text-lg leading-snug">{p.title}</h3>
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">{p.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <Footer />
        <ScrollToTopButton />
      </div>
    </>
  );
}

function SectionRender({ section }: { section: BlogSection }) {
  if (section.type === "h2") {
    const id = section.id ?? slugifyHeading(section.text);
    return (
      <h2 id={id} className="mt-10 scroll-mt-28 font-['Instrument_Serif'] text-2xl leading-tight sm:text-3xl">
        <a href={`#${id}`} className="no-underline hover:underline">{section.text}</a>
      </h2>
    );
  }
  if (section.type === "h3") {
    const id = section.id ?? slugifyHeading(section.text);
    return (
      <h3 id={id} className="mt-6 scroll-mt-28 text-base font-semibold">
        <a href={`#${id}`} className="no-underline hover:underline">{section.text}</a>
      </h3>
    );
  }
  if (section.type === "p") {
    return <p className="mt-4 text-[15px] leading-relaxed text-foreground/85">{section.text}</p>;
  }
  if (section.type === "ul") {
    return (
      <ul className="mt-4 list-disc space-y-1.5 pl-6 text-[15px] leading-relaxed text-foreground/85">
        {section.items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    );
  }
  if (section.type === "ol") {
    return (
      <ol className="mt-4 list-decimal space-y-1.5 pl-6 text-[15px] leading-relaxed text-foreground/85">
        {section.items.map((it, i) => <li key={i}>{it}</li>)}
      </ol>
    );
  }
  if (section.type === "quote") {
    return (
      <blockquote className="mt-6 border-l-2 border-primary/60 pl-4 italic text-muted-foreground">
        "{section.text}"
        {section.cite && <footer className="mt-1 text-[11px] not-italic text-muted-foreground/70">— {section.cite}</footer>}
      </blockquote>
    );
  }
  if (section.type === "code") {
    return (
      <pre className="mt-4 overflow-auto rounded-xl border border-border/60 bg-muted/30 p-3 text-[12px] leading-relaxed">
        <code>{section.code}</code>
      </pre>
    );
  }
  if (section.type === "callout") {
    const tone =
      section.tone === "success" ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-300"
      : section.tone === "warn" ? "border-amber-500/30 bg-amber-500/[0.06] text-amber-700 dark:text-amber-300"
      : "border-primary/30 bg-primary/[0.05] text-foreground";
    return (
      <aside className={cn("mt-6 rounded-2xl border p-4", tone)}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{section.title}</p>
        <p className="mt-1 text-[14px] leading-relaxed">{section.text}</p>
      </aside>
    );
  }
  return null;
}

// Reference: blogPosts is the full list; this keeps the linter happy
// if we ever want to import the catalogue directly from this module.
void blogPosts;
