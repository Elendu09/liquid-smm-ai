import { useMemo, useState } from "react";
import { Plus, Star, Trash2, Pencil, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { platforms } from "@/config/platforms";
import { toolPlatformRequirements } from "@/config/toolPlatformMap";
import { usePresets, PlatformPreset } from "@/hooks/usePresets";
import { useContentTemplates, ContentTemplate } from "@/hooks/useContentTemplates";
import { PlatformIcon } from "@/components/shared/PlatformIcon";

const toolKeys = Object.keys(toolPlatformRequirements);

export default function PresetsAndTemplates() {
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [toolFilter, setToolFilter] = useState<string>("all");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Presets & Templates
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize per-platform tone, style, and reusable content templates for each automation tool.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {platforms.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={toolFilter} onValueChange={setToolFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Tool" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tools</SelectItem>
            {toolKeys.map((t) => (
              <SelectItem key={t} value={t}>
                {toolPlatformRequirements[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="presets">
        <TabsList>
          <TabsTrigger value="presets"><Star className="mr-2 h-4 w-4" />Presets</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="mr-2 h-4 w-4" />Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="presets" className="mt-6">
          <PresetsPanel platformFilter={platformFilter} toolFilter={toolFilter} />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <TemplatesPanel platformFilter={platformFilter} toolFilter={toolFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PresetsPanel({ platformFilter, toolFilter }: { platformFilter: string; toolFilter: string }) {
  const { all, upsert, remove, setDefault } = usePresets();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformPreset | null>(null);

  const filtered = useMemo(
    () =>
      all.filter((p) => {
        if (platformFilter !== "all" && p.platform !== platformFilter) return false;
        if (toolFilter !== "all" && p.toolKey !== toolFilter) return false;
        return true;
      }),
    [all, platformFilter, toolFilter],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New preset
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">
            No presets. Create one to customize how tools generate content for a platform.
          </p>
        )}
        {filtered.map((p) => (
          <Card key={p.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PlatformIcon platform={p.platform} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {toolPlatformRequirements[p.toolKey]?.label ?? p.toolKey}
                  </p>
                </div>
              </div>
              {p.isDefault && <Badge variant="secondary" className="shrink-0"><Star className="h-3 w-3 mr-1" />Default</Badge>}
            </div>
            <div className="text-xs bg-secondary/40 rounded p-2 space-y-0.5 max-h-24 overflow-auto">
              {Object.entries(p.config).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="truncate">{String(v)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {!p.isDefault && (
                <Button size="sm" variant="outline" onClick={() => { setDefault(p.id); toast.success("Default set"); }}>
                  <Star className="h-3 w-3 mr-1" /> Set default
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { remove(p.id); toast.success("Deleted"); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <PresetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(data) => {
          upsert({ ...data, id: editing?.id });
          toast.success(editing ? "Preset updated" : "Preset created");
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

function PresetDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: PlatformPreset | null;
  onSubmit: (data: Omit<PlatformPreset, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [platform, setPlatform] = useState(editing?.platform ?? "instagram");
  const [toolKey, setToolKey] = useState(editing?.toolKey ?? "caption-generator");
  const [tone, setTone] = useState<string>((editing?.config.tone as string) ?? "casual");
  const [emojiLevel, setEmojiLevel] = useState<string>((editing?.config.emojiLevel as string) ?? "medium");
  const [hashtagCount, setHashtagCount] = useState<number>((editing?.config.hashtagCount as number) ?? 10);
  const [cta, setCta] = useState<string>((editing?.config.cta as string) ?? "");
  const [isDefault, setIsDefault] = useState(editing?.isDefault ?? false);

  const save = () => {
    if (!name.trim()) return toast.error("Name required");
    onSubmit({
      name: name.trim(),
      platform,
      toolKey,
      isDefault,
      config: { tone, emojiLevel, hashtagCount, cta },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit preset" : "New preset"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IG Casual" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tool</Label>
              <Select value={toolKey} onValueChange={setToolKey}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {toolKeys.map((t) => (
                    <SelectItem key={t} value={t}>{toolPlatformRequirements[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["casual", "professional", "witty", "inspirational", "trendy", "educational", "friendly"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Emoji level</Label>
              <Select value={emojiLevel} onValueChange={setEmojiLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["none", "low", "medium", "high"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Hashtag count</Label><Input type="number" value={hashtagCount} onChange={(e) => setHashtagCount(Number(e.target.value))} /></div>
          <div><Label>Default CTA</Label><Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. Save for later ✨" /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            Set as default for this platform + tool
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplatesPanel({ platformFilter, toolFilter }: { platformFilter: string; toolFilter: string }) {
  const { all, upsert, remove } = useContentTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentTemplate | null>(null);

  const filtered = useMemo(
    () =>
      all.filter((p) => {
        if (platformFilter !== "all" && p.platform !== platformFilter) return false;
        if (toolFilter !== "all" && p.toolKey !== toolFilter) return false;
        return true;
      }),
    [all, platformFilter, toolFilter],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New template
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">
            No templates yet.
          </p>
        )}
        {filtered.map((t) => (
          <Card key={t.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PlatformIcon platform={t.platform} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {toolPlatformRequirements[t.toolKey]?.label ?? t.toolKey}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">used {t.usageCount}×</Badge>
            </div>
            <p className="text-xs bg-secondary/40 rounded p-2 whitespace-pre-wrap max-h-32 overflow-auto">{t.body}</p>
            {t.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {t.tags.map((tag) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { remove(t.id); toast.success("Deleted"); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(data) => {
          upsert({ ...data, id: editing?.id });
          toast.success(editing ? "Template updated" : "Template created");
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

function TemplateDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ContentTemplate | null;
  onSubmit: (data: Omit<ContentTemplate, "id" | "createdAt" | "updatedAt" | "usageCount">) => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [platform, setPlatform] = useState(editing?.platform ?? "instagram");
  const [toolKey, setToolKey] = useState(editing?.toolKey ?? "caption-generator");
  const [body, setBody] = useState(editing?.body ?? "");
  const [tagsInput, setTagsInput] = useState((editing?.tags ?? []).join(", "));

  const save = () => {
    if (!name.trim() || !body.trim()) return toast.error("Name and body required");
    onSubmit({
      name: name.trim(),
      platform,
      toolKey,
      body: body.trim(),
      tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tool</Label>
              <Select value={toolKey} onValueChange={setToolKey}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {toolKeys.map((t) => (
                    <SelectItem key={t} value={t}>{toolPlatformRequirements[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Use {{variables}} to interpolate values." rows={5} />
            <p className="text-xs text-muted-foreground mt-1">Variables like {"{{name}}"}, {"{{link}}"} are replaced at use time.</p>
          </div>
          <div><Label>Tags (comma separated)</Label><Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
