# Структура проекта Timeline Studio

[← Назад к разделу](README.md) | [← К оглавлению](../README.md)

## 📋 Содержание

- [Обзор структуры](#обзор-структуры)
- [Frontend (React/Next.js)](#frontend-reactnextjs)
- [Backend (Rust/Tauri)](#backend-rusttauri)
- [Конфигурационные файлы](#конфигурационные-файлы)
- [Вспомогательные директории](#вспомогательные-директории)

## 🏗️ Обзор структуры

```
timeline-studio/
├── src/                  # Frontend код (React/Next.js)
│   ├── app/              # Next.js App Router
│   ├── components/       # Общие UI компоненты
│   ├── features/         # Функциональные модули
│   ├── i18n/             # Интернационализация
│   ├── lib/              # Утилиты и хелперы
│   ├── styles/           # Глобальные стили
│   └── test/             # Тестовые утилиты
│
├── src-tauri/            # Backend код (Rust)
│   ├── src/              # Исходный код Rust
│   ├── Cargo.toml        # Конфигурация Rust
│   └── tauri.conf.json   # Конфигурация Tauri
│
├── public/               # Статические файлы
├── docs/                 # Документация
├── e2e/                  # End-to-end тесты
└── ...конфигурационные файлы
```

## ⚛️ Frontend (React/Next.js)

### `/src/app/`
Next.js 15 App Router - точка входа в приложение.

```
app/
├── layout.tsx           # Корневой layout
├── page.tsx             # Главная страница
├── globals.css          # Глобальные стили
└── providers.tsx        # React провайдеры
```

### `/src/features/`
Основная бизнес-логика организована по функциональным модулям.

```
features/
├── timeline/          # Редактор таймлайна
│   ├── components/    # React компоненты
│   ├── hooks/         # Custom hooks
│   ├── services/      # Бизнес-логика
│   ├── types/         # TypeScript типы
│   ├── utils/         # Утилиты
│   ├── __tests__/     # Тесты
│   └── README.md      # Документация модуля
│
├── video-player/      # Видео плеер
├── browser/           # Браузер медиафайлов
├── effects/           # Визуальные эффекты
├── export/            # Экспорт видео
└── ...другие модули
```

#### Ключевые модули:

1. **`timeline`** - Центральный компонент для редактирования
2. **`video-player`** - Кастомный плеер с покадровым контролем
3. **`browser`** - Файловый менеджер для медиа
4. **`effects`** - Система эффектов и фильтров
5. **`export`** - UI для экспорта видео

### `/src/components/`
Переиспользуемые UI компоненты на базе shadcn/ui.

```
components/
├── ui/                # Базовые UI компоненты
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
└── layout/            # Компоненты макета
    ├── header.tsx
    ├── sidebar.tsx
    └── ...
```

### `/src/lib/`
Общие утилиты и хелперы.

```
lib/
├── utils.ts          # Общие утилиты
├── cn.ts             # Утилита для классов
├── date.ts           # Работа с датами
└── validation.ts     # Валидация данных
```

### `/src/i18n/`
Система интернационализации (10 языков).

```
i18n/
├── index.ts         # Конфигурация i18next
├── constants.ts     # Языковые константы
├── locales/         # Файлы переводов
│   ├── en.json      # Английский
│   ├── ru.json      # Русский
│   └── ...9 других языков
└── services/         # i18n провайдер
```

## 🦀 Backend (Rust/Tauri)

### `/src-tauri/src/`
Backend логика на Rust.

```
src-tauri/src/
├── main.rs             # Точка входа Tauri
├── lib.rs              # Корневой модуль библиотеки
├── commands.rs         # Tauri команды
│
├── media/             # Модуль работы с медиа
│   ├── mod.rs         # Главный файл модуля
│   ├── scanner.rs     # Сканирование файлов
│   ├── metadata.rs    # Извлечение метаданных
│   └── cache.rs       # Кэширование
│
├── video_compiler/    # Компиляция видео
│   ├── mod.rs
│   ├── ffmpeg.rs      # FFmpeg интеграция
│   ├── encoder.rs     # Кодирование видео
│   └── progress.rs    # Отслеживание прогресса
│
├── recognition/       # ML распознавание
│   ├── mod.rs
│   ├── yolo.rs        # YOLO интеграция
│   └── tracker.rs     # Трекинг объектов
│
├── project/           # Управление проектами
├── export/            # Экспорт функциональность
└── utils/             # Общие утилиты
```

### Ключевые модули Rust:

1. **`media`** - Работа с медиафайлами, метаданными, превью
2. **`video_compiler`** - FFmpeg интеграция для рендеринга
3. **`recognition`** - YOLO модели для распознавания объектов
4. **`project`** - Сохранение/загрузка проектов

### Tauri команды
Команды для взаимодействия frontend-backend:

```rust
#[tauri::command]
async fn get_media_metadata(path: String) -> Result<MediaMetadata> {
    // Реализация
}

#[tauri::command]
async fn export_video(settings: ExportSettings) -> Result<String> {
    // Реализация
}
```

## ⚙️ Конфигурационные файлы

### Корневые конфиги

```
├── package.json        # NPM зависимости и скрипты
├── bun.lockb           # Bun lock файл
├── tsconfig.json       # TypeScript конфигурация
├── next.config.ts      # Next.js конфигурация
├── tailwind.config.ts  # Tailwind CSS настройки
├── vitest.config.ts    # Конфигурация тестов
└── .env.example        # Пример переменных окружения
```

### Tauri конфигурация

```
src-tauri/
├── tauri.conf.json     # Основная конфигурация
├── Cargo.toml          # Rust зависимости
└── build.rs            # Скрипт сборки
```

### Важные настройки в `tauri.conf.json`:

```json
{
  "productName": "Timeline Studio",
  "version": "1.0.0",
  "identifier": "com.timeline.studio",
  "build": {
    "features": ["gpu-acceleration", "ml-recognition"]
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "msi", "appimage"],
    "resources": ["models/*", "assets/*"]
  }
}
```

## 📁 Вспомогательные директории

### `/public/`
Статические ресурсы, доступные напрямую.

```
public/
├── icons/              # Иконки приложения
├── models/             # YOLO модели
└── samples/            # Примеры медиафайлов
```

### `/e2e/`
End-to-end тесты на Playwright.

```
e2e/
├── tests/              # Тестовые сценарии
├── fixtures/           # Тестовые данные
└── playwright.config.ts
```

### `/docs-ru/`
Документация проекта (вы здесь!).

## 🔧 Скрипты разработки

### Основные команды

```bash
# Разработка
bun run dev              # Только frontend
bun run tauri dev        # Frontend + Backend

# Тестирование
bun run test            # Unit тесты
bun run test:e2e        # E2E тесты
bun run test:coverage   # Покрытие кода

# Сборка
bun run build           # Production сборка
bun run tauri build     # Сборка приложения

# Качество кода
bun run lint            # ESLint проверка
bun run lint:fix        # Автоисправление
bun run type-check      # TypeScript проверка
```

## 📊 Архитектурные принципы

1. **Feature-based структура** - код организован по функциональности
2. **Разделение ответственности** - UI, бизнес-логика и данные разделены
3. **Type Safety** - строгая типизация на TypeScript и Rust
4. **Модульность** - каждый модуль независим и переиспользуем
5. **Тестируемость** - код написан с учетом тестирования

## 🎯 Что дальше?

Теперь, когда вы понимаете структуру проекта:

1. [Изучите архитектуру](../02-architecture/README.md) - как компоненты взаимодействуют
2. [Выберите модуль для изучения](../03-features/README.md) - детали реализации
3. [Настройте среду разработки](../05-development/setup.md) - оптимальная конфигурация
4. [Начните разработку](../05-development/README.md) - best practices

---

[← Первый проект](first-project.md) | [Далее: Архитектура →](../02-architecture/README.md)