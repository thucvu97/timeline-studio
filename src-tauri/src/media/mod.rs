// Модуль для работы с медиафайлами
// Экспортируем публичные типы и функции

pub mod ffmpeg;
pub mod files;
pub mod metadata;
pub mod types;

// Реэкспортируем основные типы для удобства использования
pub use files::get_media_files;
pub use metadata::get_media_metadata;
