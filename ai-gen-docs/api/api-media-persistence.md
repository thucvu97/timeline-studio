# Справочник API: Система персистентности медиа и структура проекта

## Обзор

Этот документ описывает структуру проекта Timeline Studio, систему персистентности медиа и все связанные API. Он включает как устаревший формат (v1), так и новую профессиональную архитектуру (v2), вдохновленную DaVinci Resolve и Adobe Premiere Pro.

## Основные типы

### SavedMediaFile

```typescript
interface SavedMediaFile {
  id: string; // Уникальный идентификатор файла
  originalPath: string; // Оригинальный путь к файлу
  relativePath?: string; // Относительный путь, если внутри директории проекта
  name: string; // Имя файла
  size: number; // Размер файла в байтах
  lastModified: number; // Временная метка последнего изменения
  isVideo: boolean; // Флаги типа файла
  isAudio: boolean;
  isImage: boolean;
  metadata: SavedMediaMetadata; // Метаданные файла
  status: FileStatus; // Текущий статус файла
  lastChecked: number; // Временная метка последней проверки
}
```

### SavedMusicFile

```typescript
interface SavedMusicFile extends SavedMediaFile {
  musicMetadata: MusicMetadata; // Дополнительные метаданные для музыки
}

interface MusicMetadata {
  artist?: string;
  album?: string;
  title?: string;
  genre?: string;
  year?: number;
  track?: number;
}
```

### ProjectFile (Устаревший v1 - Не рекомендуется)

```typescript
interface ProjectFile {
  settings: ProjectSettings;
  mediaLibrary: ProjectMediaLibrary;
  browserState: SavedBrowserState;
  projectFavorites: ProjectFavorites;
  meta: ProjectMeta;
}

interface ProjectMediaLibrary {
  mediaFiles: SavedMediaFile[];
  musicFiles: SavedMusicFile[];
  lastUpdated: number;
  version: string;
}
```

### TimelineStudioProject (Новый v2)

```typescript
interface TimelineStudioProject {
  // Метаданные проекта
  metadata: ProjectMetadata;
  
  // Настройки проекта (видео, аудио, цвет)
  settings: ProjectSettings & {
    audio: AudioSettings;
    preview: PreviewSettings;
    exportPresets: ExportPreset[];
  };
  
  // Media Pool - централизованное хранилище медиа
  mediaPool: MediaPool;
  
  // Секвенции (таймлайны)
  sequences: Map<string, Sequence>;
  
  // ID активной секвенции
  activeSequenceId: string;
  
  // Кэш проекта
  cache: ProjectCache;
  
  // Настройки рабочего пространства
  workspace: WorkspaceSettings;
  
  // Коллаборация (опционально)
  collaboration?: CollaborationSettings;
  
  // Резервные копии
  backup: ProjectBackup;
}
```

## Основные сервисы

### ProjectFileService

Статический сервис для операций с файлами проекта.

#### Методы

```typescript
class ProjectFileService {
  // Загрузить проект из файла
  static async loadProject(projectPath: string): Promise<ProjectFile>;

  // Сохранить проект в файл
  static async saveProject(
    projectPath: string,
    projectData: ProjectFile,
  ): Promise<void>;

  // Создать новую структуру проекта
  static createNewProject(name: string): ProjectFile;

  // Обновить медиатеку в проекте
  static updateMediaLibrary(
    project: ProjectFile,
    mediaFiles: SavedMediaFile[],
    musicFiles: SavedMusicFile[],
  ): ProjectFile;

  // Валидировать структуру проекта
  private static validateProjectStructure(project: any): void;

  // Получить статистику проекта
  static getProjectStats(project: ProjectFile): {
    totalMediaFiles: number;
    totalMusicFiles: number;
    totalSize: number;
    lastModified: number;
  };
}
```

#### Пример использования

```typescript
// Загрузить проект
const projectData = await ProjectFileService.loadProject(
  "/path/to/project.tls",
);

// Создать новый проект
const newProject = ProjectFileService.createNewProject("Мой проект");

// Обновить медиатеку
const updatedProject = ProjectFileService.updateMediaLibrary(
  project,
  mediaFiles,
  musicFiles,
);

// Сохранить проект
await ProjectFileService.saveProject("/path/to/project.tls", updatedProject);
```

### MediaRestorationService

Статический сервис для восстановления медиафайлов.

#### Методы

