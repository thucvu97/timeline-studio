# План реализации оптимизации загрузки видео

## 📋 Краткая сводка анализа

После изучения кодовой базы Timeline Studio выявлены следующие ключевые моменты:

1. **Текущая реализация**:
   - Видео загружаются через `convertFileSrc()` с протоколом `asset://`
   - Используется `preload="auto"` для всех видео
   - Нет поддержки частичной загрузки (range requests)
   - Есть мощная система video-compiler с поддержкой preview generation

2. **Доступные ресурсы**:
   - Video Compiler с кешированием и preview generation
   - Файловая система API в Rust
   - Поддержка кастомных протоколов в Tauri v2
   - XState машины для управления состоянием

## 🎯 Рекомендуемый план реализации

### Фаза 1: Быстрые улучшения (1-2 дня)

#### 1.1 Оптимизация preload стратегии

**Файлы для создания:**
```typescript
// src/features/video-player/hooks/use-video-preload.ts
import { useEffect, useState } from 'react'
import { MediaFile } from '@/features/media/types/media'
import { invoke } from '@tauri-apps/api/core'

export function useVideoPreload(file: MediaFile | null) {
  const [preloadStrategy, setPreloadStrategy] = useState<'none' | 'metadata' | 'auto'>('metadata')
  
  useEffect(() => {
    if (!file) return
    
    const determineStrategy = async () => {
      try {
        const stats = await invoke<{ size: number }>('get_file_stats', { path: file.path })
        
        if (stats.size < 50 * 1024 * 1024) { // < 50MB
          setPreloadStrategy('auto')
        } else if (stats.size < 200 * 1024 * 1024) { // < 200MB
          setPreloadStrategy('metadata')
        } else {
          setPreloadStrategy('none')
        }
      } catch (error) {
        console.error('Failed to get file stats:', error)
        setPreloadStrategy('metadata')
      }
    }
    
    determineStrategy()
  }, [file])
  
  return preloadStrategy
}
```

**Изменения в существующих файлах:**

1. `src/features/video-player/components/video-player.tsx`:
```typescript
// Добавить импорт
import { useVideoPreload } from '../hooks/use-video-preload'

// В компоненте VideoPlayer
const preloadStrategy = useVideoPreload(video)

// Изменить video элемент
<video
  key={video.id || "no-video"}
  src={convertFileSrc(video.path)}
  preload={preloadStrategy} // Изменено с "auto"
  // ... остальные props
/>
```

2. `src/features/templates/components/video-panel-component.tsx`:
```typescript
// Добавить импорт
import { useVideoPreload } from '@/features/video-player/hooks/use-video-preload'

// В компоненте
const preloadStrategy = useVideoPreload(video)

// Изменить video элемент
<video
  preload={preloadStrategy} // Изменено с "auto"
  // ... остальные props
/>
```

#### 1.2 Добавление индикаторов загрузки

**Файлы для создания:**
```typescript
// src/features/video-player/hooks/use-video-loading.ts
import { useEffect, useState } from 'react'

export function useVideoLoading(videoRef: React.RefObject<HTMLVideoElement>) {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isBuffering, setIsBuffering] = useState(false)
  
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const duration = video.duration
        if (duration > 0) {
          setLoadingProgress((bufferedEnd / duration) * 100)
        }
      }
    }
    
    const handleWaiting = () => setIsBuffering(true)
    const handlePlaying = () => setIsBuffering(false)
    const handleCanPlay = () => setIsBuffering(false)
    
    video.addEventListener('progress', handleProgress)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('canplay', handleCanPlay)
    
    return () => {
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [videoRef])
  
  return { loadingProgress, isBuffering }
}
```

### Фаза 2: Интеграция с Video Compiler (2-3 дня)

#### 2.1 Создание preview для быстрой загрузки

