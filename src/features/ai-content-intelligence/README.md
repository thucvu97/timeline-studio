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
- Анализ композиции и качества (правило третей, баланс, направляющие линии)
- Определение ключевых моментов
- Классификация контента
- **NEW:** Интеграция с Person Identification для распознавания персонажей
- **NEW:** OCR (оптическое распознавание текста)
- **NEW:** Анализ активности и движения

### 2. Script Generation Engine
- Автоматическая генерация скриптов
- Поддержка различных стилей повествования
- Адаптация под жанр контента
- Генерация диалогов и закадрового текста
- **NEW:** Интеграция с montage-planner для использования реальных персонажей из видео
- **NEW:** Адаптация сценария под инструкции о персонажах

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
  detectPersons(mediaPath: string, timerange?: { start: number; end: number }): Promise<DetectedFace[]>
  getDetectedPersonsForVideo(videoPath: string): Person[]
  clearPersonCache(): void
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

interface SceneAnalysisResult {
  scenes: SceneAnalysis[]
  keyMoments: KeyMoment[]
  classification: ContentClassification
  summary: SceneSummary
  timeline: TimelineData
  // Интеграция с montage-planner
  persons?: Person[]
  fragments?: Fragment[]
  personStats?: PersonStatistics
}

interface GeneratedScript {
  id: string
  title: string
  genre: string[]
  duration: number
  structure: NarrativeStructure
  scenes: ScriptScene[]
  characters: Character[]
  dialogue: Dialogue[]
  voiceover: Voiceover[]
  metadata: ScriptMetadata & {
    // Интеграция с персонажами
    personStats?: PersonStatistics
    detectedPersonsCount?: number
    adaptedForPersons?: boolean
    personInstructions?: string
  }
}
```

## 🎨 UI Компоненты

### UnifiedDashboard
Главная панель управления AI функциями с вкладками:
- Overview - общий обзор анализа
- Pipeline - управление процессом обработки
- Results - детальные результаты анализа
- Scripts - сгенерированные сценарии
- Metrics - метрики качества

### GenerationWizard
Мастер генерации контента с поддержкой:
- Выбор стиля повествования
- Настройка визуального стиля
- Выбор эмоционального тона
- Использование шаблонов

### AnalysisViewer
Компонент для отображения результатов анализа:
- Визуализация сцен и ключевых моментов
- Отображение обнаруженных объектов и персонажей
- Показ качественных метрик
- Предложения по улучшению

### PreviewGrid
Сетка превью контента с возможностями:
- Отображение миниатюр сцен
- Индикаторы качества
- Выбор сцен для обработки
- Группировка по типам контента

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

## 🔗 Интеграции

### Person Identification
Модуль тесно интегрирован с системой распознавания персонажей:
- Автоматическое обнаружение лиц в видео
- Создание профилей персонажей
- Отслеживание появлений в сценах
- Использование в генерации сценариев

### Montage Planner
Интеграция с планировщиком монтажа:
- Создание Fragment объектов для каждой сцены
- Передача информации о персонажах
- Расчет релевантности сцен
- Оценка качества фрагментов

## 🔮 Roadmap

- [x] Интеграция с Person Identification
- [x] Интеграция с Montage Planner
- [x] OCR и анализ текста в видео
- [x] Продвинутый анализ композиции
- [ ] Поддержка большего количества AI моделей
- [ ] Улучшение точности детекции объектов
- [ ] Real-time анализ во время записи
- [ ] Экспорт аналитики в различные форматы
- [ ] Интеграция с облачными AI сервисами
- [ ] Автоматическая генерация субтитров из OCR