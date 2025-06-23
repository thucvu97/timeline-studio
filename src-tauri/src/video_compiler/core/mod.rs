//! Core - Основные модули Video Compiler
//!
//! Этот модуль содержит основные компоненты системы компиляции видео:
//! - Кэширование и управление ресурсами
//! - Обработка ошибок
//! - Извлечение кадров
//! - Поддержка GPU
//! - Конвейер обработки
//! - Генерация превью
//! - Отслеживание прогресса
//! - Рендеринг видео

pub mod cache;
pub mod error;
pub mod frame_extraction;
pub mod gpu;
pub mod pipeline;
pub mod preview;
pub mod progress;
pub mod renderer;

// Новые модули после рефакторинга
pub mod pipeline_refactored;
pub mod stages;

// Re-export основных типов
