# Smart Montage Planner - Умный планировщик монтажа

## Обзор

Smart Montage Planner - это AI-powered инструмент для автоматического создания монтажных планов на основе загруженного контента. Анализирует видео и аудио материалы, выявляет лучшие моменты и предлагает оптимальную структуру монтажа с учетом ритма, эмоций и целей проекта.

Модуль интегрирует современные модели машинного обучения (YOLO для визуального анализа), FFmpeg для обработки медиа и генетические алгоритмы для оптимизации, создавая профессиональные монтажные планы.

## Ключевые возможности

### 🎯 Основные функции
- **Автоматизация планирования** - От хаоса материалов к структуре
- **Интеллектуальный анализ** - Понимание содержания и качества
- **Ритм и динамика** - Создание engaging последовательностей
- **Адаптивность** - Подстройка под жанр и платформу

### 🔧 Технические возможности
- Автоматический анализ всех материалов проекта
- Генерация монтажных планов с настраиваемыми стилями
- Детекция лучших моментов и ключевых кадров
- Рекомендации по ритму и переходам
- Адаптация под разные форматы и платформы
- Real-time превью с метриками качества
- Интеграция с Timeline в один клик

## Архитектура

### Структура Frontend
```
src/features/montage-planner/
├── components/
│   ├── planner-dashboard/     # Главная панель управления
│   │   ├── project-analyzer.tsx
│   │   ├── plan-viewer.tsx
│   │   ├── suggestions.tsx
│   │   └── integrated-planner-dashboard.tsx
│   ├── analysis/              # Компоненты анализа контента
│   │   ├── quality-meter.tsx
│   │   ├── moment-detector.tsx
│   │   └── emotion-graph.tsx
│   ├── editor/                # Компоненты редактирования планов
│   │   ├── sequence-builder.tsx
│   │   ├── timing-adjuster.tsx
│   │   └── style-controller.tsx
│   └── montage-planner.tsx    # Главный компонент
├── hooks/
│   ├── use-montage-planner.ts    # Основной хук
│   ├── use-content-analysis.ts   # Анализ контента
│   ├── use-plan-generator.ts     # Генерация планов
│   ├── use-timeline-integration.ts # Интеграция с Timeline
│   ├── use-montage-backend.ts    # Связь с backend
│   └── use-integrated-analysis.ts # Интегрированный анализ
├── services/
│   ├── montage-planner-machine.ts    # XState машина
│   ├── montage-planner-provider.tsx  # React провайдер
│   ├── content-analyzer.ts           # Сервис анализа контента
│   ├── moment-detector.ts            # Детектор ключевых моментов
│   ├── plan-generator.ts             # Сервис генерации планов
│   ├── rhythm-calculator.ts          # Расчет ритма
│   └── timeline-integration-service.ts # Интеграция с Timeline
└── types/
    └── index.ts                      # TypeScript определения
```

### Интеграция с Backend (Rust/Tauri)
Модуль интегрируется с backend сервисами на Rust:
- **YOLO интеграция** - Детекция объектов и анализ сцен
- **FFmpeg обработка** - Анализ качества видео/аудио
- **Генетический алгоритм** - Оптимизация планов с адаптивной мутацией
- **Оптимизация производительности** - Параллельная обработка и кэширование

## Основные типы

### Анализ видео
```typescript
interface VideoAnalysis {
  quality: {
    resolution: Resolution;
    frameRate: number;
    bitrate: number;
    sharpness: number;      // 0-100
    stability: number;      // 0-100
    exposure: number;       // -100 to 100
    colorGrading: number;   // 0-100
  };
  content: {
    actionLevel: number;    // 0-100
    faces: FaceDetection[];
    objects: ObjectDetection[];
    sceneType: SceneType;
    lighting: LightingCondition;
  };
  motion: {
    cameraMovement: CameraMovement;
    subjectMovement: number;  // 0-100
    flowDirection: FlowDirection;
    cutFriendliness: number;  // 0-100
  };
}
```

