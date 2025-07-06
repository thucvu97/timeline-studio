# ОБЗОР АРХИТЕКТУРЫ TIMELINE STUDIO

## 🏗️ Общая архитектура

Timeline Studio построен на современной модульной архитектуре, сочетающей мощь нативных десктопных приложений с удобством веб-технологий.

```
┌─────────────────────────────────────────────────────────────┐
│                      Timeline Studio                         │
├─────────────────────────┬───────────────────────────────────┤
│      Frontend          │           Backend                  │
│    (Next.js 15)        │         (Rust + Tauri)           │
├─────────────────────────┼───────────────────────────────────┤
│  • React 19            │  • Video Compiler (FFmpeg)        │
│  • XState v5           │  • GPU Acceleration               │
│  • shadcn/ui           │  • Media Processing               │
│  • Tailwind CSS v4     │  • Plugin System                  │
│  • Feature-based       │  • Security Layer                 │
└─────────────────────────┴───────────────────────────────────┘
```

## 🎨 Frontend архитектура

### Feature-based организация

Каждая функция в `/src/features/` является самодостаточным модулем:

```
src/features/
├── timeline/           # Основной редактор
│   ├── components/    # React компоненты
│   ├── hooks/         # Кастомные хуки
│   ├── services/      # Бизнес-логика и XState машины
│   ├── types/         # TypeScript типы
│   ├── utils/         # Вспомогательные функции
│   └── __tests__/     # Тесты
├── video-player/      # Видеоплеер
├── media-studio/      # Главный интерфейс
├── ai-chat/          # AI ассистент
└── ...               # Другие функции
```

### State Management

- **XState v5** для сложной логики (timeline, player, browser)
- **React Context** для глобального состояния
- **React Query** для серверных данных
- **Local Storage** для настроек пользователя

### UI архитектура

- **shadcn/ui** - готовые компоненты на базе Radix UI
- **Tailwind CSS v4** - утилитарные стили
- **CSS Variables** - темизация
- **Framer Motion** - анимации

## ⚙️ Backend архитектура

### Модульная структура

```
src-tauri/src/
├── core/              # Базовая инфраструктура
│   ├── di/           # Dependency Injection
│   ├── events/       # EventBus система
│   ├── performance/  # Управление памятью
│   ├── plugins/      # Система плагинов
│   └── telemetry/    # Метрики и мониторинг
├── security/          # Безопасность
│   ├── secure_storage.rs    # Шифрование данных
│   ├── oauth_handler.rs     # OAuth для соцсетей
│   └── api_validator.rs     # Валидация API ключей
├── media/             # Обработка медиа
│   ├── metadata.rs   # Анализ файлов
│   ├── ffmpeg.rs     # FFmpeg интеграция
│   └── preview.rs    # Генерация превью
├── video_compiler/    # Компиляция видео
│   ├── core/         # GPU, pipeline, кодеки
│   ├── services/     # Сервисный слой
│   └── cache/        # LRU кеш
└── recognition/       # AI распознавание
    └── yolo_processor.rs  # YOLO модели
```

### Ключевые компоненты

1. **Video Compiler** - ядро обработки видео на FFmpeg
2. **GPU Service** - аппаратное ускорение (NVENC, QuickSync)
3. **Plugin System** - расширяемость через плагины
4. **Security Layer** - безопасное хранение и OAuth
5. **Media Pipeline** - конвейер обработки медиа

## 🔌 Коммуникация Frontend ↔ Backend

### Tauri Commands

```rust
// Backend
#[tauri::command]
async fn process_video(path: String, options: VideoOptions) -> Result<VideoOutput> {
    // Обработка видео
}

// Frontend
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('process_video', {
    path: '/path/to/video.mp4',
    options: { format: 'mp4', quality: 'high' }
});
```

### Event System

```typescript
// Frontend подписка
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('render-progress', (event) => {
    console.log('Progress:', event.payload.percent);
});

// Backend отправка
window.emit("render-progress", ProgressPayload { percent: 75.0 });
```

## 🔐 Безопасность

### API ключи
- Хранятся в системном keychain (macOS), Credential Store (Windows), Secret Service (Linux)
- Шифруются AES-256 перед сохранением
- Никогда не передаются в открытом виде

### OAuth токены
- Используется PKCE flow для безопасности
- Токены обновляются автоматически
- Поддержка YouTube, TikTok, Vimeo, Telegram

## 🚀 Производительность

### Frontend оптимизации
- Code splitting по маршрутам
- Lazy loading компонентов
- Мемоизация дорогих вычислений
- Виртуализация больших списков

### Backend оптимизации
- GPU ускорение для рендеринга
- LRU кеш для превью
- Параллельная обработка через tokio
- Zero-copy операции где возможно

## 🧪 Тестирование

### Frontend
- **Vitest** для unit тестов
- **Testing Library** для компонентов
- **Playwright** для E2E тестов
- **80%+** покрытие кода

### Backend
- **Cargo test** для unit тестов
- **Integration tests** для команд
- **Mockall** для моков
- **Proptest** для property-based тестов

## 📦 Система сборки

### Development
```bash
bun run tauri dev  # Hot reload для frontend и backend
```

### Production
```bash
bun run tauri build  # Оптимизированная сборка
```

### Платформы
- **Windows**: MSI/NSIS инсталлятор
- **macOS**: DMG/App bundle
- **Linux**: AppImage/deb/rpm

---

*Для детальной информации смотрите специализированные документы в разделах архитектуры*