# Примеры использования Timeline AI

Этот файл демонстрирует, как использовать Timeline AI для создания проектов и управления ресурсами.

## Базовое использование

### 1. Создание timeline из промпта

```typescript
import { useTimelineAI } from '@/features/ai-chat/hooks/use-timeline-ai'

function CreateTimelineExample() {
  const { createTimelineFromPrompt } = useTimelineAI()

  const handleCreateTimeline = async () => {
    const result = await createTimelineFromPrompt(
      "Создай свадебное видео из всех доступных файлов с романтичной музыкой"
    )
    
    if (result.success) {
      console.log('Timeline создан:', result.data)
    } else {
      console.error('Ошибка:', result.errors)
    }
  }

  return (
    <button onClick={handleCreateTimeline}>
      Создать свадебное видео
    </button>
  )
}
```

### 2. Анализ ресурсов

```typescript
function AnalyzeResourcesExample() {
  const { analyzeResources } = useTimelineAI()

  const handleAnalyze = async () => {
    const result = await analyzeResources(
      "Проанализируй качество всех видео и предложи улучшения"
    )
    
    console.log('Анализ завершен:', result.message)
    console.log('Предложения:', result.data?.suggestions)
  }

  return (
    <button onClick={handleAnalyze}>
      Анализировать ресурсы
    </button>
  )
}
```

### 3. Быстрые команды

```typescript
function QuickCommandsExample() {
  const { quickCommands } = useTimelineAI()

  return (
    <div>
      <button onClick={() => quickCommands.addAllVideosToResources()}>
        Добавить все видео в ресурсы
      </button>
      
      <button onClick={() => quickCommands.createChronologicalTimeline()}>
        Создать хронологический timeline
      </button>
      
      <button onClick={() => quickCommands.applyColorCorrection()}>
        Применить цветокоррекцию
      </button>
    </div>
  )
}
```

## Продвинутое использование

### 4. Выполнение пользовательских команд

```typescript
function CustomCommandExample() {
  const { executeCommand } = useTimelineAI()

  const handleCustomCommand = async () => {
    const result = await executeCommand(
      "Создай документальный фильм из видео, снятых на природе", 
      {
        style: "documentary",
        mood: "calm",
        duration: 300, // 5 минут
        includeNarration: true
      }
    )
    
    console.log('Команда выполнена:', result)
  }

  return (
    <button onClick={handleCustomCommand}>
      Создать документальный фильм
    </button>
  )
}
```

### 5. Интеграция с чатом

```typescript
function ChatIntegrationExample() {
  const { createTimelineFromPrompt } = useTimelineAI()
  const { sendChatMessage } = useChat()

  const handleChatCommand = async (message: string) => {
    // Проверяем, является ли сообщение командой timeline
    if (message.toLowerCase().includes('создай timeline') || 
        message.toLowerCase().includes('сделай видео')) {
      
      const result = await createTimelineFromPrompt(message)
      
      // Отправляем результат в чат
      sendChatMessage(`Timeline операция: ${result.message}`)
      
      if (result.data?.nextActions) {
        sendChatMessage(`Предложения: ${result.data.nextActions.join(', ')}`)
      }
    }
  }

  return (
    <input 
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleChatCommand(e.currentTarget.value)
          e.currentTarget.value = ''
        }
      }}
      placeholder="Напишите команду для timeline..."
    />
  )
}
```

## Типовые сценарии

### Свадебное видео
```typescript
const createWeddingVideo = async () => {
  // 1. Анализируем доступные ресурсы
  await analyzeResources("Найди все видео и фото со свадьбы")
  
  // 2. Создаем timeline
  await createTimelineFromPrompt(`
    Создай свадебное видео длительностью 5-7 минут:
    - Начни с фото подготовки
    - Добавь видео церемонии в хронологическом порядке  
    - Включи романтичную музыку
    - Закончи танцем молодоженов
    - Добавь плавные переходы и цветокоррекцию
  `)
}
```

### Тревел-видео
```typescript
const createTravelVideo = async () => {
  await createTimelineFromPrompt(`
    Создай динамичное тревел-видео:
    - Группируй клипы по локациям
    - Добавь энергичную музыку
    - Используй быстрые переходы
    - Включи замедленные кадры природы
    - Добавь титры с названиями мест
  `)
}
```

### Корпоративная презентация
```typescript
const createCorporateVideo = async () => {
  await createTimelineFromPrompt(`
    Создай профессиональную корпоративную презентацию:
    - Начни с логотипа компании
    - Добавь интервью с сотрудниками
    - Включи кадры офиса и продукции
    - Используй деловую музыку
    - Добавь профессиональные титры
    - Примени корпоративные цвета
  `)
}
```

## Обработка ошибок

```typescript
function ErrorHandlingExample() {
  const { createTimelineFromPrompt, setApiKey } = useTimelineAI()

  const handleWithErrorChecking = async () => {
    try {
      // Устанавливаем API ключ (если еще не установлен)
      setApiKey(process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '')
      
      const result = await createTimelineFromPrompt("Создай простое видео")
      
      if (!result.success) {
        // Обрабатываем ошибки AI
        console.error('AI ошибка:', result.errors)
        
        if (result.errors?.includes('API ключ')) {
          alert('Необходимо настроить API ключ Claude в настройках')
        }
      } else {
        console.log('Успех:', result.message)
        
        // Показываем предупреждения, если есть
        if (result.warnings?.length) {
          console.warn('Предупреждения:', result.warnings)
        }
      }
    } catch (error) {
      console.error('Неожиданная ошибка:', error)
    }
  }

  return (
    <button onClick={handleWithErrorChecking}>
      Создать с проверкой ошибок
    </button>
  )
}
```

## Мониторинг производительности

```typescript
function PerformanceMonitoringExample() {
  const { executeCommand } = useTimelineAI()

  const handleWithTiming = async () => {
    const startTime = Date.now()
    
    const result = await executeCommand("Сложная команда обработки видео")
    
    console.log(`Операция заняла: ${result.executionTime}ms`)
    console.log(`Общее время: ${Date.now() - startTime}ms`)
    
    // Логируем для аналитики
    analytics.track('timeline_ai_operation', {
      command: 'complex_video_processing',
      success: result.success,
      executionTime: result.executionTime,
      dataSize: JSON.stringify(result.data || {}).length
    })
  }

  return (
    <button onClick={handleWithTiming}>
      Выполнить с мониторингом
    </button>
  )
}
```