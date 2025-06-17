# Модуль Video Compiler

Модуль Video Compiler - это комплексная система рендеринга видео для Timeline Studio, обеспечивающая высокопроизводительную компиляцию видео с поддержкой GPU ускорения.

## Обзор

Этот модуль управляет всем конвейером рендеринга видео, от компиляции проекта до финального видеофайла, с поддержкой:
- Аппаратное кодирование (GPU)
- Многопоточный рендеринг
- Отслеживание прогресса в реальном времени
- Извлечение и кеширование кадров
- Пререндеринг для генерации превью

## Ключевые возможности

### 🚀 GPU ускорение
- Автоматическое определение доступных GPU кодировщиков (NVIDIA NVENC, Intel QuickSync, AMD AMF, Apple VideoToolbox)
- Интеллектуальный откат на CPU кодирование при недоступности GPU
- Мониторинг и оптимизация использования GPU в реальном времени

### 🎬 Возможности рендеринга
- Полный рендеринг проекта с эффектами, фильтрами и переходами
- Пререндеринг сегментов для плавного воспроизведения timeline
- Извлечение кадров для миниатюр и анализа
- Поддержка нескольких одновременных задач рендеринга

### 📊 Оптимизация производительности
- Умная система кеширования кадров и пререндеренных сегментов
- Эффективное управление памятью
- Параллельная обработка для многодорожечных проектов

### 🔧 Гибкость
- Настраиваемые параметры качества
- Поддержка множества выходных форматов
- Кастомизируемые параметры кодирования

## Компоненты

### Хуки

#### `useVideoCompiler`
Основной хук для операций рендеринга видео.

```typescript
const {
  isRendering,
  renderProgress,
  activeJobs,
  startRender,
  cancelRender,
  generatePreview
} = useVideoCompiler();
```

#### `useGpuCapabilities`
Управляет определением и конфигурацией GPU.

```typescript
const {
  gpuCapabilities,
  currentGpu,
  systemInfo,
  ffmpegCapabilities,
  refreshCapabilities,
  updateSettings
} = useGpuCapabilities();
```

#### `usePrerender`
Обрабатывает пререндеринг сегментов для превью timeline.

```typescript
const {
  isRendering,
  progress,
  prerender,
  clearResult
} = usePrerender();
```

#### `useFrameExtraction`
Извлекает кадры для различных целей (timeline, распознавание, субтитры).

```typescript
const {
  timelineFrames,
  recognitionFrames,
  subtitleFrames,
  extractTimelineFrames,
  extractRecognitionFrames,
  extractSubtitleFrames
} = useFrameExtraction();
```

#### `useRenderJobs`
Управляет несколькими задачами рендеринга и их состояниями.

```typescript
const {
  jobs,
  isLoading,
  error,
  refreshJobs,
  getJob,
  cancelJob
} = useRenderJobs();
```

#### `useCacheStats`
Мониторит и управляет кешем рендеринга.

```typescript
const {
  stats, // Включает hit_ratio и preview_hit_ratio
  isLoading,
  error,
  refreshStats,
  clearPreviewCache,
  clearAllCache
} = useCacheStats();
```

### Компоненты

#### `RenderJobsDropdown`
Отображает активные задачи рендеринга с прогрессом и элементами управления.

#### `GpuStatus`
Показывает статус GPU ускорения и возможности.

#### `CacheStatsDialog`
Предоставляет интерфейс управления кешем со статистикой.

### Сервисы

#### `video-compiler-service`
Основной сервис для операций рендеринга видео.

#### `frame-extraction-service`
Обрабатывает извлечение кадров с поддержкой кеширования.

## Примеры использования

### Базовый рендеринг видео

```typescript
import { useVideoCompiler } from '@/features/video-compiler';

function ExportButton() {
  const { startRender, isRendering, renderProgress } = useVideoCompiler();
  
  const handleExport = async () => {
    const outputPath = await selectSaveLocation();
    await startRender(project, outputPath);
  };
  
  return (
    <Button onClick={handleExport} disabled={isRendering}>
      {isRendering ? `Рендеринг ${renderProgress?.percentage}%` : 'Экспорт видео'}
    </Button>
  );
}
```

