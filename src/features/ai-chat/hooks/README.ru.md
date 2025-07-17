# AI Chat Hooks

**Русский** | [English](./README.md)

React хуки для функциональности AI Chat.

## Доступные хуки

### `useChat()`
Основной хук для доступа к функциональности чата.
- Доступ к state machine чата
- Отправка сообщений AI
- Управление сессиями чата
- Потоковые ответы в реальном времени

### `useChatState()`
Хук для доступа к текущему состоянию чата.
- Текущие сообщения
- Информация об активной сессии
- Состояния загрузки/ошибок
- Выбор модели и провайдера

### `useChatActions()`
Хук для действий и команд чата.
- Отправка сообщений
- Очистка истории чата
- Переключение AI моделей
- Отмена текущих запросов

### `useTimelineAI()`
Хук для Timeline-специфичных AI операций.
- Создание timeline из промпта
- Анализ медиа контента
- Применение AI предложений
- Быстрые команды

### `useResourcesAIIntegration()`
Хук для AI интеграции с управлением ресурсами.
- Анализ доступных ресурсов
- Умные предложения ресурсов
- Массовые операции с ресурсами
- Проверка совместимости ресурсов

### `useSafeTimeline()`
Безопасный доступ к состоянию timeline для AI операций.
- Null-безопасный доступ к timeline
- Состояние текущего проекта
- Модификации timeline
- Интеграция с error boundary

## Примеры использования

```typescript
import { useChat, useTimelineAI } from '@/features/ai-chat/hooks'

function MyComponent() {
  // Базовое использование чата
  const { sendMessage, messages, isLoading } = useChat()
  
  // Timeline AI операции
  const { createTimelineFromPrompt } = useTimelineAI()
  
  // Отправка сообщения
  const handleSend = async (text: string) => {
    await sendMessage(text)
  }
  
  // Создание timeline с AI
  const handleCreate = async () => {
    await createTimelineFromPrompt("Создай видео о путешествии")
  }
}
```

## Лучшие практики

- Всегда обрабатывайте состояния загрузки и ошибок
- Используйте `useSafeTimeline` при доступе к состоянию timeline
- Реализуйте правильную очистку для потоковых ответов
- Мемоизируйте колбэки для предотвращения ререндеров