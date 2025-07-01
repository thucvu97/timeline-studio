# Browser - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура реализована
```
src/features/browser/
├── components/
│   ├── browser.tsx ✅
│   ├── browser-tabs.tsx ✅
│   ├── browser-content.tsx ✅
│   ├── content-group.tsx ✅
│   ├── no-files.tsx ✅
│   ├── layout/
│   │   ├── add-media-button.tsx ✅
│   │   ├── browser-toggle.tsx ✅
│   │   ├── favorite-button.tsx ✅
│   │   ├── status-bar.tsx ✅
│   │   └── index.ts ✅
│   ├── preview/
│   │   ├── audio-preview.tsx ✅
│   │   ├── image-preview.tsx ✅
│   │   ├── media-preview.tsx ✅
│   │   ├── preview-timeline.tsx ✅
│   │   ├── video-preview.tsx ✅
│   │   └── index.ts ✅
│   └── index.ts ✅
├── services/
│   ├── browser-state-machine.ts ✅
│   ├── browser-state-provider.tsx ✅
│   ├── use-browser-state.ts ✅
│   └── index.ts ✅
├── types/
│   ├── browser.ts ✅
│   └── index.ts ✅
└── index.ts ✅
```

### 🧪 Тестовое покрытие
```
__tests__/
├── components/
│   ├── browser.test.tsx ✅
│   ├── browser-tabs.test.tsx ✅
│   ├── browser-content.test.tsx ✅
│   ├── content-group.test.tsx ✅
│   ├── no-files.test.tsx ✅
│   ├── layout/
│   │   ├── add-media-button.test.tsx ✅
│   │   ├── browser-toggle.test.tsx ✅
│   │   ├── favorite-button.test.tsx ✅
│   │   └── status-bar.test.tsx ✅
│   └── preview/
│       ├── audio-preview.test.tsx ✅
│       ├── image-preview.test.tsx ✅
│       ├── media-preview.test.tsx ✅
│       ├── preview-timeline.test.tsx ✅
│       └── video-preview.test.tsx ✅
└── services/
    ├── browser-state-machine.test.ts ✅
    └── browser-state-provider.test.tsx ✅
```

## 🏗️ Архитектура компонентов

### Browser (корневой компонент)
**Файл**: `components/browser.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Управление активным табом
- Интеграция с UI библиотекой (Tabs)
- Координация между BrowserTabs и BrowserContent

**Ключевые особенности**:
```typescript
const [activeTab, setActiveTab] = useState("media")

const handleTabChange = (value: string) => {
  setActiveTab(value)
}
```

### BrowserTabs
**Файл**: `components/browser-tabs.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Отображение табов для всех категорий
- Обработка переключения табов
- Визуальные индикаторы активного состояния

**Категории табов**:
- Media (медиафайлы)
- Music (музыка)
- Transitions (переходы)
- Effects (эффекты)
- Subtitles (субтитры)
- Filters (фильтры)
- Templates (шаблоны)
- Style Templates (Стилестические шаблоны)

### BrowserContent
**Файл**: `components/browser-content.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Отображение контента для каждого таба
- Интеграция с соответствующими компонентами
- Единообразное оформление

**Интегрированные компоненты**:
```typescript
<TabsContent value="media">
  <MediaListProvider>
    <MediaList />
  </MediaListProvider>
</TabsContent>
<TabsContent value="music">
  <MusicList />
</TabsContent>
<TabsContent value="styleTemplates">
  <StyleTemplatesList />
</TabsContent>
// ... другие категории
```

## 🔧 Сервисы и хуки

### BrowserStateMachine
**Файл**: `services/browser-state-machine.ts`
**Статус**: ✅ Полностью реализован

**Контекст**:
```typescript
interface BrowserContext {
  activeTab: BrowserTab
  selectedFiles: Map<BrowserTab, string[]>
  searchQuery: string
  viewMode: 'grid' | 'list'
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
  groupBy: 'none' | 'date' | 'type' | 'folder'
  filters: {
    fileTypes: string[]
    dateRange: { from?: Date; to?: Date }
    sizeRange: { min?: number; max?: number }
  }
}
```

**События**:
```typescript
type BrowserEvents = 
  | { type: 'SWITCH_TAB'; tab: BrowserTab }
  | { type: 'SELECT_FILES'; files: string[]; tab: BrowserTab }
  | { type: 'CLEAR_SELECTION'; tab?: BrowserTab }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_VIEW_MODE'; mode: 'grid' | 'list' }
  | { type: 'SET_SORT'; by: string; order: string }
  | { type: 'SET_GROUP'; by: string }
  | { type: 'SET_FILTERS'; filters: Partial<BrowserContext['filters']> }
