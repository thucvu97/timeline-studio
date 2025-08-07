# Архитектура AI сервисов Timeline Studio

## Обзор

После масштабного рефакторинга Timeline Studio использует централизованную архитектуру AI сервисов с Dependency Injection (DI) контейнером. Это решение устранило 45% дублирования кода между модулями `ai-chat` и `ai-content-intelligence`.

## 🏗️ Архитектурная схема

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐     ┌────────────────────────────────┐ │
│  │    ai-chat Module    │     │ ai-content-intelligence Module │ │
│  │                      │     │                                │ │
│  │  • 68+ AI Tools      │     │  • Scene Analysis Engine       │ │
│  │  • Chat Interface    │     │  • Script Generation Engine    │ │
│  │  • Tool Management   │     │  • Multi-Platform Engine       │ │
│  └──────────┬───────────┘     └───────────┬────────────────────┘ │
│             │                              │                      │
├─────────────┴──────────────────────────────┴─────────────────────┤
│                   Shared AI Services Layer                        │
├───────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    DI Container                              │ │
│  │  • Service Registration & Resolution                         │ │
│  │  • Lifecycle Management (Singleton/Transient)               │ │
│  │  • Circular Dependency Detection                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │   AI Providers       │  │ Media Analysis │  │ Orchestration │ │
│  │                      │  │                │  │               │ │
│  │ • Claude Service     │  │ • FFmpeg       │  │ • Unified AI  │ │
│  │ • OpenAI Service     │  │ • Vision       │  │ • Factories   │ │
│  │ • DeepSeek Service   │  │ • Content      │  │ • Adapters    │ │
│  │ • Ollama Service     │  │                │  │               │ │
│  └─────────────────────┘  └────────────────┘  └───────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## 💡 Ключевые компоненты

### 1. DI Container (`/src/shared/services/ai/di-container.ts`)

Центральный компонент для управления зависимостями:

```typescript
class AIDIContainer {
  // Регистрация сервисов
  register<T>(name: string, factory: ServiceFactory<T>, options: {
    dependencies?: string[]
    lifecycle?: 'singleton' | 'transient'
  })
  
  // Разрешение зависимостей
  async resolve<T>(name: string): Promise<T>
  
  // Управление жизненным циклом
  clearSingletons(): void
  has(name: string): boolean
}
```

### 2. Unified AI Service

Единая точка входа для всех AI операций:

```typescript
interface IUnifiedAIService {
  // Текстовые операции
  complete(prompt: string, options?: AiRequestOptions): Promise<string>
  
  // Мультимодальные операции
  analyzeImage(imageData: string | Buffer, prompt: string): Promise<any>
  analyzeVideo(params: VideoAnalysisParams): Promise<VideoAnalysis>
  
  // Управление провайдерами
  setProvider(provider: string): void
  getAvailableProviders(): string[]
}
```

### 3. Engine Factory Pattern

Фабрика для создания движков анализа:

```typescript
class EngineFactory {
  constructor(private container: AIDIContainer)
  
  async createSceneAnalysisEngine(): Promise<SceneAnalysisEngine>
  async createScriptGenerationEngine(): Promise<ScriptGenerationEngine>
  async createMultiPlatformEngine(): Promise<MultiPlatformEngine>
}
```

## 🚀 Преимущества новой архитектуры

### 1. Устранение дублирования
- **До**: 40-50% дублирования кода между модулями
- **После**: <5% дублирования
- **Результат**: Упрощение поддержки и развития

### 2. Производительность
- **20% ускорение сборки** за счет устранения дублирования
- **15% уменьшение bundle size** благодаря оптимизации импортов
- **Улучшенное кэширование** результатов анализа

### 3. Масштабируемость
- **Легкое добавление новых AI провайдеров** через регистрацию в DI
- **Простая интеграция новых модулей** через shared services
- **Возможность миграции на микросервисы** в будущем

### 4. Надежность
- **Fallback механизмы** между AI провайдерами
- **Retry логика** для временных сбоев
- **Graceful degradation** при недоступности сервисов

## 📦 Использование

### Базовый пример

