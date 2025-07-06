# Smart Montage Planner - Backend Integration

## 🎯 Обзор
Для полноценной работы Smart Montage Planner требуется серьезная доработка backend части с интеграцией FFmpeg и ML моделей.

## 🔧 Требуемые Tauri команды

> **✅ Уже есть**: YOLO интеграция с командами `process_image_with_yolo`, `process_video_file_with_yolo`, `create_yolo_processor` и др.

### 1. Анализ видео качества
```rust
// src-tauri/src/montage_planner/video_analyzer.rs
#[tauri::command]
pub async fn analyze_video_quality(
    video_path: String,
    options: VideoAnalysisOptions,
) -> Result<VideoQualityAnalysis, String> {
    // FFmpeg анализ:
    // - Битрейт, разрешение, FPS
    // - Анализ резкости через фильтры
    // - Детекция стабильности (deshake)
    // - Анализ экспозиции и цветокоррекции
}

#[tauri::command] 
pub async fn analyze_video_motion(
    video_path: String,
    sample_rate: f32,
) -> Result<MotionAnalysis, String> {
    // FFmpeg векторный анализ:
    // - Детекция движения камеры
    // - Анализ движения объектов
    // - Определение направления потока
    // - Расчет пригодности для монтажа
}
```

### 2. Анализ аудио
```rust
// src-tauri/src/montage_planner/audio_analyzer.rs
#[tauri::command]
pub async fn analyze_audio_content(
    audio_path: String, 
    options: AudioAnalysisOptions,
) -> Result<AudioContentAnalysis, String> {
    // FFmpeg + библиотеки анализа:
    // - Детекция речи vs музыка vs тишина
    // - Анализ динамического диапазона
    // - Уровень шума и четкость
    // - Эмоциональный тон (если ML модель)
}

#[tauri::command]
pub async fn extract_beat_markers(
    audio_path: String,
) -> Result<Vec<f32>, String> {
    // Анализ ритма и битов:
    // - Детекция темпа (BPM)
    // - Маркеры ударов
    // - Энергетический профиль
}
```

### 3. Детекция моментов и объектов ✅ (БАЗОВО ЕСТЬ)
```rust
// src-tauri/src/montage_planner/moment_detector.rs
// РАСШИРИТЬ существующие YOLO команды:

#[tauri::command]
pub async fn detect_video_moments_for_montage(
    video_path: String,
    processor_id: String, // Используем существующий YOLO процессор
    threshold: f32,
    categories: Vec<String>,
) -> Result<Vec<DetectedMoment>, String> {
    // Использует существующий process_video_file_with_yolo()
    // + дополнительный анализ для монтажа:
    // - Анализ композиции кадра
    // - Выявление ключевых моментов
    // - Скоринг по критериям
}

#[tauri::command]
pub async fn analyze_scene_transitions(
    video_path: String,
    yolo_processor_id: String, // Интеграция с YOLO
) -> Result<Vec<SceneTransition>, String> {
    // Комбинирует YOLO детекцию с анализом переходов:
    // - Использует process_image_sequence_with_yolo()
    // - Анализ смены сцен
    // - Анализ освещения и типов сцен
}
```

### 4. Генерация и оптимизация планов
```rust
// src-tauri/src/montage_planner/plan_generator.rs
#[tauri::command]
pub async fn generate_montage_plan(
    fragments: Vec<Fragment>,
    preferences: MontagePreferences,
    target_duration: f32,
) -> Result<MontagePlan, String> {
    // Алгоритм генерации:
    // - Оптимизация последовательности
    // - Расчет ритма и пейсинга
    // - Балансировка эмоциональной дуги
    // - Генетический алгоритм оптимизации
}

#[tauri::command]
pub async fn optimize_plan_timing(
    plan: MontagePlan,
    options: OptimizationOptions,
) -> Result<MontagePlan, String> {
    // Оптимизация тайминга:
    // - Синхронизация с музыкой
    // - Сглаживание переходов
    // - Балансировка длительности
}
```

