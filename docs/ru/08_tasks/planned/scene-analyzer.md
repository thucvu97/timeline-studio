# Scene Analyzer - AI анализ и сегментация сцен

## 📋 Обзор

Scene Analyzer - это интеллектуальный модуль для автоматического анализа видеоконтента, определения границ сцен, классификации типов контента и создания умной сегментации для упрощения монтажа. Модуль использует продвинутые алгоритмы компьютерного зрения и машинного обучения.

## 🎯 Цели и задачи

### Основные цели:
1. **Автоматизация** - сокращение ручной работы по разметке
2. **Интеллектуальность** - понимание содержания видео
3. **Точность** - минимум ложных срабатываний
4. **Скорость** - обработка в реальном времени

### Ключевые возможности:
- Автоматическое определение смены сцен
- Классификация типов контента
- Обнаружение ключевых моментов
- Группировка похожих сцен
- Генерация метаданных для поиска

## 🏗️ Техническая архитектура

### Frontend структура:
```
src/features/scene-analyzer/
├── components/
│   ├── analysis-panel/        # Панель анализа
│   │   ├── scene-timeline.tsx # Визуализация сцен
│   │   ├── scene-browser.tsx  # Браузер сцен
│   │   └── scene-details.tsx  # Детали сцены
│   ├── detection-settings/    # Настройки детекции
│   │   ├── sensitivity.tsx    # Чувствительность
│   │   └── filters.tsx        # Фильтры типов
│   ├── scene-markers/         # Маркеры сцен
│   │   ├── scene-marker.tsx   # Отдельный маркер
│   │   └── marker-overlay.tsx # Оверлей на timeline
│   └── insights/              # Аналитика
│       ├── content-stats.tsx  # Статистика контента
│       └── suggestions.tsx    # Рекомендации
├── hooks/
│   ├── use-scene-analyzer.ts  # Основной хук
│   ├── use-scene-detection.ts # Детекция сцен
│   └── use-content-insights.ts # Аналитика
├── services/
│   ├── scene-detector.ts      # Детектор сцен
│   ├── content-classifier.ts  # Классификатор
│   ├── scene-grouper.ts       # Группировка
│   └── metadata-generator.ts  # Генератор метаданных
└── workers/
    └── analysis-worker.ts     # Фоновый анализ
```

### Backend структура (Rust):
```
src-tauri/src/scene_analyzer/
├── mod.rs                     # Главный модуль
├── detectors/                 # Детекторы
│   ├── shot_boundary.rs       # Границы кадров
│   ├── motion_detector.rs     # Детектор движения
│   ├── color_analyzer.rs      # Анализ цвета
│   └── audio_analyzer.rs      # Анализ аудио
├── classifiers/               # Классификаторы
│   ├── scene_classifier.rs    # Типы сцен
│   ├── object_detector.rs     # Объекты в кадре
│   └── activity_detector.rs   # Активность
├── ml_models/                 # ML модели
│   ├── scene_model.rs         # Модель сцен
│   └── content_model.rs       # Модель контента
└── commands.rs                # Tauri команды
```

## 📐 Функциональные требования

### 1. Детекция границ сцен

#### Методы обнаружения:
- **Visual cuts** - резкие переходы
- **Gradual transitions** - плавные переходы
- **Motion changes** - изменение движения
- **Audio cues** - аудио подсказки

#### Алгоритмы:
```typescript
interface SceneDetectionMethods {
    // Визуальные методы
    colorHistogram: {
        threshold: number;      // Порог изменения
        smoothing: number;      // Сглаживание
    };
    
    // Детекция движения
    opticalFlow: {
        sensitivity: number;    // Чувствительность
        minMotion: number;      // Минимальное движение
    };
    
    // Машинное обучение
    deepLearning: {
        model: 'fast' | 'accurate';
        confidence: number;     // Уверенность
    };
}
```

#### Визуализация детекции:
```
Timeline with Scene Boundaries:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│Scene 1│  Scene 2  │Scene 3│   Scene 4   │
│Indoor │ Outdoor   │Dialog │   Action    │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↑         ↑         ↑          ↑
  Cut    Dissolve    Cut    Motion change
```

### 2. Классификация сцен

#### Типы сцен:
```typescript
enum SceneType {
    // Основные категории
    Dialog = 'dialog',           // Диалоги
    Action = 'action',          // Экшн сцены
    Landscape = 'landscape',    // Пейзажи
    Closeup = 'closeup',       // Крупные планы
    Establishing = 'establishing', // Установочные
    
    // По локации
    Indoor = 'indoor',          // В помещении
    Outdoor = 'outdoor',        // На улице
    Studio = 'studio',          // Студия
    
    // По содержанию
    Interview = 'interview',    // Интервью
    BRoll = 'b-roll',          // B-Roll
    Montage = 'montage',       // Монтажная последовательность
    Title = 'title',           // Титры
}
```

