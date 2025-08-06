# Timeline Utils

Утилиты для работы с Timeline функциональностью.

## Основные утилиты

### `clip-operations.ts`
Операции с клипами.

```typescript
// Проверка пересечения клипов
export function clipsOverlap(
  clip1: TimelineClip, 
  clip2: TimelineClip
): boolean

// Расчет конечного времени клипа
export function getClipEndTime(clip: TimelineClip): number

// Сортировка клипов по времени
export function sortClipsByTime(clips: TimelineClip[]): TimelineClip[]

// Поиск свободного места на треке
export function findFreeSpaceOnTrack(
  track: TimelineTrack,
  duration: number,
  startTime?: number
): number | null
```

### `timeline-to-project.ts`
Конвертация данных Timeline в формат проекта.

```typescript
// Конвертация Timeline в Project
export function timelineToProject(
  timeline: TimelineState
): Project

// Конвертация Project в Timeline
export function projectToTimeline(
  project: Project
): TimelineState

// Синхронизация изменений
export function syncTimelineChanges(
  timeline: TimelineState,
  changes: TimelineChanges
): Project
```

### `snap-engine.ts`
Механизм привязки элементов.

```typescript
// Настройки привязки
interface SnapSettings {
  enabled: boolean
  threshold: number  // В пикселях
  snapToGrid: boolean
  snapToClips: boolean
  snapToMarkers: boolean
}

// Поиск точек привязки
export function findSnapPoints(
  position: number,
  settings: SnapSettings,
  context: SnapContext
): SnapPoint[]

// Применение привязки
export function applySnap(
  position: number,
  snapPoints: SnapPoint[]
): number
```

### `drag-calculations.ts`
Вычисления для drag & drop операций.

```typescript
// Расчет новой позиции при перетаскивании
export function calculateDragPosition(
  mouseX: number,
  timeScale: number,
  scrollOffset: number,
  snapEnabled: boolean
): number

// Проверка валидности drop позиции
export function isValidDropPosition(
  clip: TimelineClip,
  track: TimelineTrack,
  position: number
): boolean

// Расчет дельты перемещения
export function calculateMoveDelta(
  clips: TimelineClip[],
  deltaTime: number,
  deltaTrack: number
): MoveOperation[]
```

### `speed-ramping-utils.ts`
Утилиты для работы со скоростью.

```typescript
// Интерполяция скорости между ключевыми кадрами
export function interpolateSpeed(
  time: number,
  keyframes: SpeedKeyframe[]
): number

// Расчет длительности с учетом скорости
export function calculateAdjustedDuration(
  originalDuration: number,
  keyframes: SpeedKeyframe[]
): number

// Генерация кривой скорости
export function generateSpeedCurve(
  keyframes: SpeedKeyframe[],
  resolution: number
): SpeedCurvePoint[]
```

### `edit-operations.ts`
Операции редактирования.

```typescript
// Разделение клипа
export function splitClip(
  clip: TimelineClip,
  splitTime: number
): [TimelineClip, TimelineClip]

// Обрезка клипа
export function trimClip(
  clip: TimelineClip,
  trimStart: number,
  trimEnd: number
): TimelineClip

// Ripple удаление
export function rippleDelete(
  clips: TimelineClip[],
  deletedClip: TimelineClip
): TimelineClip[]

// Roll редактирование
export function rollEdit(
  clip1: TimelineClip,
  clip2: TimelineClip,
  delta: number
): [TimelineClip, TimelineClip]
```

## Вспомогательные функции

### Время и форматирование

```typescript
// Форматирование времени (00:00:00.000)
export function formatTime(seconds: number): string

// Парсинг времени из строки
export function parseTime(timeString: string): number

// Конвертация кадров в секунды
export function framesToSeconds(frames: number, fps: number): number

// Конвертация секунд в кадры
export function secondsToFrames(seconds: number, fps: number): number
```

### Валидация

```typescript
// Проверка валидности клипа
export function isValidClip(clip: TimelineClip): boolean

// Проверка валидности трека
export function isValidTrack(track: TimelineTrack): boolean

// Проверка совместимости медиа с треком
export function isMediaCompatibleWithTrack(
  media: MediaFile,
  track: TimelineTrack
): boolean
```

### Оптимизация

```typescript
// Дебаунс для частых операций
export const debouncedUpdateClip = debounce(updateClip, 100)

// Батчинг операций
export function batchClipOperations(
  operations: ClipOperation[]
): BatchedOperation

// Мемоизация вычислений
export const memoizedGetClipsInRange = memoize(getClipsInRange)
```

## Использование

```typescript
import { 
  clipsOverlap,
  findSnapPoints,
  formatTime,
  splitClip
} from '@/features/timeline/utils'

// Проверка пересечения
if (clipsOverlap(clip1, clip2)) {
  console.log('Клипы пересекаются!')
}

// Форматирование времени
const timeString = formatTime(125.5) // "00:02:05.500"

// Разделение клипа
const [leftClip, rightClip] = splitClip(clip, 10.5)
```

## Тестирование

Все утилиты покрыты unit-тестами:

```bash
# Запуск тестов утилит
bun run test src/features/timeline/__tests__/utils
```