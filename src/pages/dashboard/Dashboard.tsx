import { Link } from "react-router-dom";
import { 
  Sparkles, Calendar, Bot, BarChart3, Hash, MessageSquare, 
  TrendingUp, Users, Clock, Zap, ArrowUp, ArrowDown, 
  Instagram, Twitter, Youtube, Eye, Heart, Share2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const tools = [
  { title: "Caption Generator", icon: Sparkles, href: "/dashboard/caption-generator", color: "from-brand-blue to-brand-cyan", description: "AI-powered captions" },
  { title: "Post Scheduler", icon: Calendar, href: "/dashboard/scheduler", color: "from-brand-purple to-brand-pink", description: "Schedule content" },
  { title: "Engagement Bot", icon: Bot, href: "/dashboard/engagement-bot", color: "from-brand-green to-brand-cyan", description: "Auto engagement" },
  { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics", color: "from-brand-orange to-brand-pink", description: "Growth insights" },
  { title: "Hashtag Research", icon: Hash, href: "/dashboard/hashtag-research", color: "from-brand-cyan to-brand-blue", description: "Find trending tags" },
  { title: "Comment Manager", icon: MessageSquare, href: "/dashboard/comment-manager", color: "from-brand-pink to-brand-purple", description: "Manage comments" },
];

const stats = [
  { label: "Total Followers", value: "24.5K", change: "+12%", isPositive: true, icon: Users },
  { label: "Engagement Rate", value: "4.8%", change: "+0.5%", isPositive: true, icon: TrendingUp },
  { label: "Posts Scheduled", value: "47", change: "+8", isPositive: true, icon: Calendar },
  { label: "Hours Saved", value: "156", change: "+24", isPositive: true, icon: Clock },
];

const chartData = [
  { day: "Mon", followers: 23100, engagement: 4.2 },
  { day: "Tue", followers: 23400, engagement: 4.5 },
  { day: "Wed", followers: 23800, engagement: 4.3 },
  { day: "Thu", followers: 24100, engagement: 4.7 },
  { day: "Fri", followers: 24300, engagement: 4.6 },
  { day: "Sat", followers: 24450, engagement: 4.9 },
  { day: "Sun", followers: 24500, engagement: 4.8 },
];

const upcomingPosts = [
  { id: 1, title: "Product Launch Announcement", platform: "instagram", time: "Today, 3:00 PM", status: "ready" },
  { id: 2, title: "Weekly Tips Thread", platform: "twitter", time: "Today, 5:00 PM", status: "ready" },
  { id: 3, title: "Behind the Scenes", platform: "instagram", time: "Tomorrow, 10:00 AM", status: "draft" },
  { id: 4, title: "Tutorial Video", platform: "youtube", time: "Tomorrow, 2:00 PM", status: "processing" },
];

const recentActivity = [
  { action: "New follower", detail: "@fitness_pro started following you", time: "2 min ago", icon: Users },
  { action: "Comment", detail: "@tech_guru commented on your post", time: "15 min ago", icon: MessageSquare },
  { action: "Post published", detail: "Your scheduled post is live", time: "1 hour ago", icon: Share2 },
  { action: "Engagement", detail: "50 new likes on your reel", time: "2 hours ago", icon: Heart },
];

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case "instagram": return Instagram;
    case "twitter": return Twitter;
    case "youtube": return Youtube;
    default: return Instagram;
  }
};

export default function Dashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your social media performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            View Reports
          </Button>
          <Button className="bg-gradient-to-r from-primary to-brand-purple hover:opacity-90">
            <Zap className="mr-2 h-4 w-4" />
            Quick Action
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.isPositive ? "text-brand-green" : "text-destructive"}`}>
                  {stat.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Growth Overview</h2>
              <p className="text-sm text-muted-foreground">Last 7 days performance</p>
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-secondary">
              {["7D", "30D", "90D"].map((range) => (
                <button
                  key={range}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    range === "7D" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}K`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area type="monotone" dataKey="followers" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorFollowers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <activity.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Posts */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Posts</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/scheduler">View All</Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingPosts.map((post) => {
            const Icon = getPlatformIcon(post.platform);
            return (
              <div key={post.id} className="p-4 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    post.platform === "instagram" ? "bg-gradient-to-br from-pink-500 to-orange-500" :
                    post.platform === "twitter" ? "bg-blue-500" : "bg-red-500"
                  }`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      post.status === "ready" ? "bg-brand-green/10 text-brand-green" :
                      post.status === "draft" ? "bg-brand-orange/10 text-brand-orange" :
                      "bg-primary/10 text-primary"
                    }`}
                  >
                    {post.status}
                  </Badge>
                </div>
                <h3 className="font-medium text-sm mb-1 truncate">{post.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.time}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access Tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link key={tool.href} to={tool.href}>
              <Card className="glass-card hover:border-primary/50 transition-all hover:-translate-y-1 cursor-pointer h-full group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
