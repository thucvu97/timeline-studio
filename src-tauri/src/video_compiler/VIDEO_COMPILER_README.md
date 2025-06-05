# Video Compiler - Центральный модуль компиляции видео

## 🎯 Обзор

Video Compiler - это центральный модуль Timeline Studio, написанный на Rust, который отвечает за компиляцию проектов монтажа в финальное видео с использованием FFmpeg.

## 🚀 Быстрый старт

### Предварительные требования

1. **FFmpeg** должен быть установлен в системе:
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt install ffmpeg
   
   # Windows
   # Скачать с https://ffmpeg.org/download.html
   ```

2. **Rust** версии 1.70+:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

### Установка зависимостей

Добавить в `src-tauri/Cargo.toml`:

```toml
[dependencies]
ffmpeg-next = "7.0"
uuid = { version = "1.0", features = ["serde"] }
tokio = { version = "1.0", features = ["full"] }
futures = "0.3"
dashmap = "5.0"
image = "0.24"
chrono = { version = "0.4", features = ["serde"] }
```

### Создание структуры модуля

```bash
mkdir -p src-tauri/src/video_compiler
cd src-tauri/src/video_compiler

# Создать основные файлы
touch mod.rs schema.rs renderer.rs ffmpeg_builder.rs
touch pipeline.rs preview.rs progress.rs cache.rs error.rs
```

## 📊 Архитектура

### Основные компоненты

1. **ProjectSchema** - Описание проекта в JSON формате
2. **VideoRenderer** - Основной рендерер видео
3. **FFmpegBuilder** - Построение команд FFmpeg
4. **RenderPipeline** - Конвейер обработки
5. **PreviewGenerator** - Генерация превью кадров
6. **ProgressTracker** - Отслеживание прогресса

### Поток данных

```
React Timeline → ProjectSchema → VideoRenderer → FFmpeg → Результат
                     ↓              ↓            ↓
                PreviewGen → ProgressTracker → WebSocket → React UI
```

## 🔧 Основные типы данных

### ProjectSchema

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
pub struct Timeline {
    pub duration: f64,          // секунды
    pub fps: u32,               // кадры в секунду
    pub resolution: (u32, u32), // (ширина, высота)
    pub sample_rate: u32,       // частота аудио
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Track {
    pub id: String,
    pub track_type: TrackType,  // Video, Audio, Subtitle
    pub name: String,
    pub enabled: bool,
    pub volume: f32,            // 0.0 - 1.0
    pub clips: Vec<Clip>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Clip {
    pub id: String,
    pub source_path: PathBuf,
    pub start_time: f64,        // время на timeline
    pub end_time: f64,
    pub source_start: f64,      // время в исходном файле
    pub source_end: f64,
    pub speed: f32,             // скорость воспроизведения
    pub volume: f32,
}
```

## 🔌 Tauri Integration

### Основные команды

```rust
#[tauri::command]
pub async fn compile_video(
    project_schema: ProjectSchema,
    output_path: String
) -> Result<String, String> {
    // Возвращает job_id для отслеживания
}

#[tauri::command]
pub async fn get_render_progress(
    job_id: String
) -> Result<RenderProgress, String> {
    // Текущий прогресс рендеринга
}

#[tauri::command]
pub async fn generate_preview(
    project_schema: ProjectSchema,
    timestamp: f64
) -> Result<Vec<u8>, String> {
    // Превью кадр в формате JPEG
}

#[tauri::command]
pub async fn cancel_render(
    job_id: String
) -> Result<bool, String> {
    // Отмена рендеринга
}
```

### Frontend интеграция

```typescript
// React хуки для работы с Video Compiler
export const useVideoCompiler = () => {
  const compileVideo = async (project: ProjectSchema, outputPath: string) => {
    return await invoke('compile_video', { project_schema: project, output_path: outputPath });
  };

  const getProgress = async (jobId: string) => {
    return await invoke('get_render_progress', { job_id: jobId });
  };

  const generatePreview = async (project: ProjectSchema, timestamp: number) => {
    return await invoke('generate_preview', { project_schema: project, timestamp });
  };

  return { compileVideo, getProgress, generatePreview };
};
```

## 📈 Прогресс и мониторинг

