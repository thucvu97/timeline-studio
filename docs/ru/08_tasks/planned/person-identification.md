# Person Identification - Распознавание и трекинг персон

## 📋 Обзор

Person Identification - это продвинутый модуль для распознавания лиц, идентификации персон и отслеживания их появления на протяжении всего видео. Модуль использует современные алгоритмы машинного обучения для создания умной каталогизации персон в проекте.

## 🎯 Цели и задачи

### Основные цели:
1. **Автоматизация** - автоматическое обнаружение всех персон
2. **Точность** - минимум ошибок в идентификации
3. **Трекинг** - отслеживание персон между кадрами
4. **Приватность** - соблюдение privacy требований

### Ключевые возможности:
- Обнаружение и распознавание лиц
- Создание профилей персон
- Трекинг через весь проект
- Группировка по персонам
- Анонимизация при необходимости

## 🏗️ Техническая архитектура

### Frontend структура:
```
src/features/person-identification/
├── components/
│   ├── person-browser/        # Браузер персон
│   │   ├── person-grid.tsx    # Сетка персон
│   │   ├── person-card.tsx    # Карточка персоны
│   │   └── person-details.tsx # Детали персоны
│   ├── face-detection/        # Детекция лиц
│   │   ├── face-overlay.tsx   # Оверлей на видео
│   │   ├── face-marker.tsx    # Маркер лица
│   │   └── detection-box.tsx  # Рамка детекции
│   ├── person-timeline/       # Timeline персон
│   │   ├── appearance-track.tsx # Трек появлений
│   │   └── person-clips.tsx   # Клипы с персоной
│   ├── identity-manager/      # Управление identity
│   │   ├── merge-persons.tsx  # Объединение персон
│   │   ├── split-person.tsx   # Разделение персон
│   │   └── person-editor.tsx  # Редактор персоны
│   └── privacy/              # Приватность
│       ├── blur-faces.tsx    # Размытие лиц
│       └── anonymize.tsx     # Анонимизация
├── hooks/
│   ├── use-face-detection.ts  # Детекция лиц
│   ├── use-person-tracking.ts # Трекинг персон
│   └── use-person-data.ts    # Данные персон
├── services/
│   ├── face-detector.ts      # Детектор лиц
│   ├── face-recognizer.ts    # Распознавание
│   ├── person-tracker.ts     # Трекер персон
│   └── identity-service.ts   # Сервис identity
└── types/
    └── person.ts             # Типы данных
```

### Backend структура (Rust):
```
src-tauri/src/person_identification/
├── mod.rs                    # Главный модуль
├── face_detection/           # Детекция лиц
│   ├── detector.rs          # Детектор (MTCNN/RetinaFace)
│   ├── landmarks.rs         # Facial landmarks
│   └── alignment.rs         # Выравнивание лиц
├── face_recognition/        # Распознавание
│   ├── embeddings.rs        # Face embeddings
│   ├── matcher.rs           # Сопоставление лиц
│   └── clustering.rs        # Кластеризация
├── tracking/                # Трекинг
│   ├── multi_tracker.rs     # Multi-object tracking
│   ├── kalman_filter.rs     # Предсказание позиций
│   └── re_identification.rs # Re-ID после потери
├── database/                # База данных
│   ├── person_db.rs         # БД персон
│   └── embeddings_index.rs  # Индекс embeddings
└── commands.rs              # Tauri команды
```

## 📐 Функциональные требования

### 1. Обнаружение лиц

#### Алгоритмы детекции:
- **MTCNN** - Multi-task Cascaded CNN
- **RetinaFace** - высокая точность
- **YOLO-Face** - скорость
- **MediaPipe Face** - real-time

#### Параметры детекции:
```typescript
interface FaceDetectionConfig {
    // Модель
    model: 'mtcnn' | 'retinaface' | 'yolo' | 'mediapipe';
    
    // Параметры
    minFaceSize: number;        // Минимальный размер лица
    confidenceThreshold: number; // Порог уверенности
    maxFaces: number;           // Макс. количество лиц
    
    // Производительность
    batchSize: number;          // Размер батча
    skipFrames: number;         // Пропуск кадров
    useGPU: boolean;           // GPU ускорение
}
```

#### Результат детекции:
```typescript
interface DetectedFace {
    bbox: BoundingBox;          // Координаты лица
    confidence: number;         // Уверенность
    landmarks?: FacialLandmarks; // 68 точек лица
    
    // Атрибуты
    age?: number;              // Примерный возраст
    gender?: Gender;           // Пол
    emotion?: Emotion;         // Эмоция
    
    // Качество
    blur: number;              // Размытость
    occlusion: number;         // Перекрытие
    pose: HeadPose;           // Поворот головы
}
```

### 2. Распознавание персон

#### Face Embeddings:
```typescript
interface FaceEmbedding {
    vector: Float32Array;       // 128D или 512D вектор
    quality: number;           // Качество embedding
    
    // Метаданные
    faceId: string;
    timestamp: Timecode;
    frameNumber: number;
}
```

