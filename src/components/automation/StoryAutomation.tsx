import { useState } from "react";
import { Film, Play, Clock, Eye, Link2, MessageCircle, BarChart3, Plus, Sparkles, Image, Palette, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const storyTemplates = [
  { id: 1, name: "Product Showcase", thumbnail: "🛍️", category: "Sales", uses: 1240 },
  { id: 2, name: "Behind the Scenes", thumbnail: "🎬", category: "Engagement", uses: 890 },
  { id: 3, name: "Poll Template", thumbnail: "📊", category: "Interactive", uses: 2100 },
  { id: 4, name: "Q&A Story", thumbnail: "❓", category: "Interactive", uses: 1560 },
  { id: 5, name: "Countdown Timer", thumbnail: "⏰", category: "Promo", uses: 780 },
  { id: 6, name: "Quote of the Day", thumbnail: "💬", category: "Content", uses: 1890 },
];

const scheduledStories = [
  { id: 1, title: "Morning Motivation", time: "09:00 AM", platform: "instagram", status: "scheduled", views: null },
  { id: 2, title: "Product Teaser", time: "02:00 PM", platform: "instagram", status: "scheduled", views: null },
  { id: 3, title: "Live Announcement", time: "06:00 PM", platform: "instagram", status: "scheduled", views: null },
];

const storyAnalytics = [
  { id: 1, title: "Yesterday's Poll", views: 2847, taps: 342, replies: 89, exitRate: "12%" },
  { id: 2, title: "BTS Content", views: 1923, taps: 156, replies: 45, exitRate: "18%" },
  { id: 3, title: "Product Launch", views: 4521, taps: 678, replies: 234, exitRate: "8%" },
];

const highlights = [
  { id: 1, name: "Products", stories: 12, cover: "🛒" },
  { id: 2, name: "Reviews", stories: 8, cover: "⭐" },
  { id: 3, name: "Tips", stories: 15, cover: "💡" },
  { id: 4, name: "Team", stories: 6, cover: "👥" },
];

export const StoryAutomation = () => {
  const [autoPost, setAutoPost] = useState(true);
  const [optimalTiming, setOptimalTiming] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20">
            <Film className="h-6 w-6 text-pink-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Story Automation</h3>
            <p className="text-sm text-muted-foreground">Automate your story posting and engagement</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Create Story
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Stories Today", value: "8", icon: Film, color: "text-pink-500" },
          { label: "Total Views", value: "12.4K", icon: Eye, color: "text-primary" },
          { label: "Avg. Completion", value: "78%", icon: BarChart3, color: "text-brand-green" },
          { label: "Link Taps", value: "342", icon: Link2, color: "text-brand-purple" },
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Templates */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" />
              Story Templates
            </h4>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Custom
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {storyTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`
                  p-4 rounded-xl border cursor-pointer transition-all
                  ${selectedTemplate === template.id 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-secondary/30 hover:border-primary/50"
                  }
                `}
              >
                <div className="text-4xl mb-3">{template.thumbnail}</div>
                <p className="font-medium text-sm">{template.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                  <span className="text-xs text-muted-foreground">{template.uses} uses</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Auto Settings
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-sm">Auto-Post Stories</p>
                  <p className="text-xs text-muted-foreground">Post at optimal times</p>
                </div>
                <Switch checked={autoPost} onCheckedChange={setAutoPost} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-sm">AI Timing</p>
                  <p className="text-xs text-muted-foreground">Optimize for engagement</p>
                </div>
                <Switch checked={optimalTiming} onCheckedChange={setOptimalTiming} />
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="glass-card p-6">
            <h4 className="text-lg font-semibold mb-4">Story Highlights</h4>
            <div className="grid grid-cols-4 gap-2">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="text-center group cursor-pointer">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 p-0.5 mx-auto mb-1 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-xl">
                      {highlight.cover}
                    </div>
                  </div>
                  <p className="text-xs font-medium truncate">{highlight.name}</p>
                  <p className="text-xs text-muted-foreground">{highlight.stories}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Stories */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Scheduled Stories
        </h4>
        <div className="space-y-3">
          {scheduledStories.map((story) => (
            <div
              key={story.id}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                  <Film className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">{story.title}</p>
                  <p className="text-sm text-muted-foreground">{story.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-brand-green/10 text-brand-green border-brand-green/30">
                  {story.status}
                </Badge>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Story Analytics */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Recent Story Performance
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Story</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Views</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Taps</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Replies</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Exit Rate</th>
              </tr>
            </thead>
            <tbody>
              {storyAnalytics.map((story) => (
                <tr key={story.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 font-medium">{story.title}</td>
                  <td className="p-3 text-right text-brand-green">{story.views.toLocaleString()}</td>
                  <td className="p-3 text-right text-primary">{story.taps}</td>
                  <td className="p-3 text-right text-brand-purple">{story.replies}</td>
                  <td className="p-3 text-right text-muted-foreground">{story.exitRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
