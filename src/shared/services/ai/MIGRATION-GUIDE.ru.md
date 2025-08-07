# Руководство по миграции AI сервисов

Это руководство поможет перевести существующий код на новую архитектуру shared AI services.

## 🚀 Обзор изменений

### Что изменилось:
1. **AI провайдеры** перенесены в `@/shared/services/ai/providers/`
2. **Сервисы анализа** перенесены в `@/shared/services/ai/analysis/`
3. **Единый DI контейнер** для управления зависимостями
4. **Унифицированные интерфейсы** для всех AI сервисов

### Преимущества:
- Устранено дублирование кода (сокращение ~45%)
- Решены проблемы циклических зависимостей
- Улучшена тестируемость
- Единая точка конфигурации

## 📦 Шаг 1: Обновление импортов

### Старый способ:
```typescript
// ❌ Старые импорты из ai-chat
import { ClaudeService } from "@/features/ai-chat/services/claude-service"
import { OpenAIService } from "@/features/ai-chat/services/open-ai-service"
import { FFmpegAnalysisService } from "@/features/ai-chat/services/ffmpeg-analysis-service"

// ❌ Старые импорты из ai-content-intelligence
import { ClaudeProvider } from "@/features/ai-content-intelligence/providers/claude-provider"
```

### Новый способ:
```typescript
// ✅ Новые импорты из shared
import { getAIContainer } from "@/shared/services/ai"
import type { 
  IUnifiedAIService,
  IFFmpegAnalysisService,
  IVisionService,
  IContentAnalysisService 
} from "@/shared/services/ai"
```

## 🔧 Шаг 2: Миграция с паттерна singleton на DI

### Старый способ:
```typescript
// ❌ Паттерн Singleton
class MyService {
  private static instance: MyService
  private claudeService: ClaudeService
  
  private constructor() {
    this.claudeService = ClaudeService.getInstance()
  }
  
  static getInstance(): MyService {
    if (!MyService.instance) {
      MyService.instance = new MyService()
    }
    return MyService.instance
  }
}
```

### Новый способ:
```typescript
// ✅ Внедрение зависимостей (DI)
class MyService {
  private aiService: IUnifiedAIService
  
  constructor(aiService: IUnifiedAIService) {
    this.aiService = aiService
  }
}

// Регистрация в DI контейнере
const container = getAIContainer()
container.registerSingleton('MyService', 
  async () => {
    const aiService = await container.resolve<IUnifiedAIService>('UnifiedAIService')
    return new MyService(aiService)
  },
  { dependencies: ['UnifiedAIService'] }
)
```

## 🎯 Шаг 3: Использование унифицированного AI сервиса

### Старый способ:
```typescript
// ❌ Прямое использование провайдеров
const claude = ClaudeService.getInstance()
const response = await claude.sendRequest(messages, {
  model: "claude-4-sonnet",
  temperature: 0.7
})
```

### Новый способ:
```typescript
// ✅ Через унифицированный сервис
const container = getAIContainer()
const aiService = await container.resolve<IUnifiedAIService>('UnifiedAIService')

const response = await aiService.sendRequest(
  'claude-4-sonnet-latest',
  messages,
  { temperature: 0.7 }
)
```

## 🔄 Шаг 4: Миграция FFmpeg анализа

### Старый способ:
```typescript
// ❌ Прямое использование
const ffmpeg = new FFmpegAnalysisService()
const analysis = await ffmpeg.analyzeVideo(videoPath)
```

### Новый способ:
```typescript
// ✅ Через DI контейнер
const container = getAIContainer()
const ffmpegService = await container.resolve<IFFmpegAnalysisService>('FFmpegService')

const analysis = await ffmpegService.analyzeVideo({
  path: videoPath,
  name: 'video.mp4'
})
```

## 🖼️ Шаг 5: Миграция анализа изображений (Vision)

### Старый способ:
```typescript
// ❌ Встроенный GPT-4V анализ
const analysisResult = await this.callGPT4Vision({
  model: "gpt-4o",
  messages: [/* ... */]
}, apiKey)
```

### Новый способ:
```typescript
// ✅ Через Vision Service
const container = getAIContainer()
const visionService = await container.resolve<IVisionService>('VisionService')

const analysis = await visionService.analyzeFrame(
  imagePath,
  { 
    prompt: "Проанализируй этот кадр",
    analysisType: "scene_understanding"
  }
)
```

