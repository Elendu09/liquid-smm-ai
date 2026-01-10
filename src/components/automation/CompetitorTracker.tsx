import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Plus,
  Trash2,
  RefreshCw,
  BarChart3,
  Calendar,
  Hash,
  Bell,
  Target,
  Crown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

const CompetitorTracker = () => {
  const [newCompetitor, setNewCompetitor] = useState("");
  const [competitors, setCompetitors] = useState([
    {
      id: 1,
      username: "@techinfluencer",
      platform: "Instagram",
      followers: 524000,
      followersChange: 2.4,
      engagement: 4.8,
      engagementChange: 0.3,
      posts: 1247,
      avgLikes: 12500,
      avgComments: 342,
      postingFreq: "2x daily",
      topHashtags: ["#tech", "#innovation", "#startup"],
      lastPost: "2 hours ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tech"
    },
    {
      id: 2,
      username: "@digitalmarketer",
      platform: "Instagram",
      followers: 312000,
      followersChange: -0.8,
      engagement: 3.2,
      engagementChange: -0.5,
      posts: 892,
      avgLikes: 8400,
      avgComments: 156,
      postingFreq: "1x daily",
      topHashtags: ["#marketing", "#growth", "#business"],
      lastPost: "5 hours ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=digital"
    },
    {
      id: 3,
      username: "@creativestudio",
      platform: "Instagram",
      followers: 189000,
      followersChange: 5.2,
      engagement: 6.1,
      engagementChange: 1.2,
      posts: 634,
      avgLikes: 15200,
      avgComments: 487,
      postingFreq: "3x weekly",
      topHashtags: ["#design", "#creative", "#art"],
      lastPost: "1 day ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=creative"
    }
  ]);

  const yourStats = {
    followers: 145000,
    engagement: 5.4,
    avgLikes: 9800,
    avgComments: 234,
    postingFreq: "1x daily"
  };

  const addCompetitor = () => {
    if (newCompetitor.trim()) {
      setCompetitors([...competitors, {
        id: Date.now(),
        username: newCompetitor,
        platform: "Instagram",
        followers: Math.floor(Math.random() * 500000),
        followersChange: Number((Math.random() * 10 - 5).toFixed(1)),
        engagement: Number((Math.random() * 8).toFixed(1)),
        engagementChange: Number((Math.random() * 2 - 1).toFixed(1)),
        posts: Math.floor(Math.random() * 1000),
        avgLikes: Math.floor(Math.random() * 20000),
        avgComments: Math.floor(Math.random() * 500),
        postingFreq: "1x daily",
        topHashtags: ["#trending", "#viral", "#fyp"],
        lastPost: "Just now",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newCompetitor}`
      }]);
      setNewCompetitor("");
    }
  };

  const removeCompetitor = (id: number) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Competitor Tracker</h1>
          <p className="text-muted-foreground">Monitor and analyze your competitors' performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            placeholder="@username" 
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            className="w-48"
          />
          <Button onClick={addCompetitor} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Competitor
          </Button>
        </div>
      </div>

      {/* Your Stats Overview */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Your Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{(yourStats.followers / 1000).toFixed(0)}K</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{yourStats.engagement}%</p>
              <p className="text-xs text-muted-foreground">Engagement</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{(yourStats.avgLikes / 1000).toFixed(1)}K</p>
              <p className="text-xs text-muted-foreground">Avg Likes</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{yourStats.avgComments}</p>
              <p className="text-xs text-muted-foreground">Avg Comments</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{yourStats.postingFreq}</p>
              <p className="text-xs text-muted-foreground">Post Frequency</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Competitor Cards */}
          <div className="grid gap-4">
            {competitors.map((competitor) => (
              <Card key={competitor.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Avatar & Basic Info */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <img 
                        src={competitor.avatar} 
                        alt={competitor.username}
                        className="w-12 h-12 rounded-full bg-muted"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{competitor.username}</p>
                        <Badge variant="outline" className="text-xs">{competitor.platform}</Badge>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {(competitor.followers / 1000).toFixed(0)}K
                          </span>
                          {Number(competitor.followersChange) > 0 ? (
                            <ArrowUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Followers</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{competitor.engagement}%</span>
                          {Number(competitor.engagementChange) > 0 ? (
                            <ArrowUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {(competitor.avgLikes / 1000).toFixed(1)}K
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Avg Likes</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{competitor.avgComments}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Avg Comments</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{competitor.postingFreq}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Frequency</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive"
                        onClick={() => removeCompetitor(competitor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Top Hashtags */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      {competitor.topHashtags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      <span className="text-xs text-muted-foreground ml-auto">
                        Last post: {competitor.lastPost}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Side-by-Side Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Followers Comparison */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Followers</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-32 text-sm text-muted-foreground">You</span>
                      <Progress value={(yourStats.followers / 524000) * 100} className="flex-1" />
                      <span className="w-16 text-sm text-right">{(yourStats.followers / 1000).toFixed(0)}K</span>
                    </div>
                    {competitors.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="w-32 text-sm text-muted-foreground truncate">{c.username}</span>
                        <Progress value={(c.followers / 524000) * 100} className="flex-1" />
                        <span className="w-16 text-sm text-right">{(c.followers / 1000).toFixed(0)}K</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engagement Comparison */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Engagement Rate</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-32 text-sm text-muted-foreground">You</span>
                      <Progress value={(yourStats.engagement / 8) * 100} className="flex-1" />
                      <span className="w-16 text-sm text-right">{yourStats.engagement}%</span>
                    </div>
                    {competitors.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="w-32 text-sm text-muted-foreground truncate">{c.username}</span>
                        <Progress value={(Number(c.engagement) / 8) * 100} className="flex-1" />
                        <span className="w-16 text-sm text-right">{c.engagement}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {competitors.map((c) => (
                  <Card key={c.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <p className="font-semibold text-foreground mb-3">{c.username}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Posts</span>
                          <span className="text-foreground">{c.posts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Post Frequency</span>
                          <span className="text-foreground">{c.postingFreq}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Best Time</span>
                          <span className="text-foreground">6PM - 9PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Content Mix</span>
                          <span className="text-foreground">60% Reels</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Competitor Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { text: "@techinfluencer posted a new Reel", time: "2 hours ago", type: "post" },
                  { text: "@creativestudio gained 5K followers today", time: "5 hours ago", type: "growth" },
                  { text: "@digitalmarketer engagement dropped by 2%", time: "1 day ago", type: "alert" }
                ].map((alert, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.type === 'growth' ? 'bg-green-500' : 
                        alert.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-foreground">{alert.text}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                Configure Alerts
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitorTracker;
