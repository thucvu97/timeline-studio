# Timeline - Техническая документация

## 🎯 Overview

Timeline feature для видеоредактора с новой архитектурой данных, машиной состояний XState и полной интеграцией с системой ресурсов.

## 📁 Структура файлов

### ✅ Реализованные файлы

```
src/features/timeline/
├── components/
│   ├── timeline.tsx ✅
│   └── index.ts ✅
├── hooks/ ✅
│   ├── use-tracks.ts ✅
│   ├── use-clips.ts ✅
│   ├── use-timeline-selection.ts ✅
│   └── index.ts ✅
├── services/ ✅
│   └── timeline-machine.ts ✅ (20 тестов прошли)
├── timeline-provider.tsx ✅
├── tests/
│   └── timeline-machine.test.ts ✅
└── index.ts ✅

src/types/
└── timeline.ts ✅ (новая архитектура)

src/lib/timeline/
└── utils.ts ✅ (утилиты для работы с данными)

examples/
└── timeline-usage.ts ✅ (примеры использования)

docs/
└── timeline-architecture.md ✅ (документация архитектуры)
```

## 🏗️ Архитектура компонентов

### Timeline (корневой компонент)

**Файл**: `components/timeline.tsx`
**Статус**: ✅ Базовая структура готова

**Текущая реализация**:

- ResizablePanelGroup с тремя панелями
- TimelineResources (левая панель)
- Основная область (средняя панель)
- AiChat (правая панель)

**Требует доработки**:

- Интеграция с машиной состояний
- Обработка событий клавиатуры
- Управление фокусом

### TimelineResources

**Файл**: `components/timeline-resources.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:

- Отображение категорий ресурсов
- Интеграция с useResources хуком
- Поддержка интернационализации
- Адаптивный UI

## 🔧 Машины состояний ✅ РЕАЛИЗОВАНЫ

### Timeline UI Machine

**Файл**: `services/timeline-ui-machine.ts` ✅ (протестирована)

Управляет только UI состоянием timeline, данные проекта берутся из backend через app-state integration.

**Контекст**:

```typescript
interface TimelineUIContext {
  // Состояние воспроизведения (синхронизируется с backend)
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;

  // UI состояние
  timeScale: number;
  scrollPosition: { x: number; y: number };
  editMode: "select" | "cut" | "trim" | "move";
  snapMode: "none" | "grid" | "clips" | "markers";

  // Выделение
  selectedClipIds: string[];
  selectedTrackIds: string[];
  selectedSectionIds: string[];

  // Операции перетаскивания
  isDragging: boolean;
  draggedClipId: string | null;
  draggedTrackId: string | null;

  // Буфер обмена
  clipboard: ClipboardData | null;

  // UI флаги
  isRecording: boolean;
  showWaveforms: boolean;
  showThumbnails: boolean;
  showMarkers: boolean;

  // Ошибки UI
  uiError: string | null;
}
```

**События**:

```typescript
type TimelineUIEvent =
  // Синхронизация с backend
  | { type: "SYNC_PLAYBACK_STATE"; isPlaying: boolean; currentTime: number; playbackRate: number }
  
  // UI состояние
  | { type: "SET_TIME_SCALE"; scale: number }
  | { type: "SET_SCROLL_POSITION"; x: number; y: number }
  | { type: "SET_EDIT_MODE"; mode: "select" | "cut" | "trim" | "move" }
  | { type: "TOGGLE_SNAP"; snapMode: "none" | "grid" | "clips" | "markers" }
  
  // Выделение
  | { type: "SELECT_CLIPS"; clipIds: string[]; addToSelection?: boolean }
  | { type: "SELECT_TRACKS"; trackIds: string[]; addToSelection?: boolean }
  | { type: "SELECT_SECTIONS"; sectionIds: string[]; addToSelection?: boolean }
  | { type: "CLEAR_SELECTION" }
  
  // Операции перетаскивания
  | { type: "START_DRAG_CLIP"; clipId: string }
  | { type: "START_DRAG_TRACK"; trackId: string }
  | { type: "STOP_DRAG" }
  
  // Буфер обмена
  | { type: "COPY_SELECTION"; clipboardData: ClipboardData }
  | { type: "CUT_SELECTION"; clipboardData: ClipboardData }
  | { type: "CLEAR_CLIPBOARD" };
