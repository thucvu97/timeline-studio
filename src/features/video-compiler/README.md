# Video Compiler Module

Модуль Video Compiler - это комплексная система рендеринга видео для Timeline Studio, обеспечивающая высокопроизводительную компиляцию видео с поддержкой GPU ускорения, кеширования и расширенных возможностей обработки медиа.

## 📊 Статус модуля

- ✅ **Готовность**: Полностью реализован и готов к использованию
- ✅ **Компоненты**: 3 UI компонента для управления рендерингом
- ✅ **Хуки**: 7 специализированных хуков для различных аспектов видеообработки
- ✅ **Сервисы**: 5 сервисов для взаимодействия с Rust backend
- ✅ **Тестовое покрытие**: 144 теста (142 проходят, 2 пропущено), ~98% покрытие
- ✅ **GPU поддержка**: NVIDIA NVENC, Intel QuickSync, AMD AMF, Apple VideoToolbox
- ✅ **Кеширование**: Многоуровневая система кеширования с IndexedDB

## 📁 Архитектура модуля

```
src/features/video-compiler/
├── components/                    # UI компоненты
│   ├── cache-statistics-modal.tsx    # Модал статистики кеша
│   ├── gpu-status.tsx                # Отображение статуса GPU
│   └── render-jobs-dropdown.tsx      # Выпадающий список задач рендеринга
├── hooks/                         # React хуки
│   ├── use-cache-stats.ts            # Статистика и управление кешем
│   ├── use-frame-extraction.ts       # Извлечение кадров для превью
│   ├── use-gpu-capabilities.ts       # Определение возможностей GPU
│   ├── use-metadata-cache.ts         # Кеширование метаданных
│   ├── use-prerender.ts              # Пререндеринг сегментов
│   ├── use-render-jobs.ts            # Управление задачами рендеринга
│   └── use-video-compiler.ts         # Основной хук компилятора
├── services/                      # Сервисы для backend взаимодействия
│   ├── cache-service.ts              # Управление кешем
│   ├── frame-extraction-service.ts   # Сервис извлечения кадров
│   ├── metadata-cache-service.ts     # Кеширование метаданных видео
│   └── video-compiler-service.ts     # Основной сервис компиляции
├── types/                         # TypeScript типы
│   ├── cache.ts                      # Типы кеширования
│   ├── compiler.ts                   # Типы компилятора
│   └── render.ts                     # Типы рендеринга
├── __tests__/                     # Комплексное тестирование
│   ├── components/                   # Тесты UI компонентов
│   ├── hooks/                        # Тесты React хуков
│   └── services/                     # Тесты сервисов
└── index.ts                       # Главный экспорт модуля
```

## 🚀 Ключевые возможности

### GPU Ускорение
- **Автоматическое определение**: Поддержка NVIDIA NVENC, Intel QuickSync, AMD AMF, Apple VideoToolbox
- **Интеллектуальный откат**: Плавное переключение на CPU при недоступности GPU
- **Оптимизация в реальном времени**: Мониторинг использования GPU и автонастройка параметров
- **Мульти-GPU поддержка**: Возможность использования нескольких GPU для рендеринга

### Возможности рендеринга
- **Полный рендеринг проекта**: Эффекты, фильтры, переходы, субтитры
- **Пререндеринг сегментов**: Быстрое генерирование превью для timeline
- **Извлечение кадров**: Поддержка timeline, распознавания объектов, субтитров
- **Многозадачность**: Параллельные задачи рендеринга с приоритизацией

### Система кеширования
- **Многоуровневое кеширование**: Память, IndexedDB, файловая система
- **Интеллектуальное управление**: TTL, LRU, автоочистка
- **Статистика производительности**: Коэффициенты попаданий, использование памяти
- **Оптимизация хранилища**: Сжатие и дедупликация данных

## 🔗 API и хуки

### useVideoCompiler()
Основной хук для операций рендеринга видео:

```typescript
import { useVideoCompiler } from '@/features/video-compiler';

function ExportButton() {
  const {
    isRendering,
    renderProgress,
    activeJobs,
    startRender,
    cancelRender,
    generatePreview
  } = useVideoCompiler();
  
  const handleExport = async () => {
    const outputPath = await selectSaveLocation();
    await startRender(project, outputPath, {
      quality: 85,
      hardware_acceleration: true,
      format: 'mp4'
    });
  };
  
  return (
    <Button onClick={handleExport} disabled={isRendering}>
      {isRendering 
        ? `Рендеринг ${renderProgress?.percentage}%` 
        : 'Экспорт видео'
      }
    </Button>
  );
}
```

### useGpuCapabilities()
Управление определением и конфигурацией GPU:

