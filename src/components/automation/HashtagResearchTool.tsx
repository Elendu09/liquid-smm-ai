import { useState } from "react";
import { Hash, TrendingUp, Copy, Check, Search, Flame, Target, Users, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHashtags } from "@/hooks/useSkyrank";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Static trending data (enhanced with API results)
const staticTrendingHashtags = [
  { tag: "#socialmedia", posts: "45.2M", difficulty: "high", growth: "+12%", category: "General" },
  { tag: "#marketing", posts: "38.7M", difficulty: "high", growth: "+8%", category: "Business" },
  { tag: "#growthhacking", posts: "2.1M", difficulty: "medium", growth: "+24%", category: "Strategy" },
  { tag: "#contentcreator", posts: "18.4M", difficulty: "medium", growth: "+15%", category: "Creator" },
  { tag: "#digitalmarketing", posts: "28.9M", difficulty: "high", growth: "+6%", category: "Business" },
  { tag: "#smm", posts: "890K", difficulty: "low", growth: "+32%", category: "Strategy" },
  { tag: "#instagramgrowth", posts: "5.6M", difficulty: "medium", growth: "+18%", category: "Growth" },
  { tag: "#viralcontent", posts: "3.2M", difficulty: "medium", growth: "+45%", category: "Content" },
  { tag: "#influencermarketing", posts: "4.8M", difficulty: "medium", growth: "+21%", category: "Business" },
  { tag: "#automation", posts: "1.2M", difficulty: "low", growth: "+38%", category: "Tech" },
];

const suggestedSets = [
  {
    name: "Growth Pack",
    tags: ["#growth", "#success", "#motivation", "#entrepreneur", "#business"],
  },
  {
    name: "Content Creator",
    tags: ["#contentcreator", "#creator", "#creatorlife", "#content", "#creative"],
  },
  {
    name: "Marketing Pro",
    tags: ["#marketing", "#digitalmarketing", "#socialmedia", "#branding", "#strategy"],
  },
];

const platformOptions = [
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "twitter", name: "Twitter" },
  { id: "youtube", name: "YouTube" },
  { id: "linkedin", name: "LinkedIn" },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "low": return "text-brand-green bg-brand-green/10 border-brand-green/30";
    case "medium": return "text-brand-orange bg-brand-orange/10 border-brand-orange/30";
    case "high": return "text-destructive bg-destructive/10 border-destructive/30";
    default: return "text-muted-foreground bg-muted";
  }
};

interface HashtagResearchToolProps {
  defaultPlatformId?: string;
}

type TrendingRow = {
  tag: string;
  posts: string;
  difficulty: string;
  growth: string;
  category: string;
  isAI?: boolean;
};

// Deterministic pseudo-random from tag string
const hashCode = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
};

const buildAiRow = (rawTag: string, category: string): TrendingRow => {
  const tag = rawTag.startsWith("#") ? rawTag : `#${rawTag}`;
  const seed = hashCode(tag);
  const postsNum = (seed % 900) + 100;
  const unit = seed % 3 === 0 ? "M" : "K";
  const difficulties = ["low", "medium", "high"];
  const difficulty = difficulties[seed % 3];
  const growth = `+${(seed % 45) + 5}%`;
  return {
    tag,
    posts: `${postsNum}${unit}`,
    difficulty,
    growth,
    category: category || "AI",
    isAI: true,
  };
};

