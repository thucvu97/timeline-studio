# Руководство разработчика Video Compiler

Этот документ предоставляет технические детали и руководство по разработке для модуля Video Compiler.

## Обзор архитектуры

```
video-compiler/
├── components/           # UI компоненты
│   ├── cache-stats-dialog.tsx
│   ├── gpu-status.tsx
│   └── render-jobs-dropdown.tsx
├── hooks/               # React хуки
│   ├── use-cache-stats.ts
│   ├── use-frame-extraction.ts
│   ├── use-gpu-capabilities.ts
│   ├── use-prerender.ts
│   ├── use-render-jobs.ts
│   └── use-video-compiler.ts
├── services/            # Основные сервисы
│   ├── frame-extraction-service.ts
│   └── video-compiler-service.ts
├── types/               # TypeScript типы
│   └── render.ts
└── __tests__/          # Тестовые файлы
```

## Технический стек

- **Frontend**: React с TypeScript
- **Управление состоянием**: React хуки с локальным состоянием
- **Backend коммуникация**: Tauri IPC (invoke)
- **Обработка видео**: FFmpeg (через Rust backend)
- **GPU ускорение**: Аппаратные кодировщики (NVENC, QuickSync и др.)
- **Кеширование**: IndexedDB для кадров, файловая система для пререндеренных сегментов

## Основные концепции

### 1. Определение GPU ускорения

Модуль автоматически определяет доступные GPU кодировщики через возможности FFmpeg:

```typescript
interface GpuCapabilities {
  hardware_acceleration_supported: boolean;
  available_encoders: GpuEncoder[];
  recommended_encoder: GpuEncoder | null;
  current_gpu: GpuInfo | null;
  gpus: GpuInfo[];
}
```

### 2. Конвейер рендеринга

Процесс рендеринга следует этому конвейеру:

1. **Валидация проекта**: Проверка корректности схемы проекта
2. **Подготовка ресурсов**: Загрузка всех медиа файлов и эффектов
3. **Обработка кадров**: Применение эффектов, фильтров, переходов
4. **Кодирование**: Использование GPU/CPU кодировщика для создания финального видео
5. **Отслеживание прогресса**: Обновления в реальном времени через слушатели событий

### 3. Извлечение кадров

Извлечение кадров поддерживает три цели:
- **Timeline**: Превью кадры для скраббинга
- **Распознавание**: Кадры для AI анализа
- **Субтитры**: Кадры на временных метках субтитров

### 4. Стратегия кеширования

Двухуровневая система кеширования:
- **Кеш в памяти**: Недавно использованные кадры
- **Постоянный кеш**: IndexedDB для кадров, файловая система для сегментов

## Детали реализации

### Паттерны хуков

Все хуки следуют единому паттерну:

```typescript
export function useFeature(options?: FeatureOptions): FeatureReturn {
  const { t } = useTranslation();
  const [state, setState] = useState<State>(initialState);
  
  const action = useCallback(async (params) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const result = await service.action(params);
      setState(prev => ({ ...prev, data: result, loading: false }));
      toast.success(t('success.message'));
    } catch (error) {
      setState(prev => ({ ...prev, error, loading: false }));
      toast.error(t('error.message'));
    }
  }, [dependencies]);
  
  return { ...state, action };
}
```

### Коммуникация с сервисами

Сервисы взаимодействуют с Rust backend через Tauri:

```typescript
// Frontend
const result = await invoke<RenderResult>('render_project', {
  projectSchema: schema,
  outputPath: path,
  settings: settings
});

// Rust backend обрабатывает реальные операции FFmpeg
```

### Обработка ошибок

Комплексная обработка ошибок на нескольких уровнях:

1. **Ошибки валидации**: Проверка входных данных перед обработкой
2. **Ошибки выполнения**: Перехват и отчет об ошибках обработки
3. **Обратная связь пользователю**: Toast уведомления с переводами
4. **Логирование**: Консольные логи для отладки

### Типовая безопасность

Строгая типизация во всем модуле:

```typescript
// Строгие типы для всех структур данных
type RenderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface RenderProgress {
  jobId: string;
  status: RenderStatus;
  percentage: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  eta: number;
  message?: string;
}
```

## Руководство по разработке

### 1. Добавление новых функций

При добавлении новых функций:

1. Определите типы в директории `types/`
2. Создайте функции сервиса для коммуникации с backend
3. Реализуйте React хук для управления состоянием
4. Добавьте UI компоненты при необходимости
5. Напишите тесты для критических путей
6. Обновите переводы во всех локалях

### 2. Тестирование

Пишите тесты для:
- Поведения хуков и управления состоянием
- Обработки ошибок в функциях сервиса
- Рендеринга компонентов и взаимодействий
- Логики определения GPU и откатов

Пример теста:

