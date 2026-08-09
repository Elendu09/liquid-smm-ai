import { useRef, useState, useMemo } from "react";
import { Smile, Hash, Sparkles, Loader2, AtSign, Search, Tag, Bold, Italic } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trendingHashtags } from "@/config/platforms";
import { toBoldUnicode, toItalicUnicode, SUPPORTS_BOLD } from "@/lib/charCount";
import { useAccounts } from "@/contexts/AccountContext";

const QUICK_EMOJI = ["🚀", "🔥", "✨", "🎉", "💡", "❤️", "👀", "📈"];

const EMOJI_GROUPS: Record<string, string[]> = {
  Frequent: ["🚀", "🔥", "✨", "🎉", "💡", "❤️", "👀", "📈", "😂", "😍", "🙌", "✅", "⭐", "🎯"],
  Smileys: ["😀", "😁", "😂", "🤣", "😊", "😍", "😎", "🥺", "😢", "😡", "🤔", "😴", "🥳", "🤩", "🫶", "😇"],
  Hands: ["👍", "👎", "👌", "🤝", "🙏", "💪", "👏", "🙌", "✋", "🤙", "✌️", "👏"],
  Objects: ["📸", "🎥", "💼", "📈", "📊", "💡", "🔖", "📌", "🗓️", "⏰", "🔔", "🎯", "📦", "🛒", "🏷️", "💬"],
  Symbols: ["❤️", "💙", "💚", "💛", "🧡", "💜", "✔️", "❗", "⚡", "⭐", "🌟", "💥", "✨", "🔥", "💯", "🎉"],
};

const ALL_EMOJIS = Object.values(EMOJI_GROUPS).flat();

interface CaptionFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  limit?: number;
  /** @deprecated — platform chip is now hidden in dialogs per request. Kept for backwards compat but not rendered. */
  platform?: string;
  /** Optional AI action; hidden when omitted. */
  onAi?: () => void;
  aiBusy?: boolean;
  className?: string;
  id?: string;
  /** When true, hides platform chip (default true now) */
  hidePlatformChip?: boolean;
}

/**
 * Caption input styled like the reference: one bordered card with a
 * bottom toolbar (emoji / hashtag / mention / AI) on the left and a live counter
 * on the right. Enhanced to support full emoji picker, hashtag & mention suggestions,
 * and tag insertion.
 */
