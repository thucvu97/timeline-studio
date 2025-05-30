# Video Compiler Architecture - Архитектура модуля компиляции видео

## 🎯 Обзор

Video Compiler - это центральный модуль Timeline Studio, отвечающий за компиляцию проектов в финальное видео. Модуль написан на Rust и использует FFmpeg для обработки медиа.

## 🏗️ Архитектура модуля

### Структура файлов

```
src-tauri/src/video_compiler/
├── mod.rs              // Главный модуль, экспорт публичного API
├── schema.rs           // Схема проекта и типы данных
├── renderer.rs         // Основной рендерер видео
├── ffmpeg_builder.rs   // Построение FFmpeg команд
├── pipeline.rs         // Конвейер обработки медиа
├── preview.rs          // Генерация превью кадров
├── progress.rs         // Отслеживание прогресса
├── cache.rs            // Система кэширования
└── error.rs            // Обработка ошибок
```

### Зависимости Cargo.toml

```toml
[dependencies]
# Существующие зависимости...
ffmpeg-next = "7.0"           # FFmpeg биндинги для Rust
uuid = { version = "1.0", features = ["serde"] }
tokio = { version = "1.0", features = ["full"] }
futures = "0.3"
dashmap = "5.0"               # Конкурентная HashMap
image = "0.24"                # Обработка изображений
chrono = { version = "0.4", features = ["serde"] }
```

## 📊 Схема данных проекта

