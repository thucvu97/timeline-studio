# AI Core Migration Guide

## Обзор

AI сервисы мигрируют из `src/shared/services/ai` в доменную архитектуру:
- **Базовая инфраструктура** → `src/domains/ai-core`
- **Специфичные фичи** остаются в `src/features/ai-*`

## Что изменилось

### 1. Новая структура
```
src/domains/ai-core/
├── types/              # Типы для AI провайдеров и сервисов
├── providers/          # Регистрация AI провайдеров
├── services/           # DI контейнер и core сервисы
└── utils/              # Утилиты
```

### 2. Импорты

**Старый способ:**
```typescript
import { getAIContainer, IAIProvider } from '@/shared/services/ai'
```

**Новый способ:**
```typescript
import { getAIContainer, type IAIProvider } from '@/domains/ai-core'
```

### 3. Инициализация

**Старый способ:**
```typescript
import { initializeAIServices } from '@/shared/services/ai'
await initializeAIServices(config)
```

**Новый способ:**
```typescript
import { initializeAICoreWithPlugins } from '@/domains/ai-core/initialize'
await initializeAICoreWithPlugins(config)
```

## Обратная совместимость

Старые импорты продолжают работать через re-export:
- `@/shared/services/ai` → re-export из `@/domains/ai-core`
- `@/shared/services/ai/providers/interfaces` → re-export типов

## План миграции

1. ✅ Создан домен `ai-core` с базовыми типами
2. ✅ Перенесен DI контейнер
3. ✅ Настроены re-export для совместимости
4. ⏳ Постепенная миграция провайдеров
5. ⏳ Миграция анализаторов в отдельные домены

## Рекомендации

- Используйте новые импорты в новом коде
- Старые импорты помечены как `@deprecated`
- Миграция может происходить постепенно