# Browser (Браузер медиафайлов)

## Обзор

Браузер медиафайлов — это компонент `Browser`, который обеспечивает доступ ко всем типам контента для видеомонтажа. Он организован в виде системы вкладок и позволяет просматривать, управлять и добавлять различные ресурсы на таймлайн.

## Структура компонента

### Основные компоненты

- **`Browser`** - корневой компонент с управлением вкладками
- **`BrowserTabs`** - панель вкладок с иконками
- **`BrowserContent`** - контейнер для содержимого вкладок

### Система вкладок

Браузер содержит 7 основных вкладок:

1. **Media** (`Image`) - медиафайлы (видео, аудио, изображения)
2. **Music** (`Music`) - музыкальные файлы
3. **Effects** (`Sparkles`) - эффекты
4. **Filters** (`Blend`) - фильтры
5. **Subtitles** (`Type`) - субтитры
6. **Transitions** (`FlipHorizontal2`) - переходы
7. **Templates** (`Grid2X2`) - шаблоны

## Состояние

Браузер управляется через несколько машин состояний:

- **`mediaMachine`** - управление медиафайлами
- **`musicMachine`** - управление музыкальными файлами
- **`resourcesMachine`** - управление ресурсами (эффекты, фильтры, переходы)
- **`userSettingsMachine`** - сохранение активной вкладки

## Основные функции

- Импорт медиафайлов через диалог выбора файлов
- Переключение между типами контента через вкладки
- Отображение файлов в различных режимах (список, сетка, миниатюры)
- Сортировка, фильтрация и группировка контента
- Предпросмотр медиафайлов с метаданными
- Добавление файлов на таймлайн
- Управление метаданными файлов
- Поиск по содержимому

## Процесс импорта медиафайлов

### 1. Выбор файлов пользователем

Пользователь нажимает кнопку "Добавить медиа" или использует drag & drop, что запускает:

```typescript
// Frontend: Tauri диалог выбора файлов
const selectedFiles = await selectMediaFile();
```

**Tauri команда `open()`** открывает системный диалог с фильтрами:

**Для медиафайлов (`selectMediaFile`):**

- **Видео**: `.mp4`, `.avi`, `.mkv`, `.mov`, `.webm`
- **Аудио**: `.mp3`, `.wav`, `.ogg`, `.flac`
- **Изображения**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

**Для музыкальных файлов (`selectAudioFile`):**

- **Аудио**: `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.wma`

### 2. Обработка файлов в Rust бэкенде

После выбора файлов, для каждого файла выполняется:

```rust
// Backend: Tauri команда get_media_metadata
#[command]
pub fn get_media_metadata(file_path: String) -> Result<MediaFile, String>
```

**Процесс обработки в Rust:**

1. **Проверка файла**: Проверяется существование файла
2. **FFprobe анализ**: Запускается `ffprobe` для получения метаданных:
   ```bash
   ffprobe -v quiet -print_format json -show_format -show_streams file.mp4
   ```
3. **Парсинг метаданных**: Извлекаются:
   - Длительность, разрешение, кодек, битрейт
   - Количество потоков (видео/аудио)
   - Размер файла, время создания
4. **Создание MediaFile**: Формируется структура с полными метаданными

### 3. Пакетная обработка на Frontend

```typescript
// Frontend: Обработка файлов пакетами
const processFilesInBatches = async (filePaths: string[])
```

**Оптимизация процесса:**

1. **Мгновенное отображение**: Сразу создаются базовые объекты файлов с флагом `isLoadingMetadata: true`
2. **Пакетная обработка**: Файлы обрабатываются пакетами по 5 штук одновременно
3. **Прогресс-бар**: Отображается прогресс загрузки метаданных
4. **Обновление в реальном времени**: Метаданные обновляются по мере получения

### 4. Сохранение в состоянии приложения

```typescript
// Добавление в медиа-контекст
media.addMediaFiles(processedFiles);
```

**Результат:**

- Файлы появляются в браузере медиафайлов
- Доступны для предпросмотра и добавления на таймлайн
- Сохраняются в состоянии приложения до закрытия

## Структура файлов

### Основные компоненты

