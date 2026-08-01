import { useRef, useState } from "react";
import { Sparkles, TrendingUp, Heart, Calendar } from "lucide-react";

/**
 * Pure CSS 3D device mockup (laptop + floating phone + glass cards).
 * Tilts with the pointer for a real perspective feel.
 */
export function Hero3DMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 12, y: 0 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: 12 - py * 14, y: px * 18 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 12, y: 0 })}
      aria-hidden="true"
      className="relative mx-auto w-full max-w-4xl select-none [perspective:1400px]"
    >
      <div
        className="relative transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        {/* ---- Laptop ---- */}
        <div className="relative rounded-[22px] border border-white/12 bg-card/80 p-2 shadow-[0_60px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl [transform:translateZ(0px)]">
          <div className="overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--card))] to-[hsl(var(--background))]">
            {/* top bar */}
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-white/15" />
              <span className="h-2 w-2 rounded-full bg-white/15" />
              <span className="h-2 w-2 rounded-full bg-white/15" />
              <span className="ml-3 font-['Instrument_Serif'] text-base leading-none text-muted-foreground">
                smmsaas<span className="italic text-rainbow">.</span>studio
              </span>
            </div>

            {/* dashboard mock */}
            <div className="grid grid-cols-[120px_1fr] gap-0">
              <div className="hidden space-y-2 border-r border-white/5 p-3 sm:block">
                {["Home", "Create", "Publish", "Engage", "Analytics"].map((n, i) => (
                  <div
                    key={n}
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] ${
                      i === 1 ? "bg-primary/15 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {n}
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: "Reach", v: "128K", i: TrendingUp },
                    { l: "Engagement", v: "9.4%", i: Heart },
                    { l: "Scheduled", v: "312", i: Calendar },
                  ].map((k) => (
                    <div
                      key={k.l}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur"
                    >
                      <k.i className="mb-1.5 h-3.5 w-3.5 text-primary" />
                      <div className="font-['Instrument_Serif'] text-xl leading-none text-foreground">
                        {k.v}
                      </div>
                      <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                        {k.l}
                      </div>
                    </div>
                  ))}
                </div>

                {/* chart */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <svg viewBox="0 0 300 90" className="h-24 w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="mockArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,70 C40,40 60,78 100,52 C140,26 170,60 210,34 C245,12 270,30 300,16 L300,90 L0,90 Z"
                      fill="url(#mockArea)"
                    />
                    <path
                      d="M0,70 C40,40 60,78 100,52 C140,26 170,60 210,34 C245,12 270,30 300,16"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-6 flex-1 rounded-sm bg-primary/25"
                        style={{ height: `${8 + ((i * 29) % 22)}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* laptop base */}
          <div className="mx-auto mt-2 h-2 w-[86%] rounded-b-2xl bg-white/10" />
        </div>

        {/* ---- Floating phone ---- */}
        <div className="absolute -bottom-8 right-2 hidden w-[150px] rounded-[26px] border-8 border-[hsl(var(--card))] bg-[hsl(var(--background))] shadow-[0_40px_80px_rgba(0,0,0,0.6)] [transform:translateZ(90px)_rotateY(-14deg)_rotateX(4deg)] sm:block">
          <div className="space-y-2 p-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/30" />
              <div className="space-y-1">
                <div className="h-1.5 w-16 rounded-full bg-white/20" />
                <div className="h-1.5 w-10 rounded-full bg-white/10" />
              </div>
            </div>
            <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/40 via-primary/10 to-transparent" />
            <div className="h-1.5 w-full rounded-full bg-white/15" />
            <div className="h-1.5 w-3/4 rounded-full bg-white/10" />
            <div className="rounded-lg bg-primary/20 py-1.5 text-center text-[8px] uppercase tracking-[0.18em] text-primary">
              Publish now
            </div>
          </div>
        </div>

        {/* ---- Floating glass card ---- */}
        <div className="absolute left-2 -top-6 hidden items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 shadow-2xl backdrop-blur-xl [transform:translateZ(130px)_rotateY(10deg)] md:flex">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <div className="font-['Instrument_Serif'] text-lg leading-none text-foreground">
              AI caption ready
            </div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              3 variants generated
            </div>
          </div>
        </div>
      </div>

      {/* ground glow */}
      <div className="absolute -bottom-10 left-1/2 -z-10 h-20 w-3/4 -translate-x-1/2 rounded-full bg-primary/30 blur-[90px]" />
    </div>
  );
}
