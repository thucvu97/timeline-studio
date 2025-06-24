//! Модуль плагинов

pub mod examples;

// Re-export для удобства
pub use examples::{register_example_plugins, BlurEffectPlugin, YouTubeUploaderPlugin};