#### Сопоставление лиц:
```typescript
class FaceMatcher {
    private threshold = 0.6;    // Порог сходства
    
    match(embedding1: FaceEmbedding, embedding2: FaceEmbedding): MatchResult {
        const distance = this.cosineDistance(embedding1.vector, embedding2.vector);
        const similarity = 1 - distance;
        
        return {
            match: similarity > this.threshold,
            similarity,
            confidence: this.calculateConfidence(similarity, embedding1.quality, embedding2.quality)
        };
    }
}
```

### 3. Создание профилей персон

#### Структура профиля:
```typescript
interface PersonProfile {
    id: string;
    name?: string;              // Имя (опционально)
    
    // Биометрия
    faceEmbeddings: FaceEmbedding[]; // Множество embeddings
    averageEmbedding: Float32Array;   // Усредненный вектор
    
    // Появления
    appearances: Appearance[];
    totalScreenTime: Duration;
    firstAppearance: Timecode;
    lastAppearance: Timecode;
    
    // Статистика
    clipCount: number;          // Количество клипов
    sceneCount: number;         // Количество сцен
    
    // Метаданные
    tags: string[];
    notes?: string;
    thumbnails: Thumbnail[];
}

interface Appearance {
    clipId: string;
    startTime: Timecode;
    endTime: Timecode;
    confidence: number;
    
    // Трекинг
    trackId: string;
    boundingBoxes: TimedBoundingBox[];
}
```

### 4. Трекинг персон

#### Multi-Object Tracking:
```rust
pub struct PersonTracker {
    trackers: HashMap<PersonId, Box<dyn Tracker>>,
    kalman_filters: HashMap<PersonId, KalmanFilter>,
}

impl PersonTracker {
    pub fn update(&mut self, frame: &VideoFrame, detections: Vec<Detection>) {
        // Predict позиции с Kalman filter
        for (id, kalman) in &mut self.kalman_filters {
            kalman.predict();
        }
        
        // Сопоставление детекций с треками
        let matches = self.hungarian_matching(&detections);
        
        // Обновление треков
        for (track_id, detection_id) in matches {
            self.trackers[track_id].update(&detections[detection_id]);
            self.kalman_filters[track_id].update(&detections[detection_id]);
        }
        
        // Создание новых треков
        for unmatched in unmatched_detections {
            self.create_new_track(unmatched);
        }
    }
}
```

#### Re-identification:
- Восстановление после occlusion
- Трекинг между сценами
- Устойчивость к изменениям освещения
- Работа с разными углами

### 5. Визуализация на Timeline

#### Person Timeline View:
```
Person Timeline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
John Doe    ████  ████████    ████████
Jane Smith      ██████    ████    ████
Unknown #1  ██        ██████        ██
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            0:00  1:00  2:00  3:00  4:00
```

#### Интерактивные функции:
- Click на персону → показать все клипы
- Hover → preview лица
- Drag & drop → переупорядочить
- Right-click → контекстное меню

### 6. Управление идентичностями

#### Объединение персон:
```typescript
interface MergePersonsOperation {
    sourcePersons: PersonId[];
    targetPerson: PersonId;
    
    // Стратегия
    mergeStrategy: {
        embeddings: 'all' | 'best' | 'average';
        name: 'keep' | 'prompt' | 'auto';
        appearances: 'merge' | 'recalculate';
    };
}
```

#### Разделение персоны:
- Ручное указание разных людей
- Автоматическое по порогу сходства
- Визуальная группировка

### 7. Приватность и анонимизация

#### Функции приватности:
```typescript
interface PrivacyOptions {
    // Размытие
    blurFaces: {
        enabled: boolean;
        intensity: number;      // Сила размытия
        tracking: boolean;      // Следить за движением
    };
    
    // Анонимизация
    anonymize: {
        replaceWithAvatar: boolean;
        pixelate: boolean;
        blackBox: boolean;
    };
    
    // Исключения
    whitelist: PersonId[];      // Не размывать
    blacklist: PersonId[];      // Всегда размывать
}
```

#### GDPR compliance:
- Право на удаление
- Экспорт данных персоны
- Согласие на обработку
- Аудит использования

### 8. Экспорт и интеграция

#### Форматы экспорта:
```typescript
interface PersonDataExport {
    format: 'json' | 'csv' | 'xml' | 'vtt';
    
    // Данные
    includeEmbeddings: boolean;
    includeThumbnails: boolean;
    includeTimecodes: boolean;
    
    // Фильтры
    persons?: PersonId[];
    timeRange?: TimeRange;
}
```

#### Интеграция с субтитрами:
- Автоматические имена говорящих
- Синхронизация с диалогами
- Экспорт в subtitle форматы

## 🎨 UI/UX дизайн

### Браузер персон:
```
┌─────────────────────────────────────────────────┐
│ Persons (12 detected)         [+Add] [Settings] │
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │   👤    │ │   👤    │ │   👤    │ │   👤    ││
│ │ John    │ │ Jane    │ │Unknown 1│ │Unknown 2││
│ │ 15 clips│ │ 8 clips │ │ 3 clips │ │ 2 clips ││
│ │ 5:30    │ │ 3:15    │ │ 1:20    │ │ 0:45    ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
├─────────────────────────────────────────────────┤
│ Selected: John                                  │
│ First seen: 00:00:15 | Last: 00:45:30         │
│ Total screen time: 5:30 (23% of video)        │
│                                                │
│ [Show on Timeline] [Export] [Blur Face]        │
└─────────────────────────────────────────────────┘
```