```
src/features/browser/components/
├── browser.tsx                    # Корневой компонент с управлением вкладками
├── browser-tabs.tsx              # Панель вкладок с иконками
├── browser-content.tsx           # Контейнер для содержимого вкладок
├── layout/                       # Компоненты макета
│   ├── add-media-button.tsx      # Кнопка добавления медиа
│   ├── audio-player.tsx          # Аудиоплеер
│   ├── no-files.tsx              # Компонент пустого состояния
│   └── status-bar.tsx            # Статусная строка с информацией
├── preview/                      # Компоненты предпросмотра
│   ├── media-preview.tsx         # Общий компонент предпросмотра
│   ├── video-preview.tsx         # Предпросмотр видео
│   ├── audio-preview.tsx         # Предпросмотр аудио
│   ├── image-preview.tsx         # Предпросмотр изображений
│   └── preview-timeline.tsx      # Временная шкала для предпросмотра
└── tabs/                         # Компоненты вкладок
    ├── media/                    # Вкладка медиафайлов
    │   ├── index.ts              # Экспорты компонентов
    │   ├── media-list.tsx        # Основной список медиафайлов
    │   ├── media-content.tsx     # Контент с группировкой файлов
    │   ├── media-item.tsx        # Элемент медиафайла
    │   ├── media-group.tsx       # Группа медиафайлов по дате
    │   ├── media-toolbar.tsx     # Панель инструментов (поиск, сортировка)
    │   ├── file-metadata.tsx     # Метаданные файла
    │   ├── media-list-machine.ts # Машина состояний для списка
    │   └── media-list-provider.tsx # Провайдер состояния
    ├── music/                    # Вкладка музыки
    │   ├── music-list.tsx        # Список музыкальных файлов
    │   ├── music-machine.ts      # Машина состояний музыки
    │   └── music-provider.tsx    # Провайдер музыки
    ├── effects/                  # Вкладка эффектов
    │   └── effect-list.tsx       # Список эффектов
    ├── filters/                  # Вкладка фильтров
    │   └── filter-list.tsx       # Список фильтров
    ├── transitions/              # Вкладка переходов
    │   └── transitions-list.tsx  # Список переходов
    ├── templates/                # Вкладка шаблонов
    │   └── template-list.tsx     # Список шаблонов
    └── subtitles/                # Вкладка субтитров
        └── subtitles-list.tsx    # Список субтитров
```

### Tauri команды и API

**Frontend API (`src/lib/media.ts`):**

```typescript
// Выбор файлов через системный диалог
export async function selectMediaFile(): Promise<string[] | null>;

// Получение метаданных файла
export async function getMediaMetadata(filePath: string): Promise<any>;

// Получение списка файлов в директории
export async function getMediaFiles(directory: string): Promise<string[]>;
```

**Backend команды (`src-tauri/src/media.rs`):**

```rust
// Получение метаданных медиафайла с помощью FFmpeg
#[command]
pub fn get_media_metadata(file_path: String) -> Result<MediaFile, String>

// Получение списка медиафайлов в директории
#[command]
pub fn get_media_files(directory: String) -> Result<Vec<String>, String>
```

**Структуры данных:**

- `MediaFile` - полная информация о медиафайле
- `ProbeData` - данные FFprobe (потоки и формат)
- `VideoMetadata`, `AudioMetadata`, `ImageMetadata` - типизированные метаданные

### Хуки для импорта

**`useMediaImport` (`src/features/browser/media/use-media-import.ts`):**

```typescript
const { importFile, importDirectory, isImporting, progress } = useMediaImport();

// Импорт отдельных медиафайлов
const result = await importFile();

// Импорт всей директории
const result = await importDirectory();
```

**`useMusicImport` (`src/features/music/hooks/use-music-import.ts`):**

```typescript
const { importFile, importDirectory, isImporting, progress } = useMusicImport();

// Импорт отдельных аудиофайлов (только аудио)
const result = await importFile();

// Импорт всей директории (фильтрует только аудиофайлы)
const result = await importDirectory();
```

**`useEffectsImport` (`src/features/effects/hooks/use-effects-import.ts`):**

