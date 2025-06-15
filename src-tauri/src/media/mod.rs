// Модуль для работы с медиафайлами
// Экспортируем публичные типы и функции

pub mod commands;
pub mod ffmpeg;
pub mod files;
pub mod metadata;
pub mod preview_data;
pub mod preview_manager;
pub mod processor;
pub mod thumbnail;
pub mod types;

// Реэкспортируем основные типы для удобства использования
pub use files::get_media_files;
pub use metadata::get_media_metadata;
pub use processor::{MediaProcessor, ThumbnailOptions};

#[cfg(test)]
mod tests;

#[cfg(test)]
mod processor_test;

#[cfg(test)]
pub mod test_data;

#[cfg(test)]
mod real_data_tests;
