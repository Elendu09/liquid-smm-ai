import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Sparkles, Check, Trash2, Reply, CheckCheck, Filter, Search, Star, Zap, ShieldAlert, EyeOff, Flag, Ban, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ReplyDialog } from "@/components/engage/ReplyDialog";
import { BulkReplyDialog } from "@/components/engage/BulkReplyDialog";
import { FilterDialog, DEFAULT_FILTERS, type CommentFilters } from "@/components/engage/FilterDialog";
import { ModerationDialog, type ModerationRule, type ModerationAction } from "@/components/engage/ModerationDialog";
import {
  QuickReplySettingsDialog,
  DEFAULT_QR_SETTINGS,
  renderQuickReply,
  type QuickReplySettings,
} from "@/components/engage/QuickReplySettingsDialog";

const MOD_RULES_KEY = "smmpilot:engage:moderation-rules";
const MOD_STATE_KEY = "smmpilot:engage:moderation-state";
const QR_SETTINGS_KEY = "smmpilot:engage:quick-reply";

interface ModState {
  hidden: number[];
  flagged: number[];
  blockedUsers: string[];
}

const DEFAULT_MOD_STATE: ModState = { hidden: [], flagged: [], blockedUsers: [] };

const mockComments = [
  { id: 1, user: "@fitness_enthusiast", avatar: "FE", content: "This is amazing! How do I get started with your automation tools?", time: "2 min ago", platform: "Instagram", sentiment: "positive", replied: false },
  { id: 2, user: "@tech_startup", avatar: "TS", content: "Great content! Would love to see more tutorials on scheduling.", time: "15 min ago", platform: "Instagram", sentiment: "positive", replied: false },
  { id: 3, user: "@marketing_pro", avatar: "MP", content: "Is there a free trial available?", time: "1 hour ago", platform: "Twitter", sentiment: "neutral", replied: true },
  { id: 4, user: "@small_business", avatar: "SB", content: "The engagement bot saved me so much time! Highly recommend.", time: "2 hours ago", platform: "Facebook", sentiment: "positive", replied: true },
  { id: 5, user: "@digital_nomad", avatar: "DN", content: "Can I use this for multiple accounts?", time: "3 hours ago", platform: "Instagram", sentiment: "neutral", replied: false },
  { id: 6, user: "@content_creator", avatar: "CC", content: "Love the AI caption generator! Pure magic ✨", time: "5 hours ago", platform: "TikTok", sentiment: "positive", replied: false },
  { id: 7, user: "@spam_bot_123", avatar: "SB", content: "Buy followers cheap! Click http://sketchy.link now!", time: "6 hours ago", platform: "Instagram", sentiment: "negative", replied: false },
];

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case "positive": return "text-brand-green bg-brand-green/10 border-brand-green/30";
    case "negative": return "text-destructive bg-destructive/10 border-destructive/30";
    default: return "text-muted-foreground bg-muted/50 border-border";
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case "Instagram": return "bg-gradient-to-r from-pink-500 to-orange-500";
    case "Twitter": return "bg-blue-500";
    case "Facebook": return "bg-blue-600";
    case "TikTok": return "bg-gradient-to-r from-cyan-400 to-pink-500";
    default: return "bg-muted";
  }
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