### Проверка возможностей GPU

```typescript
import { useGpuCapabilities } from '@/features/video-compiler';

function GpuSettings() {
  const { gpuCapabilities, updateSettings } = useGpuCapabilities();
  
  return (
    <div>
      {gpuCapabilities?.hardware_acceleration_supported ? (
        <div>
          <p>GPU: {gpuCapabilities.current_gpu?.name}</p>
          <p>Кодировщик: {gpuCapabilities.recommended_encoder}</p>
        </div>
      ) : (
        <p>GPU ускорение недоступно</p>
      )}
    </div>
  );
}
```

### Извлечение кадров для Timeline

```typescript
import { useFrameExtraction } from '@/features/video-compiler';

function TimelinePreview({ videoPath, duration }) {
  const { timelineFrames, extractTimelineFrames } = useFrameExtraction({
    interval: 1.0, // Извлекать кадр каждую секунду
    maxFrames: 100,
    cacheResults: true // Кеширование результатов в IndexedDB
  });
  
  useEffect(() => {
    extractTimelineFrames(videoPath, duration);
  }, [videoPath, duration]);
  
  return (
    <div className="timeline-frames">
      {timelineFrames.map(frame => (
        <img key={frame.timestamp} src={frame.frameData} />
      ))}
    </div>
  );
}
```

## Конфигурация

### Настройки GPU
Настройте параметры GPU ускорения через UI настроек или программно:

```typescript
const settings = {
  hardware_acceleration: true,
  preferred_encoder: GpuEncoder.Auto,
  quality: 85,
  max_concurrent_jobs: 2
};

await updateSettings(settings);
```

### Управление кешем
Модуль автоматически управляет кешем, но вы можете контролировать его вручную:

```typescript
const { clearPreviewCache, clearAllCache } = useCacheStats();

// Очистить весь кеш
await clearAllCache();

// Очистить только кеш превью
await clearPreviewCache();
```

## Структуры данных

### CacheStats
Статистика кеша включает детальную информацию о производительности:

```typescript
interface CacheStats {
  total_entries: number          // Общее количество записей
  preview_hits: number           // Попадания в кеш превью
  preview_misses: number         // Промахи кеша превью
  metadata_hits: number          // Попадания в кеш метаданных
  metadata_misses: number        // Промахи кеша метаданных
  memory_usage: {
    preview_bytes: number        // Размер кеша превью в байтах
    metadata_bytes: number       // Размер кеша метаданных в байтах
    render_bytes: number         // Размер кеша рендеринга в байтах
    total_bytes: number          // Общий размер в байтах
  }
  cache_size_mb: number          // Общий размер кеша в MB
}

// Расширенная версия с коэффициентами попадания
interface CacheStatsWithRatios extends CacheStats {
  hit_ratio: number              // Общий коэффициент попадания (0-1)
  preview_hit_ratio: number      // Коэффициент попадания превью (0-1)
}
```

## Советы по производительности

1. **Включите GPU ускорение**: Всегда используйте GPU ускорение, когда доступно, для рендеринга в 3-10 раз быстрее
2. **Пререндерьте сложные сегменты**: Используйте пререндеринг для сегментов timeline с тяжелыми эффектами
3. **Оптимизируйте извлечение кадров**: Установите подходящие интервалы в зависимости от длительности видео
4. **Контролируйте память GPU**: Избегайте рендеринга в 4K с менее чем 2ГБ VRAM
5. **Используйте пресеты качества**: 
   - NVENC: 85-90% качество
   - QuickSync: 80-85% качество
   - CPU: 75-80% качество

## Устранение неполадок

### GPU не определяется
- Убедитесь, что установлены последние драйверы GPU
- Проверьте, включена ли поддержка GPU в FFmpeg
- Попробуйте обновить информацию о возможностях GPU

