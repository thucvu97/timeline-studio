//! Commands - Модульная структура Tauri команд для Video Compiler
//!
//! Команды разделены на следующие модули:
//! - `rendering` - Команды рендеринга и компиляции видео
//! - `cache` - Команды управления кэшем
//! - `gpu` - Команды работы с GPU и аппаратным ускорением
//! - `project` - Команды управления проектами
//! - `preview` - Команды генерации превью
//! - `settings` - Команды настроек компилятора
//! - `info` - Команды получения информации о системе и ресурсах
//! - `misc` - Дополнительные команды

pub mod advanced_metrics;
pub mod cache;
pub mod gpu;
pub mod info;
pub mod metrics;
pub mod misc;
pub mod preview;
pub mod project;
pub mod rendering;
pub mod settings;
pub mod state;
pub mod tests_helpers;

// Re-export всех команд для удобства использования
pub use advanced_metrics::*;
pub use cache::*;
pub use gpu::*;
pub use info::*;
pub use metrics::*;
pub use misc::*;
pub use preview::*;
pub use project::*;
pub use rendering::*;
pub use settings::*;
pub use tests_helpers::*;

// Re-export основных типов
pub use state::VideoCompilerState;

#[cfg(test)]
mod tests;
