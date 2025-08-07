# Архитектура AI сервисов Timeline Studio

## Обзор

Timeline Studio представляет собой мощную AI-powered платформу для видеомонтажа с **257 AI инструментами и сервисами**. После масштабного рефакторинга система использует централизованную архитектуру AI сервисов с Dependency Injection (DI) контейнером и интеграцией с внешними MCP сервисами.

### 📊 Статистика AI компонентов

- **🎯 Общее количество**: 257 AI инструментов и сервисов
- **✅ Готовые к использованию**: 185 инструментов (72%)
- **⚠️ В разработке**: 72 инструмента (28%)
- **🌐 Языковая поддержка**: 15 языков
- **🔗 MCP интеграция**: ruv-swarm сервис (23 функции)

## 🏗️ Архитектурная схема

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Application Layer                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   ai-chat       │  │ ai-content-intel │  │  recognition    │  │ transcription│ │
│  │   Module        │  │     Module       │  │     Module      │  │    Module   │ │
│  │                 │  │                  │  │                 │  │             │ │
│  │ • 77 AI Tools   │  │ • 30 Engines     │  │ • 14 Services   │  │ • 12 Services│ │
│  │ • Chat UI       │  │ • Scene Analysis │  │ • YOLO Data     │  │ • Whisper   │ │
│  │ • Automation    │  │ • Script Gen     │  │ • Context       │  │ • Enhanced  │ │
│  │ • Integration   │  │ • Classification │  │ • Visualization │  │ • Multi-lang│ │
│  └─────────┬───────┘  └─────────┬────────┘  └─────────┬───────┘  └──────┬──────┘ │
│            │                    │                     │                 │        │
├────────────┴────────────────────┴─────────────────────┴─────────────────┴────────┤
│                            Shared AI Services Layer                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           DI Container + MCP Integration                     │ │
│  │  • Service Registration & Resolution                                         │ │
│  │  • Lifecycle Management (Singleton/Transient)                              │ │
│  │  • Circular Dependency Detection                                           │ │
│  │  • 🔥 ruv-swarm MCP Service (23 функций, NO TIMEOUT)                      │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌──────────────────┐  ┌───────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │  AI Providers    │  │Media Analysis │  │ Orchestration  │  │ MCP Services  │ │
│  │                  │  │               │  │                │  │               │ │
│  │ • Claude Service │  │ • FFmpeg      │  │ • Unified AI   │  │ • ruv-swarm   │ │
│  │ • OpenAI Service │  │ • Vision/ONNX │  │ • Factories    │  │ • Neural Net  │ │
│  │ • DeepSeek Serv  │  │ • Content     │  │ • Adapters     │  │ • Forecasting │ │
│  │ • Ollama Service │  │ • YOLO        │  │ • File Select  │  │ • DAA Agents  │ │
│  └──────────────────┘  └───────────────┘  └────────────────┘  └───────────────┘ │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                      Additional AI Modules (91 Services)                    │ │
│  │  • Smart Montage Planner (42)  • Subtitle AI Tools  • Quality Analysis     │ │
│  │  • Performance Analysis        • Voice Recording AI  • Person ID            │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔥 MCP Интеграция (ruv-swarm)

Timeline Studio интегрирован с внешним MCP сервисом **ruv-swarm** - WASM-powered системой нейронной оркестровки агентов.

### Доступные ruv-swarm функции (23 инструмента)

```typescript
// Управление Swarm
mcp__ruv-swarm__swarm_init()        // Инициализация роя агентов
mcp__ruv-swarm__swarm_status()      // Статус роя
mcp__ruv-swarm__swarm_monitor()     // Мониторинг активности

// Управление Агентами  
mcp__ruv-swarm__agent_spawn()       // Создание агента
mcp__ruv-swarm__agent_list()        // Список агентов
mcp__ruv-swarm__agent_metrics()     // Метрики производительности

// Оркестровка Задач
mcp__ruv-swarm__task_orchestrate()  // Распределение задач
mcp__ruv-swarm__task_status()       // Статус выполнения
mcp__ruv-swarm__task_results()      // Результаты задач

// Нейронные Сети
mcp__ruv-swarm__neural_status()     // Статус нейросетей
mcp__ruv-swarm__neural_train()      // Обучение моделей
mcp__ruv-swarm__neural_patterns()   // Когнитивные паттерны

// DAA (Decentralized Autonomous Agents) - 10 функций
mcp__ruv-swarm__daa_init()          // Инициализация DAA
mcp__ruv-swarm__daa_agent_create()  // Создание автономного агента
mcp__ruv-swarm__daa_workflow_create() // Создание workflow
mcp__ruv-swarm__daa_knowledge_share() // Обмен знаниями
// и еще 6 DAA функций...
```

### 🚀 Особенности ruv-swarm

- **🔥 NO TIMEOUT VERSION**: Бесконечное время выполнения
- **🧠 WASM-powered**: Высокая производительность через WebAssembly
- **🤖 Neural Networks**: 18 activation functions, 5 training algorithms
- **📊 Forecasting**: 27 доступных моделей
- **🎯 Cognitive Diversity**: 5 паттернов мышления

