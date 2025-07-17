# AI Chat Hooks

[Русский](./README.ru.md) | **English**

React hooks for AI Chat functionality.

## Available Hooks

### `useChat()`
Main hook for accessing chat functionality.
- Access to chat state machine
- Send messages to AI
- Manage chat sessions
- Stream responses in real-time

### `useChatState()`
Hook for accessing current chat state.
- Current messages
- Active session info
- Loading/error states
- Model and provider selection

### `useChatActions()`
Hook for chat actions and commands.
- Send messages
- Clear chat history
- Switch AI models
- Abort ongoing requests

### `useTimelineAI()`
Hook for Timeline-specific AI operations.
- Create timeline from prompt
- Analyze media content
- Apply AI suggestions
- Quick command shortcuts

### `useResourcesAIIntegration()`
Hook for AI integration with resource management.
- Analyze available resources
- Smart resource suggestions
- Bulk resource operations
- Resource compatibility checks

### `useSafeTimeline()`
Safe access to timeline state for AI operations.
- Null-safe timeline access
- Current project state
- Timeline modifications
- Error boundary integration

## Usage Examples

```typescript
import { useChat, useTimelineAI } from '@/features/ai-chat/hooks'

function MyComponent() {
  // Basic chat usage
  const { sendMessage, messages, isLoading } = useChat()
  
  // Timeline AI operations
  const { createTimelineFromPrompt } = useTimelineAI()
  
  // Send a message
  const handleSend = async (text: string) => {
    await sendMessage(text)
  }
  
  // Create timeline with AI
  const handleCreate = async () => {
    await createTimelineFromPrompt("Create a travel video")
  }
}
```

## Best Practices

- Always handle loading and error states
- Use `useSafeTimeline` when accessing timeline state
- Implement proper cleanup for streaming responses
- Memoize callbacks to prevent re-renders