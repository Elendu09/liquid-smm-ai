import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function WhatsNewPill() {
  return (
    <Link
      to="/changelog"
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
    >
      <Sparkles className="h-3 w-3" />
      What's new
      <span className="hidden sm:inline text-muted-foreground font-normal">— see the latest fixes</span>
    </Link>
  );
}
