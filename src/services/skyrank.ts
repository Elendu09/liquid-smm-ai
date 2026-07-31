// SkyRank.digital API Service
// Free APIs with no authentication required

import { freeAiComplete, freeAiImageUrl, cleanText, parseHashtags } from './freeAi';
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
} from '@/types/skyrank';

const BASE_URL = 'https://skyrank.digital';
const TIMEOUT = 10000; // 10 seconds

// Helper to make API requests with timeout
async function fetchWithTimeout<T>(
  endpoint: string,
  params: Record<string, string>,
  timeout = TIMEOUT
): Promise<T> {
  const url = new URL(endpoint, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

// Caption Generator API
export async function generateCaption(
  topic: string,
  mood?: string
): Promise<CaptionResponse> {
  try {
    const response = await fetchWithTimeout<CaptionResponse>('/api/caption', {
      topic,
      mood: mood || 'engaging',
    });
    return { success: true, ...response };
  } catch (error) {
    console.warn('Caption API unavailable, using keyless fallback:', error);
    const out = await freeAiComplete(
      'You write scroll-stopping social media captions. Reply with the caption only.',
      `Write one ${mood || 'engaging'} social media caption about: ${topic}`,
    );
    if (out) return { success: true, caption: cleanText(out), topic, mood: mood || 'engaging' };
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate caption',
    };
  }
}

// Hashtag Generator API
export async function generateHashtags(
  topic: string,
  platform?: string
): Promise<HashtagResponse> {
  try {
    const response = await fetchWithTimeout<HashtagResponse>('/api/hashtags', {
      topic,
      platform: platform || 'instagram',
    });
    return { success: true, ...response };
  } catch (error) {
    console.warn('Hashtag API unavailable, using keyless fallback:', error);
    const out = await freeAiComplete(
      'You are a hashtag strategist. Reply with a plain list of hashtags only.',
      `List 20 relevant ${platform || 'instagram'} hashtags for: ${topic}`,
    );
    if (out) return { success: true, hashtags: parseHashtags(out), topic, platform: platform || 'instagram' };
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate hashtags',
    };
  }
}

// AI Chat API (GPT-4, Claude)
export async function chatWithAI(
  message: string,
  model: SkyrankModel = 'gpt-4.1-mini'
): Promise<ChatResponse> {
  try {
    const endpoint = model === 'claude' ? '/api/claude' : '/api/chat';
    const params: Record<string, string> = { message };
    if (model !== 'claude') {
      params.model = model;
    }
    const response = await fetchWithTimeout<ChatResponse>(endpoint, params);
    return { success: true, ...response };
  } catch (error) {
    console.warn('Chat API unavailable, using keyless fallback:', error);
    const out = await freeAiComplete('You are a helpful social media assistant.', message);
    if (out) return { success: true, response: out, model: 'free-fallback' };
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to chat with AI',
    };
  }
}

// Text Rewriter API
export async function rewriteText(
  text: string,
  style: RewriteStyle = 'professional'
): Promise<RewriteResponse> {
  try {
    const response = await fetchWithTimeout<RewriteResponse>('/api/rewrite', {
      text,
      style,
    });
    return { success: true, ...response };
  } catch (error) {
    console.warn('Rewrite API unavailable, using keyless fallback:', error);
    const out = await freeAiComplete(
      'You rewrite text. Reply with the rewritten text only.',
      `Rewrite this in a ${style} style:\n\n${text}`,
    );
    if (out) return { success: true, rewritten: cleanText(out), original: text, style };
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rewrite text',
    };
  }
}

// Translation API
export async function translateText(
  text: string,
  to: string,
  from?: string
): Promise<TranslateResponse> {
  try {
    const params: Record<string, string> = { text, to };
    if (from) params.from = from;
    const response = await fetchWithTimeout<TranslateResponse>('/api/translate', params);
    return { success: true, ...response };
  } catch (error) {
    console.warn('Translate API unavailable, using keyless fallback:', error);
    const out = await freeAiComplete(
      'You are a translator. Reply with the translation only, preserving emojis and hashtags.',
      `Translate to ${to}:\n\n${text}`,
    );
    if (out) return { success: true, translated: cleanText(out), original: text, to, from };
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to translate text',
    };
  }
}

// Grammar Fixer API
export async function fixGrammar(text: string): Promise<GrammarResponse> {
  try {
    const response = await fetchWithTimeout<GrammarResponse>('/api/grammar', {
      text,
    });
    return { success: true, ...response };
  } catch (error) {
    console.warn('Grammar API unavailable, using keyless fallback:', error);
    const out = await freeAiComplete(
      'You fix grammar and spelling. Reply with the corrected text only.',
      text,
    );
    if (out) return { success: true, corrected: cleanText(out), original: text };
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fix grammar',
    };
  }
}

// Quote Generator API
export async function generateQuote(category?: string): Promise<QuoteResponse> {
  try {
    const response = await fetchWithTimeout<QuoteResponse>('/api/quote', {
      category: category || 'motivation',
    });
    return { success: true, ...response };
  } catch (error) {
    console.warn('Quote API unavailable, using keyless fallback:', error);
    const out = await freeAiComplete(
      'You share short quotes. Reply with the quote only, no attribution line.',
      `Give one short ${category || 'motivation'} quote.`,
    );
    if (out) return { success: true, quote: cleanText(out), category: category || 'motivation' };
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate quote',
    };
  }
}

// AI Image Generator API
export async function generateImage(
  prompt: string,
  model: ImageModel = 'imagine'
): Promise<ImageResponse> {
  try {
    const endpoint = model === 'dalle3' ? '/api/dalle3' : '/api/imagine';
    const response = await fetchWithTimeout<ImageResponse>(
      endpoint,
      { prompt },
      30000 // 30 second timeout for image generation
    );
    return { success: true, ...response };
  } catch (error) {
    console.warn('Image API unavailable, using keyless fallback:', error);
    return { success: true, image: freeAiImageUrl(prompt), prompt };
  }
}

// Summarizer API
export async function summarizeText(text: string): Promise<SummarizeResponse> {
  try {
    const response = await fetchWithTimeout<SummarizeResponse>('/api/summarize', {
      text,
    });
    return { success: true, ...response };
  } catch (error) {
    console.warn('Summarize API unavailable, using keyless fallback:', error);
    const out = await freeAiComplete(
      'You summarise text concisely. Reply with the summary only.',
      text,
    );
    if (out) return { success: true, summary: cleanText(out), original: text };
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to summarize text',
    };
  }
}

// Export all API functions
export const skyrankAPI = {
  generateCaption,
  generateHashtags,
  chatWithAI,
  rewriteText,
  translateText,
  fixGrammar,
  generateQuote,
  generateImage,
  summarizeText,
};

export default skyrankAPI;
