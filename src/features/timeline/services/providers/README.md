# Timeline Providers

Модульная архитектура провайдеров для управления состоянием Timeline.

## Архитектура

Timeline использует модульную архитектуру с отдельными провайдерами для разных аспектов функциональности:

```
TimelineProvider
├── TimelineProjectProvider     # Управление данными проекта
├── TimelineSelectionProvider   # Управление выделением
├── TimelinePlaybackProvider    # Управление воспроизведением
├── TimelineClipsProvider       # Операции с клипами
├── TimelineTracksProvider      # Операции с треками
└── TimelineEffectsProvider     # Эффекты и переходы
```

## Провайдеры

### TimelineProvider
Главный провайдер, объединяющий все модули.

```tsx
import { TimelineProvider } from './timeline-provider'

export function App() {
  return (
    <TimelineProvider>
      {/* Ваше приложение */}
    </TimelineProvider>
  )
}
```

### TimelineProjectProvider
Управление данными проекта Timeline.

**Контекст:**
```typescript
interface TimelineProjectContextValue {
  project: TimelineProject | null
  createProject: (name: string, settings: ProjectSettings) => Promise<void>
  updateProject: (updates: Partial<TimelineProject>) => void
  addSection: (name: string, startTime: number, duration: number) => Promise<void>
  updateSection: (sectionId: string, updates: Partial<TimelineSection>) => void
  deleteSection: (sectionId: string) => void
}
```

**Использование:**
```typescript
import { useTimelineProject } from './timeline-project-provider'

function MyComponent() {
  const { project, createProject, addSection } = useTimelineProject()
  
  // Создание проекта
  await createProject('My Project', settings)
  
  // Добавление секции
  await addSection('Intro', 0, 60)
}
```

### TimelineSelectionProvider
Управление выделением элементов.

**Контекст:**
```typescript
interface TimelineSelectionContextValue {
  selectedClipIds: string[]
  selectedTrackIds: string[]
  selectedMarkerIds: string[]
  selectClips: (clipIds: string[]) => void
  selectTracks: (trackIds: string[]) => void
  selectMarkers: (markerIds: string[]) => void
  clearSelection: () => void
  toggleClipSelection: (clipId: string) => void
}
```

### TimelinePlaybackProvider
Управление воспроизведением.

**Контекст:**
```typescript
interface TimelinePlaybackContextValue {
  currentTime: number
  isPlaying: boolean
  playbackRate: number
  play: () => void
  pause: () => void
  seek: (time: number) => void
  setPlaybackRate: (rate: number) => void
}
```

### TimelineClipsProvider
Операции с клипами.

**Контекст:**
```typescript
interface TimelineClipsContextValue {
  addClip: (trackId: string, media: MediaFile, startTime: number) => void
  removeClip: (clipId: string) => void
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void
  splitClip: (clipId: string, splitTime: number) => void
  duplicateClip: (clipId: string) => void
}
```

### TimelineTracksProvider
Операции с треками.

**Контекст:**
```typescript
interface TimelineTracksContextValue {
  addTrack: (sectionId: string, track: Partial<TimelineTrack>) => void
  removeTrack: (trackId: string) => void
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void
  reorderTracks: (sectionId: string, trackIds: string[]) => void
  setTrackHeight: (trackId: string, height: number) => void
}
```

### TimelineEffectsProvider
Управление эффектами и переходами.

**Контекст:**
```typescript
interface TimelineEffectsContextValue {
  applyEffect: (clipId: string, effect: Effect) => void
  removeEffect: (clipId: string, effectId: string) => void
  updateEffect: (clipId: string, effectId: string, updates: Partial<Effect>) => void
  addTransition: (fromClipId: string, toClipId: string, transition: Transition) => void
  removeTransition: (transitionId: string) => void
}
```

## Использование хуков

Каждый провайдер экспортирует свой хук:

```typescript
import {
  useTimelineProject,
  useTimelineSelection,
  useTimelinePlayback,
  useTimelineClips,
  useTimelineTracks,
  useTimelineEffects
} from './providers'

function TimelineComponent() {
  const { project } = useTimelineProject()
  const { selectedClipIds, selectClips } = useTimelineSelection()
  const { currentTime, seek } = useTimelinePlayback()
  const { updateClip } = useTimelineClips()
  const { addTrack } = useTimelineTracks()
  const { applyEffect } = useTimelineEffects()
  
  // Ваша логика
}
```

## Преимущества модульной архитектуры

### 1. Производительность
- Компоненты ре-рендерятся только при изменении нужных данных
- Меньше ненужных обновлений
- Оптимизация через React.memo работает эффективнее

### 2. Разделение ответственности
- Каждый провайдер отвечает за свою область
- Легче понимать и поддерживать код
- Четкие границы между модулями

### 3. Тестируемость
- Можно тестировать провайдеры изолированно
- Легко мокать отдельные модули
- Простые unit-тесты для каждого провайдера

### 4. Масштабируемость
- Легко добавлять новые провайдеры
- Можно использовать только нужные модули
- Простая интеграция новых фич

## Миграция со старой архитектуры

Если вы использовали монолитный `TimelineContext`:

```typescript
// Старый код
const { state, send } = useContext(TimelineContext)
const clips = state.context.project?.clips || []

// Новый код
const { project } = useTimelineProject()
const clips = project?.clips || []
```

## Защита от ошибок

Все хуки проверяют наличие контекста:

```typescript
export function useTimelineProject() {
  const context = useContext(TimelineProjectContext)
  if (!context) {
    throw new Error('useTimelineProject must be used within TimelineProjectProvider')
  }
  return context
}
```