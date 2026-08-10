import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { platforms as ALL_PLATFORMS } from "@/config/platforms";
import type { PostTemplate } from "@/components/create/NewPostDialog";
import { cn } from "@/lib/utils";

interface BuiltInTemplate extends PostTemplate {
  emoji: string;
  description: string;
}

/** Curated library shown under the Discover tab. */
const BUILT_INS: BuiltInTemplate[] = [
  {
    id: "builtin-wrap-up",
    emoji: "🥳",
    name: "Share your Creator Camp Growth wrap-up",
    description: "You showed up for four weeks. Mark it with a post.",
    caption:
      "Reflect on what surprised you, what worked, or what you learned about your own creator practice during the camp.\n" +
      "Write a short post sharing one or two takeaways: a habit you built, a lesson that landed, or a connection you made.\n" +
      "Keep it warm and personal. This is your wrap-up moment.",
    platformIds: ["instagram", "linkedin", "facebook"],
    createdAt: "",
  },
  {
    id: "builtin-bridge",
    emoji: "🌉",
    name: "Be the bridge, tag two people who should connect",
    description: "Your network is more valuable when you connect it. Make an intentional intro.",
    caption:
      "Tag two people in your network who should know each other.\n" +
      "Say in one line each why they'd hit it off or could help each other.\n" +
      "Goodwill compounds — be the bridge.",
    platformIds: ["linkedin", "twitter"],
    createdAt: "",
  },
  {
    id: "builtin-repurpose",
    emoji: "♻️",
    name: "Repurpose one of your posts into a new format",
    description: "One idea can travel far. Give it a second life in a new format.",
    caption:
      "Pick one post that performed well recently.\n" +
      "Rewrite it for a different format — thread, carousel, short video or story.\n" +
      "Keep the core idea, change the angle and the pacing.",
    platformIds: ["instagram", "tiktok", "twitter"],
    createdAt: "",
  },
  {
    id: "builtin-ship",
    emoji: "🚀",
    name: "Announce something you're shipping",
    description: "New feature, offer or milestone — tell people what changed and why it matters.",
    caption:
      "Lead with the outcome, not the feature: what can people do now that they couldn't before?\n" +
      "Add one concrete example or metric.\n" +
      "Close with a clear next step — try it, book it, or reply.",
    platformIds: ["linkedin", "twitter", "instagram"],
    createdAt: "",
  },
  {
    id: "builtin-lesson",
    emoji: "🧵",
    name: "Turn a hard-earned lesson into a thread",
    description: "Package one lesson as a numbered thread that people save and share.",
    caption:
      "Hook: the mistake you made or the moment it clicked.\n" +
      "3–5 numbered points, one idea per point, plain language.\n" +
      "End with the takeaway in a single quotable line.",
    platformIds: ["twitter", "linkedin", "threads"],
    createdAt: "",
  },
  {
    id: "builtin-win",
    emoji: "🙌",
    name: "Celebrate a small win in public",
    description: "Small milestones build momentum — and your audience loves the honest ones.",
    caption:
      "Share one small, real win from this week.\n" +
      "Say what actually moved the needle, not just the result.\n" +
      "Invite others: what did you ship this week?",
    platformIds: ["instagram", "linkedin", "facebook"],
    createdAt: "",
  },
];

const tryEmoji = (t: PostTemplate, i: number) =>
  (t as BuiltInTemplate).emoji ?? ["🥳", "🎉", "🚀", "💡", "🔥", "✨", "🎯", "📣"][i % 8];

const descriptionFor = (t: PostTemplate): string => {
  const built = (t as BuiltInTemplate).description;
  if (built) return built;
  const firstLine = t.caption.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return firstLine.length > 90 ? `${firstLine.slice(0, 90)}…` : firstLine;
};

interface TemplatePanelProps {
  templates: PostTemplate[];
  onInsert: (t: PostTemplate) => void;
  onRemove: (id: string) => void;
  /** "+" in the header — save the current draft as a personal template */
  onCreateNew?: () => void;
  /** False → show the "Connect a Channel to Post" CTA at the bottom */
  hasConnectedAccount?: boolean;
  onConnectChannel?: () => void;
  className?: string;
}

/**
 * Template browser shown inside the unified draft dialog's side panel when
 * "Templates" is clicked (reference design): Discover / Personal tabs, search
 * + platform filter, a "+" to save the current draft as a template, and a
 * detail view with back arrow, bullet card and "Insert Template".
 */
