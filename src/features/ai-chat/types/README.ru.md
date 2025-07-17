# AI Chat Types

**Русский** | [English](./README.md)

TypeScript определения типов для функции AI Chat.

## Файлы типов

### `ai-context.ts`
Типы контекста для передачи информации о состоянии между компонентами Timeline Studio и AI сервисами.
- `AIContext` - Полный контекст включая timeline, ресурсы, состояние браузера
- `TimelineContext` - Информация о состоянии timeline
- `ResourceContext` - Состояние пула ресурсов
- `BrowserContext` - Состояние файлового браузера
- `PlayerContext` - Состояние видео плеера

### `ai-message.ts`
Типы сообщений для AI коммуникации.
- `AIMessage` - Базовый интерфейс сообщения
- `UserMessage` - Сообщения от пользователя
- `AssistantMessage` - Ответы AI
- `SystemMessage` - Системные уведомления
- `ToolMessage` - Результаты выполнения инструментов

### `chat.ts`
Основные типы функциональности чата.
- `ChatSession` - Сессия чата с историей
- `ChatState` - Текущее состояние чата
- `ChatMode` - Доступные режимы чата (chat, agent)
- `ChatModel` - Поддерживаемые AI модели
- `ChatProvider` - Перечисление AI провайдеров

### `streaming.ts`
Типы для потоковых ответов в реальном времени.
- `StreamingOptions` - Конфигурация для потоковой передачи
- `StreamingResponse` - Структура потокового ответа
- `StreamEvent` - Типы server-sent событий
- `StreamError` - Обработка ошибок потоковой передачи

## Использование

```typescript
import { AIContext, ChatSession } from '@/features/ai-chat/types'

// Создание контекста для AI
const context: AIContext = {
  timeline: currentTimelineState,
  resources: resourcePoolState,
  browser: browserState,
  player: playerState
}

// Типизация сессии чата
const session: ChatSession = {
  id: 'session-123',
  messages: [],
  model: 'claude-3-opus',
  provider: 'anthropic'
}
```