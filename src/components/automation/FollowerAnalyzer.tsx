import { useMemo, useState } from "react";
import { Users, UserMinus, UserCheck, TrendingUp, TrendingDown, BarChart3, Search, Ghost, Star, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AnalyzeAccountDialog, type AnalysisResult } from "@/components/audience/AnalyzeAccountDialog";
import { ExportDialog, type ExportRow } from "@/components/audience/ExportDialog";
import { FollowerDetailsDrawer, type FollowerDetail } from "@/components/audience/FollowerDetailsDrawer";

const followerQualityData = [
  { name: "High Quality", value: 62, color: "hsl(142, 70%, 45%)" },
  { name: "Medium Quality", value: 25, color: "hsl(217, 91%, 60%)" },
  { name: "Low Quality", value: 8, color: "hsl(25, 95%, 53%)" },
  { name: "Ghost Followers", value: 5, color: "hsl(0, 84%, 60%)" },
];

const engagementTimeData = [
  { hour: "6AM", active: 120 },
  { hour: "9AM", active: 450 },
  { hour: "12PM", active: 680 },
  { hour: "3PM", active: 520 },
  { hour: "6PM", active: 890 },
  { hour: "9PM", active: 1200 },
  { hour: "12AM", active: 340 },
];

const demographicsData = [
  { age: "18-24", percentage: 35 },
  { age: "25-34", percentage: 42 },
  { age: "35-44", percentage: 15 },
  { age: "45-54", percentage: 5 },
  { age: "55+", percentage: 3 },
];

const topFollowers = [
  { id: 1, username: "@influencer_pro", avatar: "IP", followers: "125K", engagement: "8.2%", quality: "high" },
  { id: 2, username: "@brand_official", avatar: "BO", followers: "89K", engagement: "6.5%", quality: "high" },
  { id: 3, username: "@content_king", avatar: "CK", followers: "67K", engagement: "9.1%", quality: "high" },
  { id: 4, username: "@social_guru", avatar: "SG", followers: "45K", engagement: "7.8%", quality: "high" },
  { id: 5, username: "@marketing_expert", avatar: "ME", followers: "34K", engagement: "5.4%", quality: "medium" },
];

const ghostFollowers = [
  { id: 1, username: "@inactive_user1", avatar: "IU", lastActive: "6 months ago", posts: 0, engagement: "0%" },
  { id: 2, username: "@bot_account", avatar: "BA", lastActive: "Never", posts: 0, engagement: "0%" },
  { id: 3, username: "@spam_user", avatar: "SU", lastActive: "3 months ago", posts: 2, engagement: "0%" },
];

const recentUnfollowers = [
  { id: 1, username: "@former_fan", avatar: "FF", unfollowedAt: "2 hours ago", wasFollowing: true },
  { id: 2, username: "@lost_user", avatar: "LU", unfollowedAt: "5 hours ago", wasFollowing: false },
  { id: 3, username: "@gone_away", avatar: "GA", unfollowedAt: "1 day ago", wasFollowing: true },
];

