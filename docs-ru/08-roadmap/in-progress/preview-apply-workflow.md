# План реализации функции "Применить" для предпросмотра

## 📋 Описание функционала

Когда пользователь нажимает кнопку "Применить" на превью эффекта, фильтра или шаблона, контент должен отображаться в основном видео плеере для детального просмотра.

## 🎯 Основные сценарии использования

### 1. Применение из браузера медиафайлов
- Пользователь выбирает видео в браузере
- Нажимает "Применить" на превью
- Видео начинает воспроизводиться в основном плеере

### 2. Применение эффектов/фильтров
- Пользователь выбрал видео (из браузера или применил ранее)
- Выбирает эффект/фильтр
- Нажимает "Применить"
- Эффект применяется к текущему видео в плеере

### 3. Применение шаблонов
- **Однокамерные шаблоны**: используется текущее выбранное видео
- **Многокамерные шаблоны**: 
  - Первое видео = текущее выбранное
  - Остальные = автоматически из браузера (следующие по порядку)

## 🎛️ Источники видео

### Переключатель режимов
В панели управления видео есть переключатель между двумя источниками:

1. **Режим "Браузер"** (Browser Mode)
   - Видео берутся из текущей вкладки браузера медиафайлов
   - Для многокамерных шаблонов: выбранное + следующие по порядку

2. **Режим "Таймлайн"** (Timeline Mode)
   - Видео берутся из текущей позиции таймлайна
   - Для многокамерных шаблонов: видео с параллельных треков в текущий момент времени

### Структура данных для источников

```typescript
// Тип источника видео
type VideoSource = 'browser' | 'timeline'

// Контекст применения
interface ApplyContext {
  source: VideoSource
  // Для браузера
  browserFiles?: MediaFile[]
  selectedFile?: MediaFile
  // Для таймлайна
  timelinePosition?: number
  timelineTracks?: Track[]
}

// Расширенное состояние плеера
interface PlayerState {
  // ... существующие поля
  videoSource: VideoSource
  applyContext: ApplyContext
}
```

## 🏗️ Архитектура решения

### Компоненты для изменения

1. **MediaPreview** (`/features/browser/components/preview/media-preview.tsx`)
   - Добавить обработчик для кнопки "Применить"
   - Передавать выбранный файл в PlayerProvider

2. **EffectPreview** (`/features/effects/components/effect-preview.tsx`)
   - Добавить обработчик применения эффекта
   - Использовать текущий файл из PlayerProvider

3. **FilterPreview** (`/features/filters/components/filter-preview.tsx`)
   - Аналогично EffectPreview

4. **TemplatePreview** (`/features/templates/components/template-preview.tsx`)
   - Определять количество необходимых видео
   - Автоматически подбирать видео из браузера

5. **StyleTemplatePreview** (`/features/style-templates/components/style-template-preview.tsx`)
   - Применять стиль к текущему видео

### Сервисы и хуки

1. **PlayerProvider** (`/features/video-player/services/player-provider.tsx`)
   - Добавить метод `setPreviewMedia(file: MediaFile)`
   - Добавить метод `applyEffect(effect: VideoEffect)`
   - Добавить метод `applyFilter(filter: VideoFilter)`
   - Добавить метод `applyTemplate(template: Template, files: MediaFile[])`

2. **useMedia** (`/features/browser/media/use-media.ts`)
   - Добавить метод `getFilesForTemplate(count: number): MediaFile[]`
   - Возвращать текущий выбранный файл + следующие по порядку

3. **usePlayer** (`/features/video-player/services/player-provider.tsx`)
   - Расширить состояние для хранения примененных эффектов/фильтров
   - Добавить поддержку композитных шаблонов

## 📝 Детальный план реализации

### Этап 1: Базовая функциональность (Применение видео)

```typescript
// В MediaPreview добавить:
const handleApply = () => {
  const { setPreviewMedia } = usePlayer()
  setPreviewMedia(file)
}

// В PlayerProvider добавить:
const setPreviewMedia = (file: MediaFile) => {
  // Установить видео в плеер
  // Сбросить эффекты/фильтры
  // Начать воспроизведение
}
```

### Этап 2: Применение эффектов/фильтров

```typescript
// В EffectPreview:
const handleApply = () => {
  const { applyEffect, currentMedia } = usePlayer()
  if (currentMedia) {
    applyEffect(effect)
  } else {
    toast.error("Сначала выберите видео")
  }
}

// В PlayerProvider:
const applyEffect = (effect: VideoEffect) => {
  // Добавить эффект к текущему видео
  // Обновить CSS стили видео элемента
}
```

### Этап 3: Поддержка шаблонов

```typescript
// В TemplatePreview:
const handleApply = () => {
  const { applyTemplate, videoSource } = usePlayer()
  const { getFilesForTemplate } = useMedia()
  const { getTracksAtPosition } = useTimeline()
  
  const requiredVideos = template.requiredVideos || 1
  let files: MediaFile[] = []
  
  if (videoSource === 'browser') {
    // Режим браузера: выбранное + следующие
    files = getFilesForTemplate(requiredVideos)
  } else {
    // Режим таймлайна: видео с параллельных треков
    const tracks = getTracksAtPosition(currentTime)
    files = tracks
      .filter(track => track.type === 'video')
      .slice(0, requiredVideos)
      .map(track => track.currentClip?.mediaFile)
      .filter(Boolean)
  }
  
  if (files.length < requiredVideos) {
    toast.error(`Необходимо ${requiredVideos} видео`)
    return
  }
  
  applyTemplate(template, files)
}
```

