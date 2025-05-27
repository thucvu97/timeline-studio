# Разработка Timeline Studio

## 📊 Статус проекта

### 🎯 Общий прогресс: 76% готово (13/17 features)

```
Компоненты:     16/17 ✅ (94%)
Хуки:           14/17 ✅ (82%)
Сервисы:        15/17 ✅ (88%)
Тесты:          13/17 ✅ (76%)
Документация:   17/17 ✅ (100%)
```

### 🔥 Критические задачи

1. **Timeline** - требует машину состояний, хуки, основную логику
2. **Resources** - требует UI компоненты для управления
3. **AI Chat** - требует проверки полноты функционала
4. **Options** - требует расширения функционала

## Архитектура приложения

### 🏗️ Основные компоненты

**Главные компоненты:**

- **`MediaStudio`** ✅ - корневой компонент с выбором layout'а
- **`TopBar`** ✅ - верхняя панель с меню и управлением
- **`Browser`** ✅ - браузер медиафайлов с табами (медиа, музыка, эффекты, фильтры, шаблоны, субтитры)
- **`Timeline`** ⚠️ - таймлайн для редактирования с ресурсами и AI чатом (требует доработки)
- **`VideoPlayer`** ✅ - видеоплеер с элементами управления
- **`ModalContainer`** ✅ - контейнер для модальных окон

**Layout системы:**

- **DefaultLayout** ✅ - стандартный макет (браузер + плеер + таймлайн)
- **VerticalLayout** ✅ - вертикальный макет
- **DualLayout** ✅ - двойной макет
- **OptionsLayout** ✅ - макет с опциями

### 🎯 Машины состояний (XState v5)

#### ✅ Реализованные машины состояний

1. **`appSettingsMachine`** ✅ - централизованное управление настройками

   - Состояния: `loading` → `idle` / `error`
   - Управляет: пользовательские настройки, проекты, медиафайлы, избранное

2. **`chatMachine`** ✅ - управление AI чатом

   - Состояния: `idle` → `processing` → `idle`
   - События: отправка/получение сообщений, выбор агента

3. **`modalMachine`** ✅ - управление модальными окнами

   - Состояния: `closed` ⇄ `opened`

4. **`playerMachine`** ✅ - управление видеоплеером

   - Состояния: `idle` → `loading` → `ready`

5. **`resourcesMachine`** ✅ - управление ресурсами таймлайна

   - Управляет: эффекты, фильтры, переходы, шаблоны, музыка, субтитры

6. **`musicMachine`** ✅ - управление музыкальными файлами

   - Фильтрация и поиск музыкальных файлов

7. **`userSettingsMachine`** ✅ - управление пользовательскими настройками

   - Настройки интерфейса, API ключи, видимость браузера

8. **`projectSettingsMachine`** ✅ - управление настройками проекта

   - Разрешение, частота кадров, настройки экспорта

9. **`mediaListMachine`** ✅ - управление списками медиафайлов

   - Загрузка файлов, избранное, состояние загрузки

10. **`templateListMachine`** ✅ - управление шаблонами
    - Загрузка и управление шаблонами проектов

#### ❌ Требуют реализации

11. **`timelineMachine`** ❌ - **КРИТИЧНО!** Основная машина состояний таймлайна

    - Управление треками, клипами, временной шкалой
    - История изменений (undo/redo)
    - Синхронизация с плеером

12. **`optionsMachine`** ❌ - управление панелью опций
    - Настройки эффектов, цветокоррекция, аудио

### 🔄 Провайдеры состояния

**Иерархия провайдеров:**

```typescript
AppProvider = composeProviders(
  I18nProvider, // Интернационализация
  ModalProvider, // Модальные окна
  AppSettingsProvider, // Централизованные настройки
  ProjectSettingsProvider, // Настройки проекта
  UserSettingsProvider, // Пользовательские настройки
  ResourcesProvider, // Ресурсы таймлайна
  MusicProvider, // Музыкальные файлы
  MediaProvider, // Медиафайлы
  PreviewSizeProvider, // Размеры превью
  TemplateListProvider, // Шаблоны
  PlayerProvider, // Видеоплеер
  ChatProvider, // AI чат
);
```

**Основные контексты:**

