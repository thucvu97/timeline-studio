# AI Chat Services

[Русский](./README.ru.md) | **English**

Services for AI chat functionality and integration with various AI providers in Timeline Studio.

## Architecture Overview

The services follow a **modular architecture** with clear separation of concerns:

- **Core Providers**: Individual service classes for each AI provider
- **Management Layer**: Configuration and provider managers
- **Unified Interface**: Single entry point for all AI operations
- **Specialized Services**: Domain-specific AI functionality

## Core AI Providers

### `claude-service.ts`
Integration with Anthropic's Claude API. Supports Claude 4 Sonnet and Opus models with tool usage.

### `open-ai-service.ts`
Integration with OpenAI API. Supports GPT-4, GPT-4o, GPT-3.5 Turbo, and o3 models.

### `deepseek-service.ts`
Integration with DeepSeek API for advanced language models including R1, Chat, and Coder variants.

### `ollama-service.ts`
Integration with local models via Ollama for offline operation.

## Management Layer

### `model-configuration-manager.ts`
**Centralized model configuration** - handles model metadata, capabilities, and provider mapping. Makes adding new models extremely easy.

### `provider-manager.ts`
**Provider orchestration** - manages provider instances, load balancing, and failover logic.

### `ai-response-processor.ts`
**Response standardization** - unified response processing and validation across all providers.

## Unified Interface

### `unified-ai-service-new.ts`
**Main API entry point** - provides a single interface for all AI operations with automatic provider selection, fallback handling, and caching.

## Specialized Services

### `timeline-ai-service.ts`
AI service for timeline operations including intelligent editing, content analysis, and recommendations.

### `whisper-service.ts`
Audio transcription service with **Faster Whisper integration**. Supports OpenAI Whisper, local models, and Faster Whisper with automatic provider selection.

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
// Import unified service (recommended)
import { UnifiedAIService } from './unified-ai-service-new'

// Import individual service
import { ClaudeService } from './claude-service'

// Use chat provider
import { ChatProvider, useChat } from './chat-provider'

// Example: AI request with automatic provider selection
const aiService = UnifiedAIService.getInstance()
const response = await aiService.sendRequest(
  "claude-4-sonnet", 
  messages, 
  { fallbackModels: ["gpt-4o"] }
)
```

## Adding New AI Models

The system is designed for **easy model addition**. To add Claude 4.1 or GPT-5:

### 1. Add Model Constants
```typescript
// In claude-service.ts
export const CLAUDE_MODELS = {
  CLAUDE_4_SONNET: "claude-4-sonnet",
  CLAUDE_4_OPUS: "claude-4-opus",
  CLAUDE_4_1: "claude-4.1", // ← New model
}

// In open-ai-service.ts  
export const AI_MODELS = {
  GPT_4: "gpt-4",
  GPT_4O: "gpt-4o", 
  GPT_5: "gpt-5", // ← New model
  O3: "o3",
}
```

### 2. Update Model Configuration Manager
```typescript
// In model-configuration-manager.ts - STATIC_MODELS
[CLAUDE_MODELS.CLAUDE_4_1]: {
  id: CLAUDE_MODELS.CLAUDE_4_1,
  name: "Claude 4.1",
  provider: "claude",
  isLocal: false,
  supportsStreaming: true,
  supportsTools: true,
  maxTokens: 200000,
  description: "Latest Claude model with enhanced capabilities",
},

[AI_MODELS.GPT_5]: {
  id: AI_MODELS.GPT_5,
  name: "GPT-5",
  provider: "openai", 
  isLocal: false,
  supportsStreaming: true,
  supportsTools: true,
  maxTokens: 200000,
  description: "Next generation OpenAI model",
}
```

### 3. That's It! 🎉

The **ModelConfigurationManager** automatically handles:
- Provider mapping by model prefix
- Availability checking
- Model selection for tasks
- Fallback logic

**No other changes needed** - the unified service will automatically support the new models.

## Key Benefits

- ✅ **Easy Model Addition**: 2 simple steps to add any new model
- ✅ **Automatic Provider Selection**: Based on availability and capabilities  
- ✅ **Intelligent Fallbacks**: Graceful degradation when preferred models unavailable
- ✅ **Unified Interface**: Single API for all AI operations
- ✅ **Modular Architecture**: Clean separation of concerns
- ✅ **Faster Whisper Integration**: Automatic transcription provider selection