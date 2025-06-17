# Backend архитектура

[← Назад к разделу](README.md) | [← К оглавлению](../README.md)

## 📋 Содержание

- [Обзор технологий](#обзор-технологий)
- [Модульная структура](#модульная-структура)
- [Tauri интеграция](#tauri-интеграция)
- [FFmpeg обработка](#ffmpeg-обработка)
- [ML/AI возможности](#mlai-возможности)
- [Управление данными](#управление-данными)
- [Производительность](#производительность)

## 🦀 Обзор технологий

### Основной стек
- **Rust** - системный язык программирования
- **Tauri v2** - фреймворк для desktop приложений
- **Tokio** - асинхронный runtime
- **FFmpeg** - обработка видео/аудио

### Ключевые библиотеки
```toml
[dependencies]
tauri = "2.0"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
ffmpeg-next = "7.0"
ort = "2.0"  # ONNX Runtime
sqlx = { version = "0.7", features = ["sqlite"] }
rayon = "1.8"  # Параллельные вычисления
```

## 📦 Модульная структура

```
src-tauri/src/
├── main.rs              # Точка входа
├── lib.rs              # Корневой модуль
│
├── commands/           # Tauri команды
│   ├── mod.rs
│   ├── media.rs       # Медиа команды
│   ├── project.rs     # Проект команды
│   └── export.rs      # Экспорт команды
│
├── media/             # Медиа обработка
│   ├── mod.rs
│   ├── scanner.rs     # Сканирование файлов
│   ├── metadata.rs    # Метаданные
│   ├── thumbnail.rs   # Генерация превью
│   └── cache.rs       # Кэширование
│
├── video_compiler/    # Видео компиляция
│   ├── mod.rs
│   ├── ffmpeg.rs     # FFmpeg wrapper
│   ├── encoder.rs    # Кодирование
│   ├── effects.rs    # Применение эффектов
│   └── gpu.rs        # GPU ускорение
│
├── recognition/       # ML распознавание
│   ├── mod.rs
│   ├── yolo.rs       # YOLO интеграция
│   ├── tracker.rs    # Объект трекинг
│   └── models.rs     # Управление моделями
│
└── utils/            # Утилиты
    ├── mod.rs
    ├── fs.rs         # Файловая система
    └── error.rs      # Обработка ошибок
```

## 🔧 Tauri интеграция

### Команды (Commands)

```rust
// commands/media.rs
#[tauri::command]
pub async fn get_media_metadata(
    path: String,
    state: State<'_, AppState>
) -> Result<MediaMetadata, String> {
    // Проверка кэша
    if let Some(cached) = state.cache.get(&path).await {
        return Ok(cached);
    }
    
    // Извлечение метаданных через FFmpeg
    let metadata = media::extract_metadata(&path)
        .await
        .map_err(|e| e.to_string())?;
    
    // Сохранение в кэш
    state.cache.insert(path, metadata.clone()).await;
    
    Ok(metadata)
}

#[tauri::command]
pub async fn scan_media_folder(
    folder: String,
    state: State<'_, AppState>
) -> Result<Vec<MediaFile>, String> {
    let scanner = MediaScanner::new();
    let files = scanner
        .scan_directory(&folder)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(files)
}
```

### События (Events)

```rust
// Отправка событий прогресса
pub fn emit_progress(window: &Window, progress: f32, message: &str) {
    window.emit("export-progress", ExportProgress {
        progress,
        message: message.to_string(),
        timestamp: SystemTime::now(),
    }).unwrap();
}

// Использование в экспорте
async fn export_video_internal(
    window: Window,
    settings: ExportSettings,
) -> Result<String> {
    let encoder = VideoEncoder::new(settings);
    
    // Подписка на прогресс
    encoder.on_progress(move |progress| {
        emit_progress(&window, progress, "Encoding video...");
    });
    
    let output_path = encoder.encode().await?;
    Ok(output_path)
}
```

## 🎥 FFmpeg обработка

### Архитектура Video Compiler

```rust
// video_compiler/ffmpeg.rs
pub struct FFmpegWrapper {
    command: Command,
    filters: Vec<VideoFilter>,
    gpu_acceleration: Option<GpuAcceleration>,
}

impl FFmpegWrapper {
    pub fn new() -> Self {
        let mut command = Command::new("ffmpeg");
        command.arg("-hide_banner");
        
        Self {
            command,
            filters: Vec::new(),
            gpu_acceleration: detect_gpu_acceleration(),
        }
    }
    
    pub fn input(mut self, path: &str) -> Self {
        self.command.args(&["-i", path]);
        self
    }
    
    pub fn output_settings(mut self, settings: &ExportSettings) -> Self {
        // Видео кодек
        match &self.gpu_acceleration {
            Some(GpuAcceleration::Nvidia) => {
                self.command.args(&["-c:v", "h264_nvenc"]);
            }
            Some(GpuAcceleration::Intel) => {
                self.command.args(&["-c:v", "h264_qsv"]);
            }
            _ => {
                self.command.args(&["-c:v", "libx264"]);
            }
        }
        
        // Битрейт и качество
        self.command.args(&[
            "-b:v", &settings.video_bitrate,
            "-preset", &settings.preset,
            "-crf", &settings.quality.to_string(),
        ]);
        
        self
    }
}
```

### Применение эффектов

```rust
// video_compiler/effects.rs
pub struct EffectProcessor {
    ffmpeg: FFmpegWrapper,
}

impl EffectProcessor {
    pub fn apply_filter(&mut self, filter: VideoFilter) {
        match filter {
            VideoFilter::Brightness(value) => {
                self.ffmpeg.add_filter(&format!("eq=brightness={}", value));
            }
            VideoFilter::Blur(radius) => {
                self.ffmpeg.add_filter(&format!("boxblur={}", radius));
            }
            VideoFilter::ChromaKey { color, threshold } => {
                self.ffmpeg.add_filter(&format!(
                    "chromakey={}:{}:0.01", 
                    color, threshold
                ));
            }
        }
    }
    
    pub fn apply_transition(&mut self, transition: Transition) {
        match transition {
            Transition::Fade { duration } => {
                self.ffmpeg.add_filter(&format!(
                    "fade=t=in:st=0:d={}", 
                    duration
                ));
            }
            Transition::Wipe { direction, duration } => {
                // Сложная логика для wipe transition
            }
        }
    }
}
```

## 🤖 ML/AI возможности

### YOLO интеграция

```rust
// recognition/yolo.rs
use ort::{Environment, Session, Value};

pub struct YoloDetector {
    session: Session,
    input_size: (u32, u32),
}

impl YoloDetector {
    pub fn new(model_path: &str) -> Result<Self> {
        let environment = Environment::builder()
            .with_name("yolo")
            .build()?;
            
        let session = Session::builder(&environment)?
            .with_model_from_file(model_path)?;
            
        Ok(Self {
            session,
            input_size: (640, 640),
        })
    }
    
    pub async fn detect(&self, frame: &VideoFrame) -> Result<Vec<Detection>> {
        // Предобработка кадра
        let input = self.preprocess_frame(frame)?;
        
        // Запуск инференса
        let outputs = self.session.run(vec![input])?;
        
        // Постобработка результатов
        let detections = self.postprocess_outputs(outputs)?;
        
        Ok(detections)
    }
    
    fn preprocess_frame(&self, frame: &VideoFrame) -> Result<Value> {
        // Изменение размера до 640x640
        let resized = frame.resize(self.input_size.0, self.input_size.1)?;
        
        // Нормализация значений
        let normalized = resized.normalize(0.0, 1.0);
        
        // Конвертация в тензор
        Ok(Value::from_array(normalized)?)
    }
}
```

### Трекинг объектов

```rust
// recognition/tracker.rs
pub struct ObjectTracker {
    tracks: HashMap<u32, Track>,
    next_id: u32,
}

impl ObjectTracker {
    pub fn update(&mut self, detections: Vec<Detection>) -> Vec<TrackedObject> {
        let mut tracked = Vec::new();
        
        // Сопоставление с существующими треками
        for detection in detections {
            if let Some(track_id) = self.match_detection(&detection) {
                self.tracks.get_mut(&track_id).unwrap().update(detection);
                tracked.push(TrackedObject {
                    id: track_id,
                    detection,
                    history: self.tracks[&track_id].history.clone(),
                });
            } else {
                // Создание нового трека
                let id = self.next_id;
                self.next_id += 1;
                
                self.tracks.insert(id, Track::new(detection.clone()));
                tracked.push(TrackedObject {
                    id,
                    detection,
                    history: vec![],
                });
            }
        }
        
        tracked
    }
}
```

## 💾 Управление данными

### Кэширование

```rust
// media/cache.rs
use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};

pub struct MediaCache {
    pool: SqlitePool,
    memory_cache: Arc<RwLock<LruCache<String, CachedItem>>>,
}

impl MediaCache {
    pub async fn new(db_path: &str) -> Result<Self> {
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(db_path)
            .await?;
            
        // Создание таблиц
        sqlx::query!(
            r#"
            CREATE TABLE IF NOT EXISTS media_cache (
                path TEXT PRIMARY KEY,
                metadata TEXT NOT NULL,
                thumbnail BLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            "#
        )
        .execute(&pool)
        .await?;
        
        let memory_cache = Arc::new(RwLock::new(
            LruCache::new(NonZeroUsize::new(1000).unwrap())
        ));
        
        Ok(Self { pool, memory_cache })
    }
    
    pub async fn get(&self, path: &str) -> Option<MediaMetadata> {
        // Проверка memory cache
        if let Some(item) = self.memory_cache.read().unwrap().get(path) {
            return Some(item.metadata.clone());
        }
        
        // Проверка disk cache
        if let Ok(record) = sqlx::query!(
            "SELECT metadata FROM media_cache WHERE path = ?",
            path
        )
        .fetch_one(&self.pool)
        .await {
            let metadata: MediaMetadata = serde_json::from_str(&record.metadata).ok()?;
            
            // Обновление memory cache
            self.memory_cache.write().unwrap().put(
                path.to_string(),
                CachedItem { metadata: metadata.clone() }
            );
            
            return Some(metadata);
        }
        
        None
    }
}
```

### Управление проектами

```rust
// project/manager.rs
pub struct ProjectManager {
    projects_dir: PathBuf,
    current_project: Option<Project>,
}

impl ProjectManager {
    pub async fn save_project(&self, project: &Project) -> Result<()> {
        let project_path = self.projects_dir.join(&project.id).join("project.json");
        
        // Сериализация проекта
        let json = serde_json::to_string_pretty(project)?;
        
        // Атомарная запись
        let temp_path = project_path.with_extension("tmp");
        fs::write(&temp_path, json).await?;
        fs::rename(temp_path, project_path).await?;
        
        // Сохранение медиа ссылок
        self.save_media_references(project).await?;
        
        Ok(())
    }
    
    async fn save_media_references(&self, project: &Project) -> Result<()> {
        let media_db = self.projects_dir.join(&project.id).join("media.db");
        
        let pool = SqlitePool::connect(&media_db.to_string_lossy()).await?;
        
        for media in &project.media_files {
            sqlx::query!(
                r#"
                INSERT OR REPLACE INTO media_references 
                (id, original_path, relative_path, hash, size)
                VALUES (?, ?, ?, ?, ?)
                "#,
                media.id,
                media.original_path,
                media.relative_path,
                media.hash,
                media.size
            )
            .execute(&pool)
            .await?;
        }
        
        Ok(())
    }
}
```

## ⚡ Производительность

### Параллельная обработка

```rust
use rayon::prelude::*;

// Параллельная генерация превью
pub async fn generate_thumbnails(files: Vec<MediaFile>) -> Vec<Thumbnail> {
    files
        .par_iter()
        .map(|file| {
            generate_single_thumbnail(file).unwrap_or_default()
        })
        .collect()
}

// Параллельное применение эффектов
pub fn apply_effects_parallel(
    frames: Vec<VideoFrame>,
    effects: Vec<Effect>
) -> Vec<VideoFrame> {
    frames
        .par_chunks(100)
        .flat_map(|chunk| {
            chunk.iter().map(|frame| {
                let mut processed = frame.clone();
                for effect in &effects {
                    processed = effect.apply(processed);
                }
                processed
            }).collect::<Vec<_>>()
        })
        .collect()
}
```

### GPU ускорение

```rust
// video_compiler/gpu.rs
pub enum GpuAcceleration {
    Nvidia,    // NVENC
    Intel,     // QuickSync
    Amd,       // AMF
    Apple,     // VideoToolbox
}

pub fn detect_gpu_acceleration() -> Option<GpuAcceleration> {
    #[cfg(target_os = "windows")]
    {
        if check_nvenc_available() {
            return Some(GpuAcceleration::Nvidia);
        }
        if check_quicksync_available() {
            return Some(GpuAcceleration::Intel);
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        return Some(GpuAcceleration::Apple);
    }
    
    None
}
```

## 🔐 Безопасность

1. **Изоляция процессов** - FFmpeg запускается в отдельном процессе
2. **Валидация путей** - проверка всех файловых путей
3. **Ограничение ресурсов** - лимиты на использование CPU/RAM
4. **Шифрование данных** - чувствительные данные шифруются

---

[← Frontend архитектура](frontend.md) | [Далее: Взаимодействие компонентов →](communication.md)