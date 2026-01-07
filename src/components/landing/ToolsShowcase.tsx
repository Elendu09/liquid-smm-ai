import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Calendar, 
  Bot, 
  BarChart3, 
  Hash, 
  MessageSquare,
  ArrowRight,
  Zap,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tools = [
  {
    icon: Sparkles,
    title: "AI Caption Generator",
    description: "Generate viral-worthy captions with one click",
    features: ["Multiple tones", "Platform optimization", "Hashtag suggestions"],
    badge: "AI Powered",
    color: "from-brand-blue to-brand-cyan",
    href: "/dashboard/caption-generator",
  },
  {
    icon: Calendar,
    title: "Smart Scheduler",
    description: "Plan and schedule content across all platforms",
    features: ["Optimal time suggestions", "Calendar view", "Bulk scheduling"],
    badge: "Time Saver",
    color: "from-brand-purple to-brand-pink",
    href: "/dashboard/scheduler",
  },
  {
    icon: Bot,
    title: "Engagement Bot",
    description: "Automate interactions to grow organically",
    features: ["Auto likes", "Smart comments", "Follow/Unfollow"],
    badge: "24/7 Active",
    color: "from-brand-green to-brand-cyan",
    href: "/dashboard/engagement-bot",
  },
  {
    icon: BarChart3,
    title: "Growth Analytics",
    description: "Track performance with detailed insights",
    features: ["Real-time data", "ROI tracking", "Competitor analysis"],
    badge: "Real-time",
    color: "from-brand-orange to-brand-pink",
    href: "/dashboard/analytics",
  },
  {
    icon: Hash,
    title: "Hashtag Research",
    description: "Find the best hashtags for maximum reach",
    features: ["Trending tags", "Competition scores", "Copy to clipboard"],
    badge: "Research",
    color: "from-brand-cyan to-brand-blue",
    href: "/dashboard/hashtag-research",
  },
  {
    icon: MessageSquare,
    title: "Comment Manager",
    description: "Manage all comments from one dashboard",
    features: ["AI replies", "Bulk actions", "Sentiment analysis"],
    badge: "AI Powered",
    color: "from-brand-pink to-brand-purple",
    href: "/dashboard/comment-manager",
  },
];

export function ToolsShowcase() {
  return (
    <section id="tools" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Powerful Tools</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Your Complete{" "}
            <span className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">
              SMM Toolkit
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to manage, grow, and analyze your social media presence in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <div
              key={tool.title}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            >
              {/* Header */}
              <div className={`p-6 bg-gradient-to-br ${tool.color}`}>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {tool.badge}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold text-white mt-4">{tool.title}</h3>
                <p className="text-white/80 text-sm mt-1">{tool.description}</p>
              </div>

              {/* Features */}
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {tool.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={tool.href}>
                  <Button className="w-full group/btn">
                    Try Now
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="px-8">
              <Clock className="w-5 h-5 mr-2" />
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
