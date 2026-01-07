import { useState } from "react";
import { Bot, Heart, MessageCircle, UserPlus, Eye, Play, Pause, Settings2, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const engagementTypes = [
  { id: "likes", label: "Auto Likes", icon: Heart, color: "text-pink-500", enabled: true },
  { id: "comments", label: "Auto Comments", icon: MessageCircle, color: "text-blue-500", enabled: true },
  { id: "follows", label: "Auto Follow", icon: UserPlus, color: "text-green-500", enabled: false },
  { id: "views", label: "Story Views", icon: Eye, color: "text-purple-500", enabled: true },
];

const activityLog = [
  { time: "2 min ago", action: "Liked", target: "@fitness_guru", platform: "Instagram" },
  { time: "5 min ago", action: "Commented", target: "@tech_news", platform: "Instagram" },
  { time: "8 min ago", action: "Viewed Story", target: "@travel_daily", platform: "Instagram" },
  { time: "12 min ago", action: "Liked", target: "@food_heaven", platform: "Instagram" },
  { time: "15 min ago", action: "Followed", target: "@art_studio", platform: "Instagram" },
  { time: "18 min ago", action: "Commented", target: "@startup_hub", platform: "Twitter" },
  { time: "22 min ago", action: "Liked", target: "@music_vibes", platform: "TikTok" },
  { time: "25 min ago", action: "Viewed Story", target: "@fashion_week", platform: "Instagram" },
];

export const AutoEngagementBot = () => {
  const [isActive, setIsActive] = useState(true);
  const [dailyLimit, setDailyLimit] = useState([150]);
  const [engagements, setEngagements] = useState(engagementTypes);
  const [keywords, setKeywords] = useState("#fitness #motivation #growth");

  const toggleEngagement = (id: string) => {
    setEngagements((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );
  };

  const stats = {
    todayActions: 847,
    followersGained: 23,
    engagementRate: "+12%",
  };

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isActive ? "bg-brand-green/20" : "bg-secondary"} transition-colors`}>
            <Bot className={`h-6 w-6 ${isActive ? "text-brand-green" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Auto-Engagement Bot</h3>
            <p className="text-sm text-muted-foreground">Automated interactions based on your niche</p>
          </div>
        </div>
        <Button
          onClick={() => setIsActive(!isActive)}
          className={`${
            isActive
              ? "bg-brand-green hover:bg-brand-green/90"
              : "bg-secondary hover:bg-secondary/90"
          } text-white font-semibold`}
        >
          {isActive ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause Bot
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Bot
            </>
          )}
        </Button>
      </div>

      {/* Status Banner */}
      <div
        className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
          isActive ? "bg-brand-green/10 border border-brand-green/30" : "bg-secondary border border-border"
        }`}
      >
        <div className="flex items-center gap-3">
          {isActive && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-green"></span>
            </span>
          )}
          <span className={`font-medium ${isActive ? "text-brand-green" : "text-muted-foreground"}`}>
            {isActive ? "Bot is actively engaging" : "Bot is paused"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Safe Mode Active</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Engagement Types */}
          <div>
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              Engagement Types
            </h4>
            <div className="space-y-3">
              {engagements.map((engagement) => (
                <div
                  key={engagement.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <engagement.icon className={`h-5 w-5 ${engagement.color}`} />
                    <span className="font-medium text-sm">{engagement.label}</span>
                  </div>
                  <Switch
                    checked={engagement.enabled}
                    onCheckedChange={() => toggleEngagement(engagement.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Daily Limit */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Daily Action Limit</h4>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex justify-between mb-3">
                <span className="text-sm text-muted-foreground">Actions per day</span>
                <span className="text-sm font-bold text-primary">{dailyLimit[0]}</span>
              </div>
              <Slider
                value={dailyLimit}
                onValueChange={setDailyLimit}
                max={500}
                min={50}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>50</span>
                <span>Safe Zone</span>
                <span>500</span>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Target Keywords & Hashtags</h4>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="#fitness #growth #motivation"
              className="bg-secondary/50 border-border"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Separate keywords with spaces. Bot will engage with posts using these tags.
            </p>
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Recent Activity
          </h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {activityLog.map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      log.action === "Liked"
                        ? "bg-pink-500"
                        : log.action === "Commented"
                        ? "bg-blue-500"
                        : log.action === "Followed"
                        ? "bg-green-500"
                        : "bg-purple-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">{log.action}</span>{" "}
                      <span className="font-medium text-primary">{log.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{log.platform}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-primary/10 text-center">
              <p className="text-lg font-bold text-primary">{stats.todayActions}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
            <div className="p-3 rounded-lg bg-brand-green/10 text-center">
              <p className="text-lg font-bold text-brand-green">+{stats.followersGained}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="p-3 rounded-lg bg-brand-purple/10 text-center">
              <p className="text-lg font-bold text-brand-purple">{stats.engagementRate}</p>
              <p className="text-xs text-muted-foreground">Engagement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
