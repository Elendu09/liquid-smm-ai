/**
 * Ambient waveform that lives BEHIND the hero content.
 * The centre is masked out (the hero copy sits there), so only the left and
 * right tails of the wave stay visible — matching the reference look.
 */
export function HeroWaveBackground({ intensity = 0.5 }: { intensity?: number }) {
  const amp = 30 + intensity * 60;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, #000 8%, #000 26%, transparent 44%, transparent 56%, #000 74%, #000 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, #000 8%, #000 26%, transparent 44%, transparent 56%, #000 74%, #000 92%, transparent 100%)",
      }}
    >
      <svg viewBox="0 0 1600 700" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="heroWaveGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--brand-cyan))" stopOpacity="0" />
            <stop offset="22%" stopColor="hsl(var(--brand-cyan))" stopOpacity="0.85" />
            <stop offset="50%" stopColor="hsl(var(--brand-purple))" stopOpacity="0.9" />
            <stop offset="78%" stopColor="hsl(var(--brand-pink))" stopOpacity="0.85" />
            <stop offset="100%" stopColor="hsl(var(--brand-pink))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M0,350 Q200,${350 - amp} 400,350 T800,350 T1200,350 T1600,350`}
            fill="none"
            stroke="url(#heroWaveGrad)"
            strokeWidth={1 + i * 0.7}
            opacity={0.55 - i * 0.1}
          >
            <animate
              attributeName="d"
              dur={`${7 + i * 2.5}s`}
              repeatCount="indefinite"
              values={`
                M0,350 Q200,${350 - amp} 400,350 T800,350 T1200,350 T1600,350;
                M0,350 Q200,${350 + amp} 400,350 T800,350 T1200,350 T1600,350;
                M0,350 Q200,${350 - amp} 400,350 T800,350 T1200,350 T1600,350`}
            />
          </path>
        ))}
      </svg>
    </div>
  );
}
