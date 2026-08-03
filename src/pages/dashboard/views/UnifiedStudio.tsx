import { useSearchParams } from "react-router-dom";
import { PenLine, Wand2 } from "lucide-react";
import CreateStudio from "./CreateStudio";
import AiCreateView from "./AiCreateView";
import { cn } from "@/lib/utils";

/**
 * Unified Studio: the composer and the AI generation board are now two
 * sub-sections of the same page (?section=composer | ai) instead of two tabs.
 */
export default function UnifiedStudio() {
  const [params, setParams] = useSearchParams();
  const section = params.get("section") === "ai" ? "ai" : "composer";

  const setSection = (next: "composer" | "ai") => {
    const p = new URLSearchParams(params);
    if (next === "composer") p.delete("section");
    else p.set("section", "ai");
    setParams(p, { replace: true });
  };

  const options = [
    { id: "composer" as const, label: "Composer", icon: PenLine },
    { id: "ai" as const, label: "AI ideas", icon: Wand2 },
  ];

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-2">
        <div
          role="tablist"
          aria-label="Studio sections"
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 backdrop-blur-sm"
        >
          {options.map((o) => (
            <button
              key={o.id}
              role="tab"
              aria-selected={section === o.id}
              onClick={() => setSection(o.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                section === o.id
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <o.icon className="h-3.5 w-3.5" />
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {section === "composer" ? <CreateStudio /> : <AiCreateView />}
    </div>
  );
}
