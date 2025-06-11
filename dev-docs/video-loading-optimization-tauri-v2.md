# Оптимизация загрузки видео в Tauri v2

## 📋 Текущая ситуация

### Анализ существующей реализации

1. **Использование convertFileSrc**
   - Видео загружаются через `convertFileSrc()` из `@tauri-apps/api/core`
   - Это преобразует локальный путь в URL вида `asset://localhost/path/to/video.mp4`
   - Браузер загружает весь файл перед началом воспроизведения

2. **Текущая стратегия preload**
   - Используется `preload="auto"` для всех видео элементов
   - Нет поддержки частичной загрузки (range requests)
   - Нет кастомных протоколов для стриминга

3. **Конфигурация Tauri**
   ```json
   "assetProtocol": {
     "enable": true,
     "scope": {
       "allow": ["**"]
     }
   }
   ```

## 🔍 Найденные возможности оптимизации

### 1. Реализация кастомного протокола для стриминга

Tauri v2 поддерживает регистрацию кастомных протоколов. Можно создать протокол `video://` с поддержкой Range requests:

```rust
// src-tauri/src/video_streaming.rs
use tauri::{
    http::{Request, Response, StatusCode},
    AppHandle, Runtime,
};
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};

pub fn register_video_protocol<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    app.register_uri_scheme_protocol("video", move |app, request| {
        let path = request.uri().path();
        
        // Обработка Range заголовков
        if let Some(range_header) = request.headers().get("range") {
            handle_range_request(path, range_header)
        } else {
            handle_full_request(path)
        }
    })?;
    
    Ok(())
}

fn handle_range_request(path: &str, range_header: &str) -> Response {
    // Парсинг Range: bytes=start-end
    let range = parse_range_header(range_header);
    let mut file = File::open(path).unwrap();
    let file_size = file.metadata().unwrap().len();
    
    let (start, end) = calculate_range(range, file_size);
    
    // Seek к нужной позиции
    file.seek(SeekFrom::Start(start)).unwrap();
    
    // Читаем только запрошенный диапазон
    let mut buffer = vec![0; (end - start + 1) as usize];
    file.read_exact(&mut buffer).unwrap();
    
    Response::builder()
        .status(StatusCode::PARTIAL_CONTENT)
        .header("Content-Range", format!("bytes {}-{}/{}", start, end, file_size))
        .header("Accept-Ranges", "bytes")
        .header("Content-Type", get_content_type(path))
        .body(buffer)
        .unwrap()
}
```

### 2. Оптимизация стратегии preload

Вместо `preload="auto"` использовать динамическую стратегию:

```typescript
// src/features/video-player/hooks/use-video-preload.ts
export function useVideoPreload() {
  const [preloadStrategy, setPreloadStrategy] = useState<'none' | 'metadata' | 'auto'>('metadata')
  
  useEffect(() => {
    // Определяем стратегию на основе размера файла и скорости интернета
    const determineStrategy = async (file: MediaFile) => {
      const stats = await getFileStats(file.path)
      
      if (stats.size < 50 * 1024 * 1024) { // < 50MB
        setPreloadStrategy('auto')
      } else if (stats.size < 200 * 1024 * 1024) { // < 200MB
        setPreloadStrategy('metadata')
      } else {
        setPreloadStrategy('none')
      }
    }
  }, [])
  
  return preloadStrategy
}
```

### 3. Реализация chunk-based загрузки

Создать сервис для загрузки видео чанками:

```typescript
// src/features/video-player/services/video-loader.ts
export class VideoLoader {
  private chunks = new Map<string, ArrayBuffer>()
  private chunkSize = 5 * 1024 * 1024 // 5MB chunks
  
  async loadChunk(filePath: string, chunkIndex: number): Promise<ArrayBuffer> {
    const key = `${filePath}-${chunkIndex}`
    
    if (this.chunks.has(key)) {
      return this.chunks.get(key)!
    }
    
    const start = chunkIndex * this.chunkSize
    const end = Math.min(start + this.chunkSize - 1, await this.getFileSize(filePath) - 1)
    
    const chunk = await invoke<ArrayBuffer>('read_file_chunk', {
      path: filePath,
      start,
      end
    })
    
    this.chunks.set(key, chunk)
    return chunk
  }
  
  createObjectURL(chunks: ArrayBuffer[]): string {
    const blob = new Blob(chunks, { type: 'video/mp4' })
    return URL.createObjectURL(blob)
  }
}
```

### 4. Использование Web Workers для загрузки

Создать Web Worker для фоновой загрузки видео:

