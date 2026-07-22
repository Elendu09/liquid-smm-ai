const stats = [
  { value: "12.4M", suffix: "+", label: "Posts published", orb: "hsl(var(--brand-purple))", accent: "text-rainbow" },
  { value: "340", suffix: "k", label: "Active creators", orb: "hsl(var(--brand-pink))", accent: "text-[hsl(var(--brand-pink))]" },
  { value: "99.99", suffix: "%", label: "Uptime SLA", orb: "hsl(var(--brand-cyan))", accent: "text-[hsl(var(--brand-cyan))]" },
  { value: "0.42", suffix: "s", label: "Avg. AI response", orb: "hsl(var(--brand-purple))", accent: "text-[hsl(var(--brand-purple))]" },
];

export function AnimatedStatsBanner() {
  return (
    <section aria-label="Platform stats" className="relative border-y border-white/5 bg-background py-10 sm:py-14">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4 lg:gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-white/[0.05] sm:p-7"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            {/* Corner orb */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-70 blur-[2px] transition-transform duration-700 group-hover:scale-110 sm:h-32 sm:w-32"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${s.orb} 0%, transparent 70%)`,
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 rounded-full opacity-90 sm:h-20 sm:w-20"
              style={{
                background: `radial-gradient(circle at 40% 40%, ${s.orb} 0%, transparent 60%)`,
                mixBlendMode: "screen",
              }}
            />

            <div className="relative">
              <div className="font-['Instrument_Serif'] text-4xl leading-none tracking-tight text-foreground sm:text-6xl">
                {s.value}
                <span className={`italic ${s.accent}`}>{s.suffix}</span>
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