```

## 🎣 Хуки ✅ РЕАЛИЗОВАНЫ

### useTimeline

**Файл**: `services/timeline-provider.tsx` ✅ (интегрирован с backend)

Провайдер интегрируется с Tauri backend через app-state services для получения данных проекта, а UI состояние управляется через timelineUIMachine.

```typescript
// Провайдер использует двухуровневую архитектуру:
// 1. Backend data через getBackendSync()
// 2. UI state через timelineUIMachine
```

### useTracks

**Файл**: `hooks/use-tracks.ts` ✅

### useClips

**Файл**: `hooks/use-clips.ts` ✅

### useTimelineSelection

**Файл**: `hooks/use-timeline-selection.ts` ✅

## 🔗 Связи с другими компонентами

### ✅ Реализованные связи

- **Resources**: Через ResourcesPanel компонент
- **AiChat**: Прямая интеграция в timeline layout через AiChat и AISuggestionsPanel
- **AppState**: Backend синхронизация через getBackendSync()
- **Effects/Filters/Transitions**: Через типы timeline и resource-manager

### ✅ Частично реализованы

- **VideoPlayer**: timeline-player-sync service для синхронизации
- **Media**: MediaFile типы интегрированы в timeline типы

### ❌ Требуют доработки

- **Browser/Media**: Drag & Drop медиафайлов из браузера на timeline
- **VideoPlayer**: Полная двухсторонняя синхронизация состояния

## 📦 Типы данных ✅ РЕАЛИЗОВАНЫ

Все типы данных полностью реализованы в `types/timeline.ts` с поддержкой всех функций.

### Track

```typescript
interface Track {
  id: string;
  name: string;
  type: "video" | "audio";
  clips: Clip[];
  isLocked: boolean;
  isMuted: boolean;
  isHidden: boolean;
  volume: number;
  order: number;
}
```

### Clip

```typescript
interface Clip {
  id: string;
  mediaId: string;
  trackId: string;
  startTime: number;
  duration: number;
  mediaStartTime: number;
  mediaEndTime: number;
  effects: Effect[];
  transitions: Transition[];
}
```

### TimelineSection

```typescript
interface TimelineSection {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  tracks: Track[];
  name: string;
}
```

## 🚀 Дальнейшие шаги

### ✅ Завершенные этапы

- **Этап 1**: Архитектура данных ✅
- **Этап 2**: Машина состояний XState ✅ (20 тестов)
- **Этап 3**: React Provider и хуки ✅
- **Этап 4**: Утилиты и документация ✅

### 🎯 Текущий приоритет: Интеграция в приложение

#### Этап 5: Интеграция TimelineProvider ✅ РЕАЛИЗОВАН

```typescript
// Статус: ✅ ЗАВЕРШЕН
// Файлы: src/features/timeline/services/timeline-provider.tsx

- [x] Timeline Provider создан с интеграцией backend
- [x] Двухуровневая архитектура (UI machine + backend sync)
- [x] Интеграция с app-state services
- [ ] Убрать заглушки типов (TODO: следующий этап)
```

#### Этап 6: Обновление Timeline компонента (ВЫСОКИЙ)

```typescript
// Время: 3-5 дней
// Файлы: src/features/timeline/components/

- [ ] Обновить timeline.tsx для использования useTimeline()
- [ ] Создать TrackComponent для отображения треков
- [ ] Создать ClipComponent для отображения клипов
- [ ] Добавить TimeRuler (временная шкала)
- [ ] Реализовать Playhead (указатель времени)
- [ ] Добавить базовые контролы (play/pause/seek)
```

#### Этап 7: Drag & Drop функциональность (ВЫСОКИЙ)

```typescript
// Время: 2-3 дня
// Библиотеки: @dnd-kit/core, @dnd-kit/sortable

- [ ] Drag & drop клипов между треками
- [ ] Изменение размера клипов (trim handles)
- [ ] Snap to grid при перемещении
- [ ] Валидация при drop (проверка пересечений)
- [ ] Визуальная обратная связь при drag
```

### 🔗 Интеграция с другими системами

#### Этап 8: Синхронизация с VideoPlayer (ВЫСОКИЙ)

```typescript
// Время: 2-3 дня
// Файлы: src/features/video-player/, src/features/timeline/

- [ ] Синхронизация currentTime между Timeline и VideoPlayer
- [ ] Управление воспроизведением из Timeline
- [ ] Отображение preview кадров на клипах
- [ ] Синхронизация состояния play/pause/stop
- [ ] Обработка событий seek из обеих сторон
```

#### Этап 9: Интеграция с Browser (СРЕДНИЙ)

```typescript
// Время: 2-3 дня
// Файлы: src/features/browser/, src/features/timeline/

