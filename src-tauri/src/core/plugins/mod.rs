//! Plugin System для Timeline Studio
//!
//! Система плагинов позволяет расширять функциональность приложения
//! без изменения основного кода.

pub mod api;
pub mod context;
pub mod loader;
pub mod manager;
pub mod permissions;
pub mod plugin;
pub mod sandbox;

pub use manager::PluginManager;
