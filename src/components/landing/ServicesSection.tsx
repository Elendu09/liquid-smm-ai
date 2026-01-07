import { 
  Sparkles, 
  Calendar, 
  Bot, 
  BarChart3, 
  Hash, 
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Sparkles,
    title: "AI Caption Generation",
    description: "Generate engaging, platform-optimized captions in seconds with our advanced AI. Supports multiple tones and styles.",
    color: "from-brand-blue to-brand-cyan",
    href: "/dashboard/caption-generator",
  },
  {
    icon: Calendar,
    title: "Smart Post Scheduling",
    description: "Schedule posts across all platforms with AI-suggested optimal posting times for maximum engagement.",
    color: "from-brand-purple to-brand-pink",
    href: "/dashboard/scheduler",
  },
  {
    icon: Bot,
    title: "Auto Engagement Bot",
    description: "Automatically like, comment, and follow to grow your audience while maintaining authentic interactions.",
    color: "from-brand-green to-brand-cyan",
    href: "/dashboard/engagement-bot",
  },
  {
    icon: BarChart3,
    title: "Growth Analytics",
    description: "Track followers, engagement rates, and ROI across platforms with beautiful, actionable dashboards.",
    color: "from-brand-orange to-brand-pink",
    href: "/dashboard/analytics",
  },
  {
    icon: Hash,
    title: "Hashtag Research",
    description: "Discover trending hashtags with competition scores and growth metrics to boost your reach.",
    color: "from-brand-cyan to-brand-blue",
    href: "/dashboard/hashtag-research",
  },
  {
    icon: MessageSquare,
    title: "Comment Management",
    description: "Manage all comments with AI-suggested replies and bulk actions to save hours of work.",
    color: "from-brand-pink to-brand-purple",
    href: "/dashboard/comment-manager",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Our Services</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
              Dominate Social Media
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Comprehensive tools designed to save you time and amplify your social media presence across all platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group relative p-6 lg:p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient Glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <service.icon className="w-7 h-7 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
              
              {/* Link */}
              <Link to={service.href}>
                <Button variant="ghost" className="group/btn p-0 h-auto font-medium text-primary hover:text-primary">
                  Learn more
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
