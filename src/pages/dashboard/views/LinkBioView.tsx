import { useState } from "react";
import { LinkIcon, Palette, Smartphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBoard } from "@/components/dashboard/shell";
import { NewLinkDialog } from "@/components/library/NewLinkDialog";
import { EditThemeDialog } from "@/components/library/EditThemeDialog";
import { LinkPreviewDialog } from "@/components/library/LinkPreviewDialog";
import { useLocalCollection } from "@/hooks/useLocalCollection";

const seed = [
  { id: "l1", title: "New drop pre-order", subtitle: "shop.smm.io/drop", status: "live", createdAt: new Date().toISOString() },
  { id: "l2", title: "Free newsletter", subtitle: "smm.io/newsletter", status: "live", createdAt: new Date().toISOString() },
  { id: "l3", title: "Winter sale", subtitle: "Ended Feb", status: "archived", createdAt: new Date().toISOString() },
];

export default function LinkBioView() {
  const [add, setAdd] = useState(false);
  const [theme, setTheme] = useState(false);
  const [preview, setPreview] = useState(false);
  const { items } = useLocalCollection<{ id: string; title: string; subtitle?: string; status: string }>(
    "library",
    "link-bio",
    seed,
  );

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 pt-2 flex flex-wrap gap-2 items-center justify-end">
        <Button variant="outline" size="sm" onClick={() => setTheme(true)}>
          <Palette className="h-4 w-4 sm:mr-1.5" strokeWidth={1.75} />
          <span className="hidden sm:inline">Theme</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPreview(true)}>
          <Smartphone className="h-4 w-4 sm:mr-1.5" strokeWidth={1.75} />
          <span className="hidden sm:inline">Preview</span>
        </Button>
        <Button size="sm" onClick={() => setAdd(true)}>
          <Plus className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">New link</span>
        </Button>
      </div>
      <StatusBoard
        storageKey="library:link-bio"
        hubKey="library-linkbio"
        icon={LinkIcon}
        searchPlaceholder="Search links…"
        addPlaceholder="New link…"
        seed={seed}
        columns={[
          { id: "draft", label: "Draft" },
          { id: "live", label: "Live" },
          { id: "archived", label: "Archived" },
        ]}
      />
      <NewLinkDialog open={add} onOpenChange={setAdd} />
      <EditThemeDialog open={theme} onOpenChange={setTheme} />
      <LinkPreviewDialog open={preview} onOpenChange={setPreview} links={items} />
    </>
  );
}
