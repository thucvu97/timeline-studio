# Модуль Media

Комплексное управление медиафайлами для Timeline Studio, включающее импорт, генерацию превью, извлечение метаданных, кэширование и потоковую передачу.

## Обзор

Модуль media обеспечивает:
- **Импорт и сканирование** - Drag-and-drop файлов, сканирование папок, пакетная обработка
- **Генерация превью** - Миниатюры, кадры таймлайна, разные размеры
- **Извлечение метаданных** - Длительность, разрешение, кодеки через FFmpeg
- **Видео стриминг** - Локальный сервер для плавного воспроизведения
- **Восстановление файлов** - Автоматическое восстановление отсутствующих файлов
- **Производительность** - IndexedDB кэширование, пакетные операции

## Быстрый старт

### Базовое использование
```typescript
import { MediaContent } from '@/features/media/components/media-content'
import { useMediaImport } from '@/features/media/hooks'

function MyMediaBrowser() {
  const { importFiles, isImporting } = useMediaImport()
  
  return (
    <MediaContent 
      onImport={importFiles}
      isLoading={isImporting}
    />
  )
}
```

### Доступные хуки
```typescript
import {
  useMediaImport,      // Импорт файлов/папок
  useMediaProcessor,   // Извлечение метаданных
  useMediaPreview,     // Генерация миниатюр
  useFramePreview,     // Кадры таймлайна
  useVideoStreaming,   // Интеграция с видео сервером
  useCacheStatistics,  // Управление кэшем
  useMediaRestoration  // Восстановление отсутствующих файлов
} from '@/features/media/hooks'
```

## Тестирование

Модуль поддерживает высокое покрытие тестами всех компонентов:

### Покрытие тестами
- **Общее**: ~87% покрытие инструкций
- **Хуки**: 92% инструкций, 84% ветвлений
- **Сервисы**: 88% инструкций, 90% ветвлений
- **Компоненты**: 83% инструкций, 69% ветвлений

### Запуск тестов
```bash
# Все тесты модуля media
bun run test src/features/media/__tests__/

# С отчетом о покрытии
bun run test:coverage -- src/features/media/

# Конкретный файл теста
bun run test src/features/media/__tests__/hooks/use-media-import.test.tsx
```

## Структура проекта
```
media/
├── components/    # UI компоненты
├── hooks/         # React хуки
├── services/      # Бизнес-логика
├── types/         # TypeScript типы
├── utils/         # Вспомогательные функции
└── __tests__/     # Тестовые файлы
```

## Документация

- **[DEV.md](./DEV.md)** - Подробная техническая документация для разработчиков
- **[API Reference](./types)** - TypeScript определения типов
- **[Примеры тестов](./\_\_tests\_\_)** - Паттерны тестирования и примеры

## Участие в разработке

1. Следуйте существующим паттернам и архитектуре
2. Пишите тесты для новых функций (>80% покрытия)
3. Обновляйте документацию (README.md для обзора, DEV.md для технических деталей)
4. Используйте TypeScript strict mode
5. Запускайте `bun run lint` перед коммитом

## Лицензия

Часть Timeline Studio - смотрите корневой файл LICENSE