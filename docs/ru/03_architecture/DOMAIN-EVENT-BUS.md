# Domain Event Bus - Межсервисная коммуникация

## Обзор

**Domain Event Bus** - это централизованная система событий для обеспечения слабосвязанной коммуникации между доменами в Timeline Studio. Она позволяет доменам взаимодействовать друг с другом без прямых зависимостей, следуя принципам Domain-Driven Design.

## Архитектура

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   AI Services       │     │  Media Management   │     │   Video Editing     │
│     Domain          │     │      Domain         │     │      Domain         │
├─────────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│ • Публикует события │     │ • Публикует события │     │ • Публикует события │
│ • Слушает события  │     │ • Слушает события  │     │ • Слушает события  │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │                           │
           └───────────────────────────┴───────────────────────────┘
                                      │
                          ┌───────────▼───────────┐
                          │   Domain Event Bus   │
                          ├─────────────────────┤
                          │ • Pub/Sub механизм  │
                          │ • Фильтрация       │
                          │ • История событий  │
                          │ • Wildcard patterns│
                          └─────────────────────┘
```

## Основные концепции

### 1. Domain Event
Базовая структура события:

```typescript
interface DomainEvent<T = unknown> {
  id: string              // Уникальный ID события
  type: string           // Тип события (например: 'media.file.imported')
  source: DomainName     // Домен-источник
  timestamp: number      // Временная метка
  payload: T            // Данные события
  metadata?: EventMetadata // Дополнительные метаданные
}
```

### 2. Event Types
Каждый домен определяет свои типы событий:

```typescript
// AI Services Events
CHAT_MESSAGE_SENT = 'ai-services.chat.message-sent'
CONTENT_ANALYSIS_COMPLETED = 'ai-services.content.analysis-completed'
MONTAGE_PLAN_GENERATED = 'ai-services.montage.plan-generated'

// Media Management Events  
FILES_IMPORTED = 'media.files.imported'
METADATA_EXTRACTED = 'media.metadata.extracted'
BROWSER_TAB_CHANGED = 'media.browser.tab-changed'

// Video Editing Events
TIMELINE_CREATED = 'video.timeline.created'
CLIP_ADDED = 'video.timeline.clip-added'
PLAYBACK_STARTED = 'video.playback.started'
```

### 3. Подписка на события

#### Базовая подписка
```typescript
const unsubscribe = eventBus.subscribe((event) => {
  console.log('Received event:', event)
})

// Отписка
unsubscribe()
```

#### Подписка с фильтрами
```typescript
// Слушать только события из определенного домена
eventBus.subscribe(handler, {
  filter: {
    source: 'ai-services'
  }
})

// Слушать конкретные типы событий
eventBus.subscribe(handler, {
  filter: {
    type: ['media.files.imported', 'media.file.deleted']
  }
})

// Wildcard паттерны
eventBus.subscribe(handler, {
  filter: {
    type: 'media.*' // Все события media домена
  }
})
```

#### Опции подписки
```typescript
eventBus.subscribe(handler, {
  priority: 10,        // Приоритет обработчика
  once: true,         // Обработать только один раз
  timeout: 5000,      // Таймаут обработки (мс)
  filter: {
    source: ['ai-services', 'media-management'],
    custom: (event) => event.payload.size > 1000
  }
})
```

### 4. Публикация событий

```typescript
// Простая публикация
await eventBus.publish(
  'media.file.imported',
  'media-management',
  { 
    fileId: '123',
    fileName: 'video.mp4',
    size: 1024000 
  }
)

// С метаданными
await eventBus.publish(
  'video.timeline.created',
  'video-editing',
  { timelineId: '456', name: 'My Project' },
  { 
    userId: 'user123',
    correlationId: 'req-789'
  }
)
```

## Использование в React

### Hook useDomainEvents

```typescript
import { useDomainEvents } from '@domains/shared/hooks/use-domain-events'

function MyComponent() {
  const events = useDomainEvents({ 
    domain: 'video-editing',
    debug: true 
  })

  // Публикация события
  const handleClick = async () => {
    await events.publish('button.clicked', { buttonId: 'save' })
  }

  // Подписка на события
  useEffect(() => {
    // Слушать все события из AI Services
    events.on('ai-services.*', (event) => {
      console.log('AI event:', event)
    })

    // Слушать конкретное событие
    events.once('media.import.completed', (event) => {
      console.log('Import completed:', event.payload)
    })
  }, [events])

  return <button onClick={handleClick}>Save</button>
}
```

## Примеры интеграции

### 1. AI Services → Video Editing
AI генерирует план монтажа и отправляет событие:

```typescript
// В AI Services Orchestrator
eventBus.publish(
  DOMAIN_EVENTS.AI_SERVICES.MONTAGE_PLAN_GENERATED,
  'ai-services',
  {
    planId: 'plan-123',
    plan: montagePlan,
    mediaFiles: files,
    style: 'cinematic',
    duration: 300
  }
)

// В Video Editing Orchestrator
eventBus.subscribe(
  async (event) => {
    if (event.type === DOMAIN_EVENTS.AI_SERVICES.MONTAGE_PLAN_GENERATED) {
      const { plan } = event.payload
      await this.applyMontagePlan(plan)
    }
  },
  { filter: { source: 'ai-services' } }
)
```

### 2. Media Management → AI Services
При импорте новых файлов запускается AI анализ:

```typescript
// В Media Management
eventBus.publish(
  DOMAIN_EVENTS.MEDIA.FILES_IMPORTED,
  'media-management',
  {
    files: importedFiles,
    source: 'drag-drop',
    targetTab: 'media'
  }
)