### Рендеринг завершается с ошибкой
- Проверьте доступное место на диске
- Проверьте права доступа к выходному пути
- Контролируйте использование памяти GPU
- Проверьте логи рендеринга для конкретных ошибок

## Тестирование

### Статус тестов ✅

Модуль Video Compiler имеет **отличное покрытие тестами**:

- **Всего тестов**: 142 ✅ (прошли) + 2 ⏭️ (пропущены) = 144
- **Покрытие**: ~98% функциональности протестировано
- **Статус**: Все основные функции протестированы и работают

### Структура тестов

```
video-compiler/__tests__/
├── components/
│   ├── gpu-status.test.tsx                    # 17 тестов ✅
│   └── render-jobs-dropdown.test.tsx          # 11 тестов ✅
├── hooks/
│   ├── use-cache-stats.test.ts                # 16 тестов ✅
│   ├── use-frame-extraction.test.ts           # 14 тестов ✅ + 2 пропущены
│   ├── use-frame-extraction-simple.test.ts    # 2 теста ✅
│   ├── use-gpu-capabilities.test.ts           # 18 тестов ✅
│   ├── use-prerender.test.ts                  # 18 тестов ✅
│   ├── use-render-jobs.test.ts                # 12 тестов ✅
│   └── use-video-compiler.test.ts             # 6 тестов ✅
└── services/
    ├── frame-extraction-service.test.ts       # 16 тестов ✅
    └── video-compiler-service.test.ts         # 14 тестов ✅
```

### Запуск тестов

```bash
# Все тесты модуля
bun run test src/features/video-compiler/__tests__/

# Конкретная категория
bun run test src/features/video-compiler/__tests__/hooks/
bun run test src/features/video-compiler/__tests__/components/
bun run test src/features/video-compiler/__tests__/services/

# Отдельный тест
bun run test src/features/video-compiler/__tests__/hooks/use-render-jobs.test.ts

# В режиме наблюдения
bun run test:watch src/features/video-compiler/__tests__/
```

### Покрытые функции

✅ **Render Jobs (Задачи рендеринга)**
- Создание, отслеживание и отмена задач
- Dropdown компонент с реальными данными проектов
- Автообновление статуса каждые 2 секунды
- Локализация статусов задач

✅ **GPU Capabilities (Возможности GPU)**
- Автоопределение GPU (NVIDIA, Intel, AMD, Apple)
- Проверка аппаратных кодировщиков
- Системная информация и рекомендации

✅ **Frame Extraction (Извлечение кадров)**
- Timeline превью с кешированием в IndexedDB
- Распознавание объектов и анализ сцен
- Субтитры с временными метками

✅ **Cache Management (Управление кешем)**
- Статистика попаданий/промахов
- Управление памятью и TTL
- Очистка и оптимизация

✅ **Prerender (Пререндеринг)**
- Генерация превью сегментов
- Кеширование пререндеренных файлов
- Управление временными файлами

### Примеры тестов

```typescript
// Тест render jobs dropdown
it('should display real project names', async () => {
  const jobs = [
    {
      id: '1',
      project_name: 'My Video Project', // Реальное имя проекта
      output_path: '/output/video.mp4',
      status: RenderStatus.Processing
    }
  ];
  
  render(<RenderJobsDropdown />, { initialState: { jobs } });
  expect(screen.getByText('My Video Project')).toBeInTheDocument();
});

// Тест локализации статусов
it('should use localized status labels', () => {
  const status = getJobStatusLabel(RenderStatus.Processing, t);
  expect(status).toBe('Обработка'); // Локализованный текст
});
```

### Низкая производительность
- Включите GPU ускорение
- Уменьшите количество одновременных задач рендеринга
- Снизьте настройки качества для более быстрого рендеринга
- Очистите кеш, если он слишком большой

## Требования к системе

Этот модуль требует:
- Десктопное окружение (Tauri)
- FFmpeg с поддержкой аппаратного кодирования
- Современный GPU с обновленными драйверами

## Участие в разработке

Смотрите [DEV.md](./DEV.md) для руководства по разработке и технических деталей.