export const HashtagResearchTool = ({ defaultPlatformId }: HashtagResearchToolProps = {}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState(defaultPlatformId || "instagram");
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [copiedSet, setCopiedSet] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiRows, setAiRows] = useState<TrendingRow[]>([]);
  const [lastTopic, setLastTopic] = useState<string>("");

  const { isLoading, generate } = useHashtags();

  const handleAIGenerate = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Please enter a topic to search", variant: "destructive" });
      return;
    }
    const result = await generate(searchQuery, selectedPlatform);
    if (result) {
      const category = searchQuery.trim().slice(0, 20);
      const rows = result.map((t) => buildAiRow(t, category));
      // merge with existing AI rows, dedupe by tag
      setAiRows((prev) => {
        const map = new Map<string, TrendingRow>();
        [...rows, ...prev].forEach((r) => map.set(r.tag.toLowerCase(), r));
        return Array.from(map.values());
      });
      setLastTopic(searchQuery);
      toast({ title: "AI hashtags added to Trending", description: `${result.length} new hashtags` });
    }
  };

  const clearAiRows = () => {
    setAiRows([]);
    setSelectedTags((prev) => prev.filter((t) => !aiRows.some((r) => r.tag === t)));
  };

  const combinedRows: TrendingRow[] = [...aiRows, ...staticTrendingHashtags];
  const filteredHashtags = combinedRows.filter((h) =>
    h.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectAllVisible = () => {
    setSelectedTags(Array.from(new Set([...selectedTags, ...filteredHashtags.map((h) => h.tag)])));
  };

  const clearSelection = () => setSelectedTags([]);

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    toast({ title: `Copied ${tag}` });
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const copySet = (name: string, tags: string[]) => {
    navigator.clipboard.writeText(tags.join(" "));
    setCopiedSet(name);
    toast({ title: `Copied ${name} hashtag set` });
    setTimeout(() => setCopiedSet(null), 2000);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const copySelected = () => {
    navigator.clipboard.writeText(selectedTags.join(" "));
    setCopiedSet("selected");
    toast({ title: `Copied ${selectedTags.length} hashtags` });
    setTimeout(() => setCopiedSet(null), 2000);
  };

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-brand-purple/20 glow-blue">
            <Hash className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Hashtag Research Tool</h3>
            <p className="text-sm text-muted-foreground">Find trending hashtags with AI-powered suggestions</p>
          </div>
        </div>
        {selectedTags.length > 0 && (
          <Button onClick={copySelected} className="bg-primary hover:bg-primary/90">
            {copiedSet === "selected" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Copy {selectedTags.length} Tags
          </Button>
        )}
      </div>

      {/* Search with AI Generate */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter topic to find hashtags (e.g., fitness, travel, tech)..."
            className="pl-10 bg-secondary/50 border-border"
            onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
          />
        </div>
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {platformOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAIGenerate} disabled={isLoading || !searchQuery.trim()}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate
            </>
          )}
        </Button>
      </div>

      {/* AI Generated Hashtags */}
      {isLoading && (
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Generating AI hashtags...</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-24 rounded-full" />
            ))}
          </div>
        </div>
      )}

      {aiGeneratedTags.length > 0 && !isLoading && (
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in-scale">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Generated for "{searchQuery}"</span>
              <Badge variant="secondary" className="text-xs">AI Powered</Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(aiGeneratedTags.join(" "));
                toast({ title: "All AI hashtags copied!" });
              }}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiGeneratedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer transition-all"
                onClick={() => copyTag(tag.startsWith('#') ? tag : `#${tag}`)}
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick Sets */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Quick Hashtag Sets
        </h4>
        <div className="grid md:grid-cols-3 gap-3">
          {suggestedSets.map((set) => (
            <div
              key={set.name}
              className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{set.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copySet(set.name, set.tags)}
                >
                  {copiedSet === set.name ? (
                    <Check className="h-3 w-3 text-brand-green" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {set.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Hashtags Table */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-brand-orange" />
          Trending Hashtags
        </h4>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">HASHTAG</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">POSTS</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">DIFFICULTY</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">GROWTH</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">CATEGORY</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredHashtags.map((hashtag) => (
                  <tr
                    key={hashtag.tag}
                    className={`border-t border-border hover:bg-secondary/30 transition-colors cursor-pointer ${
                      selectedTags.includes(hashtag.tag) ? "bg-primary/5" : ""
                    }`}
                    onClick={() => toggleTag(hashtag.tag)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(hashtag.tag)}
                          onChange={() => {}}
                          className="rounded border-border"
                        />
                        <span className="font-medium text-primary">{hashtag.tag}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{hashtag.posts}</td>
                    <td className="p-3">
                      <Badge className={`text-xs border ${getDifficultyColor(hashtag.difficulty)}`}>
                        {hashtag.difficulty}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-brand-green font-medium flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {hashtag.growth}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs">{hashtag.category}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyTag(hashtag.tag);
                        }}
                      >
                        {copiedTag === hashtag.tag ? (
                          <Check className="h-4 w-4 text-brand-green" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Hash, label: "Total Hashtags", value: "10K+", color: "text-primary" },
          { icon: Flame, label: "Trending Now", value: "847", color: "text-brand-orange" },
          { icon: Target, label: "Low Competition", value: "234", color: "text-brand-green" },
          { icon: Users, label: "Avg. Reach", value: "50K", color: "text-brand-purple" },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-lg bg-secondary/50 text-center">
            <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
