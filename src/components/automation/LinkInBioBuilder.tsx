import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Palette,
  BarChart3,
  Image as ImageIcon,
  Type,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Github,
  Copy,
  Check,
  Sparkles,
  Share2,
  ArrowUpRight,
  Heart,
  BadgeCheck,
  Link2,
  ShoppingBag,
  Mail,
  CalendarDays,
  Briefcase,
  Music,
  Headphones,
  BookOpen,
  Coffee,
  Gift,
  Camera,
  PlayCircle,
  Newspaper,
  Rocket,
  Star,
  Tv,
  SignalHigh,
  Wifi,
  BatteryFull,
  type LucideIcon,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Curated set of Lucide icons users can pick for each link
const LINK_ICONS: Record<string, LucideIcon> = {
  link: Link2,
  shopping: ShoppingBag,
  youtube: Youtube,
  mail: Mail,
  calendar: CalendarDays,
  globe: Globe,
  briefcase: Briefcase,
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  github: Github,
  music: Music,
  podcast: Headphones,
  book: BookOpen,
  coffee: Coffee,
  gift: Gift,
  camera: Camera,
  play: PlayCircle,
  news: Newspaper,
  rocket: Rocket,
  star: Star,
  tv: Tv,
};

const LINK_ICON_OPTIONS = Object.keys(LINK_ICONS);

type ThemeId = "gradient" | "midnight" | "sunset" | "ocean" | "forest" | "minimal" | "neon" | "rose";

interface ThemeDef {
  id: ThemeId;
  name: string;
  // Tailwind classes for the *preview canvas* background
  bg: string;
  // Button style
  buttonClass: string;
  // Text color on background
  textClass: string;
  subTextClass: string;
}

const themes: ThemeDef[] = [
  {
    id: "gradient",
    name: "Aurora",
    bg: "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500",
    buttonClass: "bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white",
    textClass: "text-white",
    subTextClass: "text-white/80",
  },
  {
    id: "midnight",
    name: "Midnight",
    bg: "bg-gradient-to-b from-slate-900 via-slate-950 to-black",
    buttonClass: "bg-white/5 hover:bg-white/10 border border-white/10 text-white",
    textClass: "text-white",
    subTextClass: "text-slate-300",
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600",
    buttonClass: "bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/25 text-white",
    textClass: "text-white",
    subTextClass: "text-white/90",
  },
  {
    id: "ocean",
    name: "Ocean",
    bg: "bg-gradient-to-b from-cyan-500 via-blue-600 to-indigo-700",
    buttonClass: "bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white",
    textClass: "text-white",
    subTextClass: "text-cyan-50",
  },
  {
    id: "forest",
    name: "Forest",
    bg: "bg-gradient-to-b from-emerald-500 via-green-600 to-teal-800",
    buttonClass: "bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white",
    textClass: "text-white",
    subTextClass: "text-emerald-50",
  },
  {
    id: "minimal",
    name: "Minimal",
    bg: "bg-gradient-to-b from-neutral-50 to-neutral-100",
    buttonClass: "bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-900 shadow-sm",
    textClass: "text-neutral-900",
    subTextClass: "text-neutral-600",
  },
  {
    id: "neon",
    name: "Neon",
    bg: "bg-[radial-gradient(ellipse_at_top,_#1e1b4b,_#000)]",
    buttonClass: "bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/40 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.25)]",
    textClass: "text-white",
    subTextClass: "text-cyan-200/80",
  },
  {
    id: "rose",
    name: "Rose",
    bg: "bg-gradient-to-br from-rose-100 via-pink-100 to-orange-100",
    buttonClass: "bg-white/70 hover:bg-white border border-rose-200 text-rose-900 backdrop-blur-sm",
    textClass: "text-rose-950",
    subTextClass: "text-rose-700",
  },
];

interface LinkItem {
  id: number;
  title: string;
  url: string;
  clicks: number;
  enabled: boolean;
  icon: string;
  highlight?: boolean;
}