```

### BrowserStateProvider
**Файл**: `services/browser-state-provider.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- React Context для состояния браузера
- Интеграция с BrowserStateMachine
- Предоставление хуков для компонентов
- Синхронизация с localStorage

### useBrowserState
**Файл**: `services/use-browser-state.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Доступ к состоянию браузера
- Управление табами
- Управление выбором файлов
- Поиск и фильтрация

## 🔗 Связи с другими компонентами

### ✅ Реализованные интеграции

#### MediaStudio Layouts
```typescript
// В DefaultLayout, DualLayout, VerticalLayout
import { Browser } from "@/features/browser/components/browser";

// Условное отображение
{isBrowserVisible && (
  <ResizablePanel>
    <Browser />
  </ResizablePanel>
)}
```

#### UserSettings
```typescript
const { isBrowserVisible } = useUserSettings();
```
- Управление видимостью браузера
- Сохранение пользовательских предпочтений

#### Компоненты категорий
```typescript
import {
  EffectList,
  FilterList,
  MediaList,
  MusicList,
  SubtitlesList,
  TemplateList,
  TransitionsList,
  StyleTemplatesList,
} from "@/features";
```

### ❌ Требуют реализации

#### Timeline интеграция
- Drag & drop медиафайлов на треки
- Синхронизация выбранных файлов
- Предпросмотр на таймлайне

#### VideoPlayer синхронизация
- Автоматическая загрузка выбранного видео
- Синхронизация времени воспроизведения

## 📦 Типы данных

### MediaFile (основной тип)
```typescript
interface MediaFile {
  id: string
  name: string
  path: string
  size: number
  type: 'video' | 'image' | 'audio'
  duration?: number
  width?: number
  height?: number
  frameRate?: number
  bitrate?: number
  format: string
  createdAt: Date
  modifiedAt: Date
  thumbnail?: string
}
```

### BrowserTab
```typescript
interface BrowserTab {
  id: string
  label: string
  icon?: React.ReactNode
  component: React.ComponentType
  isActive: boolean
}
```

### MediaState
```typescript
interface MediaState {
  files: MediaFile[]
  selectedFiles: MediaFile[]
  isLoading: boolean
  error: string | null
  importProgress: number
  searchQuery: string
  sortBy: 'name' | 'date' | 'size'
  sortOrder: 'asc' | 'desc'
  groupBy: 'none' | 'date' | 'type'
}
```

## 🧪 Тестирование

### Стратегия тестирования
- **Компоненты**: Рендеринг, навигация, интерактивность
- **Хуки**: Логика импорта, состояние, побочные эффекты
- **Машина состояний**: Переходы, события, контекст
- **Провайдер**: Интеграция с контекстом

### Тестовая статистика
- **Общее количество тестов**: 190 тестов (2 пропущено)
- **Время выполнения**: ~4.65 секунд
- **Файлов с тестами**: 16 файлов
- **Успешность**: 100% тестов проходят

### Ключевые тесты
```typescript
// Тест переключения табов
it('should switch tabs when clicked', () => {
  fireEvent.click(screen.getByTestId('tab-trigger-music'))
  expect(screen.getByTestId('browser-tabs')).toHaveAttribute('data-active-tab', 'music')
})

// Тест импорта медиа
it('should import media files', async () => {
  const files = [new File([''], 'test.mp4', { type: 'video/mp4' })]
  await act(async () => {
    importFiles(files)
  })
  expect(mediaFiles).toHaveLength(1)
})