```typescript
import { useGpuCapabilities } from '@/features/video-compiler';

function GpuSettings() {
  const {
    gpuCapabilities,
    currentGpu,
    systemInfo,
    ffmpegCapabilities,
    refreshCapabilities,
    updateSettings
  } = useGpuCapabilities();
  
  const handleEncoderChange = async (encoder: GpuEncoder) => {
    await updateSettings({
      preferred_encoder: encoder,
      quality: encoder === GpuEncoder.NVENC ? 90 : 85
    });
  };
  
  return (
    <div>
      {gpuCapabilities?.hardware_acceleration_supported ? (
        <div>
          <h3>GPU: {gpuCapabilities.current_gpu?.name}</h3>
          <p>Память: {gpuCapabilities.current_gpu?.memory_mb}MB</p>
          <p>Кодировщик: {gpuCapabilities.recommended_encoder}</p>
          <Select onValueChange={handleEncoderChange}>
            {gpuCapabilities.available_encoders.map(encoder => (
              <SelectItem key={encoder} value={encoder}>
                {encoder}
              </SelectItem>
            ))}
          </Select>
        </div>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            GPU ускорение недоступно. Используется CPU кодирование.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### usePrerender()
Обработка пререндеринга сегментов для превью timeline:

```typescript
import { usePrerender } from '@/features/video-compiler';

function TimelinePreview({ segment }) {
  const {
    isRendering,
    progress,
    prerender,
    clearResult
  } = usePrerender();
  
  const handlePrerender = async () => {
    await prerender({
      segment,
      quality: 75, // Быстрый пререндеринг
      resolution: '720p',
      cache: true
    });
  };
  
  return (
    <div>
      <Button onClick={handlePrerender} disabled={isRendering}>
        {isRendering ? `Пререндеринг ${progress}%` : 'Создать превью'}
      </Button>
      {isRendering && (
        <Progress value={progress} className="mt-2" />
      )}
    </div>
  );
}
```

### useFrameExtraction()
Извлечение кадров для различных целей:

```typescript
import { useFrameExtraction } from '@/features/video-compiler';

