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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Folder className="h-8 w-8 text-primary" />
            Content Library
          </h1>
          <p className="text-muted-foreground mt-1">Manage your media, captions, and hashtag collections</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload Asset
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="media" className="space-y-6">
        <TabsList>
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
        <TabsContent value="media">
          {assets.length === 0 ? (
            <EmptyState
              icon={Image}
              title="No media assets yet"
              description="Upload your first image or video to start building your library."
              ctaLabel="Upload asset"
            />
          ) : (
          <div className={cn(
            "grid gap-4",
            viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
          )}>
            {assets.map((asset) => (
              <Card key={asset.id} className={cn("overflow-hidden group", viewMode === "list" && "flex")}>
                <div className={cn(
                  "relative bg-muted",
                  viewMode === "grid" ? "aspect-square" : "w-24 h-24 shrink-0"
                )}>
                  <img
                    src={asset.thumbnail}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                  {asset.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Video className="h-8 w-8 text-white" />
                    </div>
                  )}
                  {asset.favorite && (
                    <div className="absolute top-2 left-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className={cn("p-3", viewMode === "list" && "flex-1 flex items-center justify-between")}>
                  <div className={viewMode === "list" ? "flex-1" : ""}>
                    <p className="font-medium text-sm truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {asset.size} {asset.dimensions && `• ${asset.dimensions}`}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
        </TabsContent>

        {/* Caption Templates Tab */}
        <TabsContent value="captions">
          <div className="grid gap-4 md:grid-cols-2">
            {mockCaptionTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">{template.category}</Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {template.platforms.slice(0, 3).map((platform) => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="outline">
                      <Copy className="mr-2 h-3 w-3" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Caption Template
            </Button>
          </div>
        </TabsContent>

        {/* Hashtag Sets Tab */}
        <TabsContent value="hashtags">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockHashtagSets.map((set) => (
              <Card key={set.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Hash className="h-4 w-4 text-primary" />
                        {set.name}
                      </CardTitle>
                      <CardDescription>{set.hashtags.length} hashtags • Used {set.uses} times</CardDescription>
                    </div>
                    <Badge variant="secondary">{set.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {set.hashtags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Copy className="mr-2 h-3 w-3" />
                      Copy All
                    </Button>
                    <Button size="sm" variant="ghost">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Hashtag Set
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