#### Атрибуты сцены:
```typescript
interface SceneAttributes {
    // Базовая информация
    id: string;
    startTime: Timecode;
    endTime: Timecode;
    duration: Duration;
    
    // Классификация
    primaryType: SceneType;
    secondaryTypes: SceneType[];
    confidence: number;
    
    // Визуальные характеристики
    dominantColors: Color[];
    brightness: number;
    contrast: number;
    motionIntensity: number;
    
    // Содержание
    detectedObjects: DetectedObject[];
    faces: FaceDetection[];
    text: TextDetection[];
    
    // Аудио
    audioLevel: number;
    musicPresence: boolean;
    speechPresence: boolean;
}
```

### 3. Обнаружение ключевых моментов

#### Типы ключевых моментов:
- **Peak action** - пики активности
- **Emotional moments** - эмоциональные моменты
- **Key dialogue** - важные диалоги
- **Visual highlights** - визуальные акценты

#### Scoring система:
```typescript
interface MomentScore {
    timestamp: Timecode;
    scores: {
        visual: number;      // Визуальная значимость
        audio: number;       // Аудио значимость
        motion: number;      // Движение
        emotion: number;     // Эмоциональность
        overall: number;     // Общий score
    };
    
    // Контекст
    reason: string;          // Почему важно
    category: MomentCategory;
}
```

### 4. Группировка похожих сцен

#### Критерии группировки:
- **Visual similarity** - визуальное сходство
- **Location matching** - одинаковая локация
- **Character presence** - присутствие персонажей
- **Temporal proximity** - временная близость

#### Кластеризация:
```typescript
interface SceneCluster {
    id: string;
    name: string;
    scenes: Scene[];
    
    // Характеристики кластера
    commonAttributes: {
        location?: string;
        characters?: string[];
        visualStyle?: string;
        timeOfDay?: string;
    };
    
    // Статистика
    totalDuration: Duration;
    averageSceneLength: Duration;
    
    // Рекомендации
    suggestedOrder?: Scene[];
    editingHints?: string[];
}
```

### 5. Автоматическая разметка

#### Генерируемые метаданные:
```typescript
interface SceneMetadata {
    // Описание
    description: string;         // AI-generated
    keywords: string[];         // Ключевые слова
    
    // Технические данные
    cameraMovement: CameraMove; // Pan, tilt, zoom
    shotSize: ShotSize;        // Wide, medium, close
    angle: CameraAngle;        // High, eye, low
    
    // Контент
    transcript?: string;        // Распознанная речь
    onScreenText?: string[];    // Текст в кадре
    
    // Настроение
    mood: Mood;                // Happy, sad, tense
    pace: Pace;                // Slow, medium, fast
    energy: EnergyLevel;       // Low, medium, high
}
```

### 6. Интеллектуальные рекомендации

#### Типы рекомендаций:
- **Trim suggestions** - где можно обрезать
- **Transition ideas** - подходящие переходы
- **Music cues** - точки для музыки
- **Effect opportunities** - где применить эффекты

#### Пример рекомендаций:
```
Scene Analysis Insights:
┌─────────────────────────────────────────┐
│ 💡 Suggestions for "Interview Scene"    │
├─────────────────────────────────────────┤
│ • Remove 3s of silence at 00:45        │
│ • Add J-cut transition to next scene   │
│ • Color match with Scene 4 recommended │
│ • Background noise detected - denoise?  │
└─────────────────────────────────────────┘
```

### 7. Batch Processing

#### Параметры обработки:
```typescript
interface BatchAnalysisConfig {
    // Файлы
    files: MediaFile[];
    
    // Настройки анализа
    detectionSensitivity: 'low' | 'medium' | 'high';
    enabledDetectors: DetectorType[];
    
    // Производительность
    maxParallel: number;
    priority: Priority;
    useGPU: boolean;
    
    // Вывод
    generateReport: boolean;
    exportFormat: 'json' | 'xml' | 'csv';
}
```

### 8. Интеграция с Timeline

#### Визуализация на Timeline:
```
Timeline with Scene Analysis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
V1 ████████|████████|████████|████████
   Dialog  Action  Dialog  Landscape
   😊 High 🎬 Med   😐 Low   🌄 High
   ↑       ↑       ↑       ↑
   Keep    Trim?   Cut?    Highlight
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Smart Markers:
- Автоматические маркеры сцен
- Цветовое кодирование по типам
- Быстрая навигация между сценами
- Фильтрация по атрибутам

## 🎨 UI/UX дизайн

### Панель анализа:
```
┌─────────────────────────────────────────────────┐
│ Scene Analysis              [Analyze] [Settings] │
├─────────────────────────────────────────────────┤
│ Detected: 24 scenes | 5 key moments | 3 groups │
├─────────────────────────────────────────────────┤
│ Scene Browser                                   │
│ ┌─────┬─────┬─────┬─────┐                     │
│ │ 📹  │ 🗣️  │ 🏃  │ 🌄  │ ← Thumbnails      │
│ │ 1   │ 2   │ 3   │ 4   │                     │
│ └─────┴─────┴─────┴─────┘                     │
│                                                 │
│ Selected: Scene 2 (Dialog)                      │
│ Duration: 00:00:45                             │
│ Confidence: 92%                                │
│ Objects: 2 people, indoor                      │
│ Audio: Speech detected                         │
├─────────────────────────────────────────────────┤
│ [Apply to Timeline] [Export Analysis]          │
└─────────────────────────────────────────────────┘
```

## 🔧 Технические детали

### Shot Boundary Detection:

```rust
use opencv::prelude::*;