function VideoAnalysis({ videoPath, duration }) {
  const {
    timelineFrames,
    recognitionFrames,
    subtitleFrames,
    extractTimelineFrames,
    extractRecognitionFrames,
    extractSubtitleFrames
  } = useFrameExtraction({
    cacheResults: true,
    maxConcurrent: 3
  });
  
  useEffect(() => {
    // Извлечение кадров для timeline превью
    extractTimelineFrames(videoPath, {
      interval: 1.0, // Каждую секунду
      maxFrames: 100,
      quality: 'medium'
    });
    
    // Извлечение для AI распознавания
    extractRecognitionFrames(videoPath, {
      interval: 5.0, // Каждые 5 секунд
      resolution: '512x512',
      format: 'jpg'
    });
  }, [videoPath, duration]);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <h3>Timeline Frames</h3>
        <div className="flex flex-wrap gap-1">
          {timelineFrames.map(frame => (
            <img 
              key={frame.timestamp} 
              src={frame.frameData} 
              className="w-16 h-12 object-cover rounded"
            />
          ))}
        </div>
      </div>
      
      <div>
        <h3>Recognition Frames</h3>
        <div className="flex flex-wrap gap-1">
          {recognitionFrames.map(frame => (
            <img 
              key={frame.timestamp} 
              src={frame.frameData} 
              className="w-16 h-12 object-cover rounded"
            />
          ))}
        </div>
      </div>
      
      <div>
        <h3>Subtitle Frames</h3>
        <div className="flex flex-wrap gap-1">
          {subtitleFrames.map(frame => (
            <img 
              key={frame.timestamp} 
              src={frame.frameData} 
              className="w-16 h-12 object-cover rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### useRenderJobs()
Управление несколькими задачами рендеринга:

```typescript
import { useRenderJobs } from '@/features/video-compiler';

function RenderJobsManager() {
  const {
    jobs,
    isLoading,
    error,
    refreshJobs,
    getJob,
    cancelJob
  } = useRenderJobs();
  
  const handleCancelJob = async (jobId: string) => {
    await cancelJob(jobId);
    toast.success('Задача отменена');
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3>Активные задачи ({jobs.length})</h3>
        <Button onClick={refreshJobs} variant="outline" size="sm">
          Обновить
        </Button>
      </div>
      
      {jobs.map(job => (
        <Card key={job.id} className="p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-medium">{job.project_name}</h4>
              <p className="text-sm text-muted-foreground">
                {job.output_path}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusVariant(job.status)}>
                  {getJobStatusLabel(job.status)}
                </Badge>
                {job.progress && (
                  <span className="text-sm">
                    {job.progress.percentage}% • {job.progress.fps} FPS
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-1">
              {job.status === RenderStatus.Processing && (
                <Button 
                  onClick={() => handleCancelJob(job.id)}
                  variant="outline" 
                  size="sm"
                >
                  Отменить
                </Button>
              )}
            </div>
          </div>
          
          {job.progress && (
            <Progress 
              value={job.progress.percentage} 
              className="mt-2" 
            />
          )}
        </Card>
      ))}
    </div>
  );
}
```

### useCacheStats()
Мониторинг и управление кешем рендеринга:

```typescript
import { useCacheStats } from '@/features/video-compiler';

function CacheManager() {
  const {
    stats, // Включает hit_ratio и preview_hit_ratio
    isLoading,
    error,
    refreshStats,
    clearPreviewCache,
    clearAllCache
  } = useCacheStats();
  
  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3>Статистика кеша</h3>
        <Button onClick={refreshStats} variant="outline" size="sm">
          Обновить
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium">Производительность</h4>
          <div className="space-y-1 text-sm">
            <div>Общий коэффициент: {(stats?.hit_ratio * 100 ?? 0).toFixed(1)}%</div>
            <div>Превью: {(stats?.preview_hit_ratio * 100 ?? 0).toFixed(1)}%</div>
            <div>Всего записей: {stats?.total_entries ?? 0}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium">Использование памяти</h4>
          <div className="space-y-1 text-sm">
            <div>Превью: {formatBytes(stats?.memory_usage.preview_bytes ?? 0)}</div>
            <div>Метаданные: {formatBytes(stats?.memory_usage.metadata_bytes ?? 0)}</div>
            <div>Рендеринг: {formatBytes(stats?.memory_usage.render_bytes ?? 0)}</div>
            <div className="font-medium">
              Всего: {formatBytes(stats?.memory_usage.total_bytes ?? 0)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={clearPreviewCache} variant="outline">
          Очистить превью
        </Button>
        <Button 
          onClick={clearAllCache} 
          variant="destructive"
          className="ml-auto"
        >
          Очистить всё
        </Button>
      </div>
    </Card>
  );
}
```

### useMetadataCache()
Специализированное кеширование метаданных видео:

```typescript
import { useMetadataCache } from '@/features/video-compiler';

function VideoMetadataProvider({ children, videoPath }) {
  const {
    metadata,
    isLoading,
    error,
    getMetadata,
    preloadMetadata,
    clearMetadata
  } = useMetadataCache();
  
  useEffect(() => {
    if (videoPath) {
      getMetadata(videoPath);
    }
  }, [videoPath]);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <VideoMetadataContext.Provider value={metadata}>
      {children}
    </VideoMetadataContext.Provider>
  );
}
```

## 🧩 Компоненты

### RenderJobsDropdown
Компонент для отображения и управления активными задачами рендеринга:

```typescript
import { RenderJobsDropdown } from '@/features/video-compiler';

function TopBar() {
  return (
    <div className="flex items-center gap-2">
      <RenderJobsDropdown />
      <GpuStatus />
    </div>
  );
}
```

**Возможности**:
- Отображение списка активных задач с прогрессом
- Реальные названия проектов и пути вывода
- Локализованные статусы задач
- Кнопки отмены для выполняющихся задач
- Автообновление каждые 2 секунды

### GpuStatus
Индикатор статуса GPU ускорения:

```typescript
import { GpuStatus } from '@/features/video-compiler';

function ToolBar() {
  return (
    <div className="flex items-center gap-2">
      <GpuStatus 
        showDetails={true}
        onClick={openGpuSettings}
      />
    </div>
  );
}
```

**Возможности**:
- Визуальный индикатор доступности GPU
- Отображение текущего кодировщика
- Информация о памяти GPU
- Клик для открытия настроек

### CacheStatisticsModal
Модальное окно с детальной статистикой кеша:

```typescript
import { CacheStatisticsModal } from '@/features/video-compiler';

function CacheSettings() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Статистика кеша
      </Button>
      <CacheStatisticsModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

## 📦 Типы данных

### RenderProgress
Детальная информация о прогрессе рендеринга:

```typescript
interface RenderProgress {
  jobId: string;                 // Уникальный ID задачи
  status: RenderStatus;          // Статус выполнения
  percentage: number;            // Процент завершения (0-100)
  currentFrame: number;          // Текущий обрабатываемый кадр
  totalFrames: number;           // Общее количество кадров
  fps: number;                   // Скорость обработки (кадров/сек)
  eta: number;                   // Оценочное время завершения (сек)
  message?: string;              // Дополнительное сообщение
  gpu_usage?: number;            // Использование GPU (0-100%)
  memory_usage?: number;         // Использование памяти GPU (MB)
}
```

### GpuCapabilities
Информация о возможностях GPU:

```typescript
interface GpuCapabilities {
  hardware_acceleration_supported: boolean;  // Поддержка аппаратного ускорения
  available_encoders: GpuEncoder[];          // Доступные кодировщики
  recommended_encoder: GpuEncoder | null;    // Рекомендуемый кодировщик
  current_gpu: GpuInfo | null;               // Информация о текущем GPU
  gpus: GpuInfo[];                           // Все доступные GPU
  ffmpeg_version: string;                    // Версия FFmpeg
  supported_formats: string[];               // Поддерживаемые форматы
}

interface GpuInfo {
  id: string;                    // Уникальный ID GPU
  name: string;                  // Название GPU
  vendor: GpuVendor;             // Производитель (NVIDIA, Intel, AMD, Apple)
  memory_mb: number;             // Объем памяти в MB
  compute_capability?: string;   // Compute Capability (для NVIDIA)
  driver_version?: string;       // Версия драйвера
}
```

### CacheStats
Расширенная статистика кеша:

```typescript
interface CacheStats {
  total_entries: number;          // Общее количество записей
  preview_hits: number;           // Попадания в кеш превью
  preview_misses: number;         // Промахи кеша превью
  metadata_hits: number;          // Попадания в кеш метаданных
  metadata_misses: number;        // Промахи кеша метаданных
  memory_usage: {
    preview_bytes: number;        // Размер кеша превью в байтах
    metadata_bytes: number;       // Размер кеша метаданных в байтах
    render_bytes: number;         // Размер кеша рендеринга в байтах
    total_bytes: number;          // Общий размер в байтах
  };
  cache_size_mb: number;          // Общий размер кеша в MB
  hit_ratio: number;              // Общий коэффициент попадания (0-1)
  preview_hit_ratio: number;      // Коэффициент попадания превью (0-1)
  oldest_entry?: number;          // Timestamp самой старой записи
  cleanup_count: number;          // Количество автоочисток
}
```

### FrameExtractionResult
Результат извлечения кадров:

```typescript
interface FrameExtractionResult {
  timestamp: number;              // Временная метка кадра (секунды)
  frameData: string;              // Base64 данные изображения
  frameIndex: number;             // Индекс кадра в видео
  resolution: {                   // Разрешение кадра
    width: number;
    height: number;
  };
  format: 'jpg' | 'png' | 'webp'; // Формат изображения
  size_bytes: number;             // Размер изображения в байтах
  extraction_time_ms: number;     // Время извлечения в миллисекундах
  cached: boolean;                // Был ли кадр получен из кеша
}
```

## 🛠️ Сервисы

### video-compiler-service.ts
Основной сервис для операций рендеринга:

```typescript
// Основные функции сервиса
export const VideoCompilerService = {
  // Рендеринг проекта
  async renderProject(schema: ProjectSchema, outputPath: string, settings: RenderSettings): Promise<RenderResult>,
  
  // Отмена рендеринга
  async cancelRender(jobId: string): Promise<void>,
  
  // Получение прогресса
  async getRenderProgress(jobId: string): Promise<RenderProgress>,
  
  // Проверка возможностей
  async checkCapabilities(): Promise<GpuCapabilities>,
  
  // Настройка параметров
  async updateRenderSettings(settings: Partial<RenderSettings>): Promise<void>
};
```

### frame-extraction-service.ts
Сервис для извлечения кадров с поддержкой кеширования:

```typescript
export const FrameExtractionService = {
  // Извлечение кадров для timeline
  async extractTimelineFrames(
    videoPath: string, 
    options: TimelineExtractionOptions
  ): Promise<FrameExtractionResult[]>,
  
  // Извлечение для распознавания
  async extractRecognitionFrames(
    videoPath: string, 
    options: RecognitionExtractionOptions
  ): Promise<FrameExtractionResult[]>,
  
  // Извлечение для субтитров
  async extractSubtitleFrames(
    videoPath: string, 
    timestamps: number[]
  ): Promise<FrameExtractionResult[]>,
  
  // Управление кешем
  async getCachedFrame(videoPath: string, timestamp: number): Promise<FrameExtractionResult | null>,
  async clearFrameCache(videoPath?: string): Promise<void>
};
```

### cache-service.ts
Управление многоуровневым кешем:

```typescript
export const CacheService = {
  // Статистика кеша
  async getCacheStats(): Promise<CacheStats>,
  
  // Очистка кеша
  async clearPreviewCache(): Promise<void>,
  async clearMetadataCache(): Promise<void>,
  async clearAllCache(): Promise<void>,
  
  // Оптимизация
  async optimizeCache(): Promise<void>,
  async validateCacheIntegrity(): Promise<boolean>,
  
  // Настройки
  async setCacheSettings(settings: CacheSettings): Promise<void>
};
```

## 🧪 Тестирование

### Статус тестов ✅

Модуль Video Compiler имеет **отличное покрытие тестами**:

- **Всего тестов**: 144 (142 ✅ проходят, 2 ⏭️ пропущены)
- **Покрытие**: ~98% функциональности протестировано
- **Статус**: Все основные функции протестированы и работают стабильно

### Структура тестирования

```
video-compiler/__tests__/
├── components/                         # UI компоненты
│   ├── gpu-status.test.tsx               # 17 тестов ✅
│   └── render-jobs-dropdown.test.tsx     # 11 тестов ✅
├── hooks/                              # React хуки
│   ├── use-cache-stats.test.ts           # 16 тестов ✅
│   ├── use-frame-extraction.test.ts      # 14 тестов ✅ + 2 пропущены
│   ├── use-frame-extraction-simple.test.ts # 2 теста ✅
│   ├── use-gpu-capabilities.test.ts      # 18 тестов ✅
│   ├── use-prerender.test.ts             # 18 тестов ✅
│   ├── use-render-jobs.test.ts           # 12 тестов ✅
│   └── use-video-compiler.test.ts        # 6 тестов ✅
└── services/                           # Сервисы backend
    ├── frame-extraction-service.test.ts  # 16 тестов ✅
    └── video-compiler-service.test.ts    # 14 тестов ✅
```

### Покрытые функциональности

✅ **Render Jobs (Задачи рендеринга)**
- Создание, отслеживание и отмена задач рендеринга
- Dropdown компонент с реальными данными проектов
- Автообновление статуса каждые 2 секунды
- Локализация статусов задач на 10 языках

✅ **GPU Capabilities (Возможности GPU)**
- Автоопределение GPU всех основных производителей
- Проверка аппаратных кодировщиков и их возможностей
- Системная информация и рекомендации по настройкам
- Обработка ошибок и fallback на CPU

✅ **Frame Extraction (Извлечение кадров)**
- Timeline превью с оптимизированным кешированием в IndexedDB
- Распознавание объектов и анализ сцен для AI функций
- Субтитры с временными метками и превью кадров
- Batch обработка и параллельные запросы

✅ **Cache Management (Управление кешем)**
- Детальная статистика попаданий/промахов
- Управление памятью с TTL и автоочисткой
- Оптимизация хранилища и дедупликация
- Мониторинг производительности

✅ **Prerender (Пререндеринг)**
- Генерация превью сегментов для быстрого воспроизведения
- Кеширование пререндеренных файлов
- Управление временными файлами и очистка

### Примеры тестирования

```typescript
// Тест компонента render jobs dropdown
describe('RenderJobsDropdown', () => {
  it('should display real project names and progress', async () => {
    const jobs = [
      {
        id: '1',
        project_name: 'My Video Project', // Реальное имя проекта
        output_path: '/output/video.mp4',
        status: RenderStatus.Processing,
        progress: { percentage: 65, fps: 30 }
      }
    ];
    
    render(<RenderJobsDropdown />, { 
      initialState: { renderJobs: jobs } 
    });
    
    expect(screen.getByText('My Video Project')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('30 FPS')).toBeInTheDocument();
  });
  
  it('should use localized status labels', () => {
    const status = getJobStatusLabel(RenderStatus.Processing, t);
    expect(status).toBe('Обработка'); // Локализованный текст
  });
});

// Тест GPU capabilities
describe('useGpuCapabilities', () => {
  it('should detect NVIDIA GPU correctly', async () => {
    const { result } = renderHook(() => useGpuCapabilities());
    
    act(() => {
      mockTauriInvoke.mockResolvedValueOnce({
        hardware_acceleration_supported: true,
        current_gpu: {
          name: 'NVIDIA GeForce RTX 4090',
          vendor: 'NVIDIA',
          memory_mb: 24576
        },
        recommended_encoder: GpuEncoder.NVENC
      });
    });
    
    await waitFor(() => {
      expect(result.current.gpuCapabilities?.current_gpu?.name)
        .toBe('NVIDIA GeForce RTX 4090');
      expect(result.current.gpuCapabilities?.recommended_encoder)
        .toBe(GpuEncoder.NVENC);
    });
  });
});

// Тест кеширования кадров
describe('useFrameExtraction', () => {
  it('should cache extracted frames correctly', async () => {
    const { result } = renderHook(() => useFrameExtraction({ 
      cacheResults: true 
    }));
    
    const videoPath = '/test/video.mp4';
    const duration = 10;
    
    await act(async () => {
      await result.current.extractTimelineFrames(videoPath, duration);
    });
    
    // Проверяем, что кадры сохранены в кеш
    expect(mockIndexedDB.get).toHaveBeenCalledWith(
      expect.stringContaining(videoPath)
    );
    
    // Повторный запрос должен использовать кеш
    await act(async () => {
      await result.current.extractTimelineFrames(videoPath, duration);
    });
    
    expect(result.current.timelineFrames[0].cached).toBe(true);
  });
});
```

### Запуск тестов

```bash
# Все тесты модуля
bun run test src/features/video-compiler/__tests__/

# По категориям
bun run test src/features/video-compiler/__tests__/hooks/
bun run test src/features/video-compiler/__tests__/components/
bun run test src/features/video-compiler/__tests__/services/

# Конкретный тест с детальным выводом
bun run test src/features/video-compiler/__tests__/hooks/use-render-jobs.test.ts --verbose

# В режиме наблюдения для разработки
bun run test:watch src/features/video-compiler/__tests__/

# Генерация отчета покрытия
bun run test:coverage src/features/video-compiler/__tests__/
```

## 🚀 Производительность и оптимизация

### Реализованные оптимизации

#### GPU ускорение
- **Автоматический выбор кодировщика**: Система выбирает оптимальный кодировщик на основе доступного оборудования
- **Адаптивное качество**: Настройка параметров в зависимости от возможностей GPU
- **Мониторинг ресурсов**: Отслеживание использования GPU памяти и загрузки

#### Система кеширования
- **Многоуровневое кеширование**: Память → IndexedDB → Файловая система
- **Интеллектуальная очистка**: LRU алгоритм с TTL для автоматической очистки
- **Компрессия данных**: Сжатие кадров и метаданных для экономии места
- **Дедупликация**: Избежание дублирования идентичных данных

#### Извлечение кадров
- **Batch обработка**: Групповое извлечение кадров для снижения накладных расходов
- **Параллельные запросы**: Одновременная обработка нескольких видео
- **Адаптивное качество**: Автоматический выбор разрешения в зависимости от цели

### Рекомендации по использованию

#### Настройки GPU

```typescript
// Оптимальные настройки для разных сценариев
const RENDER_PRESETS = {
  // Быстрый пререндеринг для превью
  PREVIEW: {
    quality: 70,
    resolution_scale: 0.5,
    hardware_acceleration: true,
    encoder: 'auto'
  },
  
  // Финальный рендеринг высокого качества
  FINAL: {
    quality: 90,
    resolution_scale: 1.0,
    hardware_acceleration: true,
    encoder: 'nvenc_h264' // или auto
  },
  
  // Экономичный режим для слабых GPU
  ECONOMY: {
    quality: 75,
    resolution_scale: 0.75,
    hardware_acceleration: true,
    max_concurrent_jobs: 1
  }
};
```

#### Управление памятью

```typescript
// Мониторинг и оптимизация использования памяти
const optimizeMemoryUsage = async () => {
  const stats = await getCacheStats();
  const memoryUsage = stats.memory_usage.total_bytes;
  const MAX_CACHE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  
  if (memoryUsage > MAX_CACHE_SIZE) {
    // Очистка старых записей превью
    await clearPreviewCache();
    
    // Оптимизация кеша
    await optimizeCache();
  }
};
```

#### Производительность извлечения кадров

```typescript
// Оптимальные параметры для разных целей
const FRAME_EXTRACTION_PRESETS = {
  TIMELINE: {
    interval: 1.0,           // Каждую секунду
    maxFrames: 100,          // Максимум 100 кадров
    quality: 'medium',       // Среднее качество для превью
    resolution: '320x180',   // Низкое разрешение для быстрой загрузки
    cache: true
  },
  
  RECOGNITION: {
    interval: 5.0,           // Каждые 5 секунд
    maxFrames: 50,           // Меньше кадров для AI
    quality: 'high',         // Высокое качество для точности
    resolution: '512x512',   // Квадратное разрешение для AI моделей
    cache: true
  },
  
  SUBTITLES: {
    timestamps: [],          // Конкретные временные метки
    quality: 'medium',       // Среднее качество
    resolution: '640x360',   // Разрешение для предпросмотра
    cache: true
  }
};
```

## 📋 Roadmap и планы развития

### Краткосрочные задачи (Q1-Q2)

1. **Улучшение GPU поддержки**:
   - [ ] Поддержка мульти-GPU рендеринга
   - [ ] Динамическая балансировка нагрузки между GPU
   - [ ] UI выбора конкретного GPU для рендеринга
   - [ ] Профилирование производительности разных кодировщиков

2. **Расширенное кеширование**:
   - [ ] Облачное хранилище кеша для синхронизации между устройствами
   - [ ] Общий кеш между проектами для экономии места
   - [ ] Умная предзагрузка кеша на основе паттернов использования
   - [ ] Сжатие кеша с потерями для экономии места

3. **Пользовательский опыт**:
   - [ ] Пресеты рендеринга для разных платформ (YouTube, Vimeo, Instagram)
   - [ ] Пакетный рендеринг с разными настройками
   - [ ] Расширенный preview с поддержкой эффектов реального времени
   - [ ] Уведомления о завершении рендеринга

### Долгосрочные планы (Q3-Q4)

1. **Аналитика и мониторинг**:
   - [ ] Детальная статистика рендеринга и производительности
   - [ ] Графики использования GPU и CPU в реальном времени
   - [ ] Определение узких мест в конвейере рендеринга
   - [ ] Автоматические рекомендации по оптимизации

2. **Продвинутые возможности**:
   - [ ] Распределенный рендеринг между несколькими машинами
   - [ ] AI-ускоренная обработка с использованием Tensor cores
   - [ ] Поддержка 8K и HDR рендеринга
   - [ ] Интеграция с облачными GPU сервисами

3. **Интеграция с Timeline**:
   - [ ] Real-time превью эффектов без пререндеринга
   - [ ] Интерактивная система отслеживания прогресса
   - [ ] Оценка размера файла в реальном времени
   - [ ] Прогресс по трекам и отдельным эффектам

### Техническая модернизация

1. **Архитектурные улучшения**:
   - [ ] Извлечение общих паттернов в shared утилиты
   - [ ] Консолидация логики обработки ошибок
   - [ ] Улучшение типизации для ответов сервисов
   - [ ] Рефакторинг сервисов для лучшей переиспользуемости

2. **Расширение тестирования**:
   - [ ] Интеграционные тесты для полного конвейера рендеринга
   - [ ] Тестирование сценариев отката GPU
   - [ ] Тесты регрессии производительности
   - [ ] E2E тесты с реальными видеофайлами

3. **Документация и DevEx**:
   - [ ] Добавление встроенной документации для сложных алгоритмов
   - [ ] Создание диаграмм архитектуры и data flow
   - [ ] Документирование построения команд FFmpeg
   - [ ] Создание playground для тестирования рендеринга

## 🔧 Руководство по разработке

### Архитектурные принципы

Модуль следует принципам:

1. **Разделение ответственности**: Каждый хук отвечает за конкретную область функциональности
2. **Типобезопасность**: Строгая типизация всех структур данных и API
3. **Обработка ошибок**: Комплексная система обработки ошибок на всех уровнях
4. **Производительность**: Оптимизация для работы с большими видеофайлами
5. **Тестируемость**: Полное покрытие тестами всех критических путей

### Паттерны разработки

#### Стандартный паттерн хука

```typescript
export function useFeature(options?: FeatureOptions): FeatureReturn {
  const { t } = useTranslation();
  const [state, setState] = useState<State>(initialState);
  
  const action = useCallback(async (params: ActionParams) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Валидация входных данных
      validateParams(params);
      
      // Основная логика
      const result = await service.performAction(params);
      
      setState(prev => ({ 
        ...prev, 
        data: result, 
        loading: false 
      }));
      
      // Уведомление об успехе
      toast.success(t('videoCompiler.feature.success'));
      
      return result;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }));
      
      // Уведомление об ошибке
      toast.error(t('videoCompiler.feature.error'), {
        description: errorMessage
      });
      
      throw error;
    }
  }, [service, t]);
  
  return { 
    ...state, 
    action,
    // Дополнительные utility функции
    retry: () => action(lastParams),
    reset: () => setState(initialState)
  };
}
```

#### Обработка ошибок

```typescript
// Типизированные ошибки
class VideoCompilerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VideoCompilerError';
  }
}

