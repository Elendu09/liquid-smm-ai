// SkyRank.digital API Response Types

export interface SkyrankBaseResponse {
  success: boolean;
  error?: string;
}

export interface CaptionResponse extends SkyrankBaseResponse {
  caption?: string;
  topic?: string;
  mood?: string;
}

export interface HashtagResponse extends SkyrankBaseResponse {
  hashtags?: string[];
  topic?: string;
  platform?: string;
}

export interface ChatResponse extends SkyrankBaseResponse {
  response?: string;
  message?: string;
  model?: string;
}

export interface RewriteResponse extends SkyrankBaseResponse {
  rewritten?: string;
  original?: string;
  style?: string;
}

export interface TranslateResponse extends SkyrankBaseResponse {
  translated?: string;
  original?: string;
  from?: string;
  to?: string;
}

export interface GrammarResponse extends SkyrankBaseResponse {
  corrected?: string;
  original?: string;
  corrections?: number;
}

export interface QuoteResponse extends SkyrankBaseResponse {
  quote?: string;
  author?: string;
  category?: string;
}

export interface ImageResponse extends SkyrankBaseResponse {
  image?: string; // URL or base64
  prompt?: string;
}

export interface SummarizeResponse extends SkyrankBaseResponse {
  summary?: string;
  original?: string;
}

// API Request Types
export interface CaptionRequest {
  topic: string;
  mood?: string;
}

export interface HashtagRequest {
  topic: string;
  platform?: string;
}

export interface ChatRequest {
  message: string;
  model?: 'gpt-4.1-mini' | 'gpt-4' | 'claude';
}

export interface RewriteRequest {
  text: string;
  style?: 'casual' | 'formal' | 'professional' | 'academic' | 'creative';
}

export interface TranslateRequest {
  text: string;
  to: string;
  from?: string;
}

export interface GrammarRequest {
  text: string;
}

export interface QuoteRequest {
  category?: string;
}

export interface ImageRequest {
  prompt: string;
  model?: 'imagine' | 'dalle3';
}

export interface SummarizeRequest {
  text: string;
}

// Utility types
export type SkyrankModel = 'gpt-4.1-mini' | 'gpt-4' | 'claude';
export type RewriteStyle = 'casual' | 'formal' | 'professional' | 'academic' | 'creative';
export type ImageModel = 'imagine' | 'dalle3';

export interface GeneratedCaption {
  text: string;
  hashtags: string[];
  isAI: boolean;
}
