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
pub mod compiler_settings_commands;
pub mod ffmpeg_advanced;
pub mod ffmpeg_builder_advanced_commands;
pub mod ffmpeg_builder_commands;
pub mod ffmpeg_builder_extra_commands;
pub mod ffmpeg_executor_commands;
pub mod ffmpeg_utilities_commands;
pub mod final_utilities_commands;
pub mod frame_extraction_advanced_commands;
pub mod frame_extraction_commands;
pub mod frame_manager_commands;
pub mod gpu;
pub mod info;
pub mod metrics;
pub mod metrics_advanced_commands;
pub mod misc;
pub mod monitoring_commands;
pub mod multimodal_commands;
pub mod pipeline_advanced_commands;
pub mod pipeline_commands;
pub mod platform_optimization_commands;
pub mod prerender_commands;
pub mod preview;
pub mod preview_advanced_commands;
pub mod progress_tracker_commands;
pub mod project;
pub mod recognition_advanced_commands;
pub mod remaining_utilities_commands;
pub mod rendering;
pub mod schema_commands;
pub mod security_advanced_commands;
pub mod service_commands;
pub mod service_container_commands;
pub mod settings;
pub mod state;
pub mod test_helper_commands;
pub mod tests_helpers;
pub mod timeline_schema_commands;
pub mod video_analysis;
pub mod whisper_commands;
pub mod workflow_commands;

// Re-export всех команд для удобства использования
pub use advanced_metrics::*;
pub use batch_commands::*;
pub use cache::*;
pub use compiler_settings_commands::*;
#[allow(unused_imports)]
pub use ffmpeg_advanced::*;
pub use ffmpeg_builder_advanced_commands::*;
pub use ffmpeg_builder_commands::*;
pub use ffmpeg_builder_extra_commands::*;
pub use ffmpeg_executor_commands::*;
pub use ffmpeg_utilities_commands::*;
pub use final_utilities_commands::*;
#[allow(ambiguous_glob_reexports)]
pub use frame_extraction_advanced_commands::*;
pub use frame_extraction_commands::*;
#[allow(ambiguous_glob_reexports)]
pub use frame_manager_commands::*;
pub use gpu::*;
pub use info::*;
pub use metrics::*;

#[allow(ambiguous_glob_reexports)]
pub use metrics_advanced_commands::*;
pub use misc::*;
#[allow(ambiguous_glob_reexports)]
pub use monitoring_commands::*;
pub use multimodal_commands::*;
pub use pipeline_advanced_commands::*;
pub use pipeline_commands::*;
pub use platform_optimization_commands::*;
pub use prerender_commands::*;
pub use preview::*;
pub use preview_advanced_commands::*;
pub use progress_tracker_commands::*;
pub use project::*;
pub use recognition_advanced_commands::*;
pub use remaining_utilities_commands::*;
pub use rendering::*;
pub use schema_commands::*;
pub use security_advanced_commands::*;
pub use service_commands::*;
pub use service_container_commands::*;
pub use settings::*;
pub use test_helper_commands::*;
pub use tests_helpers::*;
pub use timeline_schema_commands::*;
// Video analysis commands
pub use video_analysis::*;
pub use whisper_commands::*;
pub use workflow_commands::*;

// Re-export основных типов
pub use state::VideoCompilerState;

#[cfg(test)]
mod tests;
