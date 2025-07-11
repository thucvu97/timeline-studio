//! Тесты для модуля media
//!
//! Организованы по категориям:
//! - tests.rs - основные unit тесты
//! - processor_test.rs - тесты процессора медиафайлов
//! - real_data_tests.rs - интеграционные тесты с реальными файлами
//! - test_data.rs - тестовые данные и константы
//! - test_ffmpeg_mock.rs - моки для FFmpeg

#[cfg(test)]
mod tests;

#[cfg(test)]
mod processor_test;

#[cfg(test)]
mod real_data_tests;

#[cfg(test)]
pub mod test_data;

#[cfg(test)]
mod test_ffmpeg_mock;