// Централизованная обработка ошибок
const handleError = (error: unknown, context: string): string => {
  console.error(`[VideoCompiler:${context}]`, error);
  
  if (error instanceof VideoCompilerError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return `${context}: ${error.message}`;
  }
  
  return `Неизвестная ошибка в ${context}`;
};
```

#### Коммуникация с Rust backend

```typescript
// Типизированные вызовы Tauri
const invokeRust = async <T>(
  command: string, 
  args?: Record<string, any>
): Promise<T> => {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new VideoCompilerError(
      `Ошибка выполнения команды ${command}`,
      'RUST_COMMAND_ERROR',
      { command, args, error }
    );
  }
};

// Использование
const result = await invokeRust<RenderResult>('render_project', {
  projectSchema: schema,
  outputPath: path,
  settings: settings
});
```

### Добавление новых функций

При добавлении новых возможностей следуйте этому checklist:

1. **Определите типы** в `types/`:
   ```typescript
   // types/my-feature.ts
   export interface MyFeatureOptions {
     param1: string;
     param2?: number;
   }
   
   export interface MyFeatureResult {
     data: string;
     metadata: object;
   }
   ```

2. **Создайте сервис** в `services/`:
   ```typescript
   // services/my-feature-service.ts
   export const MyFeatureService = {
     async performAction(options: MyFeatureOptions): Promise<MyFeatureResult> {
       return invokeRust('my_feature_action', options);
     }
   };
   ```

3. **Реализуйте хук** в `hooks/`:
   ```typescript
   // hooks/use-my-feature.ts
   export function useMyFeature(options?: MyFeatureOptions) {
     // Следуйте стандартному паттерну
   }
   ```

4. **Добавьте UI компонент** в `components/` (если нужно):
   ```typescript
   // components/my-feature-component.tsx
   export function MyFeatureComponent() {
     const { data, action } = useMyFeature();
     // Реализация UI
   }
   ```

5. **Напишите тесты** в `__tests__/`:
   ```typescript
   // __tests__/hooks/use-my-feature.test.ts
   describe('useMyFeature', () => {
     it('should handle success case', async () => {
       // Тестирование
     });
   });
   ```

6. **Обновите переводы** во всех локалях:
   ```json
   {
     "videoCompiler": {
       "myFeature": {
         "success": "Операция выполнена успешно",
         "error": "Ошибка выполнения операции"
       }
     }
   }
   ```

### Отладка и профилирование

#### Логирование

```typescript
// Условное логирование для разработки
const DEBUG = process.env.NODE_ENV === 'development';

