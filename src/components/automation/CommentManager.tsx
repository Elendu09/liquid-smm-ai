import { useMemo, useState } from "react";
import { MessageCircle, Sparkles, Check, Trash2, Reply, CheckCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ReplyDialog } from "@/components/engage/ReplyDialog";
import { BulkReplyDialog } from "@/components/engage/BulkReplyDialog";
import { FilterDialog, DEFAULT_FILTERS, type CommentFilters } from "@/components/engage/FilterDialog";


const mockComments = [
  {
    id: 1,
    user: "@fitness_enthusiast",
    avatar: "FE",
    content: "This is amazing! How do I get started with your automation tools?",
    time: "2 min ago",
    platform: "Instagram",
    sentiment: "positive",
    replied: false,
  },
  {
    id: 2,
    user: "@tech_startup",
    avatar: "TS",
    content: "Great content! Would love to see more tutorials on scheduling.",
    time: "15 min ago",
    platform: "Instagram",
    sentiment: "positive",
    replied: false,
  },
  {
    id: 3,
    user: "@marketing_pro",
    avatar: "MP",
    content: "Is there a free trial available?",
    time: "1 hour ago",
    platform: "Twitter",
    sentiment: "neutral",
    replied: true,
  },
  {
    id: 4,
    user: "@small_business",
    avatar: "SB",
    content: "The engagement bot saved me so much time! Highly recommend.",
    time: "2 hours ago",
    platform: "Facebook",
    sentiment: "positive",
    replied: true,
  },
  {
    id: 5,
    user: "@digital_nomad",
    avatar: "DN",
    content: "Can I use this for multiple accounts?",
    time: "3 hours ago",
    platform: "Instagram",
    sentiment: "neutral",
    replied: false,
  },
  {
    id: 6,
    user: "@content_creator",
    avatar: "CC",
    content: "Love the AI caption generator! Pure magic ✨",
    time: "5 hours ago",
    platform: "TikTok",
    sentiment: "positive",
    replied: false,
  },
];

const aiReplySuggestions = [
  "Thank you so much! 🙏 You can get started by signing up at our website. We offer a free trial!",
  "We appreciate your feedback! More tutorials are coming soon. Stay tuned! 📚",
  "Yes, absolutely! You can manage multiple accounts with our Pro plan. DM us for details!",
  "Thanks for the kind words! We're thrilled to hear the bot is helping you save time! 🚀",
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

export const CommentManager = () => {
  const [comments, setComments] = useState(mockComments);
  const [selectedComments, setSelectedComments] = useState<number[]>([]);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<typeof mockComments[number] | null>(null);
  const [bulkReplyOpen, setBulkReplyOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CommentFilters>(DEFAULT_FILTERS);

  const platforms = useMemo(() => Array.from(new Set(mockComments.map((c) => c.platform))), []);

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      if (filters.platform !== "all" && c.platform !== filters.platform) return false;
      if (filters.sentiment !== "all" && c.sentiment !== filters.sentiment) return false;
      if (filters.status === "pending" && c.replied) return false;
      if (filters.status === "replied" && !c.replied) return false;
      return true;
    });
  }, [comments, filters]);

  const activeFilterCount =
    (filters.platform !== "all" ? 1 : 0) +
    (filters.sentiment !== "all" ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0);

  const toggleSelect = (id: number) => {
    setSelectedComments((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedComments.length === filteredComments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(filteredComments.map((c) => c.id));
    }
  };

  const openReply = (c: typeof mockComments[number]) => {
    setReplyTarget(c);
    setReplyOpen(true);
  };

  const sendReply = (commentId: number, text: string) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, replied: true } : c)));
    toast.success(`Reply sent (${text.length} chars)`);
  };

  const bulkMarkReplied = () => {
    setComments((prev) =>
      prev.map((c) => (selectedComments.includes(c.id) ? { ...c, replied: true } : c))
    );
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

  const unrepliedCount = comments.filter((c) => !c.replied).length;


  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-brand-cyan/20 glow-blue">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Comment Manager</h3>
            <p className="text-sm text-muted-foreground">
              {unrepliedCount} comments awaiting reply
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setFilterOpen(true)}>
            <Filter className="h-3.5 w-3.5 mr-1" /> Filter
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-4 px-1 text-[10px] bg-primary text-primary-foreground">{activeFilterCount}</Badge>
            )}
          </Button>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {filteredComments.length} / {comments.length}
          </Badge>
          <Badge variant="secondary" className="bg-brand-green/10 text-brand-green">
            {comments.filter((c) => c.replied).length} Replied
          </Badge>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedComments.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between animate-fade-in-scale">
          <span className="text-sm font-medium">
            {selectedComments.length} comment{selectedComments.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={bulkMarkReplied} className="border-brand-green text-brand-green hover:bg-brand-green/10">
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark Replied
            </Button>
            <Button size="sm" variant="outline" onClick={bulkDelete} className="border-destructive text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Select All */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <Checkbox
          checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
          onCheckedChange={selectAll}
        />
        <span className="text-sm text-muted-foreground">Select all</span>
      </div>


      {/* Comments List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredComments.map((comment) => (
          <div
            key={comment.id}
            className={`p-4 rounded-xl border transition-all ${
              selectedComments.includes(comment.id)
                ? "border-primary bg-primary/5"
                : "border-border bg-secondary/30 hover:border-primary/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedComments.includes(comment.id)}
                onCheckedChange={() => toggleSelect(comment.id)}
              />

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getPlatformColor(comment.platform)}`}>
                {comment.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm">{comment.user}</span>
                  <Badge variant="secondary" className="text-xs">{comment.platform}</Badge>
                  <Badge className={`text-xs border ${getSentimentColor(comment.sentiment)}`}>
                    {comment.sentiment}
                  </Badge>
                  {comment.replied && (
                    <Badge variant="secondary" className="text-xs bg-brand-green/10 text-brand-green border-brand-green/30">
                      <Check className="mr-1 h-3 w-3" /> Replied
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground mb-2">{comment.content}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{comment.time}</span>

                  {!comment.replied && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs hover:text-primary"
                        onClick={() => openReply(comment)}
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        AI Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs hover:text-primary"
                        onClick={() => openReply(comment)}
                      >
                        <Reply className="mr-1 h-3 w-3" />
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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
          { label: "Neutral", value: comments.filter((c) => c.sentiment === "neutral").length, color: "text-muted-foreground" },
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
      <FilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        initial={filters}
        onApply={setFilters}
        platforms={platforms}
      />
    </div>
  );
};

