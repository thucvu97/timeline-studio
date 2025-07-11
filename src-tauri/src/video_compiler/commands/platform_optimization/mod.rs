//! Модуль для оптимизации видео под социальные платформы
//!
//! Команды для оптимизации видео под различные платформы:
//! - YouTube, Instagram, TikTok, Facebook, Twitter
//! - Генерация миниатюр
//! - Проверка совместимости
//! - Автоматическая оптимизация под профили платформ

pub mod business_logic;
pub mod commands;
pub mod types;

#[cfg(test)]
mod tests;

// Re-export основных типов и команд
pub use commands::*;
pub use types::*;
