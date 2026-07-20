import { useEffect, useState } from "react";
import { Sparkles, Copy, RefreshCw, Check, Instagram, Youtube, Twitter, Facebook, Linkedin, Languages, Wand2, Trophy, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCaption, useTranslate, useGrammarFix } from "@/hooks/useSkyrank";
import { generateCaption, generateHashtags } from "@/services/skyrank";
import { toast } from "@/hooks/use-toast";
import { logRun } from "@/hooks/useRunHistory";
import { useActivePreset } from "@/hooks/useActivePreset";
import { PresetChip } from "@/components/shared/PresetChip";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" },
];

interface AICaptionGeneratorProps {
  defaultPlatformId?: string;
}

export const AICaptionGenerator = ({ defaultPlatformId }: AICaptionGeneratorProps = {}) => {
  const [selectedPlatform, setSelectedPlatform] = useState(defaultPlatformId || "instagram");
  const { preset, tone: presetTone, presetName, cta, hashtagCount, template } = useActivePreset(
    "caption-generator",
    selectedPlatform,
  );
  const [selectedTone, setSelectedTone] = useState(presetTone);
  const [topic, setTopic] = useState(template?.body ?? "");
  const [copied, setCopied] = useState(false);
  const [translateTo, setTranslateTo] = useState("");

  // Sync tone when preset changes (e.g. user picks different one in context bar)
  useEffect(() => {
    if (preset?.id) setSelectedTone(presetTone);
  }, [preset?.id, presetTone]);

  const { data: generatedCaption, isLoading: isGenerating, generate } = useCaption();
  const { isLoading: isTranslating, translate } = useTranslate();
  const { isLoading: isPolishing, fix: polish } = useGrammarFix();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }
    const start = performance.now();
    const enrichedTopic = cta ? `${topic}\n\nCall to action: ${cta}` : topic;
    try {
      await generate(enrichedTopic, selectedTone);
      logRun({
        toolKey: "caption-generator",
        action: "generate",
        platform: selectedPlatform,
        status: "success",
        input: { topic, tone: selectedTone, presetName, hashtagCount },
        durationMs: Math.round(performance.now() - start),
      });
    } catch (e) {
      logRun({
        toolKey: "caption-generator",
        action: "generate",
        platform: selectedPlatform,
        status: "failed",
        input: { topic, tone: selectedTone, presetName },
        error: e instanceof Error ? e.message : String(e),
        durationMs: Math.round(performance.now() - start),
      });
    }
  };

  const handleCopy = () => {
    if (generatedCaption) {
      const fullText = `${generatedCaption.text}\n\n${generatedCaption.hashtags.join(" ")}`;
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTranslate = async () => {
    if (!generatedCaption || !translateTo) return;
    const translated = await translate(generatedCaption.text, translateTo);
    if (translated) {
      toast({ title: `Translated to ${languages.find(l => l.code === translateTo)?.name}` });
    }
  };

  const handlePolish = async () => {
    if (!generatedCaption) return;
    const polished = await polish(generatedCaption.text);
    if (polished) {
      toast({ title: "Caption polished!", description: "Grammar and style improved." });
    }
  };

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 glow-blue">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI Caption Generator</h3>
            <p className="text-sm text-muted-foreground">
              Create engagement-optimized captions with real AI
              {generatedCaption?.isAI && (
                <Badge variant="secondary" className="ml-2 text-xs">AI Powered</Badge>
              )}
            </p>
          </div>
        </div>
        <PresetChip toolKey="caption-generator" platform={selectedPlatform} />
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
          disabled={isGenerating || !topic.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 glow-blue"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Generating with AI...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Caption
            </>
          )}
        </Button>

        {/* Loading Skeleton */}
        {isGenerating && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
        )}

        {/* Generated Caption */}
        {generatedCaption && !isGenerating && (
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Select value={translateTo} onValueChange={setTranslateTo}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Translate to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTranslate}
                    disabled={!translateTo || isTranslating}
                    className="h-8"
                  >
                    <Languages className="h-3 w-3 mr-1" />
                    {isTranslating ? "..." : "Translate"}
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePolish}
                  disabled={isPolishing}
                  className="h-8"
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  {isPolishing ? "Polishing..." : "Polish Grammar"}
                </Button>
              </div>
            </div>

            {/* Suggested Hashtags */}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                AI Suggested Hashtags
              </label>
              <div className="flex flex-wrap gap-2">
                {generatedCaption.hashtags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(tag);
                      toast({ title: `Copied ${tag}` });
                    }}
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Regenerate */}
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating}
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