**Файлы для создания:**
```typescript
// src/features/video-player/hooks/use-video-preview.ts
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { MediaFile } from '@/features/media/types/media'

export function useVideoPreview(file: MediaFile | null) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  useEffect(() => {
    if (!file) return
    
    const generatePreview = async () => {
      setIsGenerating(true)
      try {
        // Генерируем low-res preview для быстрой загрузки
        const preview = await invoke<string>('generate_preview', {
          videoPath: file.path,
          resolution: [640, 360], // Low-res для быстрой загрузки
          quality: 60,
          maxDuration: 60 // Первая минута
        })
        
        setPreviewUrl(preview)
      } catch (error) {
        console.error('Failed to generate preview:', error)
      } finally {
        setIsGenerating(false)
      }
    }
    
    // Генерируем preview только для больших файлов
    if (file.size && file.size > 100 * 1024 * 1024) {
      generatePreview()
    }
  }, [file])
  
  return { previewUrl, isGenerating }
}
```

#### 2.2 Модификация VideoPlayer для использования preview

```typescript
// src/features/video-player/components/video-player.tsx
import { useVideoPreview } from '../hooks/use-video-preview'

// В компоненте
const { previewUrl, isGenerating } = useVideoPreview(video)
const videoUrl = previewUrl || (video?.path ? convertFileSrc(video.path) : null)

// Добавить индикатор генерации preview
{isGenerating && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
    <div className="text-white">Оптимизация видео...</div>
  </div>
)}
```

### Фаза 3: Кастомный протокол для стриминга (3-4 дня)

#### 3.1 Создание Rust модуля для стриминга

**Новый файл:**
```rust
// src-tauri/src/video_streaming.rs
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use tauri::{
    AppHandle, Runtime,
    http::{Request, Response, ResponseBuilder, header, StatusCode},
};

/// Регистрация кастомного протокола для стриминга видео
pub fn register_video_protocol<R: Runtime>(
    app: &AppHandle<R>
) -> Result<(), Box<dyn std::error::Error>> {
    app.register_uri_scheme_protocol("video", |_app, request| {
        let uri = request.uri();
        let path = uri.path();
        
        // Убираем первый слеш
        let file_path = if path.starts_with('/') {
            &path[1..]
        } else {
            path
        };
        
        // Обработка Range заголовков
        match request.headers().get("range") {
            Some(range_header) => {
                handle_range_request(file_path, range_header.to_str().unwrap_or(""))
            }
            None => handle_full_request(file_path),
        }
    })?;
    
    Ok(())
}

fn handle_range_request(path: &str, range_header: &str) -> Response {
    let mut file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return ResponseBuilder::new()
            .status(StatusCode::NOT_FOUND)
            .body(Vec::new()),
    };
    
    let file_size = file.metadata().unwrap().len();
    
    // Парсинг Range: bytes=start-end
    let (start, end) = match parse_range(range_header, file_size) {
        Some(range) => range,
        None => return ResponseBuilder::new()
            .status(StatusCode::RANGE_NOT_SATISFIABLE)
            .body(Vec::new()),
    };
    
    // Позиционируемся в файле
    file.seek(SeekFrom::Start(start)).unwrap();
    
    // Читаем запрошенный диапазон
    let mut buffer = vec![0; (end - start + 1) as usize];
    file.read_exact(&mut buffer).unwrap();
    
    ResponseBuilder::new()
        .status(StatusCode::PARTIAL_CONTENT)
        .header("Content-Range", format!("bytes {}-{}/{}", start, end, file_size))
        .header("Accept-Ranges", "bytes")
        .header("Content-Type", get_content_type(path))
        .header("Content-Length", (end - start + 1).to_string())
        .body(buffer)
}

fn handle_full_request(path: &str) -> Response {
    let mut file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return ResponseBuilder::new()
            .status(StatusCode::NOT_FOUND)
            .body(Vec::new()),
    };
    
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).unwrap();
    
    ResponseBuilder::new()
        .status(StatusCode::OK)
        .header("Accept-Ranges", "bytes")
        .header("Content-Type", get_content_type(path))
        .body(buffer)
}

fn parse_range(range_header: &str, file_size: u64) -> Option<(u64, u64)> {
    if !range_header.starts_with("bytes=") {
        return None;
    }
    
    let range = &range_header[6..];
    let parts: Vec<&str> = range.split('-').collect();
    
    if parts.len() != 2 {
        return None;
    }
    
    let start = parts[0].parse::<u64>().ok()?;
    let end = if parts[1].is_empty() {
        file_size - 1
    } else {
        parts[1].parse::<u64>().ok()?
    };
    
    if start <= end && end < file_size {
        Some((start, end))
    } else {
        None
    }
}

fn get_content_type(path: &str) -> &'static str {
    match path.split('.').last() {
        Some("mp4") => "video/mp4",
        Some("webm") => "video/webm",
        Some("mov") => "video/quicktime",
        Some("avi") => "video/x-msvideo",
        Some("mkv") => "video/x-matroska",
        _ => "application/octet-stream",
    }
}
```

