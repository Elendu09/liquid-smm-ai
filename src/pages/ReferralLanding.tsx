import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Gift, Sparkles, ArrowRight, Check, CalendarClock, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!code) {
      setValid(false);
      return;
    }
    supabase.functions
      .invoke("referral-lookup", { body: { code } })
      .then(({ data, error }) => {
        if (!error && data?.referrerName) {
          setReferrerName(data.referrerName);
          setValid(true);
        } else {
          setValid(false);
        }
      })
      .catch(() => setValid(false));
  }, [code]);

  const signupUrl = `/signup${code ? `?ref=${encodeURIComponent(code)}` : ""}`;

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 lg:pt-32">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="outline" className="text-[11px] uppercase tracking-widest border-primary/40 text-primary mb-6">
            <Gift className="h-3.5 w-3.5 mr-1" /> You've been invited
          </Badge>
          <h1 className="font-['Instrument_Serif'] text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
            {valid ? (
              <>
                <span className="italic text-primary">{referrerName}</span> uses SMMSAAS.
                <br />
                You should too.
              </>
            ) : (
              <>
                Grow faster with <span className="italic text-primary">SMMSAAS.</span>
              </>
            )}
          </h1>
          <p className="mt-5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {valid
              ? "Automate publishing, track competitors, pipe RSS into your queue, and keep every channel on-brand — with AI credits that go twice as far."
              : "Schedule posts, turn RSS feeds into content, benchmark competitors, and let AI do the busywork — all in one workspace."}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={signupUrl}>
              <Button size="lg" className="h-12 px-8 rounded-full text-sm shadow-[0_0_30px_hsl(var(--primary)/0.35)]">
                Claim your invite <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-sm">
                See pricing
              </Button>
            </Link>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3 text-left">
            {[
              { icon: CalendarClock, title: "Ship on autopilot", body: "Queue posts across every network and let RSS feed your calendar." },
              { icon: Users, title: "Benchmark rivals", body: "Track competitors on all major platforms and GitHub in one view." },
              { icon: Sparkles, title: "AI credits included", body: "Every paid plan comes with generous AI credits for captions, research & more." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border/60 bg-card/50 p-5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold text-sm">{f.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.body}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {["Free forever plan", "Connect 14+ platforms", "No credit card to start"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