### ProjectSchema - Основная структура проекта

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectSchema {
    pub version: String,
    pub metadata: ProjectMetadata,
    pub timeline: Timeline,
    pub tracks: Vec<Track>,
    pub effects: Vec<Effect>,
    pub transitions: Vec<Transition>,
    pub settings: ProjectSettings,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectMetadata {
    pub name: String,
    pub description: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub modified_at: chrono::DateTime<chrono::Utc>,
    pub author: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Timeline {
    pub duration: f64,          // Общая продолжительность в секундах
    pub fps: u32,               // Кадры в секунду
    pub resolution: (u32, u32), // Разрешение (ширина, высота)
    pub sample_rate: u32,       // Частота дискретизации аудио
}
```

### Track - Дорожки timeline

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Track {
    pub id: String,
    pub track_type: TrackType,
    pub name: String,
    pub enabled: bool,
    pub volume: f32,            // 0.0 - 1.0
    pub clips: Vec<Clip>,
    pub effects: Vec<String>,   // ID эффектов
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum TrackType {
    Video,
    Audio,
    Subtitle,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Clip {
    pub id: String,
    pub source_path: PathBuf,
    pub start_time: f64,        // Время начала на timeline
    pub end_time: f64,          // Время окончания на timeline
    pub source_start: f64,      // Начало в исходном файле
    pub source_end: f64,        // Конец в исходном файле
    pub speed: f32,             // Скорость воспроизведения
    pub volume: f32,            // Громкость клипа
    pub effects: Vec<String>,   // ID эффектов клипа
}
```

### Effects - Эффекты и фильтры

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Effect {
    pub id: String,
    pub effect_type: EffectType,
    pub name: String,
    pub enabled: bool,
    pub parameters: HashMap<String, EffectParameter>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum EffectType {
    VideoFilter,    // Видео фильтры (blur, brightness, etc.)
    AudioFilter,    // Аудио фильтры (eq, reverb, etc.)
    ColorCorrection,
    Stabilization,
    Noise,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum EffectParameter {
    Float(f32),
    Int(i32),
    String(String),
    Bool(bool),
    Color(u32),     // RGBA цвет
}
```

## 🔧 Основные компоненты

### 1. VideoRenderer - Основной рендерер

```rust
pub struct VideoRenderer {
    project: ProjectSchema,
    progress_tx: mpsc::Sender<RenderProgress>,
    cache: Arc<RwLock<RenderCache>>,
}

impl VideoRenderer {
    pub async fn new(project: ProjectSchema) -> Result<Self, VideoCompilerError>;
    
    pub async fn render(&mut self, output_path: &Path) -> Result<RenderJob, VideoCompilerError>;
    
    pub async fn render_preview(&self, timestamp: f64) -> Result<Vec<u8>, VideoCompilerError>;
    
    pub fn cancel(&mut self) -> Result<(), VideoCompilerError>;
}
```

### 2. FFmpegBuilder - Построение команд

```rust
pub struct FFmpegBuilder {
    project: ProjectSchema,
}

impl FFmpegBuilder {
    pub fn build_render_command(&self, output_path: &Path) -> Result<Command, VideoCompilerError>;
    
    pub fn build_preview_command(&self, timestamp: f64) -> Result<Command, VideoCompilerError>;
    
    fn build_input_sources(&self) -> Vec<InputSource>;
    
    fn build_filter_complex(&self) -> String;
    
    fn build_output_options(&self, output_path: &Path) -> Vec<String>;
}

#[derive(Debug, Clone)]
pub struct InputSource {
    pub path: PathBuf,
    pub start_time: f64,
    pub duration: f64,
    pub input_index: usize,
}
```

### 3. RenderPipeline - Конвейер обработки

```rust
pub struct RenderPipeline {
    stages: Vec<Box<dyn PipelineStage>>,
    progress_tracker: ProgressTracker,
}

#[async_trait]
pub trait PipelineStage: Send + Sync {
    async fn process(&self, context: &mut PipelineContext) -> Result<(), VideoCompilerError>;
    fn name(&self) -> &str;
    fn estimated_duration(&self) -> Duration;
}

// Этапы конвейера:
// 1. ValidationStage - валидация проекта
// 2. PreprocessingStage - предобработка медиа
// 3. FilterStage - применение фильтров
// 4. CompositionStage - композиция дорожек
// 5. EncodingStage - финальное кодирование
```

### 4. ProgressTracker - Отслеживание прогресса

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RenderProgress {
    pub job_id: String,
    pub stage: String,
    pub percentage: f32,        // 0.0 - 100.0
    pub current_frame: u64,
    pub total_frames: u64,
    pub elapsed_time: Duration,
    pub estimated_remaining: Option<Duration>,
    pub status: RenderStatus,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum RenderStatus {
    Queued,
    Processing,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug)]
pub struct RenderJob {
    pub id: String,
    pub project_name: String,
    pub output_path: PathBuf,
    pub status: RenderStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub progress_rx: mpsc::Receiver<RenderProgress>,
}
```

## 🔌 Tauri Integration

### Commands для Frontend

```rust
#[tauri::command]
pub async fn compile_video(
    project_schema: ProjectSchema,
    output_path: String,
    state: tauri::State<'_, VideoCompilerState>
) -> Result<String, String> {
    // Возвращает job_id для отслеживания
}

#[tauri::command]
pub async fn get_render_progress(
    job_id: String,
    state: tauri::State<'_, VideoCompilerState>
) -> Result<RenderProgress, String> {
    // Текущий прогресс рендеринга
}

#[tauri::command]
pub async fn generate_preview(
    project_schema: ProjectSchema,
    timestamp: f64,
    state: tauri::State<'_, VideoCompilerState>
) -> Result<Vec<u8>, String> {
    // Превью кадр в формате JPEG
}

#[tauri::command]
pub async fn cancel_render(
    job_id: String,
    state: tauri::State<'_, VideoCompilerState>
) -> Result<bool, String> {
    // Отмена рендеринга
}

#[tauri::command]
pub async fn get_active_jobs(
    state: tauri::State<'_, VideoCompilerState>
) -> Result<Vec<RenderJob>, String> {
    // Список активных задач
}
```

### State Management

```rust
#[derive(Debug)]
pub struct VideoCompilerState {
    active_jobs: Arc<DashMap<String, RenderJob>>,
    cache: Arc<RwLock<RenderCache>>,
    settings: Arc<RwLock<CompilerSettings>>,
}

#[derive(Debug, Clone)]
pub struct CompilerSettings {
    pub max_concurrent_jobs: usize,
    pub cache_size_mb: usize,
    pub temp_directory: PathBuf,
    pub ffmpeg_path: Option<PathBuf>,
    pub hardware_acceleration: bool,
}
```

## 🚀 WebSocket Events

Для отправки прогресса в реальном времени:

```rust
// События для Frontend
#[derive(Serialize, Debug)]
#[serde(tag = "type")]
pub enum VideoCompilerEvent {
    RenderStarted { job_id: String },
    RenderProgress { job_id: String, progress: RenderProgress },
    RenderCompleted { job_id: String, output_path: String },
    RenderFailed { job_id: String, error: String },
    PreviewGenerated { timestamp: f64, image_data: Vec<u8> },
}
```

## 📈 Производительность и оптимизация

### 1. Многопоточность
- Параллельная обработка треков
- Async/await для неблокирующих операций
- Пул потоков для CPU-intensive задач

### 2. Кэширование
- Кэширование превью кадров
- Кэширование промежуточных результатов
- LRU cache для часто используемых ресурсов

### 3. Память
- Потоковая обработка больших файлов
- Освобождение памяти после обработки сегментов
- Мониторинг использования памяти

### 4. Аппаратное ускорение
- Поддержка GPU кодирования (NVENC, QuickSync)
- Автоматическое определение доступного ускорения
- Fallback на CPU при недоступности GPU

## 🧪 Тестирование

### Unit Tests
- Тесты сериализации/десериализации схемы
- Тесты валидации проекта
- Тесты построения FFmpeg команд

### Integration Tests
- Тесты с реальными медиа файлами
- Тесты производительности
- Тесты стабильности длительных рендеров

### Test Files Structure
```
tests/
├── unit/
│   ├── schema_tests.rs
│   ├── ffmpeg_builder_tests.rs
│   └── pipeline_tests.rs
├── integration/
│   ├── render_tests.rs
│   ├── preview_tests.rs
│   └── performance_tests.rs
└── fixtures/
    ├── test_project.json
    ├── sample_video.mp4
    └── sample_audio.wav
```

## 🔄 Миграция и версионирование

### Schema Versioning
- Версионирование схемы проекта
- Автоматическая миграция старых проектов
- Обратная совместимость

### API Versioning
- Версионирование Tauri commands
- Graceful degradation для старых версий Frontend

## 📝 Следующие шаги реализации

### Фаза 1: Основа (1-2 недели)
1. Создать базовую структуру модуля
2. Реализовать схему данных
3. Добавить базовые Tauri commands
4. Создать простейший рендерер

### Фаза 2: Функционал (2-3 недели)
1. Реализовать FFmpegBuilder
2. Добавить RenderPipeline
3. Интегрировать с Timeline Frontend
4. Добавить базовые тесты

### Фаза 3: Оптимизация (1-2 недели)
1. Добавить Preview Generator
2. Реализовать ProgressTracker
3. Оптимизировать производительность
4. Расширить тестовое покрытие

### Фаза 4: Продвинутые функции (2-3 недели)
1. Добавить эффекты и переходы
2. Реализовать кэширование
3. Добавить аппаратное ускорение
4. Финальная оптимизация и тесты

## 🎯 Критерии готовности

- [ ] Модуль компилируется без ошибок и предупреждений
- [ ] Все базовые Tauri commands работают
- [ ] Можно создать и отрендерить простой проект
- [ ] Есть тесты с покрытием >80%
- [ ] Документация и примеры использования
- [ ] Интеграция с Timeline Frontend работает корректно