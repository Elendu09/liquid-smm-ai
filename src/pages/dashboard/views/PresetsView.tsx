import { useState } from "react";
import { Palette, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBoard } from "@/components/dashboard/shell/StatusBoard";
import { NewPresetDialog } from "@/components/library/NewPresetDialog";

const seed = [
  { id: "p1", title: "Reel · Hook + CTA", subtitle: "Best for IG/TikTok · 45s", status: "favorite", createdAt: new Date().toISOString() },
  { id: "p2", title: "Carousel · 5 slides", subtitle: "Educational · IG", status: "team", createdAt: new Date().toISOString() },
  { id: "p3", title: "Story series", subtitle: "3-part · IG/FB", status: "mine", createdAt: new Date().toISOString() },
];

export default function PresetsView() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 pt-2 flex gap-2 items-center justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">New preset</span>
        </Button>
      </div>
      <StatusBoard
        storageKey="library:presets"
        hubKey="library-presets"
        icon={Palette}
        searchPlaceholder="Search presets…"
        addPlaceholder="New preset…"
        seed={seed}
        columns={[
          { id: "mine", label: "Mine" },
          { id: "team", label: "Team" },
          { id: "favorite", label: "Favorites" },
        ]}
      />
      <NewPresetDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