export function CaptionField({
  value,
  onChange,
  placeholder = "Write your caption…",
  rows = 5,
  limit = 2200,
  platform,
  onAi,
  aiBusy,
  className,
  id,
  hidePlatformChip = true,
}: CaptionFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { accounts } = useAccounts();

  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiQuery, setEmojiQuery] = useState("");
  const [hashtagOpen, setHashtagOpen] = useState(false);
  const [hashtagQuery, setHashtagQuery] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  const insert = (text: string) => {
    const el = ref.current;
    if (!el) return onChange(value + text);
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    // Ensure spacing for hashtags/mentions
    const needsSpaceBefore = text.startsWith("#") || text.startsWith("@") ? (start > 0 && value[start - 1] !== " " && value[start - 1] !== "\n" ? " " : "") : "";
    const next = value.slice(0, start) + needsSpaceBefore + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + needsSpaceBefore.length + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const wrapSelection = (style: "bold" | "italic") => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const supportsUnicode = platform ? SUPPORTS_BOLD(platform) : false;
    let replacement = "";
    if (selected) {
      if (supportsUnicode) {
        replacement = style === "bold" ? toBoldUnicode(selected) : toItalicUnicode(selected);
      } else {
        replacement = style === "bold" ? `**${selected}**` : `*${selected}*`;
      }
    } else {
      replacement = style === "bold" ? (supportsUnicode ? toBoldUnicode("bold") : "**bold**") : (supportsUnicode ? toItalicUnicode("italic") : "*italic*");
    }
    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + replacement.length);
    });
  };

  const over = value.length > limit;
  const remaining = limit - value.length;

  // Filtered emoji
  const filteredEmojis = useMemo(() => {
    if (!emojiQuery.trim()) return null;
    const q = emojiQuery.toLowerCase();
    // naive: search not really applicable for emoji, just return all if query
    return ALL_EMOJIS.filter((e) => e.includes(q) || q.includes(e)).slice(0, 32);
  }, [emojiQuery]);

  // Hashtag suggestions based on platform trending + generic
  const hashtagSuggestions = useMemo(() => {
    const pool: string[] = [];
    // Add trending for current platform if available
    if (platform && trendingHashtags[platform]) {
      pool.push(...trendingHashtags[platform]);
    }
    // Also add generic popular
    const generic = ["#viral", "#trending", "#instagood", "#love", "#photooftheday", "#fyp", "#explore", "#lifestyle", "#motivation", "#business", "#launch", "#new"];
    for (const g of generic) if (!pool.includes(g)) pool.push(g);
    // Add already typed tags in value
    const existingTags = Array.from(value.matchAll(/#(\w+)/g)).map((m) => `#${m[1]}`);
    for (const e of existingTags) if (!pool.includes(e)) pool.push(e);

    const q = hashtagQuery.trim().toLowerCase().replace(/^#/, "");
    if (!q) return pool.slice(0, 16);
    return pool.filter((h) => h.toLowerCase().includes(q)).slice(0, 16);
  }, [platform, hashtagQuery, value]);

  const mentionSuggestions = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase().replace(/^@/, "");
    const handles = accounts.map((a) => `@${a.username}`);
    // also add generic
    const generic = ["@yourbrand", "@teammate", "@collab"];
    const pool = [...handles];
    generic.forEach((g) => { if (!pool.includes(g)) pool.push(g); });
    if (!q) return pool.slice(0, 8);
    return pool.filter((h) => h.toLowerCase().includes(q)).slice(0, 8);
  }, [accounts, mentionQuery]);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-muted/10 transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/25 overflow-hidden",
        className,
      )}
    >
      <Textarea
        id={id}
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[90px]"
      />
      <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1 border-t border-border/20 bg-background/50">
        <div className="flex items-center gap-1">
          {/* Emoji picker */}
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Insert emoji"
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  emojiOpen && "bg-muted text-foreground"
                )}
              >
                <Smile className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" sideOffset={8} className="w-[300px] p-0 overflow-hidden rounded-xl shadow-xl">
              <div className="p-2.5">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search emoji…"
                    value={emojiQuery}
                    onChange={(e) => setEmojiQuery(e.target.value)}
                    className="pl-7 h-7 text-xs bg-muted/40"
                  />
                </div>
                {!emojiQuery ? (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    <div className="flex flex-wrap gap-1">
                      {QUICK_EMOJI.map((e) => (
                        <button
                          key={`quick-${e}`}
                          type="button"
                          onClick={() => { insert(e); setEmojiOpen(false); setEmojiQuery(""); }}
                          className="grid h-7 w-7 place-items-center rounded-md text-base hover:bg-muted transition-colors border border-transparent hover:border-border/60"
                          title={`Insert ${e}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
                      <div key={group}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{group}</p>
                        <div className="grid grid-cols-8 gap-1">
                          {emojis.map((e) => (
                            <button
                              key={`${group}-${e}`}
                              type="button"
                              onClick={() => { insert(e); setEmojiOpen(false); setEmojiQuery(""); }}
                              className="grid h-7 w-7 place-items-center rounded-md text-base hover:bg-muted transition-colors"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-1 max-h-[180px] overflow-y-auto">
                    {(filteredEmojis ?? []).map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { insert(e); setEmojiOpen(false); setEmojiQuery(""); }}
                        className="grid h-7 w-7 place-items-center rounded-md text-base hover:bg-muted"
                      >
                        {e}
                      </button>
                    ))}
                    {filteredEmojis?.length === 0 && (
                      <p className="col-span-8 text-center text-xs text-muted-foreground py-4">No matches</p>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground text-center mt-2">Click to insert at cursor</p>
              </div>
            </PopoverContent>
          </Popover>

          {/* Hashtag picker */}
          <Popover open={hashtagOpen} onOpenChange={setHashtagOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Insert hashtag"
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  hashtagOpen && "bg-muted text-foreground"
                )}
              >
                <Hash className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" sideOffset={8} className="w-[300px] p-0 overflow-hidden rounded-xl shadow-xl">
              <div className="p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                    <Tag className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">Hashtags & tags</p>
                    <p className="text-[10px] text-muted-foreground">Trending {platform ? `for ${platform}` : "tags"}</p>
                  </div>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search or type tag…"
                    value={hashtagQuery}
                    onChange={(e) => setHashtagQuery(e.target.value)}
                    className="pl-7 h-7 text-xs bg-muted/40"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {hashtagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => { insert(tag + " "); setHashtagOpen(false); setHashtagQuery(""); }}
                      className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                  {hashtagSuggestions.length === 0 && (
                    <p className="w-full text-center text-xs text-muted-foreground py-3">No tags found</p>
                  )}
                </div>
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/30">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={() => { insert("#"); setHashtagOpen(false); }}
                  >
                    Insert #
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-7 text-xs"
                    onClick={() => setHashtagOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Mention / Tag picker */}
          <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Mention"
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  mentionOpen && "bg-muted text-foreground"
                )}
              >
                <AtSign className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" sideOffset={8} className="w-[260px] p-0 overflow-hidden rounded-xl shadow-xl">
              <div className="p-2.5">
                <p className="text-xs font-semibold mb-2">Mention & tags</p>
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search @handle…"
                    value={mentionQuery}
                    onChange={(e) => setMentionQuery(e.target.value)}
                    className="pl-7 h-7 text-xs bg-muted/40"
                  />
                </div>
                <div className="space-y-1 max-h-[160px] overflow-y-auto">
                  {mentionSuggestions.map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => { insert(handle + " "); setMentionOpen(false); setMentionQuery(""); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-6 w-6 rounded-full bg-primary/10 grid place-items-center text-[10px] font-bold text-primary">
                        {handle.slice(1, 3).toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">{handle}</span>
                      <span className="text-[10px] text-muted-foreground">Tap</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-2">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => { insert("@"); setMentionOpen(false); }}>
                    Insert @
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {(platform ? SUPPORTS_BOLD(platform) : true) && (
            <>
              <button
                type="button"
                aria-label="Bold"
                onClick={() => wrapSelection("bold")}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground font-bold"
                title={platform && SUPPORTS_BOLD(platform) ? "Bold (unicode) — Facebook/LinkedIn/Threads" : "Bold (**text**)"}
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Italic"
                onClick={() => wrapSelection("italic")}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground italic"
                title={platform && SUPPORTS_BOLD(platform) ? "Italic (unicode) — Facebook/LinkedIn/Threads" : "Italic (*text*)"}
              >
                <Italic className="h-4 w-4" />
              </button>
            </>
          )}
          {onAi && (
            <button
              type="button"
              aria-label="Improve with AI"
              onClick={onAi}
              disabled={aiBusy}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-60"
              title="Improve with AI"
            >
              {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px] tabular-nums px-1.5 py-0.5 rounded-full",
              over ? "font-semibold text-destructive bg-destructive/10" : remaining < 100 ? "text-amber-600 bg-amber-500/10" : "text-muted-foreground",
            )}
          >
            {value.length.toLocaleString()} / {limit.toLocaleString()}
            {remaining < 0 && ` · ${Math.abs(remaining)} over`}
          </span>
          {/* Platform chip removed per request — was <PlatformIcon platform={platform} .../> */}
        </div>
      </div>
      {/* Inline tag helper */}
      {value.length > 0 && (value.includes("#") || value.includes("@")) && (
        <div className="px-2.5 pb-2 flex flex-wrap gap-1">
          {Array.from(new Set(Array.from(value.matchAll(/#(\w+)/g)).map((m) => m[0]))).slice(0, 6).map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">
              {tag}
            </span>
          ))}
          {Array.from(new Set(Array.from(value.matchAll(/@(\w+)/g)).map((m) => m[0]))).slice(0, 4).map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 text-[10px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default CaptionField;
