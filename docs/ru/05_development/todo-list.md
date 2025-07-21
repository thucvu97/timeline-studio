# TODO List - Timeline Studio

Последнее обновление: 2025-01-21

## 📊 Общая статистика

- **Всего TODO/FIXME**: 120+ комментариев
- **Критичных**: 15 (блокируют основной функционал)
- **Высокий приоритет**: 35 
- **Средний приоритет**: 50+
- **Низкий приоритет**: 20+

## 🚨 Критичные TODO (требуют немедленного решения)

### 1. Сохранение проектов Timeline
**Файл**: `src/features/timeline/services/timeline-machine.ts:1776`
```typescript
// TODO: реализовать логику сохранения проекта
```
**Проблема**: Без этого невозможно сохранить работу пользователя
**Решение**: Интегрировать с Tauri FS API для сохранения в .tsp формате

### 2. База данных для Person Identification
**Файл**: `src/features/ai-chat/tools/person-identification/*.ts`
```typescript
// TODO: интегрировать с Tauri SQL для хранения face embeddings
```
**Проблема**: Система распознавания лиц не может сохранять данные
**Решение**: Создать SQLite схему через Tauri SQL plugin

### 3. FFmpeg интеграция в Rust
**Файлы**: Множественные в `src-tauri/src/video/`
```rust
// TODO: интегрировать с FFmpeg для обработки видео
```
**Проблема**: Блокирует все операции обработки видео
**Решение**: Использовать ffmpeg-next crate или системные вызовы

## 🔥 Высокий приоритет

### AI Content Intelligence (24 TODO)

#### Scene Analysis Engine
- `scene-detection.ts`: Определение переходов между сценами
- `object-tracking.ts`: Трекинг объектов между кадрами
- `music-detection.ts`: Определение музыкальных сегментов
- `age-gender-detection.ts`: Определение возраста и пола

#### Script Generation
- `content-generator.ts`: Генерация альтернативных вариантов
- `character-analysis.ts`: Определение отношений между персонажами
- `dialogue-generation.ts`: Генерация диалогов

### Timeline Features (18 TODO)

#### Основные операции
- `timeline-machine.ts`: Поддержка субтитров и музыкальных треков
- `clip-operations.ts`: Копирование и разделение клипов
- `snap-logic.ts`: Улучшение snap calculations
- `drag-drop.ts`: Обработка drag & drop между треками

#### Импорт/Экспорт
- `import-service.ts`: Поддержка FCPXML, AAF, EDL форматов
- `export-service.ts`: Экспорт в профессиональные форматы

### Video Compiler (16 TODO)

#### Рендеринг
- `frame-extraction.ts`: Извлечение кадров для анализа
- `scene-detection.ts`: Определение границ сцен
- `progress-tracking.ts`: Отслеживание прогресса рендеринга
- `pause-resume.ts`: Логика приостановки/возобновления

### Montage Planner (12 TODO)

#### Анализ качества
- `quality-analyzer.ts`: FFmpeg интеграция для анализа
- `composition-analyzer.ts`: Анализ композиции кадра
- `emotion-detector.ts`: Определение эмоций в кадре

## 📋 Средний приоритет

### Browser & Media Management
- Расширенная фильтрация файлов
- Кэширование миниатюр
- Поддержка облачных хранилищ

### Player Features
- Поддержка HDR видео
- Аппаратное ускорение декодирования
- Субтитры и multiple audio tracks

### Effects & Filters
- GPU ускорение для эффектов
- Предпросмотр в реальном времени
- Пользовательские шейдеры

### UI/UX Improvements
- Темы оформления
- Настраиваемые горячие клавиши
- Улучшенные тултипы

## 🔧 Технический долг

### Тесты
- `timeline-player-sync.test.ts`: FIXME - баг с currentSelectedClip
- Недостаточное покрытие для AI features
- Отсутствуют E2E тесты для timeline operations

### Рефакторинг
- Дублирование кода в browser-tools и timeline-tools
- Большие компоненты требуют разделения
- Неконсистентная обработка ошибок

### Производительность
- Оптимизация рендеринга timeline при большом количестве клипов
- Ленивая загрузка тяжелых модулей
- Кэширование результатов AI анализа

## 🗺️ Roadmap рекомендации

### Q1 2025 (Январь-Март)
1. **Неделя 1-2**: Реализовать сохранение проектов
2. **Неделя 3-4**: FFmpeg интеграция в Rust
3. **Февраль**: Person Identification с базой данных
4. **Март**: Импорт/экспорт форматы

### Q2 2025 (Апрель-Июнь)
1. **Апрель**: AI Content Intelligence - основные features
2. **Май**: Video Compiler улучшения
3. **Июнь**: Montage Planner полная реализация

### Q3 2025 (Июль-Сентябрь)
1. Timeline operations (copy/paste/split)
2. GPU ускорение эффектов
3. Облачная интеграция

## 📝 Процесс работы с TODO

### Добавление новых TODO
```typescript
// TODO: [Категория] Краткое описание
// Детальное описание проблемы и возможное решение
// Приоритет: Критичный/Высокий/Средний/Низкий
// Связано с: #issue-number
```

### Категории
- `[Save/Load]` - Операции сохранения/загрузки
- `[AI]` - AI функциональность
- `[Timeline]` - Timeline операции
- `[Performance]` - Оптимизация производительности
- `[UI/UX]` - Интерфейс пользователя
- `[Backend]` - Rust backend
- `[Test]` - Тестирование
- `[Refactor]` - Рефакторинг кода

### Приоритизация
- **Критичный**: Блокирует основной функционал
- **Высокий**: Важная функциональность отсутствует
- **Средний**: Улучшения и новые features
- **Низкий**: Nice to have, косметические улучшения

## 🔗 Полезные ссылки

- [GitHub Issues](https://github.com/timeline-studio/issues)
- [Project Board](https://github.com/timeline-studio/projects)
- [Architecture Docs](/docs/ru/03_architecture/)
- [API Reference](/docs/ru/04_api_reference/)

---

> **Примечание**: Этот документ обновляется автоматически при каждом сканировании TODO в проекте. Последнее сканирование: 2025-01-21