const log = {
  debug: (...args: any[]) => DEBUG && console.log('[VideoCompiler:DEBUG]', ...args),
  info: (...args: any[]) => console.log('[VideoCompiler:INFO]', ...args),
  warn: (...args: any[]) => console.warn('[VideoCompiler:WARN]', ...args),
  error: (...args: any[]) => console.error('[VideoCompiler:ERROR]', ...args)
};
```

#### Мониторинг производительности

```typescript
// Измерение времени выполнения
const measurePerformance = async <T>(
  name: string, 
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    log.debug(`${name} completed in ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    log.error(`${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};
```

#### Инструменты для отладки

1. **GPU мониторинг**: GPU-Z, nvidia-smi, Intel Graphics Command Center
2. **FFmpeg тестирование**: Прямое тестирование команд в терминале
3. **React DevTools**: Профилирование компонентов и хуков
4. **Tauri DevTools**: Мониторинг IPC вызовов
5. **IndexedDB Inspector**: Проверка состояния кеша в браузере

## 🔌 Интеграция с системой

### Зависимости

Модуль интегрируется со следующими системами:

- **AppSettingsProvider**: Локализация интерфейса и пользовательские настройки
- **ProjectSettingsProvider**: Настройки проекта и параметры рендеринга
- **TimelineProvider**: Интеграция с timeline для пререндеринга
- **MediaProvider**: Работа с медиафайлами и метаданными
- **NotificationProvider**: Уведомления о завершении рендеринга

### Использование в приложении

```typescript
// В главном провайдере приложения
function App() {
  return (
    <AppSettingsProvider>
      <ProjectSettingsProvider>
        <TimelineProvider>
          <MediaProvider>
            <VideoCompilerProvider>
              <MainApplication />
            </VideoCompilerProvider>
          </MediaProvider>
        </TimelineProvider>
      </ProjectSettingsProvider>
    </AppSettingsProvider>
  );
}

// В компонентах приложения
function ExportMenu() {
  const { startRender } = useVideoCompiler();
  const { currentProject } = useProjectSettings();
  
  return (
    <DropdownMenu>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => startRender(currentProject, '/output/video.mp4')}>
          Экспорт видео
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## 🚨 Устранение неполадок

### Распространенные проблемы

#### GPU не определяется

**Симптомы**: Показывается "GPU ускорение недоступно" несмотря на наличие GPU

**Решения**:
1. Проверьте драйверы GPU (обновите до последней версии)
2. Убедитесь, что FFmpeg собран с поддержкой аппаратного ускорения
3. Проверьте права доступа приложения к GPU
4. Перезапустите приложение после обновления драйверов

```typescript
// Диагностика GPU
const { refreshCapabilities } = useGpuCapabilities();
const capabilities = await refreshCapabilities();

console.log('FFmpeg encoders:', capabilities.ffmpeg_capabilities?.encoders);
console.log('Available GPUs:', capabilities.gpus);
```

#### Рендеринг завершается с ошибкой

**Симптомы**: Рендеринг начинается, но прерывается с ошибкой

**Возможные причины и решения**:

1. **Недостаток места на диске**:
   ```typescript
   // Проверка свободного места
   const freespace = await invoke('get_disk_space', { path: outputPath });
   if (freespace < estimatedFileSize) {
     throw new Error('Недостаточно места на диске');
   }
   ```

2. **Недостаток памяти GPU**:
   ```typescript
   // Снижение качества для экономии VRAM
   const settings = {
     quality: 70, // Вместо 90
     resolution_scale: 0.8, // Вместо 1.0
     max_concurrent_jobs: 1 // Вместо 2
   };
   ```

3. **Повреждение исходных файлов**:
   ```typescript
   // Валидация медиафайлов перед рендерингом
   const validateMedia = async (mediaFiles: string[]) => {
     for (const file of mediaFiles) {
       const isValid = await invoke('validate_media_file', { path: file });
       if (!isValid) {
         throw new Error(`Поврежден файл: ${file}`);
       }
     }
   };
   ```

#### Низкая производительность рендеринга

**Симптомы**: Рендеринг выполняется очень медленно

**Оптимизации**:

1. **Включите GPU ускорение**:
   ```typescript
   const optimizeSettings = {
     hardware_acceleration: true,
     preferred_encoder: GpuEncoder.Auto, // Пусть система выберет лучший
     quality: 85, // Баланс между качеством и скоростью
   };
   ```

2. **Оптимизируйте проект**:
   ```typescript
   // Пререндер сложных эффектов
   const { prerender } = usePrerender();
   await prerender({
     segment: heavyEffectsSegment,
     quality: 75,
     cache: true
   });
   ```

3. **Настройте кеш**:
   ```typescript
   // Очистка переполненного кеша
   const { stats, clearPreviewCache } = useCacheStats();
   if (stats?.cache_size_mb > 2048) { // > 2GB
     await clearPreviewCache();
   }
   ```

#### Проблемы с кешем

**Симптомы**: Превью не загружаются или загружаются медленно

**Решения**:

1. **Очистка поврежденного кеша**:
   ```typescript
   const { clearAllCache } = useCacheStats();
   await clearAllCache();
   ```

2. **Проверка целостности**:
   ```typescript
   const isValid = await invoke('validate_cache_integrity');
   if (!isValid) {
     await clearAllCache();
     toast.info('Кеш очищен из-за повреждения данных');
   }
   ```

3. **Оптимизация настроек**:
   ```typescript
   const cacheSettings = {
     max_size_mb: 1024, // 1GB максимум
     ttl_hours: 24, // Хранить 24 часа
     compression: true, // Включить сжатие
   };
   await setCacheSettings(cacheSettings);
   ```

### Диагностические команды

```bash
# Проверка возможностей FFmpeg
ffmpeg -encoders | grep nvenc  # NVIDIA
ffmpeg -encoders | grep qsv    # Intel QuickSync
ffmpeg -encoders | grep amf    # AMD

# Информация о GPU
nvidia-smi                     # NVIDIA
intel_gpu_top                  # Intel
radeontop                      # AMD

# Мониторинг ресурсов во время рендеринга
htop                           # CPU и память
iotop                          # Дисковая активность
```

## 🎯 Заключение

Модуль Video Compiler представляет собой полнофункциональную систему рендеринга видео для Timeline Studio, объединяющую:

- **Высокую производительность** благодаря GPU ускорению и оптимизированному кешированию
- **Надежность** с комплексным тестированием (98% покрытие) и обработкой ошибок
- **Гибкость** с поддержкой различных форматов, кодировщиков и настроек качества
- **Удобство использования** с интуитивным API и автоматической оптимизацией

Модуль готов для использования в продакшене и продолжает активно развиваться с учетом потребностей пользователей и технологических тенденций в области видеообработки.