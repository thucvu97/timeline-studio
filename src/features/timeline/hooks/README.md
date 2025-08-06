# Timeline Hooks

Набор React хуков для работы с Timeline функциональностью.

## Основные хуки

### `useTimeline()`
Главный хук для доступа к состоянию и функциям Timeline.

```typescript
const {
  project,
  currentTime,
  selectedClipIds,
  selectedTrackIds,
  uiState,
  // ... другие свойства и методы
} = useTimeline()
```

### `useClips()`
Управление клипами на Timeline.

```typescript
const {
  clips,           // Все клипы
  selectedClips,   // Выбранные клипы
  findClip,        // Найти клип по ID
  duplicateClip,   // Дублировать клип
  selectClip,      // Выбрать клип
  // ... другие методы
} = useClips()
```

### `useTracks()`
Управление треками.

```typescript
const {
  tracks,          // Все треки
  selectedTracks,  // Выбранные треки
  findTrack,       // Найти трек по ID
  getTracksByType, // Получить треки по типу
  // ... другие методы
} = useTracks()
```

### `useTimelineSelection()`
Управление выделением элементов.

```typescript
const {
  selectedClipIds,
  selectedTrackIds,
  selectClips,
  selectTracks,
  clearSelection,
  // ... другие методы
} = useTimelineSelection()
```

## Специализированные хуки

### Группировка клипов
- `useClipGroups()` - создание и управление группами клипов
- `useGroupHotkeys()` - горячие клавиши для групп

### J/L-срезы
- `useJLCuts()` - создание J/L-срезов
- `useJLCutHotkeys()` - горячие клавиши для J/L-срезов
- `useLinkedClips()` - связывание аудио и видео клипов

### Маркеры
- `useMarkers()` - работа с маркерами на Timeline
- `useMarkerHotkeys()` - горячие клавиши для маркеров

### Speed Ramping
- `useSpeedRamping()` - управление скоростью воспроизведения
- `useSpeedRampingHotkeys()` - горячие клавиши

### Drag & Drop
- `useDragDropTimeline()` - перетаскивание элементов
- `useTimelineDrop()` - обработка drop событий

### AI интеграция
- `useTimelineAIAnalysis()` - анализ контента с помощью AI
- `useTimelinePersons()` - распознавание персон

## Использование

Все хуки должны использоваться внутри `TimelineProvider`:

```tsx
import { TimelineProvider } from '@/features/timeline/services/providers'
import { useClips, useTracks } from '@/features/timeline/hooks'

function MyComponent() {
  const { clips } = useClips()
  const { tracks } = useTracks()
  
  // Ваша логика
}

function App() {
  return (
    <TimelineProvider>
      <MyComponent />
    </TimelineProvider>
  )
}
```

## Защита от ошибок

Все хуки защищены от undefined значений:

```typescript
// В хуках используется защитное программирование
const selectedClips = useMemo(() => {
  return clips.filter((clip) => selectedClipIds?.includes(clip.id))
}, [clips, selectedClipIds])
```