### Статус загрузки WASM модулей:
- ✅ **core**: 512KB (загружен)
- ✅ **neural**: 1MB (загружен)
- ✅ **forecasting**: 1.5MB (загружен)  
- ⏳ **swarm**: 768KB (не загружен)
- ⏳ **persistence**: 256KB (не загружен)

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

## 🚀 Преимущества архитектуры

### 1. Масштабная AI Экосистема
- **257 AI инструментов и сервисов** - одна из крупнейших AI экосистем
- **72% готовых инструментов** - высокая степень готовности
- **15 языков поддержки** - глобальная локализация
- **MCP интеграция** - внешние AI сервисы через ruv-swarm

### 2. Устранение дублирования
- **До**: 40-50% дублирования кода между модулями
- **После**: <5% дублирования
- **Результат**: Упрощение поддержки и развития

### 3. Производительность
- **20% ускорение сборки** за счет устранения дублирования
- **15% уменьшение bundle size** благодаря оптимизации импортов
- **Улучшенное кэширование** результатов анализа
- **WASM-powered вычисления** через ruv-swarm

### 4. Масштабируемость
- **Легкое добавление новых AI провайдеров** через регистрацию в DI
- **Простая интеграция новых модулей** через shared services
- **MCP расширяемость** - внешние сервисы без изменения кода
- **Возможность миграции на микросервисы** в будущем

### 5. Надежность
- **Fallback механизмы** между AI провайдерами
- **Retry логика** для временных сбоев
- **Graceful degradation** при недоступности сервисов
- **🔥 NO TIMEOUT режим** в ruv-swarm для критических задач

### 6. Интеллектуальные возможности
- **Neural Networks**: 18 функций активации, 5 алгоритмов обучения
- **Forecasting**: 27 моделей прогнозирования
- **Cognitive Diversity**: 5 паттернов мышления
- **DAA Agents**: Децентрализованные автономные агенты

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

### Использование ruv-swarm MCP

```typescript
// Инициализация swarm для сложных AI задач
const swarmResult = await mcp__ruv-swarm__swarm_init({
  topology: "mesh",
  maxAgents: 5,
  strategy: "adaptive"
})

// Создание специализированных агентов
await mcp__ruv-swarm__agent_spawn({
  type: "analyst",
  name: "Video Analyzer",
  capabilities: ["scene_detection", "object_tracking"]
})

await mcp__ruv-swarm__agent_spawn({
  type: "coder", 
  name: "Effect Generator",
  capabilities: ["css_effects", "webgl_shaders"]
})

// Оркестровка сложной задачи
const taskResult = await mcp__ruv-swarm__task_orchestrate({
  task: "Analyze video and generate smart montage with effects",
  strategy: "parallel",
  priority: "high"
})

// Мониторинг выполнения
const status = await mcp__ruv-swarm__task_status({
  taskId: taskResult.taskId,
  detailed: true
})
```

### Интеграция с файловым браузером

```typescript
import { useBrowserAIIntegration } from '@/features/ai-chat/hooks/use-browser-ai-integration'

function MyComponent() {
  const { getSelectedFiles, getBrowserStats } = useBrowserAIIntegration()
  
  const handleAIProcessing = async () => {
    const selectedFiles = getSelectedFiles() // Теперь работает с реальным выбором!
    const stats = getBrowserStats() // Корректный подсчет выбранных файлов
    
    // Отправка в ruv-swarm для обработки
    await mcp__ruv-swarm__task_orchestrate({
      task: `Process ${selectedFiles.length} selected media files`,
      strategy: "adaptive"
    })
  }
}
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

### Базовые улучшения
1. **Автоматическая регистрация** сервисов через декораторы
2. **Профилирование** времени создания сервисов
3. **Визуализация** графа зависимостей
4. **Hot reload** для сервисов в dev режиме
5. **Distributed tracing** для отладки

### ruv-swarm расширения
6. **Полная загрузка WASM модулей** - активация swarm и persistence модулей
7. **Визуальная панель управления** ruv-swarm агентами в Timeline Studio
8. **Автоматическое распределение** AI задач по доступным агентам
9. **Персистентное обучение** нейронных паттернов между сессиями
10. **Интеграция DAA workflows** с существующими инструментами Timeline

### AI Ecosystem расширения
11. **Достижение 300+ AI инструментов** - расширение до крупнейшей экосистемы
12. **Завершение оставшихся 28%** AI модулей в разработке
13. **Межмодульная оркестровка** - координация между всеми 257 инструментами
14. **AI Performance Dashboard** - мониторинг производительности всех AI сервисов
15. **Advanced Cognitive Patterns** - новые паттерны мышления для агентов

## 📚 Связанная документация

- [DI Container Guide](/src/shared/services/ai/DI-GUIDE.md)
- [Migration Guide](/src/shared/services/ai/MIGRATION-GUIDE.md)
- [AI Chat Module](/src/features/ai-chat/README.md)
- [AI Content Intelligence Module](/src/features/ai-content-intelligence/README.md)