### 5. Применение планов к таймлайну
```rust
// src-tauri/src/montage_planner/timeline_integration.rs
#[tauri::command]
pub async fn apply_montage_plan(
    plan: MontagePlan,
    timeline_id: String,
) -> Result<TimelineState, String> {
    // Интеграция с таймлайном:
    // - Создание клипов и треков
    // - Применение переходов
    // - Настройка эффектов
    // - Синхронизация с проектом
}

#[tauri::command]
pub async fn preview_montage_plan(
    plan: MontagePlan,
) -> Result<PreviewData, String> {
    // Генерация превью:
    // - Создание быстрого превью
    // - Экстракция ключевых кадров
    // - Мини-превью последовательности
}
```

## 🗂️ Структура файлов backend

```
src-tauri/src/montage_planner/
├── mod.rs                    # Модуль экспорт
├── commands.rs              # Регистрация команд
├── types.rs                 # Rust типы
├── services/
│   ├── video_analyzer.rs    # Анализ видео
│   ├── audio_analyzer.rs    # Анализ аудио  
│   ├── moment_detector.rs   # Детекция моментов
│   ├── plan_generator.rs    # Генерация планов
│   └── timeline_integration.rs # Интеграция с таймлайном
├── algorithms/
│   ├── quality_metrics.rs   # Метрики качества
│   ├── rhythm_analysis.rs   # Анализ ритма
│   ├── genetic_optimizer.rs # Генетический алгоритм
│   └── emotion_detector.rs  # Детекция эмоций
├── ml_models/
│   ├── yolo_integration.rs  # Интеграция YOLO
│   ├── audio_classifier.rs # Классификация аудио
│   └── scene_classifier.rs # Классификация сцен
└── tests/
    ├── video_analysis_tests.rs
    ├── plan_generation_tests.rs
    └── integration_tests.rs
```

## 🔗 Интеграция с существующими модулями

### 1. Recognition Module ✅ (УЖЕ ИНТЕГРИРОВАН)
```rust
// Используем существующие YOLO команды
use crate::recognition::commands::yolo_commands::*;
use crate::recognition::yolo_processor_refactored::YoloProcessor;

impl MomentDetector {
    pub async fn detect_objects_for_montage(
        &self,
        video_path: &str,
        processor_id: &str,
    ) -> Result<Vec<DetectedMoment>, String> {
        // Используем существующую команду process_video_file_with_yolo()
        // + дополнительный анализ для монтажа
        let yolo_results = process_video_file_with_yolo(
            processor_id.to_string(),
            video_path.to_string(),
            // state передается через DI
        ).await?;
        
        // Конвертируем YOLO результаты в момент анализ
        self.analyze_yolo_results_for_montage(yolo_results).await
    }
}
```

### 2. Media Module
```rust
// Использование FFmpeg обертки
use crate::media::{MediaAnalyzer, FFmpegWrapper};

impl VideoAnalyzer {
    pub async fn extract_metadata(
        &self,
        video_path: &str,
    ) -> Result<VideoMetadata, String> {
        // Интеграция с media/media_analyzer.rs
        let analyzer = MediaAnalyzer::new();
        analyzer.analyze_file(video_path).await
    }
}
```

### 3. Video Compiler
```rust
// Использование FFmpeg билдера
use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;

impl PreviewGenerator {
    pub async fn create_montage_preview(
        &self,
        plan: &MontagePlan,
    ) -> Result<String, String> {
        // Интеграция с video_compiler
        let builder = FFmpegBuilder::new();
        // Создание быстрого превью монтажа
    }
}
```

## 🤖 Требуемые ML модели

### 1. Расширение существующего YOLO ✅
> **Уже есть**: YoloV11Detection, YoloV8Detection, YoloV11Face, YoloV8Face, Segmentation модели

