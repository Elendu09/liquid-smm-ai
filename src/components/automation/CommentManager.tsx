import { useState } from "react";
import { MessageCircle, Sparkles, Send, Check, Trash2, Reply, Flag, Heart, MoreHorizontal, RefreshCw, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [activeReply, setActiveReply] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleSelect = (id: number) => {
    setSelectedComments((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map((c) => c.id));
    }
  };

  const generateAIReply = (commentId: number) => {
    setIsGenerating(true);
    setActiveReply(commentId);
    setTimeout(() => {
      const randomReply = aiReplySuggestions[Math.floor(Math.random() * aiReplySuggestions.length)];
      setReplyText(randomReply);
      setIsGenerating(false);
    }, 1000);
  };

  const sendReply = (commentId: number) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, replied: true } : c))
    );
    setActiveReply(null);
    setReplyText("");
  };

  const bulkMarkReplied = () => {
    setComments((prev) =>
      prev.map((c) => (selectedComments.includes(c.id) ? { ...c, replied: true } : c))
    );
    setSelectedComments([]);
  };

  const bulkDelete = () => {
    setComments((prev) => prev.filter((c) => !selectedComments.includes(c.id)));
    setSelectedComments([]);
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
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {comments.length} Total
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
          checked={selectedComments.length === comments.length && comments.length > 0}
          onCheckedChange={selectAll}
        />
        <span className="text-sm text-muted-foreground">Select all</span>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {comments.map((comment) => (
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
                        onClick={() => generateAIReply(comment.id)}
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        AI Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs hover:text-primary"
                        onClick={() => setActiveReply(comment.id)}
                      >
                        <Reply className="mr-1 h-3 w-3" />
                        Reply
                      </Button>
                    </div>
                  )}
                </div>

                {/* Reply Input */}
                {activeReply === comment.id && (
                  <div className="mt-3 animate-fade-in-scale">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          className="w-full p-3 rounded-lg bg-background border border-border focus:border-primary resize-none text-sm min-h-[80px]"
                        />
                        {isGenerating && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setActiveReply(null);
                          setReplyText("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => sendReply(comment.id)}
                        disabled={!replyText.trim()}
                      >
                        <Send className="mr-1 h-3 w-3" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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
    </div>
  );
};
