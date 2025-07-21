# TODO/FIXME Report - Timeline Studio

## Обзор
Данный документ содержит список всех найденных TODO, FIXME, HACK и XXX комментариев в проекте Timeline Studio.

Дата создания: 2025-07-21

## Статистика
- **Общее количество TODO/FIXME**: ~120+ найденных комментариев
- **TypeScript/React код**: ~97 TODO
- **Rust код**: ~50 TODO
- **Документация**: ~46 TODO ссылок

## Категории TODO по функциональности

### 1. Browser & Resources Provider (5 TODO)
**Файл**: `src/features/browser/providers/effects-provider.tsx`
- Строка 330: Реализовать загрузку локальных ресурсов из localStorage/IndexedDB
- Строка 344: Реализовать загрузку удаленных ресурсов
- Строка 358: Реализовать загрузку импортированных ресурсов
- Строка 387: Реализовать предзагрузку категории
- Строка 416: Подсчитать использование памяти

### 2. Person Identification (11 TODO)
**Файл**: `src/features/person-identification/services/person-database-service.ts`
- Строка 180: Реализовать Tauri SQL базу данных
- Строка 556: Реальный расчет сходства (вместо Math.random())
- Строка 579: Конвертировать из DetectedFace
- Строка 622: Вычислить размер хранилища
- Строки 777-789: Реализовать различные операции с персонами

**Файл**: `src/features/person-identification/hooks/use-person-identification.ts`
- Строка 151: Использовать face embedding из detectedFace
- Строка 191: Извлечь thumbnail из detectedFace

### 3. AI Content Intelligence (24 TODO)
**Scene Analysis Engine**:
- Строка 222: Analyze transitions between scenes
- Строка 362: Использовать AI для более точного определения
- Строка 375: Implement real rule of thirds analysis
- Строка 548: Implement real visual feature extraction
- Строка 584: Implement color extraction from keyframes
- Строка 600-603: Implement music detection and calculation
- Строка 643: Интеграция с person-identification service
- Строка 772-773: Get real file size and format
- Строки 936-938: Преобразовать landmarks, определять возраст и пол
- Строки 955-956: Вычислять реальное размытие и перекрытие

**Script Generation Engine**:
- Строка 112: Implement alternative generation
- Строка 310: Определить отношения между персонажами
- Строка 623: Calculate variations
- Строки 680, 691: AI оценка связности и соответствия аудитории

**Multi-Platform Engine**:
- Строка 92: Определять sourceLanguage автоматически

**Vision Service**:
- Строка 957: Реализовать реальный анализ композиции

**Content Classifier**:
- Строки 348, 351: Вычислить из анализа цветов и аудио
- Строка 515: Добавить вторичные классификации

### 4. Timeline Features (18 TODO)
**Timeline Machine**:
- Строка 1776: Implement actual save logic

**Resource Manager**:
- Строки 269-270, 286-287: Implement subtitles and music when added

**Timeline Types**:
- Строки 44, 47: Implement subtitle styles and music tracks

**Speed Ramping**:
- Строка 201: Implement proper bezier interpolation

**Drag & Drop**:
- Строка 159: Get newly created track ID to add media

**Timeline Utils**:
- `timeline-to-project.ts`: 
  - Строка 152: Implement track filters
  - Строка 270: Реализовать преобразование переходов
  - Строка 687: Реализовать полную конвертацию стиля

**Drag Calculations**:
- Строка 44: Implement clip and marker snapping
- Строка 106: Add clips parameter
- Строка 109: Implement overlap detection

**Snap Engine**:
- Строка 217: Fix type issue

**Components**:
- `video-clip.tsx` (41, 50): Копирование и разделение клипа
- `subtitle-clip.tsx` (46, 118, 125): Стили и изменение клипа
- `audio-mixer.tsx` (117): Implement master volume
- `timeline-preview-strip.tsx` (122): Добавить индикатор позиции

### 5. Import/Export Features (10 TODO)
**Style Templates Import**:
- Строка 14: Добавить поддержку форматов bundle, zip, css, aep
- Строка 87: Добавить расширения файлов

**Templates Import**:
- Строка 9: Добавить поддержку форматов
- Строки 38, 62, 70: Обработка импорта

**Effects Import**:
- Строки 138, 244: Сохранить в пользовательскую коллекцию

**Transitions Import**:
- Строки 117, 212: Сохранить в пользовательскую коллекцию

**Media Import**:
- Строки 115, 126: Обновление файлов и thumbnail

### 6. App State & Project Service (6 TODO)
**Файл**: `src/features/app-state/services/timeline-studio-project-service.ts`
- Строки 553, 558, 563: Implement FCPXML, AAF, EDL export
- Строки 568, 573, 578: Implement FCPXML, AAF, EDL import

