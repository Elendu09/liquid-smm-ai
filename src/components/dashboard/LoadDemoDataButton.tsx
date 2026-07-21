import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/useAuthUser";
import { loadDemoData, hasLoadedDemo } from "@/lib/demoData";

export function LoadDemoDataButton() {
  const { user, isGuest } = useAuthUser();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(hasLoadedDemo());

  if (!user || isGuest || loaded) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const { inserted } = await loadDemoData(user.id);
          toast.success(`Loaded ${inserted} demo items across your hubs`);
          setLoaded(true);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to load demo data");
        } finally {
          setLoading(false);
        }
      }}
      className="w-full md:w-auto text-[11px] sm:text-xs md:text-sm px-2 sm:px-3 rounded-lg border border-border/60 bg-card/60 backdrop-blur-md hover:border-primary/50"
    >
      {loading ? (
        <Loader2 className="mr-1 sm:mr-2 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
      )}
      Load demo data
    </Button>
  );
}