// В AI Services Orchestrator
eventBus.subscribe(
  async (event) => {
    if (event.type === DOMAIN_EVENTS.MEDIA.FILES_IMPORTED) {
      const { files } = event.payload
      await this.startContentAnalysis(files)
    }
  },
  { filter: { source: 'media-management' } }
)
```

### 3. Cross-domain workflow
Полный цикл от импорта до timeline:

```typescript
// 1. Media Management: файлы импортированы
eventBus.publish(MEDIA_EVENTS.FILES_IMPORTED, 'media', files)

// 2. AI Services: запускает анализ
eventBus.subscribe(async (event) => {
  if (event.type === MEDIA_EVENTS.FILES_IMPORTED) {
    await analyzeContent(event.payload.files)
    eventBus.publish(AI_EVENTS.ANALYSIS_COMPLETED, 'ai', results)
  }
})

// 3. Video Editing: создает timeline на основе анализа
eventBus.subscribe(async (event) => {
  if (event.type === AI_EVENTS.ANALYSIS_COMPLETED) {
    const timeline = await createSmartTimeline(event.payload)
    eventBus.publish(VIDEO_EVENTS.TIMELINE_CREATED, 'video', timeline)
  }
})
```

## Best Practices

### 1. Именование событий
Используйте иерархическую структуру:
```
domain.entity.action
```

Примеры:
- `media.file.imported`
- `video.timeline.clip-added`
- `ai-services.chat.message-sent`

### 2. Типизация событий
Всегда определяйте типы для payload:

```typescript
// Плохо
eventBus.publish('user.updated', 'system', { id: 1, name: 'John' })

// Хорошо
interface UserUpdatedEvent {
  userId: string
  changes: {
    name?: string
    email?: string
  }
}

eventBus.publish<UserUpdatedEvent>(
  SYSTEM_EVENTS.USER_UPDATED,
  'system',
  { userId: '1', changes: { name: 'John' } }
)
```

### 3. Обработка ошибок
Всегда обрабатывайте ошибки в обработчиках:

```typescript
eventBus.subscribe(async (event) => {
  try {
    await processEvent(event)
  } catch (error) {
    console.error(`Failed to process ${event.type}:`, error)
    // Можно опубликовать событие об ошибке
    eventBus.publish(
      'system.error.event-processing-failed',
      'system',
      { originalEvent: event, error: error.message }
    )
  }
})
```

### 4. Избегайте циклических зависимостей
Не создавайте циклы событий:

```typescript
// Плохо: A слушает B, B слушает A
// Это может создать бесконечный цикл

// Хорошо: используйте корреляционные ID
eventBus.publish('action.started', 'domain-a', data, {
  correlationId: 'action-123'
})

// В обработчике проверяйте correlationId
if (event.metadata?.correlationId === lastProcessedId) {
  return // Избегаем повторной обработки
}
```

## Мониторинг и отладка

### Получение статистики
```typescript
const stats = eventBus.getStats()
console.log(stats)
// {
//   subscriptionCount: 25,
//   patternCount: 10,
//   historySize: 847,
//   subscriptionsByPattern: [...]
// }
```

### История событий
```typescript
// Получить все события
const allEvents = eventBus.getHistory()

// Получить события с фильтром
const aiEvents = eventBus.getHistory({
  source: 'ai-services',
  type: 'ai-services.content.*'
})

// Очистить историю
eventBus.clearHistory()
```

### Debug режим
В development режиме включается автоматическое логирование:

```typescript
// В компоненте
const events = useDomainEvents({ 
  domain: 'my-domain',
  debug: true // Включить логирование
})

// Или глобально через env
process.env.NODE_ENV === 'development' // Автоматическое логирование
```

## Производительность

### Оптимизации
1. **Приоритеты обработчиков** - критичные обработчики выполняются первыми
2. **Таймауты** - защита от зависших обработчиков
3. **История с ограничением** - максимум 1000 событий в памяти
4. **Эффективный pattern matching** - оптимизированный поиск подписчиков

### Рекомендации
- Не выполняйте тяжелые операции в обработчиках синхронно
- Используйте фильтры для уменьшения количества вызовов
- Очищайте подписки при размонтировании компонентов
- Используйте `once` для одноразовых обработчиков

## Тестирование

### Mock EventBus для тестов
```typescript
import { createMockEventBus } from '@domains/shared/events/test-utils'

describe('MyComponent', () => {
  let mockEventBus: MockEventBus

  beforeEach(() => {
    mockEventBus = createMockEventBus()
  })

  it('should publish event on button click', async () => {
    render(<MyComponent />)
    
    fireEvent.click(screen.getByText('Save'))
    
    expect(mockEventBus.published).toContainEqual(
      expect.objectContaining({
        type: 'button.clicked',
        payload: { buttonId: 'save' }
      })
    )
  })
})
```

## Заключение

Domain Event Bus обеспечивает:
- ✅ Слабую связанность между доменами
- ✅ Масштабируемую архитектуру
- ✅ Простую интеграцию новых функций
- ✅ Отличную testability
- ✅ Прозрачность потоков данных

Используйте EventBus для любой межсервисной коммуникации, избегая прямых зависимостей между доменами.