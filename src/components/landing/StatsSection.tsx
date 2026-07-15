import { Users, Calendar, Heart, Clock, Star, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "50,000+",
    label: "Active Users",
    description: "Marketers trust SMMSAAS",
  },
  {
    icon: Calendar,
    value: "10M+",
    label: "Posts Scheduled",
    description: "And counting every day",
  },
  {
    icon: Heart,
    value: "500M+",
    label: "Engagements",
    description: "Likes, comments & shares",
  },
  {
    icon: Clock,
    value: "99.9%",
    label: "Uptime",
    description: "Always running for you",
  },
];

const testimonials = [
  {
    quote: "SMMSAAS saved me 20+ hours per week. The AI captions are incredibly accurate and engaging.",
    author: "Sarah Johnson",
    role: "Content Creator",
    avatar: "SJ",
    rating: 5,
  },
  {
    quote: "Managing 15 client accounts was a nightmare until we found SMMSAAS. Game changer!",
    author: "Mike Chen",
    role: "Agency Owner",
    avatar: "MC",
    rating: 5,
  },
  {
    quote: "Our engagement rate increased by 340% in just 3 months. The ROI is incredible.",
    author: "Emily Davis",
    role: "Marketing Director",
    avatar: "ED",
    rating: 5,
  },
];

export function StatsSection() {
  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-8 rounded-2xl bg-card border border-border"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-lg font-medium text-foreground mb-1">{stat.label}</div>
              <div className="text-sm text-muted-foreground">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-6">
            Loved by{" "}
            <span className="bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent">
              Thousands
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center text-white font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              Join 50,000+ marketers growing with SMMSAAS
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
