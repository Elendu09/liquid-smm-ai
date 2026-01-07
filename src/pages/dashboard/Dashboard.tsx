import { Link } from "react-router-dom";
import { Sparkles, Calendar, Bot, BarChart3, Hash, MessageSquare, TrendingUp, Users, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tools = [
  { title: "Caption Generator", icon: Sparkles, href: "/dashboard/caption-generator", color: "from-brand-blue to-brand-cyan", description: "AI-powered captions" },
  { title: "Post Scheduler", icon: Calendar, href: "/dashboard/scheduler", color: "from-brand-purple to-brand-pink", description: "Schedule content" },
  { title: "Engagement Bot", icon: Bot, href: "/dashboard/engagement-bot", color: "from-brand-green to-brand-cyan", description: "Auto engagement" },
  { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics", color: "from-brand-orange to-brand-pink", description: "Growth insights" },
  { title: "Hashtag Research", icon: Hash, href: "/dashboard/hashtag-research", color: "from-brand-cyan to-brand-blue", description: "Find trending tags" },
  { title: "Comment Manager", icon: MessageSquare, href: "/dashboard/comment-manager", color: "from-brand-pink to-brand-purple", description: "Manage comments" },
];

const stats = [
  { label: "Total Followers", value: "24.5K", change: "+12%", icon: Users },
  { label: "Engagement Rate", value: "4.8%", change: "+0.5%", icon: TrendingUp },
  { label: "Posts Scheduled", value: "47", change: "+8", icon: Calendar },
  { label: "Hours Saved", value: "156", change: "+24", icon: Clock },
];

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your social media performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-green-500 font-medium">{stat.change}</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access Tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link key={tool.href} to={tool.href}>
              <Card className="hover:border-primary/50 transition-all hover:-translate-y-1 cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
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
