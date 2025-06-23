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
//! - `schema_commands` - Команды работы со схемой проекта
//! - `prerender_commands` - Команды предрендеринга
//! - `frame_extraction_commands` - Команды извлечения кадров
//! - `misc` - Дополнительные команды

pub mod advanced_metrics;
pub mod batch_commands;
pub mod cache;
pub mod ffmpeg_advanced;
pub mod frame_extraction_commands;
pub mod gpu;
pub mod info;
pub mod metrics;
pub mod misc;
pub mod multimodal_commands;
pub mod prerender_commands;
pub mod preview;
pub mod project;
pub mod rendering;
pub mod schema_commands;
pub mod service_commands;
pub mod settings;
pub mod state;
pub mod test_helper_commands;
pub mod tests_helpers;
pub mod video_analysis;
pub mod whisper_commands;

// Re-export всех команд для удобства использования
pub use advanced_metrics::*;
pub use batch_commands::*;
pub use cache::*;
#[allow(unused_imports)]
pub use ffmpeg_advanced::*;
pub use frame_extraction_commands::*;
pub use gpu::*;
pub use info::*;
pub use misc::*;
pub use multimodal_commands::*;
pub use prerender_commands::*;
pub use preview::*;
pub use project::*;
pub use rendering::*;
pub use schema_commands::*;
pub use settings::*;
pub use test_helper_commands::*;
// Video analysis commands
pub use video_analysis::*;
pub use whisper_commands::*;

// Re-export основных типов
pub use state::VideoCompilerState;

#[cfg(test)]
mod tests;
