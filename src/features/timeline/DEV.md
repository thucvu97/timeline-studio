# Timeline - Техническая документация

## 🎯 Overview

Timeline feature для видеоредактора с новой архитектурой данных, машиной состояний XState и полной интеграцией с системой ресурсов.

## 📁 Структура файлов

### ✅ Реализованные файлы

```
src/features/timeline/
├── components/
│   ├── timeline.tsx ✅
│   ├── timeline-top-panel.tsx ✅
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

### TimelineTopPanel

**Файл**: `components/timeline-top-panel.tsx`
**Статус**: ✅ Базовая структура

## 🔧 Машина состояний ✅ РЕАЛИЗОВАНА

### TimelineMachine

**Файл**: `services/timeline-machine.ts` ✅ (20 тестов прошли)

**Контекст**:

```typescript
interface TimelineContext {
  // Треки
  tracks: Track[];
  activeTrackId: string | null;

  // Клипы
  selectedClipIds: string[];
  clipboardClips: Clip[];

  // Время
  currentTime: number;
  currentRealTime: Date;
  timeScale: number;

  // Секторы
  sections: TimelineSection[];
  activeSectionId: string | null;

  // История
  history: TimelineState[];
  historyIndex: number;

  // UI состояние
  isPlaying: boolean;
  isRecording: boolean;
  timeFormat: "12h" | "24h";
}
```

**События**:

```typescript
type TimelineEvents =
  | { type: "ADD_TRACK"; trackType: "video" | "audio" }
  | { type: "REMOVE_TRACK"; trackId: string }
  | { type: "SET_ACTIVE_TRACK"; trackId: string }
  | { type: "ADD_CLIP"; trackId: string; mediaFile: MediaFile }
  | { type: "REMOVE_CLIP"; clipId: string }
  | { type: "MOVE_CLIP"; clipId: string; newPosition: number }
  | { type: "SEEK"; time: number }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "UNDO" }
  | { type: "REDO" };
```

## 🎣 Хуки ✅ РЕАЛИЗОВАНЫ

### useTimeline

**Файл**: `timeline-provider.tsx` ✅ (интегрирован в провайдер)

```typescript
interface UseTimelineReturn {
  // Состояние
  tracks: Track[];
  activeTrackId: string | null;
  currentTime: number;
  isPlaying: boolean;

  // Действия
  addTrack: (type: "video" | "audio") => void;
  removeTrack: (trackId: string) => void;
  setActiveTrack: (trackId: string) => void;
  seek: (time: number) => void;
  play: () => void;
  pause: () => void;
  undo: () => void;
  redo: () => void;
}
```

### useTracks

**Файл**: `hooks/use-tracks.ts` ✅

### useClips

**Файл**: `hooks/use-clips.ts` ✅

### useTimelineSelection

**Файл**: `hooks/use-timeline-selection.ts` ✅

## 🔗 Связи с другими компонентами

### ✅ Реализованные связи

- **Resources**: Через `useResources()` хук
- **AiChat**: Прямая интеграция в layout

### ❌ Требуют реализации

- **VideoPlayer**: Синхронизация времени воспроизведения
- **Browser/Media**: Получение медиафайлов для добавления на треки
- **AppState**: Сохранение состояния проекта

## 📦 Типы данных (требуют создания)

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

#### Этап 5: Интеграция TimelineProvider (КРИТИЧЕСКИЙ)

```typescript
// Время: 1-2 дня
// Файлы: src/features/media-studio/layouts/

- [ ] Добавить TimelineProvider в MediaStudio layout
- [ ] Обернуть Timeline компонент в Provider
- [ ] Протестировать базовую функциональность
- [ ] Убедиться в отсутствии конфликтов с существующими провайдерами
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
