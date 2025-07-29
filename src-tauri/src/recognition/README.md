# Recognition Module - Advanced ML Integration

## Обзор

Модуль распознавания предоставляет комплексную интеграцию с передовыми ML моделями для обнаружения объектов, распознавания лиц и анализа видео. Система построена на базе ONNX Runtime с поддержкой GPU ускорения.

## Текущий статус (Июль 2025)

✅ **Модуль активен и готов к использованию**
- YOLO v8/v11 полностью интегрированы (все размеры: nano→extra)
- FaceNet для генерации embeddings (512D и 128D векторы)
- RetinaFace для высокоточной детекции с 5-точечными landmarks
- MediaPipe для 468-точечных 3D landmarks и анализа выражений
- ORT настроен с версией `2.0.0-rc.10` и `load-dynamic` feature
- Все команды Tauri зарегистрированы и доступны

## Архитектура

### Основные процессоры

1. **YoloProcessor** - Детекция объектов и лиц
   - Поддержка YOLOv8/v11 всех размеров (n/s/m/l/x)
   - Специализированные модели для лиц (face)
   - Сегментация объектов (seg)

2. **FaceNetProcessor** - Генерация face embeddings
   - 512D векторы для высокой точности
   - 128D векторы для быстрой работы
   - ArcFace как альтернатива

3. **RetinaFaceProcessor** - Высокоточная детекция лиц
   - 5 ключевых facial landmarks
   - Head pose estimation
   - Face quality assessment
   - Face alignment

4. **MediaPipeProcessor** - Продвинутый анализ лиц
   - 468 3D facial landmarks
   - Facial expressions анализ
   - 3D head pose с confidence
   - Face geometry анализ

### Структура модуля

```
recognition/
├── mod.rs                         # Главный модуль
├── commands/                      # Tauri команды
│   ├── mod.rs                    # Реэкспорт команд
│   ├── yolo_commands.rs          # YOLO команды
│   ├── yolo_commands_simple.rs   # Упрощенные YOLO команды
│   ├── facenet_commands.rs       # FaceNet команды
│   ├── retinaface_commands.rs    # RetinaFace команды
│   └── mediapipe_commands.rs     # MediaPipe команды
├── yolo_processor.rs             # YOLO процессор
├── facenet_processor.rs          # FaceNet процессор
├── retinaface_processor.rs       # RetinaFace процессор
├── mediapipe_processor.rs        # MediaPipe процессор
├── model_manager.rs              # Управление моделями
├── frame_processor.rs            # Обработка кадров
├── result_aggregator.rs          # Агрегация результатов
├── recognition_service.rs        # Сервис распознавания
└── types.rs                      # Общие типы данных
```

## Поддерживаемые модели

### YOLO модели
```rust
// Детекция объектов
YoloModel::YoloV8Nano        // Самая быстрая
YoloModel::YoloV8Small       // Баланс скорости и точности
YoloModel::YoloV8Medium      // Хорошая точность
YoloModel::YoloV8Large       // Высокая точность
YoloModel::YoloV8Extra       // Максимальная точность

// Детекция лиц
YoloModel::YoloV8FaceNano    // Быстрая детекция лиц
YoloModel::YoloV8FaceMedium  // Точная детекция лиц
YoloModel::YoloV11Face       // Новейшая модель для лиц
```

### FaceNet модели
```rust
FaceNetModel::FaceNet512D    // 512-мерные embeddings
FaceNetModel::FaceNet128D    // 128-мерные embeddings
FaceNetModel::ArcFace512D    // ArcFace embeddings
```

### RetinaFace модели
```rust
RetinaFaceModel::ResNet50         // Высокая точность
RetinaFaceModel::MobileNet        // Быстрая обработка
RetinaFaceModel::ResNet50Enhanced // Улучшенная версия
```

### MediaPipe модели
```rust
MediaPipeModel::BlazeFaceShort    // Детекция до 2м
MediaPipeModel::BlazeFaceFull     // Детекция до 5м
MediaPipeModel::FaceMesh           // 468 landmarks
MediaPipeModel::FaceMeshAttention // С attention механизмом
MediaPipeModel::SelfieSegmentation // Портретная сегментация
```

