import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Play, 
  Zap, 
  Users, 
  TrendingUp, 
  Clock,
  Star,
  Shield,
  Instagram,
  Twitter,
  Linkedin,
  Youtube
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Active Users", value: 50000, suffix: "+", icon: Users },
  { label: "Posts Scheduled", value: 10, suffix: "M+", icon: Clock },
  { label: "Avg Engagement Boost", value: 340, suffix: "%", icon: TrendingUp },
];

const platforms = [
  { name: "Instagram", icon: Instagram, color: "text-pink-500" },
  { name: "Twitter", icon: Twitter, color: "text-sky-500" },
  { name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { name: "YouTube", icon: Youtube, color: "text-red-500" },
];

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 via-transparent to-brand-purple/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Social Media Automation</span>
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">Automate </span>
            <span className="bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan bg-clip-text text-transparent">
              80% of Your SMM
            </span>
            <br />
            <span className="text-foreground">Work in Minutes</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Generate AI captions, schedule posts, boost engagement, and grow your audience across all platforms with our all-in-one automation suite.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-brand-blue to-brand-purple hover:opacity-90 text-white px-8 h-14 text-lg shadow-lg shadow-primary/25">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 h-14 text-lg group">
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>
          
          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="w-1 h-4 bg-border" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>14-day free trial</span>
            </div>
            <div className="hidden sm:block w-1 h-4 bg-border" />
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-brand-purple" />
              <span>50K+ marketers trust us</span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-colors"
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          
          {/* Supported Platforms */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Works with:</span>
            <div className="flex items-center gap-4 ml-2">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex items-center gap-1 group">
                  <platform.icon className={`w-5 h-5 ${platform.color} group-hover:scale-110 transition-transform`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