- [ ] Drag & drop медиафайлов из Browser на Timeline
- [ ] Автоматическое создание треков по типу медиа
- [ ] Предварительный просмотр при hover над Timeline
- [ ] Валидация совместимости медиа с треками
- [ ] Обновление Browser при добавлении медиа в проект
```

#### Этап 10: Интеграция с Resources (СРЕДНИЙ)

```typescript
// Время: 3-4 дня
// Файлы: src/features/resources/, src/features/timeline/

- [ ] Применение эффектов из Resources панели к клипам
- [ ] Drag & drop эффектов/фильтров/переходов на клипы
- [ ] Визуальное отображение примененных ресурсов на клипах
- [ ] Панель настройки параметров ресурсов
- [ ] Предварительный просмотр эффектов в реальном времени
```

### 🎨 Продвинутые функции

#### Этап 11: Редактирование клипов (СРЕДНИЙ)

```typescript
// Время: 4-5 дней

- [ ] Split клипов (разделение по времени)
- [ ] Trim клипов (обрезка начала/конца)
- [ ] Fade in/out переходы
- [ ] Keyframe анимация для свойств клипов
- [ ] Групповые операции с выделенными клипами
- [ ] Copy/Paste клипов между треками
```

#### Этап 12: Многодорожечное аудио (НИЗКИЙ)

```typescript
// Время: 3-4 дней

- [ ] Микширование аудио треков
- [ ] Регулировка громкости и панорамы
- [ ] Аудио эффекты (эквалайзер, компрессор)
- [ ] Синхронизация аудио с видео
- [ ] Визуализация аудио волн
```

#### Этап 13: Экспорт и рендеринг (НИЗКИЙ)

```typescript
// Время: 5-7 дней

- [ ] Экспорт Timeline в видеофайл
- [ ] Настройки качества экспорта (разрешение, битрейт)
- [ ] Прогресс рендеринга с возможностью отмены
- [ ] Предварительный просмотр экспорта
- [ ] Пакетный экспорт нескольких проектов
```

## 🧪 План тестирования

### Текущее покрытие

- ✅ **Timeline Machine**: 20 тестов прошли
- ✅ **Утилиты**: базовые функции протестированы
- ❌ **Компоненты**: требуют обновления тестов
- ❌ **Интеграция**: нужны E2E тесты

### Следующие шаги тестирования

```typescript
// Приоритет: ВЫСОКИЙ (параллельно с разработкой)

- [ ] Обновить тесты timeline.tsx компонента
- [ ] Добавить тесты для useTracks, useClips, useTimelineSelection
- [ ] Создать интеграционные тесты с VideoPlayer
- [ ] E2E тесты для основных сценариев:
  - Создание проекта и добавление медиа
  - Применение эффектов
  - Экспорт проекта
- [ ] Тесты производительности для больших проектов (100+ клипов)
```

## 📊 Метрики успеха

### Технические метрики

- [ ] Покрытие тестами > 90%
- [ ] Время загрузки проекта < 1 сек
- [ ] Плавная прокрутка Timeline (60 FPS)
- [ ] Поддержка проектов с 100+ клипами
- [ ] Отсутствие memory leaks при длительной работе

### Пользовательские метрики

- [ ] Интуитивное создание проектов
- [ ] Быстрое добавление медиа на Timeline (< 3 клика)
- [ ] Простое применение эффектов (drag & drop)
- [ ] Стабильная работа без потери данных
- [ ] Отзывчивый UI (< 100ms на действия пользователя)

## 🎯 Немедленные действия

### Сегодня

1. **Интегрировать TimelineProvider в MediaStudio** - критически важно
2. **Обновить Timeline компонент** - начать использовать новые хуки

### Завтра

1. **Создать базовые компоненты Track и Clip**
2. **Добавить временную шкалу (TimeRuler)**

### На этой неделе

1. **Реализовать drag & drop для клипов**
2. **Синхронизация с VideoPlayer**

### В течение месяца

1. **Полная интеграция со всеми системами**
2. **Продвинутые функции редактирования**

## 📝 Заметки для разработчиков

### Основные хуки

- `useTimeline()` - основная функциональность Timeline
- `useTracks()` - управление треками
- `useClips()` - работа с клипами
- `useTimelineSelection()` - выделение элементов

### Архитектурные принципы

- Все операции проходят через машину состояний XState
- Типизация полностью покрывает все операции
- UI состояние отделено от бизнес-логики
- Поддержка undo/redo на уровне машины состояний

### Производительность

- Используйте мемоизацию для тяжелых вычислений
- Виртуализация для больших списков клипов
- Debounce для частых операций (scroll, resize)
- Lazy loading для preview изображений