- **`AppSettingsContext`** - централизованное состояние приложения
- **`ChatContext`** - состояние AI чата
- **`ResourcesContext`** - ресурсы таймлайна
- **`UserSettingsContext`** - пользовательские настройки

### ✨ Технологический стек

- **Frontend**: React 19, Next.js 15, TypeScript
- **State Management**: XState v5, React Context
- **UI**: Tailwind CSS v4, Radix UI, Shadcn/ui
- **Desktop**: Tauri v2 (Rust)
- **Testing**: Vitest, Testing Library, Playwright
- **Build**: Vite, PostCSS, LightningCSS

### 🔧 Архитектурные принципы

- **XState v5** для управления сложной логикой состояний
- **Композиция провайдеров** для уменьшения вложенности
- **Централизованное состояние** через `AppSettingsProvider`
- **Типизация TypeScript** для всех контекстов и событий
- **Модульная структура** по features
- **Resizable панели** для гибкого UI

## 📚 Документация

### 🗂️ Структура документации по features

Каждая feature содержит два типа документации в своей папке:

#### `{feature}-features.md` - Функциональные требования

- 📋 Статус готовности компонента
- 🎯 Основные функции (готово ✅ / требует реализации ❌)
- 🎨 UI/UX требования
- 🔄 Интеграция с другими компонентами
- 📊 Приоритеты реализации

#### `{feature}-technical.md` - Техническая документация

- 📁 Структура файлов и тестовое покрытие
- 🏗️ Архитектура компонентов
- 🔧 Машины состояний и контекст
- 🎣 Хуки и сервисы
- 🔗 Связи с другими компонентами
- 📦 Типы данных и интерфейсы

### 📋 Полный список документации

#### ✅ Полностью готовые features (13):

1. `src/features/browser/` - README.md, DEV.md
2. `src/features/media/` - README.md, DEV.md
3. `src/features/video-player/` - README.md, DEV.md
4. `src/features/music/` - README.md, DEV.md
5. `src/features/effects/` - README.md, DEV.md
6. `src/features/filters/` - README.md, DEV.md
7. `src/features/transitions/` - README.md, DEV.md
8. `src/features/subtitles/` - README.md, DEV.md
9. `src/features/templates/` - README.md, DEV.md
10. `src/features/app-state/` - README.md, DEV.md
11. `src/features/modals/` - README.md, DEV.md
12. `src/features/top-bar/` - README.md, DEV.md
13. `src/features/media-studio/` - README.md, DEV.md

#### ⚠️ Частично готовые features (4):

14. `src/features/timeline/` - README.md, DEV.md
15. `src/features/resources/` - README.md, DEV.md
16. `src/features/ai-chat/` - README.md
17. `src/features/options/` - README.md, DEV.md

### 📊 Общий обзор

- `src/features/OVERVIEW.md` - полный обзор всех features с приоритетами

## 🚀 Следующие шаги разработки

### 🔥 Критический приоритет

1. **Timeline Machine** - создать `src/features/timeline/services/timeline-machine.ts`
2. **Timeline Provider** - создать `src/features/timeline/services/timeline-provider.tsx`
3. **Timeline Hooks** - создать хуки в `src/features/timeline/hooks/`
4. **Resources Components** - создать UI компоненты в `src/features/resources/components/`

### 🚀 Высокий приоритет

1. **AI Chat проверка** - протестировать полноту функционала
2. **Options расширение** - добавить машину состояний и UI элементы
3. **Timeline интеграция** - связать с VideoPlayer и Browser

### 📝 Средний приоритет

1. **Тестирование** - добавить недостающие тесты
2. **Оптимизация** - улучшить производительность
3. **Документация** - обновлять по мере разработки

# Автозагрузка пользовательских данных

Timeline Studio автоматически загружает пользовательские данные из папок `public/` при запуске приложения.

## Структура папок

Создайте следующие папки в корне проекта для автоматической загрузки ваших данных:

```
public/
├── effects/           # Пользовательские эффекты
├── transitions/       # Пользовательские переходы
├── filters/           # Пользовательские фильтры
├── subtitles/         # Пользовательские стили субтитров
├── templates/         # Пользовательские многокамерные шаблоны
└── style-templates/   # Пользовательские стилистические шаблоны
```

## Поддерживаемые форматы

### Текущая поддержка