### Этап 4: Логика выбора видео

```typescript
// Новый хук для унификации выбора видео
function useVideoSelection() {
  const { videoSource } = usePlayer()
  const { selectedFiles, groupedFiles } = useMedia()
  const { currentTime, tracks } = useTimeline()
  
  const getVideosForPreview = (count: number = 1): MediaFile[] => {
    if (videoSource === 'browser') {
      // Из браузера
      const selected = selectedFiles[0]
      const allFiles = groupedFiles.flatMap(g => g.files)
      const startIndex = selected ? allFiles.indexOf(selected) : 0
      
      return allFiles.slice(startIndex, startIndex + count)
    } else {
      // Из таймлайна
      return tracks
        .filter(track => track.type === 'video')
        .map(track => {
          const clip = track.clips.find(c => 
            c.startTime <= currentTime && 
            c.endTime >= currentTime
          )
          return clip?.mediaFile
        })
        .filter(Boolean)
        .slice(0, count)
    }
  }
  
  return { getVideosForPreview }
}
```

## 🔄 Состояние плеера

```typescript
interface PlayerState {
  // Существующие поля
  currentTime: number
  duration: number
  isPlaying: boolean
  
  // Новые поля
  previewMedia: MediaFile | null
  appliedEffects: VideoEffect[]
  appliedFilters: VideoFilter[]
  appliedTemplate: {
    template: Template
    files: MediaFile[]
  } | null
}
```

## 🎨 UI/UX соображения

1. **Визуальная обратная связь**
   - Подсветка кнопки "Применить" при наведении
   - Индикация загрузки при применении
   - Уведомление об успешном применении

2. **Состояние кнопки**
   - Активна всегда для медиафайлов
   - Для эффектов/фильтров - только если есть видео
   - Для многокамерных шаблонов - проверка достаточности файлов

3. **Сброс состояния**
   - При выборе нового видео сбрасывать эффекты
   - Добавить кнопку "Сбросить" в плеере

## 🧪 Тестирование

1. **Unit тесты**
   - Тесты для новых методов в PlayerProvider
   - Тесты для логики выбора файлов

2. **Интеграционные тесты**
   - Применение видео → эффект → фильтр
   - Применение многокамерного шаблона
   - Обработка ошибок (недостаточно файлов)

3. **E2E тесты**
   - Полный сценарий от выбора до применения
   - Проверка визуального результата

## 📊 Примеры сценариев использования

### Сценарий 1: Эффект из браузера
```typescript
// Состояние: videoSource = 'browser', выбрано video1.mp4
// Действие: Применить эффект "Размытие"
// Результат: 
{
  previewMedia: video1.mp4,
  appliedEffects: [BlurEffect],
  videoSource: 'browser'
}
```

### Сценарий 2: 4-камерный шаблон из таймлайна
```typescript
// Состояние: videoSource = 'timeline', currentTime = 10s
// Треки: [video1.mp4, video2.mp4, video3.mp4, video4.mp4]
// Действие: Применить шаблон "Grid 2x2"
// Результат:
{
  appliedTemplate: {
    template: Grid2x2Template,
    files: [video1.mp4, video2.mp4, video3.mp4, video4.mp4]
  },
  videoSource: 'timeline'
}
```

### Сценарий 3: Переключение источника
```typescript
// Было: videoSource = 'browser', применен эффект
// Действие: Переключить на 'timeline'
// Результат: Сброс эффектов, загрузка видео с текущей позиции таймлайна
```

## 🔀 Диаграмма потока данных

```
┌─────────────┐     ┌──────────────┐       ┌─────────────┐
│   Browser   │     │  Timeline    │       │   Player    │
│   Mode      │     │  Mode        │       │             │
└──────┬──────┘     └──────┬───────┘       └──────┬──────┘
       │                    │                     │
       │ getVideos()        │ getTracksAt()       │
       └────────────┬───────┘                     │
                    │                             │
                    ▼                             │
            ┌───────────────┐                     │
            │ VideoSelection│                     │
            │    Hook       │                     │
            └───────┬───────┘                     │
                    │                             │
                    │ files[]                     │
                    ▼                             │
            ┌───────────────┐                     │
            │   Preview     │ ──── apply() ──────►│
            │  Component    │                     │
            └───────────────┘                     │
```

## 📅 Оценка времени

- **Этап 1**: 2-3 часа (базовое применение видео)
- **Этап 2**: 3-4 часа (эффекты и фильтры)
- **Этап 3**: 4-5 часов (шаблоны)
- **Этап 4**: 2-3 часа (интеграция источников)
- **Тестирование**: 3-4 часа
- **Итого**: ~14-18 часов

## 🚀 Следующие шаги

1. Начать с реализации `setPreviewMedia` в PlayerProvider
2. Добавить обработчик в MediaPreview
3. Протестировать базовую функциональность
4. Последовательно добавлять поддержку эффектов, фильтров и шаблонов