## ⚛️ Шаг 6: React компоненты

### Старый способ:
```typescript
// ❌ Прямое использование сервисов
export function MyComponent() {
  const [result, setResult] = useState(null)
  
  const analyze = async () => {
    const service = ClaudeService.getInstance()
    const res = await service.sendRequest(/* ... */)
    setResult(res)
  }
  
  return <button onClick={analyze}>Анализировать</button>
}
```

### Новый способ:
```typescript
// ✅ Использование React хуков
import { useAIService } from "@/shared/services/ai/react-integration"

export function MyComponent() {
  const aiService = useAIService()
  const [result, setResult] = useState(null)
  
  const analyze = async () => {
    if (!aiService) return
    const res = await aiService.sendRequest(/* ... */)
    setResult(res)
  }
  
  return <button onClick={analyze}>Анализировать</button>
}

// В корне приложения
import { AIServicesProvider } from "@/shared/services/ai/react-integration"

function App() {
  return (
    <AIServicesProvider>
      <YourApp />
    </AIServicesProvider>
  )
}
```

## 🏭 Шаг 7: Миграция движков AI Content Intelligence

### Старый способ:
```typescript
// ❌ Прямое создание движков
const sceneEngine = new SceneAnalysisEngine()
const scriptEngine = new ScriptGenerationEngine()
```

### Новый способ:
```typescript
// ✅ Через фабрику движков
import { getEngineFactory } from "@/features/ai-content-intelligence/factories/engine-factory"

const engineFactory = getEngineFactory()
const engines = await engineFactory.createAllEngines()

// Использование
const scenes = await engines.sceneEngine.analyzeScenes(mediaFile)
const script = await engines.scriptEngine.generateScript(context, params)
```

## 🔍 Шаг 8: Обновление тестов

### Старый способ:
```typescript
// ❌ Мокирование конкретных сервисов
jest.mock("@/features/ai-chat/services/claude-service")
```

### Новый способ:
```typescript
// ✅ Использование shared моков
import { mockAIContainer } from "@/shared/services/ai/__mocks__/di-container"

beforeEach(() => {
  // Мок контейнер уже настроен с тестовыми сервисами
  const container = mockAIContainer
})
```

## 📋 Чек-лист миграции

- [ ] Обновить все импорты AI провайдеров на shared
- [ ] Заменить паттерны singleton на DI
- [ ] Перейти на UnifiedAIService
- [ ] Обновить FFmpeg анализ
- [ ] Обновить Vision анализ  
- [ ] Добавить AIServicesProvider в React приложение
- [ ] Обновить создание движков через фабрику
- [ ] Обновить тесты с новыми моками

## ⚠️ Важные примечания

1. **Обратная совместимость**: Старые функции вроде `executeTimelineTool` сохранены для совместимости
2. **Конфигурация**: API ключи по-прежнему загружаются через ApiKeyLoader
3. **Ленивая загрузка**: Сервисы загружаются по требованию для оптимизации
4. **Fallback механизм**: UnifiedAIService автоматически переключается между провайдерами при ошибках

## 🆘 Решение проблем

### Ошибка: "Service not found in container"
```typescript
// Убедитесь, что сервис зарегистрирован
const container = getAIContainer()
await container.initialize() // Важно!
```

### Ошибка: "Circular dependency detected"
```typescript
// Проверьте зависимости при регистрации
container.register('ServiceA', factory, {
  dependencies: ['ServiceB'] // ServiceB не должен зависеть от ServiceA
})
```

### Ошибки типов TypeScript
```typescript
// Используйте приведение типов где необходимо
const service = await container.resolve('MyService') as IMyService
```

## 📚 Дополнительные ресурсы

- [Руководство по DI контейнеру](./DI-GUIDE.md) - подробное руководство по DI
- [Справочник API](./README.ru.md) - документация по API
- [Примеры](./examples/) - примеры использования

## 🎉 Готово!

После выполнения всех шагов ваш код будет использовать новую архитектуру shared AI services. Это обеспечит:

- Улучшенную организацию кода
- Простое тестирование
- Гибкую конфигурацию
- Отсутствие дублирования кода

При возникновении вопросов обращайтесь к документации или создавайте issue в репозитории проекта.