### Face Detection Overlay:
```
Video Preview with Face Detection:
┌─────────────────────────────────────┐
│                                     │
│     ┌─────────┐                    │
│     │ John    │                    │
│     │ 95%     │      Jane          │
│     └─────────┘    ┌─────────┐    │
│                    │  87%    │    │
│                    └─────────┘    │
│                                     │
└─────────────────────────────────────┘
[✓] Show names [✓] Show confidence
```

## 🔧 Технические детали

### Face Recognition Pipeline:

```rust
use dlib::face_recognition;

pub struct FaceRecognitionPipeline {
    detector: Box<dyn FaceDetector>,
    aligner: FaceAligner,
    embedder: FaceEmbedder,
    matcher: FaceMatcher,
}

impl FaceRecognitionPipeline {
    pub async fn process_frame(&self, frame: &VideoFrame) -> Vec<PersonDetection> {
        // 1. Детекция лиц
        let faces = self.detector.detect_faces(frame).await?;
        
        // 2. Выравнивание
        let aligned_faces = faces.iter()
            .map(|face| self.aligner.align(frame, face))
            .collect();
        
        // 3. Извлечение embeddings
        let embeddings = self.embedder.extract_embeddings(&aligned_faces).await?;
        
        // 4. Сопоставление с известными персонами
        let identities = embeddings.iter()
            .map(|emb| self.matcher.identify(emb))
            .collect();
        
        // 5. Формирование результата
        faces.iter().zip(identities)
            .map(|(face, identity)| PersonDetection {
                bbox: face.bbox,
                person_id: identity,
                confidence: face.confidence,
            })
            .collect()
    }
}
```

### Efficient Embeddings Storage:

```rust
use hnsw::{Hnsw, Searcher};

pub struct EmbeddingsIndex {
    index: Hnsw<f32, DistCosine>,
    embeddings: Vec<(PersonId, FaceEmbedding)>,
}

impl EmbeddingsIndex {
    pub fn search(&self, query: &[f32], k: usize) -> Vec<SearchResult> {
        let mut searcher = Searcher::default();
        let neighbors = self.index.search(query, k, &mut searcher);
        
        neighbors.into_iter()
            .map(|item| SearchResult {
                person_id: self.embeddings[item.index].0.clone(),
                distance: item.distance,
                confidence: 1.0 - item.distance,
            })
            .collect()
    }
}
```

## 📊 План реализации

### Фаза 1: Базовая детекция (2 недели)
- [ ] Интеграция face detection моделей
- [ ] UI для отображения лиц
- [ ] Базовое сохранение детекций
- [ ] Preview с bounding boxes

### Фаза 2: Распознавание (3 недели)
- [ ] Face embeddings extraction
- [ ] Сопоставление лиц
- [ ] Создание профилей персон
- [ ] UI браузера персон

### Фаза 3: Трекинг (2 недели)
- [ ] Multi-object tracking
- [ ] Re-identification
- [ ] Timeline visualization
- [ ] Управление identities

### Фаза 4: Продвинутые функции (2 недели)
- [ ] Приватность и анонимизация
- [ ] Экспорт данных
- [ ] Интеграция с субтитрами
- [ ] Оптимизация производительности

## 🎯 Метрики успеха

### Точность:
- 95%+ точность детекции лиц
- 90%+ точность распознавания
- 85%+ точность трекинга

### Производительность:
- Real-time для HD видео
- <1s на кадр для 4K
- Batch processing 10x быстрее

### Удобство:
- Автоматическая группировка
- Простое управление персонами
- Быстрый поиск по персонам

## 🔗 Интеграция

### С другими модулями:
- **Timeline** - отображение персон
- **Scene Analyzer** - персоны в сценах
- **Subtitles** - имена говорящих
- **Export** - метаданные персон

### API для разработчиков:
```typescript
interface PersonIdentificationAPI {
    // Детекция
    detectFaces(frame: VideoFrame): Promise<DetectedFace[]>;
    
    // Распознавание
    identifyPerson(face: DetectedFace): Promise<PersonId>;
    createPerson(name?: string): PersonId;
    
    // Управление
    mergePeople(ids: PersonId[]): void;
    renamePerson(id: PersonId, name: string): void;
    
    // Запросы
    getPersonAppearances(id: PersonId): Appearance[];
    getPersonsInTimeRange(range: TimeRange): PersonId[];
    
    // Приватность
    blurPerson(id: PersonId, options: BlurOptions): void;
    deletePerson(id: PersonId): void;
}
```

## 📚 Справочные материалы

- [FaceNet Paper](https://arxiv.org/abs/1503.03832)
- [MTCNN](https://github.com/ipazc/mtcnn)
- [DeepFace](https://github.com/serengil/deepface)
- [InsightFace](https://github.com/deepinsight/insightface)

---

*Документ будет обновляться по мере разработки модуля*