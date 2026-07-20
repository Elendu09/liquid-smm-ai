import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useGuest, guardWrite } from "@/hooks/useGuest";
import { SignOutDialog } from "@/components/auth/SignOutDialog";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Shield,
  CreditCard,
  Trash2,
  Camera,
  Mail,
  Phone,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Linkedin,
  Check,
  AlertCircle,
  Crown,
  Fingerprint,
  Download,
  MoreHorizontal,
  KeyRound,
  RefreshCw,
  Sparkles,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { NotificationPreferencesMatrix } from "./NotificationPreferencesMatrix";
import { TeamNotificationSection } from "./TeamNotificationSection";
import { PasskeyDialog, type Passkey } from "./PasskeyDialog";
import { TwoFactorDialog } from "./TwoFactorDialog";
import { PaymentMethodDialog, type PaymentMethodRecord } from "./PaymentMethodDialog";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { logAudit } from "./AuditPanel";

/* ============================== Account =============================== */

export function AccountPanel() {
  const { user, isGuest } = useAuthUser();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "America/New_York",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setLoading(false);
      if (isGuest) {
        setProfile({
          name: "Guest visitor",
          email: "guest@demo.local",
          phone: "",
          timezone: "America/New_York",
          avatarUrl: "",
        });
      }
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, timezone")
        .eq("id", user.id)
        .maybeSingle();
      if (!mounted) return;
      if (error) toast.error(error.message);
      setProfile({
        name: data?.display_name ?? (user.user_metadata?.full_name as string) ?? user.email?.split("@")[0] ?? "",
        email: user.email ?? "",
        phone: (user.phone as string) ?? "",
        timezone: data?.timezone ?? "America/New_York",
        avatarUrl: data?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? "",
      });
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user, isGuest]);

  const initials = useMemo(() => {
    const n = (profile.name || profile.email || "?").trim();
    return n
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?";
  }, [profile.name, profile.email]);

  const handleSave = async () => {
    if (!guardWrite("update your profile")) return;
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.name,
        timezone: profile.timezone,
      })
      .eq("id", user.id);
    if (!error && profile.email && profile.email !== user.email) {
      const { error: eErr } = await supabase.auth.updateUser({ email: profile.email });
      if (eErr) toast.error(eErr.message);
      else toast.success("Confirmation email sent to new address");
    }
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  const handleResetPassword = async () => {
    if (!guardWrite("reset your password")) return;
    if (!profile.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  };

  const handleDelete = async () => {
    if (!guardWrite("delete your account")) return;
    if (!confirm("Delete your account? This cannot be undone.")) return;
    toast.info("Account deletion requested — our team will follow up by email.");
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/10 border-b" />
        <CardContent className="pt-0 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <div className="relative">
              <Avatar className="w-20 h-20 ring-4 ring-background">
                <AvatarImage src={profile.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute -bottom-1 -right-1 rounded-full w-7 h-7"
                aria-label="Change avatar"
                onClick={() => guardWrite("change your avatar") && toast("Avatar upload coming soon")}
              >
                <Camera className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{profile.name || "—"}</h3>
              <p className="text-sm text-muted-foreground truncate">{profile.email || "—"}</p>
            </div>
            <Badge variant="secondary" className="self-start sm:self-auto">
              <Crown className="w-3 h-3 mr-1" />
              {isGuest ? "Demo" : "Professional"}
            </Badge>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="name" value={profile.name} disabled={loading} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" value={profile.email} disabled={loading || isGuest} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="phone" type="tel" value={profile.phone} disabled={loading} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                <SelectTrigger id="timezone">
                  <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/30 flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? "Saving…" : "Save changes"}</Button>
          <Button variant="outline" onClick={handleResetPassword} disabled={!profile.email}>
            <KeyRound className="w-4 h-4 mr-2" />
            Send password reset
          </Button>
          <Button variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => setSignOutOpen(true)}>
            <LogOut className="w-4 h-4 mr-2" />
            {isGuest ? "Leave demo" : "Sign out"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive text-base">Danger zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <h4 className="font-medium">Delete account</h4>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete account
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium">Restart onboarding tour</p>
              <p className="text-sm text-muted-foreground">Rerun the setup wizard to update your profile, tone, and cadence.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new Event("smmpilot:open-onboarding"))}>
              Take the tour
            </Button>
          </div>
        </CardContent>
      </Card>

      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </div>
  );
}


