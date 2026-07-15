import { useState } from "react";
import { MessageSquare, Bot, Send, Plus, Zap, Users, Clock, Target, Sparkles, ArrowRight, Settings2, Play, Pause, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { logRun } from "@/hooks/useRunHistory";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const welcomeTemplates = [
  { id: 1, name: "New Follower Welcome", trigger: "new_follow", message: "Hey! 👋 Thanks for following! How can I help you today?", active: true, sent: 1247 },
  { id: 2, name: "Story Reply", trigger: "story_reply", message: "Thanks for engaging with my story! 🙌 What would you like to know more about?", active: true, sent: 892 },
  { id: 3, name: "Link Request", trigger: "keyword:link", message: "Here's the link you requested! 🔗 Let me know if you have any questions.", active: false, sent: 456 },
];

const keywordResponses = [
  { id: 1, keyword: "pricing", response: "Our pricing starts at $29/month. Check out lovable.dev/pricing for details!", active: true },
  { id: 2, keyword: "help", response: "I'm here to help! What do you need assistance with?", active: true },
  { id: 3, keyword: "demo", response: "Would you like to schedule a demo? Reply with your preferred time!", active: true },
  { id: 4, keyword: "free trial", response: "Yes! We offer a 14-day free trial. Get started at lovable.dev/trial", active: false },
];

const recentMessages = [
  { id: 1, user: "@sarah_creator", avatar: "SC", message: "Love your content! Where can I learn more?", time: "2 min ago", replied: true, autoReplied: true },
  { id: 2, user: "@tech_guru", avatar: "TG", message: "What's your pricing for enterprise?", time: "15 min ago", replied: false, autoReplied: false },
  { id: 3, user: "@digital_nomad", avatar: "DN", message: "Can you help with automation?", time: "1 hour ago", replied: true, autoReplied: true },
  { id: 4, user: "@startup_life", avatar: "SL", message: "Interested in a partnership!", time: "2 hours ago", replied: false, autoReplied: false },
];

const faqFlows = [
  { id: 1, name: "Pricing Questions", questions: 5, responses: 892, conversionRate: "12%" },
  { id: 2, name: "Getting Started", questions: 8, responses: 1456, conversionRate: "24%" },
  { id: 3, name: "Technical Support", questions: 12, responses: 678, conversionRate: "8%" },
];

export const DMAutomation = () => {
  const [isActive, setIsActive] = useState(true);
  const [templates, setTemplates] = useState(welcomeTemplates);
  const [keywords, setKeywords] = useState(keywordResponses);
  const [messages, setMessages] = useState(recentMessages);
  const [newKeyword, setNewKeyword] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [welcomeDialog, setWelcomeDialog] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [welcomeTrigger, setWelcomeTrigger] = useState("new_follow");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const toggleBot = () => {
    setIsActive((prev) => {
      toast(prev ? "DM bot paused" : "DM bot started");
      return !prev;
    });
  };

  const addKeyword = () => {
    if (!newKeyword.trim() || !newResponse.trim()) {
      toast.error("Fill in both fields");
      return;
    }
    setKeywords((prev) => [
      ...prev,
      { id: Date.now(), keyword: newKeyword.trim(), response: newResponse.trim(), active: true },
    ]);
    setNewKeyword("");
    setNewResponse("");
    toast.success("Keyword response added");
  };

  const stats = {
    totalSent: "4.8K",
    responseRate: "92%",
    avgResponseTime: "< 1 min",
    leadsGenerated: 156,
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl transition-colors ${isActive ? "bg-brand-green/20" : "bg-secondary"}`}>
            <MessageSquare className={`h-6 w-6 ${isActive ? "text-brand-green" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold">DM Automation</h3>
            <p className="text-sm text-muted-foreground">Automate responses and lead qualification</p>
          </div>
        </div>
        <Button
          onClick={toggleBot}
          className={isActive 
            ? "bg-brand-green hover:bg-brand-green/90 text-white" 
            : "bg-secondary hover:bg-secondary/90"
          }
        >
          {isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {isActive ? "Pause Bot" : "Start Bot"}
        </Button>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl flex items-center justify-between ${
        isActive ? "bg-brand-green/10 border border-brand-green/30" : "bg-secondary border border-border"
      }`}>
        <div className="flex items-center gap-3">
          {isActive && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-green"></span>
            </span>
          )}
          <span className={`font-medium ${isActive ? "text-brand-green" : "text-muted-foreground"}`}>
            {isActive ? "DM Bot is active and responding" : "DM Bot is paused"}
          </span>
        </div>
        <Badge variant="secondary">
          <Bot className="h-3 w-3 mr-1" />
          Auto-Reply Enabled
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Messages Sent", value: stats.totalSent, icon: Send, color: "text-primary" },
          { label: "Response Rate", value: stats.responseRate, icon: Zap, color: "text-brand-green" },
          { label: "Avg. Response Time", value: stats.avgResponseTime, icon: Clock, color: "text-brand-orange" },
          { label: "Leads Generated", value: stats.leadsGenerated, icon: Target, color: "text-brand-purple" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Welcome Messages */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Welcome Messages
            </h4>
            <Button size="sm" variant="outline" onClick={() => setWelcomeDialog(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-4 rounded-xl border transition-all ${
                  template.active ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Trigger: {template.trigger}
                    </Badge>
                  </div>
                  <Switch
                    checked={template.active}
                    onCheckedChange={(v) => {
                      setTemplates((prev) => prev.map((t) => (t.id === template.id ? { ...t, active: v } : t)));
                      toast(v ? "Template enabled" : "Template disabled");
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-2">{template.message}</p>
                <p className="text-xs text-muted-foreground">
                  Sent {template.sent.toLocaleString()} times
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Keyword Responses */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Keyword Triggers
            </h4>
          </div>
          <div className="space-y-3 mb-4">
            {keywords.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge className="bg-primary/10 text-primary border-primary/30">
                    {item.keyword}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                    {item.response}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={item.active}
                    onCheckedChange={(v) =>
                      setKeywords((prev) => prev.map((k) => (k.id === item.id ? { ...k, active: v } : k)))
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => {
                      setKeywords((prev) => prev.filter((k) => k.id !== item.id));
                      toast.success("Keyword removed");
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium mb-2">Add New Keyword</p>
            <div className="space-y-2">
              <Input
                placeholder="Keyword (e.g., 'pricing')"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="bg-secondary/50"
              />
              <Textarea
                placeholder="Auto-response message..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                className="bg-secondary/50 min-h-[60px]"
              />
              <Button onClick={addKeyword} className="w-full bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Keyword Response
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Recent Messages
          </h4>
          <Badge variant="secondary">
            {messages.filter(m => !m.replied).length} pending
          </Badge>
        </div>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex flex-col gap-3 p-4 rounded-xl bg-secondary/30 border border-border"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-brand-purple flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {msg.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{msg.user}</p>
                      {msg.autoReplied && (
                        <Badge variant="secondary" className="text-xs bg-brand-green/10 text-brand-green">
                          <Bot className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                      {msg.replied && !msg.autoReplied && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Replied</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">{msg.time}</span>
                  {!msg.replied && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => {
                        setReplyingTo(replyingTo === msg.id ? null : msg.id);
                        setReplyText("");
                      }}
                    >
                      Reply
                    </Button>
                  )}
                </div>
              </div>
              {replyingTo === msg.id && (
                <div className="animate-fade-in-scale flex flex-col gap-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply…"
                    className="min-h-[70px] bg-background"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                    <Button
                      size="sm"
                      disabled={!replyText.trim()}
                      onClick={() => {
                        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, replied: true } : m)));
                        logRun({
                          toolKey: "dm-automation",
                          action: "reply",
                          status: "success",
                          input: { user: msg.user, message: replyText.slice(0, 200) },
                        });
                        setReplyingTo(null);
                        setReplyText("");
                        toast.success(`Reply sent to ${msg.user}`);
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* FAQ Flows */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          FAQ Bot Flows
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          {faqFlows.map((flow) => (
            <div key={flow.id} className="p-4 rounded-xl bg-secondary/50 border border-border">
              <p className="font-medium mb-2">{flow.name}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span>{flow.questions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responses:</span>
                  <span className="text-brand-green">{flow.responses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversion:</span>
                  <span className="text-primary">{flow.conversionRate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Welcome Message Dialog */}
      <Dialog open={welcomeDialog} onOpenChange={setWelcomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Welcome Message</DialogTitle>
            <DialogDescription>Create an auto-reply triggered by follows, mentions, or keywords.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="wm-name">Name</Label>
              <Input id="wm-name" value={welcomeName} onChange={(e) => setWelcomeName(e.target.value)} placeholder="New Follower Welcome" />
            </div>
            <div>
              <Label htmlFor="wm-trigger">Trigger</Label>
              <Input id="wm-trigger" value={welcomeTrigger} onChange={(e) => setWelcomeTrigger(e.target.value)} placeholder="new_follow, story_reply, keyword:..." />
            </div>
            <div>
              <Label htmlFor="wm-message">Message</Label>
              <Textarea id="wm-message" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Hey! Thanks for following…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWelcomeDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!welcomeName.trim() || !welcomeMessage.trim()) {
                  toast.error("Name and message are required");
                  return;
                }
                setTemplates((prev) => [
                  ...prev,
                  { id: Date.now(), name: welcomeName.trim(), trigger: welcomeTrigger, message: welcomeMessage.trim(), active: true, sent: 0 },
                ]);
                setWelcomeName("");
                setWelcomeMessage("");
                setWelcomeDialog(false);
                toast.success("Welcome message added");
              }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

