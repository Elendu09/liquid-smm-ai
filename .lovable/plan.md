

# SkyRank.digital API Integration Plan

## API Discovery Summary

SkyRank.digital offers **80+ FREE APIs** with:
- No authentication required
- 24/7 availability
- Simple GET requests
- JSON responses

### Relevant APIs for SMMPilot Integration

| API | Endpoint | Use Case in SMMPilot |
|-----|----------|---------------------|
| **Caption Generator** | `/api/caption?topic=X&mood=X` | AI Caption Generator |
| **Hashtag Generator** | `/api/hashtags?topic=X&platform=X` | Hashtag Research Tool |
| **AI Chat (GPT-4)** | `/api/chat?message=X&model=gpt-4.1-mini` | AI Studio, Content Ideas |
| **Claude AI** | `/api/claude?message=X` | Advanced content generation |
| **Rewriter** | `/api/rewrite?text=X&style=X` | Content repurposing |
| **Summarizer** | `/api/summarize?text=X` | Blog to social converter |
| **Grammar Fixer** | `/api/grammar?text=X` | Caption polish |
| **Translate** | `/api/translate?text=X&to=X` | Multi-language captions |
| **Quote Generator** | `/api/quote?category=X` | Content ideas |
| **AI Image Generator** | `/api/imagine?prompt=X` | AI Studio images |
| **DALL-E 3** | `/api/dalle3?prompt=X` | Premium image generation |
| **Video Downloader** | `/api/download?url=X` | Content repurposing |
| **Text-to-Speech** | `/api/tts?text=X&voice=X` | Accessibility features |

---

## Integration Architecture

```text
+------------------+     +-------------------+     +------------------+
|   SMMPilot UI    | --> |  API Service      | --> | SkyRank.digital  |
|   Components     |     |  (skyrank.ts)     |     |  Free APIs       |
+------------------+     +-------------------+     +------------------+
        |                        |
        v                        v
+------------------+     +-------------------+
|  React Hooks     |     |  Error Handling   |
|  (useSkyrank)    |     |  Rate Limiting    |
+------------------+     +-------------------+
```

---

## Implementation Plan

### Phase 1: Core API Service Layer

**Create: `src/services/skyrank.ts`**

A centralized API service with:
- Base URL configuration (`https://skyrank.digital`)
- Typed request/response interfaces
- Error handling with retries
- Rate limiting protection
- Response caching

```typescript
// Example structure
interface SkyrankResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// API methods
- generateCaption(topic, mood)
- generateHashtags(topic, platform)
- chatWithAI(message, model)
- rewriteText(text, style)
- translateText(text, targetLang)
- generateImage(prompt, options)
```

### Phase 2: React Hooks Layer

**Create: `src/hooks/useSkyrank.ts`**

Custom hooks for each API:
- `useCaption()` - Generate captions
- `useHashtags()` - Research hashtags
- `useAIChat()` - Chat with AI models
- `useImageGeneration()` - Create AI images
- `useContentRewrite()` - Repurpose content

Features:
- Loading states
- Error handling
- Caching with React Query
- Debounced requests

### Phase 3: Component Integrations

#### 3.1 AI Caption Generator Enhancement

**Modify: `src/components/automation/AICaptionGenerator.tsx`**

Replace mock data with real API:
- Call `/api/caption` with topic and mood
- Call `/api/hashtags` for hashtag suggestions
- Add "Polish with AI" using `/api/grammar`
- Add translation support with `/api/translate`

New features:
- Real AI-generated captions
- Platform-specific hashtags (Instagram/TikTok/Twitter)
- Grammar/spelling check button
- Multi-language caption generation

#### 3.2 Hashtag Research Tool Enhancement

**Modify: `src/components/automation/HashtagResearchTool.tsx`**

Replace mock data with real API:
- Call `/api/hashtags` with topic and platform
- Show real trending hashtags
- Add "AI Suggest" button for topic-based hashtags

#### 3.3 AI Studio Page Enhancement

**Modify: `src/pages/dashboard/AIStudio.tsx`**

