# Timeline Components

UI компоненты для Timeline функциональности.

## Структура компонентов

### Основные компоненты

#### `TimelineContent`
Главный компонент Timeline, содержит треки и клипы.

```tsx
<TimelineContent />
```

#### `TimelineScale`
Временная шкала с делениями времени.

```tsx
<TimelineScale 
  duration={300}        // Длительность в секундах
  timeScale={1}         // Масштаб времени
  scrollOffset={0}      // Смещение прокрутки
/>
```

### Клипы (`/clip`)

#### `Clip`
Универсальный компонент клипа, рендерит нужный тип.

#### `VideoClip`
Клип для видео с превью и информацией.

#### `AudioClip`
Клип для аудио с волновой формой.

#### `SubtitleClip`
Клип для субтитров с текстом.

### Треки (`/track`)

#### `Track`
Контейнер для клипов одного типа.

#### `TrackHeader`
Заголовок трека с контролами (mute, lock, solo).

### Инструменты редактирования (`/edit-tools`)

#### `SplitIndicator`
Индикатор разделения клипа.

#### `EditModeOverlay`
Оверлей для различных режимов редактирования.

### AI функции

#### `/ai-analysis`
- `TimelineAIOverlay` - оверлей с AI анализом
- `ClipAIIndicator` - индикатор AI анализа клипа

#### `/ai-markers`
- `AIMarkerControls` - контролы для AI маркеров
- `AIMarkerSettingsModal` - настройки AI маркеров

#### `/ai-suggestions`
- `AISuggestionsPanel` - панель с AI предложениями

### Группировка клипов (`/clip-groups`)

#### `GroupIndicator`
Визуальный индикатор группы клипов.

#### `GroupManagerPanel`
Панель управления группами.

#### `CollapsedGroup`
Компактное представление группы.

### J/L-срезы (`/jl-cuts`)

#### `JLCutIndicator`
Визуализация J/L-среза.

#### `JLCutTool`
Инструмент создания J/L-срезов.

#### `LinkedClipIndicator`
Индикатор связанных клипов.

### Маркеры (`/markers`)

#### `TimelineMarker`
Отдельный маркер на Timeline.

#### `MarkerControls`
Контролы для управления маркерами.

#### `TimelineMarkersLayer`
Слой со всеми маркерами.

### Speed Ramping (`/speed-ramping`)

#### `SpeedCurveEditor`
Редактор кривой скорости.

#### `SpeedRampingToggle`
Переключатель режима speed ramping.

## Использование

```tsx
import { TimelineContent, TimelineScale } from '@/features/timeline/components'

function Timeline() {
  return (
    <div className="timeline-container">
      <TimelineScale />
      <TimelineContent />
    </div>
  )
}
```

## Стилизация

Все компоненты используют Tailwind CSS и поддерживают:
- `className` - дополнительные CSS классы
- `style` - inline стили
- CSS переменные для темизации

## Доступность

Компоненты поддерживают:
- ARIA атрибуты
- Keyboard navigation
- Screen reader support
- `data-testid` для тестирования