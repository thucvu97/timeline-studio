# AI Content Intelligence Engines

Движки для анализа и обработки контента с использованием AI.

## 📁 Структура

```
engines/
├── multi-platform/      # Адаптация контента под платформы
├── scene-analysis/      # Анализ сцен и видео
├── script-generation/   # Генерация скриптов
└── README.md
```

## 🚀 Движки

### Scene Analysis Engine

Анализ видео контента с использованием computer vision и AI.

**Возможности:**
- Детекция смены сцен через FFmpeg
- Распознавание объектов (YOLO via ONNX)
- Анализ композиции кадров
- Определение качества видео
- Классификация типов сцен
- Поиск ключевых моментов

**Использование:**
```typescript
import { SceneAnalysisEngine } from './scene-analysis'

const engine = new SceneAnalysisEngine()
await engine.initialize()

const result = await engine.process({
  mediaFile: {
    path: '/path/to/video.mp4',
    name: 'video.mp4',
    duration: 120
  }
})

// Результат содержит:
// - scenes: массив обнаруженных сцен
// - keyMoments: важные моменты
// - classification: тип контента и жанры
// - timeline: временная разметка
```

### Script Generation Engine

Генерация скриптов и текстового контента на основе анализа.

**Возможности:**
- Генерация скриптов разных стилей
- Создание диалогов
- Написание закадрового текста
- Адаптация под жанр
- Поддержка разных языков
- SEO оптимизация

**Использование:**
```typescript
import { ScriptGenerationEngine } from './script-generation'

const engine = new ScriptGenerationEngine()

const script = await engine.generateScript(
  sceneAnalysis,
  {
    style: 'documentary',
    tone: 'professional',
    targetAudience: 'general',
    duration: 120,
    language: 'ru'
  }
)
```

### Multi-Platform Engine

Адаптация контента под требования различных платформ.

**Поддерживаемые платформы:**
- YouTube (длинные видео, Shorts)
- TikTok (вертикальные видео)
- Instagram (Reels, Stories, IGTV)
- Telegram (видео сообщения)
- Twitter/X (короткие клипы)

**Использование:**
```typescript
import { MultiPlatformEngine } from './multi-platform'

const engine = new MultiPlatformEngine()

const adaptations = await engine.adaptContent(
  unifiedAnalysis,
  ['youtube', 'tiktok', 'instagram']
)

// Для каждой платформы:
adaptations.youtube.recommendations // рекомендации
adaptations.youtube.metadata // метаданные
adaptations.youtube.optimizedContent // оптимизированный контент
```

## 🔧 Конфигурация движков

### Scene Analysis Config

```typescript
const config: SceneAnalysisConfig = {
  ffmpeg: {
    sceneThreshold: 0.3,      // Чувствительность детекции сцен
    minSceneLength: 2,        // Мин. длина сцены в секундах
    keyframeInterval: 1,      // Интервал ключевых кадров
    qualitySampleRate: 2      // Частота анализа качества
  },
  vision: {
    enableObjectDetection: true,
    enableFaceDetection: true,
    enableTextRecognition: false,
    objectConfidenceThreshold: 0.7,
    maxObjectsPerFrame: 10
  },
  ai: {
    enableSmartCropping: true,
    enableContentModeration: true,
    enableEmotionDetection: true
  }
}
```

### Script Generation Config

```typescript
const config: ScriptGenerationConfig = {
  model: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7,
  styles: {
    narrative: { pacing: 'dynamic', detail: 'high' },
    documentary: { pacing: 'steady', detail: 'factual' },
    tutorial: { pacing: 'clear', detail: 'step-by-step' }
  }
}
```

### Platform Configs

```typescript
const platformConfigs = {
  youtube: {
    maxDuration: 3600,
    optimalDuration: 600,
    aspectRatio: '16:9',
    minResolution: '1080p',
    features: ['chapters', 'endscreen', 'cards']
  },
  tiktok: {
    maxDuration: 180,
    optimalDuration: 30,
    aspectRatio: '9:16',
    minResolution: '720p',
    features: ['effects', 'music', 'captions']
  }
}
```

## 🧠 AI Модели

### ONNX Models
- **YOLO v8**: Детекция объектов
- **Face Detection**: Распознавание лиц
- **Scene Classification**: Классификация сцен

### Загрузка моделей

```typescript
// Модели загружаются автоматически при первом использовании
// Кэшируются в IndexedDB для быстрого доступа

const engine = new SceneAnalysisEngine()
await engine.initialize() // Загрузка моделей

// Проверка статуса
const modelsLoaded = engine.areModelsReady()
```

## 📊 Метрики производительности

- Scene Analysis: ~2-5 сек на минуту видео
- Script Generation: ~3-10 сек в зависимости от длины
- Platform Adaptation: <1 сек на платформу
- Object Detection: ~100ms на кадр

## 🔌 Интеграция

Все движки интегрированы с:
- `AIIntelligenceOrchestrator` - координация работы
- `UnifiedAIService` - доступ к 68+ AI инструментам
- `FFmpegAnalysisService` - анализ медиа файлов

## ⚠️ Требования

- Браузер с поддержкой WebGL (для ONNX)
- Минимум 4GB RAM для больших видео
- Стабильное интернет-соединение для AI API
- FFmpeg в системе (для Tauri версии)