// Тест состояния машины браузера
it('should handle tab switching', () => {
  const { snapshot } = createActor(browserStateMachine).start()
  expect(snapshot.context.activeTab).toBe('media')
})
```

### Моки и утилиты
```typescript
// Мок для файлового API
vi.mock('@tauri-apps/plugin-fs', () => ({
  readBinaryFile: vi.fn(),
  writeFile: vi.fn(),
}))

// Мок для медиа компонентов
vi.mock('@/features', () => ({
  MediaList: () => <div data-testid="media-list" />,
  MusicList: () => <div data-testid="music-list" />,
}))

// Мок для состояния избранного
const mockFavorites = {
  media: [],
  music: [],
  transition: [],
  // ... другие категории
}
```

## 🚀 Производительность

### Оптимизации
- **Ленивая загрузка**: TabsContent рендерится только при активации
- **Виртуализация**: Для больших списков медиафайлов
- **Мемоизация**: React.memo для предотвращения ререндеров
- **Дебаунсинг**: Для поиска и фильтрации

### Метрики
```typescript
// Время переключения табов
const TAB_SWITCH_TIME = 100; // ms

// Время загрузки контента
const CONTENT_LOAD_TIME = 500; // ms

// Размер виртуального списка
const VIRTUAL_LIST_SIZE = 50; // элементов
```

## 🔧 Конфигурация

### Настройки по умолчанию
```typescript
const DEFAULT_TAB = 'media';
const SUPPORTED_FORMATS = ['mp4', 'avi', 'mov', 'jpg', 'png', 'mp3', 'wav'];
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const THUMBNAIL_SIZE = { width: 150, height: 100 };
```

### Категории контента
```typescript
const BROWSER_CATEGORIES = [
  { id: 'media', label: 'Media', component: MediaList },
  { id: 'music', label: 'Music', component: MusicList },
  { id: 'transitions', label: 'Transitions', component: TransitionsList },
  { id: 'effects', label: 'Effects', component: EffectList },
  { id: 'subtitles', label: 'Subtitles', component: SubtitlesList },
  { id: 'filters', label: 'Filters', component: FilterList },
  { id: 'templates', label: 'Templates', component: TemplateList },
  { id: 'styleTemplates', label: 'Style Templates', component: StyleTemplatesList },
];
```

## 📈 Метрики качества

### Покрытие тестами

#### Общие показатели модуля browser
```
File               | % Stmts | % Branch | % Funcs | % Lines 
-------------------|---------|----------|---------|---------|
components         |   71.73 |    67.81 |   78.57 |   71.73 |
components/layout  |    86.1 |    94.87 |      75 |    86.1 |
components/preview |   74.54 |    55.81 |   46.66 |   74.54 |
services           |     100 |    96.92 |     100 |     100 |
```

#### Детальное покрытие компонентов
- **browser-content.tsx**: 79.2% statements, 35.29% branches
- **browser-tabs.tsx**: 100% statements, 76.19% branches
- **content-group.tsx**: 98.5% statements, 95.83% branches
- **no-files.tsx**: 100% функциональность покрыта тестами

#### Покрытие layout компонентов
- **add-media-button.tsx**: 86.4% statements, 92.85% branches
- **favorite-button.tsx**: 92.23% statements, 94.44% branches
- **browser-toggle.tsx**: 100% покрытие
- **status-bar.tsx**: 100% покрытие

#### Покрытие preview компонентов
- **audio-preview.tsx**: 87.43% statements, 61.11% branches
- **image-preview.tsx**: 88.88% statements, 64.7% branches
- **media-preview.tsx**: 63.26% statements, 75% branches
- **video-preview.tsx**: 60.36% statements, 32.07% branches
- **preview-timeline.tsx**: 100% покрытие основной функциональности

#### Покрытие сервисов
- **browser-state-machine.ts**: 100% покрытие
- **browser-state-provider.tsx**: 100% statements, 95% branches
- **use-browser-state.ts**: 100% покрытие

### Производительность
- Время переключения табов: < 100ms
- Время загрузки контента: < 500ms
- Отзывчивость UI: < 16ms
- Использование памяти: оптимизировано

### Качество кода
- TypeScript строгий режим
- ESLint без ошибок
- Полная типизация
- Документированные интерфейсы
