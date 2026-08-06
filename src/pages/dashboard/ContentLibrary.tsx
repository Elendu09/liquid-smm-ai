import { useState, useMemo } from "react";
import { useGuest } from "@/hooks/useGuest";
import { EmptyState } from "@/components/shared/EmptyState";
import { 
  FileText, 
  Image, 
  Video, 
  Hash, 
  Search, 
  Plus, 
  Grid3X3, 
  List, 
  Filter,
  Folder,
  MoreHorizontal,
  Download,
  Trash2,
  Copy,
  Star
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MediaAsset {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  thumbnail: string;
  size: string;
  dimensions?: string;
  createdAt: Date;
  favorite: boolean;
}

interface CaptionTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  platforms: string[];
}

interface HashtagSet {
  id: string;
  name: string;
  hashtags: string[];
  category: string;
  uses: number;
}

const mockAssets: MediaAsset[] = [
  { id: "1", name: "Product Launch.jpg", type: "image", url: "#", thumbnail: "https://picsum.photos/seed/1/400/400", size: "2.4 MB", dimensions: "1080x1080", createdAt: new Date(), favorite: true },
  { id: "2", name: "Team Photo.png", type: "image", url: "#", thumbnail: "https://picsum.photos/seed/2/400/400", size: "3.1 MB", dimensions: "1920x1080", createdAt: new Date(), favorite: false },
  { id: "3", name: "Promo Video.mp4", type: "video", url: "#", thumbnail: "https://picsum.photos/seed/3/400/400", size: "45 MB", createdAt: new Date(), favorite: true },
  { id: "4", name: "Behind the Scenes.jpg", type: "image", url: "#", thumbnail: "https://picsum.photos/seed/4/400/400", size: "1.8 MB", dimensions: "1080x1350", createdAt: new Date(), favorite: false },
  { id: "5", name: "Tutorial Clip.mp4", type: "video", url: "#", thumbnail: "https://picsum.photos/seed/5/400/400", size: "28 MB", createdAt: new Date(), favorite: false },
  { id: "6", name: "Quote Graphic.png", type: "image", url: "#", thumbnail: "https://picsum.photos/seed/6/400/400", size: "890 KB", dimensions: "1080x1080", createdAt: new Date(), favorite: true },
];

const mockCaptionTemplates: CaptionTemplate[] = [
  { id: "1", name: "Product Launch", content: "🚀 Introducing [PRODUCT]! We've been working hard to bring you something special...", category: "Announcements", platforms: ["instagram", "facebook", "linkedin"] },
  { id: "2", name: "Behind the Scenes", content: "📸 Take a peek behind the curtain! Here's what goes into making [TOPIC]...", category: "Engagement", platforms: ["instagram", "tiktok"] },
  { id: "3", name: "Tips & Tricks", content: "💡 Pro tip: [TIP]. Save this for later! 👇", category: "Educational", platforms: ["instagram", "twitter", "linkedin"] },
  { id: "4", name: "Question Post", content: "🤔 We want to hear from you! What's your [QUESTION]? Drop your answer below 👇", category: "Engagement", platforms: ["instagram", "facebook", "twitter"] },
];

const mockHashtagSets: HashtagSet[] = [
  { id: "1", name: "Marketing", hashtags: ["#marketing", "#digitalmarketing", "#socialmedia", "#branding", "#growth"], category: "Business", uses: 45 },
  { id: "2", name: "Lifestyle", hashtags: ["#lifestyle", "#life", "#instagood", "#photooftheday", "#happy"], category: "General", uses: 128 },
  { id: "3", name: "Tech", hashtags: ["#tech", "#technology", "#innovation", "#startup", "#entrepreneur"], category: "Business", uses: 67 },
  { id: "4", name: "Motivation", hashtags: ["#motivation", "#inspiration", "#success", "#mindset", "#goals"], category: "Personal", uses: 89 },
];