```typescript
describe('useVideoCompiler', () => {
  it('должен обрабатывать обновления прогресса рендеринга', async () => {
    const { result } = renderHook(() => useVideoCompiler());
    
    act(() => {
      result.current.startRender(mockProject, '/output/path');
    });
    
    expect(result.current.isRendering).toBe(true);
    
    // Симулируем обновление прогресса
    act(() => {
      mockProgressUpdate({ percentage: 50 });
    });
    
    expect(result.current.renderProgress?.percentage).toBe(50);
  });
});
```

### 3. Оптимизация производительности

Ключевые области для оптимизации:

1. **Извлечение кадров**: 
   - Пакетные запросы кадров
   - Использование подходящих интервалов
   - Реализация умного кеширования

2. **Использование GPU**:
   - Мониторинг памяти GPU
   - Настройка качества на основе возможностей
   - Плавная обработка переключения кодировщиков

3. **Управление памятью**:
   - Очистка неиспользуемых записей кеша
   - Ограничение одновременных операций
   - Использование потоковой передачи где возможно

### 4. Интернационализация

Все строки, видимые пользователю, должны использовать переводы:

```typescript
// ❌ Плохо
toast.error("Failed to render");

// ✅ Хорошо
toast.error(t("videoCompiler.render.failed"));
```

Ключи переводов следуют этому паттерну:
```
videoCompiler.{feature}.{action/state}
```

### 5. Сообщения об ошибках

Предоставляйте полезные сообщения об ошибках:

```typescript
// Включайте контекст в ошибки
throw new Error(`Не удалось извлечь кадры: ${error.message}`);

// Дружественные сообщения пользователю
toast.error(t('videoCompiler.frameExtraction.error'), {
  description: getErrorDescription(error)
});
```

## Будущие улучшения

### Запланированные функции

1. **Поддержка нескольких GPU**
   - Распределение рендеринга между несколькими GPU
   - Динамическая балансировка нагрузки
   - UI выбора GPU

2. **Расширенное кеширование**
   - Облачное хранилище кеша
   - Общий кеш между проектами
   - Умная предзагрузка кеша

3. **Пресеты рендеринга**
   - Сохранение пользовательских настроек кодирования
   - Платформо-специфичные пресеты (YouTube, Instagram и др.)
   - Пакетный рендеринг с разными пресетами

4. **Аналитика производительности**
   - Детальная статистика рендеринга
   - Графики использования GPU
   - Определение узких мест

5. **Расширенное отслеживание прогресса**
   - Прогресс по трекам
   - Этапы обработки эффектов
   - Оценка размера файла

### Технический долг

1. **Необходимый рефакторинг**
   - Извлечение общих паттернов в общие утилиты
   - Консолидация логики обработки ошибок
   - Улучшение вывода типов для ответов сервисов

2. **Пробелы в тестировании**
   - Добавить интеграционные тесты для полного конвейера рендеринга
   - Тестировать сценарии отката GPU
   - Тесты регрессии производительности

3. **Документация**
   - Добавить встроенную документацию для сложных алгоритмов
   - Создать диаграммы архитектуры
   - Документировать построение команд FFmpeg

## Советы по отладке

### Распространенные проблемы

1. **GPU не определяется**
   ```typescript
   // Проверьте возможности FFmpeg
   const caps = await invoke('check_ffmpeg_capabilities');
   console.log('Доступные кодировщики:', caps.encoders);
   ```

2. **Сбои рендеринга**
   ```typescript
   // Включите подробное логирование
   await invoke('set_log_level', { level: 'debug' });
   ```

3. **Утечки памяти**
   ```typescript
   // Мониторьте размер кеша
   const stats = await getCacheStats();
   if (stats.totalSize > MAX_CACHE_SIZE) {
     await clearOldCache();
   }
   ```

### Инструменты разработки

1. **Мониторинг GPU**: Используйте GPU-Z или аналогичные инструменты
2. **Тестирование FFmpeg**: Тестируйте команды прямо в терминале
3. **Профилирование производительности**: React DevTools Profiler
4. **Инспектор сети**: Мониторинг вызовов Tauri IPC

## Участие в разработке

При участии в разработке этого модуля:

1. Следуйте существующим паттернам кода
2. Добавляйте тесты для новой функциональности
3. Обновляйте переводы во всех локалях
4. Документируйте сложную логику
5. Учитывайте влияние на производительность
6. Обрабатывайте ошибки корректно

## Ресурсы

- [FFmpeg Hardware Acceleration](https://trac.ffmpeg.org/wiki/HWAccelIntro)
- [Tauri IPC Documentation](https://tauri.app/v1/guides/features/command/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [IndexedDB Best Practices](https://web.dev/indexeddb-best-practices/)

## Контакты

По вопросам или обсуждениям этого модуля:
- Откройте issue на GitHub
- Свяжитесь с мейнтейнерами
- Сначала проверьте существующую документацию и issues