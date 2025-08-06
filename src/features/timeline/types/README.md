# Timeline Types

TypeScript типы для Timeline функциональности.

## Основные типы

### `timeline.ts`
Базовые типы для Timeline.

```typescript
interface TimelineProject {
  id: string
  name: string
  settings: ProjectSettings
  resources: ProjectResources
  sections: TimelineSection[]
  globalTracks: TimelineTrack[]
  markers: TimelineMarker[]
}

interface TimelineSection {
  id: string
  name: string
  startTime: number
  duration: number
  tracks: TimelineTrack[]
}

interface TimelineTrack {
  id: string
  name: string
  type: TrackType
  order: number
  enabled: boolean
  locked: boolean
  height: number
  clips: TimelineClip[]
}

interface TimelineClip {
  id: string
  trackId: string
  mediaId?: string
  startTime: number
  duration: number
  trimStart: number
  trimEnd: number
  // ... другие свойства
}
```

### `clip-groups.ts`
Типы для группировки клипов.

```typescript
interface ClipGroup {
  id: string
  name: string
  color?: string
  clips: ClipReference[]
  isCollapsed: boolean
  isLocked: boolean
  isSequence?: boolean
}

interface NestedSequence extends ClipGroup {
  isSequence: true
  sequenceClipId: string
  sourceTimeline: TimelineSection
}
```

### `markers.ts`
Типы для маркеров.

```typescript
type MarkerType = 'chapter' | 'comment' | 'todo' | 'ai-suggestion'

interface TimelineMarker {
  id: string
  time: number
  type: MarkerType
  color: string
  label: string
  description?: string
}

interface AIMarker extends TimelineMarker {
  type: 'ai-suggestion'
  confidence: number
  suggestion: string
}
```

### `speed-ramping.ts`
Типы для управления скоростью.

```typescript
interface SpeedKeyframe {
  time: number      // Время в секундах
  speed: number     // Множитель скорости (1 = normal)
  interpolation: InterpolationType
}

interface SpeedRampingData {
  keyframes: SpeedKeyframe[]
  enabled: boolean
}

type InterpolationType = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'hold'
```

### `jl-cuts.ts`
Типы для J/L-срезов.

```typescript
interface LinkedClipPair {
  videoClipId: string
  audioClipId: string
  linkType: 'normal' | 'j-cut' | 'l-cut'
  offset?: number  // Смещение в секундах для J/L-срезов
}

interface JLCutData {
  type: 'j-cut' | 'l-cut'
  offset: number
  linkedPair: LinkedClipPair
}
```

### `drag-drop.ts`
Типы для drag & drop операций.

```typescript
interface DragState {
  isDragging: boolean
  dragType: DragType
  draggedItem: DraggedItem | null
  dropTarget: DropTarget | null
}

type DragType = 'clip' | 'track' | 'media' | 'effect' | 'transition'

interface DraggedClip {
  type: 'clip'
  clipId: string
  originalTrackId: string
  originalStartTime: number
}
```

### `edit-modes.ts`
Типы для режимов редактирования.

```typescript
type EditMode = 
  | 'select'      // Выделение
  | 'trim'        // Обрезка
  | 'slip'        // Сдвиг содержимого
  | 'slide'       // Сдвиг клипа
  | 'roll'        // Перекатывание
  | 'ripple'      // Волновое редактирование
  | 'rate-stretch' // Изменение скорости

interface EditModeConfig {
  mode: EditMode
  cursor: string
  description: string
  hotkey: string
}
```

### `timeline-transition.ts`
Типы для переходов.

```typescript
interface TimelineTransition {
  id: string
  type: TransitionType
  duration: number
  fromClipId: string
  toClipId: string
  properties: TransitionProperties
}

type TransitionType = 'dissolve' | 'wipe' | 'slide' | 'fade' | 'custom'
```

## Factory функции

### `factories.ts`
Функции для создания объектов с дефолтными значениями.

```typescript
import { 
  createTimelineProject,
  createTimelineSection,
  createTimelineTrack,
  createTimelineClip,
  createTimelineMarker
} from './factories'

// Создание нового проекта
const project = createTimelineProject({
  name: 'My Project'
})

// Создание трека
const track = createTimelineTrack({
  name: 'Video 1',
  type: 'video'
})
```

## Использование

```typescript
import type { 
  TimelineProject,
  TimelineClip,
  TimelineTrack,
  ClipGroup,
  TimelineMarker
} from '@/features/timeline/types'

function processClip(clip: TimelineClip): void {
  // Типизированная работа с клипом
}
```

## Type Guards

Для проверки типов в runtime:

```typescript
// Проверка типа трека
export function isVideoTrack(track: TimelineTrack): boolean {
  return track.type === 'video' || track.type === 'image'
}

// Проверка типа маркера
export function isAIMarker(marker: TimelineMarker): marker is AIMarker {
  return marker.type === 'ai-suggestion'
}
```