#### 3.2 Регистрация протокола в main.rs

```rust
// src-tauri/src/lib.rs
mod video_streaming;

// В функции run(), после создания Builder
pub fn run() {
    // ... существующий код ...
    
    tauri::Builder::default()
        // ... plugins ...
        .setup(|app| {
            // Регистрируем video протокол
            video_streaming::register_video_protocol(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ... существующие команды ...
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 3.3 Фронтенд хук для использования video протокола

```typescript
// src/features/video-player/hooks/use-video-url.ts
import { useMemo } from 'react'
import { convertFileSrc } from '@tauri-apps/api/core'
import { MediaFile } from '@/features/media/types/media'

export function useVideoUrl(file: MediaFile | null, previewUrl?: string | null) {
  return useMemo(() => {
    if (!file?.path) return null
    
    // Приоритеты:
    // 1. Preview URL (если есть)
    if (previewUrl) return previewUrl
    
    // 2. Streaming протокол для больших файлов
    if (file.size && file.size > 100 * 1024 * 1024) {
      // Используем кастомный протокол для стриминга
      return `video://${file.path}`
    }
    
    // 3. Стандартный asset протокол для маленьких файлов
    return convertFileSrc(file.path)
  }, [file, previewUrl])
}
```

### Фаза 4: Тестирование и оптимизация (1-2 дня)

#### 4.1 Создание тестов производительности

```typescript
// src/features/video-player/__tests__/performance/video-loading.test.ts
import { measureVideoLoadTime } from '@/test/utils/performance'

describe('Video Loading Performance', () => {
  it('должен загружать маленькие видео < 1с', async () => {
    const loadTime = await measureVideoLoadTime('small-video.mp4')
    expect(loadTime).toBeLessThan(1000)
  })
  
  it('должен начинать воспроизведение больших видео < 2с', async () => {
    const timeToFirstFrame = await measureVideoLoadTime('large-video.mp4', {
      measureFirstFrame: true
    })
    expect(timeToFirstFrame).toBeLessThan(2000)
  })
})
```

#### 4.2 Мониторинг и метрики

```typescript
// src/features/video-player/utils/performance-monitor.ts
export class VideoPerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  
  startMeasure(name: string) {
    this.metrics.set(name, performance.now())
  }
  
  endMeasure(name: string): number {
    const start = this.metrics.get(name)
    if (!start) return 0
    
    const duration = performance.now() - start
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    
    // Отправляем метрики в аналитику
    if (window.analytics) {
      window.analytics.track('video_performance', {
        metric: name,
        duration
      })
    }
    
    return duration
  }
}
```

## 📊 Ожидаемые результаты

1. **Маленькие файлы (< 50MB)**:
   - Текущее время загрузки: 1-2 секунды
   - После оптимизации: < 0.5 секунды

2. **Средние файлы (50-200MB)**:
   - Текущее время загрузки: 3-5 секунд
   - После оптимизации: < 1 секунда до первого кадра

3. **Большие файлы (> 200MB)**:
   - Текущее время загрузки: 5-15 секунд
   - После оптимизации: < 2 секунды до первого кадра

## 🚀 Порядок внедрения

1. **День 1**: Фаза 1 - Быстрые улучшения
2. **День 2-3**: Фаза 2 - Интеграция с Video Compiler
3. **День 4-6**: Фаза 3 - Кастомный протокол
4. **День 7**: Фаза 4 - Тестирование и оптимизация

## ⚠️ Риски и митигация

1. **Совместимость с разными форматами видео**
   - Решение: Тщательное тестирование с различными кодеками
   - Fallback на стандартный asset протокол

2. **Увеличение использования CPU при preview generation**
   - Решение: Кеширование preview
   - Генерация в фоне с низким приоритетом

3. **Проблемы с Range requests на некоторых платформах**
   - Решение: Feature detection и fallback
   - Тестирование на всех целевых платформах