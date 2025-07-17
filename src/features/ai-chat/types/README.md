# AI Chat Types

[Русский](./README.ru.md) | **English**

TypeScript type definitions for the AI Chat feature.

## Type Files

### `ai-context.ts`
Context types for passing state information between Timeline Studio components and AI services.
- `AIContext` - Complete context including timeline, resources, browser state
- `TimelineContext` - Timeline-specific state information
- `ResourceContext` - Resource pool state
- `BrowserContext` - File browser state
- `PlayerContext` - Video player state

### `ai-message.ts`
Message types for AI communication.
- `AIMessage` - Base message interface
- `UserMessage` - User input messages
- `AssistantMessage` - AI response messages
- `SystemMessage` - System notifications
- `ToolMessage` - Tool execution results

### `chat.ts`
Core chat functionality types.
- `ChatSession` - Chat session with history
- `ChatState` - Current chat state
- `ChatMode` - Available chat modes (chat, agent)
- `ChatModel` - Supported AI models
- `ChatProvider` - AI provider enumeration

### `streaming.ts`
Types for real-time streaming responses.
- `StreamingOptions` - Configuration for streaming
- `StreamingResponse` - Streaming response structure
- `StreamEvent` - Server-sent event types
- `StreamError` - Streaming error handling

## Usage

```typescript
import { AIContext, ChatSession } from '@/features/ai-chat/types'

// Create context for AI
const context: AIContext = {
  timeline: currentTimelineState,
  resources: resourcePoolState,
  browser: browserState,
  player: playerState
}

// Type chat session
const session: ChatSession = {
  id: 'session-123',
  messages: [],
  model: 'claude-3-opus',
  provider: 'anthropic'
}
```