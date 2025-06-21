# Рефакторинг бэкенда

## Статус: В процессе

## Описание

Рефакторинг структуры Rust-бэкенда для улучшения поддерживаемости, тестируемости и производительности.

## Проблемы

1. **Очень большие файлы** (3000+ строк):
   - `ffmpeg_builder.rs` (3746 строк) - построение FFmpeg команд
   - `schema.rs` (2183 строк) - определения схемы проекта
   - `commands.rs` файлы с 57+ Tauri командами

2. **Проблемы с организацией тестов**:
   - Тесты разбросаны по множеству файлов
   - Сложности с запуском тестов команд из-за зависимостей Tauri
   - Смешение unit-тестов, интеграционных тестов и тестов с реальными данными

3. **Структура модулей**:
   - Большие модули с множеством обязанностей
   - Сильная связанность между компонентами

## План рефакторинга

### 1. Разбиение больших файлов

#### ffmpeg_builder.rs → модульная структура:
- `ffmpeg_builder/mod.rs` - основная логика построителя
- `ffmpeg_builder/filters.rs` - построение фильтров
- `ffmpeg_builder/inputs.rs` - обработка входных данных
- `ffmpeg_builder/outputs.rs` - конфигурация выходных данных
- `ffmpeg_builder/effects.rs` - обработка эффектов

#### schema.rs → доменные модули:
- `schema/project.rs` - метаданные проекта
- `schema/timeline.rs` - таймлайн, треки, клипы
- `schema/effects.rs` - эффекты, фильтры, переходы
- `schema/export.rs` - настройки экспорта

#### commands.rs → группировка по функциональности:
- `commands/rendering.rs` - операции рендеринга
- `commands/cache.rs` - управление кэшем
- `commands/gpu.rs` - GPU операции
- `commands/project.rs` - управление проектами

### 2. Улучшение структуры тестов
- Создание `tests/` директории в корне крейта для интеграционных тестов
- Перенос unit-тестов рядом с реализацией
- Создание тестовых фикстур и утилит
- Мокирование Tauri зависимостей для тестирования команд

### 3. Снижение связанности модулей
- Извлечение интерфейсов/трейтов для зависимостей
- Использование dependency injection для сервисов
- Создание сервисного слоя между командами и бизнес-логикой
- Реализация обработчиков команд, делегирующих работу сервисам

### 4. Конкретные улучшения
- Извлечение FFmpeg операций в сервис
- Создание builder pattern для сложных операций
- Добавление слоя валидации для схем
- Реализация правильных границ ошибок
- Добавление логирования/трассировки

## Прогресс

- [x] Создание модульной структуры ffmpeg_builder
  - Создана модульная структура с разделением на: builder, filters, inputs, outputs, effects, subtitles, templates
  - Сохранена обратная совместимость через переходный файл
- [x] Разбиение schema.rs на доменные модули
  - Создана полная структура модулей: project, timeline, effects, templates, subtitles, export, common
  - Все типы разделены по соответствующим модулям
  - Добавлена поддержка обратной совместимости для старых полей
  - Исправлены ошибки в error.rs (добавлены TemplateNotFound и InvalidParameter)
- [x] Реорганизация commands.rs по функциональным группам
  - Создана модульная структура: rendering, cache, gpu, info, preview, project, settings, state
  - Все 57 команд распределены по соответствующим модулям:
    - rendering.rs: compile_video, cancel_render, get_active_render_jobs, pause_render, resume_render, export_with_preset
    - cache.rs: clear_render_cache, clear_project_cache, get_cache_size, get_cache_stats, optimize_cache и др.
    - gpu.rs: detect_gpus, get_gpu_capabilities, check_hardware_acceleration_support, benchmark_gpu и др.
    - info.rs: get_ffmpeg_version, get_supported_formats, get_system_info, get_performance_stats и др.
    - preview.rs: generate_frame_preview, generate_video_thumbnails, generate_storyboard, generate_waveform_preview и др.
    - project.rs: validate_project_schema, analyze_project, merge_projects, split_project, add_subtitles_to_project и др.
    - settings.rs: get_compiler_settings, update_compiler_settings, set_ffmpeg_path, apply_quality_preset и др.
    - state.rs: основные типы состояния (VideoCompilerState, RenderJob, ActiveRenderJob)
- [ ] Создание правильной структуры тестов
- [ ] Извлечение сервисного слоя для команд
- [ ] Исправление оставшихся ошибок компиляции в ffmpeg_builder

## Обнаруженные проблемы

1. **Несоответствие схемы**: Текущая схема значительно изменилась по сравнению с ожидаемой в командах:
   - Timeline больше не содержит tracks и subtitles - они перемещены в ProjectSchema
   - Изменены поля в Clip (нет timeline_start, duration, audio_volume)
   - ClipSource должен быть импортирован из timeline, а не schema
   - Изменена структура эффектов (parameters теперь HashMap, а не Vec)
   - Отсутствуют некоторые типы (Resolution, StyleElement)
   - Изменены enum варианты

2. **Отсутствующие зависимости**: Нужно добавить в Cargo.toml:
   - num_cpus - для определения количества CPU
   - sys_info - для системной информации
   - os_info - для информации об ОС

3. **Несоответствие API модулей**:
   - PreviewGenerator не имеет методов generate_frame, generate_thumbnails и др.
   - RenderCache не имеет методов clear, clear_project, get_size и др.
   - GpuDetector не имеет методов detect_gpus, get_capabilities и др.
   - VideoRenderer не имеет методов get_status, pause, resume
   - CompilerSettings имеет другие поля

4. **Проблемы с тестами команд**: Невозможно протестировать Tauri команды из-за зависимостей от Tauri runtime

5. **Рекомендации для дальнейшей работы**:
   - Исправить импорты и обращения к полям схемы в командах
   - Добавить недостающие зависимости
   - Обновить или создать заглушки для отсутствующих методов
   - Создать абстракции для Tauri команд для улучшения тестируемости
   - Рассмотреть использование feature flags для разделения Tauri-зависимого кода

## Результаты

- Улучшенная поддерживаемость кода
- Более простое тестирование
- Лучшая организация кода
- Снижение связанности между компонентами
- Улучшенная производительность компиляции