## Процесс работы

### 1. Инициализация процессоров

```rust
// YOLO
let yolo_state = State<YoloProcessorState>;
invoke('init_yolo_processor', { modelType: 'yolov8n-face' });

// FaceNet
let facenet_state = State<FaceNetProcessorState>;
invoke('init_facenet_processor', { modelType: 'facenet-512d' });

// RetinaFace
let retinaface_state = State<RetinaFaceProcessorState>;
invoke('init_retinaface_processor', { modelType: 'retinaface-r50' });

// MediaPipe
let mediapipe_state = State<MediaPipeProcessorState>;
invoke('init_mediapipe_processor', { modelType: 'face-mesh' });
```

### 2. Обработка изображений

#### YOLO детекция
```typescript
const detections = await invoke('detect_objects_in_image', {
  imagePath: '/path/to/image.jpg'
});
```

#### FaceNet embeddings
```typescript
const embedding = await invoke('generate_face_embedding', {
  imagePath: '/path/to/face.jpg'
});

// Сравнение лиц
const similarity = await invoke('calculate_cosine_similarity', {
  embedding1: face1_embedding,
  embedding2: face2_embedding
});
```

#### RetinaFace landmarks
```typescript
const faces = await invoke('detect_faces_with_landmarks', {
  imagePath: '/path/to/image.jpg'
});

// face = {
//   bbox: { x1, y1, x2, y2 },
//   landmarks: {
//     left_eye: { x, y },
//     right_eye: { x, y },
//     nose_tip: { x, y },
//     mouth_left: { x, y },
//     mouth_right: { x, y }
//   },
//   head_pose: { pitch, yaw, roll },
//   quality_score: 0.95
// }
```

#### MediaPipe анализ
```typescript
// Извлечение 468 landmarks
const landmarks = await invoke('extract_face_mesh_landmarks', {
  imageData: base64_image_data
});

// Анализ выражений лица
const expressions = await invoke('analyze_facial_expressions', {
  imageData: base64_image_data
});

// expressions = {
//   smile_score: 0.8,
//   left_eye_openness: 0.9,
//   right_eye_openness: 0.85,
//   mouth_openness: 0.3,
//   eyebrow_raise: 0.1,
//   gaze_direction: { x: 0.5, y: 0.5 },
//   attention_score: 0.7
// }
```

## Конфигурация моделей

Все пути к моделям централизованы в `ModelsConfig`:

```rust
pub struct ModelsConfig {
    pub yolo_models: YoloModelsConfig,
    pub facenet_models: FaceNetModelsConfig,
    pub retinaface_models: RetinaFaceModelsConfig,
    pub mediapipe_models: MediaPipeModelsConfig,
}
```

Модели должны быть размещены в соответствующих директориях:
- `models/yolo/` - YOLO модели
- `models/facenet/` - FaceNet модели
- `models/retinaface/` - RetinaFace модели
- `models/mediapipe/` - MediaPipe модели

## Установка моделей

### Автоматическая загрузка
```bash
# Запустите скрипт загрузки моделей
./scripts/download-models.sh
```

### Ручная загрузка
1. YOLO модели: https://github.com/ultralytics/assets/releases
2. FaceNet модели: https://github.com/serengil/deepface_models/releases
3. RetinaFace модели: https://github.com/biubug6/Pytorch_Retinaface
4. MediaPipe модели: https://google.github.io/mediapipe/

## Интеграция с Timeline Studio

### Person Identification Pipeline
```typescript
// 1. Детекция лиц с YOLO
const faces = await detectFacesWithYolo(frame);

// 2. Уточнение с RetinaFace
const refined = await refineWithRetinaFace(faces);

// 3. Извлечение embeddings с FaceNet
const embeddings = await generateEmbeddings(refined);

// 4. Анализ выражений с MediaPipe
const expressions = await analyzeExpressions(refined);

// 5. Сохранение в базу персон
await saveToPerson Database({
  embeddings,
  expressions,
  landmarks: refined.landmarks
});
```