export const FollowerAnalyzer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"quality" | "ghosts" | "unfollowers">("quality");
  const [ghosts, setGhosts] = useState(ghostFollowers);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [detail, setDetail] = useState<FollowerDetail | null>(null);
  const [stats, setStats] = useState({
    totalFollowers: "31.2K",
    qualityScore: 87,
    ghostPercentage: "5%",
    weeklyGrowth: "+2.4%",
    avgEngagement: "6.8%",
    activeFollowers: "89%",
    peakHour: "9PM",
    account: "@yourbrand",
  });

  const applyAnalysis = (r: AnalysisResult) => {
    setStats({
      totalFollowers: r.totalFollowers,
      qualityScore: r.qualityScore,
      ghostPercentage: `${r.ghostPercent}%`,
      weeklyGrowth: r.weeklyGrowth,
      avgEngagement: r.avgEngagement,
      activeFollowers: `${r.activePercent}%`,
      peakHour: r.peakHour,
      account: r.username,
    });
    toast.success(`Loaded analysis for ${r.username}`);
  };

  const exportRows: ExportRow[] = useMemo(
    () => [
      ...topFollowers.map((f) => ({ type: "top", username: f.username, followers: f.followers, engagement: f.engagement, quality: f.quality })),
      ...ghosts.map((g) => ({ type: "ghost", username: g.username, lastActive: g.lastActive, posts: g.posts, engagement: g.engagement })),
      ...recentUnfollowers.map((u) => ({ type: "unfollower", username: u.username, unfollowedAt: u.unfollowedAt, wasFollowing: u.wasFollowing ? "yes" : "no" })),
    ],
    [ghosts],
  );

  const openTop = (f: typeof topFollowers[number]) => setDetail({ id: f.id, username: f.username, avatar: f.avatar, followers: f.followers, engagement: f.engagement, quality: f.quality as FollowerDetail["quality"], kind: "top" });
  const openGhost = (f: typeof ghostFollowers[number]) => setDetail({ id: f.id, username: f.username, avatar: f.avatar, lastActive: f.lastActive, posts: f.posts, engagement: f.engagement, kind: "ghost" });
  const openUnfollower = (f: typeof recentUnfollowers[number]) => setDetail({ id: f.id, username: f.username, avatar: f.avatar, unfollowedAt: f.unfollowedAt, wasFollowing: f.wasFollowing, kind: "unfollower" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-brand-cyan/20 glow-blue">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Follower Analyzer</h3>
            <p className="text-sm text-muted-foreground">Analyze follower quality and engagement</p>
          </div>
        </div>
        <Button onClick={exportReport} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Download className="mr-2 h-4 w-4" />
          Full Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Followers", value: stats.totalFollowers, icon: Users, color: "text-primary" },
          { label: "Quality Score", value: `${stats.qualityScore}/100`, icon: Star, color: "text-brand-green" },
          { label: "Ghost Followers", value: stats.ghostPercentage, icon: Ghost, color: "text-destructive" },
          { label: "Weekly Growth", value: stats.weeklyGrowth, icon: TrendingUp, color: "text-brand-green" },
          { label: "Avg Engagement", value: stats.avgEngagement, icon: BarChart3, color: "text-brand-purple" },
          { label: "Active Followers", value: stats.activeFollowers, icon: UserCheck, color: "text-brand-cyan" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quality Distribution */}
        <div className="glass-card p-6">
          <h4 className="text-lg font-semibold mb-4">Follower Quality</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={followerQualityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {followerQualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(value: number) => [`${value}%`, "Percentage"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {followerQualityData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.name}</span>
                <span className="text-xs font-medium ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Hours */}
        <div className="glass-card p-6">
          <h4 className="text-lg font-semibold mb-4">Active Hours</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Bar dataKey="active" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Peak activity: 9PM - Best time to post
          </p>
        </div>

        {/* Demographics */}
        <div className="glass-card p-6">
          <h4 className="text-lg font-semibold mb-4">Age Demographics</h4>
          <div className="space-y-3">
            {demographicsData.map((item) => (
              <div key={item.age}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.age}</span>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-6">
        <div className="flex gap-2 mb-6 border-b border-border pb-4">
          {[
            { id: "quality", label: "Top Followers", icon: Star },
            { id: "ghosts", label: "Ghost Followers", icon: Ghost },
            { id: "unfollowers", label: "Recent Unfollowers", icon: UserMinus },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search followers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>

        {/* Tab Content */}
        {activeTab === "quality" && (
          <div className="space-y-3">
            {topFollowers.map((follower) => (
              <div
                key={follower.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green to-brand-cyan flex items-center justify-center text-white font-bold text-sm">
                    {follower.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{follower.username}</p>
                    <p className="text-sm text-muted-foreground">{follower.followers} followers</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-brand-green">{follower.engagement}</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                  <Badge className="bg-brand-green/10 text-brand-green border-brand-green/30">
                    <Star className="h-3 w-3 mr-1" />
                    {follower.quality}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "ghosts" && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-4">
              <p className="text-sm text-destructive">
                <Ghost className="inline h-4 w-4 mr-2" />
                {ghosts.length} ghost followers detected. Consider removing for better engagement rates.
              </p>
            </div>
            {ghosts.map((follower) => (
              <div
                key={follower.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold text-sm">
                    {follower.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">{follower.username}</p>
                    <p className="text-sm text-muted-foreground">Last active: {follower.lastActive}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setGhosts((prev) => prev.filter((g) => g.id !== follower.id));
                    toast.success(`Removed ${follower.username}`);
                  }}
                >
                  <UserMinus className="mr-1 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "unfollowers" && (
          <div className="space-y-3">
            {recentUnfollowers.map((follower) => (
              <div
                key={follower.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold text-sm">
                    {follower.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{follower.username}</p>
                    <p className="text-sm text-muted-foreground">Unfollowed: {follower.unfollowedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {follower.wasFollowing && (
                    <Badge variant="secondary" className="text-xs">
                      <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
                      Mutual Lost
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
