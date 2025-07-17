# AI Chat Services

[Русский](./README.ru.md) | **English**

Services for AI chat functionality and integration with various AI providers in Timeline Studio.

## Core AI Providers

### `claude-service.ts`
Integration with Anthropic's Claude API. Supports Claude 4 Opus and Sonnet models with tool usage.

### `open-ai-service.ts`
Integration with OpenAI API. Supports GPT-4, GPT-4 Vision, and GPT-3.5 Turbo models.

### `deepseek-service.ts`
Integration with DeepSeek API for advanced language models.

### `ollama-service.ts`
Integration with local models via Ollama for offline operation.

## Specialized Services

### `unified-ai-service.ts`
Unified interface for all AI providers. Automatically selects appropriate provider and handles requests.

### `timeline-ai-service.ts`
AI service for timeline operations including intelligent editing, content analysis, and recommendations.

### `whisper-service.ts`
Audio transcription service using OpenAI Whisper API. Supports multiple languages and formats.

### `ffmpeg-analysis-service.ts`
Video file analysis using FFmpeg for metadata and technical characteristics extraction.

### `multimodal-analysis-service.ts`
Multimodal content analysis (video + audio + text) for comprehensive understanding.

## Utility Services

### `api-key-loader.ts`
API key management for various services. Secure storage and loading from user settings.

### `chat-storage-service.ts`
Chat history persistence and session management.

### `batch-processing-service.ts`
Batch processing of multiple files using AI tools.

### `platform-optimization-service.ts`
Content optimization for various platforms (YouTube, TikTok, Instagram).

### `workflow-automation-service.ts`
Workflow automation and processing pipeline creation.

### `intent-recognition.ts`
User intent recognition for selecting appropriate tools and actions.

## State Management

### `chat-machine.ts`
XState state machine for chat flow, messages, and sessions.

### `chat-provider.tsx`
React Context Provider for chat functionality access throughout the application.

## Usage

```typescript
// Import individual service
import { ClaudeService } from './claude-service'

// Import unified service
import { UnifiedAIService } from './unified-ai-service'

// Use chat provider
import { ChatProvider, useChat } from './chat-provider'
```

## TODO List

The following TODO items have been identified in the services:

1. **whisper-service.ts:273** - Implement progress tracking through events for model downloads
2. **multimodal-analysis-service.ts:273** - Implement real processing time calculation
3. **multimodal-analysis-service.ts:541** - Implement cut detection for suggested cuts