**Нужно добавить**:
- **Композиция анализатор**: Расширение обработки результатов YOLO для анализа правила третей, баланса
- **Эмоции анализатор**: Дополнительная обработка YoloV11Face результатов для эмоций
- **Активность калькулятор**: Анализ движения объектов между кадрами

### 2. Аудио классификация
- **Речь vs Музыка**: Классификатор типа аудио
- **Эмоциональный тон**: Анализ настроения в речи/музыке
- **Детекция битов**: ML модель для ритм-анализа

### 3. Сцена классификация
- **Тип сцены**: Интерьер/экстерьер/природа/город
- **Освещение**: Яркое/тусклое/естественное/искусственное
- **Время суток**: День/ночь/рассвет/закат

## ⚡ Алгоритмы оптимизации

### 1. Генетический алгоритм
```rust
// src-tauri/src/montage_planner/algorithms/genetic_optimizer.rs
pub struct GeneticOptimizer {
    population_size: usize,
    mutation_rate: f32,
    crossover_rate: f32,
}

impl GeneticOptimizer {
    pub fn optimize_sequence(
        &self,
        fragments: &[Fragment],
        target_duration: f32,
        fitness_function: Box<dyn Fn(&MontagePlan) -> f32>,
    ) -> Result<MontagePlan, String> {
        // Генетический алгоритм для оптимизации:
        // 1. Создание начальной популяции планов
        // 2. Оценка fitness каждого плана
        // 3. Селекция лучших
        // 4. Кроссовер и мутация
        // 5. Повторение до конвергенции
    }
}
```

### 2. Ритм-анализ
```rust
// src-tauri/src/montage_planner/algorithms/rhythm_analysis.rs
pub struct RhythmAnalyzer {
    pub fn calculate_optimal_cuts(
        &self,
        audio_beats: &[f32],
        video_moments: &[DetectedMoment],
        style: MontageStyle,
    ) -> Vec<CutPoint> {
        // Алгоритм синхронизации:
        // 1. Анализ музыкальных битов
        // 2. Поиск визуальных пиков
        // 3. Оптимизация точек монтажа
        // 4. Создание ритмичной последовательности
    }
}
```

## 📊 Производительность

### Требования:
- **Анализ 1 часа видео**: < 5 минут
- **Генерация плана**: < 30 секунд  
- **Применение к таймлайну**: < 10 секунд
- **Превью генерация**: < 2 минут

### Оптимизации:
- Параллельная обработка кадров
- Кэширование анализа
- Использование GPU для ML
- Прогрессивная загрузка результатов

## 🔧 План реализации

### Фаза 1: Базовый анализ (2-3 недели)
1. ✅ Интеграция с FFmpeg для качества видео
2. ✅ Базовый анализ аудио
3. ✅ Простая детекция моментов
4. ✅ Применение к таймлайну

### Фаза 2: ML интеграция (3-4 недели)  
1. ✅ Расширение YOLO для эмоций
2. ✅ Аудио классификация
3. ✅ Сцена анализ
4. ✅ Композиция анализ

### Фаза 3: Оптимизация (2-3 недели)
1. ✅ Генетический алгоритм
2. ✅ Ритм синхронизация  
3. ✅ Производительность
4. ✅ Кэширование и превью

## 🎯 Готовность к реализации

**Текущий статус**: 
- Frontend готов (90%) ✅
- Recognition/YOLO модуль готов (100%) ✅
- Backend Smart Montage требует реализации (15% готово за счет YOLO)

**Критические зависимости**:
- Существующий recognition модуль ✅ (ПОЛНОСТЬЮ ГОТОВ)
- YOLO интеграция ✅ (12 команд уже реализованы)
- FFmpeg интеграция ✅ 
- Video compiler ✅
- Media analyzer ✅

**Пересмотренная оценка трудозатрат**: 4-6 недель (вместо 7-10) благодаря готовой YOLO интеграции

---

*Создано 06.01.2025 - План backend интеграции для Smart Montage Planner*