```typescript
class MediaRestorationService {
  // Восстановить все медиафайлы проекта
  static async restoreProjectMedia(
    mediaFiles: SavedMediaFile[],
    musicFiles: SavedMusicFile[],
    projectPath: string,
  ): Promise<ProjectRestorationResult>;

  // Восстановить один файл
  static async restoreFile(
    savedFile: SavedMediaFile,
    projectDir: string,
  ): Promise<FileRestorationResult>;

  // Запросить у пользователя поиск отсутствующего файла
  static async promptUserToFindFile(
    savedFile: SavedMediaFile,
  ): Promise<string | null>;

  // Обработать отсутствующие файлы с участием пользователя
  static async handleMissingFiles(
    missingFiles: SavedMediaFile[],
    onProgress?: (current: number, total: number, fileName: string) => void,
  ): Promise<{
    found: Array<{
      original: SavedMediaFile;
      newPath: string;
      restoredFile: MediaFile;
    }>;
    stillMissing: SavedMediaFile[];
    userCancelled: SavedMediaFile[];
  }>;

  // Сгенерировать отчет о восстановлении
  static generateRestorationReport(result: ProjectRestorationResult): string;
}
```

#### Пример использования

```typescript
// Восстановить медиа проекта
const result = await MediaRestorationService.restoreProjectMedia(
  mediaFiles,
  musicFiles,
  projectPath,
);

// Обработать отсутствующие файлы
if (result.missingFiles.length > 0) {
  const userResult = await MediaRestorationService.handleMissingFiles(
    result.missingFiles,
    (current, total, fileName) => {
      console.log(`Обработка ${current}/${total}: ${fileName}`);
    },
  );
}

// Сгенерировать отчет
const report = MediaRestorationService.generateRestorationReport(result);
console.log(report);
```

## Утилитарные функции

### saved-media-utils.ts

#### Генерация ID файла

```typescript
function generateFileId(filePath: string, metadata: any): string;
```

Генерирует уникальный ID файла на основе пути, размера и времени изменения.

#### Утилиты для работы с путями

```typescript
// Вычислить относительный путь от проекта к файлу
async function calculateRelativePath(
  filePath: string,
  projectPath: string | null,
): Promise<string | undefined>;

// Сгенерировать альтернативные пути поиска
async function generateAlternativePaths(
  originalPath: string,
  projectDir: string,
): Promise<string[]>;

// Поиск файлов по имени в директории (системный поиск)
async function searchFilesByName(
  directory: string,
  filename: string,
  maxDepth?: number,
): Promise<string[]>;

// Получить абсолютный путь для файла
async function getAbsolutePath(path: string): Promise<string | null>;
```

#### Операции с файловой системой

```typescript
// Проверить существование файла
async function fileExists(filePath: string): Promise<boolean>;

// Получить статистику файла
async function getFileStats(filePath: string): Promise<{
  size: number;
  lastModified: number;
} | null>;

// Валидировать целостность файла
async function validateFileIntegrity(
  filePath: string,
  saved: SavedMediaFile,
): Promise<{
  isValid: boolean;
  confidence: number;
  issues: string[];
}>;
```

#### Преобразование типов

```typescript
// Преобразовать MediaFile в SavedMediaFile
async function convertToSavedMediaFile(
  file: MediaFile,
  projectPath?: string,
): Promise<SavedMediaFile>;

// Преобразовать MediaFile в SavedMusicFile
async function convertToSavedMusicFile(
  file: MediaFile,
  projectPath?: string,
): Promise<SavedMusicFile>;

// Преобразовать SavedMediaFile обратно в MediaFile
function convertFromSavedMediaFile(saved: SavedMediaFile): MediaFile;
```

## React хуки

### useMediaRestoration

Хук для управления процессом восстановления медиа.

#### Интерфейс

