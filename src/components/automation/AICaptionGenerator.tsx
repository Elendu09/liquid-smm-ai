import { useState } from "react";
import { Sparkles, Copy, RefreshCw, Check, Instagram, Youtube, Twitter, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "platform-instagram" },
  { id: "tiktok", name: "TikTok", icon: () => <span className="text-sm font-bold">TT</span>, color: "platform-tiktok" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "platform-youtube" },
  { id: "twitter", name: "Twitter", icon: Twitter, color: "platform-twitter" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "platform-facebook" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "platform-linkedin" },
];

const tones = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "humorous", label: "Humorous" },
  { id: "inspirational", label: "Inspirational" },
  { id: "educational", label: "Educational" },
];

const mockCaptions = [
  {
    text: "🚀 Ready to take your social media game to the next level? Our AI-powered tools are here to make it happen!\n\nStop spending hours on manual tasks. Start automating. Start growing. 📈\n\n#SocialMediaMarketing #GrowthHacking #Automation #SMM #DigitalMarketing",
    hashtags: ["#SocialMediaMarketing", "#GrowthHacking", "#Automation", "#SMM", "#DigitalMarketing"],
  },
  {
    text: "💡 The secret to 10x engagement? Consistency + Smart automation.\n\nWhile you sleep, your content is working for you. That's the power of AI-driven SMM.\n\nDrop a 🔥 if you're ready to automate your growth!\n\n#ContentCreator #SocialMediaTips #MarketingStrategy",
    hashtags: ["#ContentCreator", "#SocialMediaTips", "#MarketingStrategy", "#AIMarketing", "#GrowthMindset"],
  },
  {
    text: "📱 Your competitors are already using automation. Are you?\n\nJoin 50,000+ creators who have transformed their social media strategy with intelligent automation.\n\n➡️ Link in bio to get started\n\n#InfluencerMarketing #SocialMediaGrowth #CreatorEconomy",
    hashtags: ["#InfluencerMarketing", "#SocialMediaGrowth", "#CreatorEconomy", "#Entrepreneur", "#Success"],
  },
];

export const AICaptionGenerator = () => {
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [topic, setTopic] = useState("");
  const [generatedCaption, setGeneratedCaption] = useState<typeof mockCaptions[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const randomCaption = mockCaptions[Math.floor(Math.random() * mockCaptions.length)];
      setGeneratedCaption(randomCaption);
      setIsGenerating(false);
    }, 1500);
  };

  const handleCopy = () => {
    if (generatedCaption) {
      navigator.clipboard.writeText(generatedCaption.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10 glow-blue">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold">AI Caption Generator</h3>
          <p className="text-sm text-muted-foreground">Create engagement-optimized captions in seconds</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Platform Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">Select Platform</label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  selectedPlatform === platform.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
                }`}
              >
                <platform.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{platform.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">Caption Tone</label>
          <div className="flex flex-wrap gap-2">
            {tones.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setSelectedTone(tone.id)}
                className={`px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
                  selectedTone === tone.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <label className="text-sm font-medium mb-3 block">Topic / Niche</label>
          <Textarea
            placeholder="e.g., Fitness motivation, new product launch, behind the scenes..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-secondary/50 border-border focus:border-primary min-h-[80px] resize-none"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 glow-blue"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Caption
            </>
          )}
        </Button>

        {/* Generated Caption */}
        {generatedCaption && (
          <div className="animate-fade-in-scale space-y-4">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-start justify-between gap-4 mb-4">
                <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                  {generatedCaption.text}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopy}
                  className="shrink-0 hover:bg-primary/10"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-brand-green" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Suggested Hashtags */}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Suggested Hashtags
              </label>
              <div className="flex flex-wrap gap-2">
                {generatedCaption.hashtags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Regenerate */}
            <Button
              variant="outline"
              onClick={handleGenerate}
              className="w-full border-border hover:bg-secondary"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Another
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