pub struct ShotBoundaryDetector {
    threshold: f32,
    min_scene_length: Duration,
}

impl ShotBoundaryDetector {
    pub fn detect_boundaries(&self, video: &VideoFile) -> Vec<Boundary> {
        let mut boundaries = Vec::new();
        let mut prev_histogram = None;
        
        for (i, frame) in video.frames().enumerate() {
            let histogram = self.calculate_histogram(&frame);
            
            if let Some(prev) = prev_histogram {
                let diff = self.histogram_difference(&prev, &histogram);
                
                if diff > self.threshold {
                    boundaries.push(Boundary {
                        frame_number: i,
                        confidence: diff / self.threshold,
                        transition_type: self.classify_transition(&prev, &frame),
                    });
                }
            }
            
            prev_histogram = Some(histogram);
        }
        
        self.filter_short_scenes(boundaries)
    }
}
```

### ML-based Scene Classification:

```typescript
class SceneClassifier {
    private model: tf.LayersModel;
    
    async classifyScene(frames: VideoFrame[]): Promise<SceneClassification> {
        // Извлекаем features из кадров
        const features = await this.extractFeatures(frames);
        
        // Прогоняем через модель
        const predictions = await this.model.predict(features);
        
        // Интерпретируем результаты
        return {
            primaryType: this.getTopClass(predictions),
            confidence: this.getConfidence(predictions),
            allScores: this.getAllScores(predictions)
        };
    }
    
    private async extractFeatures(frames: VideoFrame[]): Promise<tf.Tensor> {
        // Сэмплируем ключевые кадры
        const keyFrames = this.sampleKeyFrames(frames, 5);
        
        // Извлекаем визуальные features
        const visualFeatures = await Promise.all(
            keyFrames.map(frame => this.extractVisualFeatures(frame))
        );
        
        // Извлекаем motion features
        const motionFeatures = this.extractMotionFeatures(frames);
        
        // Объединяем features
        return tf.concat([
            tf.stack(visualFeatures),
            motionFeatures
        ]);
    }
}
```

## 📊 План реализации

### Фаза 1: Базовая детекция (2 недели)
- [ ] Shot boundary detection
- [ ] Простая классификация
- [ ] UI для просмотра сцен
- [ ] Базовые маркеры

### Фаза 2: ML классификация (3 недели)
- [ ] Обучение моделей
- [ ] Интеграция TensorFlow.js
- [ ] Расширенные атрибуты
- [ ] Confidence scores

### Фаза 3: Интеллектуальные функции (2 недели)
- [ ] Группировка сцен
- [ ] Ключевые моменты
- [ ] Рекомендации
- [ ] Метаданные

### Фаза 4: Оптимизация (1 неделя)
- [ ] GPU ускорение
- [ ] Batch processing
- [ ] Кэширование результатов
- [ ] API для плагинов

## 🎯 Метрики успеха

### Точность:
- 95%+ точность границ сцен
- 85%+ точность классификации
- <5% ложных срабатываний

### Производительность:
- Real-time для HD видео
- <5 минут для часа 4K
- GPU ускорение 10x

### Удобство:
- One-click анализ
- Понятные рекомендации
- Экспорт в стандартные форматы

## 🔗 Интеграция

### С другими модулями:
- **Timeline** - автоматические маркеры
- **AI Multi-Platform** - использование анализа
- **Effects** - рекомендации эффектов
- **Color Grading** - группы для коррекции

### API для разработчиков:
```typescript
interface SceneAnalyzerAPI {
    // Анализ
    analyzeVideo(video: VideoFile, config?: AnalysisConfig): Promise<AnalysisResult>;
    
    // Результаты
    getScenes(): Scene[];
    getKeyMoments(): KeyMoment[];
    getGroups(): SceneGroup[];
    
    // Применение
    applyToTimeline(scenes: Scene[]): void;
    exportAnalysis(format: ExportFormat): string;
    
    // Callbacks
    onSceneDetected(callback: (scene: Scene) => void): void;
    onAnalysisComplete(callback: (result: AnalysisResult) => void): void;
}
```

## 📚 Справочные материалы

- [PySceneDetect](https://pyscenedetect.readthedocs.io/)
- [Shot Boundary Detection Papers](https://paperswithcode.com/task/shot-boundary-detection)
- [Video Understanding with AI](https://ai.googleblog.com/2017/02/video-understanding-from-pixels-to.html)
- [FFmpeg Scene Detection](https://ffmpeg.org/ffmpeg-filters.html#scdet)

---

*Документ будет обновляться по мере разработки модуля*