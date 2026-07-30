import { useMemo, useState } from "react";
import { Building2, Plus, Trash2, Archive, ArchiveRestore, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBrands, type Brand } from "@/contexts/BrandContext";
import { useAccounts } from "@/contexts/AccountContext";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeNudge } from "@/components/shared/FeatureGate";
import { useGuest } from "@/hooks/useGuest";
import { platforms } from "@/config/platforms";
import { limitLabel } from "@/config/plans";
import { toast } from "sonner";

const SWATCHES = [
  "217 91% 60%",
  "262 83% 58%",
  "346 77% 60%",
  "142 71% 45%",
  "38 92% 50%",
  "190 90% 45%",
];

const UNASSIGNED = "__none__";

/**
 * Settings › Brands — the workspace layer above connected channels.
 * Create client/brand workspaces, assign channels, and scope the whole
 * dashboard to one brand at a time from the header switcher.
 */
export function BrandsPanel() {
  const { brands, createBrand, updateBrand, removeBrand } = useBrands();
  const { accounts, assignBrand } = useAccounts();
  const { plan } = usePlan();
  const { guardWrite } = useGuest();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [saving, setSaving] = useState(false);

  const cap = plan.brands;
  const atCap = cap !== null && brands.length >= cap;

  const channelsFor = useMemo(() => {
    const map = new Map<string, typeof accounts>();
    accounts.forEach((a) => {
      const key = a.brandId ?? UNASSIGNED;
      map.set(key, [...(map.get(key) ?? []), a]);
    });
    return map;
  }, [accounts]);

  const submit = async () => {
    if (!guardWrite("Creating a brand")) return;
    if (!name.trim()) return;
    setSaving(true);
    const created = await createBrand({ name: name.trim(), description: description.trim() || null, color });
    setSaving(false);
    if (!created) { toast.error("Could not create that brand."); return; }
    toast.success(`${created.name} created`);
    setOpen(false);
    setName(""); setDescription(""); setColor(SWATCHES[0]);
  };

  const toggleArchive = async (b: Brand) => {
    if (!guardWrite("Updating a brand")) return;
    await updateBrand(b.id, { archived: !b.archived });
    toast.success(b.archived ? `${b.name} restored` : `${b.name} archived`);
  };

  const destroy = async (b: Brand) => {
    if (!guardWrite("Deleting a brand")) return;
    await removeBrand(b.id);
    toast.success(`${b.name} deleted — its channels are now unassigned`);
  };

  const unassigned = channelsFor.get(UNASSIGNED) ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Brands & workspaces
            </CardTitle>
            <CardDescription>
              Group channels per client or product line. The header switcher scopes the planner,
              analytics, inbox and reports to the brand you pick.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="tabular-nums">
              {brands.length} / {limitLabel(cap)}
            </Badge>
            <Button size="sm" disabled={atCap} onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New brand
            </Button>
          </div>
        </CardHeader>

        {atCap && (
          <CardContent>
            <UpgradeNudge
              title={`Your plan includes ${limitLabel(cap)} brand${cap === 1 ? "" : "s"}`}
              description="Upgrade to run more client workspaces side by side, each with its own channels, planner and reports."
            />
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {brands.map((b) => {
          const list = channelsFor.get(b.id) ?? [];
          return (
            <Card key={b.id} className={b.archived ? "opacity-60" : undefined}>
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-semibold text-background"
                  style={{ backgroundColor: `hsl(${b.color})` }}
                >
                  {b.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">{b.name}</CardTitle>
                  <CardDescription className="truncate">
                    {b.description || `${list.length} channel${list.length === 1 ? "" : "s"} · ${b.timezone}`}
                  </CardDescription>
                </div>
                {b.archived && <Badge variant="secondary">Archived</Badge>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {list.length === 0 && (
                    <span className="text-xs text-muted-foreground">No channels assigned yet.</span>
                  )}
                  {list.map((a) => {
                    const p = platforms.find((x) => x.id === a.platformId);
                    return (
                      <Badge key={a.id} variant="outline" className="gap-1 font-normal">
                        <Link2 className="h-3 w-3" />
                        {p?.name ?? a.platformId} · @{a.username}
                      </Badge>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleArchive(b)}>
                    {b.archived ? <ArchiveRestore className="h-3.5 w-3.5 mr-1.5" /> : <Archive className="h-3.5 w-3.5 mr-1.5" />}
                    {b.archived ? "Restore" : "Archive"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => destroy(b)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {brands.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-10 text-center">
              <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No brands yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first workspace to group channels, plans and reports per client.
              </p>
              <Button className="mt-4" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Create a brand
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channel assignment</CardTitle>
          <CardDescription>
            Every connected channel belongs to at most one brand.
            {unassigned.length > 0 && ` ${unassigned.length} channel${unassigned.length === 1 ? " is" : "s are"} still unassigned.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {accounts.length === 0 && (
            <p className="text-sm text-muted-foreground">Connect a channel first, then assign it here.</p>
          )}
          {accounts.map((a) => {
            const p = platforms.find((x) => x.id === a.platformId);
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">@{a.username}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p?.name ?? a.platformId} · {a.followers.toLocaleString()} followers
                  </p>
                </div>
                <Select
                  value={a.brandId ?? UNASSIGNED}
                  onValueChange={(v) => {
                    if (!guardWrite("Assigning a channel")) return;
                    void assignBrand(a.id, v === UNASSIGNED ? null : v);
                  }}
                >
                  <SelectTrigger className="h-9 w-[190px]">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {brands.filter((b) => !b.archived).map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New brand workspace</DialogTitle>
            <DialogDescription>
              Give the brand a name and colour — you can assign channels right after.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name">Name</Label>
              <Input
                id="brand-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Coffee Co."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-desc">Description</Label>
              <Textarea
                id="brand-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this workspace covers"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Accent colour</Label>
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Accent ${c}`}
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all ${color === c ? "ring-2 ring-primary" : ""}`}
                    style={{ backgroundColor: `hsl(${c})` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving || !name.trim()}>
              {saving ? "Creating…" : "Create brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BrandsPanel;
