//! Команды для работы с Whisper API
//!
//! Поддерживает транскрипцию и перевод через OpenAI Whisper API,
//! а также работу с локальными моделями whisper.cpp

// ============ Экспорт публичных типов ============
pub use business_logic::*;
pub use commands::*;
pub use types::*;

// ============ Модули ============
mod business_logic;
mod commands;
mod types;

#[cfg(test)]
mod tests;
