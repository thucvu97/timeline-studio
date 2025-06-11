# Video Compiler Tests

Этот каталог содержит тесты для модуля Video Compiler.

## Структура тестов

```
__tests__/
├── components/           # Тесты UI компонентов
│   ├── cache-stats-dialog.test.tsx
│   ├── gpu-status.test.tsx
│   └── render-jobs-dropdown.test.tsx
├── services/            # Тесты сервисов
│   ├── frame-extraction-service.test.ts
│   └── video-compiler-service.test.ts
├── hooks/              # Тесты React хуков
│   ├── use-cache-stats.test.ts
│   ├── use-frame-extraction.test.ts
│   ├── use-gpu-capabilities.test.ts
│   ├── use-prerender.test.ts
│   ├── use-render-jobs.test.ts
│   └── use-video-compiler.test.ts
└── README.md           # Этот файл
```

## Покрытие тестами

### Компоненты
- **GpuStatus** - Отображение статуса GPU и возможностей
- **GpuStatusBadge** - Компактное отображение GPU
- **CacheStatsDialog** - Диалог статистики кеша
- **RenderJobsDropdown** - Выпадающий список задач рендеринга

### Хуки
- **useVideoCompiler** - Основной хук для рендеринга видео
- **useGpuCapabilities** - Управление GPU возможностями
- **useFrameExtraction** - Извлечение кадров из видео
- **usePrerender** - Пререндеринг сегментов
- **useRenderJobs** - Управление задачами рендеринга
- **useCacheStats** - Статистика и управление кешем

### Сервисы
- **videoCompilerService** - Основной сервис компиляции
- **frameExtractionService** - Сервис извлечения кадров с кешированием

## Запуск тестов

```bash
# Запуск всех тестов модуля
bun run test src/features/video-compiler

# Запуск с покрытием
bun run test:coverage src/features/video-compiler

# Запуск конкретного файла
bun run test src/features/video-compiler/__tests__/use-video-compiler.test.ts

# Запуск в режиме наблюдения
bun run test:watch src/features/video-compiler
```

## Моки и заглушки

### Tauri API
Все вызовы Tauri API (`invoke`, `listen`, `emit`) замокированы для изоляции тестов от backend.

### IndexedDB
Используется мок Dexie для тестирования кеширования кадров без реальной базы данных.

### React Hooks
Тесты используют `@testing-library/react-hooks` для изолированного тестирования хуков.

## Основные сценарии тестирования

### Рендеринг видео
- Запуск рендеринга с различными настройками
- Отслеживание прогресса
- Отмена рендеринга
- Обработка ошибок

### GPU ускорение
- Определение доступных GPU
- Переключение аппаратного ускорения
- Рекомендации по настройкам
- Форматирование информации о GPU

### Извлечение кадров
- Извлечение для timeline превью
- Извлечение для распознавания
- Извлечение для субтитров
- Кеширование в IndexedDB

### Управление кешем
- Просмотр статистики
- Очистка различных типов кеша
- Форматирование размеров
- Процентное распределение

## Конвенции тестирования

1. **Именование**: Используйте describe/it с понятными описаниями
2. **Моки**: Создавайте моки в начале файла
3. **Очистка**: Используйте beforeEach для сброса моков
4. **Асинхронность**: Используйте waitFor для асинхронных операций
5. **Проверки**: Проверяйте как успешные сценарии, так и ошибки

## Примеры тестов

### Тестирование хука
```typescript
it("should start render successfully", async () => {
  const mockProject = { /* ... */ }
  mockInvoke.mockResolvedValueOnce("job-123")

  const { result } = renderHook(() => useVideoCompiler())

  await act(async () => {
    await result.current.startRender(mockProject, "/output.mp4")
  })

  expect(result.current.isRendering).toBe(true)
})
```

### Тестирование компонента
```typescript
it("should toggle GPU acceleration", async () => {
  render(
    <BaseProviders>
      <GpuStatus />
    </BaseProviders>
  )

  const switchElement = screen.getByRole("switch")
  fireEvent.click(switchElement)

  await waitFor(() => {
    expect(mockUpdateSettings).toHaveBeenCalled()
  })
})
```

## Дальнейшие улучшения

1. **E2E тесты** - Интеграционные тесты с реальным backend
2. **Performance тесты** - Тестирование производительности рендеринга
3. **Visual regression** - Скриншот тесты для компонентов
4. **Stress тесты** - Тестирование с большими проектами