/* ============================ Notifications =========================== */

export function NotificationPreferencesPanel() {
  return (
    <div className="space-y-6">
      <NotificationPreferencesMatrix />
    </div>
  );
}

export function TeamActivityNotificationsPanel() {
  return (
    <div className="space-y-6">
      <TeamNotificationSection />
    </div>
  );
}

/* ============================ Connected =============================== */

export { ConnectedPanel } from "./ConnectedPanelNew";

/* ============================== Billing =============================== */

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "Paid" | "Refunded" | "Failed";
  plan: string;
  number: string;
}

const seedInvoices: Invoice[] = [
  { id: "inv1", date: "Jan 15, 2024", amount: "$39.00", status: "Paid", plan: "Professional Plan", number: "INV-2024-0115" },
  { id: "inv2", date: "Dec 15, 2023", amount: "$39.00", status: "Paid", plan: "Professional Plan", number: "INV-2023-1215" },
  { id: "inv3", date: "Nov 15, 2023", amount: "$39.00", status: "Paid", plan: "Professional Plan", number: "INV-2023-1115" },
  { id: "inv4", date: "Oct 15, 2023", amount: "$39.00", status: "Paid", plan: "Professional Plan", number: "INV-2023-1015" },
];

const seedMethods: PaymentMethodRecord[] = [
  {
    id: "pm1",
    brand: "Visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2025,
    holder: "John Doe",
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

function brandGradient(brand: string) {
  switch (brand.toLowerCase()) {
    case "mastercard":
      return "from-orange-500 to-red-500";
    case "amex":
      return "from-sky-500 to-indigo-500";
    case "discover":
      return "from-amber-500 to-orange-400";
    default:
      return "from-blue-600 to-blue-400";
  }
}

function invoiceText(inv: Invoice) {
  return [
    `Invoice ${inv.number}`,
    `Date: ${inv.date}`,
    `Plan: ${inv.plan}`,
    `Amount: ${inv.amount}`,
    `Status: ${inv.status}`,
    "",
    "Thank you for your business.",
  ].join("\n");
}

function download(name: string, contents: string, type = "text/plain") {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function BillingPanel() {
  const usage = [
    { label: "Scheduled posts", used: 148, cap: 200, unit: "posts / mo" },
    { label: "AI credits", used: 720, cap: 1000, unit: "credits / mo" },
    { label: "Connected accounts", used: 3, cap: 5, unit: "accounts" },
    { label: "Team seats", used: 4, cap: 10, unit: "seats" },
  ];

  const { items: methods, setItems: setMethods, remove: removeMethod } = useLocalCollection<PaymentMethodRecord>(
    "settings",
    "payment-methods",
    seedMethods,
  );
  const { items: invoices } = useLocalCollection<Invoice>("settings", "invoices", seedInvoices);

  const [pmOpen, setPmOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethodRecord | null>(null);

  const savePm = (pm: PaymentMethodRecord) => {
    if (!guardWrite("save payment methods")) return;
    setMethods((prev) => {
      const next = prev.filter((m) => m.id !== pm.id).map((m) =>
        pm.isDefault ? { ...m, isDefault: false } : m,
      );
      return [pm, ...next];
    });
  };

  const setDefault = (id: string) => {
    if (!guardWrite("update payment methods")) return;
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
    toast.success("Default payment method updated");
  };

  const remove = (id: string) => {
    if (!guardWrite("remove payment methods")) return;
    removeMethod(id);
    toast.success("Payment method removed");
    logAudit({ actor: "You", action: "Removed payment method", category: "billing" });
  };

  const downloadInvoice = (inv: Invoice) => {
    download(`${inv.number}.txt`, invoiceText(inv));
    toast.success(`Invoice ${inv.number} downloaded`);
  };

  const exportAll = () => {
    const header = ["number", "date", "plan", "amount", "status"];
    const lines = [header.join(",")];
    invoices.forEach((i) =>
      lines.push([i.number, i.date, i.plan, i.amount, i.status].map((v) => `"${v}"`).join(",")),
    );
    download(`invoices-${new Date().toISOString().slice(0, 10)}.csv`, lines.join("\n"), "text/csv");
    toast.success(`Exported ${invoices.length} invoices`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="min-w-0 text-sm">
          <p className="font-medium">Billing is running in preview mode</p>
          <p className="text-muted-foreground">
            Plan, usage, invoices, and payment methods below are placeholders. Connect a payment provider (Stripe or Paddle) to enable real subscriptions, invoices, and card management.
          </p>
        </div>
      </div>

      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Professional plan
              </CardTitle>
              <CardDescription>Your current subscription</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-500">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-bold">$39</span>
            <span className="text-muted-foreground">/month</span>
            <Badge variant="outline" className="ml-2">Billed annually</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Next billing date: February 15, 2024</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/pricing">
                <Sparkles className="h-4 w-4 mr-2" />
                Change plan
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => confirm("Cancel your subscription?") && toast.success("Subscription cancelled")}
            >
              Cancel subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage this cycle</CardTitle>
          <CardDescription>Included quotas for your Professional plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {usage.map((u) => {
            const pct = Math.min(100, Math.round((u.used / u.cap) * 100));
            const near = pct >= 80;
            return (
              <div key={u.label} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{u.label}</span>
                  <span className={near ? "text-amber-500" : "text-muted-foreground"}>
                    {u.used.toLocaleString()} / {u.cap.toLocaleString()} {u.unit}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all ${near ? "bg-amber-500" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {near && (
                  <p className="text-[11px] text-amber-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Approaching plan limit
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Payment methods</CardTitle>
            <CardDescription>Manage cards used for subscription charges</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setPmOpen(true);
            }}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Add card
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {methods.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No payment method saved yet.
            </div>
          )}
          {methods.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-8 bg-gradient-to-r ${brandGradient(m.brand)} rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {m.brand.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">•••• {m.last4}</p>
                    {m.isDefault && (
                      <Badge variant="secondary" className="text-[10px]">Default</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.holder} · Expires {String(m.expMonth).padStart(2, "0")}/{String(m.expYear).slice(-2)}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditing(m);
                      setPmOpen(true);
                    }}
                  >
                    Edit details
                  </DropdownMenuItem>
                  {!m.isDefault && (
                    <DropdownMenuItem onSelect={() => setDefault(m.id)}>
                      Set as default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={m.isDefault && methods.length === 1}
                    onSelect={() => remove(m.id)}
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Invoice history</CardTitle>
            <CardDescription>Download individual invoices or export the full list</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportAll}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{inv.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.date} · {inv.plan}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium tabular-nums">{inv.amount}</span>
                <Badge
                  variant="secondary"
                  className={
                    inv.status === "Paid"
                      ? "bg-green-500/10 text-green-500"
                      : inv.status === "Refunded"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-destructive/10 text-destructive"
                  }
                >
                  {inv.status}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => downloadInvoice(inv)}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  PDF
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <PaymentMethodDialog
        open={pmOpen}
        onOpenChange={setPmOpen}
        onSaved={savePm}
        initial={editing}
      />
    </div>
  );
}

/* ============================== Session row ============================== */

function CurrentSessionRow() {
  const { user } = useAuthUser();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const device = /iPhone|iPad/.test(ua)
    ? "iPhone / iPad"
    : /Android/.test(ua)
    ? "Android device"
    : /Macintosh/.test(ua)
    ? "Mac"
    : /Windows/.test(ua)
    ? "Windows PC"
    : "This device";
  const browser = /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "Browser";
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{browser} on {device}</h4>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500">Current</Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {user?.email ?? "guest"} · signed in {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "just now"}
        </p>
      </div>
    </div>
  );
}

/* ============================== Security ============================== */

export function SecurityPanel() {
  const { items: passkeys, remove: removePasskey } = useLocalCollection<Passkey>(
    "settings",
    "passkeys",
    [],
  );
  const { items: recovery, setItems: setRecovery } = useLocalCollection<{
    id: string;
    codes: string[];
    createdAt: string;
  }>("settings", "recovery-codes", []);

  const [passkeyOpen, setPasskeyOpen] = useState(false);
  const [tfaOpen, setTfaOpen] = useState(false);
  const [signOutAllOpen, setSignOutAllOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("john.backup@example.com");
  const [recoveryPhone, setRecoveryPhone] = useState("+1 (555) 987-6543");

  const activeRecovery = recovery[0];

  const regenerateCodes = () => {
    const codes = Array.from({ length: 8 }, () =>
      Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 6).toUpperCase()).join("-"),
    );
    setRecovery([{ id: crypto.randomUUID(), codes, createdAt: new Date().toISOString() }]);
    logAudit({ actor: "You", action: "Regenerated recovery codes", category: "security" });
    toast.success("New recovery codes generated");
  };

  const downloadCodes = () => {
    if (!activeRecovery) return;
    download("recovery-codes.txt", activeRecovery.codes.join("\n"));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/30">
          <Button onClick={() => toast.success("Password updated")}>Update password</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              Passkeys
            </CardTitle>
            <CardDescription>
              Sign in with Face ID, Touch ID, Windows Hello, or a security key.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setPasskeyOpen(true)}>
            <Fingerprint className="h-4 w-4 mr-2" />
            Add passkey
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {passkeys.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No passkeys yet. Add one to skip passwords on trusted devices.
            </div>
          ) : (
            passkeys.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Fingerprint className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{pk.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {pk.device} · added {new Date(pk.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    removePasskey(pk.id);
                    logAudit({ actor: "You", action: "Removed passkey", target: pk.label, category: "security" });
                    toast.success("Passkey removed");
                  }}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Two-factor authentication
          </CardTitle>
          <CardDescription>Require a one-time code in addition to your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Authenticator app</h4>
                  {twoFactorEnabled && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      Enabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Use TOTP codes from Authy, 1Password, Google Authenticator…</p>
              </div>
            </div>
            {twoFactorEnabled ? (
              <Button
                variant="outline"
                onClick={() => {
                  setTwoFactorEnabled(false);
                  logAudit({ actor: "You", action: "Disabled two-factor authentication", category: "security" });
                  toast.success("Two-factor disabled");
                }}
              >
                Disable
              </Button>
            ) : (
              <Button onClick={() => setTfaOpen(true)}>Enable</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Account recovery
          </CardTitle>
          <CardDescription>
            Backup channels and one-time codes for regaining access if you're locked out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recovery-email">Recovery email</Label>
              <Input
                id="recovery-email"
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recovery-phone">Recovery phone</Label>
              <Input
                id="recovery-phone"
                type="tel"
                value={recoveryPhone}
                onChange={(e) => setRecoveryPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Recovery codes</p>
                <p className="text-xs text-muted-foreground">
                  {activeRecovery
                    ? `${activeRecovery.codes.length} codes generated on ${new Date(activeRecovery.createdAt).toLocaleDateString()}.`
                    : "Generate a set of one-time codes to keep in a safe place."}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {activeRecovery && (
                  <Button variant="ghost" size="sm" onClick={downloadCodes}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={regenerateCodes}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  {activeRecovery ? "Regenerate" : "Generate"}
                </Button>
              </div>
            </div>
            {activeRecovery && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs bg-muted/40 border rounded-md p-2">
                {activeRecovery.codes.map((c) => (
                  <div key={c} className="text-center py-1">
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/30">
          <Button
            onClick={() => {
              logAudit({ actor: "You", action: "Updated recovery contacts", category: "security" });
              toast.success("Recovery contacts saved");
            }}
          >
            Save recovery contacts
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active session</CardTitle>
          <CardDescription>
            Your current sign-in on this device. Session listing across other devices requires an admin key not exposed to the browser — use <span className="font-medium">Sign out all devices</span> to revoke everything.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentSessionRow />
        </CardContent>
        <CardFooter className="border-t bg-muted/30">
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setSignOutAllOpen(true)}>
            <AlertCircle className="w-4 h-4 mr-2" />
            Sign out all devices
          </Button>
        </CardFooter>
      </Card>

      <PasskeyDialog open={passkeyOpen} onOpenChange={setPasskeyOpen} />
      <TwoFactorDialog
        open={tfaOpen}
        onOpenChange={setTfaOpen}
        onEnabled={() => setTwoFactorEnabled(true)}
      />
      <SignOutDialog open={signOutAllOpen} onOpenChange={setSignOutAllOpen} scope="all" />
    </div>
  );
}
