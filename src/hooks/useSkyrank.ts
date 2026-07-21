// React hooks for SkyRank.digital API consumption

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { isGuestSession } from '@/hooks/useGuest';
import {
  generateCaption,
  generateHashtags,
  chatWithAI,
  rewriteText,
  translateText,
  fixGrammar,
  generateQuote,
  generateImage,
  summarizeText,
} from '@/services/skyrank';
import type {
  CaptionResponse,
  HashtagResponse,
  ChatResponse,
  RewriteResponse,
  TranslateResponse,
  GrammarResponse,
  QuoteResponse,
  ImageResponse,
  SummarizeResponse,
  SkyrankModel,
  RewriteStyle,
  ImageModel,
  GeneratedCaption,
} from '@/types/skyrank';

// Fallback mock data for when API fails
const mockCaptions: GeneratedCaption[] = [
  {
    text: "🚀 Ready to take your social media game to the next level? Our AI-powered tools are here to make it happen!\n\nStop spending hours on manual tasks. Start automating. Start growing. 📈",
    hashtags: ["#SocialMediaMarketing", "#GrowthHacking", "#Automation", "#SMM", "#DigitalMarketing"],
    isAI: false,
  },
  {
    text: "💡 The secret to 10x engagement? Consistency + Smart automation.\n\nWhile you sleep, your content is working for you. That's the power of AI-driven SMM.",
    hashtags: ["#ContentCreator", "#SocialMediaTips", "#MarketingStrategy", "#AIMarketing", "#GrowthMindset"],
    isAI: false,
  },
  {
    text: "📱 Your competitors are already using automation. Are you?\n\nJoin 50,000+ creators who have transformed their social media strategy with intelligent automation.",
    hashtags: ["#InfluencerMarketing", "#SocialMediaGrowth", "#CreatorEconomy", "#Entrepreneur", "#Success"],
    isAI: false,
  },
];

const mockHashtags = [
  "#socialmedia", "#marketing", "#growthhacking", "#contentcreator", "#digitalmarketing",
  "#smm", "#instagramgrowth", "#viralcontent", "#influencermarketing", "#automation"
];

// Generic hook state type
interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

// Hook for Caption Generation
export function useCaption() {
  const [state, setState] = useState<ApiState<GeneratedCaption>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const generate = useCallback(async (topic: string, mood?: string): Promise<GeneratedCaption | null> => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return null;
    }

    setState({ data: null, isLoading: true, error: null });

    try {
      // Get caption
      const captionResult = await generateCaption(topic, mood);
      
      // Get hashtags in parallel
      const hashtagResult = await generateHashtags(topic);

      if (captionResult.success && captionResult.caption) {
        const generatedCaption: GeneratedCaption = {
          text: captionResult.caption,
          hashtags: hashtagResult.success && hashtagResult.hashtags 
            ? hashtagResult.hashtags 
            : [],
          isAI: true,
        };
        setState({ data: generatedCaption, isLoading: false, error: null });
        return generatedCaption;
      } else if (isGuestSession()) {
        // eslint-disable-next-line no-restricted-syntax -- synth-ok: guest-only demo fallback
        const fallback = mockCaptions[Math.floor(Math.random() * mockCaptions.length)];
        setState({ data: fallback, isLoading: false, error: null });
        toast({ title: "Demo content", description: "Showing example while AI service is unavailable." });
        return fallback;
      } else {
        setState({ data: null, isLoading: false, error: 'AI service unavailable' });
        toast({ title: "AI unavailable", description: "Please try again shortly.", variant: "destructive" });
        return null;
      }
    } catch (error) {
      console.error('Caption generation error:', error);
      if (isGuestSession()) {
        // eslint-disable-next-line no-restricted-syntax -- synth-ok: guest-only demo fallback
        const fallback = mockCaptions[Math.floor(Math.random() * mockCaptions.length)];
        setState({ data: fallback, isLoading: false, error: 'API unavailable, using fallback' });
        return fallback;
      }
      setState({ data: null, isLoading: false, error: 'AI service unavailable' });
      return null;
    }
  }, []);

  return { ...state, generate };
}

// Hook for Hashtag Generation
export function useHashtags() {
  const [state, setState] = useState<ApiState<string[]>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const generate = useCallback(async (topic: string, platform?: string): Promise<string[] | null> => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return null;
    }

    setState({ data: null, isLoading: true, error: null });

    try {
      const result = await generateHashtags(topic, platform);
      
      if (result.success && result.hashtags) {
        setState({ data: result.hashtags, isLoading: false, error: null });
        return result.hashtags;
      } else if (isGuestSession()) {
        setState({ data: mockHashtags, isLoading: false, error: null });
        return mockHashtags;
      } else {
        setState({ data: null, isLoading: false, error: 'AI service unavailable' });
        return null;
      }
    } catch (error) {
      console.error('Hashtag generation error:', error);
      if (isGuestSession()) {
        setState({ data: mockHashtags, isLoading: false, error: 'API unavailable' });
        return mockHashtags;
      }
      setState({ data: null, isLoading: false, error: 'API unavailable' });
      return null;
    }
  }, []);

  return { ...state, generate };
}

// Hook for AI Chat
export function useAIChat() {
  const [state, setState] = useState<ApiState<string>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const send = useCallback(async (message: string, model?: SkyrankModel): Promise<string | null> => {
    if (!message.trim()) {
      toast({ title: "Please enter a message", variant: "destructive" });
      return null;
    }

    setState({ data: null, isLoading: true, error: null });

    try {
      const result = await chatWithAI(message, model);
      
      if (result.success && (result.response || result.message)) {
        const response = result.response || result.message || '';
        setState({ data: response, isLoading: false, error: null });
        return response;
      } else {
        const errorMsg = result.error || 'Failed to get AI response';
        setState({ data: null, isLoading: false, error: errorMsg });
        toast({ title: "AI Error", description: errorMsg, variant: "destructive" });
        return null;
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, isLoading: false, error: errorMsg });
      return null;
    }
  }, []);

  return { ...state, send };
}

