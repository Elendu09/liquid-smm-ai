import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Floating circular scroll-to-top control for marketing pages. */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrolled > 400);
      setProgress(max > 0 ? Math.min(scrolled / max, 1) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-50 h-12 w-12 rounded-full",
        "border border-border/60 bg-background/70 backdrop-blur-xl text-foreground",
        "shadow-lg shadow-black/20 transition-all duration-300 hover:border-primary/60 hover:text-primary",
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4",
      )}
      style={{
        backgroundImage: `conic-gradient(hsl(var(--primary) / 0.55) ${progress * 360}deg, transparent 0deg)`,
      }}
    >
      <span className="absolute inset-[3px] rounded-full bg-background/85 backdrop-blur-xl flex items-center justify-center">
        <ArrowUp className="h-4 w-4" />
      </span>
    </button>
  );
}
