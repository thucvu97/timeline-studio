# Функциональность экспорта видео - Timeline Studio

## 📋 Обзор

Модуль экспорта Timeline Studio предоставляет мощные возможности для рендеринга видео проектов с поддержкой различных форматов, кодеков и профилей качества. Система поддерживает аппаратное ускорение через GPU и предоставляет гибкие настройки для оптимизации процесса экспорта.

## 🚀 Основные возможности

### 1. Форматы экспорта

```rust
pub enum OutputFormat {
  Mp4,     // Универсальный формат для всех платформ
  Avi,     // Классический формат для Windows
  Mov,     // Формат Apple QuickTime
  Mkv,     // Открытый контейнер Matroska
  WebM,    // Оптимизирован для веба
  Gif,     // Анимированные изображения
  Custom(String), // Пользовательские форматы
}
```

### 2. Настройки экспорта

```rust
pub struct ExportSettings {
  /// Формат вывода видео
  pub format: OutputFormat,
  
  /// Качество (1-100)
  pub quality: u8,
  
  /// Битрейт видео в kbps
  pub video_bitrate: u32,
  
  /// Битрейт аудио в kbps
  pub audio_bitrate: u32,
  
  /// Использовать GPU ускорение
  pub hardware_acceleration: bool,
  
  /// Предпочитаемый GPU кодировщик
  pub preferred_gpu_encoder: Option<String>,
  
  /// Дополнительные параметры FFmpeg
  pub ffmpeg_args: Vec<String>,
}
```

### 3. Профили качества

По умолчанию система предоставляет оптимизированные настройки:

```rust
impl Default for ExportSettings {
  fn default() -> Self {
    Self {
      format: OutputFormat::Mp4,
      quality: 85,
      video_bitrate: 8000,  // 8 Mbps
      audio_bitrate: 192,   // 192 kbps
      hardware_acceleration: true,
      preferred_gpu_encoder: None,
      ffmpeg_args: Vec::new(),
    }
  }
}
```

## 🎯 Пресеты экспорта

### Социальные сети

#### YouTube
- **Разрешение**: До 4K (3840x2160)
- **FPS**: До 60
- **Битрейт**: 
  - 4K: 35-45 Mbps
  - 1080p: 8-12 Mbps
  - 720p: 5-7.5 Mbps
- **Формат**: MP4 (H.264/H.265)

#### TikTok
- **Разрешение**: До 1080p
- **FPS**: До 60
- **Битрейт**: 4-6 Mbps
- **Формат**: MP4 (H.264)
- **Соотношение**: 9:16 (вертикальное)

#### Instagram
- **Разрешение**: До 1080p
- **FPS**: 30
- **Битрейт**: 3.5-5 Mbps
- **Формат**: MP4 (H.264)
- **Длительность**: До 60 сек (лента), до 15 мин (IGTV)

### Устройства

#### iPhone/iPad
- **Кодек**: H.264/H.265
- **Разрешение**: Адаптивное
- **Битрейт**: 6-10 Mbps
- **Аудио**: AAC 256 kbps

#### Android
- **Кодек**: H.264
- **Разрешение**: Адаптивное
- **Битрейт**: 4-8 Mbps
- **Аудио**: AAC 192 kbps

## ⚡ GPU ускорение

### Поддерживаемые кодировщики

1. **NVIDIA NVENC**
   - H.264: `h264_nvenc`
   - H.265/HEVC: `hevc_nvenc`
   - AV1: `av1_nvenc` (RTX 40 серия)

2. **AMD AMF**
   - H.264: `h264_amf`
   - H.265/HEVC: `hevc_amf`

3. **Intel Quick Sync**
   - H.264: `h264_qsv`
   - H.265/HEVC: `hevc_qsv`

4. **Apple VideoToolbox** (macOS)
   - H.264: `h264_videotoolbox`
   - H.265/HEVC: `hevc_videotoolbox`

### Автоматический выбор кодировщика

Система автоматически определяет доступные GPU кодировщики:

```rust
#[tauri::command]
pub async fn get_recommended_gpu_encoder(
  state: State<'_, VideoCompilerState>,
) -> Result<Option<String>>
```

## 📊 Мониторинг прогресса

### Отслеживание рендеринга

```rust
pub struct RenderProgress {
  /// Процент выполнения (0-100)
  pub percent: f32,
  
  /// Текущий обрабатываемый кадр
  pub current_frame: u32,
  
  /// Общее количество кадров
  pub total_frames: u32,
  
  /// Прошедшее время
  pub elapsed_time: Duration,
  
  /// Оставшееся время (оценка)
  pub estimated_time_remaining: Option<Duration>,
  
  /// Текущая скорость (fps)
  pub fps: f32,
  
  /// Статус
  pub status: RenderStatus,
}
```

### События рендеринга