```typescript
interface RestorationState {
  isRestoring: boolean;
  progress: number;
  currentFile?: string;
  phase: "scanning" | "restoring" | "user_input" | "completed" | "error";
  error?: string;
}

function useMediaRestoration(): {
  // Состояние
  state: RestorationState;
  restorationResult: ProjectRestorationResult | null;
  showMissingFilesDialog: boolean;

  // Функции
  restoreProjectMedia: (
    mediaFiles: SavedMediaFile[],
    musicFiles: SavedMusicFile[],
    projectPath: string,
    options?: {
      autoResolve?: boolean;
      showDialog?: boolean;
    },
  ) => Promise<{
    restoredMedia: MediaFile[];
    restoredMusic: MediaFile[];
    needsUserInput: boolean;
    result: ProjectRestorationResult;
  }>;

  handleMissingFilesResolution: (
    resolved: Array<{
      file: SavedMediaFile;
      newPath?: string;
      action: "found" | "remove";
    }>,
  ) => Promise<{
    foundFiles: MediaFile[];
    removedFiles: SavedMediaFile[];
  }>;

  cancelMissingFilesDialog: () => void;
  resetRestoration: () => void;

  // Геттеры
  getRestorationStats: () => ProjectRestorationResult["stats"] | null;
  getMissingFiles: () => SavedMediaFile[];
  getRelocatedFiles: () => Array<{ original: SavedMediaFile; newPath: string }>;
  getRestorationReport: () => string | null;

  // Утилиты
  isRestoring: boolean;
  progress: number;
  currentPhase: RestorationState["phase"];
  error?: string;
};
```

#### Пример использования

```typescript
function ProjectManager() {
  const {
    restoreProjectMedia,
    handleMissingFilesResolution,
    showMissingFilesDialog,
    getMissingFiles,
    isRestoring,
    progress
  } = useMediaRestoration()

  const handleOpenProject = async (projectPath: string) => {
    const projectData = await ProjectFileService.loadProject(projectPath)

    if (projectData.mediaLibrary) {
      const result = await restoreProjectMedia(
        projectData.mediaLibrary.mediaFiles,
        projectData.mediaLibrary.musicFiles,
        projectPath,
        { showDialog: true }
      )

      // Обработать восстановленные файлы...
    }
  }

  return (
    <div>
      {isRestoring && <ProgressBar progress={progress} />}

      <MissingFilesDialog
        open={showMissingFilesDialog}
        missingFiles={getMissingFiles()}
        onResolve={handleMissingFilesResolution}
      />
    </div>
  )
}
```

## UI компоненты

### MissingFilesDialog

Компонент диалога для обработки отсутствующих файлов.

#### Пропсы

```typescript
interface MissingFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingFiles: SavedMediaFile[];
  onResolve: (
    resolved: Array<{
      file: SavedMediaFile;
      newPath?: string;
      action: "found" | "remove";
    }>,
  ) => void;
}
```

#### Использование

```typescript
<MissingFilesDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  missingFiles={missingFiles}
  onResolve={(resolved) => {
    // Обработать решение пользователя
    resolved.forEach(({ file, newPath, action }) => {
      if (action === 'found' && newPath) {
        // Файл найден в новом расположении
        updateFileLocation(file.id, newPath)
      } else if (action === 'remove') {
        // Удалить файл из проекта
        removeFileFromProject(file.id)
      }
    })
  }}
/>
```

## Паттерны интеграции

### Интеграция с хуком импорта

```typescript
// В useMediaImport
const saveFilesToProject = useCallback(
  async (files: MediaFile[]) => {
    if (!currentProject.path || files.length === 0) return;

    const savedFiles = await Promise.all(
      files.map((file) => convertToSavedMediaFile(file, currentProject.path)),
    );

    // Обновить состояние проекта
    setProjectDirty(true);
  },
  [currentProject.path, setProjectDirty],
);

// Вызвать после успешного импорта
await saveFilesToProject(processedFiles);
```

### Интеграция с провайдером проекта

```typescript
// В AppSettingsProvider
const openProject = async () => {
  const projectData = await ProjectFileService.loadProject(path);

  // Восстановить медиафайлы
  if (projectData.mediaLibrary) {
    const restorationResult = await restoreProjectMedia(
      projectData.mediaLibrary.mediaFiles || [],
      projectData.mediaLibrary.musicFiles || [],
      path,
      { showDialog: true },
    );

    // Обновить медиа провайдеры восстановленными файлами
    updateMediaFiles(restorationResult.restoredMedia);
    updateMusicFiles(restorationResult.restoredMusic);
  }

  return { path, name, projectData };
};
```

## Обработка ошибок

### Общие типы ошибок

```typescript
// Ошибки загрузки проекта
class ProjectLoadError extends Error {
  constructor(
    message: string,
    public readonly path: string,
  ) {
    super(message);
  }
}

// Ошибки восстановления файлов
class FileRestorationError extends Error {
  constructor(
    message: string,
    public readonly fileId: string,
  ) {
    super(message);
  }
}

// Ошибки валидации
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: string[],
  ) {
    super(message);
  }
}
```

### Паттерны обработки ошибок

