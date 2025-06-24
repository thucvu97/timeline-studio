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

pub use context::PluginContext;
pub use manager::PluginManager;
pub use permissions::{PluginPermissions, SecurityLevel};
pub use plugin::{
    AppEventType, Plugin, PluginCommand, PluginDependency, PluginMetadata, PluginResponse,
    PluginType, Version,
};
