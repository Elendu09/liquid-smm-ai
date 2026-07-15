import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User,
  Bell,
  Link2,
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
} from "lucide-react";

export function SettingsPanels() {
  const [activeTab, setActiveTab] = useState("account");

  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    timezone: "America/New_York",
    language: "en",
  });

  const [notifications, setNotifications] = useState({
    emailDigest: true,
    pushNotifications: true,
    weeklyReport: true,
    newFollowers: false,
    engagementAlerts: true,
    productUpdates: true,
    marketingEmails: false,
    smsAlerts: false,
  });

  const [connectedAccounts] = useState([
    { platform: "Instagram", username: "@johndoe", connected: true, followers: "12.5K", icon: Instagram },
    { platform: "Twitter", username: "@johndoe", connected: true, followers: "8.2K", icon: Twitter },
    { platform: "Facebook", username: "John Doe", connected: false, followers: null, icon: Facebook },
    { platform: "YouTube", username: null, connected: false, followers: null, icon: Youtube },
    { platform: "LinkedIn", username: "john-doe", connected: true, followers: "3.1K", icon: Linkedin },
  ]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1">
        <TabsTrigger value="account" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Account</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="connected" className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          <span className="hidden sm:inline">Connected</span>
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span className="hidden sm:inline">Billing</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Security</span>
        </TabsTrigger>
      </TabsList>

      {/* Account */}
      <TabsContent value="account" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details and public profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-2xl">JD</AvatarFallback>
                </Avatar>
                <Button size="icon" className="absolute bottom-0 right-0 rounded-full w-8 h-8">
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <h3 className="font-semibold">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge variant="secondary" className="mt-2">
                  <Crown className="w-3 h-3 mr-1" />
                  Professional Plan
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="pl-10" />
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
          <CardFooter>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible and destructive actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
              </div>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notifications */}
      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>Manage your email notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { key: "emailDigest", label: "Daily Email Digest", description: "Receive a daily summary of your account activity" },
              { key: "weeklyReport", label: "Weekly Analytics Report", description: "Get weekly performance insights and recommendations" },
              { key: "engagementAlerts", label: "Engagement Alerts", description: "Notify when posts receive high engagement" },
              { key: "productUpdates", label: "Product Updates", description: "Learn about new features and improvements" },
              { key: "marketingEmails", label: "Marketing Emails", description: "Receive tips, tutorials, and promotional content" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={item.key} className="font-medium">{item.label}</Label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  id={item.key}
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Push Notifications</CardTitle>
            <CardDescription>Manage browser and mobile push notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { key: "pushNotifications", label: "Push Notifications", description: "Receive push notifications in your browser" },
              { key: "newFollowers", label: "New Follower Alerts", description: "Get notified when you gain new followers" },
              { key: "smsAlerts", label: "SMS Alerts", description: "Receive important alerts via SMS" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={item.key} className="font-medium">{item.label}</Label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  id={item.key}
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button>Save Preferences</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Connected */}
      <TabsContent value="connected" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Connected Social Accounts</CardTitle>
            <CardDescription>Manage your connected social media accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectedAccounts.map((account, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${account.connected ? "bg-primary/10" : "bg-muted"}`}>
                    <account.icon className={`w-6 h-6 ${account.connected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{account.platform}</h4>
                      {account.connected && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                          <Check className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    {account.connected ? (
                      <p className="text-sm text-muted-foreground">{account.username} • {account.followers} followers</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Button variant={account.connected ? "outline" : "default"} size="sm">
                  {account.connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Billing */}
      <TabsContent value="billing" className="space-y-6">
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  Professional Plan
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
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/pricing">Change Plan</Link>
              </Button>
              <Button variant="ghost" className="text-destructive hover:text-destructive">Cancel Subscription</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
            <Button variant="outline" className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View and download past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: "Jan 15, 2024", amount: "$39.00", status: "Paid" },
                { date: "Dec 15, 2023", amount: "$39.00", status: "Paid" },
                { date: "Nov 15, 2023", amount: "$39.00", status: "Paid" },
              ].map((invoice, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{invoice.date}</p>
                    <p className="text-sm text-muted-foreground">Professional Plan</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{invoice.amount}</span>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">{invoice.status}</Badge>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security */}
      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Update Password</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>Add an extra layer of security to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Shield className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">Authenticator App</h4>
                  <p className="text-sm text-muted-foreground">Use an authenticator app to generate one-time codes</p>
                </div>
              </div>
              <Button variant="outline">Enable</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage devices where you're logged in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { device: "MacBook Pro", location: "New York, US", current: true, lastActive: "Now" },
              { device: "iPhone 14", location: "New York, US", current: false, lastActive: "2 hours ago" },
              { device: "Chrome on Windows", location: "Boston, US", current: false, lastActive: "3 days ago" },
            ].map((session, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{session.device}</h4>
                    {session.current && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{session.location} • {session.lastActive}</p>
                </div>
                {!session.current && (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Revoke</Button>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <AlertCircle className="w-4 h-4 mr-2" />
              Sign Out All Devices
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default SettingsPanels;