```typescript
try {
  const projectData = await ProjectFileService.loadProject(path);
} catch (error) {
  if (error instanceof ProjectLoadError) {
    // Обработать ошибку загрузки проекта
    showErrorDialog(`Не удалось загрузить проект: ${error.message}`);
  } else {
    // Обработать неожиданную ошибку
    console.error("Неожиданная ошибка:", error);
  }
}
```

## Соображения производительности

### Пакетные операции

```typescript
// Обрабатывать файлы пакетами, чтобы не блокировать UI
const BATCH_SIZE = 10;

const processBatch = async (files: SavedMediaFile[], startIndex: number) => {
  const batch = files.slice(startIndex, startIndex + BATCH_SIZE);
  const results = await Promise.all(
    batch.map((file) => MediaRestorationService.restoreFile(file, projectDir)),
  );
  return results;
};
```

### Кэширование

```typescript
// Кэшировать проверки существования файлов
const fileExistsCache = new Map<string, boolean>();

const cachedFileExists = async (path: string): Promise<boolean> => {
  if (fileExistsCache.has(path)) {
    return fileExistsCache.get(path)!;
  }

  const exists = await fileExists(path);
  fileExistsCache.set(path, exists);
  return exists;
};
```

## Тестирование

### Примеры юнит-тестов

```typescript
describe("MediaRestorationService", () => {
  it("должен восстановить файл из оригинального пути", async () => {
    mockFileExists.mockResolvedValue(true);
    mockValidateFileIntegrity.mockResolvedValue({
      isValid: true,
      confidence: 1.0,
      issues: [],
    });

    const result = await MediaRestorationService.restoreFile(
      savedFile,
      projectDir,
    );

    expect(result.status).toBe("found");
    expect(result.restoredFile).toBeDefined();
  });

  it("должен найти файл в альтернативном расположении", async () => {
    mockFileExists.mockResolvedValueOnce(false); // Оригинальный путь
    mockFileExists.mockResolvedValueOnce(true); // Альтернативный путь

    const result = await MediaRestorationService.restoreFile(
      savedFile,
      projectDir,
    );

    expect(result.status).toBe("relocated");
    expect(result.newPath).toBeDefined();
  });
});
```

### Примеры интеграционных тестов

```typescript
describe("Персистентность медиа проекта", () => {
  it("должен сохранить и восстановить медиафайлы", async () => {
    // Создать проект с медиафайлами
    const project = ProjectFileService.createNewProject("Тест");
    const updatedProject = ProjectFileService.updateMediaLibrary(
      project,
      [savedMediaFile],
      [savedMusicFile],
    );

    // Сохранить проект
    await ProjectFileService.saveProject(projectPath, updatedProject);

    // Загрузить проект
    const loadedProject = await ProjectFileService.loadProject(projectPath);

    // Проверить медиатеку
    expect(loadedProject.mediaLibrary.mediaFiles).toHaveLength(1);
    expect(loadedProject.mediaLibrary.musicFiles).toHaveLength(1);
  });
});
```

## Новая архитектура (v2)

### Media Pool

Media Pool заменяет плоскую структуру MediaLibrary профессиональной системой управления медиа.

```typescript
interface MediaPool {
  // Все элементы в пуле
  items: Map<string, MediaPoolItem>;
  
  // Структура папок
  bins: Map<string, MediaBin>;
  
  // Умные коллекции
  smartCollections: SmartCollection[];
  
  // Настройки отображения
  viewSettings: MediaPoolViewSettings;
  
  // Статистика
  stats: MediaPoolStats;
}

interface MediaPoolItem {
  id: string;
  type: 'video' | 'audio' | 'image' | 'sequence' | 'compound';
  name: string;
  source: { path: string; relativePath?: string; hash?: string };
  status: 'online' | 'offline' | 'missing' | 'proxy';
  binId: string; // Папка, в которой находится элемент
  metadata: MediaMetadata;
  usage: { sequences: string[]; count: number };
  proxy?: ProxyInfo;
  thumbnail?: ThumbnailInfo;
  waveform?: WaveformInfo;
  tags: string[];
  colorLabel?: ColorLabel;
  rating?: 1 | 2 | 3 | 4 | 5;
}
```

### Секвенции (ранее Timeline)

Секвенции заменяют концепцию единственного таймлайна поддержкой множественных таймлайнов в проекте.