### RenderProgress структура

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RenderProgress {
    pub job_id: String,
    pub stage: String,           // "validation", "processing", "encoding"
    pub percentage: f32,         // 0.0 - 100.0
    pub current_frame: u64,
    pub total_frames: u64,
    pub elapsed_time: Duration,
    pub estimated_remaining: Option<Duration>,
    pub status: RenderStatus,    // Queued, Processing, Completed, Failed
    pub message: Option<String>,
}
```

### WebSocket события

```rust
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

## 🧪 Тестирование

### Структура тестов

```
tests/
├── unit/
│   ├── schema_tests.rs          // Тесты схемы проекта
│   ├── ffmpeg_builder_tests.rs  // Тесты построения команд
│   └── pipeline_tests.rs        // Тесты конвейера
├── integration/
│   ├── render_tests.rs          // Тесты рендеринга
│   ├── preview_tests.rs         // Тесты превью
│   └── performance_tests.rs     // Тесты производительности
└── fixtures/
    ├── test_project.json        // Тестовый проект
    ├── sample_video.mp4         // Образцы медиа
    └── sample_audio.wav
```

### Запуск тестов

```bash
# Все тесты
cargo test

# Только unit тесты
cargo test --lib

# Интеграционные тесты
cargo test --test integration

# С покрытием
cargo tarpaulin --out Html
```

## 🚀 План разработки

### Этап 1: Основа (Неделя 1-2)
- [ ] Создать базовую структуру модуля
- [ ] Реализовать схему данных (ProjectSchema, Timeline, Track, Clip)
- [ ] Добавить базовые Tauri commands
- [ ] Создать простейший рендерер для одного клипа

### Этап 2: Функционал (Неделя 3-4)
- [ ] Реализовать FFmpegBuilder для построения команд
- [ ] Добавить RenderPipeline с этапами обработки
- [ ] Интегрировать с Timeline Frontend
- [ ] Добавить базовое тестирование

### Этап 3: UX (Неделя 5-6)
- [ ] Добавить PreviewGenerator для превью кадров
- [ ] Реализовать ProgressTracker с WebSocket
- [ ] Оптимизировать производительность
- [ ] Расширить тестовое покрытие

### Этап 4: Продвинутые функции (Неделя 7-8)
- [ ] Добавить поддержку эффектов и переходов
- [ ] Реализовать кэширование превью
- [ ] Добавить аппаратное ускорение (GPU)
- [ ] Финальная оптимизация и документация

## 🔧 Отладка и диагностика

### Логирование

```rust
use log::{info, warn, error, debug};

// В процессе рендеринга
info!("Starting video compilation for project: {}", project.metadata.name);
debug!("Processing track {} with {} clips", track.name, track.clips.len());
warn!("Low memory warning: {}MB available", available_memory);
error!("FFmpeg failed with exit code: {}", exit_code);
```

### Метрики производительности

```rust
use std::time::Instant;

let start = Instant::now();
// ... рендеринг
let duration = start.elapsed();
info!("Rendering completed in {:?}", duration);
```

## 📚 Полезные ресурсы

- **FFmpeg документация**: https://ffmpeg.org/documentation.html
- **ffmpeg-next crate**: https://docs.rs/ffmpeg-next/
- **Tauri Command документация**: https://tauri.app/v1/guides/features/command
- **Rust async/await**: https://rust-lang.github.io/async-book/

## 🤝 Участие в разработке

### Создание Pull Request

1. Форкнуть репозиторий
2. Создать feature ветку: `git checkout -b feature/video-compiler-renderer`
3. Коммитить изменения: `git commit -am 'Add video renderer functionality'`
4. Отправить ветку: `git push origin feature/video-compiler-renderer`
5. Создать Pull Request

### Code Style

```bash
# Форматирование кода
cargo fmt

# Проверка линтером
cargo clippy

# Проверка перед коммитом
cargo fmt && cargo clippy && cargo test
```

## ❓ FAQ

**Q: Какие форматы видео поддерживаются?**
A: Все форматы, поддерживаемые FFmpeg: MP4, AVI, MOV, MKV, WebM и др.

**Q: Можно ли использовать GPU для ускорения?**
A: Да, планируется поддержка NVENC (NVIDIA) и QuickSync (Intel).

**Q: Как обрабатываются большие файлы?**
A: Используется потоковая обработка без полной загрузки в память.

**Q: Поддерживается ли многопоточность?**
A: Да, используется tokio для асинхронной обработки и параллельных операций.

---

**Начните разработку с создания Issue #1: "Создать Video Compiler модуль (Rust/FFmpeg)"**