import { Link } from "react-router-dom";
import {
  ArrowRight,
  Play,
  Sparkles,
  MessageSquare,
  Calendar,
  Heart,
  ShieldCheck,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 106.162 6.162A6.162 6.162 0 0012 5.838zm0 10.162a4 4 0 114-4 4 4 0 01-4 4zm6.406-11.845a1.44 1.44 0 101.44 1.44 1.44 1.44 0 00-1.44-1.44z" />
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
);
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 112.063-2.063 2.063 2.063 0 01-2.063 2.063zm1.782 13.019H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
  </svg>
);
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0011.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325 2.15 2.15 0 01.02.472c-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23a.24.24 0 00-.056-.212.278.278 0 00-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const platforms = [
  { name: "Instagram", Icon: InstagramIcon },
  { name: "TikTok", Icon: TikTokIcon },
  { name: "YouTube", Icon: YouTubeIcon },
  { name: "X", Icon: TwitterIcon },
  { name: "Facebook", Icon: FacebookIcon },
  { name: "LinkedIn", Icon: LinkedInIcon },
  { name: "Telegram", Icon: TelegramIcon },
];

const chips = [
  {
    title: "Ultra fast.",
    body: "Almost speed-of-light execution.",
    position: "hidden lg:block absolute -left-4 xl:-left-24 top-4 -rotate-6",
    bar: true,
  },
  {
    title: "Editorial design.",
    body: "Far ahead of the market.",
    position: "hidden lg:block absolute -left-10 xl:-left-40 bottom-8 rotate-3",
  },
  {
    title: "Cool functions.",
    body: "Shipping updates monthly.",
    position: "hidden lg:block absolute -right-4 xl:-right-24 top-10 rotate-6",
  },
  {
    title: "Ecosystem.",
    body: "Total market transparency.",
    position: "hidden lg:block absolute -right-10 xl:-right-32 bottom-4 -rotate-3",
  },
];


export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-background text-foreground"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.18] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -top-24 -right-24 h-[360px] w-[360px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 pt-16 pb-24 sm:px-6 lg:pt-24 lg:pb-32">
        <div className="relative w-full max-w-5xl text-center">
          {chips.map((c) => (
            <div
              key={c.title}
              aria-hidden="true"
              className={`${c.position} w-52 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left shadow-2xl backdrop-blur-xl transition-transform duration-500 hover:rotate-0`}
            >
              <div className="font-['Instrument_Serif'] text-2xl leading-none mb-1 text-foreground">
                {c.title}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {c.body}
              </div>
              {c.bar && (
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-4/5 bg-primary" />
                </div>
              )}
            </div>
          ))}

          <p className="mb-8 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            — Automation-first SMM platform
          </p>

          <h1
            id="hero-heading"
            className="font-['Instrument_Serif'] font-normal leading-[0.92] tracking-tight text-foreground text-[clamp(3rem,9vw,7.5rem)]"
          >
            Automate <span className="italic text-primary">80%</span>
            <br />
            of your social <span className="italic">media</span> work
            <span className="text-primary">.</span>
          </h1>

          <p className="mx-auto mt-8 mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            The most powerful automation panel built for scale. Generate captions,
            schedule posts, and grow every account with AI-driven precision.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="h-12 w-full min-h-11 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.15em] shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_32px_hsl(var(--primary)/0.55)] sm:w-auto"
              >
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full min-h-11 rounded-full border-white/15 bg-white/5 px-8 text-sm font-semibold uppercase tracking-[0.15em] backdrop-blur-sm hover:bg-white/10 sm:w-auto"
            >
              <Play className="mr-2 h-4 w-4" aria-hidden="true" />
              Watch demo
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              No credit card required
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              14-day free trial
            </li>
            <li className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              50K+ marketers trust us
            </li>
          </ul>
        </div>

        <div className="group relative mt-20 w-full max-w-5xl [perspective:1200px]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/70 shadow-[0_50px_100px_rgba(0,0,0,0.55)] backdrop-blur-3xl transition-transform duration-700 ease-out [transform:rotateX(10deg)] group-hover:[transform:rotateX(4deg)_translateY(-6px)]">
            {/* Browser chrome */}
            <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <div className="font-['Instrument_Serif'] text-lg leading-none text-muted-foreground">
                smmsaas<span className="italic text-primary">.</span>studio
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live</span>
            </div>

            {/* Video / showreel canvas */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--card))] to-[hsl(var(--background))]">
              {/* animated waveform SVG */}
              <svg
                aria-hidden="true"
                viewBox="0 0 800 450"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="400" cy="225" r="220" fill="url(#orbGrad)" />
                {[0, 1, 2].map((i) => (
                  <path
                    key={i}
                    d="M0,225 Q100,180 200,225 T400,225 T600,225 T800,225"
                    fill="none"
                    stroke="url(#waveGrad)"
                    strokeWidth={1.2 + i * 0.6}
                    opacity={0.7 - i * 0.2}
                  >
                    <animate
                      attributeName="d"
                      dur={`${6 + i * 2}s`}
                      repeatCount="indefinite"
                      values="
                        M0,225 Q100,180 200,225 T400,225 T600,225 T800,225;
                        M0,225 Q100,270 200,225 T400,225 T600,225 T800,225;
                        M0,225 Q100,180 200,225 T400,225 T600,225 T800,225"
                    />
                  </path>
                ))}
                {/* grid ticks */}
                {Array.from({ length: 40 }).map((_, i) => (
                  <line
                    key={i}
                    x1={i * 20}
                    y1={410}
                    x2={i * 20}
                    y2={410 - ((i * 37) % 40) - 6}
                    stroke="hsl(var(--primary))"
                    strokeOpacity={0.35}
                    strokeWidth={2}
                  />
                ))}
              </svg>

              {/* Center play button */}
              <button
                type="button"
                aria-label="Watch demo"
                className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-[0_0_60px_hsl(var(--primary)/0.6)] transition-transform hover:scale-105"
              >
                <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40" />
              </button>

              {/* Corner badges */}
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-foreground">Showreel · 02:14</span>
              </div>
              <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
                4K · HDR
              </div>

              {/* Bottom caption strip */}
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-black/40 px-5 py-3 backdrop-blur">
                <div className="font-['Instrument_Serif'] text-xl leading-none text-foreground">
                  See the panel in <span className="italic text-primary">motion</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>AI Captions</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span>Scheduler</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span>Auto DMs</span>
                </div>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute -bottom-6 left-1/2 -z-10 h-16 w-4/5 -translate-x-1/2 rounded-full bg-primary/30 blur-[100px]"
          />
        </div>


        <div className="mt-16 flex flex-col items-center gap-4">
          <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Works with all major platforms
          </span>
          <ul className="flex flex-wrap items-center justify-center gap-6">
            {platforms.map((p) => (
              <li
                key={p.name}
                className="text-muted-foreground opacity-70 transition-all hover:scale-110 hover:opacity-100 hover:text-foreground"
                title={p.name}
              >
                <span className="sr-only">{p.name}</span>
                <p.Icon />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