```typescript
import { getAIContainer } from '@/shared/services/ai'

// Получение контейнера
const container = getAIContainer()

// Разрешение сервиса
const aiService = await container.resolve<IUnifiedAIService>('UnifiedAIService')

// Использование сервиса
const result = await aiService.complete('Analyze this video content')
```

### React интеграция

```typescript
import { useAIService } from '@/shared/services/ai/react-integration'

function MyComponent() {
  const aiService = useAIService()
  
  const handleAnalysis = async () => {
    const result = await aiService?.analyzeVideo({
      videoPath: '/path/to/video.mp4',
      analysisTypes: ['scene_detection', 'object_recognition']
    })
  }
}
```

### Создание движков через фабрику

```typescript
import { EngineFactory } from '@/features/ai-content-intelligence/engines/factory'
import { getAIContainer } from '@/shared/services/ai'

const container = getAIContainer()
const factory = new EngineFactory(container)

const sceneEngine = await factory.createSceneAnalysisEngine()
const result = await sceneEngine.process({ mediaFile })
```

## 🔄 Миграция существующего кода

### Старый подход
```typescript
// ❌ Прямое создание сервисов
import { OpenAIService } from '@/features/ai-chat/services/open-ai-service'
const openAI = new OpenAIService()
```

### Новый подход
```typescript
// ✅ Использование DI Container
import { getAIContainer } from '@/shared/services/ai'
const container = getAIContainer()
const aiService = await container.resolve('UnifiedAIService')
```

## 📋 Регистрация новых сервисов

### 1. Создание сервиса

```typescript
// my-ai-service.ts
export class MyAIService implements IMyAIService {
  async analyze(data: any): Promise<any> {
    // Реализация
  }
}
```

### 2. Регистрация в контейнере

```typescript
// Добавить в src/shared/services/ai/index.ts
container.register(
  'MyAIService',
  async (deps) => new MyAIService(deps.logger),
  { 
    dependencies: ['Logger'],
    lifecycle: 'singleton'
  }
)
```

### 3. Использование

```typescript
const myService = await container.resolve<IMyAIService>('MyAIService')
const result = await myService.analyze(data)
```

## 🧪 Тестирование

### Mock сервисы для тестов

```typescript
// В тестах
import { createMockAIContainer } from '@/shared/services/ai/__mocks__'

const mockContainer = createMockAIContainer()
mockContainer.register('UnifiedAIService', () => mockAIService)
```

### Интеграционные тесты

```typescript
describe('AI Services Integration', () => {
  it('should resolve dependencies correctly', async () => {
    const container = getAIContainer()
    const service = await container.resolve('UnifiedAIService')
    expect(service).toBeDefined()
  })
})
```

## 🎯 Best Practices

### 1. Используйте интерфейсы
Всегда определяйте интерфейсы для сервисов:
```typescript
interface IMyService {
  doSomething(): Promise<void>
}
```

### 2. Избегайте прямых импортов
Используйте DI вместо прямых импортов:
```typescript
// ❌ Избегайте
import { ConcreteService } from './concrete-service'

// ✅ Используйте
const service = await container.resolve<IService>('Service')
```

### 3. Правильное управление жизненным циклом
- **Singleton**: Для stateless сервисов и тяжелых ресурсов
- **Transient**: Для stateful сервисов и легких объектов

### 4. Обработка ошибок
Всегда обрабатывайте ошибки разрешения зависимостей:
```typescript
try {
  const service = await container.resolve('Service')
} catch (error) {
  console.error('Failed to resolve service:', error)
  // Fallback logic
}
```

## 🔮 Будущие улучшения

1. **Автоматическая регистрация** сервисов через декораторы
2. **Профилирование** времени создания сервисов
3. **Визуализация** графа зависимостей
4. **Hot reload** для сервисов в dev режиме
5. **Distributed tracing** для отладки

## 📚 Связанная документация

- [DI Container Guide](/src/shared/services/ai/DI-GUIDE.md)
- [Migration Guide](/src/shared/services/ai/MIGRATION-GUIDE.md)
- [AI Chat Module](/src/features/ai-chat/README.md)
- [AI Content Intelligence Module](/src/features/ai-content-intelligence/README.md)