```typescript
const { importEffectsFile, importEffectFile, isImporting, progress } = useEffectsImport();

// Импорт JSON файла с эффектами
const result = await importEffectsFile();

// Импорт отдельных файлов эффектов (.cube, .3dl, .lut, .preset)
const result = await importEffectFile();
```

**`useFiltersImport` (`src/features/filters/hooks/use-filters-import.ts`):**

```typescript
const { importFiltersFile, importFilterFile, isImporting } = useFiltersImport();

// Импорт JSON файла с фильтрами
const result = await importFiltersFile();

// Импорт отдельных файлов фильтров (.cube, .3dl, .lut, .preset)
const result = await importFilterFile();
```

**`useTransitionsImport` (`src/features/transitions/hooks/use-transitions-import.ts`):**

```typescript
const { importTransitionsFile, importTransitionFile, isImporting } = useTransitionsImport();

// Импорт JSON файла с переходами
const result = await importTransitionsFile();

// Импорт отдельных файлов переходов
const result = await importTransitionFile();
```

**`useSubtitlesImport` (`src/features/subtitles/hooks/use-subtitles-import.ts`):**

```typescript
const { importSubtitlesFile, importSubtitleFile, isImporting } = useSubtitlesImport();

// Импорт JSON файла со стилями субтитров
const result = await importSubtitlesFile();

// Импорт отдельных файлов стилей (.css, .json, .srt, .vtt, .ass)
const result = await importSubtitleFile();
```

**`useTemplatesImport` (`src/features/templates/hooks/use-templates-import.ts`):**

```typescript
const { importTemplatesFile, importTemplateFile, isImporting } = useTemplatesImport();

// Импорт JSON файла с многокамерными шаблонами
const result = await importTemplatesFile();

// Импорт отдельных файлов шаблонов (пока только JSON)
const result = await importTemplateFile();
```

**`useStyleTemplatesImport` (`src/features/style-templates/hooks/use-style-templates-import.ts`):**

```typescript
const { importStyleTemplatesFile, importStyleTemplateFile, isImporting } = useStyleTemplatesImport();

// Импорт JSON файла со стилистическими шаблонами
const result = await importStyleTemplatesFile();

// Импорт отдельных файлов стилистических шаблонов (пока только JSON)
const result = await importStyleTemplateFile();
```

## Поддерживаемые типы файлов