```typescript
// src/workers/video-loader.worker.ts
self.onmessage = async (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'LOAD_VIDEO':
      const chunks = []
      const chunkSize = 5 * 1024 * 1024
      
      for (let i = 0; i < payload.totalChunks; i++) {
        const chunk = await loadChunk(payload.path, i, chunkSize)
        chunks.push(chunk)
        
        // Отправляем прогресс
        self.postMessage({
          type: 'PROGRESS',
          progress: (i + 1) / payload.totalChunks * 100
        })
      }
      
      self.postMessage({
        type: 'COMPLETE',
        chunks
      })
      break
  }
}
```

### 5. Интеграция с существующим video-compiler

Использовать уже существующий функционал preview generation:

```typescript
// src/features/video-player/hooks/use-optimized-video.ts
export function useOptimizedVideo(file: MediaFile) {
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  useEffect(() => {
    const generateOptimized = async () => {
      setIsGenerating(true)
      
      try {
        // Используем существующий preview generator
        const preview = await invoke<string>('generate_preview', {
          videoPath: file.path,
          quality: 'medium', // Меньший размер для быстрой загрузки
          maxDuration: 300 // Первые 5 минут
        })
        
        setOptimizedUrl(preview)
      } catch (error) {
        console.error('Failed to generate preview:', error)
        // Fallback на оригинальный файл
        setOptimizedUrl(convertFileSrc(file.path))
      } finally {
        setIsGenerating(false)
      }
    }
    
    generateOptimized()
  }, [file])
  
  return { optimizedUrl, isGenerating }
}
```

## 🏗️ Рекомендуемый план внедрения

### Этап 1: Оптимизация preload стратегии (2-3 часа)
- Реализовать хук `useVideoPreload`
- Интегрировать в `VideoPlayer` и `VideoPanelComponent`
- Добавить логику определения размера файла

### Этап 2: Кастомный протокол для стриминга (4-6 часов)
- Создать Rust модуль `video_streaming.rs`
- Реализовать обработку Range requests
- Зарегистрировать протокол в `main.rs`
- Обновить фронтенд для использования `video://` URL

### Этап 3: Интеграция с preview generator (3-4 часа)
- Создать хук `useOptimizedVideo`
- Добавить кеширование превью
- Реализовать fallback стратегию

### Этап 4: Web Worker для фоновой загрузки (4-5 часов)
- Создать Web Worker
- Реализовать chunk-based загрузку
- Добавить прогресс-бар загрузки

### Этап 5: Тестирование и оптимизация (2-3 часа)
- Провести нагрузочное тестирование
- Оптимизировать размер чанков
- Добавить метрики производительности

## 📊 Ожидаемые результаты

1. **Уменьшение времени до первого кадра**
   - С 5-10 секунд до 0.5-1 секунды для больших файлов

2. **Снижение использования памяти**
   - Загрузка только необходимых частей видео

3. **Улучшение UX**
   - Мгновенное начало воспроизведения
   - Прогресс-бар загрузки
   - Отсутствие зависаний интерфейса

## 🔧 Технические детали реализации

### Модификация VideoPlayer компонента

```typescript
export function VideoPlayer() {
  const { video } = usePlayer()
  const preloadStrategy = useVideoPreload(video)
  const { optimizedUrl, isGenerating } = useOptimizedVideo(video)
  
  const videoUrl = useMemo(() => {
    if (optimizedUrl) return optimizedUrl
    if (video?.path) {
      // Используем кастомный протокол для больших файлов
      if (video.size > 100 * 1024 * 1024) {
        return `video://${video.path}`
      }
      return convertFileSrc(video.path)
    }
    return null
  }, [video, optimizedUrl])
  
  return (
    <video
      src={videoUrl}
      preload={preloadStrategy}
      onLoadStart={handleLoadStart}
      onProgress={handleProgress}
      onCanPlay={handleCanPlay}
    />
  )
}
```

### Rust команды для chunk loading

```rust
#[tauri::command]
async fn read_file_chunk(
    path: String,
    start: u64,
    end: u64,
) -> Result<Vec<u8>, String> {
    use std::io::{Read, Seek, SeekFrom};
    
    let mut file = File::open(&path)
        .map_err(|e| format!("Failed to open file: {}", e))?;
    
    file.seek(SeekFrom::Start(start))
        .map_err(|e| format!("Failed to seek: {}", e))?;
    
    let chunk_size = (end - start + 1) as usize;
    let mut buffer = vec![0; chunk_size];
    
    file.read_exact(&mut buffer)
        .map_err(|e| format!("Failed to read chunk: {}", e))?;
    
    Ok(buffer)
}
```

## 🎯 Приоритеты

1. **Высокий приоритет**: Оптимизация preload стратегии - быстрый выигрыш
2. **Средний приоритет**: Кастомный протокол - значительное улучшение для больших файлов  
3. **Низкий приоритет**: Web Workers - улучшение для edge cases

## 📝 Заметки по совместимости

- Кастомные протоколы работают во всех поддерживаемых Tauri платформах
- Range requests поддерживаются всеми современными браузерами
- Web Workers требуют дополнительной настройки в Next.js