Integrate multiple AI models:
- Caption Generator using `/api/caption`
- Image Prompt using `/api/chat` with GPT-4
- Video Script using `/api/claude` for advanced reasoning
- Content Repurposer using `/api/rewrite`
- Content Ideas using `/api/chat` with creative prompts
- Blog Converter using `/api/summarize`

New AI Image Generation tab:
- Call `/api/imagine` or `/api/dalle3`
- Display generated images
- Download/save functionality

#### 3.4 New Features Enabled by SkyRank APIs

**Content Translation Widget**
- Translate captions to 100+ languages
- Auto-detect source language
- Multi-language post preview

**Grammar & Polish Tool**
- Fix grammar errors in captions
- Professional rewriting options (casual, formal, academic)

**Quote/Inspiration Generator**
- Generate motivational quotes for posts
- Category-based quotes (success, love, motivation)

**AI-Powered Content Ideas**
- Ask AI for content suggestions
- Trend-based recommendations
- Viral content patterns

---

## Technical Implementation Details

### API Response Handling

```typescript
// All SkyRank APIs return:
{ success: true, ... } // on success
{ success: false, error: "..." } // on failure
```

### Error Handling Strategy

1. Network errors - Show toast with retry option
2. API errors - Display user-friendly messages
3. Rate limits - Queue requests with delays
4. Timeout - 10 second timeout with fallback to mock data

### Caching Strategy

- Caption results: Cache for 5 minutes
- Hashtag results: Cache for 15 minutes
- Image generation: No cache (unique each time)
- Translations: Cache for 1 hour

### Loading States

- Skeleton loaders during API calls
- Progress indicators for image generation
- Optimistic UI updates where possible

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/services/skyrank.ts` | Main API service with all endpoints |
| `src/hooks/useSkyrank.ts` | React hooks for API consumption |
| `src/types/skyrank.ts` | TypeScript interfaces for API responses |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/automation/AICaptionGenerator.tsx` | Replace mock with real AI captions |
| `src/components/automation/HashtagResearchTool.tsx` | Real hashtag generation |
| `src/pages/dashboard/AIStudio.tsx` | Full AI model integration |
| `src/pages/dashboard/CaptionGenerator.tsx` | Wire up the enhanced component |

---

## API Testing Plan

Before integration, each API will be tested:

1. **Caption API**: `GET https://skyrank.digital/api/caption?topic=fitness&mood=inspiring`
2. **Hashtag API**: `GET https://skyrank.digital/api/hashtags?topic=travel&platform=instagram`
3. **Chat API**: `GET https://skyrank.digital/api/chat?message=hello&model=gpt-4.1-mini`
4. **Image API**: `GET https://skyrank.digital/api/imagine?prompt=sunset`

---

## User Experience Flow

```text
User enters topic
        |
        v
Click "Generate Caption"
        |
        v
Loading spinner (1-3 seconds)
        |
        v
Display AI-generated caption
        |
        v
Show suggested hashtags
        |
        v
Options: Copy, Regenerate, Translate, Polish
```

---

## Benefits After Integration

| Before (Mock Data) | After (SkyRank APIs) |
|--------------------|---------------------|
| 3 hardcoded captions | Unlimited AI captions |
| Static hashtag list | Real trending hashtags |
| No image generation | AI image creation |
| Single language | 100+ language translations |
| No content rewriting | Multiple style rewrites |

---

## Implementation Order

1. **First**: Create API service (`skyrank.ts`)
2. **Second**: Create types (`skyrank.ts`)
3. **Third**: Create React hooks (`useSkyrank.ts`)
4. **Fourth**: Upgrade AI Caption Generator
5. **Fifth**: Upgrade Hashtag Research Tool
6. **Sixth**: Upgrade AI Studio with full capabilities
7. **Final**: Add translation and grammar features

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API downtime | Fallback to mock data |
| Rate limiting | Request queuing + delays |
| Slow responses | Loading states + timeouts |
| API changes | Abstracted service layer for easy updates |

This integration will transform SMMPilot from a demo with mock data into a fully functional AI-powered social media management tool!