export function TemplatePanel({
  templates,
  onInsert,
  onRemove,
  onCreateNew,
  hasConnectedAccount = true,
  onConnectChannel,
  className,
}: TemplatePanelProps) {
  const [tab, setTab] = useState<"discover" | "personal">("discover");
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const pool = tab === "discover" ? (BUILT_INS as PostTemplate[]) : templates;
  const active = pool.find((t) => t.id === activeId) ?? null;

  // If the open template gets deleted, fall back to the list.
  useEffect(() => {
    if (activeId && !pool.some((t) => t.id === activeId)) setActiveId(null);
  }, [pool, activeId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((t) => {
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.caption.toLowerCase().includes(q) ||
        descriptionFor(t).toLowerCase().includes(q);
      const matchesPlatform =
        platformFilter.length === 0 ||
        t.platformIds.some((p) => platformFilter.includes(p));
      return matchesQuery && matchesPlatform;
    });
  }, [pool, query, platformFilter]);

  const copyCaption = async (t: PostTemplate) => {
    try {
      await navigator.clipboard.writeText(t.caption);
      toast.success("Template copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleCreateNew = () => {
    onCreateNew?.();
    setTab("personal");
    setActiveId(null);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {!active ? (
        <>
          {/* Header — "Templates" + create */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Templates</p>
            {onCreateNew && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 rounded-lg"
                aria-label="Save current draft as a template"
                title="Save current draft as a template"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Discover / Personal tabs */}
          <div className="flex items-center gap-5 border-b border-border/60 text-xs font-medium">
            {(["discover", "personal"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setActiveId(null); }}
                className={cn(
                  "relative -mb-px pb-2 capitalize transition-colors",
                  tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
                {tab === t && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>

          {/* Search + platform filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                className="h-8 rounded-lg border-border/60 bg-muted/40 pl-8 text-xs"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-lg",
                    platformFilter.length > 0 && "border-primary/50 bg-primary/15 text-primary",
                  )}
                  aria-label="Filter templates by platform"
                  title="Filter templates by platform"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-2">
                <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Filter by platform
                </p>
                <div className="max-h-52 space-y-0.5 overflow-y-auto">
                  {ALL_PLATFORMS.map((p) => {
                    const on = platformFilter.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setPlatformFilter((f) => (on ? f.filter((x) => x !== p.id) : [...f, p.id]))
                        }
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted"
                      >
                        <PlatformIcon platform={p.id} size="xs" />
                        <span className="flex-1 text-left">{p.name}</span>
                        {on && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                {platformFilter.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1.5 h-7 w-full text-xs"
                    onClick={() => setPlatformFilter([])}
                  >
                    Clear filter
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Cards */}
          {filtered.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {query || platformFilter.length ? "No templates match" : tab === "personal" ? "No personal templates yet" : "No templates"}
                </p>
                <p className="mx-auto max-w-[220px] text-[11px] leading-relaxed text-muted-foreground/80">
                  {tab === "personal" && !query
                    ? "Save the current draft as a template with the “+” above, or tick “Save as reusable template” in the form."
                    : "Try a different search or clear the filter."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((t, i) => (
                <div
                  key={t.id}
                  className="group relative rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:border-primary/40"
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    className="block w-full text-left"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-base">
                      {tryEmoji(t, i)}
                    </span>
                    <span className="mt-2 block text-xs font-semibold leading-snug">{t.name}</span>
                    <span className="mt-1 line-clamp-2 block text-[11px] leading-relaxed text-muted-foreground">
                      {descriptionFor(t) || "Empty template"}
                    </span>
                  </button>
                  {tab === "personal" && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-2 h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      aria-label={`Delete template ${t.name}`}
                      onClick={() => {
                        onRemove(t.id);
                        toast.success("Template removed");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Detail view — mirrors the reference layout */}
          <div>
            <button
              type="button"
              onClick={() => setActiveId(null)}
              aria-label="Back to templates"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-lg">
              {tryEmoji(active, Math.max(0, pool.findIndex((t) => t.id === active.id)))}
            </span>
            <h4 className="text-sm font-semibold leading-snug">{active.name}</h4>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {descriptionFor(active)}
            </p>
            {active.platformIds.length > 0 && (
              <p className="flex items-center gap-1 text-[11px] capitalize text-muted-foreground">
                {active.platformIds.map((p) => (
                  <PlatformIcon key={p} platform={p} size="xs" />
                ))}
                <span className="ml-1">{active.platformIds.join(" · ")}</span>
              </p>
            )}

            {/* Caption rendered as bullet points, like the reference card */}
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5">
              <div className="space-y-1.5 text-xs leading-relaxed">
                {active.caption
                  .split("\n")
                  .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
                  .filter(Boolean)
                  .map((line, i) => (
                    <p key={i} className="flex gap-2">
                      <span className="mt-[1px] shrink-0">•</span>
                      <span>{line}</span>
                    </p>
                  ))}
                {active.caption.trim() === "" && (
                  <p className="italic text-muted-foreground">This template has no caption yet.</p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-primary/15 pt-2.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Copy template caption"
                  onClick={() => copyCaption(active)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => onInsert(active)}
                >
                  Insert Template
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom CTA (reference) — only when no channel is connected yet */}
      {!hasConnectedAccount && (
        <Button
          type="button"
          className="mt-auto w-full rounded-xl"
          onClick={onConnectChannel}
        >
          Connect a Channel to Post
        </Button>
      )}
    </div>
  );
}

export default TemplatePanel;
