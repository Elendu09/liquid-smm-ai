import { useState } from "react";
import { 
  Wand2, 
  Image, 
  FileText, 
  Video, 
  Zap, 
  TrendingUp, 
  Sparkles,
  Copy,
  RefreshCw,
  Lightbulb,
  BookOpen,
  MessageSquare,
  Check,
  Download,
  Languages,
  Volume2,
  Square,
  FileDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { 
  useCaption, 
  useAIChat, 
  useContentRewrite, 
  useSummarize, 
  useImageGeneration,
  useQuote
} from "@/hooks/useSkyrank";

const aiTools = [
  {
    id: "caption",
    name: "Caption Generator",
    description: "Generate engaging captions for any platform",
    icon: MessageSquare,
    color: "from-pink-500 to-rose-500",
    placeholder: "Describe your post topic (e.g., 'fitness motivation for beginners')",
  },
  {
    id: "image",
    name: "AI Image Generator",
    description: "Create AI images from text prompts",
    icon: Image,
    color: "from-purple-500 to-indigo-500",
    placeholder: "Describe the image you want (e.g., 'sunset over mountains')",
  },
  {
    id: "script",
    name: "Video Script",
    description: "Write compelling video scripts with AI",
    icon: Video,
    color: "from-blue-500 to-cyan-500",
    placeholder: "What's your video about? (e.g., 'how to start a podcast')",
  },
  {
    id: "repurpose",
    name: "Content Repurposer",
    description: "Transform long content into social posts",
    icon: RefreshCw,
    color: "from-green-500 to-emerald-500",
    placeholder: "Paste your blog post or article to repurpose...",
  },
  {
    id: "ideas",
    name: "Content Ideas",
    description: "Get trending content suggestions",
    icon: Lightbulb,
    color: "from-yellow-500 to-orange-500",
    placeholder: "Enter your niche (e.g., 'fitness', 'tech', 'cooking')",
  },
  {
    id: "blog",
    name: "Blog Converter",
    description: "Turn blog posts into social content",
    icon: BookOpen,
    color: "from-red-500 to-pink-500",
    placeholder: "Paste your blog content to convert into social posts...",
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

const rewriteStyles = [
  { id: "casual", label: "Casual" },
  { id: "formal", label: "Formal" },
  { id: "professional", label: "Professional" },
  { id: "creative", label: "Creative" },
];

export default function AIStudioPage() {
  const [selectedTool, setSelectedTool] = useState("caption");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [rewriteStyle, setRewriteStyle] = useState("professional");
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // API hooks
  const { isLoading: captionLoading, generate: generateCaption } = useCaption();
  const { isLoading: chatLoading, send: sendChat } = useAIChat();
  const { isLoading: rewriteLoading, rewrite } = useContentRewrite();
  const { isLoading: summarizeLoading, summarize } = useSummarize();
  const { isLoading: imageLoading, generate: generateImage } = useImageGeneration();
  const { generate: generateQuote } = useQuote();

  const isGenerating = captionLoading || chatLoading || rewriteLoading || summarizeLoading || imageLoading;

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({ title: "Please enter some text", variant: "destructive" });
      return;
    }

    setOutputText("");
    setGeneratedImage(null);

    switch (selectedTool) {
      case "caption": {
        const result = await generateCaption(inputText, "engaging");
        if (result) {
          const hashtagStr = result.hashtags.length > 0 
            ? `\n\n${result.hashtags.join(" ")}` 
            : "";
          setOutputText(result.text + hashtagStr);
        }
        break;
      }

      case "image": {
        const imageUrl = await generateImage(inputText);
        if (imageUrl) {
          setGeneratedImage(imageUrl);
          setOutputText(`✨ Image generated successfully!\n\nPrompt: "${inputText}"`);
        } else {
          setOutputText("Image generation failed. Please try a different prompt.");
        }
        break;
      }

      case "script": {
        const prompt = `Write a compelling video script about: ${inputText}. 
Include:
- Hook (first 3 seconds)
- Main content points
- Call to action
Format it clearly with sections.`;
        const result = await sendChat(prompt, "gpt-4.1-mini");
        if (result) {
          setOutputText(result);
        }
        break;
      }

      case "repurpose": {
        const result = await rewrite(inputText, rewriteStyle as any);
        if (result) {
          setOutputText(`📱 Repurposed Content (${rewriteStyle} style):\n\n${result}`);
        }
        break;
      }

      case "ideas": {
        const prompt = `Generate 5 viral content ideas for the ${inputText} niche. 
For each idea include:
- Catchy title
- Content format (video, carousel, story)
- Hook line
- Key points to cover
Format as a numbered list.`;
        const result = await sendChat(prompt, "claude");
        if (result) {
          setOutputText(result);
        }
        break;
      }

      case "blog": {
        const summary = await summarize(inputText);
        if (summary) {
          const socialPrompt = `Turn this summary into 3 social media posts (Twitter, LinkedIn, Instagram):\n\n${summary}`;
          const socialPosts = await sendChat(socialPrompt, "gpt-4.1-mini");
          setOutputText(socialPosts || summary);
        }
        break;
      }

      default:
        break;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      toast({ title: "Text-to-speech not supported in this browser", variant: "destructive" });
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (!outputText.trim()) return;
    const utter = new SpeechSynthesisUtterance(outputText);
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
    setIsSpeaking(true);
    toast({ title: "Playing voiceover…" });
  };

  const downloadFile = (filename: string, content: string | Blob, mime = "text/plain") => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadScript = () => {
    if (!outputText.trim()) return;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`video-script-${stamp}.txt`, outputText);
    toast({ title: "Script downloaded" });
  };

  const handleDownloadImage = async () => {
    if (!generatedImage) return;
    try {
      const res = await fetch(generatedImage);
      const blob = await res.blob();
      downloadFile(`ai-image-${Date.now()}.png`, blob);
      toast({ title: "Image downloaded" });
    } catch {
      window.open(generatedImage, "_blank");
    }
  };

  const handleQuickIdea = async (topic: string) => {
    setInputText(`Create content about ${topic}`);
    setSelectedTool("ideas");
  };

  const currentTool = aiTools.find((t) => t.id === selectedTool);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wand2 className="h-8 w-8 text-primary" />
            AI Content Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Create amazing content with SkyRank.digital AI APIs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/30">
            <Sparkles className="h-3 w-3" />
            Real AI Powered
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
            onClick={() => {
              setSelectedTool(tool.id);
              setOutputText("");
              setGeneratedImage(null);
            }}
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
                  <div className="flex gap-2">
                    {selectedTool === "repurpose" && (
                      <Select value={rewriteStyle} onValueChange={setRewriteStyle}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rewriteStyles.map((style) => (
                            <SelectItem key={style.id} value={style.id}>{style.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
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
                </div>
                <Textarea
                  placeholder={currentTool?.placeholder || "Describe what you want to create..."}
                  className="min-h-[120px]"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleGenerate} disabled={isGenerating || !inputText.trim()}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating with AI...
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

          {/* Loading State */}
          {isGenerating && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium">AI is generating your content...</span>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          )}

          {/* Output */}
          {(outputText || generatedImage) && !isGenerating && (
            <Card className="animate-fade-in-scale">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    Generated Content
                    <Badge variant="secondary" className="text-xs">AI</Badge>
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleGenerate}>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Regenerate
                    </Button>
                    {outputText && (
                      <Button variant="outline" size="sm" onClick={handleSpeak}>
                        {isSpeaking ? (
                          <><Square className="mr-2 h-3 w-3 text-destructive" />Stop</>
                        ) : (
                          <><Volume2 className="mr-2 h-3 w-3" />Voiceover</>
                        )}
                      </Button>
                    )}
                    {selectedTool === "script" && outputText && (
                      <Button variant="outline" size="sm" onClick={handleDownloadScript}>
                        <FileDown className="mr-2 h-3 w-3" />
                        Download Script
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="mr-2 h-3 w-3 text-brand-green" />
                      ) : (
                        <Copy className="mr-2 h-3 w-3" />
                      )}
                      Copy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedImage && (
                  <div className="relative rounded-lg overflow-hidden bg-secondary/50">
                    <img 
                      src={generatedImage} 
                      alt="AI Generated" 
                      className="w-full h-auto max-h-96 object-contain"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2"
                      onClick={handleDownloadImage}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
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
                <TrendingUp className="h-4 w-4 text-brand-green" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleQuickIdea(topic.topic)}
                >
                  <div>
                    <p className="font-medium text-sm">{topic.topic}</p>
                    <Badge variant="secondary" className="text-xs">{topic.category}</Badge>
                  </div>
                  <span className="text-brand-green text-sm font-medium">{topic.growth}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Viral Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-orange" />
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