### Оценка моментов
```typescript
interface MomentScore {
  timestamp: Timecode;
  duration: Duration;
  scores: {
    visual: number;         // Визуальная привлекательность
    technical: number;      // Техническое качество
    emotional: number;      // Эмоциональное воздействие
    narrative: number;      // Повествовательная ценность
    action: number;         // Уровень действия
    composition: number;    // Композиция кадра
  };
  totalScore: number;       // 0-100
  category: MomentCategory;
  tags: string[];
}
```

### Монтажный план
```typescript
interface MontagePlan {
  id: string;
  metadata: PlanMetadata;
  sequences: Sequence[];
  totalDuration: Duration;
  style: MontageStyle;
  pacing: PacingProfile;
  qualityScore: number;
  engagementScore: number;
  coherenceScore: number;
}
```

## Использование

### Базовая настройка
```typescript
import { MontagePlannerProvider } from '@/features/montage-planner'

function App() {
  return (
    <MontagePlannerProvider>
      <YourComponent />
    </MontagePlannerProvider>
  )
}
```

### Использование основного хука
```typescript
import { useMontagePlanner } from '@/features/montage-planner/hooks'

function PlannerComponent() {
  const {
    state,
    analysis,
    plans,
    analyzeProject,
    generatePlan,
    optimizePlan,
    applyToTimeline,
    isLoading,
    error
  } = useMontagePlanner()

  const handleAnalyze = async () => {
    await analyzeProject()
  }

  const handleGenerate = async () => {
    const plan = await generatePlan({
      style: 'cinematic-drama',
      targetDuration: 300, // 5 минут
      quality: 'high'
    })
  }

  return (
    <div>
      <button onClick={handleAnalyze}>Анализировать проект</button>
      <button onClick={handleGenerate}>Создать план</button>
    </div>
  )
}
```

### Анализ контента
```typescript
import { useContentAnalysis } from '@/features/montage-planner/hooks'

function AnalysisComponent() {
  const {
    videoAnalysis,
    audioAnalysis,
    moments,
    analyzeVideo,
    analyzeAudio,
    detectMoments
  } = useContentAnalysis()

  // Анализ конкретного медиафайла
  const handleAnalyze = async (mediaFile: MediaFile) => {
    const video = await analyzeVideo(mediaFile)
    const audio = await analyzeAudio(mediaFile)
    const keyMoments = await detectMoments(mediaFile)
  }
}
```

### Интеграция с Timeline
```typescript
import { useTimelineIntegration } from '@/features/montage-planner/hooks'

function IntegrationComponent() {
  const { applyPlanToTimeline, createMarkersFromPlan } = useTimelineIntegration()

  const handleApplyPlan = async (plan: MontagePlan) => {
    await applyPlanToTimeline(plan)
    // План автоматически применяется к текущему timeline
  }

  const handleCreateMarkers = (plan: MontagePlan) => {
    createMarkersFromPlan(plan)
    // Создаются маркеры timeline для структуры плана
  }
}
```

## Доступные стили

Планировщик включает несколько предустановленных стилей монтажа:

- **Dynamic Action** - Быстрый ритм, много переходов
- **Cinematic Drama** - Медленный темп, эмоциональные паузы
- **Music Video** - Синхронизация с битом
- **Documentary** - Естественный ритм, информативность
- **Social Media** - Fast-paced, привлечение внимания
- **Corporate** - Профессиональный, размеренный темп

### Создание пользовательского стиля
```typescript
const customStyle: MontageStyle = {
  name: 'Мой стиль',
  description: 'Пользовательский стиль монтажа',
  cutting: {
    averageShotLength: 2.5,
    variability: 0.3,
    rhythmComplexity: 0.7,
  },
  transitions: {
    preferredTypes: ['fade', 'cut', 'dissolve'],
    frequency: 0.6,
    complexity: 0.5,
  },
  emotionalArc: {
    startEnergy: 30,
    peakPosition: 0.7,
    endEnergy: 20,
    variability: 0.4,
  },
}
```

