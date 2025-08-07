# AI Chat Examples

[Русский](./README.ru.md) | **English**

Usage examples and code snippets for AI Chat integration.

## Available Examples

### `timeline-ai-usage.md`
Complete guide for Timeline AI integration showing:
- Natural language commands for video editing
- Programmatic API usage
- Real-world scenarios
- Error handling and best practices

## Quick Examples

### Basic Chat Usage
```typescript
import { useChat, useChatActions, useChatState } from '@/features/ai-chat/hooks'

function ChatExample() {
  // Full chat access
  const chat = useChat()
  
  // Actions only
  const { sendChatMessage, clearMessages } = useChatActions()
  
  // State only
  const { chatMessages, isProcessing, error } = useChatState()

  const handleSendMessage = async () => {
    await sendChatMessage("Create a 30-second travel video")
  }

  return (
    <div>
      <button 
        onClick={handleSendMessage} 
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Send Message'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      <div className="messages">
        {chatMessages.map(message => (
          <div key={message.id} className={message.role}>
            {message.content}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Timeline Creation with AI
```typescript
import { useTimelineAI } from '@/features/ai-chat/hooks'

function TimelineCreation() {
  const { 
    createTimelineFromPrompt,
    analyzeAndSuggestResources,
    executeCommand 
  } = useTimelineAI()

  const createWeddingVideo = async () => {
    const result = await createTimelineFromPrompt(`
      Create a 5-7 minute wedding video:
      - Start with preparation photos
      - Add ceremony videos in chronological order
      - Include romantic music
      - End with the couple's first dance
      - Add smooth transitions and color correction
    `)
    
    if (result.success) {
      console.log('Timeline created:', result.data?.createdProject)
      console.log('Next actions:', result.nextActions)
    } else {
      console.error('Errors:', result.errors)
    }
  }

  const analyzeResources = async () => {
    const result = await analyzeAndSuggestResources(
      "Analyze the quality of all videos and suggest improvements"
    )
    
    console.log('Analysis:', result.data?.analysis)
    console.log('Suggestions:', result.data?.suggestions)
  }

  return (
    <div>
      <button onClick={createWeddingVideo}>
        Create Wedding Video
      </button>
      <button onClick={analyzeResources}>
        Analyze Resources
      </button>
    </div>
  )
}
```

### Chat Session Management
```typescript
function ChatSessions() {
  const {
    sessions,
    currentSession,
    createSession,
    switchToSession,
    deleteSession,
    isCreatingNewChat
  } = useChat()

  const handleCreateNewChat = async () => {
    const newSession = await createSession("New Project")
    console.log('Created new session:', newSession.id)
  }

  const handleSwitchSession = async (sessionId: string) => {
    await switchToSession(sessionId)
  }

  return (
    <div>
      <button 
        onClick={handleCreateNewChat}
        disabled={isCreatingNewChat}
      >
        {isCreatingNewChat ? 'Creating...' : 'New Chat'}
      </button>
      
      <div className="sessions-list">
        {sessions.map(session => (
          <div key={session.id}>
            <button onClick={() => handleSwitchSession(session.id)}>
              {session.name}
            </button>
            <button onClick={() => deleteSession(session.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
      
      {currentSession && (
        <div>
          <h3>Current session: {currentSession.name}</h3>
          <p>Messages: {currentSession.messages.length}</p>
        </div>
      )}
    </div>
  )
}
```

## Common Workflows

### Social Media Adaptation
```typescript
const adaptForSocialMedia = async () => {
  await sendChatMessage(`
    Adapt my video for:
    - TikTok vertical format (9:16)
    - Instagram Reels with captions
    - YouTube Shorts with attractive thumbnail
    - Add trending effects for each platform
  `)
}
```

### AI Content Analysis
```typescript
const analyzeVideoContent = async () => {
  const result = await executeCommand(
    "analyze-video-content", 
    { 
      includeScenes: true,
      identifyPersons: true,
      analyzeQuality: true,
      suggestImprovements: true
    }
  )
  
  if (result.success) {
    const { analysis } = result.data || {}
    console.log('Scene detection:', analysis?.scenes)
    console.log('Found persons:', analysis?.persons) 
    console.log('Video quality:', analysis?.quality)
    console.log('Recommendations:', result.data?.suggestions)
  }
}
```

### Automated Editing
```typescript
const createAutoMontage = async () => {
  const result = await executeCommand("create-dynamic-montage", {
    style: "energetic",
    duration: 120, // 2 minutes
    syncToMusic: true,
    removeSlowParts: true,
    addTransitions: "smooth",
    colorCorrection: "auto"
  })
  
  console.log('Montage created:', result.message)
  console.log('Applied enhancements:', result.data?.appliedEnhancements)
}
```

## Integration with Other Systems

### Safe Timeline Access
```typescript
import { useSafeTimeline } from '@/features/ai-chat/hooks'

function SafeTimelineIntegration() {
  const timeline = useSafeTimeline()
  
  const processWithTimeline = async () => {
    if (!timeline) {
      console.warn('Timeline not available')
      return
    }
    
    // Use timeline safely
    const project = timeline.currentProject
    if (project) {
      await executeCommand("optimize-project", {
        projectId: project.id,
        removeGaps: true,
        alignToGrid: true
      })
    }
  }

  return (
    <button 
      onClick={processWithTimeline}
      disabled={!timeline}
    >
      {timeline ? 'Optimize Project' : 'Timeline Unavailable'}
    </button>
  )
}
```

### Resources Integration
```typescript
import { useResourcesAIIntegration } from '@/features/ai-chat/hooks'

function ResourcesIntegration() {
  const { resourceStats, isIntegrated } = useResourcesAIIntegration()
  
  const analyzeAllResources = async () => {
    if (!isIntegrated) {
      console.warn('Resources integration unavailable')
      return
    }
    
    await executeCommand("analyze-all-resources", {
      includeStats: true,
      checkCompatibility: true,
      suggestOptimizations: true
    })
  }

  return (
    <div>
      <div>Resource Statistics:</div>
      <ul>
        <li>Media files: {resourceStats.totalMedia}</li>
        <li>Effects: {resourceStats.totalEffects}</li>
        <li>Filters: {resourceStats.totalFilters}</li>
        <li>Total size: {(resourceStats.totalSize / 1024 / 1024).toFixed(1)} MB</li>
      </ul>
      
      <button onClick={analyzeAllResources}>
        Analyze All Resources
      </button>
    </div>
  )
}
```

## Best Practices

### 1. Error Handling
```typescript
const handleAIOperation = async (operation: () => Promise<any>) => {
  try {
    const result = await operation()
    
    if (!result.success) {
      // Handle AI errors
      if (result.errors?.some(e => e.includes('API key'))) {
        throw new Error('API key needs to be configured in settings')
      }
      
      console.error('AI errors:', result.errors)
      return { success: false, errors: result.errors }
    }
    
    // Show warnings
    if (result.warnings?.length) {
      console.warn('Warnings:', result.warnings)
    }
    
    return result
    
  } catch (error) {
    console.error('Unexpected error:', error)
    throw error
  }
}
```

### 2. Performance Monitoring
```typescript
const trackAIOperation = async (operationName: string, operation: () => Promise<any>) => {
  const startTime = Date.now()
  
  try {
    const result = await operation()
    
    // Log metrics
    const executionTime = Date.now() - startTime
    console.log(`${operationName}: ${executionTime}ms`)
    
    // Send analytics
    analytics?.track('ai_operation', {
      operation: operationName,
      success: result.success,
      executionTime,
      aiExecutionTime: result.executionTime
    })
    
    return result
    
  } catch (error) {
    analytics?.track('ai_operation_error', {
      operation: operationName,
      error: error.message
    })
    throw error
  }
}
```

### 3. Prompt Optimization
```typescript
// ❌ Bad - vague prompt
await sendChatMessage("Make video better")

// ✅ Good - specific prompt
await sendChatMessage(`
  Improve video quality:
  - Apply color correction for more vibrant colors
  - Increase sharpness by 15%
  - Remove noise with filter
  - Stabilize shaky footage
  - Fix exposure in dark scenes
`)
```

### 4. Context Awareness
```typescript
// AI uses current project state
const contextualOperation = async () => {
  // Get context
  const timeline = useSafeTimeline()
  const { resourceStats } = useResourcesAIIntegration()
  
  if (timeline?.currentProject) {
    // AI will consider current project
    await sendChatMessage(`
      Optimize current project:
      - Duration: ${timeline.currentProject.duration}s
      - Available resources: ${resourceStats.totalMedia} media files
      - Remove unused clips
      - Optimize transitions between scenes
    `)
  }
}
```