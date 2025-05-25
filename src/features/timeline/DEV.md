# Timeline - Техническая документация

## 📁 Структура файлов

### ✅ Существующие файлы
```
src/features/timeline/
├── components/
│   ├── timeline.tsx ✅
│   ├── timeline-resources.tsx ✅
│   ├── timeline-top-panel.tsx ✅
│   └── index.ts ✅
├── hooks/ ❌ (пустая папка)
├── services/ ❌ (пустая папка)
└── index.ts ✅
```

### ❌ Требуется создать
```
src/features/timeline/
├── hooks/
│   ├── use-timeline.ts
│   ├── use-tracks.ts
│   ├── use-clips.ts
│   └── index.ts
├── services/
│   ├── timeline-machine.ts
│   ├── timeline-provider.tsx
│   └── index.ts
└── types/
    ├── timeline.ts
    ├── track.ts
    └── clip.ts
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

## 🔧 Машина состояний (требует создания)

### TimelineMachine
**Файл**: `services/timeline-machine.ts` ❌

**Контекст**:
```typescript
interface TimelineContext {
  // Треки
  tracks: Track[]
  activeTrackId: string | null
  
  // Клипы
  selectedClipIds: string[]
  clipboardClips: Clip[]
  
  // Время
  currentTime: number
  currentRealTime: Date
  timeScale: number
  
  // Секторы
  sections: TimelineSection[]
  activeSectionId: string | null
  
  // История
  history: TimelineState[]
  historyIndex: number
  
  // UI состояние
  isPlaying: boolean
  isRecording: boolean
  timeFormat: '12h' | '24h'
}
```

**События**:
```typescript
type TimelineEvents = 
  | { type: 'ADD_TRACK'; trackType: 'video' | 'audio' }
  | { type: 'REMOVE_TRACK'; trackId: string }
  | { type: 'SET_ACTIVE_TRACK'; trackId: string }
  | { type: 'ADD_CLIP'; trackId: string; mediaFile: MediaFile }
  | { type: 'REMOVE_CLIP'; clipId: string }
  | { type: 'MOVE_CLIP'; clipId: string; newPosition: number }
  | { type: 'SEEK'; time: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
```

## 🎣 Хуки (требуют создания)

### useTimeline
**Файл**: `hooks/use-timeline.ts` ❌

```typescript
interface UseTimelineReturn {
  // Состояние
  tracks: Track[]
  activeTrackId: string | null
  currentTime: number
  isPlaying: boolean
  
  // Действия
  addTrack: (type: 'video' | 'audio') => void
  removeTrack: (trackId: string) => void
  setActiveTrack: (trackId: string) => void
  seek: (time: number) => void
  play: () => void
  pause: () => void
  undo: () => void
  redo: () => void
}
```

### useTracks
**Файл**: `hooks/use-tracks.ts` ❌

### useClips  
**Файл**: `hooks/use-clips.ts` ❌

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
  id: string
  name: string
  type: 'video' | 'audio'
  clips: Clip[]
  isLocked: boolean
  isMuted: boolean
  isHidden: boolean
  volume: number
  order: number
}
```

### Clip
```typescript
interface Clip {
  id: string
  mediaId: string
  trackId: string
  startTime: number
  duration: number
  mediaStartTime: number
  mediaEndTime: number
  effects: Effect[]
  transitions: Transition[]
}
```

### TimelineSection
```typescript
interface TimelineSection {
  id: string
  date: Date
  startTime: Date
  endTime: Date
  tracks: Track[]
  name: string
}
```

## 🚀 План реализации

### Этап 1: Основа
1. Создать timeline-machine.ts
2. Создать timeline-provider.tsx
3. Создать use-timeline.ts хук
4. Интегрировать в Timeline компонент

### Этап 2: Треки и клипы
1. Реализовать управление треками
2. Добавить компоненты Track и Clip
3. Реализовать базовый drag & drop

### Этап 3: Временная шкала
1. Создать компонент TimelineScale
2. Реализовать навигацию по времени
3. Добавить синхронизацию с плеером

### Этап 4: Продвинутые функции
1. История изменений (Undo/Redo)
2. Секторы по датам
3. Горячие клавиши
