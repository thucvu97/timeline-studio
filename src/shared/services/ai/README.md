# Shared AI Services

Централизованная архитектура AI сервисов для Timeline Studio с поддержкой Dependency Injection.

## Обзор

Shared AI Services предоставляет единую точку входа для всех AI-операций в приложении, включая:

- 🤖 Поддержку множества AI провайдеров (Claude, OpenAI, DeepSeek, Ollama)
- 📹 Анализ медиа контента (видео, аудио, изображения)
- 🎯 Компьютерное зрение и распознавание объектов
- 🔄 Автоматическое переключение между провайдерами (fallback)
- 💾 Кэширование результатов
- 🏗️ Dependency Injection для гибкой архитектуры

## Архитектура

```
src/shared/services/ai/
├── providers/              # AI провайдеры
│   ├── interfaces.ts      # Общие интерфейсы
│   ├── claude.ts          # Claude (Anthropic)
│   ├── openai.ts          # OpenAI / GPT
│   ├── deepseek.ts        # DeepSeek
│   ├── ollama.ts          # Локальные модели
│   └── factory.ts         # Фабрика провайдеров
├── analysis/              # Сервисы анализа
│   ├── interfaces.ts      # Интерфейсы анализа
│   ├── ffmpeg-service.ts  # FFmpeg анализ
│   ├── vision-service.ts  # Компьютерное зрение
│   ├── content-service.ts # Комплексный анализ
│   └── factory.ts         # Фабрика анализа
├── di-container.ts        # DI контейнер
├── unified-ai-service.ts  # Главный AI сервис
├── model-manager.ts       # Управление моделями
├── react-integration.tsx  # React интеграция
└── DI-GUIDE.md           # Руководство по DI
```

## Быстрый старт

### 1. Базовое использование

```typescript
import { getAIContainer } from '@/shared/services/ai'

// Получаем контейнер
const container = getAIContainer()

// Получаем unified AI service
const aiService = await container.resolve('UnifiedAIService')

// Отправляем запрос
const response = await aiService.sendRequest(
  'claude-4-sonnet-latest',
  [{ role: 'user', content: 'Analyze this video' }]
)
```

### 2. Использование в React компонентах

```tsx
import { AIServicesProvider, useAIService } from '@/shared/services/ai/react-integration'

// В корне приложения
function App() {
  return (
    <AIServicesProvider>
      <YourComponents />
    </AIServicesProvider>
  )
}

// В компоненте
function VideoAnalyzer() {
  const aiService = useAIService()
  
  const handleAnalyze = async () => {
    const result = await aiService.analyzeMedia(mediaFile)
    console.log(result)
  }
  
  return <button onClick={handleAnalyze}>Analyze</button>
}
```

### 3. Lazy loading сервисов

```tsx
import { useAIServiceLazy } from '@/shared/services/ai/react-integration'

function AdvancedFeature() {
  const { service: visionService, loading } = useAIServiceLazy('VisionService')
  
  if (loading) return <div>Loading vision service...</div>
  
  return <div>Vision service ready!</div>
}
```

## Основные сервисы

### UnifiedAIService

Главный сервис для работы с AI:

```typescript
interface IUnifiedAIService {
  // Отправка запросов
  sendRequest(model: string, messages: Message[], options?: RequestOptions): Promise<Response>
  
  // Потоковые запросы
  streamRequest(model: string, messages: Message[], options: StreamOptions): Promise<void>
  
  // Анализ медиа
  analyzeMedia(file: MediaFile): Promise<ContentAnalysisResult>
  
  // Анализ изображений
  analyzeImage(imagePath: string): Promise<FrameAnalysisResult>
  
  // Управление моделями
  getAvailableModels(): Promise<ModelConfig[]>
  switchProvider(provider: string): Promise<void>
}
```

### Провайдеры

#### Claude (Anthropic)
```typescript
const response = await aiService.sendRequest(
  'claude-4-sonnet-latest',
  messages,
  { temperature: 0.7 }
)
```

#### OpenAI
```typescript
const response = await aiService.sendRequest(
  'gpt-4-turbo',
  messages,
  { maxTokens: 4000 }
)
```

#### DeepSeek
```typescript
const response = await aiService.sendRequest(
  'deepseek-chat',
  messages
)
```

#### Ollama (локальные модели)
```typescript
const response = await aiService.sendRequest(
  'llama3.2:latest',
  messages
)
```

### Анализ медиа

#### FFmpeg Service
```typescript
const ffmpeg = await container.resolve('FFmpegService')

// Анализ видео
const videoAnalysis = await ffmpeg.analyzeVideo(mediaFile)
console.log(videoAnalysis.duration, videoAnalysis.fps, videoAnalysis.quality)

// Анализ аудио
const audioAnalysis = await ffmpeg.analyzeAudio(mediaFile)
console.log(audioAnalysis.volume, audioAnalysis.silentSegments)

// Детекция сцен
const scenes = await ffmpeg.detectScenes(mediaFile, 0.3)
```

#### Vision Service
```typescript
const vision = await container.resolve('VisionService')

// Анализ кадра
const frameAnalysis = await vision.analyzeFrame(imagePath)
console.log(frameAnalysis.objects, frameAnalysis.faces, frameAnalysis.text)

// Анализ видео
const videoFrames = await vision.analyzeVideo(videoPath, 1) // 1 FPS
```