### 7. Video Player & Selection (5 TODO)
- Строки 24, 34, 38, 47: Реализовать получение файлов из браузера
- Строка 96: Реализовать метод analyzeFrame

### 8. AI Chat Services (5 TODO)
**Whisper Service**:
- Строка 273: Реализовать отслеживание прогресса

**Multimodal Analysis**:
- Строка 272: Реальное время обработки
- Строка 540: Implement cut detection

**Tools**:
- `place-clips.ts` (18): Fix import when available

### 9. Montage Planner (3 TODO)
- `plan-generator.ts`: UUID generation placeholder
- `use-integrated-analysis.ts` (96): Получить processorId из настроек
- `planner-dashboard.tsx` (69, 74): Notifications и export dialog

### 10. Keyboard Shortcuts (1 TODO)
- Строка 76: Добавить обработчики для остальных shortcuts

### 11. Media Studio Hooks (2 TODO)
- `use-auto-load-media.ts` (269): Восстановить функциональность
- `use-auto-load-resources.ts` (285): Восстановить функциональность

## Rust Backend TODO

### 1. Video Compiler (16 TODO)
**Frame Extraction**:
- Строки 372, 377, 396, 403: Implement scene detection and keyframe extraction

**Service Commands**:
- Строка 22: Получить реальный прогресс
- Строка 205: Фильтровать по времени завершения
- Строка 291: Логика перезапуска
- Строка 43: Обновление времени доступа

**Schema Business Logic**:
- Строки 71, 107: Convert parameters

**Renderer**:
- Строки 314, 321: Логика приостановки и возобновления

**Registry**:
- Строка 122: Move misc commands to specialized modules

### 2. Montage Planner Services (12 TODO)
**Audio Analyzer**:
- Строка 115: Implement segment-specific analysis

**Video Processor**:
- Строки 54, 85, 222: Implement actual FFmpeg operations

**Quality Analyzer**:
- Строка 90: Calculate actual exposure

**Composition Analyzer**:
- Строка 146: Implement emotion detection

**Commands**:
- Строки 84, 153, 190: Frame quality, faces separation, progress tracking

### 3. Core Plugins (17 TODO)
**UI Bridge**:
- Строки 82, 156, 188, 233, 298, 330, 369, 426: Интеграция с Tauri API

**Media Bridge**:
- Строки 154, 224: Интеграция с сервисами

**Timeline Bridge**:
- Строки 44, 115, 181, 220, 285, 304: Интеграция с ProjectService

**API**:
- Строка 865: Реализовать через SystemInfoService

### 4. Security & Telemetry (7 TODO)
**Secure Storage**:
- Строки 326, 456: Test implementation

**Telemetry**:
- Строки 186, 225, 306: Prometheus export, OpenTelemetry updates, runtime metrics
- Строка 7: Рефакторинг для изоляции глобального состояния

### 5. Recognition (1 TODO)
**YOLO Processor**:
- Строка 283: Правильно извлечь размерности

### 6. Tests (3 TODO)
- `media/__tests__/processor_test.rs` (38): Добавить тесты после создания моков
- `telemetry_prometheus_tests.rs` (11): Исправить после рефакторинга
- `activity_calculator_deep_tests.rs` (372): Когда будет реализован get_activity_trend

## Критичные TODO для первоочередного решения

### Высокий приоритет:
1. **Person Identification Database** - Требуется для функциональности распознавания лиц
2. **Timeline Save Logic** - Критично для сохранения работы пользователя
3. **FFmpeg Integration** - Необходимо для обработки видео
4. **Import/Export Formats** - Важно для совместимости

### Средний приоритет:
1. **AI Integration** - Улучшит качество анализа
2. **Resource Loading** - Оптимизация производительности
3. **Keyboard Shortcuts** - Улучшит UX
4. **Progress Tracking** - Важно для длительных операций

### Низкий приоритет:
1. **UI Improvements** - Косметические улучшения
2. **Memory Usage Calculation** - Мониторинг
3. **Test Coverage** - Улучшение тестирования

## Рекомендации

1. **Создать отдельные задачи** для каждой категории TODO
2. **Приоритизировать** критичную функциональность
3. **Группировать** связанные TODO в один PR
4. **Добавить тесты** при реализации каждого TODO
5. **Обновлять документацию** после реализации

## Заметки

- Некоторые TODO в тестах отмечают известные баги (FIXME)
- Часть TODO в документации относится к выполненным задачам
- Mock файлы содержат TODO иконку, но это не является задачей