export default function ContentLibraryPage() {
  const { isGuest } = useGuest();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const assets = useMemo(() => (isGuest ? mockAssets : []), [isGuest]);
  const captionTemplates = useMemo(() => (isGuest ? mockCaptionTemplates : []), [isGuest]);
  const hashtagSets = useMemo(() => (isGuest ? mockHashtagSets : []), [isGuest]);

  return (
    <div className="relative isolate p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Ambient backdrop — gives the page the same liquid feel as the rest of the app */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden"
      >
        <span
          className="liquid-orb absolute -top-24 -left-24 h-72 w-72"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 30%, hsl(217 91% 60% / 0.25) 0%, hsl(217 91% 60% / 0) 70%)",
          }}
        />
        <span
          className="liquid-orb absolute -top-16 right-0 h-80 w-80"
          style={{
            animationDelay: "5s",
            background:
              "radial-gradient(60% 80% at 50% 30%, hsl(270 70% 60% / 0.20) 0%, hsl(270 70% 60% / 0) 70%)",
          }}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-['Instrument_Serif'] font-normal tracking-tight leading-[0.95] text-4xl sm:text-5xl flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/25 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08),0_8px_24px_-12px_hsl(var(--primary)/0.5)]">
              <Folder className="h-5 w-5" />
            </span>
            Content Library<span className="italic text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Manage your media, captions, and hashtag collections
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload Asset
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search assets..."
            className="pl-10 liquid-flat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="liquid-press">
            <Filter className="h-4 w-4" />
          </Button>
          <div
            role="tablist"
            aria-label="View mode"
            className="relative inline-flex liquid-pill p-1"
          >
            <span
              aria-hidden
              className="liquid-pill__indicator"
              style={{
                left: viewMode === "grid" ? "4px" : "calc(50% + 0px)",
                width: "calc(50% - 4px)",
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-pressed={viewMode === "grid"}
              className={cn(
                "relative z-10 h-9 w-9 rounded-full transition-colors duration-300 active:scale-90",
                viewMode === "grid"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-pressed={viewMode === "list"}
              className={cn(
                "relative z-10 h-9 w-9 rounded-full transition-colors duration-300 active:scale-90",
                viewMode === "list"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="media" className="space-y-6">
        <TabsList className="relative inline-flex h-11 liquid-pill">
          <TabsTrigger value="media" className="gap-2">
            <Image className="h-4 w-4" />
            Media Assets
          </TabsTrigger>
          <TabsTrigger value="captions" className="gap-2">
            <FileText className="h-4 w-4" />
            Caption Templates
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="gap-2">
            <Hash className="h-4 w-4" />
            Hashtag Sets
          </TabsTrigger>
        </TabsList>

        {/* Media Assets Tab */}
        <TabsContent value="media" forceMount>
          {assets.length === 0 ? (
            <EmptyState
              variant="upload-asset"
              icon={Image}
              title="No media assets yet"
              description="Upload your first image or video to start building your library."
              ctaLabel="Upload asset"
              ctaHref="/dashboard/library/assets"
            />
          ) : (
            <div
              className={cn(
                "grid gap-4 liquid-stagger",
                viewMode === "grid"
                  ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1",
              )}
            >
              {assets.map((asset) => (
                <Card
                  key={asset.id}
                  className={cn("overflow-hidden group", viewMode === "list" && "flex")}
                >
                  <div
                    className={cn(
                      "relative bg-muted overflow-hidden",
                      viewMode === "grid" ? "aspect-square" : "w-28 h-28 shrink-0",
                    )}
                  >
                    <img
                      src={asset.thumbnail}
                      alt={asset.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                    {asset.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Video className="h-8 w-8 text-white" />
                      </div>
                    )}
                    {asset.favorite && (
                      <div className="absolute top-2 left-2 drop-shadow">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    )}
                    {/* Hover overlay — softened to use the new glass sheen */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9 translate-y-2 rounded-full transition-all duration-300 group-hover:translate-y-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9 translate-y-2 rounded-full transition-all duration-300 delay-75 group-hover:translate-y-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent
                    className={cn(
                      "p-3",
                      viewMode === "list" && "flex-1 flex items-center justify-between",
                    )}
                  >
                    <div className={viewMode === "list" ? "flex-1" : ""}>
                      <p className="font-medium text-sm truncate">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.size} {asset.dimensions && `• ${asset.dimensions}`}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-full"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Star className="mr-2 h-4 w-4" />
                          {asset.favorite ? "Unfavorite" : "Favorite"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Caption Templates Tab */}
        <TabsContent value="captions" forceMount>
          {captionTemplates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No caption templates yet"
              description="Create reusable caption templates to speed up publishing across platforms."
              ctaLabel="Add caption template"
              ctaHref="/dashboard/create/captions"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 liquid-stagger">
              {captionTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {template.category}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {template.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {template.platforms.slice(0, 3).map((platform) => (
                          <Badge
                            key={platform}
                            variant="outline"
                            className="text-xs"
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>
                      <Button size="sm" variant="outline" className="liquid-press">
                        <Copy className="mr-2 h-3 w-3" />
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {captionTemplates.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" className="liquid-press">
                <Plus className="mr-2 h-4 w-4" />
                Add Caption Template
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Hashtag Sets Tab */}
        <TabsContent value="hashtags" forceMount>
          {hashtagSets.length === 0 ? (
            <EmptyState
              icon={Hash}
              title="No hashtag sets yet"
              description="Group your best-performing hashtags into reusable sets for quick copy-paste."
              ctaLabel="Create hashtag set"
              ctaHref="/dashboard/create/hashtags"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 liquid-stagger">
              {hashtagSets.map((set) => (
                <Card key={set.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          {set.name}
                        </CardTitle>
                        <CardDescription>
                          {set.hashtags.length} hashtags • Used {set.uses} times
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{set.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {set.hashtags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs font-normal transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 liquid-press"
                      >
                        <Copy className="mr-2 h-3 w-3" />
                        Copy All
                      </Button>
                      <Button size="sm" variant="ghost" className="liquid-press">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {hashtagSets.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" className="liquid-press">
                <Plus className="mr-2 h-4 w-4" />
                Create Hashtag Set
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