- **Видео**: `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`
- **Аудио**: `.mp3`, `.wav`, `.aac`, `.ogg`, `.flac`, `.m4a`, `.wma`
- **Изображения**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.heic`
- **Субтитры**: `.srt`, `.vtt`
- **Эффекты**:
  - JSON файлы с эффектами: `.json`
  - Файлы эффектов: `.cube`, `.3dl`, `.lut`, `.preset`
- **Переходы**:
  - JSON файлы с переходами: `.json`
  - Файлы переходов: `.json`, `.preset`, `.transition`
- **Фильтры**:
  - JSON файлы с фильтрами: `.json`
  - Файлы фильтров: `.cube`, `.3dl`, `.lut`, `.preset`
- **Стили субтитров**:
  - JSON файлы со стилями: `.json`
  - Файлы стилей: `.css`, `.json`, `.srt`, `.vtt`, `.ass`
- **Многокамерные шаблоны**:
  - JSON файлы с шаблонами: `.json`
  - Планируется: `.bundle` (Filmora), `.cct` (CapCut), `.zip`, `.mogrt` (Adobe)
- **Стилистические шаблоны**:
  - JSON файлы со стилями: `.json`
  - Планируется: `.bundle` (Filmora), `.zip`, `.css`, `.aep` (After Effects)

## Функциональность вкладки Media

### Компоненты медиавкладки

- **`MediaList`** - основной компонент списка с провайдером `MediaListProvider`
- **`MediaToolbar`** - панель инструментов с поиском, сортировкой и переключением режимов
- **`MediaContent`** - контейнер для отображения групп файлов
- **`MediaGroup`** - группа файлов с заголовком и кнопкой "Добавить все"
- **`MediaItem`** - отдельный элемент медиафайла
- **`StatusBar`** - нижняя панель с информацией и быстрыми действиями

### Режимы отображения

1. **List** - список с метаданными

   - Горизонтальное расположение
   - Превью слева, метаданные справа
   - Компактное отображение информации

2. **Grid** - сетка с превью

   - Вертикальные карточки
   - Крупные превью
   - Название файла под превью

3. **Thumbnails** - миниатюры
   - Мелкие превью в сетке
   - Максимальная плотность отображения

### Группировка и сортировка

- **Группировка по дате**: файлы группируются по дням создания
- **Сортировка**: по имени, дате, размеру, длительности
- **Фильтрация**: поиск по имени файла
- **Размер превью**: настраиваемый размер от 60 до 200px

## Функциональность сортировки и фильтрации

### Сортировка

- По имени (A-Z, Z-A)
- По дате создания (новые-старые, старые-новые)
- По размеру файла
- По длительности

### Фильтрация

- Все файлы
- Видео
- Аудио
- Изображения

### Группировка

- Без группировки
- По типу файла (видео/аудио/изображения)
- По дате создания
- По длительности

### Поиск

- Поиск по имени файла
- Поиск по тегам
- Поиск по метаданным
- Фильтрация результатов поиска
- Сохранение поисковых запросов
- Быстрый поиск (по мере ввода)

## Управление метаданными

- Просмотр метаданных файла
- Редактирование тегов
- Добавление описаний
- Управление рейтингами
- Добавление заметок
- Экспорт метаданных

## Взаимодействие с другими компонентами

### Взаимодействие с таймлайном

- Добавление медиафайлов на таймлайн
- Синхронизация выбранных файлов
- Обновление метаданных при изменении файлов

### Взаимодействие с плеером

- Предпросмотр медиафайлов
- Синхронизация воспроизведения
- Управление громкостью

## Примеры использования

### Добавление файла на таймлайн

```typescript
// В компоненте MediaItem
const { addFilesToTimeline } = useMedia();

const handleAddMedia = () => {
  addFilesToTimeline([file]);
};

// Использование в MediaGroup для добавления всех файлов группы
const handleAddAllFiles = () => {
  addFilesToTimeline(files);
};
```

### Управление состоянием списка медиафайлов

```typescript
// В MediaListProvider
const {
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
} = useMediaList();

// Изменение режима отображения
const handleViewModeChange = (mode: "list" | "grid" | "thumbnails") => {
  setViewMode(mode);
};

// Поиск файлов
const handleSearch = (query: string) => {
  setSearchQuery(query);
};
```

### Работа с превью файлов

```typescript
// В компоненте MediaPreview
interface MediaPreviewProps {
  file: MediaFile;
  onAddMedia: (file: MediaFile) => void;
  isAdded: boolean;
  size: number;
  ignoreRatio?: boolean;
}

// Проверка добавленных файлов
const { isFileAdded } = useMedia();
const isAdded = isFileAdded(file);
```

### Импорт музыкальных файлов

```typescript
// В компоненте MusicList
const { importFile, importDirectory } = useMusicImport();

// Импорт отдельных аудиофайлов
const handleImportFile = async () => {
  const result = await importFile();
  if (result.success) {
    console.log(result.message);
  }
};

// Импорт всей директории с музыкой
const handleImportFolder = async () => {
  const result = await importDirectory();
  if (result.success) {
    console.log(result.message);
  }
};
```

### Управление состоянием музыки

```typescript
// В MusicProvider
const { addMusicFiles, updateMusicFiles } = useMusic();

// Добавление новых музыкальных файлов
addMusicFiles(newAudioFiles);

// Обновление существующих файлов (например, после загрузки метаданных)
updateMusicFiles(updatedAudioFiles);
```

## Планы по развитию

- Проработка механизма добавления/переноса эффектов, фильтров и переходов на таймлайн
- Разработка системы добавления шаблонов на объединенный схема-таймлайн
- Реализация синхронизации настроек предпросмотра между вкладками
- Добавление возможности группировки шаблонов по количеству экранов

## Связанные документы

- [Разработка Timeline Studio](../../DEV.md)
- [Машины состояний](../state-machines.md)
- [Верхняя панель навигации](./top-nav-bar.md)