export const CommentManager = () => {
  const [comments, setComments] = useState(mockComments);
  const [selectedComments, setSelectedComments] = useState<number[]>([]);
  const [priority, setPriority] = useState<number[]>([]);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<typeof mockComments[number] | null>(null);
  const [bulkReplyOpen, setBulkReplyOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CommentFilters>(DEFAULT_FILTERS);
  const [keyword, setKeyword] = useState("");
  const [showHidden, setShowHidden] = useState(false);

  const [modRules, setModRules] = useState<ModerationRule[]>(() => loadJSON(MOD_RULES_KEY, [] as ModerationRule[]));
  const [modState, setModState] = useState<ModState>(() => loadJSON(MOD_STATE_KEY, DEFAULT_MOD_STATE));
  const [modOpen, setModOpen] = useState(false);

  const [qrSettings, setQrSettings] = useState<QuickReplySettings>(() => loadJSON(QR_SETTINGS_KEY, DEFAULT_QR_SETTINGS));
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => { localStorage.setItem(MOD_RULES_KEY, JSON.stringify(modRules)); }, [modRules]);
  useEffect(() => { localStorage.setItem(MOD_STATE_KEY, JSON.stringify(modState)); }, [modState]);
  useEffect(() => { localStorage.setItem(QR_SETTINGS_KEY, JSON.stringify(qrSettings)); }, [qrSettings]);

  const platforms = useMemo(() => Array.from(new Set(mockComments.map((c) => c.platform))), []);

  // Auto-apply moderation rules whenever rules or comments change
  useEffect(() => {
    const active = modRules.filter((r) => r.enabled);
    if (active.length === 0) return;
    const newHidden = new Set(modState.hidden);
    const newFlagged = new Set(modState.flagged);
    const newBlocked = new Set(modState.blockedUsers);
    for (const c of comments) {
      const text = c.content.toLowerCase();
      for (const rule of active) {
        if (text.includes(rule.keyword)) {
          if (rule.action === "hide") newHidden.add(c.id);
          if (rule.action === "flag") newFlagged.add(c.id);
          if (rule.action === "block") { newBlocked.add(c.user); newHidden.add(c.id); }
        }
      }
    }
    setModState((prev) => {
      const next = {
        hidden: Array.from(newHidden),
        flagged: Array.from(newFlagged),
        blockedUsers: Array.from(newBlocked),
      };
      if (
        next.hidden.length === prev.hidden.length &&
        next.flagged.length === prev.flagged.length &&
        next.blockedUsers.length === prev.blockedUsers.length
      ) return prev;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modRules, comments]);

  const isBlocked = (user: string) => modState.blockedUsers.includes(user);
  const isHidden = (id: number, user: string) => modState.hidden.includes(id) || isBlocked(user);
  const isFlagged = (id: number) => modState.flagged.includes(id);

  const filteredComments = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = comments.filter((c) => {
      if (!showHidden && isHidden(c.id, c.user)) return false;
      if (filters.platform !== "all" && c.platform !== filters.platform) return false;
      if (filters.sentiment !== "all" && c.sentiment !== filters.sentiment) return false;
      if (filters.status === "pending" && c.replied) return false;
      if (filters.status === "replied" && !c.replied) return false;
      if (kw && !(c.content.toLowerCase().includes(kw) || c.user.toLowerCase().includes(kw))) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const ap = priority.includes(a.id) ? 1 : 0;
      const bp = priority.includes(b.id) ? 1 : 0;
      return bp - ap;
    });
  }, [comments, filters, keyword, priority, modState, showHidden]);

  const activeFilterCount =
    (filters.platform !== "all" ? 1 : 0) +
    (filters.sentiment !== "all" ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0);

  const toggleSelect = (id: number) => {
    setSelectedComments((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedComments.length === filteredComments.length) setSelectedComments([]);
    else setSelectedComments(filteredComments.map((c) => c.id));
  };

  const openReply = (c: typeof mockComments[number]) => { setReplyTarget(c); setReplyOpen(true); };

  const sendReply = (commentId: number, text: string) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, replied: true } : c)));
    toast.success(`Reply sent (${text.length} chars)`);
  };

  const bulkMarkReplied = () => {
    setComments((prev) => prev.map((c) => (selectedComments.includes(c.id) ? { ...c, replied: true } : c)));
    setSelectedComments([]);
    toast.success("Marked as replied");
  };

  const bulkSendReplies = (payload: { id: number; text: string }[]) => {
    const ids = new Set(payload.map((p) => p.id));
    setComments((prev) => prev.map((c) => (ids.has(c.id) ? { ...c, replied: true } : c)));
    setSelectedComments([]);
    toast.success(`Sent ${payload.length} repl${payload.length === 1 ? "y" : "ies"}`);
  };

  const bulkDelete = () => {
    setComments((prev) => prev.filter((c) => !selectedComments.includes(c.id)));
    setSelectedComments([]);
    toast.success("Deleted");
  };

  const togglePriority = (id: number) => {
    setPriority((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const applyModeration = (id: number, user: string, action: ModerationAction) => {
    setModState((prev) => {
      const next = { ...prev, hidden: [...prev.hidden], flagged: [...prev.flagged], blockedUsers: [...prev.blockedUsers] };
      if (action === "hide") {
        next.hidden = prev.hidden.includes(id) ? prev.hidden.filter((x) => x !== id) : [...prev.hidden, id];
      } else if (action === "flag") {
        next.flagged = prev.flagged.includes(id) ? prev.flagged.filter((x) => x !== id) : [...prev.flagged, id];
      } else if (action === "block") {
        next.blockedUsers = prev.blockedUsers.includes(user)
          ? prev.blockedUsers.filter((x) => x !== user)
          : [...prev.blockedUsers, user];
      }
      return next;
    });
    const verb = action === "block" ? (modState.blockedUsers.includes(user) ? "Unblocked" : "Blocked")
      : action === "flag" ? (modState.flagged.includes(id) ? "Unflagged" : "Flagged")
      : (modState.hidden.includes(id) ? "Shown" : "Hidden");
    toast.success(`${verb} ${action === "block" ? user : "comment"}`);
  };

  const bulkModerate = (action: ModerationAction) => {
    selectedComments.forEach((id) => {
      const c = comments.find((x) => x.id === id);
      if (c) applyModeration(id, c.user, action);
    });
    setSelectedComments([]);
  };

  const quickAiReply = (c: typeof mockComments[number]) => {
    const draft = renderQuickReply(qrSettings, {
      user: c.user,
      platform: c.platform,
      sentiment: c.sentiment,
    });
    sendReply(c.id, draft);
  };

  const unrepliedCount = comments.filter((c) => !c.replied && !isHidden(c.id, c.user)).length;
  const priorityCount = priority.length;
  const hiddenCount = comments.filter((c) => isHidden(c.id, c.user)).length;
  const flaggedCount = modState.flagged.length;

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-brand-cyan/20 glow-blue">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Comment Manager</h3>
            <p className="text-sm text-muted-foreground">{unrepliedCount} comments awaiting reply</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setModOpen(true)}>
            <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Moderation
            {modRules.filter((r) => r.enabled).length > 0 && (
              <Badge className="ml-1 h-4 px-1 text-[10px] bg-primary text-primary-foreground">
                {modRules.filter((r) => r.enabled).length}
              </Badge>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setQrOpen(true)}>
            <Settings className="h-3.5 w-3.5 mr-1" /> Quick AI
          </Button>
          <Button size="sm" variant="outline" onClick={() => setFilterOpen(true)}>
            <Filter className="h-3.5 w-3.5 mr-1" /> Filter
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-4 px-1 text-[10px] bg-primary text-primary-foreground">{activeFilterCount}</Badge>
            )}
          </Button>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {filteredComments.length} / {comments.length}
          </Badge>
        </div>
      </div>

      {/* Moderation status strip */}
      {(hiddenCount > 0 || flaggedCount > 0 || modState.blockedUsers.length > 0) && (
        <div className="mb-4 p-2.5 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {hiddenCount > 0 && (
              <span className="flex items-center gap-1"><EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> {hiddenCount} hidden</span>
            )}
            {flaggedCount > 0 && (
              <span className="flex items-center gap-1 text-brand-orange"><Flag className="h-3.5 w-3.5" /> {flaggedCount} flagged</span>
            )}
            {modState.blockedUsers.length > 0 && (
              <span className="flex items-center gap-1 text-destructive"><Ban className="h-3.5 w-3.5" /> {modState.blockedUsers.length} blocked</span>
            )}
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowHidden((v) => !v)}>
            <Eye className="h-3.5 w-3.5 mr-1" /> {showHidden ? "Hide" : "Show"} hidden
          </Button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedComments.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between animate-fade-in-scale flex-wrap gap-2">
          <span className="text-sm font-medium">
            {selectedComments.length} comment{selectedComments.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => setBulkReplyOpen(true)}>
              <Sparkles className="mr-1 h-4 w-4" /> AI Bulk Reply
            </Button>
            <Button size="sm" variant="outline" onClick={bulkMarkReplied} className="border-brand-green text-brand-green hover:bg-brand-green/10">
              <CheckCheck className="mr-1 h-4 w-4" /> Mark Replied
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkModerate("hide")}>
              <EyeOff className="mr-1 h-4 w-4" /> Hide
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkModerate("flag")} className="border-brand-orange text-brand-orange hover:bg-brand-orange/10">
              <Flag className="mr-1 h-4 w-4" /> Flag
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkModerate("block")} className="border-destructive text-destructive hover:bg-destructive/10">
              <Ban className="mr-1 h-4 w-4" /> Block
            </Button>
            <Button size="sm" variant="outline" onClick={bulkDelete} className="border-destructive text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Search + Select All */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 pb-3 border-b border-border">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search text or @handle…"
            className="h-9 pl-8"
            aria-label="Search comments"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="cm-select-all"
            checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
            onCheckedChange={selectAll}
          />
          <label htmlFor="cm-select-all" className="text-sm text-muted-foreground cursor-pointer">Select all</label>
          {priorityCount > 0 && (
            <Badge variant="secondary" className="bg-brand-orange/10 text-brand-orange">
              <Star className="h-3 w-3 mr-1 fill-current" /> {priorityCount} pinned
            </Badge>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredComments.map((comment) => {
          const hidden = isHidden(comment.id, comment.user);
          const flagged = isFlagged(comment.id);
          const blocked = isBlocked(comment.user);
          return (
            <div
              key={comment.id}
              className={`p-4 rounded-xl border transition-all ${
                selectedComments.includes(comment.id)
                  ? "border-primary bg-primary/5"
                  : flagged
                    ? "border-brand-orange/40 bg-brand-orange/5"
                    : hidden
                      ? "border-dashed border-border/60 bg-muted/20 opacity-70"
                      : "border-border bg-secondary/30 hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox checked={selectedComments.includes(comment.id)} onCheckedChange={() => toggleSelect(comment.id)} />
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getPlatformColor(comment.platform)}`}>
                  {comment.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{comment.user}</span>
                    <Badge variant="secondary" className="text-xs">{comment.platform}</Badge>
                    <Badge className={`text-xs border ${getSentimentColor(comment.sentiment)}`}>{comment.sentiment}</Badge>
                    {priority.includes(comment.id) && (
                      <Badge variant="secondary" className="text-xs bg-brand-orange/10 text-brand-orange border-brand-orange/30">
                        <Star className="h-3 w-3 mr-1 fill-current" /> Priority
                      </Badge>
                    )}
                    {flagged && (
                      <Badge variant="secondary" className="text-xs bg-brand-orange/10 text-brand-orange border-brand-orange/30">
                        <Flag className="h-3 w-3 mr-1" /> Flagged
                      </Badge>
                    )}
                    {blocked && (
                      <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                        <Ban className="h-3 w-3 mr-1" /> Blocked
                      </Badge>
                    )}
                    {hidden && !blocked && (
                      <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground border-border">
                        <EyeOff className="h-3 w-3 mr-1" /> Hidden
                      </Badge>
                    )}
                    {comment.replied && (
                      <Badge variant="secondary" className="text-xs bg-brand-green/10 text-brand-green border-brand-green/30">
                        <Check className="mr-1 h-3 w-3" /> Replied
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground mb-2">{comment.content}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-2">{comment.time}</span>

                    <Button size="sm" variant="ghost" className="h-7 text-xs hover:text-brand-orange" onClick={() => togglePriority(comment.id)}>
                      <Star className={`mr-1 h-3 w-3 ${priority.includes(comment.id) ? "fill-brand-orange text-brand-orange" : ""}`} />
                      {priority.includes(comment.id) ? "Pinned" : "Pin"}
                    </Button>

                    <Button size="sm" variant="ghost" className="h-7 text-xs hover:text-muted-foreground" onClick={() => applyModeration(comment.id, comment.user, "hide")}>
                      <EyeOff className="mr-1 h-3 w-3" /> {hidden && !blocked ? "Unhide" : "Hide"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs hover:text-brand-orange" onClick={() => applyModeration(comment.id, comment.user, "flag")}>
                      <Flag className={`mr-1 h-3 w-3 ${flagged ? "fill-brand-orange text-brand-orange" : ""}`} /> {flagged ? "Unflag" : "Flag"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs hover:text-destructive" onClick={() => applyModeration(comment.id, comment.user, "block")}>
                      <Ban className="mr-1 h-3 w-3" /> {blocked ? "Unblock" : "Block"}
                    </Button>

                    {!comment.replied && !hidden && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 text-xs hover:text-primary" onClick={() => quickAiReply(comment)}>
                          <Zap className="mr-1 h-3 w-3" /> Quick AI
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs hover:text-primary" onClick={() => openReply(comment)}>
                          <Sparkles className="mr-1 h-3 w-3" /> AI Reply
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs hover:text-primary" onClick={() => openReply(comment)}>
                          <Reply className="mr-1 h-3 w-3" /> Reply
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredComments.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No comments match the current filter.
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {[
          { label: "Positive", value: comments.filter((c) => c.sentiment === "positive").length, color: "text-brand-green" },
          { label: "Flagged", value: flaggedCount, color: "text-brand-orange" },
          { label: "Pending", value: unrepliedCount, color: "text-brand-orange" },
          { label: "Replied", value: comments.filter((c) => c.replied).length, color: "text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-lg bg-secondary/50 text-center">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <ReplyDialog
        open={replyOpen}
        onOpenChange={setReplyOpen}
        comment={replyTarget}
        onSend={(text) => replyTarget && sendReply(replyTarget.id, text)}
      />
      <BulkReplyDialog
        open={bulkReplyOpen}
        onOpenChange={setBulkReplyOpen}
        comments={comments.filter((c) => selectedComments.includes(c.id))}
        onSend={bulkSendReplies}
      />
      <FilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        initial={filters}
        onApply={setFilters}
        platforms={platforms}
      />
      <ModerationDialog
        open={modOpen}
        onOpenChange={setModOpen}
        rules={modRules}
        onSave={(r) => { setModRules(r); toast.success("Moderation rules saved"); }}
      />
      <QuickReplySettingsDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        value={qrSettings}
        onSave={(v) => { setQrSettings(v); toast.success("Quick reply settings saved"); }}
      />
    </div>
  );
};
