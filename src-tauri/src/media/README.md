# Media Module

Модуль для работы с медиафайлами в Timeline Studio.

## Архитектура

```
media/
├── mod.rs           # Главный модуль
├── metadata.rs      # Извлечение метаданных через FFprobe
├── scanner.rs       # Сканирование директорий
├── thumbnail.rs     # Генерация миниатюр
└── utils.rs         # Вспомогательные функции
```

## Основные компоненты

### MediaMetadata
Метаданные медиафайла:

```rust
pub struct MediaMetadata {
    pub path: PathBuf,
    pub file_type: FileType,
    pub size: u64,
    pub created: SystemTime,
    pub modified: SystemTime,
    pub duration: Option<f64>,
    pub dimensions: Option<(u32, u32)>,
    pub fps: Option<f32>,
    pub bitrate: Option<u64>,
    pub codec: Option<String>,
    pub has_audio: bool,
    pub audio_channels: Option<u32>,
    pub audio_sample_rate: Option<u32>,
}
```

### FileType
```rust
pub enum FileType {
    Video,
    Audio,
    Image,
    Unknown,
}
```

## API Команды

### Получение метаданных файла
```rust
#[tauri::command]
pub async fn get_media_metadata(
    file_path: String
) -> Result<MediaMetadata, String>
```

### Сканирование директории
```rust
#[tauri::command]
pub async fn get_media_files(
    directory_path: String
) -> Result<Vec<MediaMetadata>, String>
```

## Основные функции

### Извлечение метаданных
```rust
pub async fn extract_metadata(path: &Path) -> Result<MediaMetadata>
```
Использует FFprobe для получения детальной информации о медиафайле.

### Определение типа файла
```rust
pub fn get_file_type(path: &Path) -> FileType
```
Определяет тип файла по расширению.

### Форматирование
```rust
pub fn format_duration(seconds: f64) -> String
pub fn format_file_size(bytes: u64) -> String
pub fn format_resolution(width: u32, height: u32) -> String
```

## Поддерживаемые форматы

### Видео
- MP4, MOV, AVI, MKV
- WEBM, MPG, MPEG
- M4V, WMV, FLV

### Аудио  
- MP3, WAV, AAC, M4A
- OGG, FLAC, WMA
- AIFF, APE

### Изображения
- JPG, JPEG, PNG
- GIF, BMP, WEBP
- TIFF, SVG

## Работа с FFprobe

Модуль использует FFprobe для извлечения метаданных:

```rust
let output = Command::new("ffprobe")
    .args([
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        path.to_str().unwrap()
    ])
    .output()
    .await?;
```

## Кэширование

Метаданные кэшируются для улучшения производительности:
- Кэш хранится в памяти
- Инвалидация по времени модификации файла
- Автоматическая очистка устаревших записей

## Обработка ошибок

```rust
pub enum MediaError {
    IoError(String),
    FfprobeError(String),
    InvalidPath(String),
    UnsupportedFormat(String),
}
```

## Использование из фронтенда

```typescript
// Получить метаданные файла
const metadata = await invoke('get_media_metadata', {
    filePath: '/path/to/video.mp4'
});

// Сканировать директорию
const files = await invoke('get_media_files', {
    directoryPath: '/path/to/media/folder'
});
```

## Интеграция с другими модулями

- **video_compiler** - использует метаданные для валидации проекта
- **preview** - генерация миниатюр для медиафайлов
- **timeline** - отображение информации о клипах