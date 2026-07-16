import { useState } from "react";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBoard } from "@/components/dashboard/shell";
import { HashtagResearchDialog } from "@/components/create/HashtagResearchDialog";

const seed = [
  { id: "h1", title: "#creatoreconomy", subtitle: "12.4M posts · high competition", status: "tracking", createdAt: new Date().toISOString() },
  { id: "h2", title: "#indiehackers", subtitle: "820k posts · niche fit", status: "saved", createdAt: new Date().toISOString() },
  { id: "h3", title: "#growthmarketing", subtitle: "4.2M · medium competition", status: "trending", createdAt: new Date().toISOString() },
];

export default function HashtagsCreateView() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 pt-2 flex gap-2 items-center justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Hash className="h-4 w-4 mr-1.5" /> Research with AI
        </Button>
      </div>
      <StatusBoard
        storageKey="create:hashtags"
        hubKey="create-hashtags"
        icon={Hash}
        searchPlaceholder="Search hashtags…"
        addPlaceholder="#hashtag"
        seed={seed}
        columns={[
          { id: "tracking", label: "Tracking" },
          { id: "saved", label: "Saved" },
          { id: "trending", label: "Trending" },
        ]}
      />
      <HashtagResearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