```typescript
interface Sequence {
  id: string;
  name: string;
  type: 'main' | 'nested' | 'multicam' | 'vr360';
  settings: SequenceSettings;
  composition: SequenceComposition;
  resources: SequenceResources;
  markers: SequenceMarker[];
  history: HistoryState[];
  metadata: SequenceMetadata;
}

interface SequenceComposition {
  tracks: TimelineTrack[];
  masterClips: MasterClip[]; // Вложенные секвенции
  automation?: AutomationRegion[];
}

interface SequenceResources {
  effects: Map<string, VideoEffect>;
  filters: Map<string, VideoFilter>;
  transitions: Map<string, Transition>;
  colorGrades: Map<string, ColorGrade>;
  titles: Map<string, Title>;
  generators: Map<string, Generator>;
}
```

### Ключевые кадры

Ключевые кадры поддерживаются для анимации свойств во времени.

```typescript
interface TimelineKeyframe {
  id: string;
  time: number; // Время в секундах
  property: string; // Имя свойства
  value: any; // Значение
  interpolation: "linear" | "ease" | "ease-in" | "ease-out" | "bezier";
}

interface AutomationRegion {
  id: string;
  parameter: string;
  startTime: number;
  endTime: number;
  keyframes: Array<{
    time: number;
    value: number;
    curve: 'linear' | 'bezier' | 'step';
  }>;
}
```

### Управление ресурсами

Система ресурсов была переработана для работы как на уровне проекта, так и на уровне секвенций.

#### Устаревшее: ProjectResources (v1)
Все ресурсы хранились на уровне проекта и разделялись между всеми таймлайнами.

```typescript
interface ProjectResources {
  effects: VideoEffect[];
  filters: VideoFilter[];
  transitions: Transition[];
  templates: MediaTemplate[];
  styleTemplates: StyleTemplate[];
  subtitleStyles: any[];
  music: any[];
  media: MediaFile[];
}
```

#### Новое: SequenceResources (v2)
Ресурсы теперь управляются для каждой секвенции, позволяя разным секвенциям иметь разные наборы ресурсов.

```typescript
// Ресурсы на уровне секвенции
interface SequenceResources {
  effects: Map<string, VideoEffect>;
  filters: Map<string, VideoFilter>;
  transitions: Map<string, Transition>;
  colorGrades: Map<string, ColorGrade>;
  titles: Map<string, Title>;
  generators: Map<string, Generator>;
}

// Применение ресурсов к клипам
interface TimelineClip {
  // ... другие поля
  effects: AppliedEffect[];
  filters: AppliedFilter[];
  transitions: AppliedTransition[];
  styleTemplate?: AppliedStyleTemplate;
}
```

Это разделение позволяет:
- Разным секвенциям использовать разные версии эффектов
- Лучшую организацию ресурсов
- Более простое разделение секвенций между проектами
- Более эффективное управление ресурсами

### Новый сервис проекта

```typescript
class TimelineStudioProjectService {
  // Создать новый проект
  createProject(name: string, settings?: Partial<ProjectSettings>): TimelineStudioProject;
  
  // Открыть проект
  openProject(path: string): Promise<TimelineStudioProject>;
  
  // Сохранить проект
  saveProject(project: TimelineStudioProject, path: string): Promise<void>;
  
  // Оптимизировать проект (удалить неиспользуемые ресурсы)
  optimizeProject(project: TimelineStudioProject): OptimizationResult;
  
  // Проверить целостность проекта
  validateProject(project: TimelineStudioProject): ValidationResult;
  
  // Экспорт/импорт для обмена
  exportForExchange(project: TimelineStudioProject, format: 'xml' | 'aaf' | 'edl'): string;
  importFromFormat(data: string, format: 'xml' | 'aaf' | 'edl'): TimelineStudioProject;
}
```

### Миграция с v1 на v2

```typescript
// Утилита для миграции старых проектов
function migrateProjectV1ToV2(oldProject: ProjectFile): TimelineStudioProject {
  const mediaPool = migrateMediaLibraryToPool(
    oldProject.mediaLibrary?.mediaFiles || [],
    oldProject.mediaLibrary?.musicFiles || []
  );
  
  // Создаем главную секвенцию из старого timeline
  const mainSequence = createSequenceFromTimeline(oldProject.timeline);
  
  return {
    metadata: createMetadataFromOld(oldProject.meta),
    settings: enhanceSettings(oldProject.settings),
    mediaPool,
    sequences: new Map([[mainSequence.id, mainSequence]]),
    activeSequenceId: mainSequence.id,
    // ... остальные поля
  };
}
```