const LinkInBioBuilder = () => {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("gradient");
  const [roundedButtons, setRoundedButtons] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showVerified, setShowVerified] = useState(true);

  const [links, setLinks] = useState<LinkItem[]>([
    { id: 1, title: "Shop My Favorites", url: "https://shop.example.com", clicks: 1247, enabled: true, icon: "shopping", highlight: true },
    { id: 2, title: "Latest YouTube Video", url: "https://youtube.com/watch", clicks: 892, enabled: true, icon: "youtube" },
    { id: 3, title: "Join My Newsletter", url: "https://newsletter.example.com", clicks: 534, enabled: true, icon: "mail" },
    { id: 4, title: "Book a Consultation", url: "https://calendly.com/example", clicks: 321, enabled: true, icon: "calendar" },
    { id: 5, title: "My Portfolio", url: "https://portfolio.example.com", clicks: 456, enabled: false, icon: "briefcase" },
  ]);

  const [profileData, setProfileData] = useState({
    name: "Sarah Johnson",
    bio: "Digital Creator · Marketing Expert\nHelping brands grow with proven strategies.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bioUrl: "smmsaas.com/@sarah",
  });

  const socialLinks = [
    { icon: Instagram, name: "Instagram", url: "@sarahjohnson", connected: true },
    { icon: Twitter, name: "Twitter", url: "@sarahj", connected: true },
    { icon: Youtube, name: "YouTube", url: "SarahJohnson", connected: true },
    { icon: Facebook, name: "Facebook", url: "", connected: false },
    { icon: Linkedin, name: "LinkedIn", url: "", connected: false },
    { icon: Github, name: "GitHub", url: "", connected: false },
  ];

  const addLink = () =>
    setLinks([...links, { id: Date.now(), title: "New Link", url: "https://", clicks: 0, enabled: true, icon: "link" }]);
  const removeLink = (id: number) => setLinks(links.filter((l) => l.id !== id));
  const toggleLink = (id: number) => setLinks(links.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)));
  const toggleHighlight = (id: number) =>
    setLinks(links.map((l) => (l.id === id ? { ...l, highlight: !l.highlight } : l)));

  const copyBioUrl = () => {
    navigator.clipboard.writeText(`https://${profileData.bioUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const activeTheme = themes.find((t) => t.id === theme) || themes[0];
  const enabledLinks = links.filter((l) => l.enabled);
  const connectedSocials = socialLinks.filter((s) => s.connected);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Link in Bio Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Create your personalized bio link page</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border min-w-0">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground truncate max-w-[180px] sm:max-w-none">{profileData.bioUrl}</span>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={copyBioUrl}>
              {copied ? <Check className="h-4 w-4 text-brand-green" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button className="gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Clicks", value: totalClicks.toLocaleString(), color: "from-violet-500 to-purple-500" },
          { label: "Active Links", value: enabledLinks.length, color: "from-emerald-500 to-teal-500" },
          { label: "Click Rate", value: "4.2%", color: "from-orange-500 to-pink-500" },
          { label: "Page Views", value: "12.5K", color: "from-cyan-500 to-blue-500" },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card overflow-hidden">
            <CardContent className="p-4 relative">
              <div className={cn("absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br opacity-20 blur-2xl", stat.color)} />
              <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Editor Column */}
        <div className="xl:col-span-2 space-y-4 min-w-0">
          <Tabs defaultValue="links" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="links" className="text-xs sm:text-sm py-2">Links</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm py-2">Profile</TabsTrigger>
              <TabsTrigger value="theme" className="text-xs sm:text-sm py-2">Design</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="links" className="space-y-4">
              <Card className="glass-card">
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base sm:text-lg">Your Links</CardTitle>
                  <Button onClick={addLink} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Link</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className={cn(
                        "group flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border transition-all",
                        link.enabled
                          ? "bg-muted/30 border-border hover:border-primary/40"
                          : "bg-muted/10 border-border/50 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                        <Select
                          value={link.icon}
                          onValueChange={(val) =>
                            setLinks(links.map((l) => (l.id === link.id ? { ...l, icon: val } : l)))
                          }
                        >
                          <SelectTrigger
                            className="h-10 w-12 p-0 flex items-center justify-center"
                            aria-label="Choose icon"
                          >
                            {(() => {
                              const Ico = LINK_ICONS[link.icon] || Link2;
                              return <Ico className="h-4 w-4" />;
                            })()}
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {LINK_ICON_OPTIONS.map((key) => {
                              const Ico = LINK_ICONS[key];
                              return (
                                <SelectItem key={key} value={key}>
                                  <span className="flex items-center gap-2 capitalize">
                                    <Ico className="h-4 w-4" />
                                    {key}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <Input
                          value={link.title}
                          onChange={(e) =>
                            setLinks(links.map((l) => (l.id === link.id ? { ...l, title: e.target.value } : l)))
                          }
                          className="font-medium"
                          placeholder="Link title"
                        />
                        <Input
                          value={link.url}
                          onChange={(e) =>
                            setLinks(links.map((l) => (l.id === link.id ? { ...l, url: e.target.value } : l)))
                          }
                          className="text-sm"
                          placeholder="https://"
                        />
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {link.clicks.toLocaleString()} clicks
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn("h-8 w-8 p-0", link.highlight && "text-yellow-500")}
                          onClick={() => toggleHighlight(link.id)}
                          title="Highlight link"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Switch checked={link.enabled} onCheckedChange={() => toggleLink(link.id)} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => removeLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <img
                      src={profileData.avatar}
                      alt="Profile"
                      className="w-20 h-20 rounded-full bg-muted ring-2 ring-primary/20"
                    />
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">Upload Avatar</Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">Remove</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Display Name</label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Bio</label>
                    <Textarea
                      rows={3}
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Custom URL</label>
                    <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">smmsaas.com/@</span>
                      <Input
                        value={profileData.bioUrl.split("@").pop()}
                        onChange={(e) =>
                          setProfileData({ ...profileData, bioUrl: `smmsaas.com/@${e.target.value.replace(/^@/, "")}` })
                        }
                        className="flex-1 border-0 px-0 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {socialLinks.map((social, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3 sm:w-32">
                        <social.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-foreground">{social.name}</span>
                      </div>
                      <Input value={social.url} placeholder={`Your ${social.name} handle`} className="flex-1" />
                      <Badge variant={social.connected ? "default" : "outline"} className="self-start sm:self-auto">
                        {social.connected ? "Connected" : "Connect"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="theme" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Palette className="h-5 w-5" />
                    Choose Theme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                          "p-2 rounded-xl border-2 transition-all text-left",
                          theme === t.id
                            ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn("w-full h-20 rounded-lg shadow-inner", t.bg)} />
                        <p className="text-xs sm:text-sm font-medium text-foreground mt-2">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Customization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: Type, label: "Rounded Buttons", value: roundedButtons, set: setRoundedButtons },
                    { icon: Sparkles, label: "Animations", value: animations, set: setAnimations },
                    { icon: ImageIcon, label: "Show Avatar", value: showAvatar, set: setShowAvatar },
                    { icon: BadgeCheck, label: "Verified Badge", value: showVerified, set: setShowVerified },
                  ].map((opt) => (
                    <div key={opt.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{opt.label}</span>
                      </div>
                      <Switch checked={opt.value} onCheckedChange={opt.set} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="h-5 w-5" />
                    Link Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...links].sort((a, b) => b.clicks - a.clicks).map((link) => (
                      <div key={link.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-foreground truncate">{link.title}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {link.clicks.toLocaleString()} clicks
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${(link.clicks / Math.max(...links.map((l) => l.clicks), 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Phone Preview Column */}
        <div className="xl:col-span-1">
          <div className="xl:sticky xl:top-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </h3>
              <Badge variant="outline" className="text-[10px]">iPhone 15</Badge>
            </div>

            {/* Phone frame */}
            <div className="mx-auto w-[300px] sm:w-[320px]">
              <div className="relative rounded-[2.75rem] bg-neutral-900 p-3 shadow-2xl ring-1 ring-white/10">
                {/* Side buttons */}
                <div className="absolute -left-1 top-24 w-1 h-12 rounded-l-md bg-neutral-800" />
                <div className="absolute -left-1 top-40 w-1 h-16 rounded-l-md bg-neutral-800" />
                <div className="absolute -right-1 top-32 w-1 h-20 rounded-r-md bg-neutral-800" />

                {/* Screen */}
                <div
                  className={cn(
                    "relative rounded-[2.25rem] overflow-hidden h-[560px] flex flex-col",
                    activeTheme.bg
                  )}
                >
                  {/* Dynamic island */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />

                  {/* Status bar */}
                  <div className={cn("flex items-center justify-between px-6 pt-2 pb-1 text-[10px] font-semibold z-10", activeTheme.textClass)}>
                    <span>9:41</span>
                    <div className="flex items-center gap-1 opacity-80">
                      <SignalHigh className="h-3 w-3" />
                      <Wifi className="h-3 w-3" />
                      <BatteryFull className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto px-5 pt-8 pb-6 scrollbar-hide">
                    {/* Profile */}
                    <div className="flex flex-col items-center text-center mb-5">
                      {showAvatar && (
                        <div className="relative mb-3">
                          <div className={cn("absolute inset-0 rounded-full blur-md opacity-50", activeTheme.bg)} />
                          <img
                            src={profileData.avatar}
                            alt={profileData.name}
                            className="relative w-20 h-20 rounded-full border-2 border-white/30 bg-white/10"
                          />
                        </div>
                      )}
                      <div className={cn("flex items-center gap-1 font-bold text-base", activeTheme.textClass)}>
                        @{profileData.bioUrl.split("/").pop()}
                        {showVerified && <BadgeCheck className="h-4 w-4 fill-blue-500 text-white" />}
                      </div>
                      <p className={cn("text-xs mt-1.5 whitespace-pre-line leading-relaxed", activeTheme.subTextClass)}>
                        {profileData.bio}
                      </p>
                    </div>

                    {/* Social icons */}
                    {connectedSocials.length > 0 && (
                      <div className="flex justify-center gap-3 mb-5">
                        {connectedSocials.map((social, i) => (
                          <button
                            key={i}
                            className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center transition-all",
                              activeTheme.buttonClass,
                              animations && "hover:scale-110"
                            )}
                          >
                            <social.icon className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    <div className="space-y-2.5">
                      {enabledLinks.map((link, idx) => {
                        const LinkIco = LINK_ICONS[link.icon] || Link2;
                        return (
                          <button
                            key={link.id}
                            className={cn(
                              "w-full py-3.5 px-4 text-sm font-semibold transition-all flex items-center gap-3 group",
                              roundedButtons ? "rounded-2xl" : "rounded-md",
                              activeTheme.buttonClass,
                              animations && "hover:scale-[1.02] active:scale-[0.98]",
                              link.highlight && "ring-2 ring-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                            )}
                            style={animations ? { animationDelay: `${idx * 50}ms` } : undefined}
                          >
                            <LinkIco className="h-4 w-4 flex-shrink-0 opacity-90" />
                            <span className="flex-1 text-center truncate">{link.title}</span>
                            <ArrowUpRight className={cn("h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity", animations && "-translate-x-1 group-hover:translate-x-0")} />
                          </button>
                        );
                      })}
                      {enabledLinks.length === 0 && (
                        <div className={cn("flex flex-col items-center justify-center text-center py-10 gap-2", activeTheme.subTextClass)}>
                          <Sparkles className="h-5 w-5 opacity-70" />
                          <p className="text-xs">Add links to see them here</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className={cn("flex items-center justify-center gap-1 mt-8 text-[10px]", activeTheme.subTextClass)}>
                      <Heart className="h-3 w-3" />
                      <span>Built with SMMSAAS</span>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center pb-2">
                    <div className={cn("w-24 h-1 rounded-full", theme === "minimal" || theme === "rose" ? "bg-neutral-400" : "bg-white/40")} />
                  </div>
                </div>
              </div>

              {/* URL chip under phone */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="truncate">{profileData.bioUrl}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkInBioBuilder;
