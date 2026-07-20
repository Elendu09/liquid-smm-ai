import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ eyebrow, title, subtitle, children }: Props) {
  return (
    <div className="min-h-dvh bg-background text-foreground grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between border-r border-border/40 p-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--primary) / 0.18), transparent 70%)",
          }}
        />

        <Link to="/" className="relative flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="relative space-y-8">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            HOME OF SMM
          </div>
          <h2 className="font-['Instrument_Serif'] font-normal leading-[0.95] text-[clamp(2.5rem,5vw,4.5rem)] text-foreground">
            One studio.
            <br />
            Every channel.
            <br />
            <span className="italic text-primary">Zero chaos.</span>
          </h2>
          <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
            Plan, publish and analyse across 14 social platforms with AI copilots that know your brand voice.
          </p>

          <div className="grid grid-cols-3 gap-px border border-border/40 bg-border/40 w-fit">
            {[
              { k: "14", v: "Channels" },
              { k: "AI", v: "Copilots" },
              { k: "24/7", v: "Automation" },
            ].map((s) => (
              <div key={s.v} className="bg-background px-5 py-3 text-center">
                <div className="font-['Instrument_Serif'] text-2xl leading-none text-foreground">{s.k}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} HOME OF SMM
        </div>
      </aside>

      {/* Form panel */}
      <section className="relative flex flex-col p-6 sm:p-10">
        <div className="lg:hidden mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8 space-y-3">
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {eyebrow}
              </div>
              <h1 className="font-['Instrument_Serif'] font-normal leading-[1.05] text-4xl sm:text-5xl text-foreground">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Protected by industry-standard encryption ·{" "}
          <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link>
          {" · "}
          <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy</Link>
        </p>
      </section>
    </div>
  );
}