### Smart Montage Integration
```typescript
// Анализ ключевых моментов по лицам
const keyMoments = await detectKeyMoments({
  useSmileDetection: true,
  useExpressionAnalysis: true,
  useHeadPoseTracking: true
});
```

## Производительность

### Скорость обработки (RTX 3080)
- YOLO nano: 100+ FPS
- YOLO medium: 50+ FPS
- FaceNet 512D: 30ms/лицо
- RetinaFace: 40ms/кадр
- MediaPipe FaceMesh: 25ms/лицо

### Оптимизация
1. **GPU ускорение**: Автоматически для всех моделей
2. **Batch processing**: До 10x ускорение
3. **Model caching**: Модели загружаются один раз
4. **Parallel processing**: Разные процессоры могут работать параллельно

## API команд

### YOLO команды
- `init_yolo_processor(modelType: string)`
- `detect_objects_in_image(imagePath: string)`
- `analyze_video_with_yolo(videoPath: string, options: YoloOptions)`
- `update_yolo_confidence_threshold(threshold: number)`

### FaceNet команды
- `init_facenet_processor(modelType: string)`
- `generate_face_embedding(imagePath: string)`
- `generate_face_embedding_from_base64(imageData: string)`
- `calculate_cosine_similarity(embedding1: number[], embedding2: number[])`

### RetinaFace команды
- `init_retinaface_processor(modelType: string)`
- `detect_faces_with_landmarks(imagePath: string)`
- `detect_faces_with_landmarks_from_base64(imageData: string)`
- `get_aligned_face(imageData: string, landmarks: FacialLandmarks)`
- `configure_retinaface_thresholds(confidence: number, nms: number)`

### MediaPipe команды
- `init_mediapipe_processor(modelType: string)`
- `detect_faces_blazeface(imagePath: string)`
- `extract_face_mesh_landmarks(imageData: string)`
- `analyze_facial_expressions(imageData: string)`
- `configure_mediapipe_settings(confidence: number, maxFaces: number)`

## Структуры данных

### Detection результат
```typescript
interface Detection {
  class: string;
  class_id: number;
  confidence: number;
  bbox: BoundingBox;
  attributes?: Map<string, any>;
}
```

### Face Embedding
```typescript
interface FaceEmbedding {
  embedding: Float32Array;  // 512 или 128 значений
  model_type: string;
  face_bbox: BoundingBox;
  quality_score: number;
}
```

### Facial Landmarks
```typescript
interface FacialLandmarks {
  points: Point3D[];        // 5, 68 или 468 точек
  confidence: number;
  face_bbox: BoundingBox;
  head_pose?: HeadPose3D;
}
```

## Тестирование

```bash
# Все тесты
cargo test --package timeline-studio --lib recognition

# Конкретный процессор
cargo test --package timeline-studio --lib recognition::yolo_processor
cargo test --package timeline-studio --lib recognition::facenet_processor
cargo test --package timeline-studio --lib recognition::retinaface_processor
cargo test --package timeline-studio --lib recognition::mediapipe_processor
```

## Известные ограничения

1. Модели должны быть загружены отдельно (300MB-2GB)
2. Первая инициализация может занять 5-10 секунд
3. GPU память: минимум 4GB VRAM для всех моделей
4. MediaPipe требует специальный формат ONNX моделей

## Планы развития

### Q3 2025
- [ ] TensorRT оптимизация для NVIDIA GPU
- [ ] CoreML интеграция для Apple Silicon
- [ ] WebGPU поддержка для браузерной версии

### Q4 2025
- [ ] Трекинг объектов между кадрами (DeepSORT)
- [ ] Real-time обработка видеопотока
- [ ] Распознавание жестов и поз (MediaPipe Holistic)
- [ ] Интеграция с облачными API (AWS Rekognition, Azure Face)

## Контакты

Для вопросов и предложений по модулю распознавания:
- GitHub Issues: https://github.com/timeline-studio/issues
- Email: recognition@timeline.studio