# Video Compiler Module

Модуль для компиляции видео проектов Timeline Studio с использованием FFmpeg.

## Архитектура

```
video_compiler/
├── mod.rs              # Главный модуль, инициализация
├── commands.rs         # Tauri команды API
├── ffmpeg_builder.rs   # Построитель FFmpeg команд
├── renderer.rs         # Основной рендерер видео
├── pipeline.rs         # Конвейер рендеринга
├── preview.rs          # Генерация превью
├── progress.rs         # Отслеживание прогресса
├── cache.rs            # Кэширование превью
├── gpu.rs              # GPU ускорение
├── schema.rs           # Структуры данных проекта
└── error.rs            # Обработка ошибок
```

## Основные компоненты

### VideoCompilerState
Центральное состояние модуля, управляемое Tauri:

```rust
pub struct VideoCompilerState {
    pub active_jobs: Arc<RwLock<HashMap<String, VideoRenderer>>>,
    pub cache_manager: Arc<RwLock<RenderCache>>,
    pub ffmpeg_path: String,
    pub settings: Arc<RwLock<CompilerSettings>>,
}
```

### Основные структуры данных

#### ProjectSchema
```rust
pub struct ProjectSchema {
    pub name: String,
    pub timeline: Timeline,
    pub tracks: Vec<Track>,
    pub settings: ProjectSettings,
}
```

#### Timeline
```rust
pub struct Timeline {
    pub duration: f64,           // Длительность в секундах
    pub fps: u32,                // Кадров в секунду
    pub resolution: (u32, u32),  // Ширина x Высота
}
```

#### Track
```rust
pub struct Track {
    pub id: String,
    pub track_type: TrackType,   // Video, Audio, Effects
    pub name: String,
    pub clips: Vec<Clip>,
    pub enabled: bool,
    pub locked: bool,
    pub volume: f32,
}
```

#### Clip
```rust
pub struct Clip {
    pub id: String,
    pub source_path: PathBuf,
    pub start_time: f64,         // Позиция на таймлайне
    pub duration: f64,           // Длительность
    pub source_in: f64,          // Начало в исходном файле
    pub effects: Vec<Effect>,
    pub transitions: Vec<Transition>,
}
```

## API Команды

### Компиляция видео
```rust
#[tauri::command]
pub async fn compile_video(
    project_schema: ProjectSchema,
    output_path: String,
    state: State<'_, VideoCompilerState>,
) -> Result<String> // Возвращает job_id
```

### Получение прогресса
```rust
#[tauri::command]
pub async fn get_render_progress(
    job_id: String,
    state: State<'_, VideoCompilerState>,
) -> Result<Option<RenderProgress>>
```

### Генерация превью
```rust
#[tauri::command]
pub async fn generate_preview(
    video_path: String,
    timestamp: f64,
    resolution: Option<(u32, u32)>,
    quality: Option<u8>,
    state: State<'_, VideoCompilerState>,
) -> Result<Vec<u8>> // PNG изображение
```

### GPU команды
```rust
#[tauri::command]
pub async fn get_gpu_capabilities(
    state: State<'_, VideoCompilerState>,
) -> Result<GpuCapabilities>

#[tauri::command]
pub async fn check_hardware_acceleration(
    state: State<'_, VideoCompilerState>,  
) -> Result<bool>
```

## Процесс рендеринга

1. **Валидация проекта** - проверка структуры и путей к файлам
2. **Построение FFmpeg команды** - создание сложной команды с фильтрами
3. **Запуск процесса** - выполнение FFmpeg с отслеживанием прогресса
4. **Мониторинг** - обновление статуса через каналы
5. **Завершение** - очистка ресурсов и уведомление

## GPU Ускорение

Поддерживаемые кодировщики:
- **NVIDIA**: NVENC (h264_nvenc, hevc_nvenc)
- **Intel**: QuickSync (h264_qsv, hevc_qsv)
- **AMD**: AMF (h264_amf, hevc_amf)
- **macOS**: VideoToolbox (h264_videotoolbox, hevc_videotoolbox)
- **Linux**: VA-API (h264_vaapi, hevc_vaapi)

## Кэширование

LRU кэш для:
- Превью кадров
- Метаданных файлов
- Промежуточных результатов

```rust
pub struct CacheStats {
    pub total_size_mb: f64,
    pub preview_count: usize,
    pub metadata_count: usize,
    pub render_cache_count: usize,
}
```

## Обработка ошибок

```rust
pub enum VideoCompilerError {
    ValidationError(String),
    DependencyMissing(String),
    RenderError(String),
    GpuError(String),
    CacheError(String),
    PreviewError { timestamp: f64, reason: String },
    // ...
}
```

## Использование из фронтенда

```typescript
// Компиляция видео
const jobId = await invoke('compile_video', {
    projectSchema: project,
    outputPath: '/path/to/output.mp4'
});

// Отслеживание прогресса
const progress = await invoke('get_render_progress', { jobId });

// Генерация превью
const previewData = await invoke('generate_preview', {
    videoPath: '/path/to/video.mp4',
    timestamp: 10.5,
    resolution: [640, 360],
    quality: 85
});
```

## Конфигурация

```rust
pub struct CompilerSettings {
    pub max_concurrent_jobs: usize,
    pub cache_size_mb: usize,
    pub temp_directory: PathBuf,
    pub hardware_acceleration: bool,
    pub preview_quality: u8,
}
```