```rust
pub enum VideoCompilerEvent {
  /// Рендеринг начат
  RenderStarted { job_id: String },
  
  /// Прогресс рендеринга
  RenderProgress { 
    job_id: String, 
    progress: RenderProgress 
  },
  
  /// Рендеринг завершен
  RenderCompleted { 
    job_id: String, 
    output_path: PathBuf 
  },
  
  /// Ошибка рендеринга
  RenderFailed { 
    job_id: String, 
    error: String 
  },
}
```

## 🔧 API команды

### compile_video

Запускает процесс рендеринга видео:

```typescript
interface CompileVideoParams {
  projectSchema: ProjectSchema;
  outputPath: string;
}

// Возвращает job_id для отслеживания прогресса
const jobId = await invoke('compile_video', params);
```

### get_render_progress

Получает текущий прогресс рендеринга:

```typescript
const progress = await invoke('get_render_progress', { 
  jobId: string 
});
```

### cancel_render

Отменяет активный процесс рендеринга:

```typescript
const cancelled = await invoke('cancel_render', { 
  jobId: string 
});
```

## 🎨 Настройки качества

### Предустановки качества

1. **Best (95%)**
   - Битрейт: 12-20 Mbps
   - Профиль: High
   - Уровень: 5.1
   - Preset: slow

2. **Good (85%)**
   - Битрейт: 8-12 Mbps
   - Профиль: Main
   - Уровень: 4.1
   - Preset: medium

3. **Normal (75%)**
   - Битрейт: 4-8 Mbps
   - Профиль: Main
   - Уровень: 4.0
   - Preset: fast

## 🛠️ Расширенные настройки

### Пользовательские параметры FFmpeg

```rust
// Добавление дополнительных параметров
export_settings.ffmpeg_args = vec![
  "-preset".to_string(), 
  "veryslow".to_string(),
  "-crf".to_string(), 
  "18".to_string(),
  "-tune".to_string(), 
  "film".to_string(),
];
```

### Примеры использования

#### Экспорт для YouTube в 4K:
```rust
ExportSettings {
  format: OutputFormat::Mp4,
  quality: 95,
  video_bitrate: 40000, // 40 Mbps
  audio_bitrate: 320,   // 320 kbps
  hardware_acceleration: true,
  preferred_gpu_encoder: Some("hevc_nvenc".to_string()),
  ffmpeg_args: vec![
    "-preset".to_string(), "slow".to_string(),
    "-profile:v".to_string(), "main".to_string(),
  ],
}
```

#### Экспорт для мобильных устройств:
```rust
ExportSettings {
  format: OutputFormat::Mp4,
  quality: 80,
  video_bitrate: 4000,  // 4 Mbps
  audio_bitrate: 128,   // 128 kbps
  hardware_acceleration: true,
  preferred_gpu_encoder: Some("h264_videotoolbox".to_string()),
  ffmpeg_args: vec![
    "-movflags".to_string(), 
    "+faststart".to_string(), // Для быстрого старта воспроизведения
  ],
}
```

## 📈 Оптимизация производительности

### Рекомендации

1. **Используйте GPU ускорение** когда возможно
2. **Выбирайте правильный preset** в зависимости от задачи
3. **Настройте битрейт** под целевую платформу
4. **Используйте двухпроходное кодирование** для лучшего качества
5. **Включите многопоточность** для CPU кодирования

### Пример оптимизации для стриминга:

```rust
ExportSettings {
  format: OutputFormat::Mp4,
  quality: 85,
  video_bitrate: 6000,
  audio_bitrate: 160,
  hardware_acceleration: true,
  preferred_gpu_encoder: Some("h264_nvenc".to_string()),
  ffmpeg_args: vec![
    "-preset".to_string(), "llhq".to_string(),  // Low latency high quality
    "-rc".to_string(), "cbr".to_string(),       // Constant bitrate
    "-g".to_string(), "60".to_string(),         // Keyframe interval
  ],
}
```

## 🔄 Интеграция с frontend

### React Hook использование

```typescript
import { useVideoCompiler } from '@/features/export/hooks';

const ExportComponent = () => {
  const { 
    compileVideo, 
    progress, 
    isRendering, 
    cancelRender 
  } = useVideoCompiler();
  
  const handleExport = async () => {
    const jobId = await compileVideo({
      projectSchema,
      outputPath: '/path/to/output.mp4',
      settings: {
        format: 'mp4',
        quality: 85,
        videoBitrate: 8000,
        audioBitrate: 192,
        hardwareAcceleration: true,
      }
    });
  };
  
  return (
    <div>
      {isRendering && (
        <ProgressBar value={progress.percent} />
      )}
    </div>
  );
};
```

## 📚 См. также

- [API Reference](../api/API.md) - Полный справочник команд
- [Video Compiler README](../../src-tauri/src/video_compiler/README.md) - Техническая документация
- [GPU Detection](../development-guides/gpu-acceleration.md) - Руководство по GPU ускорению

---

*Последнее обновление: 15 июня 2025*