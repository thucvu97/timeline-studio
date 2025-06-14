# Оптимизация загрузки видео в Timeline Studio

## Проблема
Пользователи испытывают лаги при загрузке видео, особенно больших файлов. Tauri v2 использует `convertFileSrc()` для безопасного доступа к локальным файлам через протокол `asset://`.

## Реализованные решения

### 1. Умная стратегия preload
- **use-video-preload.ts** - хук для динамического выбора стратегии загрузки
- Для файлов > 50MB используется `preload="metadata"`
- Для маленьких файлов используется `preload="auto"`
- Intersection Observer загружает только видимые элементы

### 2. Простой индикатор загрузки
- **use-video-loading.ts** - отслеживает готовность видео к воспроизведению
- **VideoLoadingIndicator** - минималистичный спиннер без процентов
- Использует событие `canplay` для быстрого отклика

### 3. Оптимизации в VideoPreview
- Ленивая загрузка через Intersection Observer
- Мемоизация путей файлов для предотвращения перезагрузок
- Оптимизация ререндеров через React.memo

## Дальнейшие улучшения

### 1. Кастомный протокол (требует Rust)
```rust
// src-tauri/src/video_streaming.rs
#[tauri::command]
async fn register_video_protocol(app: AppHandle) {
    app.register_uri_scheme_protocol("video", |app, request| {
        // Реализация Range requests для стриминга
    });
}
```

### 2. Интеграция с video-compiler
- Использовать существующий `preview_generator` для создания легковесных превью
- Кэшировать превью для быстрого отображения
- Подгружать полное видео по требованию

### 3. WebSocket стриминг (альтернатива)
```typescript
// Клиент
const ws = new WebSocket('ws://localhost:3030/video-stream')
ws.onmessage = (event) => {
  const chunk = event.data
  // Append to MediaSource
}

// Сервер (Rust)
#[tauri::command]
async fn stream_video_chunks(path: String) -> Result<()> {
    // Читать и отправлять видео чанками
}
```

## Метрики производительности
- **Маленькие файлы (<50MB)**: Мгновенная загрузка с `preload="auto"`
- **Средние файлы (50-200MB)**: Быстрая загрузка метаданных, прогрессивная буферизация
- **Большие файлы (>200MB)**: Требуется кастомный протокол для оптимального стриминга

## Использование
```tsx
import { VideoPreview } from "@/features/browser/components/preview/video-preview"

// Компонент автоматически оптимизирует загрузку
<VideoPreview 
  file={mediaFile}
  size={150}
  showFileName={true}
/>
```