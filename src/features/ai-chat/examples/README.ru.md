# AI Chat Examples

**Русский** | [English](./README.md)

Примеры использования и фрагменты кода для интеграции AI Chat.

## Доступные примеры

### `timeline-ai-usage.md`
Полное руководство по интеграции Timeline AI, включающее:
- Команды на естественном языке для видеомонтажа
- Использование программного API
- Примеры реальных сценариев
- Обработка ошибок и лучшие практики

## Быстрые примеры

### Базовое использование чата
```typescript
import { useChat, useChatActions, useChatState } from '@/features/ai-chat/hooks'

function ChatExample() {
  // Полный доступ к чату
  const chat = useChat()
  
  // Только действия
  const { sendChatMessage, clearMessages } = useChatActions()
  
  // Только состояние
  const { chatMessages, isProcessing, error } = useChatState()

  const handleSendMessage = async () => {
    await sendChatMessage("Создай 30-секундное видео о путешествии")
  }

  return (
    <div>
      <button 
        onClick={handleSendMessage} 
        disabled={isProcessing}
      >
        {isProcessing ? 'Обрабатывается...' : 'Отправить сообщение'}
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

### Создание timeline с AI
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
      Создай свадебное видео длительностью 5-7 минут:
      - Начни с фото подготовки
      - Добавь видео церемонии в хронологическом порядке
      - Включи романтичную музыку
      - Закончи танцем молодоженов
      - Добавь плавные переходы и цветокоррекцию
    `)
    
    if (result.success) {
      console.log('Timeline создан:', result.data?.createdProject)
      console.log('Следующие действия:', result.nextActions)
    } else {
      console.error('Ошибки:', result.errors)
    }
  }

  const analyzeResources = async () => {
    const result = await analyzeAndSuggestResources(
      "Проанализируй качество всех видео и предложи улучшения"
    )
    
    console.log('Анализ:', result.data?.analysis)
    console.log('Предложения:', result.data?.suggestions)
  }

  return (
    <div>
      <button onClick={createWeddingVideo}>
        Создать свадебное видео
      </button>
      <button onClick={analyzeResources}>
        Анализировать ресурсы
      </button>
    </div>
  )
}
```

### Управление сессиями чата
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
    const newSession = await createSession("Новый проект")
    console.log('Создана новая сессия:', newSession.id)
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
        {isCreatingNewChat ? 'Создается...' : 'Новый чат'}
      </button>
      
      <div className="sessions-list">
        {sessions.map(session => (
          <div key={session.id}>
            <button onClick={() => handleSwitchSession(session.id)}>
              {session.name}
            </button>
            <button onClick={() => deleteSession(session.id)}>
              Удалить
            </button>
          </div>
        ))}
      </div>
      
      {currentSession && (
        <div>
          <h3>Текущая сессия: {currentSession.name}</h3>
          <p>Сообщений: {currentSession.messages.length}</p>
        </div>
      )}
    </div>
  )
}
```

## Распространенные сценарии

### Адаптация для соцсетей
```typescript
const adaptForSocialMedia = async () => {
  await sendChatMessage(`
    Адаптируй мое видео для:
    - TikTok вертикальный формат (9:16)
    - Instagram Reels с субтитрами
    - YouTube Shorts с привлекательной обложкой
    - Добавь тренды и эффекты для каждой платформы
  `)
}
```

### Анализ контента с AI
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
    console.log('Детекция сцен:', analysis?.scenes)
    console.log('Найденные персоны:', analysis?.persons) 
    console.log('Качество видео:', analysis?.quality)
    console.log('Рекомендации:', result.data?.suggestions)
  }
}
```

### Автоматизированный монтаж
```typescript
const createAutoMontage = async () => {
  const result = await executeCommand("create-dynamic-montage", {
    style: "energetic",
    duration: 120, // 2 минуты
    syncToMusic: true,
    removeSlowParts: true,
    addTransitions: "smooth",
    colorCorrection: "auto"
  })
  
  console.log('Монтаж создан:', result.message)
  console.log('Примененные улучшения:', result.data?.appliedEnhancements)
}
```

## Интеграция с другими системами

### Безопасный доступ к Timeline
```typescript
import { useSafeTimeline } from '@/features/ai-chat/hooks'

function SafeTimelineIntegration() {
  const timeline = useSafeTimeline()
  
  const processWithTimeline = async () => {
    if (!timeline) {
      console.warn('Timeline не доступен')
      return
    }
    
    // Используем timeline безопасно
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
      {timeline ? 'Оптимизировать проект' : 'Timeline недоступен'}
    </button>
  )
}
```

### Интеграция с ресурсами
```typescript
import { useResourcesAIIntegration } from '@/features/ai-chat/hooks'

function ResourcesIntegration() {
  const { resourceStats, isIntegrated } = useResourcesAIIntegration()
  
  const analyzeAllResources = async () => {
    if (!isIntegrated) {
      console.warn('Интеграция с ресурсами недоступна')
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
      <div>Статистика ресурсов:</div>
      <ul>
        <li>Медиафайлов: {resourceStats.totalMedia}</li>
        <li>Эффектов: {resourceStats.totalEffects}</li>
        <li>Фильтров: {resourceStats.totalFilters}</li>
        <li>Общий размер: {(resourceStats.totalSize / 1024 / 1024).toFixed(1)} MB</li>
      </ul>
      
      <button onClick={analyzeAllResources}>
        Анализировать все ресурсы
      </button>
    </div>
  )
}
```

## Лучшие практики

### 1. Обработка ошибок
```typescript
const handleAIOperation = async (operation: () => Promise<any>) => {
  try {
    const result = await operation()
    
    if (!result.success) {
      // Обрабатываем ошибки AI
      if (result.errors?.some(e => e.includes('API key'))) {
        throw new Error('Необходимо настроить API ключ в настройках')
      }
      
      console.error('AI ошибки:', result.errors)
      return { success: false, errors: result.errors }
    }
    
    // Показываем предупреждения
    if (result.warnings?.length) {
      console.warn('Предупреждения:', result.warnings)
    }
    
    return result
    
  } catch (error) {
    console.error('Неожиданная ошибка:', error)
    throw error
  }
}
```

### 2. Мониторинг производительности
```typescript
const trackAIOperation = async (operationName: string, operation: () => Promise<any>) => {
  const startTime = Date.now()
  
  try {
    const result = await operation()
    
    // Логируем метрики
    const executionTime = Date.now() - startTime
    console.log(`${operationName}: ${executionTime}ms`)
    
    // Отправляем аналитику
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

### 3. Оптимизация промптов
```typescript
// ❌ Плохо - неточный промпт
await sendChatMessage("Сделай видео лучше")

// ✅ Хорошо - конкретный промпт
await sendChatMessage(`
  Улучши качество видео:
  - Примени цветокоррекцию для более насыщенных цветов
  - Увеличь резкость на 15%
  - Убери шум с помощью фильтра
  - Стабилизируй дрожащие кадры
  - Выровняй экспозицию в темных сценах
`)
```

### 4. Работа с контекстом
```typescript
// AI использует текущее состояние проекта
const contextualOperation = async () => {
  // Получаем контекст
  const timeline = useSafeTimeline()
  const { resourceStats } = useResourcesAIIntegration()
  
  if (timeline?.currentProject) {
    // AI будет учитывать текущий проект
    await sendChatMessage(`
      Оптимизируй текущий проект:
      - Длительность: ${timeline.currentProject.duration}s
      - Доступно ресурсов: ${resourceStats.totalMedia} медиафайлов
      - Удали неиспользуемые клипы
      - Оптимизируй переходы между сценами
    `)
  }
}
```