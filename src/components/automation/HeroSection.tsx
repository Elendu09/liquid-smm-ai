import { useEffect, useState } from "react";
import { Zap, Play, ArrowRight, TrendingUp, Users, Clock, Sparkles, Star, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const liveStats = [
  { label: "Orders Processing", value: 2847, icon: Zap, suffix: "", color: "text-primary" },
  { label: "Active Users", value: 12453, icon: Users, suffix: "", color: "text-brand-green" },
  { label: "Time Saved Today", value: 4829, icon: Clock, suffix: "hrs", color: "text-brand-purple" },
];

const trustedBy = [
  { name: "Instagram", icon: "📸" },
  { name: "TikTok", icon: "🎵" },
  { name: "YouTube", icon: "▶️" },
  { name: "Twitter", icon: "🐦" },
  { name: "Facebook", icon: "📘" },
  { name: "LinkedIn", icon: "💼" },
];

const AnimatedCounter = ({ target, duration = 2000, suffix = "" }: { target: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

const FloatingParticle = ({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) => (
  <div
    className="absolute rounded-full bg-primary/30 animate-particle"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDelay: `${delay}s`,
    }}
  />
);

export const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Enhanced Background effects */}
      <div className="absolute inset-0 bg-dots opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/5 via-transparent to-brand-cyan/5" />
      
      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
                           linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      {/* Floating particles */}
      {[...Array(30)].map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 0.2}
          x={Math.random() * 100}
          y={Math.random() * 100}
          size={Math.random() * 4 + 2}
        />
      ))}

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-purple/15 rounded-full blur-[100px] animate-pulse animation-delay-500" />
      <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-brand-cyan/10 rounded-full blur-[80px] animate-pulse animation-delay-300" />

      <div className="container relative z-10 max-w-6xl mx-auto">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/40 bg-primary/10 backdrop-blur-sm text-primary text-sm font-medium transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
            </span>
            <Sparkles className="h-4 w-4" />
            Automation Suite 2026
            <span className="px-2 py-0.5 rounded-full bg-brand-green/20 text-brand-green text-xs font-bold">NEW</span>
          </div>

          {/* Main headline */}
          <h1
            className={`text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-foreground">Automate </span>
            <span className="text-gradient-blue-purple relative">
              80%
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 100 8">
                <path d="M0 4 Q 25 0, 50 4 T 100 4" fill="none" stroke="hsl(217, 91%, 60%)" strokeWidth="2" className="animate-shimmer" />
              </svg>
            </span>
            <br />
            <span className="text-foreground">of Your SMM Work</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            AI-powered automation tools that grow your social media presence <span className="text-primary font-semibold">24/7</span>.
            Schedule, engage, analyze, and scale — all on autopilot.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              size="lg"
              className="glow-blue-intense text-lg px-10 py-7 bg-gradient-to-r from-primary to-brand-purple hover:opacity-90 text-white font-bold group rounded-xl"
            >
              Start Automating Free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-7 border-border hover:bg-secondary group rounded-xl"
            >
              <Play className="mr-2 h-5 w-5 text-primary" />
              Watch Demo
            </Button>
          </div>

          {/* Trust badges */}
          <div
            className={`flex flex-wrap items-center justify-center gap-4 mt-8 transition-all duration-700 delay-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-brand-green" />
              <span>100% Safe & Secure</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-brand-orange" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 text-primary" />
              <span>50,000+ Users Worldwide</span>
            </div>
          </div>

          {/* Live Stats */}
          <div
            className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 delay-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {liveStats.map((stat, index) => (
              <div
                key={stat.label}
                className="glass-card p-6 hover-lift group"
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <span className={`text-4xl font-bold ${stat.color}`}>
                    <AnimatedCounter target={stat.value} duration={2000 + index * 500} suffix={stat.suffix} />
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Platform logos */}
          <div
            className={`mt-12 transition-all duration-700 delay-600 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-sm text-muted-foreground mb-4">Automate across all major platforms</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {trustedBy.map((platform, i) => (
                <div
                  key={platform.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all hover:scale-105 cursor-pointer"
                  style={{ animationDelay: `${700 + i * 100}ms` }}
                >
                  <span className="text-xl">{platform.icon}</span>
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live data visualization */}
          <div
            className={`mt-16 glass-card p-8 max-w-4xl mx-auto transition-all duration-700 delay-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-green" />
                <span className="text-sm font-medium">Live Order Fulfillment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                </span>
                <span className="text-xs text-muted-foreground">Real-time</span>
              </div>
            </div>
            
            {/* Animated data bars */}
            <div className="space-y-4">
              {[
                { platform: "Instagram", progress: 92, color: "from-pink-500 to-orange-500", icon: "📸" },
                { platform: "TikTok", progress: 78, color: "from-cyan-400 to-pink-500", icon: "🎵" },
                { platform: "YouTube", progress: 85, color: "from-red-500 to-red-600", icon: "▶️" },
                { platform: "Twitter", progress: 64, color: "from-blue-400 to-blue-500", icon: "🐦" },
              ].map((item, i) => (
                <div key={item.platform} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span className="text-muted-foreground">{item.platform}</span>
                    </span>
                    <span className="text-foreground font-semibold">{item.progress}%</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out relative`}
                      style={{
                        width: isVisible ? `${item.progress}%` : "0%",
                        transitionDelay: `${800 + i * 150}ms`,
                      }}
                    >
                      <div className="absolute inset-0 animate-shimmer opacity-50" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