// Hook for Content Rewriting
export function useContentRewrite() {
  const [state, setState] = useState<ApiState<string>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const rewrite = useCallback(async (text: string, style?: RewriteStyle): Promise<string | null> => {
    if (!text.trim()) {
      toast({ title: "Please enter text to rewrite", variant: "destructive" });
      return null;
    }

    setState({ data: null, isLoading: true, error: null });

    try {
      const result = await rewriteText(text, style);
      
      if (result.success && result.rewritten) {
        setState({ data: result.rewritten, isLoading: false, error: null });
        return result.rewritten;
      } else {
        const errorMsg = result.error || 'Failed to rewrite text';
        setState({ data: null, isLoading: false, error: errorMsg });
        return null;
      }
    } catch (error) {
      console.error('Rewrite error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, isLoading: false, error: errorMsg });
      return null;
    }
  }, []);

  return { ...state, rewrite };
}

// Hook for Translation
export function useTranslate() {
  const [state, setState] = useState<ApiState<string>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const translate = useCallback(async (text: string, to: string, from?: string): Promise<string | null> => {
    if (!text.trim()) {
      toast({ title: "Please enter text to translate", variant: "destructive" });
      return null;
    }

    setState({ data: null, isLoading: true, error: null });

    try {
      const result = await translateText(text, to, from);
      
      if (result.success && result.translated) {
        setState({ data: result.translated, isLoading: false, error: null });
        return result.translated;
      } else {
        const errorMsg = result.error || 'Failed to translate text';
        setState({ data: null, isLoading: false, error: errorMsg });
        return null;
      }
    } catch (error) {
      console.error('Translation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, isLoading: false, error: errorMsg });
      return null;
    }
  }, []);

  return { ...state, translate };
}

// Hook for Grammar Fix
export function useGrammarFix() {
  const [state, setState] = useState<ApiState<string>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fix = useCallback(async (text: string): Promise<string | null> => {
    if (!text.trim()) {
      toast({ title: "Please enter text to fix", variant: "destructive" });
      return null;
    }

    setState({ data: null, isLoading: true, error: null });

    try {
      const result = await fixGrammar(text);
      
      if (result.success && result.corrected) {
        setState({ data: result.corrected, isLoading: false, error: null });
        return result.corrected;
      } else {
        const errorMsg = result.error || 'Failed to fix grammar';
        setState({ data: null, isLoading: false, error: errorMsg });
        return null;
      }
    } catch (error) {
      console.error('Grammar fix error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, isLoading: false, error: errorMsg });
      return null;
    }
  }, []);

  return { ...state, fix };
}

// Hook for Image Generation
export function useImageGeneration() {
  const [state, setState] = useState<ApiState<string>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const generate = useCallback(async (prompt: string, model?: ImageModel): Promise<string | null> => {
    if (!prompt.trim()) {
      toast({ title: "Please enter an image prompt", variant: "destructive" });
      return null;
    }

    setState({ data: null, isLoading: true, error: null });

    try {
      const result = await generateImage(prompt, model);
      
      if (result.success && result.image) {
        setState({ data: result.image, isLoading: false, error: null });
        return result.image;
      } else {
        const errorMsg = result.error || 'Failed to generate image';
        setState({ data: null, isLoading: false, error: errorMsg });
        toast({ title: "Image Generation Failed", description: errorMsg, variant: "destructive" });
        return null;
      }
    } catch (error) {
      console.error('Image generation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, isLoading: false, error: errorMsg });
      return null;
    }
  }, []);

  return { ...state, generate };
}

// Hook for Quote Generation
export function useQuote() {
  const [state, setState] = useState<ApiState<{ quote: string; author?: string }>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const generate = useCallback(async (category?: string): Promise<{ quote: string; author?: string } | null> => {
    setState({ data: null, isLoading: true, error: null });

    try {
      const result = await generateQuote(category);
      
      if (result.success && result.quote) {
        const quoteData = { quote: result.quote, author: result.author };
        setState({ data: quoteData, isLoading: false, error: null });
        return quoteData;
      } else {
        const fallback = { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" };
        setState({ data: fallback, isLoading: false, error: null });
        return fallback;
      }
    } catch (error) {
      console.error('Quote generation error:', error);
      const fallback = { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" };
      setState({ data: fallback, isLoading: false, error: 'API unavailable' });
      return fallback;
    }
  }, []);

  return { ...state, generate };
}

// Hook for Summarization
export function useSummarize() {
  const [state, setState] = useState<ApiState<string>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const summarize = useCallback(async (text: string): Promise<string | null> => {
    if (!text.trim()) {
      toast({ title: "Please enter text to summarize", variant: "destructive" });
      return null;
    }

    setState({ data: null, isLoading: true, error: null });

    try {
      const result = await summarizeText(text);
      
      if (result.success && result.summary) {
        setState({ data: result.summary, isLoading: false, error: null });
        return result.summary;
      } else {
        const errorMsg = result.error || 'Failed to summarize text';
        setState({ data: null, isLoading: false, error: errorMsg });
        return null;
      }
    } catch (error) {
      console.error('Summarize error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, isLoading: false, error: errorMsg });
      return null;
    }
  }, []);

  return { ...state, summarize };
}
