# Video Editing Domain

Домен видеоредактирования, управляющий timeline, воспроизведением и операциями редактирования.

## Архитектура

### Машины состояний

1. **timeline-extended-machine.ts** - Полноценная машина timeline с поддержкой:
   - Управления проектом (создание, загрузка, сохранение)
   - Операций с клипами (добавление, удаление, перемещение, обрезка)
   - Управления треками
   - Воспроизведения
   - Выделения и буфера обмена
   - Эффектов и переходов
   - Backend синхронизации

2. **timeline-machine.ts** - Машина для UI состояния timeline:
   - Масштабирование и прокрутка
   - Режимы редактирования
   - Drag & Drop
   - UI флаги (показ волновых форм, миниатюр и т.д.)

3. **player-machine.ts** - Машина управления воспроизведением:
   - Play/Pause/Stop
   - Seek и скорость воспроизведения
   - Синхронизация с backend

### Оркестратор

**VideoEditingOrchestrator** координирует:
- Все три машины состояний
- Backend синхронизацию через BackendSync
- Межdomainную коммуникацию через EventBus
- Публикацию событий для других доменов

### Провайдеры

Модульная система провайдеров для React компонентов:

```tsx
// Главный провайдер
<TimelineProvider>
  {/* Включает все под-провайдеры */}
</TimelineProvider>
```

#### Доступные провайдеры и хуки:

1. **TimelineProjectProvider** / `useTimelineProject()`
   - Управление проектом
   - Создание, загрузка, сохранение

2. **TimelinePlaybackProvider** / `useTimelinePlayback()`
   - Управление воспроизведением
   - Play, pause, seek, скорость

3. **TimelineTracksProvider** / `useTimelineTracks()`
   - Операции с треками
   - Добавление, удаление, переупорядочивание

4. **TimelineClipsProvider** / `useTimelineClips()`
   - Операции с клипами
   - Добавление, перемещение, обрезка, разделение

5. **TimelineSelectionProvider** / `useTimelineSelection()`
   - Управление выделением
   - Копирование, вставка, удаление

6. **TimelineEffectsProvider** / `useTimelineEffects()`
   - Применение эффектов и переходов

## Использование

### В компонентах

```tsx
import { 
  useTimelineProject,
  useTimelinePlayback,
  useTimelineClips 
} from '@domains/video-editing/providers/timeline-providers'

function MyComponent() {
  const { project, createProject } = useTimelineProject()
  const { play, pause, currentTime } = useTimelinePlayback()
  const { addClip, removeClip } = useTimelineClips()
  
  // Использование...
}
```

### Прямое взаимодействие с оркестратором

```tsx
import { getVideoEditingOrchestrator } from '@domains/video-editing/services/video-editing-orchestrator'

const orchestrator = getVideoEditingOrchestrator()

// Создание проекта
await orchestrator.createProject('My Project')

// Добавление трека
await orchestrator.addTrack('video', 'Video Track 1')

// Добавление клипа
await orchestrator.addClip(trackId, mediaFile, 0)
```

### Подписка на события

```tsx
import { eventBus, DOMAIN_EVENTS } from '@domains/shared/events'

// Слушаем события timeline
eventBus.subscribe((event) => {
  if (event.type === DOMAIN_EVENTS.VIDEO.TIMELINE_UPDATED) {
    console.log('Timeline updated:', event.payload)
  }
}, {
  filter: { source: 'video-editing' }
})
```

## События домена

Домен публикует следующие события:

- `TIMELINE_CREATED` - Создан новый timeline
- `TIMELINE_UPDATED` - Timeline обновлен
- `CLIP_ADDED` - Добавлен клип
- `CLIP_REMOVED` - Удален клип  
- `TRACK_ADDED` - Добавлен трек
- `TRACK_REMOVED` - Удален трек
- `PLAYBACK_STATE_CHANGED` - Изменилось состояние воспроизведения

## Миграция со старой архитектуры

### Старый код:
```tsx
import { useTimelineContext } from '@/features/timeline/hooks/use-timeline'

const { state, send } = useTimelineContext()
const clips = state.context.project?.clips || []
send({ type: 'ADD_CLIP', clip })
```

### Новый код:
```tsx
import { useTimelineClips } from '@domains/video-editing/providers/timeline-providers'

const { clips, addClip } = useTimelineClips()
await addClip(trackId, mediaFile, time)
```

## Преимущества новой архитектуры

1. **Модульность** - Каждый провайдер отвечает за свою область
2. **Производительность** - Компоненты обновляются только при изменении нужных данных
3. **Backend синхронизация** - Автоматическая синхронизация с Rust backend
4. **Межdomainная коммуникация** - События для взаимодействия с другими доменами
5. **Типобезопасность** - Полная типизация с TypeScript
6. **Расширяемость** - Легко добавлять новые функции и провайдеры