#### Content Analysis Service
```typescript
const contentAnalysis = await container.resolve('ContentAnalysisService')

// Комплексный анализ
const result = await contentAnalysis.analyzeContent(mediaFile)
console.log(result.scenes, result.transcript, result.summary)

// Извлечение ключевых моментов
const keyMoments = await contentAnalysis.extractKeyMoments(result, 5)
```

## Конфигурация

### Настройка провайдеров

```typescript
const container = getAIContainer()

container.configure({
  providers: {
    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
      maxRetries: 3
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      organization: 'org-123'
    },
    ollama: {
      baseUrl: 'http://localhost:11434'
    }
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 минут
    maxSize: 100
  },
  fallback: {
    enabled: true,
    models: ['gpt-4', 'claude-3-opus']
  }
})
```

### Регистрация кастомных сервисов

```typescript
// Регистрация singleton
container.registerSingleton('MyService', 
  () => new MyService(),
  [] // зависимости
)

// Регистрация с зависимостями
container.registerSingleton('ComplexService',
  (aiService: IUnifiedAIService, ffmpeg: IFFmpegService) => 
    new ComplexService(aiService, ffmpeg),
  ['UnifiedAIService', 'FFmpegService']
)

// Использование
const myService = await container.resolve('ComplexService')
```

## Паттерны использования

### Fallback стратегия

```typescript
const response = await aiService.sendRequest(
  'claude-4-sonnet-latest',
  messages,
  {
    fallbackModels: ['gpt-4-turbo', 'deepseek-chat'],
    retryAttempts: 3
  }
)
```

### Кэширование

```typescript
// Результаты автоматически кэшируются
const result1 = await aiService.analyzeMedia(file) // Первый запрос
const result2 = await aiService.analyzeMedia(file) // Из кэша

// Очистка кэша
aiService.clearCache()
```

### Потоковые ответы

```typescript
await aiService.streamRequest(
  'claude-4-sonnet-latest',
  messages,
  {
    onToken: (token) => console.log(token),
    onComplete: (response) => console.log('Done:', response),
    onError: (error) => console.error(error)
  }
)
```

## Тестирование

### Использование моков

```typescript
import { setupMockAIServices } from '@/shared/services/ai/__mocks__'

describe('My Feature', () => {
  let mockServices: any
  
  beforeEach(async () => {
    mockServices = await setupMockAIServices()
  })
  
  it('should analyze content', async () => {
    const result = await mockServices.aiService.sendRequest(
      'test-model',
      [{ role: 'user', content: 'test' }]
    )
    
    expect(result.content).toContain('Mock response')
  })
})
```

### Создание кастомных моков

```typescript
import { createMockProvider } from '@/shared/services/ai/__mocks__'

const customProvider = createMockProvider('custom', {
  response: { analysis: 'complete' },
  delay: 100
})

container.registerSingleton('CustomProvider', () => customProvider)
```

## Миграция с legacy кода

### Было (singleton паттерн)
```typescript
const claudeService = ClaudeService.getInstance()
const response = await claudeService.sendRequest(...)
```

### Стало (DI паттерн)
```typescript
const aiService = await container.resolve('UnifiedAIService')
const response = await aiService.sendRequest('claude-4-sonnet-latest', ...)
```

### Адаптер для обратной совместимости
```typescript
// Временный адаптер
export const claudeService = {
  getInstance: () => ({
    sendRequest: async (...args) => {
      const aiService = await getAIContainer().resolve('UnifiedAIService')
      return aiService.sendRequest('claude-4-sonnet-latest', ...args)
    }
  })
}
```

## Best Practices

1. **Используйте DI для новых фич**
   ```typescript
   // ✅ Хорошо
   const service = await container.resolve('ServiceName')
   
   // ❌ Плохо
   const service = ServiceName.getInstance()
   ```

2. **Объявляйте зависимости явно**
   ```typescript
   container.registerSingleton('MyService',
     (dep1, dep2) => new MyService(dep1, dep2),
     ['Dependency1', 'Dependency2'] // Явные зависимости
   )
   ```

3. **Используйте интерфейсы**
   ```typescript
   interface IMyService {
     doSomething(): Promise<void>
   }
   
   container.registerSingleton<IMyService>('MyService', ...)
   ```

4. **Обрабатывайте ошибки**
   ```typescript
   try {
     const response = await aiService.sendRequest(...)
   } catch (error) {
     if (error.code === 'PROVIDER_UNAVAILABLE') {
       // Обработка недоступности провайдера
     }
   }
   ```

## Troubleshooting

### "Service not registered"
```typescript
// Проверьте регистрацию
if (container.has('ServiceName')) {
  const service = await container.resolve('ServiceName')
}
```

### "Circular dependency detected"
```typescript
// Используйте lazy resolution
container.registerSingleton('ServiceA',
  () => ({
    getServiceB: () => container.resolve('ServiceB')
  })
)
```

### "Provider not available"
```typescript
// Проверьте статус провайдеров
const statuses = await aiService.getProviderStatuses()
console.log(statuses) // { claude: true, openai: false, ... }
```

## Дополнительные ресурсы

- [DI Container Guide](./DI-GUIDE.md) - Подробное руководство по DI
- [API Reference](./providers/interfaces.ts) - Справочник интерфейсов
- [Examples](../../features/ai-chat/examples/) - Примеры использования