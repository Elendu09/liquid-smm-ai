import { useEffect, useState } from "react";
import { Zap, Play, ArrowRight, TrendingUp, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const liveStats = [
  { label: "Orders Processing", value: 2847, icon: Zap, suffix: "" },
  { label: "Active Users", value: 12453, icon: Users, suffix: "" },
  { label: "Time Saved Today", value: 4829, icon: Clock, suffix: "hrs" },
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

const FloatingParticle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <div
    className="absolute w-1 h-1 rounded-full bg-primary/40 animate-particle"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      animationDelay: `${delay}s`,
    }}
  />
);

const DataFlowLine = ({ delay }: { delay: number }) => (
  <div
    className="absolute h-20 w-px bg-gradient-to-b from-primary/50 to-transparent animate-data-flow"
    style={{ animationDelay: `${delay}s` }}
  />
);

export const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-dots opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 0.3}
          x={Math.random() * 100}
          y={Math.random() * 100}
        />
      ))}

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl" />

      <div className="container relative z-10 max-w-6xl mx-auto">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
            </span>
            Automation Suite 2026
          </div>

          {/* Main headline */}
          <h1
            className={`text-5xl md:text-7xl font-bold tracking-tight transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-foreground">Automate </span>
            <span className="text-gradient-blue-purple">80%</span>
            <br />
            <span className="text-foreground">of Your SMM Work</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            AI-powered automation tools that grow your social media presence 24/7.
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
              className="glow-blue text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
            >
              Start Automating
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-border hover:bg-secondary group"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Live Stats */}
          <div
            className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 delay-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {liveStats.map((stat, index) => (
              <div
                key={stat.label}
                className="glass-card p-6 hover-lift"
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-3xl font-bold text-foreground">
                    <AnimatedCounter target={stat.value} duration={2000 + index * 500} suffix={stat.suffix} />
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Live data visualization */}
          <div
            className={`mt-12 glass-card p-8 max-w-4xl mx-auto transition-all duration-700 delay-500 ${
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
            <div className="space-y-3">
              {[
                { platform: "Instagram", progress: 85, color: "from-pink-500 to-orange-500" },
                { platform: "TikTok", progress: 72, color: "from-cyan-400 to-pink-500" },
                { platform: "YouTube", progress: 68, color: "from-red-500 to-red-600" },
                { platform: "Twitter", progress: 54, color: "from-blue-400 to-blue-500" },
              ].map((item, i) => (
                <div key={item.platform} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.platform}</span>
                    <span className="text-foreground font-medium">{item.progress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{
                        width: isVisible ? `${item.progress}%` : "0%",
                        transitionDelay: `${600 + i * 150}ms`,
                      }}
                    />
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
