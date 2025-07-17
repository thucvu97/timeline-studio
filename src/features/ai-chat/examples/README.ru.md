# AI Chat Examples

**Русский** | [English](./README.md)

Примеры использования и фрагменты кода для интеграции AI Chat.

## Доступные примеры

### `timeline-ai-usage.md`
Полное руководство по интеграции Timeline AI, включающее:
- Команды на естественном языке для видеомонтажа
- Использование программного API
- Примеры быстрых команд
- Продвинутая автоматизация рабочих процессов

## Быстрые примеры

### Базовое использование чата
```typescript
// Простая отправка сообщения
const { sendMessage } = useChat()
await sendMessage("Создай 30-секундное видео о путешествии")
```

### Создание timeline
```typescript
// Создание timeline из естественного языка
const { createTimelineFromPrompt } = useTimelineAI()
await createTimelineFromPrompt("Свадебное видео с романтичной музыкой")
```

### Управление ресурсами
```typescript
// AI-предложения ресурсов
const { analyzeAndSuggestResources } = useTimelineAI()
const suggestions = await analyzeAndSuggestResources()
```

### Пакетная обработка
```typescript
// Обработка нескольких видео
const results = await batchProcess({
  files: selectedFiles,
  operation: "apply-color-correction",
  aiAssisted: true
})
```

## Распространенные сценарии

### Адаптация для соцсетей
```typescript
// Адаптация видео для разных платформ
await sendMessage(`
  Адаптируй мое видео для:
  - TikTok вертикальный формат
  - Instagram Reels с трендовым аудио
  - YouTube Shorts с субтитрами
`)
```

### Анализ контента
```typescript
// Анализ видео контента
await sendMessage("Проанализируй это видео и предложи улучшения")
// AI определит сцены, идентифицирует персон, проанализирует качество
```

### Автоматизированный монтаж
```typescript
// Умное создание монтажа
await sendMessage(`
  Создай динамичный монтаж:
  - Используй только лучшие моменты
  - Синхронизируй с битами музыки
  - Добавь плавные переходы
`)
```

## Паттерны интеграции

### С Timeline Store
```typescript
const timeline = useTimelineStore()
const { executeCommand } = useTimelineAI()

// AI модифицирует timeline напрямую
await executeCommand("remove-silent-parts", {
  threshold: -40, // дБ
  minDuration: 0.5 // секунды
})
```

### С пулом ресурсов
```typescript
const resources = useResources()
const { suggestEffects } = useTimelineAI()

// Получение AI предложений на основе контента
const effects = await suggestEffects(currentClip)
resources.addMultiple(effects)
```

## Лучшие практики

1. **Четкие промпты** - Будьте конкретны в желаемых результатах
2. **Учет контекста** - AI использует текущее состояние проекта
3. **Итеративное улучшение** - Создавайте сложные правки поэтапно
4. **Обработка ошибок** - Всегда обрабатывайте сбои AI корректно