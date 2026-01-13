import { useState } from "react";
import { 
  Wand2, 
  Image, 
  FileText, 
  Video, 
  Zap, 
  TrendingUp, 
  Sparkles,
  Send,
  Copy,
  RefreshCw,
  Lightbulb,
  BookOpen,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const aiTools = [
  {
    id: "caption",
    name: "Caption Generator",
    description: "Generate engaging captions for any platform",
    icon: MessageSquare,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "image",
    name: "Image Prompt",
    description: "Create AI image generation prompts",
    icon: Image,
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "script",
    name: "Video Script",
    description: "Write compelling video scripts",
    icon: Video,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "repurpose",
    name: "Content Repurposer",
    description: "Transform long content into social posts",
    icon: RefreshCw,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "ideas",
    name: "Content Ideas",
    description: "Get trending content suggestions",
    icon: Lightbulb,
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "blog",
    name: "Blog Converter",
    description: "Turn blog posts into social content",
    icon: BookOpen,
    color: "from-red-500 to-pink-500",
  },
];

const trendingTopics = [
  { topic: "AI Tools", growth: "+245%", category: "Tech" },
  { topic: "Productivity Tips", growth: "+180%", category: "Lifestyle" },
  { topic: "Remote Work", growth: "+156%", category: "Business" },
  { topic: "Mental Health", growth: "+134%", category: "Wellness" },
  { topic: "Sustainable Living", growth: "+112%", category: "Lifestyle" },
];

const viralPatterns = [
  { name: "Hook + Value + CTA", success: 92, description: "Start with attention-grabbing hook, deliver value, end with clear call-to-action" },
  { name: "Before/After", success: 88, description: "Show transformation or comparison to capture attention" },
  { name: "List Format", success: 85, description: "Numbered lists or tips are highly shareable" },
  { name: "Question Lead", success: 82, description: "Start with a question your audience wants answered" },
  { name: "Story Arc", success: 79, description: "Personal story with relatable struggle and resolution" },
];

export default function AIStudioPage() {
  const [selectedTool, setSelectedTool] = useState("caption");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!inputText) return;
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setOutputText(`✨ Here's your AI-generated content based on "${inputText.slice(0, 50)}..."

🎯 Main Caption:
Transform your social media game with these proven strategies! Here's what top creators don't tell you about growth...

📝 Key Points:
• Consistency beats perfection every time
• Engage authentically with your community
• Use data to guide your content decisions

🔗 Don't forget to save this for later!

#socialmedia #growthtips #contentcreator #smm`);
      setIsGenerating(false);
    }, 2000);
  };

  const currentTool = aiTools.find((t) => t.id === selectedTool);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wand2 className="h-8 w-8 text-primary" />
            AI Content Studio
          </h1>
          <p className="text-muted-foreground mt-1">Create amazing content with AI-powered tools</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            500 credits remaining
          </Badge>
        </div>
      </div>

      {/* AI Tools Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {aiTools.map((tool) => (
          <Card
            key={tool.id}
            className={cn(
              "cursor-pointer transition-all hover:scale-105",
              selectedTool === tool.id && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedTool(tool.id)}
          >
            <CardContent className="p-4 text-center">
              <div className={cn(
                "h-12 w-12 rounded-xl bg-gradient-to-br mx-auto mb-3 flex items-center justify-center",
                tool.color
              )}>
                <tool.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-medium text-sm">{tool.name}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Generator */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {currentTool && (
                  <div className={cn(
                    "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                    currentTool.color
                  )}>
                    <currentTool.icon className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <CardTitle>{currentTool?.name}</CardTitle>
                  <CardDescription>{currentTool?.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Input</label>
                  <Select defaultValue="instagram">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="twitter">X (Twitter)</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Describe what you want to create... (e.g., 'A motivational post about productivity for entrepreneurs')"
                  className="min-h-[120px]"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleGenerate} disabled={isGenerating || !inputText}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          {outputText && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Generated Content</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Regenerate
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="mr-2 h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                  {outputText}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setInputText(`Create content about ${topic.topic}`)}
                >
                  <div>
                    <p className="font-medium text-sm">{topic.topic}</p>
                    <Badge variant="secondary" className="text-xs">{topic.category}</Badge>
                  </div>
                  <span className="text-green-500 text-sm font-medium">{topic.growth}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Viral Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Viral Content Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {viralPatterns.map((pattern, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{pattern.name}</span>
                    <span className="text-xs text-muted-foreground">{pattern.success}% success</span>
                  </div>
                  <Progress value={pattern.success} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">{pattern.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
