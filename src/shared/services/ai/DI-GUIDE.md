# DI Container Guide

## Обзор

Timeline Studio использует кастомный Dependency Injection контейнер для управления AI сервисами. Это обеспечивает:

- ✅ Централизованное управление зависимостями
- ✅ Автоматическое разрешение зависимостей
- ✅ Различные жизненные циклы (singleton, transient)
- ✅ Защита от циклических зависимостей
- ✅ Легкое тестирование через моки

## Использование

### Получение контейнера

```typescript
import { getAIContainer } from '@/shared/services/ai'

const container = getAIContainer()
```

### Регистрация сервисов

#### Singleton (создается один раз)
```typescript
container.registerSingleton('MyService', 
  () => new MyService(),
  [] // зависимости
)

// С зависимостями
container.registerSingleton('UserService',
  (db: Database, cache: Cache) => new UserService(db, cache),
  ['Database', 'Cache'] // имена зависимостей
)
```

#### Transient (создается каждый раз)
```typescript
container.registerTransient('Logger',
  () => new Logger()
)
```

### Получение сервисов

#### Асинхронное разрешение (рекомендуется)
```typescript
const userService = await container.resolve<UserService>('UserService')
```

#### Синхронное получение (только для уже созданных singleton)
```typescript
const cachedService = container.get<UserService>('UserService')
```

## Встроенные сервисы

### Core AI Services
- `UnifiedAIService` - Главный AI сервис с fallback логикой
- `AIProviderFactory` - Фабрика AI провайдеров
- `ModelManager` - Управление моделями

### Analysis Services  
- `FFmpegService` - Анализ видео через FFmpeg
- `VisionService` - Компьютерное зрение
- `ContentAnalysisService` - Комплексный анализ контента

### Providers
- `ClaudeProvider` - Claude AI
- `OpenAIProvider` - OpenAI/GPT
- `DeepSeekProvider` - DeepSeek
- `OllamaProvider` - Локальные модели

## Примеры

### Создание сервиса с зависимостями

```typescript
// Регистрация
container.registerSingleton('VideoProcessor',
  async (ffmpeg: IFFmpegService, ai: IUnifiedAIService) => {
    const processor = new VideoProcessor(ffmpeg, ai)
    await processor.initialize()
    return processor
  },
  ['FFmpegService', 'UnifiedAIService']
)

// Использование
const processor = await container.resolve<VideoProcessor>('VideoProcessor')
```

### Создание фабрики

```typescript
export class EngineFactory {
  private container = getAIContainer()
  
  constructor() {
    this.registerEngines()
  }

  private registerEngines() {
    this.container.registerSingleton('SceneEngine', 
      () => new SceneEngine()
    )
  }

  async createSceneEngine() {
    return await this.container.resolve<SceneEngine>('SceneEngine')
  }
}
```

### Тестирование с моками

```typescript
// В тестах
beforeEach(() => {
  const container = getAIContainer()
  
  // Заменяем реальный сервис моком
  container.registerSingleton('FFmpegService',
    () => mockFFmpegService
  )
})
```

## Best Practices

1. **Используйте интерфейсы**
   ```typescript
   interface IUserService {
     getUser(id: string): Promise<User>
   }
   
   container.registerSingleton<IUserService>('UserService', ...)
   ```

2. **Избегайте циклических зависимостей**
   - Контейнер автоматически обнаружит и выбросит ошибку
   - Используйте события или колбэки для развязки

3. **Lazy loading**
   - Сервисы создаются только при первом запросе
   - Используйте `resolve()` в методах, а не в конструкторах

4. **Проверяйте наличие сервиса**
   ```typescript
   if (container.has('OptionalService')) {
     const service = await container.resolve('OptionalService')
   }
   ```

## Миграция существующего кода

### Было (Singleton pattern)
```typescript
class MyService {
  private static instance: MyService
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new MyService()
    }
    return this.instance
  }
}

// Использование
const service = MyService.getInstance()
```

### Стало (DI Container)
```typescript
// Регистрация
container.registerSingleton('MyService', () => new MyService())

// Использование
const service = await container.resolve('MyService')
```

## Отладка

### Просмотр зарегистрированных сервисов
```typescript
// Добавить метод в AIDIContainer
listServices(): string[] {
  return Array.from(this.services.keys())
}
```

### Логирование разрешения зависимостей
```typescript
// В методе resolve()
console.log(`Resolving: ${name}`)
console.log(`Dependencies: ${registration.dependencies.join(', ')}`)
```

## Расширение

### Добавление новых lifecycle

```typescript
export type ServiceLifecycle = 'singleton' | 'transient' | 'scoped' | 'request'

// В методе resolve()
switch (registration.lifecycle) {
  case 'request':
    // Логика для request-scoped сервисов
    break
}
```

### Добавление декораторов (опционально)

```typescript
// Если решите добавить декораторы в будущем
@injectable()
class UserService {
  constructor(
    @inject('Database') private db: Database
  ) {}
}
```

## Troubleshooting

### "Service not registered"
- Проверьте правильность имени сервиса
- Убедитесь что сервис зарегистрирован до использования

### "Circular dependency detected"
- Проверьте цепочку зависимостей в ошибке
- Используйте lazy injection или события

### "Service not yet resolved"
- Используйте `await resolve()` вместо `get()`
- Или сначала вызовите `resolve()` для инициализации