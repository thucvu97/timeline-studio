# AI Content Intelligence Module

Модуль интеллектуального анализа контента с использованием AI для Timeline Studio.

## 🎯 Назначение

AI Content Intelligence предоставляет комплексные возможности для автоматического анализа видео контента, генерации скриптов, адаптации под различные платформы и создания интеллектуальных маркеров на основе AI анализа.

## 🏗️ Архитектура

```
ai-content-intelligence/
├── components/           # React компоненты UI
├── engines/             # Движки анализа и обработки
│   ├── multi-platform/  # Адаптация под платформы
│   ├── scene-analysis/  # Анализ сцен и видео
│   └── script-generation/ # Генерация скриптов
├── hooks/               # React хуки
├── orchestrator/        # Координатор AI процессов
├── shared/              # Общие типы и сервисы
└── index.ts            # Публичный API модуля
```

## 🚀 Основные возможности

### 1. Scene Analysis Engine
- Детекция смены сцен
- Распознавание объектов (YOLO/ONNX)
- Анализ композиции и качества
- Определение ключевых моментов
- Классификация контента

### 2. Script Generation Engine
- Автоматическая генерация скриптов
- Поддержка различных стилей повествования
- Адаптация под жанр контента
- Генерация диалогов и закадрового текста

### 3. Multi-Platform Adaptation
- YouTube (длинные видео, оптимизация SEO)
- TikTok (короткие вертикальные видео)
- Instagram (Reels, Stories, посты)
- Telegram (видео сообщения, каналы)
- Twitter/X (короткие клипы)

### 4. AI Intelligence Orchestrator
- Координация всех AI движков
- XState машина состояний
- Управление pipeline обработки
- Интеграция с UnifiedAIService (68+ AI инструментов)

## 📦 Установка и настройка

### Зависимости

```bash
# Основные зависимости (уже установлены)
- xstate v5
- onnxruntime-web
- @tensorflow/tfjs (опционально)

# Для ONNX Runtime на macOS:
brew install onnxruntime
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

### Конфигурация

```typescript
const aiConfig: AIConfig = {
  providers: [{
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY
  }],
  features: {
    sceneAnalysis: true,
    scriptGeneration: true,
    multiPlatform: true,
    contentClassification: true,
    objectDetection: true
  },
  processing: {
    parallel: true,
    maxConcurrent: 3,
    cacheResults: true
  }
}
```

## 🔧 Использование

### Базовый анализ контента

```typescript
import { AIIntelligenceOrchestrator } from '@/features/ai-content-intelligence'

const orchestrator = new AIIntelligenceOrchestrator()
await orchestrator.initialize()

const result = await orchestrator.analyzeContent({
  mediaFile: {
    path: '/path/to/video.mp4',
    filename: 'video.mp4',
    duration: 120
  }
})
```

### Интеграция с Timeline

```typescript
import { useTimelineAIAnalysis } from '@/features/timeline/hooks/use-timeline-ai-analysis'

function TimelineComponent() {
  const aiAnalysis = useTimelineAIAnalysis()
  
  // Анализ клипа
  await aiAnalysis.analyzeClip(clip)
  
  // Создание маркеров
  await aiAnalysis.generateMarkersFromAnalysis()
}
```

### Адаптация под платформы

```typescript
import { MultiPlatformEngine } from '@/features/ai-content-intelligence/engines/multi-platform'

const engine = new MultiPlatformEngine()
const adapted = await engine.adaptContent(analysis, ['youtube', 'tiktok'])
```

## 🔌 API Reference

### AIIntelligenceOrchestrator

```typescript
class AIIntelligenceOrchestrator {
  initialize(): Promise<void>
  analyzeContent(input: MediaInput): Promise<UnifiedContentAnalysis>
  processProject(files: MediaFile[], config: AIConfig): Promise<IntelligentContent>
  getProgress(): PipelineProgress
  pause(): void
  resume(): void
  cancel(): void
}
```

### SceneAnalysisEngine

```typescript
class SceneAnalysisEngine {
  process(data: { mediaFile: MediaFile }): Promise<SceneAnalysisResult>
  analyzeFrame(imageData: ImageData): Promise<FrameAnalysis>
  detectObjects(imageData: ImageData): Promise<ObjectDetection[]>
}
```

### Типы данных

```typescript
interface UnifiedContentAnalysis {
  id: string
  mediaFile: MediaFileInfo
  scenes: SceneAnalysis[]
  keyMoments: KeyMoment[]
  classification: ContentClassification
  qualityMetrics: QualityMetrics
  audioAnalysis: AudioAnalysis
  visualAnalysis: VisualAnalysis
  insights: ContentInsights
  suggestions: ContentSuggestion[]
  metadata: AnalysisMetadata
}
```

## 🎨 UI Компоненты

### UnifiedDashboard
Главная панель управления AI функциями с вкладками для анализа, скриптов и платформ.

### AIMarkerControls
Компонент для создания маркеров на Timeline из AI анализа.

### PipelineStatus
Отображение прогресса обработки AI pipeline.

## 🧪 Тестирование

```bash
# Запуск тестов модуля
bun test src/features/ai-content-intelligence

# Тестирование с покрытием
bun test:coverage src/features/ai-content-intelligence
```

## 🔐 Безопасность

- API ключи хранятся в переменных окружения
- Локальная обработка видео (без отправки на серверы)
- ONNX модели работают в браузере
- Кэширование результатов с настраиваемым TTL

## 📈 Производительность

- Параллельная обработка нескольких видео
- Ленивая загрузка ONNX моделей
- Оптимизация памяти для больших видео
- Web Workers для тяжелых вычислений

## 🚧 Известные ограничения

1. ONNX Runtime требует установки нативных библиотек
2. Большие видео (>2GB) могут требовать много памяти
3. Некоторые AI модели работают только с определенными форматами
4. Скорость обработки зависит от мощности GPU

## 🔮 Roadmap

- [ ] Поддержка большего количества AI моделей
- [ ] Улучшение точности детекции объектов
- [ ] Real-time анализ во время записи
- [ ] Экспорт аналитики в различные форматы
- [ ] Интеграция с облачными AI сервисами