import { useState } from "react";
import { TrendingUp, Users, Heart, Eye, Clock, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const followerData = [
  { month: "Jan", followers: 12400, engagement: 4.2 },
  { month: "Feb", followers: 14200, engagement: 4.8 },
  { month: "Mar", followers: 16800, engagement: 5.1 },
  { month: "Apr", followers: 19500, engagement: 5.4 },
  { month: "May", followers: 24300, engagement: 6.2 },
  { month: "Jun", followers: 31200, engagement: 7.1 },
];

const engagementData = [
  { day: "Mon", likes: 1240, comments: 89, shares: 45 },
  { day: "Tue", likes: 1580, comments: 124, shares: 67 },
  { day: "Wed", likes: 1890, comments: 156, shares: 89 },
  { day: "Thu", likes: 2100, comments: 178, shares: 98 },
  { day: "Fri", likes: 2450, comments: 203, shares: 112 },
  { day: "Sat", likes: 2890, comments: 245, shares: 134 },
  { day: "Sun", likes: 2670, comments: 221, shares: 118 },
];

const platformData = [
  { name: "Instagram", value: 45, color: "hsl(330, 80%, 60%)" },
  { name: "TikTok", value: 28, color: "hsl(190, 90%, 50%)" },
  { name: "YouTube", value: 15, color: "hsl(0, 84%, 50%)" },
  { name: "Twitter", value: 12, color: "hsl(203, 89%, 53%)" },
];

const timeRanges = ["7D", "30D", "90D", "1Y"];

const StatCard = ({ icon: Icon, label, value, change, isPositive }: { icon: any; label: string; value: string; change: string; isPositive: boolean }) => (
  <div className="glass-card p-4 hover-lift">
    <div className="flex items-start justify-between mb-2">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-brand-green" : "text-destructive"}`}>
        {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {change}
      </div>
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export const GrowthAnalytics = () => {
  const [selectedRange, setSelectedRange] = useState("30D");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 glow-blue">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Growth Analytics</h3>
            <p className="text-sm text-muted-foreground">Track your social media performance</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-secondary">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedRange === range
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Followers" value="31.2K" change="+152%" isPositive={true} />
        <StatCard icon={Heart} label="Engagement Rate" value="7.1%" change="+69%" isPositive={true} />
        <StatCard icon={Eye} label="Total Reach" value="284K" change="+89%" isPositive={true} />
        <StatCard icon={Clock} label="Time Saved" value="127hrs" change="+45%" isPositive={true} />
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Follower Growth Chart */}
        <div className="glass-card p-6">
          <h4 className="text-lg font-semibold mb-4">Follower Growth</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={followerData}>
                <defs>
                  <linearGradient id="followerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
                <XAxis dataKey="month" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickFormatter={(v) => `${v / 1000}K`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(222, 47%, 16%)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                />
                <Area
                  type="monotone"
                  dataKey="followers"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  fill="url(#followerGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="glass-card p-6">
          <h4 className="text-lg font-semibold mb-4">Weekly Engagement</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
                <XAxis dataKey="day" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(222, 47%, 16%)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                />
                <Bar dataKey="likes" fill="hsl(330, 80%, 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="shares" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(330,80%,60%)]" />
              <span className="text-xs text-muted-foreground">Likes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Comments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-green" />
              <span className="text-xs text-muted-foreground">Shares</span>
            </div>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="glass-card p-6">
          <h4 className="text-lg font-semibold mb-4">Platform Distribution</h4>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(222, 47%, 16%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {platformData.map((platform) => (
              <div key={platform.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                <span className="text-xs text-muted-foreground">{platform.name}</span>
                <span className="text-xs font-medium ml-auto">{platform.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Rate Trend */}
        <div className="glass-card p-6">
          <h4 className="text-lg font-semibold mb-4">Engagement Rate Trend</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={followerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
                <XAxis dataKey="month" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(222, 47%, 16%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Engagement"]}
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="hsl(142, 70%, 45%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(142, 70%, 45%)", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold mb-4">Time & Cost Savings</h4>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Hours Saved Monthly", value: "127", unit: "hours", color: "text-primary" },
            { label: "Manual Tasks Automated", value: "89%", unit: "", color: "text-brand-green" },
            { label: "Estimated Savings", value: "$2,540", unit: "/month", color: "text-brand-orange" },
            { label: "Efficiency Boost", value: "340%", unit: "", color: "text-brand-purple" },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-xl bg-secondary/50 text-center">
              <p className={`text-3xl font-bold ${item.color}`}>
                {item.value}
                <span className="text-lg text-muted-foreground">{item.unit}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