- **JSON файлы** - основной формат для всех типов данных

### Планируется в будущем

- **Effects**: .cube, .3dl, .lut, .preset
- **Transitions**: .preset, .transition
- **Filters**: .cube, .3dl, .lut, .preset
- **Subtitles**: .css, .srt, .vtt, .ass
- **Templates**: .bundle (Filmora), .cct (CapCut), .zip, .mogrt (Adobe)
- **Style Templates**: .bundle (Filmora), .zip, .css, .aep (After Effects)

## Примеры JSON структур

### Effects (public/effects/my-effects.json)

```json
[
  {
    "id": "user-glow-effect",
    "name": "Custom Glow",
    "type": "glow",
    "category": "user-custom",
    "complexity": "intermediate",
    "tags": ["glow", "light", "custom"],
    "description": {
      "ru": "Пользовательский эффект свечения",
      "en": "Custom glow effect"
    },
    "ffmpegCommand": "glow=intensity=0.8",
    "cssFilter": "drop-shadow(0 0 10px rgba(255,255,255,0.8))",
    "params": {},
    "previewPath": "/t1.mp4",
    "labels": {
      "ru": "Свечение",
      "en": "Glow"
    }
  }
]
```

### Transitions (public/transitions/my-transitions.json)

```json
[
  {
    "id": "user-slide-transition",
    "type": "slide",
    "labels": {
      "ru": "Пользовательский слайд",
      "en": "Custom Slide"
    },
    "description": {
      "ru": "Пользовательский переход слайдом",
      "en": "Custom slide transition"
    },
    "category": "user-custom",
    "complexity": "beginner",
    "tags": ["slide", "custom"],
    "duration": { "min": 0.5, "max": 3.0, "default": 1.0 },
    "parameters": {},
    "ffmpegTemplate": "slide=direction=right"
  }
]
```

### Filters (public/filters/my-filters.json)

```json
[
  {
    "id": "user-vintage-filter",
    "name": "Custom Vintage",
    "category": "user-custom",
    "complexity": "intermediate",
    "tags": ["vintage", "retro", "custom"],
    "description": {
      "ru": "Пользовательский винтажный фильтр",
      "en": "Custom vintage filter"
    },
    "cssFilter": "sepia(0.8) contrast(1.2) brightness(0.9)",
    "ffmpegFilter": "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
    "previewPath": "/t1.mp4",
    "labels": {
      "ru": "Винтаж",
      "en": "Vintage"
    }
  }
]
```

### Subtitles (public/subtitles/my-styles.json)

```json
[
  {
    "id": "user-neon-style",
    "name": "Neon Style",
    "category": "user-custom",
    "complexity": "advanced",
    "tags": ["neon", "glow", "custom"],
    "description": {
      "ru": "Пользовательский неоновый стиль",
      "en": "Custom neon style"
    },
    "cssStyles": {
      "color": "#00ffff",
      "textShadow": "0 0 10px #00ffff, 0 0 20px #00ffff",
      "fontFamily": "Arial Black",
      "fontSize": "24px",
      "fontWeight": "bold"
    },
    "labels": {
      "ru": "Неон",
      "en": "Neon"
    }
  }
]
```

## Как это работает

1. **При запуске приложения** Timeline Studio автоматически сканирует папки `public/`
2. **Находит JSON файлы** в соответствующих папках
3. **Загружает и валидирует** содержимое файлов
4. **Добавляет данные** к существующим в приложении
5. **Логирует результат** в консоль разработчика

## Отладка

Откройте консоль разработчика (F12) для просмотра логов автозагрузки:

```
Начинаем автозагрузку пользовательских данных...
Найдено 2 JSON файлов в public/effects: [...]
Загружаем 5 пользовательских файлов...
Успешно загружено 5 из 5 файлов
Автозагрузка пользовательских данных завершена
```

## Ограничения

- Поддерживаются только JSON файлы (пока)
- Файлы должны соответствовать структуре данных Timeline Studio
- Неверные файлы игнорируются с логированием ошибки
- Автозагрузка происходит только при запуске приложения

## Будущие улучшения

- Поддержка форматов других редакторов (Filmora, CapCut, Adobe)
- Горячая перезагрузка при изменении файлов
- Валидация и конвертация данных
- Пользовательский интерфейс для управления загруженными данными
