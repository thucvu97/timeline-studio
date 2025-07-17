# AI Chat Utils

**Русский** | [English](./README.md)

Вспомогательные функции для функции AI Chat.

## Файлы утилит

### `context-manager.ts`
Управляет сбором и обновлением AI контекста.
- `collectFullContext()` - Собирает полное состояние из всех компонентов Timeline Studio
- `updateContext()` - Обновляет определенные части контекста
- `compressContext()` - Сжимает большие контексты для соответствия лимитам токенов
- `validateContext()` - Валидирует структуру контекста

### `timeline-context.ts`
Утилиты для работы с контекстом timeline.
- `collectTimelineState()` - Собирает текущее состояние timeline
- `extractTimelineMetadata()` - Извлекает релевантную информацию timeline
- `summarizeTimelineContent()` - Создает краткое резюме timeline для AI
- `formatTimelineForAI()` - Форматирует данные timeline для использования AI

## Использование

```typescript
import { collectFullContext, compressContext } from '@/features/ai-chat/utils'

// Сбор полного контекста
const context = await collectFullContext()

// Сжатие при необходимости
if (isContextTooLarge(context)) {
  const compressed = compressContext(context, maxTokens)
}
```

## Ключевые функции

### Сбор контекста
Автоматически собирает состояние из:
- Редактора timeline
- Пула ресурсов
- Медиа браузера
- Видео плеера
- Настроек пользователя

### Оптимизация контекста
- Оценка количества токенов
- Умное сжатие контекста
- Сохранение информации по приоритету
- Извлечение метаданных