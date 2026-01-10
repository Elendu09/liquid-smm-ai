import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  ExternalLink,
  Palette,
  BarChart3,
  Settings,
  Image,
  Type,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Github,
  Mail,
  Copy,
  Check,
  Sparkles
} from "lucide-react";

const LinkInBioBuilder = () => {
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState([
    { id: 1, title: "Shop My Favorites", url: "https://shop.example.com", clicks: 1247, enabled: true, icon: "shopping" },
    { id: 2, title: "Latest YouTube Video", url: "https://youtube.com/watch", clicks: 892, enabled: true, icon: "youtube" },
    { id: 3, title: "Join My Newsletter", url: "https://newsletter.example.com", clicks: 534, enabled: true, icon: "mail" },
    { id: 4, title: "Book a Consultation", url: "https://calendly.com/example", clicks: 321, enabled: true, icon: "calendar" },
    { id: 5, title: "My Portfolio", url: "https://portfolio.example.com", clicks: 456, enabled: false, icon: "globe" }
  ]);

  const [theme, setTheme] = useState("gradient");
  const [profileData, setProfileData] = useState({
    name: "Sarah Johnson",
    bio: "Digital Creator | Marketing Expert | Helping brands grow 🚀",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bioUrl: "bio.homeofsmm.com/sarah"
  });

  const themes = [
    { id: "gradient", name: "Gradient", colors: "from-purple-600 to-pink-600" },
    { id: "dark", name: "Dark", colors: "bg-gray-900" },
    { id: "light", name: "Light", colors: "bg-white" },
    { id: "neon", name: "Neon", colors: "from-cyan-500 to-blue-600" },
    { id: "sunset", name: "Sunset", colors: "from-orange-500 to-red-600" },
    { id: "nature", name: "Nature", colors: "from-green-500 to-emerald-600" }
  ];

  const socialLinks = [
    { icon: Instagram, name: "Instagram", url: "@sarahjohnson", connected: true },
    { icon: Twitter, name: "Twitter", url: "@sarahj", connected: true },
    { icon: Youtube, name: "YouTube", url: "SarahJohnson", connected: true },
    { icon: Facebook, name: "Facebook", url: "", connected: false },
    { icon: Linkedin, name: "LinkedIn", url: "", connected: false },
    { icon: Github, name: "GitHub", url: "", connected: false }
  ];

  const addLink = () => {
    setLinks([...links, {
      id: Date.now(),
      title: "New Link",
      url: "https://",
      clicks: 0,
      enabled: true,
      icon: "link"
    }]);
  };

  const removeLink = (id: number) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const toggleLink = (id: number) => {
    setLinks(links.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l));
  };

  const copyBioUrl = () => {
    navigator.clipboard.writeText(`https://${profileData.bioUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Link in Bio Builder</h1>
          <p className="text-muted-foreground">Create your personalized bio link page</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{profileData.bioUrl}</span>
            <Button size="sm" variant="ghost" onClick={copyBioUrl}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalClicks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Clicks</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{links.filter(l => l.enabled).length}</p>
            <p className="text-xs text-muted-foreground">Active Links</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">4.2%</p>
            <p className="text-xs text-muted-foreground">Click Rate</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">12.5K</p>
            <p className="text-xs text-muted-foreground">Page Views</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Editor Column */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="links" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="links" className="space-y-4">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Your Links</CardTitle>
                    <Button onClick={addLink} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Link
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {links.map((link) => (
                    <div 
                      key={link.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        link.enabled ? 'bg-muted/30 border-border' : 'bg-muted/10 border-border/50 opacity-60'
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex-1 space-y-2">
                        <Input 
                          value={link.title}
                          onChange={(e) => setLinks(links.map(l => 
                            l.id === link.id ? { ...l, title: e.target.value } : l
                          ))}
                          className="font-medium"
                          placeholder="Link title"
                        />
                        <Input 
                          value={link.url}
                          onChange={(e) => setLinks(links.map(l => 
                            l.id === link.id ? { ...l, url: e.target.value } : l
                          ))}
                          className="text-sm"
                          placeholder="https://"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {link.clicks} clicks
                        </Badge>
                        <Switch 
                          checked={link.enabled}
                          onCheckedChange={() => toggleLink(link.id)}
                        />
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-destructive"
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
                  <CardTitle className="text-lg">Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={profileData.avatar} 
                      alt="Profile"
                      className="w-20 h-20 rounded-full bg-muted"
                    />
                    <Button variant="outline">Change Avatar</Button>
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
                    <Input 
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Custom URL</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">bio.homeofsmm.com/</span>
                      <Input 
                        value={profileData.bioUrl.split('/').pop()}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {socialLinks.map((social, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <social.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="w-24 text-sm text-foreground">{social.name}</span>
                      <Input 
                        value={social.url}
                        placeholder={`Your ${social.name} handle`}
                        className="flex-1"
                      />
                      <Badge variant={social.connected ? "default" : "outline"}>
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
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Choose Theme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === t.id 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-full h-16 rounded-md bg-gradient-to-br ${t.colors} mb-2`} />
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Customization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Rounded Buttons</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Animations</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Show Avatar</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Link Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {links.sort((a, b) => b.clicks - a.clicks).map((link) => (
                      <div key={link.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{link.title}</span>
                          <span className="text-sm text-muted-foreground">{link.clicks} clicks</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(link.clicks / Math.max(...links.map(l => l.clicks))) * 100}%` }}
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

        {/* Preview Column */}
        <div className="lg:col-span-1">
          <Card className="glass-card sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`rounded-2xl overflow-hidden bg-gradient-to-br ${
                themes.find(t => t.id === theme)?.colors || 'from-purple-600 to-pink-600'
              } p-4`}>
                <div className="flex flex-col items-center text-center mb-4">
                  <img 
                    src={profileData.avatar}
                    alt={profileData.name}
                    className="w-16 h-16 rounded-full border-2 border-white/20 mb-2"
                  />
                  <h3 className="font-bold text-white">{profileData.name}</h3>
                  <p className="text-sm text-white/80">{profileData.bio}</p>
                </div>
                <div className="space-y-2">
                  {links.filter(l => l.enabled).map((link) => (
                    <button
                      key={link.id}
                      className="w-full py-3 px-4 bg-white/20 backdrop-blur-sm rounded-xl text-white text-sm font-medium hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Link className="h-4 w-4" />
                      {link.title}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center gap-3 mt-4">
                  {socialLinks.filter(s => s.connected).map((social, i) => (
                    <social.icon key={i} className="h-5 w-5 text-white/80 hover:text-white cursor-pointer transition-colors" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LinkInBioBuilder;
