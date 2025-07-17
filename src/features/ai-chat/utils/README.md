# AI Chat Utils

[Русский](./README.ru.md) | **English**

Utility functions for AI Chat feature.

## Utility Files

### `context-manager.ts`
Manages AI context collection and updates.
- `collectFullContext()` - Gathers complete state from all Timeline Studio components
- `updateContext()` - Updates specific context parts
- `compressContext()` - Compresses large contexts to fit token limits
- `validateContext()` - Validates context structure

### `timeline-context.ts`
Timeline-specific context utilities.
- `collectTimelineState()` - Gathers current timeline state
- `extractTimelineMetadata()` - Extracts relevant timeline information
- `summarizeTimelineContent()` - Creates concise timeline summary for AI
- `formatTimelineForAI()` - Formats timeline data for AI consumption

## Usage

```typescript
import { collectFullContext, compressContext } from '@/features/ai-chat/utils'

// Collect complete context
const context = await collectFullContext()

// Compress if needed
if (isContextTooLarge(context)) {
  const compressed = compressContext(context, maxTokens)
}
```

## Key Functions

### Context Collection
Automatically gathers state from:
- Timeline editor
- Resource pool
- Media browser
- Video player
- User preferences

### Context Optimization
- Token counting estimation
- Smart context compression
- Priority-based information retention
- Metadata extraction