## Backend команды

Модуль предоставляет Tauri команды для интеграции с backend:

```rust
// Анализ композиции видео с YOLO
analyze_video_composition(video_path, processor_id, options)

// Детекция ключевых моментов
detect_key_moments(detections, quality_scores)

// Генерация монтажного плана
generate_montage_plan(moments, config, source_files)

// Анализ качества видео
analyze_video_quality(video_path)

// Анализ качества кадра
analyze_frame_quality(video_path, timestamp)

// Анализ аудио контента
analyze_audio_content(audio_path)
```

## Тестирование

Модуль включает комплексные тесты:

```bash
# Запуск всех тестов montage planner
bun run test src/features/montage-planner

# Запуск конкретных наборов тестов
bun run test src/features/montage-planner/__tests__/services/
bun run test src/features/montage-planner/__tests__/hooks/
bun run test src/features/montage-planner/__tests__/components/
```

### Структура тестов
- **Service Tests** - Машина состояний, анализ контента, детекция моментов
- **Hook Tests** - React хуки и управление состоянием
- **Component Tests** - UI компоненты и интеграция
- **Mock Data** - Комплексные тестовые утилиты и mock данные

## Интеграция с другими модулями

- **YOLO Recognition** ✅ - Полная интеграция для детекции объектов
- **FFmpeg** ✅ - Прямые вызовы для анализа видео/аудио
- **Timeline** ✅ - Готово для применения планов
- **AI Multi-Platform** - Готово для интеграции через API
- **DI Container** ✅ - Интеграция через централизованную AI архитектуру
- **Unified AI Service** ✅ - Использование единого AI сервиса для анализа
- **Media Analysis Factory** ✅ - Доступ к YOLO/FFmpeg через фабрику

### AI Интеграция

Модуль теперь полностью интегрирован с централизованной AI архитектурой через `montage-planner-ai-integration.ts`:

```typescript
import { useMontagePlannerAI } from '@/features/montage-planner/services/montage-planner-ai-integration'

function MyComponent() {
  const aiService = useMontagePlannerAI()
  
  // Использование AI сервисов
  const videoAnalysis = await aiService.analyzeVideoWithAI(mediaFile)
  const sceneDetection = await aiService.detectScenesWithYOLO(videoPath)
  const qualityAnalysis = await aiService.analyzeQualityWithFFmpeg(videoPath)
}
```

## Производительность

- **Скорость анализа** - <5 минут для 1 часа материала
- **Генерация плана** - <30 секунд
- **Real-time превью** - Мгновенные обновления
- **Параллельная обработка** - Оптимизированная backend обработка
- **Кэширование** - Умное кэширование для повторных операций

## Статус реализации

### ✅ Завершено (100%)
1. **Архитектура** - Полная система типов и XState машина
2. **React интеграция** - Хуки, провайдеры и компоненты
3. **Анализ контента** - Анализ видео/аудио с метриками качества
4. **Генерация планов** - Генетический алгоритм с оптимизацией
5. **UI компоненты** - Полный dashboard и интерфейс редактирования
6. **Backend интеграция** - Полный Rust/Tauri backend
7. **Timeline интеграция** - Применение планов к timeline
8. **Тестирование** - Комплексное покрытие тестами

### 🔧 Опциональные улучшения
- Система кэширования результатов анализа
- Export/import UI для планов (backend готов)
- Расширенные алгоритмы детекции темпа

## Зависимости

- React 19+ с хуками
- XState v5 для управления состоянием
- Tauri v2 для desktop интеграции
- FFmpeg для обработки медиа
- YOLO модели для детекции объектов
- shadcn/ui для компонентов

## Лицензия

Часть проекта Timeline Studio - см. лицензию основного проекта.