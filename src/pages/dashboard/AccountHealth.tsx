import { Heart, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Shield, Zap, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAccounts } from "@/contexts/AccountContext";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { getPlatformById } from "@/config/platforms";
import { cn } from "@/lib/utils";

export default function AccountHealthPage() {
  const { accounts } = useAccounts();

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case "warning":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Disconnected</Badge>;
    }
  };

  const recommendations = [
    { icon: Zap, title: "Increase posting frequency", description: "Post at least 3 times per week on Instagram for better reach", platform: "instagram" },
    { icon: Eye, title: "Engage with followers", description: "Reply to comments within 1 hour to boost engagement", platform: "tiktok" },
    { icon: Shield, title: "Enable 2FA", description: "Secure your YouTube account with two-factor authentication", platform: "youtube" },
    { icon: TrendingUp, title: "Optimize posting times", description: "Post between 9-11 AM for maximum X engagement", platform: "twitter" },
  ];

  const overallHealth = Math.round(accounts.reduce((acc, a) => acc + a.healthScore, 0) / accounts.length);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500" />
            Account Health
          </h1>
          <p className="text-muted-foreground mt-1">Monitor and optimize your connected accounts</p>
        </div>
        <Button>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync All Accounts
        </Button>
      </div>

      {/* Overall Health Score */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative">
              <svg className="h-32 w-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="fill-none stroke-muted stroke-[8]"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className={cn("fill-none stroke-[8]", getHealthBg(overallHealth))}
                  strokeDasharray={`${(overallHealth / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-3xl font-bold", getHealthColor(overallHealth))}>
                  {overallHealth}%
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Overall Health Score</h2>
              <p className="text-muted-foreground mb-4">
                Based on {accounts.length} connected accounts across multiple platforms
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {accounts.filter((a) => a.status === "active").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    {accounts.filter((a) => a.status === "warning").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Warning</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {accounts.filter((a) => a.status === "error").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {accounts.filter((a) => a.status === "disconnected").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Disconnected</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const platform = getPlatformById(account.platformId);
            return (
              <Card key={account.id} className="overflow-hidden">
                <div className={cn("h-1.5", getHealthBg(account.healthScore))} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted p-2">
                        <PlatformIcon platformId={account.platformId} size="lg" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{account.displayName}</CardTitle>
                        <CardDescription>@{account.username}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(account.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Health Score</span>
                      <span className={cn("font-semibold", getHealthColor(account.healthScore))}>
                        {account.healthScore}%
                      </span>
                    </div>
                    <Progress value={account.healthScore} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="font-semibold">{(account.followers / 1000).toFixed(1)}K</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div>
                      <div className="font-semibold">{account.posts}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div>
                      <div className="font-semibold">{account.engagement}%</div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                    </div>
                  </div>

                  {account.status !== "active" && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        {account.status === "warning" && "Engagement is below average"}
                        {account.status === "error" && "Account sync failed"}
                        {account.status === "disconnected" && "Please reconnect"}
                      </span>
                    </div>
                  )}

                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Recommendations
          </CardTitle>
          <CardDescription>Actions to improve your account health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <rec.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{rec.title}</h4>
                    <div className="h-5 w-5">
                      <PlatformIcon platformId={rec.platform} size="md" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
                <Button size="sm" variant="outline">Apply</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
