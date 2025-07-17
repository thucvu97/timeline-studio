# AI Chat Examples

[Русский](./README.ru.md) | **English**

Usage examples and code snippets for AI Chat integration.

## Available Examples

### `timeline-ai-usage.md`
Complete guide for Timeline AI integration showing:
- Natural language commands for video editing
- Programmatic API usage
- Quick command examples
- Advanced workflow automation

## Quick Examples

### Basic Chat Usage
```typescript
// Simple message sending
const { sendMessage } = useChat()
await sendMessage("Create a 30-second travel video")
```

### Timeline Creation
```typescript
// Create timeline from natural language
const { createTimelineFromPrompt } = useTimelineAI()
await createTimelineFromPrompt("Wedding video with romantic music")
```

### Resource Management
```typescript
// AI-powered resource suggestions
const { analyzeAndSuggestResources } = useTimelineAI()
const suggestions = await analyzeAndSuggestResources()
```

### Batch Processing
```typescript
// Process multiple videos
const results = await batchProcess({
  files: selectedFiles,
  operation: "apply-color-correction",
  aiAssisted: true
})
```

## Common Workflows

### Social Media Adaptation
```typescript
// Adapt video for multiple platforms
await sendMessage(`
  Adapt my video for:
  - TikTok vertical format
  - Instagram Reels with trending audio
  - YouTube Shorts with captions
`)
```

### Content Analysis
```typescript
// Analyze video content
await sendMessage("Analyze this video and suggest improvements")
// AI will detect scenes, identify persons, analyze quality
```

### Automated Editing
```typescript
// Smart montage creation
await sendMessage(`
  Create a dynamic montage:
  - Use best moments only
  - Sync with beat drops
  - Add smooth transitions
`)
```

## Integration Patterns

### With Timeline Store
```typescript
const timeline = useTimelineStore()
const { executeCommand } = useTimelineAI()

// AI modifies timeline directly
await executeCommand("remove-silent-parts", {
  threshold: -40, // dB
  minDuration: 0.5 // seconds
})
```

### With Resource Pool
```typescript
const resources = useResources()
const { suggestEffects } = useTimelineAI()

// Get AI suggestions based on content
const effects = await suggestEffects(currentClip)
resources.addMultiple(effects)
```

## Best Practices

1. **Clear Prompts** - Be specific about desired outcomes
2. **Context Awareness** - AI uses current project state
3. **Iterative Refinement** - Build complex edits step by step
4. **Error Handling** - Always handle AI failures gracefully